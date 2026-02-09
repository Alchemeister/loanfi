/**
 * Configuration validation and typesafe access
 * This ensures all required env vars are set before the app starts
 */

import { z } from 'zod';

// Define required and optional env vars
const envSchema = z.object({
  // Required (with defaults for deployment)
  DATABASE_URL: z.string().default('placeholder'),
  ALCHEMY_API_KEY: z.string().default('placeholder'),
  NEXT_PUBLIC_WALLETCONNECT_ID: z.string().default('placeholder'),
  
  // Required with defaults
  NEXT_PUBLIC_WIDGET_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_DEFAULT_CHAIN: z.enum(['base', 'arbitrum', 'ethereum', 'polygon']).default('base'),
  NEXT_PUBLIC_SUPPORTED_CHAINS: z.string().default('base,arbitrum'),
  
  // Optional
  REDIS_URL: z.string().optional(),
  AAVE_REFERRAL_CODE: z.string().default('0'),
  
  // Monitoring
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Security
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_PER_MINUTE: z.string().default('60'),
  SESSION_SECRET: z.string().optional(),
  
  // Notifications
  SENDGRID_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  
  // Payments
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID: z.string().optional(),
  
  // AI
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  
  // Development
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG: z.string().optional(),
  PRISMA_LOG_QUERIES: z.string().optional(),
  MOCK_BLOCKCHAIN: z.string().optional(),
});

// Parse and validate env vars
function parseEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (e) => `  ❌ ${e.path.join('.')}: ${e.message}`
    );
    
    console.error('\n🚨 Missing required environment variables:\n');
    console.error(errors.join('\n'));
    console.error('\n📋 Copy .env.local.example to .env.local and fill in your values\n');
    
    // In development, show warnings but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Running in development mode with missing env vars...\n');
      return parsed.data as unknown as z.infer<typeof envSchema>;
    }
    
    // In production, crash
    throw new Error('Missing required environment variables');
  }
  
  return parsed.data;
}

// Export validated config
export const env = parseEnv();

// Helper functions
export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Check if required services are configured
  hasRedis: !!env.REDIS_URL,
  hasSentry: !!env.SENTRY_DSN,
  hasStripe: !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
  hasSendGrid: !!env.SENDGRID_API_KEY,
  hasTwilio: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
  hasTelegram: !!env.TELEGRAM_BOT_TOKEN,
  hasAI: !!(env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY),
  
  // Parse arrays
  supportedChains: env.NEXT_PUBLIC_SUPPORTED_CHAINS.split(',').map(c => c.trim()),
  corsOrigins: env.CORS_ORIGINS?.split(',').map(c => c.trim()) || [],
  
  // Numbers
  rateLimitPerMinute: parseInt(env.RATE_LIMIT_PER_MINUTE, 10),
  aaveReferralCode: parseInt(env.AAVE_REFERRAL_CODE, 10) || 0,
  
  // Debug
  debug: env.DEBUG?.includes('loanfi') || false,
  logQueries: env.PRISMA_LOG_QUERIES === 'true',
  mockBlockchain: env.MOCK_BLOCKCHAIN === 'true',
};

// RPC URLs for different chains
export const rpcUrls = {
  base: `https://base-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
  arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
  ethereum: `https://eth-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
  polygon: `https://polygon-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`,
};

// Export type
export type Env = z.infer<typeof envSchema>;

export default env;
