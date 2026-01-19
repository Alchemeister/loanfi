'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Widget } from '@/components/widget/Widget';

function WidgetContent() {
  const searchParams = useSearchParams();

  const merchantId = searchParams.get('merchantId') || 'merch_demo123';
  const amount = parseFloat(searchParams.get('amount') || '500');
  const token = searchParams.get('token') || 'USDC';
  const recipient = searchParams.get('recipient') || '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78';

  return (
    <Widget
      merchantId={merchantId}
      amount={amount}
      token={token}
      recipient={recipient}
    />
  );
}

export default function WidgetPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto bg-gray-900 rounded-2xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading widget...</p>
          </div>
        }
      >
        <WidgetContent />
      </Suspense>
    </div>
  );
}
