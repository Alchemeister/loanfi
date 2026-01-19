// Server-safe constants (no client-only imports)

// Chain IDs
export const CHAIN_IDS = {
  base: 8453,
  baseSepolia: 84532,
} as const;

// Contract addresses on Base
export const CONTRACTS = {
  base: {
    aavePool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    aaveOracle: '0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156',
    compoundComet: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    weth: '0x4200000000000000000000000000000000000006',
  },
  baseSepolia: {
    aavePool: '0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b',
    aaveOracle: '0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    weth: '0x4200000000000000000000000000000000000006',
  },
} as const;

// Token decimals
export const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  WETH: 18,
  WBTC: 8,
  cbETH: 18,
  USDC: 6,
  USDT: 6,
  DAI: 18,
};
