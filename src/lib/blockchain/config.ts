'use client';

import { http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID || 'demo';
const walletConnectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'demo';

export const config = getDefaultConfig({
  appName: 'LoanFi',
  projectId: walletConnectId,
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${alchemyId}`),
    [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/${alchemyId}`),
  },
  ssr: true,
});

// Re-export constants for client convenience
export { CHAIN_IDS, CONTRACTS, TOKEN_DECIMALS } from './constants';
