'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface HeaderProps {
  redirectOnConnect?: boolean;
}

export function Header({ redirectOnConnect = false }: HeaderProps) {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirect to /browse when user logs in (only if redirectOnConnect is true)
  useEffect(() => {
    if (redirectOnConnect && authenticated && !hasRedirected) {
      setHasRedirected(true);
      router.push('/browse');
    }
  }, [authenticated, redirectOnConnect, hasRedirected, router]);

  // Get display name
  const displayName = user?.email?.address
    || user?.google?.email
    || user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4)
    || 'User';

  return (
    <header className="border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-lg z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-white">
          Loan<span className="text-violet-400">Fi</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/browse" className="text-gray-400 hover:text-white transition-colors">
            Browse Pools
          </Link>
          <Link href="/#developers" className="text-gray-400 hover:text-white transition-colors">
            Developers
          </Link>

          {!ready ? (
            <div className="px-4 py-2 bg-gray-800 rounded-lg text-gray-400">
              Loading...
            </div>
          ) : authenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{displayName}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
            >
              Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
