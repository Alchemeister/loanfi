'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { useState, useEffect, type ReactNode } from 'react';

const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID || 'demo';

// Wagmi config (without RainbowKit)
const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${alchemyId}`),
    [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/${alchemyId}`),
  },
});

function PrivyWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or if no Privy app ID, just render children
  if (!mounted || !privyAppId) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#7c3aed',
          logo: undefined,
        },
        loginMethods: ['email', 'google', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: base,
        supportedChains: [base, baseSepolia],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyWrapper>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyWrapper>
  );
}
