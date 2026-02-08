#!/usr/bin/env tsx
/**
 * Setup validation script
 * Run this to check if your environment is configured correctly
 * 
 * Usage: npm run setup:check
 */

import { config, env, rpcUrls } from '../src/lib/config/env';
import { PrismaClient } from '@prisma/client';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const prisma = new PrismaClient();

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function pass(message: string) {
  console.log(`✅ ${message}`);
  checks.passed++;
}

function fail(message: string) {
  console.log(`❌ ${message}`);
  checks.failed++;
}

function warn(message: string) {
  console.log(`⚠️  ${message}`);
  checks.warnings++;
}

async function checkDatabase() {
  console.log('\n📊 Checking Database...\n');
  
  try {
    // Check connection
    await prisma.$connect();
    pass('Database connection successful');
    
    // Check if migrations have been run
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const count = (tableCount as [{ count: bigint }])[0].count;
    if (count > 0) {
      pass(`Database has ${count} tables (migrations applied)`);
    } else {
      fail('No tables found - run: npm run db:migrate');
    }
    
    // Check if seeded
    const merchantCount = await prisma.merchant.count();
    if (merchantCount > 0) {
      pass(`Database has ${merchantCount} merchant(s) (seeded)`);
    } else {
      warn('No merchants found - run: npm run db:seed');
    }
    
    const poolCount = await prisma.lendingPool.count();
    if (poolCount > 0) {
      pass(`Database has ${poolCount} lending pool(s) (seeded)`);
    } else {
      warn('No lending pools found - run: npm run db:seed');
    }
    
  } catch (error) {
    fail(`Database connection failed: ${(error as Error).message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkBlockchain() {
  console.log('\n⛓️  Checking Blockchain Connection...\n');
  
  try {
    const client = createPublicClient({
      chain: base,
      transport: http(rpcUrls.base),
    });
    
    const blockNumber = await client.getBlockNumber();
    pass(`Base mainnet connected (block #${blockNumber.toLocaleString()})`);
    
    // Check Aave pool contract exists
    const aavePoolCode = await client.getBytecode({
      address: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    });
    
    if (aavePoolCode && aavePoolCode.length > 2) {
      pass('Aave V3 Pool contract exists on Base');
    } else {
      fail('Aave V3 Pool contract not found');
    }
    
  } catch (error) {
    fail(`Blockchain connection failed: ${(error as Error).message}`);
    warn('Check your ALCHEMY_API_KEY is correct');
  }
}

function checkEnvironment() {
  console.log('\n🔧 Checking Environment Variables...\n');
  
  // Required vars
  const required = [
    'DATABASE_URL',
    'ALCHEMY_API_KEY',
    'NEXT_PUBLIC_WALLETCONNECT_ID',
  ];
  
  for (const key of required) {
    if (env[key as keyof typeof env]) {
      const value = env[key as keyof typeof env] as string;
      // Mask sensitive values
      const masked = value.length > 20 
        ? `${value.slice(0, 10)}...${value.slice(-5)}`
        : '***';
      pass(`${key} is set (${masked})`);
    } else {
      fail(`${key} is missing`);
    }
  }
  
  // Optional but recommended
  console.log('\n📦 Optional Services:\n');
  
  if (config.hasRedis) {
    pass('Redis configured (rate limiting enabled)');
  } else {
    warn('Redis not configured - rate limiting disabled');
  }
  
  if (config.hasSentry) {
    pass('Sentry configured (error tracking enabled)');
  } else {
    warn('Sentry not configured - error tracking disabled');
  }
  
  if (config.aaveReferralCode !== 0) {
    pass(`Aave referral code set (${config.aaveReferralCode})`);
  } else {
    warn('Aave referral code not set - missing out on fee revenue');
  }
}

function checkConfiguration() {
  console.log('\n⚙️  Checking App Configuration...\n');
  
  pass(`Environment: ${env.NODE_ENV}`);
  pass(`Default chain: ${env.NEXT_PUBLIC_DEFAULT_CHAIN}`);
  pass(`Widget URL: ${env.NEXT_PUBLIC_WIDGET_URL}`);
  pass(`Supported chains: ${config.supportedChains.join(', ')}`);
  
  if (config.isDevelopment) {
    warn('Running in development mode');
  }
  
  if (config.debug) {
    warn('Debug logging enabled');
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║         LoanFi Setup Validation                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  
  checkEnvironment();
  checkConfiguration();
  await checkDatabase();
  await checkBlockchain();
  
  console.log('\n═══════════════════════════════════════════════════\n');
  console.log(`✅ Passed: ${checks.passed}`);
  console.log(`⚠️  Warnings: ${checks.warnings}`);
  console.log(`❌ Failed: ${checks.failed}`);
  console.log('\n═══════════════════════════════════════════════════\n');
  
  if (checks.failed > 0) {
    console.log('🚨 Setup incomplete! Fix the errors above before running the app.\n');
    process.exit(1);
  } else if (checks.warnings > 0) {
    console.log('⚠️  Setup complete with warnings. App will run but some features are disabled.\n');
    process.exit(0);
  } else {
    console.log('🎉 Setup complete! Everything looks good.\n');
    process.exit(0);
  }
}

main();
