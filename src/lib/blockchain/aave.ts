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

// Aave V3 Pool ABI (extended for real calls)
export const AAVE_POOL_ABI = parseAbi([
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external',
  'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  'function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 variableBorrowIndex, uint128 currentLiquidityRate, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury))',
]);

// ERC20 ABI
export const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]);

// Aave Pool Addresses Provider (to get current pool address)
const AAVE_ADDRESSES_PROVIDER: Record<string, Address> = {
  base: '0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D',
  arbitrum: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
  ethereum: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
  polygon: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
  optimism: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
};

// Token addresses on Base
const TOKEN_ADDRESSES: Record<string, Address> = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  USDT: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // Note: This might need updating
  WETH: '0x4200000000000000000000000000000000000006',
  ETH: '0x4200000000000000000000000000000000000006', // WETH on Base
  WBTC: '0x1ceA5F5C31664024eeF706FeC2E74E5298Ca60e1', // cbBTC on Base
  cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
};

// Aave Referral Code - set in env
export const LOANFI_REFERRAL_CODE = config.aaveReferralCode;

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
    const poolAddress = AAVE_ADDRESSES_PROVIDER[chainName];
    
    if (!poolAddress) {
      throw new Error(`No Aave pool for chain: ${chainName}`);
    }

    // Call getReserveData to get currentVariableBorrowRate
    const reserveData = await client.readContract({
      address: poolAddress,
      abi: AAVE_POOL_ABI,
      functionName: 'getReserveData',
      args: [assetAddress],
    });

    // currentVariableBorrowRate is at index 4 (uint128)
    const variableBorrowRate = reserveData[4];
    
    // Convert from ray (27 decimals) to APR
    // Aave stores rates as ray (10^27)
    const rateInRay = Number(variableBorrowRate);
    const apr = rateInRay / 1e27;
    
    return apr;
  } catch (error) {
    console.error(`Failed to get Aave borrow APR for ${assetAddress}:`, error);
    // Return mock rate as fallback
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
    const poolAddress = AAVE_ADDRESSES_PROVIDER[chainName];
    
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
  if (config.mockBlockchain) {
    // Common decimals
    if (tokenAddress === TOKEN_ADDRESSES.USDC) return 6;
    if (tokenAddress === TOKEN_ADDRESSES.USDT) return 6;
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
