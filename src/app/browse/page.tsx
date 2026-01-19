'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { BorrowCalculator } from '@/components/browse/BorrowCalculator';
import { PoolTable } from '@/components/browse/PoolTable';
import { LoanOption } from '@/types';
import Link from 'next/link';

export default function BrowsePage() {
  const { login, logout, authenticated, user, ready } = usePrivy();

  // User inputs
  const [borrowAmount, setBorrowAmount] = useState(1000);
  const [borrowToken, setBorrowToken] = useState('USDC');
  const [collateralToken, setCollateralToken] = useState('ETH');
  const [collateralAmount, setCollateralAmount] = useState(0.5);
  const [termMonths, setTermMonths] = useState<number | 'all'>('all');

  // Data
  const [options, setOptions] = useState<LoanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [ethPrice, setEthPrice] = useState(3300);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Fetch prices on load
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/prices?tokens=ETH');
        const data = await res.json();
        if (data.success) {
          setEthPrice(data.data.prices.ETH.priceUSD);
        }
      } catch (e) {
        console.error('Failed to fetch prices:', e);
      }
    }
    fetchPrices();
  }, []);

  // Auto-calculate collateral based on amount
  useEffect(() => {
    const minCollateral = (borrowAmount / ethPrice) * 1.5;
    setCollateralAmount(Math.ceil(minCollateral * 100) / 100);
  }, [borrowAmount, ethPrice]);

  // Search for loan options
  const handleSearch = async () => {
    setLoading(true);
    try {
      // Create a session first
      const initRes = await fetch('/api/widget/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'merch_demo123',
          amount: borrowAmount,
          token: borrowToken,
          recipient: '0x0000000000000000000000000000000000000000', // Self-borrow
        }),
      });
      const initData = await initRes.json();

      if (!initData.success) {
        throw new Error(initData.error);
      }

      setSessionId(initData.data.session.id);

      // Get options
      const optionsRes = await fetch('/api/widget/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: initData.data.session.id,
          collateralToken,
          collateralAmount,
        }),
      });
      const optionsData = await optionsRes.json();

      if (optionsData.success) {
        setOptions(optionsData.data.options);
      } else {
        setOptions([]);
      }
    } catch (e) {
      console.error('Search failed:', e);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter options by term
  const filteredOptions = useMemo(() => {
    if (termMonths === 'all') return options;
    return options.filter(o => o.termMonths === termMonths);
  }, [options, termMonths]);

  // Sort by monthly payment (lowest first)
  const sortedOptions = useMemo(() => {
    return [...filteredOptions].sort((a, b) => a.monthlyPayment - b.monthlyPayment);
  }, [filteredOptions]);

  // Get display name
  const displayName = user?.email?.address
    || user?.google?.email
    || user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4)
    || 'User';

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-lg z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            Loan<span className="text-violet-400">Fi</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/browse" className="text-violet-400 font-medium">
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

        {/* Hero */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find the Best DeFi Loan Rates
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Compare rates across Aave, Compound, and more.
              Like Kayak, but for crypto loans.
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            <BorrowCalculator
              borrowAmount={borrowAmount}
              setBorrowAmount={setBorrowAmount}
              borrowToken={borrowToken}
              setBorrowToken={setBorrowToken}
              collateralToken={collateralToken}
              setCollateralToken={setCollateralToken}
              collateralAmount={collateralAmount}
              setCollateralAmount={setCollateralAmount}
              ethPrice={ethPrice}
              onSearch={handleSearch}
              loading={loading}
            />
          </div>
        </section>

        {/* Results */}
        <section className="px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            {/* Term filter */}
            {options.length > 0 && (
              <div className="mb-6 flex items-center gap-4">
                <span className="text-gray-400 text-sm">Filter by term:</span>
                <div className="flex gap-2">
                  {['all', 3, 6, 8, 12].map((term) => (
                    <button
                      key={term}
                      onClick={() => setTermMonths(term as number | 'all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        termMonths === term
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {term === 'all' ? 'All' : `${term}mo`}
                    </button>
                  ))}
                </div>
                <span className="text-gray-500 text-sm ml-auto">
                  {sortedOptions.length} options found
                </span>
              </div>
            )}

            {/* Results table */}
            <PoolTable
              options={sortedOptions}
              loading={loading}
              onBorrow={(option) => {
                // For now, link to widget with the selected option
                window.location.href = `/widget?merchantId=merch_demo123&amount=${option.borrowAmount}&token=${option.borrowToken}`;
              }}
            />

            {/* Empty state */}
            {!loading && options.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Search for loan options</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Enter how much you want to borrow and your collateral above,
                  then click &quot;Find Best Rates&quot; to compare options.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
  );
}
