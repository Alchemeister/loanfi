import { Merchant, WidgetSession, Loan, LendingPool } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for MVP (replace with Prisma later)
const merchants: Map<string, Merchant> = new Map();
const sessions: Map<string, WidgetSession> = new Map();
const loans: Map<string, Loan> = new Map();

// Mock lending pools with realistic Aave V3 data
const pools: LendingPool[] = [
  {
    id: 'aave-v3-base',
    name: 'Aave V3',
    chain: 'base',
    contractAddress: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5', // Aave V3 Pool on Base
    borrowAPR: 0.042, // 4.2%
    minCollateralRatio: 1.5,
    liquidationThreshold: 0.8,
    supportedCollateral: ['ETH', 'WETH', 'WBTC', 'cbETH'],
    supportedBorrow: ['USDC', 'USDT', 'DAI'],
  },
  {
    id: 'compound-v3-base',
    name: 'Compound V3',
    chain: 'base',
    contractAddress: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf', // Compound V3 on Base
    borrowAPR: 0.051, // 5.1%
    minCollateralRatio: 1.4,
    liquidationThreshold: 0.825,
    supportedCollateral: ['ETH', 'WETH', 'cbETH'],
    supportedBorrow: ['USDC'],
  },
];

// Seed a demo merchant
merchants.set('merch_demo123', {
  id: 'merch_demo123',
  name: 'Demo Store',
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78',
  apiKey: 'demo_api_key_123',
  allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  createdAt: new Date(),
});

// Merchant operations
export const db = {
  merchants: {
    findById: (id: string): Merchant | undefined => merchants.get(id),
    findByApiKey: (apiKey: string): Merchant | undefined => {
      for (const merchant of merchants.values()) {
        if (merchant.apiKey === apiKey) return merchant;
      }
      return undefined;
    },
    create: (data: Omit<Merchant, 'id' | 'createdAt' | 'apiKey'>): Merchant => {
      const merchant: Merchant = {
        ...data,
        id: `merch_${uuidv4().slice(0, 8)}`,
        apiKey: `key_${uuidv4().replace(/-/g, '')}`,
        createdAt: new Date(),
      };
      merchants.set(merchant.id, merchant);
      return merchant;
    },
    list: (): Merchant[] => Array.from(merchants.values()),
  },

  sessions: {
    findById: (id: string): WidgetSession | undefined => sessions.get(id),
    create: (data: Omit<WidgetSession, 'id' | 'createdAt' | 'expiresAt'>): WidgetSession => {
      const session: WidgetSession = {
        ...data,
        id: `sess_${uuidv4().slice(0, 12)}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      };
      sessions.set(session.id, session);
      return session;
    },
    delete: (id: string): void => {
      sessions.delete(id);
    },
    isExpired: (session: WidgetSession): boolean => {
      return new Date() > session.expiresAt;
    },
  },

  pools: {
    findById: (id: string): LendingPool | undefined => pools.find(p => p.id === id),
    list: (chain?: string): LendingPool[] => {
      if (chain) return pools.filter(p => p.chain === chain);
      return pools;
    },
  },

  loans: {
    findById: (id: string): Loan | undefined => loans.get(id),
    findByBorrower: (address: string): Loan[] => {
      return Array.from(loans.values()).filter(l => l.borrowerAddress === address);
    },
    findByMerchant: (merchantId: string): Loan[] => {
      return Array.from(loans.values()).filter(l => l.merchantId === merchantId);
    },
    create: (data: Omit<Loan, 'id' | 'createdAt'>): Loan => {
      const loan: Loan = {
        ...data,
        id: `loan_${uuidv4().slice(0, 12)}`,
        createdAt: new Date(),
      };
      loans.set(loan.id, loan);
      return loan;
    },
  },
};
