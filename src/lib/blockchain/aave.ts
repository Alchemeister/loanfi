import { encodeFunctionData, parseAbi, formatUnits, type Address } from 'viem';
import { LoanOption } from '@/types';
import { db } from '@/lib/db';
import { getTokenPrice } from './prices';
import { createPublicClientForChain } from './client';
import { config } from '@/lib/config/env';
import {
  calculateMonthlyPayment,
  calculateHealthFactor,
  calculateLiquidationPrice,
} from '@/lib/utils/calculations';

// Aave V3 Pool ABI
export const AAVE_POOL_ABI = parseAbi([
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external',
  'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  'function getReserveData(address asset) view returns (uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 liquidityRate, uint128 variableBorrowRate, uint128 stableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury)',
]);

// ERC20 ABI
export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]);

// Aave V3 Pool Addresses (the actual Pool contract, not the Provider)
const AAVE_POOL_ADDRESSES: Record<string, Address> = {
  base: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
  arbitrum: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  ethereum: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  polygon: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  optimism: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
};

// Token addresses on Base
const TOKEN_ADDRESSES: Record<string, Address> = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // Fixed: was same as DAI
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  WETH: '0x4200000000000000000000000000000000000006',
  ETH: '0x4200000000000000000000000000000000000006', // WETH on Base
  WBTC: '0x1ceA5F5C31664024eeF706FeC2E74E5298Ca60e1', // cbBTC on Base
  cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
};

// Aave Referral Code - set in env
export const LOANFI_REFERRAL_CODE = config.aaveReferralCode;

/**
 * Get Aave Pool address for a chain
 */
export function getAavePoolAddress(chainName: string): Address | undefined {
  return AAVE_POOL_ADDRESSES[chainName];
}

/**
 * Get current borrow APR from Aave for a specific asset
 */
export async function getAaveBorrowAPR(
  chainName: string,
  assetAddress: Address
): Promise<number> {
  // Use mock data in development if configured
  if (config.mockBlockchain) {
    return 0.042; // 4.2% mock rate
  }

  try {
    const client = createPublicClientForChain(chainName);
    const poolAddress = getAavePoolAddress(chainName);
    
    if (!poolAddress) {
      console.warn(`No Aave pool address for chain: ${chainName}`);
      return 0.042;
    }

    // Call getReserveData on the POOL contract (not the provider)
    const reserveData = await client.readContract({
      address: poolAddress,
      abi: AAVE_POOL_ABI,
      functionName: 'getReserveData',
      args: [assetAddress],
    });

    // variableBorrowRate is at index 4 (uint128)
    const variableBorrowRate = reserveData[4];
    
    // Convert from ray (27 decimals) to APR
    const rateInRay = Number(variableBorrowRate);
    const apr = rateInRay / 1e27;
    
    return apr > 0 ? apr : 0.042; // Fallback if rate is 0
  } catch (error) {
    console.error(`Failed to get Aave borrow APR for ${assetAddress}:`, error);
    // Return reasonable fallback
    return 0.042;
  }
}

/**
 * Get user's Aave account data
 */
export async function getUserAaveData(
  chainName: string,
  userAddress: Address
): Promise<{
  totalCollateralUSD: number;
  totalDebtUSD: number;
  availableBorrowsUSD: number;
  currentLiquidationThreshold: number;
  ltv: number;
  healthFactor: number;
} | null> {
  if (config.mockBlockchain) {
    return {
      totalCollateralUSD: 10000,
      totalDebtUSD: 5000,
      availableBorrowsUSD: 3000,
      currentLiquidationThreshold: 0.8,
      ltv: 0.75,
      healthFactor: 1.6,
    };
  }

  try {
    const client = createPublicClientForChain(chainName);
    const poolAddress = getAavePoolAddress(chainName);
    
    if (!poolAddress) return null;

    const data = await client.readContract({
      address: poolAddress,
      abi: AAVE_POOL_ABI,
      functionName: 'getUserAccountData',
      args: [userAddress],
    });

    // All values are in base currency (USD) with 8 decimals
    const decimals = 8;
    
    return {
      totalCollateralUSD: Number(formatUnits(data[0], decimals)),
      totalDebtUSD: Number(formatUnits(data[1], decimals)),
      availableBorrowsUSD: Number(formatUnits(data[2], decimals)),
      currentLiquidationThreshold: Number(data[3]) / 10000, // Basis points to decimal
      ltv: Number(data[4]) / 10000, // Basis points to decimal
      healthFactor: Number(formatUnits(data[5], 18)), // Health factor has 18 decimals
    };
  } catch (error) {
    console.error(`Failed to get user Aave data for ${userAddress}:`, error);
    return null;
  }
}

