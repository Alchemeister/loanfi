'use client';

import { usePrivy } from '@privy-io/react-auth';

export function WalletConnect() {
  const { login, logout, authenticated, user, ready } = usePrivy();

  if (!ready) {
    return (
      <button
        disabled
        className="w-full py-4 px-6 bg-gray-700 text-gray-400 font-bold rounded-lg"
      >
        Loading...
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="w-full py-4 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  // Get display info
  const displayName = user?.wallet?.address
    ? user.wallet.address.slice(0, 6) + '...' + user.wallet.address.slice(-4)
    : user?.email?.address || user?.google?.email || 'Connected';

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-white">{displayName}</span>
      </div>
      <button
        onClick={logout}
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
