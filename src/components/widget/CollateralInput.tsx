'use client';

import { useState, useEffect } from 'react';
import { formatUSD, formatCrypto } from '@/lib/utils/calculations';

interface CollateralInputProps {
  token: string;
  amount: number;
  priceUSD: number;
  minAmount: number;
  onChange: (amount: number) => void;
}

// Token icons for future use
// const TOKEN_ICONS: Record<string, string> = { ETH: '/eth.svg', ... };

export function CollateralInput({
  token,
  amount,
  priceUSD,
  minAmount,
  onChange,
}: CollateralInputProps) {
  const [inputValue, setInputValue] = useState(amount.toString());
  const valueUSD = amount * priceUSD;

  useEffect(() => {
    setInputValue(amount.toString());
  }, [amount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <label className="block text-sm text-gray-400 mb-2">Collateral</label>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">
            {token.charAt(0)}
          </div>
          <span className="font-medium text-white">{token}</span>
        </div>

        <input
          type="number"
          value={inputValue}
          onChange={handleChange}
          step="0.01"
          min={minAmount}
          className="flex-1 bg-transparent text-right text-2xl font-bold text-white focus:outline-none"
          placeholder="0.00"
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-gray-400">
          @ {formatUSD(priceUSD)} per {token}
        </span>
        <span className="text-gray-300">
          ≈ {formatUSD(valueUSD)}
        </span>
      </div>

      {amount < minAmount && (
        <div className="mt-2 text-sm text-amber-400">
          Minimum {formatCrypto(minAmount)} {token} required
        </div>
      )}
    </div>
  );
}
