import { TokenPrice } from '@/types';
import { db } from '@/lib/db';
import { config } from '@/lib/config/env';
import { createPublicClientForChain } from './client';
import { parseAbi, formatUnits } from 'viem';

// Simple price cache (in-memory for quick access)
const priceCache: Map<string, { price: number; timestamp: number }> = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

// CoinGecko token IDs
const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  WETH: 'ethereum',
  WBTC: 'wrapped-bitcoin',
  cbETH: 'coinbase-wrapped-staked-eth',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
};

// Chainlink Price Feed addresses on Base
const CHAINLINK_FEEDS: Record<string, `0x${string}`> = {
  ETH: '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70', // ETH/USD
  WETH: '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70', // ETH/USD
  USDC: '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B', // USDC/USD
  USDT: '0xe9BCE4E16e62EE4D4870aeB0e1706b4F54B4F3B4', // USDT/USD
  DAI: '0x591e79239a7d679378ec8c847e5038150364c78f', // DAI/USD
  WBTC: '0x64c911996D3c7a63F8D61C7b0995Fb7E94B68E7d', // cbBTC/USD (on Base)
};

// Chainlink Price Feed ABI
const CHAINLINK_ABI = parseAbi([
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() view returns (uint8)',
]);

// Mock prices for development fallback
const MOCK_PRICES: Record<string, number> = {
  ETH: 2500,
  WETH: 2500,
  WBTC: 45000,
  cbETH: 2600,
  USDC: 1,
  USDT: 1,
  DAI: 1,
};

/**
 * Fetch price from CoinGecko
 */
