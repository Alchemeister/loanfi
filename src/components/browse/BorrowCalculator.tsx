'use client';

import { formatUSD } from '@/lib/utils/calculations';

interface BorrowCalculatorProps {
  borrowAmount: number;
  setBorrowAmount: (amount: number) => void;
  borrowToken: string;
  setBorrowToken: (token: string) => void;
  collateralToken: string;
  setCollateralToken: (token: string) => void;
  collateralAmount: number;
  setCollateralAmount: (amount: number) => void;
  ethPrice: number;
  onSearch: () => void;
  loading: boolean;
}

const BORROW_TOKENS = ['USDC', 'USDT', 'DAI'];
const COLLATERAL_TOKENS = ['ETH', 'WETH', 'WBTC', 'cbETH'];

export function BorrowCalculator({
  borrowAmount,
  setBorrowAmount,
  borrowToken,
  setBorrowToken,
  collateralToken,
  setCollateralToken,
  collateralAmount,
  setCollateralAmount,
  ethPrice,
  onSearch,
  loading,
}: BorrowCalculatorProps) {
  const collateralValueUSD = collateralAmount * ethPrice;
  const ltv = collateralValueUSD > 0 ? borrowAmount / collateralValueUSD : 0;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      {/* Row 1: Borrow + Collateral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Borrow Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            I want to borrow
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-violet-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={100}
              step={100}
            />
            <select
              value={borrowToken}
              onChange={(e) => setBorrowToken(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-medium focus:outline-none min-w-[100px]"
            >
              {BORROW_TOKENS.map((token) => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
          </div>
          {/* Quick amounts */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[500, 1000, 2500, 5000, 10000].map((amount) => (
              <button
                key={amount}
                onClick={() => setBorrowAmount(amount)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  borrowAmount === amount
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Collateral */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">
            With collateral
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-violet-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={0.01}
              step={0.01}
            />
            <select
              value={collateralToken}
              onChange={(e) => setCollateralToken(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-medium focus:outline-none min-w-[100px]"
            >
              {COLLATERAL_TOKENS.map((token) => (
                <option key={token} value={token}>{token}</option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            = {formatUSD(collateralValueUSD)} at {formatUSD(ethPrice)}/{collateralToken}
          </p>
        </div>
      </div>

      {/* Row 2: LTV + Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        {/* LTV indicator */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Loan-to-Value (LTV)</span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${
                ltv <= 0.6 ? 'text-green-400' :
                ltv <= 0.75 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {isFinite(ltv) ? `${(ltv * 100).toFixed(0)}%` : '—'}
              </span>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                ltv <= 0.6 ? 'bg-green-500/20 text-green-400' :
                ltv <= 0.75 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {ltv <= 0.6 ? 'Safe' : ltv <= 0.75 ? 'Moderate' : 'Risky'}
              </span>
            </div>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                ltv <= 0.6 ? 'bg-green-500' :
                ltv <= 0.75 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(ltv * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={onSearch}
          disabled={loading || borrowAmount <= 0 || collateralAmount <= 0}
          className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-lg font-bold rounded-lg transition-colors flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Best Rates
            </>
          )}
        </button>
      </div>
    </div>
  );
}