/**
 * Calculate required collateral amount for a loan
 */
export async function calculateRequiredCollateral(
  borrowAmountUSD: number,
  collateralToken: string,
  minCollateralRatio: number,
  chainName: string = 'base'
): Promise<{ amount: number; valueUSD: number }> {
  // Required collateral value = borrow amount * collateral ratio
  const requiredValueUSD = borrowAmountUSD * minCollateralRatio;
  
  // Get collateral token price
  const price = await getTokenPrice(collateralToken, chainName);
  
  // Calculate token amount needed
  const requiredAmount = requiredValueUSD / price.priceUSD;
  
  return {
    amount: requiredAmount,
    valueUSD: requiredValueUSD,
  };
}

/**
 * Check if user has sufficient balance
 */
export async function checkSufficientBalance(
  chainName: string,
  tokenAddress: Address,
  userAddress: Address,
  requiredAmount: bigint
): Promise<{ sufficient: boolean; balance: bigint; deficit: bigint }> {
  try {
    const client = createPublicClientForChain(chainName);
    const balance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });
    
    const sufficient = balance >= requiredAmount;
    const deficit = sufficient ? BigInt(0) : requiredAmount - balance;
    
    return { sufficient, balance, deficit };
  } catch (error) {
    console.error(`Failed to check balance for ${userAddress}:`, error);
    return { sufficient: false, balance: BigInt(0), deficit: requiredAmount };
  }
}

/**
 * Generate loan options for given parameters
 */
export async function generateLoanOptions(
  borrowAmount: number,
  borrowToken: string,
  collateralToken: string,
  collateralAmount: number,
  chainName: string = 'base'
): Promise<LoanOption[]> {
  const pools = db.pools.list(chainName);
  const options: LoanOption[] = [];

  // Get collateral price
  const collateralPrice = await getTokenPrice(collateralToken, chainName);
  const collateralValueUSD = collateralAmount * collateralPrice.priceUSD;

  const terms = [3, 6, 8, 12]; // months

  for (const pool of pools) {
    // Check if pool supports the tokens
    if (!pool.supportedCollateral.includes(collateralToken)) continue;
    if (!pool.supportedBorrow.includes(borrowToken)) continue;

    // Get real-time APR for Aave
    let borrowAPR = pool.borrowAPR;
    if (pool.protocol === 'aave' && !config.mockBlockchain) {
      const borrowTokenAddress = getTokenAddress(borrowToken);
      if (borrowTokenAddress) {
        borrowAPR = await getAaveBorrowAPR(chainName, borrowTokenAddress);
      }
    }

    for (const months of terms) {
      // Longer terms have slightly higher APR
      const termAdjustment = 1 + (months - 3) * 0.005;
      const effectiveAPR = borrowAPR * termAdjustment;

      const monthlyPayment = calculateMonthlyPayment(borrowAmount, effectiveAPR, months);
      const healthFactor = calculateHealthFactor(
        collateralValueUSD,
        borrowAmount,
        pool.liquidationThreshold
      );
      const liquidationPrice = calculateLiquidationPrice(
        collateralAmount,
        borrowAmount,
        pool.liquidationThreshold
      );

      // Skip if health factor is too low
      if (healthFactor < 1.2) continue;

      options.push({
        id: `${pool.id}-${months}mo`,
        pool,
        borrowAmount,
        borrowToken,
        termMonths: months,
        apr: effectiveAPR,
        monthlyPayment,
        totalRepayment: monthlyPayment * months,
        collateralToken,
        collateralAmount,
        collateralValueUSD,
        healthFactor,
        liquidationPrice,
      });
    }
  }

  // Sort by monthly payment (lowest first)
  return options.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
}