async function fetchCoinGeckoPrice(token: string): Promise<number | null> {
  const coinId = COINGECKO_IDS[token];
  if (!coinId) return null;

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { 
        next: { revalidate: 60 },
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`CoinGecko API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data[coinId]?.usd || null;
  } catch (error) {
    console.warn(`Failed to fetch CoinGecko price for ${token}:`, error);
    return null;
  }
}

/**
 * Fetch price from Chainlink on Base
 */
async function fetchChainlinkPrice(token: string): Promise<number | null> {
  if (config.mockBlockchain) {
    return null;
  }

  const feedAddress = CHAINLINK_FEEDS[token.toUpperCase()];
  if (!feedAddress) {
    return null;
  }

  try {
    const client = createPublicClientForChain('base');
    
    // Get decimals
    const decimals = await client.readContract({
      address: feedAddress,
      abi: CHAINLINK_ABI,
      functionName: 'decimals',
    });

    // Get latest price
    const roundData = await client.readContract({
      address: feedAddress,
      abi: CHAINLINK_ABI,
      functionName: 'latestRoundData',
    });

    const price = Number(formatUnits(roundData[1], decimals));
    
    // Check if price is stale (older than 1 hour)
    const priceTimestamp = Number(roundData[3]);
    const isStale = (Date.now() / 1000) - priceTimestamp > 3600;
    
    if (isStale) {
      console.warn(`Chainlink price for ${token} is stale`);
    }

    return price;
  } catch (error) {
    console.warn(`Failed to fetch Chainlink price for ${token}:`, error);
    return null;
  }
}

/**
 * Get token price with multiple sources and caching
 */
export async function getTokenPrice(token: string, chainName: string = 'base'): Promise<TokenPrice> {
  const upperToken = token.toUpperCase();
  
  // Check in-memory cache first
  const cached = priceCache.get(upperToken);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      token: upperToken,
      priceUSD: cached.price,
      confidence: 'high',
      updatedAt: new Date(cached.timestamp),
    };
  }

  // Check database cache
  const dbPrice = await db.tokenPrices.findByToken(upperToken);
  if (dbPrice && Date.now() - dbPrice.updatedAt.getTime() < CACHE_TTL) {
    // Update in-memory cache
    priceCache.set(upperToken, { 
      price: dbPrice.priceUSD, 
      timestamp: dbPrice.updatedAt.getTime() 
    });
    
    return {
      token: upperToken,
      priceUSD: dbPrice.priceUSD,
      confidence: dbPrice.confidence as 'high' | 'low',
      updatedAt: dbPrice.updatedAt,
    };
  }

  // Fetch fresh prices from multiple sources
  let chainlinkPrice: number | null = null;
  let coingeckoPrice: number | null = null;

  // Try Chainlink first (on-chain, most reliable)
  if (chainName === 'base' && CHAINLINK_FEEDS[upperToken]) {
    chainlinkPrice = await fetchChainlinkPrice(upperToken);
  }

  // Try CoinGecko as backup
  coingeckoPrice = await fetchCoinGeckoPrice(upperToken);

  // Determine final price and confidence
  let finalPrice: number;
  let confidence: 'high' | 'low';
  let deviation: number | undefined;

  if (chainlinkPrice !== null && coingeckoPrice !== null) {
    // Both sources available - calculate average
    finalPrice = (chainlinkPrice + coingeckoPrice) / 2;
    
    // Calculate deviation
    deviation = Math.abs(chainlinkPrice - coingeckoPrice) / chainlinkPrice;
    
    // High confidence if deviation < 1%
    confidence = deviation < 0.01 ? 'high' : 'low';
    
    if (deviation > 0.05) {
      console.warn(`Large price deviation for ${upperToken}: ${(deviation * 100).toFixed(2)}%`);
    }
  } else if (chainlinkPrice !== null) {
    finalPrice = chainlinkPrice;
    confidence = 'high';
  } else if (coingeckoPrice !== null) {
    finalPrice = coingeckoPrice;
    confidence = 'high';
  } else {
    // Fallback to mock price
    finalPrice = MOCK_PRICES[upperToken] || 0;
    confidence = 'low';
  }

  // Update caches
  priceCache.set(upperToken, { price: finalPrice, timestamp: Date.now() });
  
  // Save to database
  await db.tokenPrices.update(upperToken, {
    priceUSD: finalPrice,
    confidence,
    chainlinkPrice: chainlinkPrice || undefined,
    coingeckoPrice: coingeckoPrice || undefined,
    deviation,
  });

  return {
    token: upperToken,
    priceUSD: finalPrice,
    confidence,
    updatedAt: new Date(),
  };
}

/**
 * Get multiple token prices efficiently
 */
export async function getTokenPrices(tokens: string[], chainName: string = 'base'): Promise<Record<string, TokenPrice>> {
  const prices: Record<string, TokenPrice> = {};

  await Promise.all(
    tokens.map(async (token) => {
      prices[token.toUpperCase()] = await getTokenPrice(token, chainName);
    })
  );

  return prices;
}

/**
 * Calculate collateral value in USD
 */
export async function getCollateralValueUSD(
  token: string,
  amount: number,
  chainName: string = 'base'
): Promise<{ valueUSD: number; price: TokenPrice }> {
  const price = await getTokenPrice(token, chainName);
  return {
    valueUSD: amount * price.priceUSD,
    price,
  };
}

/**
 * Refresh all token prices
 */
export async function refreshAllPrices(chainName: string = 'base'): Promise<void> {
  const tokens = Object.keys(CHAINLINK_FEEDS);
  
  console.log(`Refreshing prices for ${tokens.length} tokens...`);
  
  for (const token of tokens) {
    try {
      await getTokenPrice(token, chainName);
      console.log(`✅ Updated ${token}`);
    } catch (error) {
      console.error(`❌ Failed to update ${token}:`, error);
    }
  }
  
  console.log('Price refresh complete');
}

/**
 * Get price confidence level
 */
export function getPriceConfidence(price: TokenPrice): 'high' | 'medium' | 'low' {
  if (price.confidence === 'high') return 'high';
  
  // Check age
  const age = Date.now() - price.updatedAt.getTime();
  if (age < 5 * 60 * 1000) return 'medium'; // Less than 5 minutes
  
  return 'low';
}
