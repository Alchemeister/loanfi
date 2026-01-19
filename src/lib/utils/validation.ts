import { z } from 'zod';

// Ethereum address regex
const addressRegex = /^0x[a-fA-F0-9]{40}$/;

// Widget init params
export const WidgetInitSchema = z.object({
  merchantId: z.string().startsWith('merch_'),
  amount: z.number().positive().max(1_000_000),
  token: z.enum(['USDC', 'USDT', 'DAI']),
  recipient: z.string().regex(addressRegex, 'Invalid Ethereum address'),
  chain: z.enum(['base', 'arbitrum']).optional(),
});

// Widget options params
export const WidgetOptionsSchema = z.object({
  sessionId: z.string().startsWith('sess_'),
  collateralToken: z.enum(['ETH', 'WETH', 'WBTC', 'cbETH']),
  collateralAmount: z.number().positive(),
});

// Widget execute params
export const WidgetExecuteSchema = z.object({
  sessionId: z.string().startsWith('sess_'),
  optionId: z.string(),
  borrowerAddress: z.string().regex(addressRegex, 'Invalid Ethereum address'),
});

// Merchant create params
export const MerchantCreateSchema = z.object({
  name: z.string().min(1).max(100),
  walletAddress: z.string().regex(addressRegex, 'Invalid Ethereum address'),
  allowedOrigins: z.array(z.string().url()).min(1),
});

export type WidgetInitInput = z.infer<typeof WidgetInitSchema>;
export type WidgetOptionsInput = z.infer<typeof WidgetOptionsSchema>;
export type WidgetExecuteInput = z.infer<typeof WidgetExecuteSchema>;
export type MerchantCreateInput = z.infer<typeof MerchantCreateSchema>;