/**
 * Build transaction data for borrow + pay
 */
export function buildBorrowAndPayTransaction(params: {
  poolAddress: Address;
  collateralToken: Address;
  collateralAmount: bigint;
  borrowToken: Address;
  borrowAmount: bigint;
  borrower: Address;
  recipient: Address;
}): {
  approveCollateral: { to: Address; data: `0x${string}` };
  supplyCollateral: { to: Address; data: `0x${string}` };
  borrow: { to: Address; data: `0x${string}` };
  transferToMerchant: { to: Address; data: `0x${string}` };
} {
  // 1. Approve collateral spend
  const approveCollateral = {
    to: params.collateralToken,
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [params.poolAddress, params.collateralAmount],
    }),
  };

  // 2. Supply collateral to pool (with LoanFi referral code for revenue share)
  const supplyCollateral = {
    to: params.poolAddress,
    data: encodeFunctionData({
      abi: AAVE_POOL_ABI,
      functionName: 'supply',
      args: [params.collateralToken, params.collateralAmount, params.borrower, LOANFI_REFERRAL_CODE],
    }),
  };

  // 3. Borrow from pool (interestRateMode: 2 = variable, with referral code)
  const borrow = {
    to: params.poolAddress,
    data: encodeFunctionData({
      abi: AAVE_POOL_ABI,
      functionName: 'borrow',
      args: [params.borrowToken, params.borrowAmount, BigInt(2), LOANFI_REFERRAL_CODE, params.borrower],
    }),
  };

  // 4. Transfer borrowed funds to merchant
  const transferToMerchant = {
    to: params.borrowToken,
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [params.recipient, params.borrowAmount],
    }),
  };

  return {
    approveCollateral,
    supplyCollateral,
    borrow,
    transferToMerchant,
  };
}

/**
 * Get token address by symbol
 */
export function getTokenAddress(symbol: string): Address | undefined {
  return TOKEN_ADDRESSES[symbol.toUpperCase()];
}

/**
 * Get token decimals
 */
export async function getTokenDecimals(
  chainName: string,
  tokenAddress: Address
): Promise<number> {
  // Check known tokens first
  const knownDecimals: Record<string, number> = {
    [TOKEN_ADDRESSES.USDC]: 6,
    [TOKEN_ADDRESSES.USDT]: 6,
    [TOKEN_ADDRESSES.DAI]: 18,
    [TOKEN_ADDRESSES.WETH]: 18,
    [TOKEN_ADDRESSES.cbETH]: 18,
  };
  
  if (knownDecimals[tokenAddress]) {
    return knownDecimals[tokenAddress];
  }

  if (config.mockBlockchain) {
    return 18;
  }

  try {
    const client = createPublicClientForChain(chainName);
    const decimals = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });
    return decimals;
  } catch (error) {
    console.error(`Failed to get decimals for ${tokenAddress}:`, error);
    return 18; // Default to 18
  }
}

/**
 * Get token balance
 */
export async function getTokenBalance(
  chainName: string,
  tokenAddress: Address,
  userAddress: Address
): Promise<bigint> {
  if (config.mockBlockchain) {
    return BigInt(1000000000000000000); // 1 ETH mock balance
  }

  try {
    const client = createPublicClientForChain(chainName);
    const balance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });
    return balance;
  } catch (error) {
    console.error(`Failed to get balance for ${userAddress}:`, error);
    return BigInt(0);
  }
}
