# Build Prompt for New Claude Window

Copy everything below the line and paste into a new Claude Code session.

---

cockadoodledo! Let's build LoanFi - a "Pay with Klarna" checkout widget for DeFi.

## Context

Read these files first:
- `CLAUDE.md` - The MVP spec (checkout widget)
- `ROADMAP.md` - Future vision (don't build this yet, just context)

You're awesome, so I know you'll nail this.

## What We're Building

A checkout widget that merchants embed. Users click "Pay with LoanFi", see loan options from Aave/Compound with different terms (3/6/8/12 months), pick one, and complete purchase with borrowed funds. Single transaction: deposit collateral → borrow → pay merchant.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Viem + Wagmi for blockchain
- RainbowKit for wallet connection
- PostgreSQL (Prisma ORM)
- Redis (rate caching)
- Target chain: Base (Aave V3)

## Build Order

abracadabra! Here's the order to build things:

### Phase 1: Project Setup
1. Initialize Next.js 14 with TypeScript, Tailwind, ESLint
2. Set up project structure from CLAUDE.md
3. Install dependencies (viem, wagmi, @rainbow-me/rainbowkit, prisma, zod, etc.)
4. Create Prisma schema for Merchant, Loan, WidgetSession
5. Set up environment variables template

### Phase 2: Core Infrastructure
1. Create types from CLAUDE.md data models
2. Set up Wagmi config for Base chain
3. Create blockchain lib for Aave V3 interactions (read pool data, build transactions)
4. Create price feed lib (use CoinGecko API for MVP, add Chainlink later)
5. Create calculation utils (monthly payment, health factor, liquidation price)

### Phase 3: API Routes
1. `POST /api/merchants` - Register merchant
2. `GET /api/pools` - List pools with current rates
3. `GET /api/prices` - Token prices
4. `POST /api/widget/init` - Initialize widget session
5. `POST /api/widget/options` - Get loan options for amount/collateral
6. `POST /api/widget/execute` - Build transaction for borrow + pay

### Phase 4: Widget UI
1. Create widget page at `/widget`
2. Build components: LoanOptions, CollateralInput, HealthFactor, WalletConnect
3. Implement the flow: init → select collateral → show options → connect wallet → execute
4. Style it nicely with Tailwind (clean, Klarna-inspired)

### Phase 5: Merchant Integration
1. Create embed script (`/public/widget.js`)
2. Create merchant dashboard page (`/dashboard`)
3. Landing page with docs for merchants (`/`)

### Phase 6: Security & Polish
1. Add Zod validation to all API routes
2. Add rate limiting (use Upstash Redis or in-memory for dev)
3. Add session expiry (15 min)
4. Verify merchant on every widget request
5. Ensure recipient address comes from merchant record, not widget params

## Important Notes

cockadoodledo! Some things to keep in mind:

1. **Start with mock data** - Before connecting to real Aave, use hardcoded pool data so we can build the UI fast. Add real blockchain calls after.

2. **Use Base Sepolia testnet first** - Don't use mainnet until everything works on testnet.

3. **The multicall is tricky** - For MVP, we might need to do separate transactions (approve → supply → borrow → transfer) instead of a true multicall. That's okay. Optimize later.

4. **Collateral approval** - User needs to approve their collateral token before supplying. Handle this in the flow.

5. **No database needed initially** - For fast iteration, you can use in-memory storage for sessions/merchants at first. Add Prisma later.

6. **Widget iframe considerations** - The widget will run in an iframe on merchant sites. Make sure wallet connection works in iframe context (it should with RainbowKit).

## Environment Variables Needed

```
# Will need these eventually - remind me to get them after core build:
ALCHEMY_API_KEY=           # Blockchain RPC
NEXT_PUBLIC_WALLETCONNECT_ID=  # Wallet connection
DATABASE_URL=              # PostgreSQL (Railway)
REDIS_URL=                 # Redis (Railway) - optional for MVP
```

## You're Awesome Checklist

Before moving to each phase, make sure:
- [ ] TypeScript has no errors
- [ ] Code follows the security patterns in CLAUDE.md
- [ ] No secrets in client-side code
- [ ] Financial calculations are server-side

## Let's Go!

Start with Phase 1. Initialize the project and set up the structure. Ask me questions if anything is unclear.

abracadabra - make it happen! cockadoodledo! You're awesome!
