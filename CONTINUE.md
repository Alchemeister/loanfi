# Continue Prompt

Copy everything below the line and paste into a new Claude Code session.

---

## Context

LoanFi MVP is built. It's a DeFi loan aggregator - "Kayak for crypto loans."

Read these files:
- `CLAUDE.md` - Original spec
- `ROADMAP.md` - Future features

## What's Built

- `/` - Landing page (consumer + developer paths)
- `/browse` - Pool browser (compare Aave/Compound rates)
- `/widget` - Checkout widget for merchants
- API routes for init, options, execute, merchants, pools, prices
- RainbowKit wallet connection
- Base chain support

## Current Status

**Ready to deploy.** User has:
- WalletConnect Project ID: ✅ (from Reown dashboard)
- Alchemy API Key: Getting it now

## What's Next

1. User needs to paste API keys into `.env.local`:
```
NEXT_PUBLIC_WALLETCONNECT_ID=their_key
ALCHEMY_API_KEY=their_key
NEXT_PUBLIC_ALCHEMY_ID=their_key
```

2. Deploy to Vercel:
```bash
npx vercel
```

3. Add env vars in Vercel dashboard

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Viem + Wagmi + RainbowKit
- Base chain (Aave V3, Compound V3)

## Dev Server

```bash
npm run dev
# http://localhost:3000
```

## Don't Forget

- Server might need restart after env changes
- Test wallet connection after adding real keys
- Use Base Sepolia for testing, Base Mainnet for prod
