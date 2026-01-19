# LoanFi Roadmap

The full vision, advanced features, and future architecture plans. Start with the MVP in CLAUDE.md first.

---

## The Vision

### The Five Layers

**Layer 1: Checkout Widget (MVP - Current Focus)**
"Pay with Klarna" for crypto. Merchants embed widget, users borrow to complete purchases.
- Embed on any checkout
- Show loan options from Aave/Compound
- Different terms (3mo, 6mo, 8mo, 12mo)
- Single transaction: borrow → pay merchant

**Layer 2: Standalone Comparison Site (Future)**
Kayak for DeFi loans. Users browse and compare without a merchant.
- Connect wallet
- Enter borrowing needs
- See all pools you qualify for
- Sort by monthly payment
- Borrow directly

**Layer 3: P2P IOU Tracking (Future)**
Friend/family loan tracking. Build credit from informal loans.
- "You owe me $500, pay me $50/mo"
- Payment reminders
- Zero regulatory risk - just tracking

**Layer 4: B2B API for Pools (Future)**
Plaid for DeFi lending. Pool owners integrate your tools.
- Embeddable loan calculator
- Better UX for their borrowers
- Revenue: $99-499/mo per pool

**Layer 5: On-Chain Credit Score (Future)**
Aggregate repayment data across all layers.
- 300-850 scale
- Under-collateralized loans for high scores

**Layer 6: Fiat On-Ramp Integration (Future)**
Let users buy crypto directly in LoanFi - skip the exchange entirely.
- Coinbase Onramp integration
- MoonPay / Transak widgets
- Stripe Crypto Onramp
- "Buy ETH" button before borrow flow
- Card + bank payments
- Zero friction: buy → borrow → done

---

## Market Context

| Factor | Score | Notes |
|--------|-------|-------|
| Problem Severity | 8/10 | DeFi UX is terrible |
| Market Size | 8/10 | $19B+ DeFi loans, $250B P2P lending |
| Willingness to Pay | 7/10 | Pools want users, users want simplicity |
| Competition | 8/10 | Nobody owns this UX layer |
| Feasibility | 8/10 | Aggregation is read-only to start |
| Regulatory Risk | LOW | Software, not a lender |

### Competitive Landscape

| Tool | What It Does | Gap |
|------|--------------|-----|
| Klarna | BNPL for fiat | No crypto |
| Aave/Compound | Lending pools | Confusing UX, no checkout integration |
| 1inch | DEX aggregator | Swaps only, not loans |
| Zapper | Portfolio tracker | Shows loans, doesn't help get one |
| DeFi Llama | Analytics | Data for nerds, not consumers |

**The gap:** Nobody does "borrow at checkout with one click, pick your terms."

---

## Feature Roadmap

### Phase 1: Checkout Widget MVP (Current)
- [ ] Merchant registration (API key, wallet, allowed origins)
- [ ] Pool data fetching (Aave/Compound on Base)
- [ ] Widget UI (loan options with different terms)
- [ ] Loan option calculation (3/6/8/12 month terms)
- [ ] Wallet connection in widget
- [ ] Multicall transaction (collateral → borrow → pay merchant)
- [ ] Transaction execution

### Phase 2: Standalone Comparison Site
- [ ] Landing page for consumers
- [ ] Loan search without merchant context
- [ ] Compare pools side by side
- [ ] Borrow directly (not at checkout)
- [ ] Loan tracking dashboard
- [ ] Repayment progress view

### Phase 3: Safety & Alerts
- [ ] Health factor monitoring
- [ ] Liquidation warning alerts (email, push)
- [ ] Payment reminders
- [ ] Liquidation simulator ("What if ETH drops 30%?")
- [ ] Pool risk scoring (A+ to D)

### Phase 4: Optimization
- [ ] Refinancing alerts ("Pool B is now cheaper")
- [ ] One-click refinance
- [ ] Gas optimization suggestions
- [ ] Multi-chain expansion (Ethereum mainnet, Optimism, Polygon)
- [ ] Collateral optimization ("Use stETH to earn while locked")

### Phase 5: Credit System
- [ ] On-chain credit score calculation
- [ ] Score breakdown view
- [ ] Credit history
- [ ] Vouching system (friends vouch for you)
- [ ] Credit report export

### Phase 6: P2P IOUs
- [ ] Create IOU form
- [ ] IOU dashboard
- [ ] Payment recording
- [ ] P2P credit building
- [ ] Optional on-chain IOUs

### Phase 7: B2B API for Pools
- [ ] API key management for pool owners
- [ ] Embeddable calculator widget
- [ ] Webhook notifications
- [ ] Analytics dashboard
- [ ] Stripe billing

