'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { LoanOptions } from './LoanOptions';
import { CollateralInput } from './CollateralInput';
import { HealthFactor } from './HealthFactor';
import { WalletConnect } from './WalletConnect';
import { LoanOption, WidgetSession } from '@/types';
import { formatUSD } from '@/lib/utils/calculations';

interface WidgetProps {
  merchantId: string;
  amount: number;
  token: string;
  recipient: string;
}

type Step = 'loading' | 'collateral' | 'options' | 'confirm' | 'executing' | 'success' | 'error';

export function Widget({ merchantId, amount, token, recipient }: WidgetProps) {
  const { authenticated, user } = usePrivy();
  const address = user?.wallet?.address;
  const isConnected = authenticated && !!address;

  // State
  const [step, setStep] = useState<Step>('loading');
  const [session, setSession] = useState<WidgetSession | null>(null);
  const [collateralToken] = useState('ETH');
  const [collateralAmount, setCollateralAmount] = useState(0.25);
  const [ethPrice, setEthPrice] = useState(2500);
  const [options, setOptions] = useState<LoanOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<LoanOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Initialize session
  useEffect(() => {
    async function init() {
      try {
        // Fetch ETH price
        const priceRes = await fetch('/api/prices?tokens=ETH');
        const priceData = await priceRes.json();
        if (priceData.success) {
          setEthPrice(priceData.data.prices.ETH.priceUSD);
        }

        // Initialize widget session
        const initRes = await fetch('/api/widget/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, amount, token, recipient }),
        });

        const initData = await initRes.json();
        if (!initData.success) {
          throw new Error(initData.error || 'Failed to initialize');
        }

        setSession(initData.data.session);

        // Set minimum collateral based on amount
        const minCollateral = (amount / ethPrice) * 1.5;
        setCollateralAmount(Math.ceil(minCollateral * 100) / 100);

        setStep('collateral');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setStep('error');
      }
    }

    init();
  }, [merchantId, amount, token, recipient, ethPrice]);

  // Fetch loan options
  const fetchOptions = useCallback(async () => {
    if (!session) return;

    try {
      const res = await fetch('/api/widget/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          collateralToken,
          collateralAmount,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get options');
      }

      setOptions(data.data.options);
      setSelectedOption(data.data.options[0] || null);
      setStep('options');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get loan options');
    }
  }, [session, collateralToken, collateralAmount]);

  // Handle continue from collateral step
  const handleContinue = () => {
    fetchOptions();
  };

  // Handle option selection
  const handleSelectOption = (option: LoanOption) => {
    setSelectedOption(option);
  };

  // Handle execute
  const handleExecute = async () => {
    if (!session || !selectedOption || !address) return;

    setStep('executing');

    try {
      const res = await fetch('/api/widget/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          optionId: selectedOption.id,
          borrowerAddress: address,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to execute');
      }

      // In a real app, we'd execute the transactions here
      // For demo, we'll simulate success
      setTxHash('0x' + '0'.repeat(64));
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStep('error');
    }
  };

  // Render based on step
  return (
    <div className="w-full max-w-md mx-auto bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Pay with LoanFi</h2>
            <p className="text-violet-200 text-sm">Borrow now, pay later</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{formatUSD(amount)}</div>
            <div className="text-violet-200 text-sm">{token}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 'loading' && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        )}

        {step === 'collateral' && (
          <div className="space-y-4">
            <CollateralInput
              token={collateralToken}
              amount={collateralAmount}
              priceUSD={ethPrice}
              minAmount={(amount / ethPrice) * 1.2}
              onChange={setCollateralAmount}
            />

            <button
              onClick={handleContinue}
              className="w-full py-4 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'options' && selectedOption && (
          <div className="space-y-4">
            <LoanOptions
              options={options}
              selectedId={selectedOption?.id || null}
              onSelect={handleSelectOption}
            />

            <HealthFactor
              healthFactor={selectedOption.healthFactor}
              liquidationPrice={selectedOption.liquidationPrice}
              collateralToken={collateralToken}
            />

            <div className="pt-4 border-t border-gray-700">
              {!isConnected ? (
                <WalletConnect />
              ) : (
                <button
                  onClick={handleExecute}
                  className="w-full py-4 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg transition-colors"
                >
                  Confirm & Pay
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'executing' && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Processing transaction...</p>
            <p className="text-sm text-gray-500 mt-2">Please confirm in your wallet</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Payment Complete!</h3>
            <p className="mt-2 text-gray-400">
              Your loan has been processed. You can track repayments in your wallet.
            </p>
            {txHash && (
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-violet-400 hover:text-violet-300 text-sm"
              >
                View Transaction →
              </a>
            )}
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Something went wrong</h3>
            <p className="mt-2 text-gray-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setStep('collateral');
              }}
              className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700">
        <p className="text-center text-xs text-gray-500">
          Powered by <span className="text-violet-400">LoanFi</span> • Loans provided by Aave & Compound
        </p>
      </div>
    </div>
  );
}
