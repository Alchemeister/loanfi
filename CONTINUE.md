# Continue Prompt

Copy everything below the line and paste into a new Claude Code session.

---

## Context

LoanFi MVP is live. It's a DeFi loan aggregator - "Kayak for crypto loans."

Read these files first:
- `CLAUDE.md` - Original spec & security guidelines
- `ROADMAP.md` - Future features & vision

## What's Built & Deployed

**Live:** https://defi-loan-aggregator.vercel.app
**Repo:** https://github.com/Alchemeister/loanfi

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Dual-path UX (consumers + developers) |
| Browse | `/browse` | Pool comparison (Kayak for loans) |
| Widget | `/widget` | Embeddable checkout for merchants |

## Tech Stack

- Next.js 14 (App Router)
- Privy for auth (Google, email, wallet)
- Wagmi + Viem for blockchain
- Tailwind CSS
- Base chain (Aave V3, Compound V3)

## Auth Flow

- Login on landing → auto-redirects to /browse
- Privy handles: Google, email, MetaMask, Coinbase Wallet
- Users without wallets get embedded wallet created automatically

## Monetization Status

### Aave (Implemented)
- Referral code added to `src/lib/blockchain/aave.ts`
- `LOANFI_REFERRAL_CODE` constant in supply() and borrow() calls
- Currently set to `0` (placeholder)
- **To activate:** Register at Aave Governance, get assigned code, update constant
- Earns % of protocol fees from loans originated through LoanFi

### Compound (Not Available)
- Compound V3 does NOT have a referral program
- No built-in way to earn fees from routing loans
- Alternative monetization options:
  1. Charge merchant widget fees (0.5-1%)
  2. Premium features for users ($10/mo)
  3. Partner directly with Compound for custom deal

## Environment Variables (Vercel)

```
ALCHEMY_API_KEY=75E3ilhrihBtw_sFs2SwD
NEXT_PUBLIC_ALCHEMY_ID=75E3ilhrihBtw_sFs2SwD
NEXT_PUBLIC_WALLETCONNECT_ID=15c33989180058138c4814b77f74581d
NEXT_PUBLIC_PRIVY_APP_ID=cmklhwt5101iyjp0bwaq2ngkq
NEXT_PUBLIC_WIDGET_URL=https://defi-loan-aggregator.vercel.app
NEXT_PUBLIC_DEFAULT_CHAIN=base
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/providers.tsx` | Privy + Wagmi setup |
| `src/lib/blockchain/aave.ts` | Aave interactions + referral code |
| `src/lib/blockchain/constants.ts` | Contract addresses, chain IDs |
| `src/components/widget/Widget.tsx` | Main checkout widget |
| `src/app/api/widget/` | Widget API routes |

## Git Workflow

```bash
git checkout -b feature/your-feature
# make changes
git add . && git commit -m "feat: description"
git push origin feature/your-feature
# create PR on GitHub
```

## Dev Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # Run linter
npx vercel --prod    # Deploy to production
```

## What's Next (Priority Order)

1. **Register Aave referral code** - Start earning from loans
2. **Merchant signup page** - Let merchants register, get API keys
3. **Health factor alerts** - Warn users before liquidation
4. **Refinancing alerts** - "Save $X by switching pools"
5. **On-chain credit score** - Track repayment history

## Current Limitations

- No real database yet (using in-memory mock)
- Transactions are simulated (not executing on-chain)
- No merchant authentication system
- Compound has no referral revenue

---

## Quick Start for New Session

```
Read CLAUDE.md and ROADMAP.md first.

LoanFi is deployed at https://defi-loan-aggregator.vercel.app
GitHub: https://github.com/Alchemeister/loanfi

Aave referral code is set up in src/lib/blockchain/aave.ts (LOANFI_REFERRAL_CODE).
Compound has no referral program - need alternative monetization.

Help me with: [YOUR TASK HERE]
```