### Phase 8: Advanced
- [ ] NFT collateral support (NFTfi, Arcade)
- [ ] Insurance integration (Nexus Mutual)
- [ ] AI recommendations
- [ ] Tax reporting export
- [ ] Group loans
- [ ] Under-collateralized loans (high credit only)
- [ ] Mobile app (React Native)
- [ ] Browser extension

---

## All Planned Features (35+ Total)

### Checkout Widget (MVP)
1. **Merchant Widget** - Embeddable "Pay with LoanFi" button
2. **Term Selection** - 3, 6, 8, 12 month options
3. **Pool Comparison** - Show rates from multiple pools
4. **One-Click Pay** - Single transaction for whole flow

### Standalone Site
5. **Loan Search** - Find loans without checkout context
6. **Monthly Payment Calculator** - "I can pay $200/mo" → matching pools
7. **Loan Health Dashboard** - Visual green/yellow/red indicator
8. **Plain English Explanations** - No jargon, tooltips everywhere

### Risk Management
9. **Liquidation Protection Alerts** - Push when collateral drops
10. **Auto-Add Collateral** - Automatic if health drops below threshold
11. **Liquidation Simulator** - "What if ETH drops 30%?"
12. **Pool Risk Scoring** - A+ to D based on audits, TVL, exploit history

### Optimization
13. **Refinancing Alerts** - "Save $47/month by switching to Pool B"
14. **Gas Optimization** - "Borrow on Arbitrum to save $45"
15. **Collateral Optimization** - "Switch to stETH: earn 4% while locked"
16. **Multi-Chain Aggregation** - Best rates across all chains

### Payment & Tracking
17. **Auto-Repayment** - Scheduled recurring payments
18. **Payment Reminders** - Push, email, SMS, Telegram, Discord
19. **Repayment Progress Tracker** - Visual progress bar
20. **Early Payoff Calculator** - "Pay $500 extra → save $34"

### Credit & Reputation
21. **On-Chain Credit Score** - 300-850 scale
22. **Credit Score Breakdown** - What's helping/hurting your score
23. **Vouching System** - Friends with high scores vouch for you
24. **Credit History Export** - Portable reputation

### Advanced
25. **NFT Collateral Support** - Borrow against NFTs
26. **Yield on Idle Collateral** - Collateral earns while locked
27. **Insurance Integration** - Protect loans for $X/month
28. **Tax Reporting** - Export for TurboTax, CoinTracker
29. **Fiat On/Off Ramp** - USD → borrow → repay → USD

### Social & Discovery
30. **Whale Watching** - "Big wallets are borrowing heavily"
31. **Savings Goals** - "3 more payments until it's yours"
32. **Group Loans** - Pool with friends for larger amounts
33. **Community Reviews** - User reviews of pools

### Notifications
34. **Rate Change Alerts** - "Aave rate dropped to 3.2%"
35. **Opportunity Alerts** - "New pool with 2% promo rate"
36. **Market Condition Alerts** - "ETH volatility high"

### AI-Powered
37. **Smart Recommendations** - "Based on your history..."
38. **Risk Assessment** - "12% chance of liquidation"
39. **Chatbot Support** - Natural language queries

---

## Future Architecture

When scaling beyond MVP:

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────┤
│  On-Chain:                                                      │
│  ├── Aave V3 (Base, Arbitrum, Ethereum, Optimism, Polygon)     │
│  ├── Compound V3                                                │
│  ├── Spark (MakerDAO)                                          │
│  ├── Morpho                                                     │
│  ├── NFTfi, Arcade (NFT collateral)                            │
│  └── More pools via plugin system                               │
│                                                                 │
│  Off-Chain:                                                     │
│  ├── Price feeds (Chainlink, CoinGecko)                        │
│  ├── Gas prices                                                 │
│  └── Pool metadata (audits, TVL history)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     INDEXING LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  • The Graph subgraphs for each pool                           │
│  • Real-time rate updates (WebSocket)                          │
│  • Historical data aggregation                                  │
│  • Multi-chain synchronization                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     COMPUTATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  • Rate normalization (APR → monthly payment)                  │
│  • Health factor computation                                    │
│  • Credit score calculation                                     │
│  • Risk modeling                                                 │
│  • Refinancing opportunity detection                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Checkout Widget (MVP)                                          │
│  Consumer App (Next.js)                                         │
│  B2B API (Fastify)                                              │
│  Mobile App (React Native)                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Future Project Structure (Monorepo)

```
/defi-loan-aggregator
  /apps
    /web                    # Next.js (widget + consumer site)
    /mobile                 # React Native app
  /packages
    /sdk                    # Shared SDK
    /contracts              # Smart contracts (if needed)
    /types                  # Shared TypeScript types
    /ui                     # Shared UI components
  /services
    /api                    # Fastify backend (if needed)
    /indexer                # Blockchain indexer
    /notifications          # Alert service
  turbo.json                # Turborepo config
```

