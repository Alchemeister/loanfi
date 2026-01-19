'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function HeroConnectButton() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  // Redirect to /browse when user logs in
  useEffect(() => {
    if (authenticated) {
      router.push('/browse');
    }
  }, [authenticated, router]);

  if (!ready) {
    return (
      <button
        disabled
        className="block w-full py-4 bg-gray-700 text-gray-400 font-bold rounded-lg text-center"
      >
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={login}
      className="block w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-center transition-colors"
    >
      Login to Get Started
    </button>
  );
}
