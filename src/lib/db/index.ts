import { PrismaClient, Chain, LoanStatus, SessionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Initialize Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-export types
export { prisma, Chain, LoanStatus, SessionStatus };

// Mock lending pools with realistic Aave V3 data
// These are also in the database, but kept here for quick access
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
      return await prisma.merchant.findUnique({ where: { id } });
    },
    
    findByApiKey: async (apiKey: string) => {
      return await prisma.merchant.findUnique({ where: { apiKey } });
    },
    
    create: async (data: { name: string; walletAddress: string; allowedOrigins: string[] }) => {
      return await prisma.merchant.create({
        data: {
          ...data,
          apiKey: `key_${uuidv4().replace(/-/g, '')}`,
        },
      });
    },
    
    list: async () => {
      return await prisma.merchant.findMany();
    },
  },

  sessions: {
    findById: async (id: string) => {
      return await prisma.widgetSession.findUnique({
        where: { id },
        include: { merchant: true, loan: true },
      });
    },
    
    create: async (data: {
      merchantId: string;
      amount: number;
      token: string;
      recipient: string;
      chain: Chain;
    }) => {
      return await prisma.widgetSession.create({
        data: {
          ...data,
          status: 'pending',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
      });
    },
    
    update: async (id: string, data: Partial<{
      status: SessionStatus;
      collateralToken: string;
      collateralAmount: number;
      selectedOptionId: string;
      completedAt: Date;
    }>) => {
      return await prisma.widgetSession.update({
        where: { id },
        data,
      });
    },
    
    delete: async (id: string) => {
      return await prisma.widgetSession.delete({ where: { id } });
    },
    
    isExpired: (session: { expiresAt: Date }) => {
      return new Date() > session.expiresAt;
    },
  },

  pools: {
    findById: (id: string) => {
      // Use in-memory for now until fully migrated to DB
      return MOCK_POOLS.find(p => p.id === id);
    },
    
    list: (chain?: string) => {
      if (chain) return MOCK_POOLS.filter(p => p.chain === chain);
      return MOCK_POOLS;
    },
  },

  loans: {
    findById: async (id: string) => {
      return await prisma.loan.findUnique({
        where: { id },
        include: { merchant: true, pool: true, session: true },
      });
    },
    
    findByBorrower: async (address: string) => {
      return await prisma.loan.findMany({
        where: { borrowerAddress: address },
        orderBy: { createdAt: 'desc' },
      });
    },
    
    findByMerchant: async (merchantId: string) => {
      return await prisma.loan.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
      });
    },
    
    create: async (data: {
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
      collateralValueUSD: number;
      currentDebt: number;
      healthFactor: number;
      liquidationPrice: number;
      borrowTxHash: string;
      paymentTxHash: string;
    }) => {
      return await prisma.loan.create({
        data: {
          ...data,
          status: 'active',
          totalRepayment: data.monthlyPayment * data.termMonths,
        },
      });
    },
    
    update: async (id: string, data: Partial<{
      currentDebt: number;
      healthFactor: number;
      status: LoanStatus;
      paymentsMade: number;
      lastPaymentAt: Date;
      nextPaymentDue: Date;
      paidOffAt: Date;
    }>) => {
      return await prisma.loan.update({
        where: { id },
        data,
      });
    },
  },

  tokenPrices: {
    findByToken: async (token: string) => {
      return await prisma.tokenPrice.findUnique({
        where: { token: token.toUpperCase() },
      });
    },
    
    update: async (token: string, data: {
      priceUSD: number;
      confidence?: string;
      chainlinkPrice?: number;
      coingeckoPrice?: number;
      deviation?: number;
    }) => {
      return await prisma.tokenPrice.upsert({
        where: { token: token.toUpperCase() },
        update: data,
        create: {
          token: token.toUpperCase(),
          symbol: token.toUpperCase(),
          ...data,
        },
      });
    },
  },

  auditLogs: {
    create: async (data: {
      event: string;
      merchantId?: string;
      sessionId?: string;
      loanId?: string;
      ipAddress?: string;
      userAgent?: string;
      origin?: string;
      payload?: object;
      success: boolean;
      error?: string;
    }) => {
      return await prisma.auditLog.create({ data });
    },
  },
};

export default db;
