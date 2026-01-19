import { TokenPrice } from '@/types';

// Simple price cache
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

// Mock prices for development (when API fails)
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
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data[coinId]?.usd || null;
  } catch {
    return null;
  }
}

/**
 * Get token price with caching
 */
export async function getTokenPrice(token: string): Promise<TokenPrice> {
  const upperToken = token.toUpperCase();
  const cached = priceCache.get(upperToken);

  // Return cached if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      token: upperToken,
      priceUSD: cached.price,
      confidence: 'high',
      updatedAt: new Date(cached.timestamp),
    };
  }

  // Fetch fresh price
  const price = await fetchCoinGeckoPrice(upperToken);

  if (price !== null) {
    priceCache.set(upperToken, { price, timestamp: Date.now() });
    return {
      token: upperToken,
      priceUSD: price,
      confidence: 'high',
      updatedAt: new Date(),
    };
  }

  // Fallback to mock price
  const mockPrice = MOCK_PRICES[upperToken] || 0;
  return {
    token: upperToken,
    priceUSD: mockPrice,
    confidence: 'low',
    updatedAt: new Date(),
  };
}

/**
 * Get multiple token prices
 */
export async function getTokenPrices(tokens: string[]): Promise<Record<string, TokenPrice>> {
  const prices: Record<string, TokenPrice> = {};

  await Promise.all(
    tokens.map(async (token) => {
      prices[token.toUpperCase()] = await getTokenPrice(token);
    })
  );

  return prices;
}

/**
 * Calculate collateral value in USD
 */
export async function getCollateralValueUSD(
  token: string,
  amount: number
): Promise<{ valueUSD: number; price: TokenPrice }> {
  const price = await getTokenPrice(token);
  return {
    valueUSD: amount * price.priceUSD,
    price,
  };
}
