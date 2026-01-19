'use client';

import { formatUSD } from '@/lib/utils/calculations';

interface HealthFactorProps {
  healthFactor: number;
  liquidationPrice: number;
  collateralToken: string;
}

export function HealthFactor({
  healthFactor,
  liquidationPrice,
  collateralToken,
}: HealthFactorProps) {
  const getHealthColor = () => {
    if (healthFactor >= 2) return 'text-green-400';
    if (healthFactor >= 1.5) return 'text-yellow-400';
    if (healthFactor >= 1.2) return 'text-orange-400';
    return 'text-red-400';
  };

  const getHealthLabel = () => {
    if (healthFactor >= 2) return 'Safe';
    if (healthFactor >= 1.5) return 'Good';
    if (healthFactor >= 1.2) return 'Moderate';
    return 'Risky';
  };

  const getHealthWidth = () => {
    const normalized = Math.min(healthFactor / 3, 1) * 100;
    return `${normalized}%`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">Health Factor</span>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${getHealthColor()}`}>
            {healthFactor.toFixed(2)}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getHealthColor()} bg-opacity-20`}
            style={{ backgroundColor: 'currentColor', opacity: 0.15 }}>
            {getHealthLabel()}
          </span>
        </div>
      </div>

      {/* Health bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            healthFactor >= 2
              ? 'bg-green-500'
              : healthFactor >= 1.5
              ? 'bg-yellow-500'
              : healthFactor >= 1.2
              ? 'bg-orange-500'
              : 'bg-red-500'
          }`}
          style={{ width: getHealthWidth() }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-400">Liquidation Price</span>
        <span className="text-gray-300">
          {formatUSD(liquidationPrice)} / {collateralToken}
        </span>
      </div>

      {healthFactor < 1.5 && (
        <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-sm text-amber-400">
          Consider adding more collateral to improve your health factor.
        </div>
      )}
    </div>
  );
}
