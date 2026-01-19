import Link from 'next/link';
import { HeroConnectButton } from '@/components/landing/HeroConnectButton';
import { Header } from '@/components/layout/Header';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header redirectOnConnect />

      {/* Hero - Two paths */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-indigo-900/20" />
        <div className="max-w-6xl mx-auto px-6 py-20 relative">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              LoanFi
            </h1>
            <p className="mt-4 text-xl text-gray-400">
              The DeFi loan aggregator for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Consumer card */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-violet-500/50 transition-all">
              <div className="w-14 h-14 bg-violet-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Need a Loan?</h2>
              <p className="text-gray-400 mb-6">
                Compare rates across Aave, Compound, and more. Find the best terms for your crypto loan in seconds.
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Compare rates from multiple pools
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Choose your term (3-12 months)
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Borrow with one transaction
                </li>
              </ul>
              <HeroConnectButton />
            </div>

            {/* Developer card */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-indigo-500/50 transition-all">
              <div className="w-14 h-14 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Building a dApp?</h2>
              <p className="text-gray-400 mb-6">
                Add &quot;Pay with LoanFi&quot; to your checkout. Your users borrow, you get paid instantly.
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  One-line widget integration
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Instant settlement to your wallet
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  No lending risk - we aggregate pools
                </li>
              </ul>
              <Link
                href="#developers"
                className="block w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-center transition-colors"
              >
                View Integration Docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Like Kayak for flights, but for DeFi loans. We aggregate the best rates so you don&apos;t have to.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-violet-600/20 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-violet-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Enter Your Needs</h3>
              <p className="text-gray-400">
                Tell us how much you want to borrow and what collateral you have.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-violet-600/20 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-violet-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Compare Options</h3>
              <p className="text-gray-400">
                See rates from Aave, Compound, and more. Pick your term length.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-violet-600/20 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-violet-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Borrow Instantly</h3>
              <p className="text-gray-400">
                One transaction: deposit collateral, borrow funds, done.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pool logos */}
      <section className="py-16 border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-gray-500 text-sm mb-8">Aggregating rates from</p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="text-2xl font-bold text-gray-600">Aave</div>
            <div className="text-2xl font-bold text-gray-600">Compound</div>
            <div className="text-2xl font-bold text-gray-600 opacity-50">Spark</div>
            <div className="text-2xl font-bold text-gray-600 opacity-50">Morpho</div>
          </div>
          <p className="text-center text-gray-600 text-sm mt-6">More pools coming soon</p>
        </div>
      </section>

      {/* Developer section */}
      <section id="developers" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">For Developers</h2>
            <p className="text-gray-400">
              Add &quot;Buy Now, Pay Later&quot; to your dApp in minutes
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-sm text-gray-400">checkout.html</span>
            </div>
            <pre className="p-6 overflow-x-auto text-sm">
              <code className="text-gray-300">{`<!-- Add LoanFi widget to your checkout -->
<script src="https://loanfi.xyz/widget.js"></script>

<div
  id="loanfi-widget"
  data-merchant-id="merch_abc123"
  data-amount="500"
  data-token="USDC"
  data-recipient="0x1234...abcd"
></div>

<script>
  LoanFi.init({
    onSuccess: (txHash) => {
      console.log('Paid via loan:', txHash);
      // Fulfill the order
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    }
  });
</script>`}</code>
            </pre>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/widget?merchantId=merch_demo123&amount=500&token=USDC"
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg text-center transition-colors"
            >
              Try Demo Widget
            </Link>
            <Link
              href="/api/merchants"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg text-center transition-colors"
            >
              Get API Key
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-violet-900/30 to-indigo-900/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Compare DeFi loan rates in seconds. No account needed.
          </p>
          <Link
            href="/browse"
            className="inline-block px-10 py-5 bg-violet-600 hover:bg-violet-700 text-white text-lg font-bold rounded-lg transition-colors"
          >
            Find Best Rates
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-2xl font-bold text-white">
              Loan<span className="text-violet-400">Fi</span>
            </div>
            <div className="flex items-center gap-6 text-gray-400">
              <Link href="/browse" className="hover:text-white transition-colors">Browse</Link>
              <Link href="#developers" className="hover:text-white transition-colors">Developers</Link>
              <Link href="/widget" className="hover:text-white transition-colors">Widget Demo</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              LoanFi is a loan aggregator, not a lender. Loans provided by Aave, Compound, and other DeFi protocols.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
