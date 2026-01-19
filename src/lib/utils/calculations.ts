/**
 * Calculate monthly payment using amortization formula
 */
export function calculateMonthlyPayment(
  principal: number,
  aprDecimal: number,
  months: number
): number {
  const monthlyRate = aprDecimal / 12;
  if (monthlyRate === 0) return principal / months;

  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

/**
 * Calculate health factor
 * Health Factor = (Collateral Value * Liquidation Threshold) / Debt Value
 * Above 1 = safe, below 1 = liquidatable
 */
export function calculateHealthFactor(
  collateralValueUSD: number,
  debtValueUSD: number,
  liquidationThreshold: number
): number {
  if (debtValueUSD === 0) return Infinity;
  return (collateralValueUSD * liquidationThreshold) / debtValueUSD;
}

/**
 * Calculate the price at which collateral gets liquidated
 */
export function calculateLiquidationPrice(
  collateralAmount: number,
  debtValueUSD: number,
  liquidationThreshold: number
): number {
  if (collateralAmount === 0) return 0;
  return debtValueUSD / (collateralAmount * liquidationThreshold);
}

/**
 * Format APR for display (e.g., 0.042 -> "4.2%")
 */
export function formatAPR(apr: number): string {
  return `${(apr * 100).toFixed(1)}%`;
}

/**
 * Format USD for display
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format crypto amount for display
 */
export function formatCrypto(amount: number, decimals: number = 4): string {
  return amount.toFixed(decimals);
}
