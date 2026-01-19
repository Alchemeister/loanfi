'use client';

import { LoanOption } from '@/types';
import { formatUSD, formatAPR } from '@/lib/utils/calculations';

interface PoolTableProps {
  options: LoanOption[];
  loading: boolean;
  onBorrow: (option: LoanOption) => void;
}

export function PoolTable({ options, loading, onBorrow }: PoolTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse">
            <div className="h-6 w-32 bg-gray-800 rounded mb-4" />
            <div className="h-4 w-48 bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {options.map((option, index) => (
        <div
          key={option.id}
          className={`bg-gray-900 rounded-xl border overflow-hidden transition-all hover:border-violet-500/50 ${
            index === 0 ? 'border-violet-500' : 'border-gray-800'
          }`}
        >
          {index === 0 && (
            <div className="bg-violet-600 text-white text-xs font-bold px-4 py-1.5 text-center">
              LOWEST MONTHLY PAYMENT
            </div>
          )}

          <div className="p-6">
            {/* Header: Pool name + Borrow button */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {option.pool.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{option.pool.name}</h3>
                  <p className="text-gray-400">{option.termMonths} month term</p>
                </div>
              </div>
              <button
                onClick={() => onBorrow(option)}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-colors flex-shrink-0"
              >
                Borrow Now
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Monthly Payment</p>
                <p className="text-2xl font-bold text-white">{formatUSD(option.monthlyPayment)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">APR</p>
                <p className="text-2xl font-bold text-white">{formatAPR(option.apr)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Total Repayment</p>
                <p className="text-2xl font-bold text-white">{formatUSD(option.totalRepayment)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Health Factor</p>
                <p className={`text-2xl font-bold ${
                  option.healthFactor >= 2 ? 'text-green-400' :
                  option.healthFactor >= 1.5 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {option.healthFactor.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400 pt-4 border-t border-gray-800">
              <div>
                <span className="text-gray-500">Collateral:</span>{' '}
                <span className="text-white">{option.collateralAmount.toFixed(4)} {option.collateralToken}</span>{' '}
                <span>({formatUSD(option.collateralValueUSD)})</span>
              </div>
              <div>
                <span className="text-gray-500">Liquidation at:</span>{' '}
                <span className="text-white">{formatUSD(option.liquidationPrice)}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Interest:</span>{' '}
                <span className="text-white">{formatUSD(option.totalRepayment - option.borrowAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
