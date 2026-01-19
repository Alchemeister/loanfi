// Chain types
export type Chain = 'base' | 'arbitrum';

// Merchant - uses the widget
export interface Merchant {
  id: string;
  name: string;
  walletAddress: string;
  apiKey: string;
  allowedOrigins: string[];
  createdAt: Date;
}

// Lending pool (Aave, Compound, etc.)
export interface LendingPool {
  id: string;
  name: string;
  chain: Chain;
  contractAddress: string;
  borrowAPR: number;
  minCollateralRatio: number;
  liquidationThreshold: number;
  supportedCollateral: string[];
  supportedBorrow: string[];
}

// Loan option shown in widget
export interface LoanOption {
  id: string;
  pool: LendingPool;
  borrowAmount: number;
  borrowToken: string;
  termMonths: number;
  apr: number;
  monthlyPayment: number;
  totalRepayment: number;
  collateralToken: string;
  collateralAmount: number;
  collateralValueUSD: number;
  healthFactor: number;
  liquidationPrice: number;
}

// Widget initialization params
export interface WidgetParams {
  merchantId: string;
  amount: number;
  token: string;
  recipient: string;
  chain?: Chain;
  collateralToken?: string;
}

// Widget session
export interface WidgetSession {
  id: string;
  merchantId: string;
  amount: number;
  token: string;
  recipient: string;
  chain: Chain;
  expiresAt: Date;
  createdAt: Date;
}

// Completed loan record
export interface Loan {
  id: string;
  borrowerAddress: string;
  merchantId: string;
  merchantAddress: string;
  poolId: string;
  chain: Chain;
  principalAmount: number;
  principalToken: string;
  termMonths: number;
  apr: number;
  monthlyPayment: number;
  collateralAmount: number;
  collateralToken: string;
  currentDebt: number;
  healthFactor: number;
  status: 'active' | 'repaid' | 'liquidated';
  borrowTxHash: string;
  paymentTxHash: string;
  createdAt: Date;
}

// Token price data
export interface TokenPrice {
  token: string;
  priceUSD: number;
  confidence: 'high' | 'low';
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorId?: string;
}
