import { createPublicClient, createWalletClient, http, type Address, type Chain as ViemChain } from 'viem';
import { base, arbitrum, mainnet, polygon, optimism } from 'viem/chains';
import { env } from '@/lib/config/env';

// Map our Chain type to viem chains
const chainMap: Record<string, ViemChain> = {
  base,
  arbitrum,
  ethereum: mainnet,
  polygon,
  optimism,
};

/**
 * Create a public client (read-only) for a specific chain
 */
export function createPublicClientForChain(chainName: string) {
  const chain = chainMap[chainName];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainName}`);
  }

  return createPublicClient({
    chain,
    transport: http(getRpcUrl(chainName)),
  });
}

/**
 * Get RPC URL for a chain
 */
export function getRpcUrl(chainName: string): string {
  const alchemyKey = env.ALCHEMY_API_KEY;
  
  const urls: Record<string, string> = {
    base: `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    ethereum: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    polygon: `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`,
    optimism: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  };

  const url = urls[chainName];
  if (!url) {
    throw new Error(`No RPC URL for chain: ${chainName}`);
  }

  return url;
}

/**
 * Get the viem chain object
 */
export function getViemChain(chainName: string): ViemChain {
  const chain = chainMap[chainName];
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainName}`);
  }
  return chain;
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainName: string): boolean {
  return chainName in chainMap;
}

/**
 * Get all supported chains
 */
export function getSupportedChains(): string[] {
  return Object.keys(chainMap);
}

/**
 * Get chain name from chain ID
 */
export function getChainNameById(chainId: number): string | undefined {
  const idMap: Record<number, string> = {
    8453: 'base',
    42161: 'arbitrum',
    1: 'ethereum',
    137: 'polygon',
    10: 'optimism',
  };
  return idMap[chainId];
}

/**
 * Validate an Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format a transaction hash for display
 */
export function formatTxHash(txHash: string): string {
  if (txHash.length <= 20) return txHash;
  return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerUrl(chainName: string, txHash: string): string {
  const explorers: Record<string, string> = {
    base: 'https://basescan.org',
    arbitrum: 'https://arbiscan.io',
    ethereum: 'https://etherscan.io',
    polygon: 'https://polygonscan.com',
    optimism: 'https://optimistic.etherscan.io',
  };

  const base = explorers[chainName];
  return base ? `${base}/tx/${txHash}` : '#';
}

/**
 * Get explorer URL for an address
 */
export function getAddressExplorerUrl(chainName: string, address: string): string {
  const explorers: Record<string, string> = {
    base: 'https://basescan.org',
    arbitrum: 'https://arbiscan.io',
    ethereum: 'https://etherscan.io',
    polygon: 'https://polygonscan.com',
    optimism: 'https://optimistic.etherscan.io',
  };

  const base = explorers[chainName];
  return base ? `${base}/address/${address}` : '#';
}
