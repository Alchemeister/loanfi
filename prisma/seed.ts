import { PrismaClient, Chain } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed lending pools
  const pools = [
    {
      name: 'Aave V3',
      protocol: 'aave',
      chain: Chain.base,
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
      name: 'Compound V3',
      protocol: 'compound',
      chain: Chain.base,
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

  for (const pool of pools) {
    await prisma.lendingPool.upsert({
      where: { contractAddress: pool.contractAddress },
      update: pool,
      create: pool,
    });
  }
  console.log(`✅ Seeded ${pools.length} lending pools`);

  // Seed demo merchant
  const demoMerchant = await prisma.merchant.upsert({
    where: { walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78' },
    update: {},
    create: {
      name: 'Demo Store',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78',
      apiKey: 'demo_api_key_123',
      allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅ Seeded demo merchant: ${demoMerchant.name}`);

  // Seed token prices
  const tokenPrices = [
    { token: 'ETH', symbol: 'ETH', priceUSD: 2500, confidence: 'high' },
    { token: 'WETH', symbol: 'WETH', priceUSD: 2500, confidence: 'high' },
    { token: 'WBTC', symbol: 'WBTC', priceUSD: 45000, confidence: 'high' },
    { token: 'cbETH', symbol: 'cbETH', priceUSD: 2650, confidence: 'high' },
    { token: 'USDC', symbol: 'USDC', priceUSD: 1, confidence: 'high' },
    { token: 'USDT', symbol: 'USDT', priceUSD: 1, confidence: 'high' },
    { token: 'DAI', symbol: 'DAI', priceUSD: 1, confidence: 'high' },
  ];

  for (const price of tokenPrices) {
    await prisma.tokenPrice.upsert({
      where: { token: price.token },
      update: price,
      create: price,
    });
  }
  console.log(`✅ Seeded ${tokenPrices.length} token prices`);

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
