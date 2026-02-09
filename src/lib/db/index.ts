import { v4 as uuidv4 } from 'uuid';

// Type definitions
export type Chain = 'base' | 'arbitrum' | 'ethereum' | 'polygon' | 'optimism';
export type LoanStatus = 'active' | 'repaid' | 'liquidated' | 'defaulted';
export type SessionStatus = 'pending' | 'completed' | 'expired' | 'cancelled';

// In-memory storage
const merchants: any[] = [
  {
    id: 'merch_demo123',
    name: 'Demo Store',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78',
    apiKey: 'demo_api_key_123',
    apiSecretHash: null,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
    email: 'demo@example.com',
    website: null,
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const sessions: any[] = [];
const loans: any[] = [];
const tokenPrices: any[] = [
  { id: '1', token: 'ETH', symbol: 'ETH', priceUSD: 2500, confidence: 'high', updatedAt: new Date() },
  { id: '2', token: 'WETH', symbol: 'WETH', priceUSD: 2500, confidence: 'high', updatedAt: new Date() },
  { id: '3', token: 'WBTC', symbol: 'WBTC', priceUSD: 45000, confidence: 'high', updatedAt: new Date() },
  { id: '4', token: 'cbETH', symbol: 'cbETH', priceUSD: 2600, confidence: 'high', updatedAt: new Date() },
  { id: '5', token: 'USDC', symbol: 'USDC', priceUSD: 1, confidence: 'high', updatedAt: new Date() },
  { id: '6', token: 'USDT', symbol: 'USDT', priceUSD: 1, confidence: 'high', updatedAt: new Date() },
  { id: '7', token: 'DAI', symbol: 'DAI', priceUSD: 1, confidence: 'high', updatedAt: new Date() },
];

const auditLogs: any[] = [];

// Mock lending pools
const MOCK_POOLS = [
  {
    id: 'aave-v3-base',
    name: 'Aave V3',
    protocol: 'aave',
    chain: 'base' as Chain,
    contractAddress: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    borrowAPR: 0.042,
    supplyAPR: 0.015,
    minCollateralRatio: 1.5,
    liquidationThreshold: 0.8,
    liquidationBonus: 0.05,
    supportedCollateral: ['ETH', 'WETH', 'WBTC', 'cbETH'],
    supportedBorrow: ['USDC', 'USDT', 'DAI'],
    isActive: true,
  },
  {
    id: 'compound-v3-base',
    name: 'Compound V3',
    protocol: 'compound',
    chain: 'base' as Chain,
    contractAddress: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
    borrowAPR: 0.051,
    supplyAPR: 0.018,
    minCollateralRatio: 1.4,
    liquidationThreshold: 0.825,
    liquidationBonus: 0.05,
    supportedCollateral: ['ETH', 'WETH', 'cbETH'],
    supportedBorrow: ['USDC'],
    isActive: true,
  },
];

// Database operations
export const db = {
  merchants: {
    findById: async (id: string) => {
      return merchants.find(m => m.id === id) || null;
    },
    
    findByApiKey: async (apiKey: string) => {
      return merchants.find(m => m.apiKey === apiKey) || null;
    },
    
    create: async (data: { name: string; walletAddress: string; allowedOrigins: string[] }) => {
      const merchant = {
        id: `merch_${uuidv4().replace(/-/g, '')}`,
        ...data,
        apiKey: `key_${uuidv4().replace(/-/g, '')}`,
        apiSecretHash: null,
        email: null,
        website: null,
        isActive: true,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      merchants.push(merchant);
      return merchant;
    },
    
    list: async () => {
      return [...merchants];
    },
  },

  sessions: {
    findById: async (id: string) => {
      const session = sessions.find(s => s.id === id);
      if (!session) return null;
      const merchant = merchants.find(m => m.id === session.merchantId);
      const loan = loans.find(l => l.sessionId === id);
      return { ...session, merchant, loan };
    },
    
    create: async (data: {
      merchantId: string;
      amount: number;
      token: string;
      recipient: string;
      chain: Chain;
    }) => {
      const session = {
        id: `sess_${uuidv4().replace(/-/g, '')}`,
        ...data,
        status: 'pending' as SessionStatus,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        completedAt: null,
        collateralToken: null,
        collateralAmount: null,
        selectedOptionId: null,
        loanId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sessions.push(session);
      return session;
    },
    
    update: async (id: string, data: any) => {
      const idx = sessions.findIndex(s => s.id === id);
      if (idx === -1) return null;
      sessions[idx] = { ...sessions[idx], ...data, updatedAt: new Date() };
      return sessions[idx];
    },
    
    delete: async (id: string) => {
      const idx = sessions.findIndex(s => s.id === id);
      if (idx === -1) return null;
      return sessions.splice(idx, 1)[0];
    },
    
    isExpired: (session: { expiresAt: Date }) => {
      return new Date() > new Date(session.expiresAt);
    },
  },

  pools: {
    findById: (id: string) => {
      return MOCK_POOLS.find(p => p.id === id);
    },
    
    list: (chain?: string) => {
      if (chain) return MOCK_POOLS.filter(p => p.chain === chain);
      return MOCK_POOLS;
    },
  },

  loans: {
    findById: async (id: string) => {
      const loan = loans.find(l => l.id === id);
      if (!loan) return null;
      const merchant = merchants.find(m => m.id === loan.merchantId);
      const pool = MOCK_POOLS.find(p => p.id === loan.poolId);
      const session = sessions.find(s => s.id === loan.sessionId);
      return { ...loan, merchant, pool, session };
    },
    
    findByBorrower: async (address: string) => {
      return loans.filter(l => l.borrowerAddress === address).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    
    findByMerchant: async (merchantId: string) => {
      return loans.filter(l => l.merchantId === merchantId).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    
    create: async (data: any) => {
      const loan = {
        id: `loan_${uuidv4().replace(/-/g, '')}`,
        ...data,
        status: 'active' as LoanStatus,
        totalRepayment: data.monthlyPayment * data.termMonths,
        paymentsMade: 0,
        lastPaymentAt: null,
        nextPaymentDue: null,
        paidOffAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      loans.push(loan);
      return loan;
    },
    
    update: async (id: string, data: any) => {
      const idx = loans.findIndex(l => l.id === id);
      if (idx === -1) return null;
      loans[idx] = { ...loans[idx], ...data, updatedAt: new Date() };
      return loans[idx];
    },
  },

  tokenPrices: {
    findByToken: async (token: string) => {
      return tokenPrices.find(t => t.token === token.toUpperCase()) || null;
    },
    
    update: async (token: string, data: any) => {
      const idx = tokenPrices.findIndex(t => t.token === token.toUpperCase());
      if (idx === -1) {
        const newPrice = {
          id: uuidv4(),
          token: token.toUpperCase(),
          symbol: token.toUpperCase(),
          ...data,
          updatedAt: new Date(),
        };
        tokenPrices.push(newPrice);
        return newPrice;
      }
      tokenPrices[idx] = { ...tokenPrices[idx], ...data, updatedAt: new Date() };
      return tokenPrices[idx];
    },
  },

  auditLogs: {
    create: async (data: any) => {
      const log = {
        id: `log_${uuidv4().replace(/-/g, '')}`,
        ...data,
        createdAt: new Date(),
      };
      auditLogs.push(log);
      return log;
    },
  },
};

export default db;