---

## Extended Data Models

### P2P IOU (Future)

```typescript
interface P2PIOU {
  id: string;
  lenderAddress: string;
  lenderName?: string;
  borrowerAddress: string;
  borrowerName?: string;
  principalAmount: number;
  currency: string;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalOwed: number;
  totalPaid: number;
  remainingBalance: number;
  status: 'active' | 'paid_off' | 'defaulted' | 'forgiven';
  isOnChain: boolean;
  onTimePayments: number;
  latePayments: number;
  createdAt: Date;
}

interface P2PPayment {
  id: string;
  iouId: string;
  amount: number;
  paidAt: Date;
  wasOnTime: boolean;
  daysLate?: number;
  method: 'crypto' | 'cash' | 'bank' | 'other';
  txHash?: string;
}
```

### Credit Score (Future)

```typescript
interface CreditProfile {
  walletAddress: string;
  score: number;                   // 300-850
  scoreUpdatedAt: Date;

  paymentHistory: {
    score: number;                 // 0-100
    onTimePayments: number;
    latePayments: number;
    missedPayments: number;
    defaults: number;
  };

  creditUtilization: {
    score: number;
    currentDebt: number;
    availableCredit: number;
    utilizationRatio: number;
  };

  creditAge: {
    score: number;
    oldestAccount: Date;
    averageAge: number;
  };

  creditMix: {
    score: number;
    p2pLoans: number;
    defiLoans: number;
    poolsUsed: number;
  };

  vouchesReceived: Vouch[];
  isPublic: boolean;
}

interface Vouch {
  fromAddress: string;
  fromScore: number;
  amount?: number;
  message?: string;
  createdAt: Date;
}
```

### B2B Integration (Future)

```typescript
interface PoolIntegration {
  id: string;
  poolId: string;
  apiKey: string;
  apiSecretHash: string;
  widgetConfig: {
    primaryColor: string;
    logo?: string;
    allowedOrigins: string[];
  };
  webhookUrl?: string;
  webhookEvents: string[];
  plan: 'starter' | 'growth' | 'enterprise';
  monthlyFee: number;
  stripeCustomerId: string;
}
```

---

## B2B API Endpoints (Future)

```
# Widget for pool owners
GET  /api/v1/widget/config         # Widget configuration
POST /api/v1/widget/quote          # Loan quote for widget

# Analytics
GET  /api/v1/analytics/borrowers   # Borrower analytics
GET  /api/v1/analytics/loans       # Loan analytics
GET  /api/v1/analytics/funnel      # Conversion funnel

# Webhooks
POST /api/v1/webhooks/register     # Register webhook
GET  /api/v1/webhooks              # List webhooks
DELETE /api/v1/webhooks/:id        # Remove webhook
```

---

## Revenue Model (Future)

| Stream | How | Price |
|--------|-----|-------|
| Merchant fees | Fee per checkout loan | 0.5-1% of loan |
| Referral fees | Pool pays for loans routed | 0.1-0.3% of loan |
| B2B API | Pool owners subscribe | $99-499/mo |
| Premium consumer | Advanced features | $9.99/mo |
| Credit reports | Other platforms pay to check | $1-5/check |
| Refinance fees | Fee for executing refinance | 0.1% |
| Insurance affiliate | Nexus Mutual referral | % of premium |

### Projected Unit Economics (At Scale)

```
Monthly Checkout Loans: 5,000
Avg Loan Size: $500
Checkout Volume: $2,500,000

Direct Loans (standalone site): 5,000
Avg Loan Size: $5,000
Direct Volume: $25,000,000

Revenue:
- Merchant fees (0.5%): $12,500
- Referral fees (0.2%): $55,000
- Premium subs (5% @ $10): $5,000
- B2B API (20 pools @ $200): $4,000
- Credit checks: $2,000

Monthly Revenue: ~$78,500
```

---

## Additional Environment Variables (Future)

```bash
# AI (for recommendations)
ANTHROPIC_API_KEY=...

# Notifications
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TELEGRAM_BOT_TOKEN=...

# Payments (for B2B)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Monitoring
SENTRY_DSN=...

# More chains
ETHEREUM_RPC_URL=...
OPTIMISM_RPC_URL=...
POLYGON_RPC_URL=...
```

---

## Success Metrics

### Product
- Widget impressions per day
- Checkout loans completed
- Conversion rate (widget open → loan)
- Direct loans originated
- Credit scores generated
- Liquidations prevented

### Business
- Monthly loan volume
- Revenue per loan
- Merchant signups
- B2B API subscribers
- Premium conversions
- User retention (30/60/90)

### User Outcomes
- Avg interest saved vs going direct
- Liquidation rate (target: < 1%)
- On-time payment rate
- Credit score improvement over time
