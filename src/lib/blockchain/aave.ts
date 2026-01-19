import { encodeFunctionData, type Address } from 'viem';
import { LoanOption } from '@/types';
import { db } from '@/lib/db';
import { getTokenPrice } from './prices';
import {
  calculateMonthlyPayment,
  calculateHealthFactor,
  calculateLiquidationPrice,
} from '@/lib/utils/calculations';

// Aave V3 Pool ABI (minimal)
export const AAVE_POOL_ABI = [
  {
    name: 'supply',
    type: 'function',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' },
    ],
    outputs: [],
  },
  {
    name: 'borrow',
    type: 'function',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRateMode', type: 'uint256' },
      { name: 'referralCode', type: 'uint16' },
      { name: 'onBehalfOf', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'getUserAccountData',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalCollateralBase', type: 'uint256' },
      { name: 'totalDebtBase', type: 'uint256' },
      { name: 'availableBorrowsBase', type: 'uint256' },
      { name: 'currentLiquidationThreshold', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' },
    ],
  },
] as const;

// ERC20 ABI (minimal)
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

// Token addresses on Base
const TOKEN_ADDRESSES: Record<string, Address> = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  WETH: '0x4200000000000000000000000000000000000006',
  cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
};

// LoanFi Aave Referral Code
// Register at: https://governance.aave.com/ to get your own code
// This earns you a % of protocol fees from loans originated through LoanFi
// Set to 0 until you register, then update with your assigned code
export const LOANFI_REFERRAL_CODE = 0; // TODO: Replace with registered referral code

/**
 * Generate loan options for given parameters
 */
export async function generateLoanOptions(
  borrowAmount: number,
  borrowToken: string,
  collateralToken: string,
  collateralAmount: number
): Promise<LoanOption[]> {
  const pools = db.pools.list('base');
  const options: LoanOption[] = [];

  // Get collateral price
  const collateralPrice = await getTokenPrice(collateralToken);
  const collateralValueUSD = collateralAmount * collateralPrice.priceUSD;

  const terms = [3, 6, 8, 12]; // months

  for (const pool of pools) {
    // Check if pool supports the tokens
    if (!pool.supportedCollateral.includes(collateralToken)) continue;
    if (!pool.supportedBorrow.includes(borrowToken)) continue;

    for (const months of terms) {
      // Longer terms have slightly higher APR
      const termAdjustment = 1 + (months - 3) * 0.005;
      const effectiveAPR = pool.borrowAPR * termAdjustment;

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
