'use client';

import { LoanOption } from '@/types';
import { formatAPR, formatUSD } from '@/lib/utils/calculations';

interface LoanOptionsProps {
  options: LoanOption[];
  selectedId: string | null;
  onSelect: (option: LoanOption) => void;
}

export function LoanOptions({ options, selectedId, onSelect }: LoanOptionsProps) {
  if (options.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No loan options available. Try adjusting your collateral amount.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option)}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            selectedId === option.id
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedId === option.id
                    ? 'border-violet-500'
                    : 'border-gray-500'
                }`}
              >
                {selectedId === option.id && (
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                )}
              </div>
              <div>
                <span className="font-semibold text-white">{option.pool.name}</span>
                <span className="ml-2 text-sm text-gray-400">
                  {formatAPR(option.apr)} APR
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-white">
                {formatUSD(option.monthlyPayment)}/mo
              </div>
              <div className="text-sm text-gray-400">
                × {option.termMonths} months
              </div>
            </div>
          </div>

          {selectedId === option.id && (
            <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Total Repayment:</span>
                <span className="ml-2 text-white">{formatUSD(option.totalRepayment)}</span>
              </div>
              <div>
                <span className="text-gray-400">Interest:</span>
                <span className="ml-2 text-white">
                  {formatUSD(option.totalRepayment - option.borrowAmount)}
                </span>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
