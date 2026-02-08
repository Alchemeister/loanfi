# LoanFi - DeFi Checkout Widget

A "Pay with Klarna" button for crypto checkouts. Merchants embed the widget, users see loan options from DeFi pools (Aave, Compound), pick their terms, and complete purchase with borrowed funds.

## Features

- ✅ **Real-time loan options** - Fetch live rates from Aave & Compound
- ✅ **Embeddable widget** - Simple JavaScript snippet for merchants
- ✅ **Multi-chain support** - Base, Arbitrum, Ethereum, Polygon, Optimism
- ✅ **Admin CLI** - Manage merchants, pools, loans, reports
- ✅ **Live price feeds** - Chainlink + CoinGecko aggregation
- ✅ **Secure transactions** - User signs, server builds

## Quick Start

```bash
# 1. Clone and enter directory
cd /root/clawd/loanfi

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local.example .env.local
# Edit .env.local with your values

# 4. Set up database
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Validate setup
npm run setup:check

# 6. Start development
npm run dev
```

Visit: http://localhost:3000

## Documentation

| Phase | Status | Description |
|-------|--------|-------------|
| [Phase 1](prisma/SETUP.md) | ✅ | Database setup (PostgreSQL + Prisma) |
| [Phase 2](ENV_SETUP.md) | ✅ | Environment configuration |
| [Phase 3](PHASE3.md) | ✅ | Real blockchain integration |
| [Phase 4](PHASE4.md) | ✅ | CLI admin tools |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/widget/init` | POST | Initialize checkout session |
| `/api/widget/options` | POST | Get loan options |
| `/api/widget/execute` | POST | Build borrow+pay transaction |
| `/api/pools` | GET | List lending pools |
| `/api/prices` | GET | Token prices |
| `/api/merchants` | GET/POST | Merchant management |

## CLI Usage

```bash
# Merchant management
npm run cli -- merchant:create --name "Store" --wallet 0x... --origin https://...
npm run cli -- merchant:list
npm run cli -- merchant:show --id merch_abc123

# Loan operations
npm run cli -- loan:list
npm run cli -- loan:stats
npm run cli -- loan:show --id loan_xyz789

# Price feeds
npm run cli -- price:update
npm run cli -- price:show

# Reports
npm run cli -- report:daily
npm run cli -- report:merchant --id merch_abc123

# Database
npm run cli -- db:seed
npm run cli -- db:studio
```

## Widget Integration

```html
<script src="https://loanfi.xyz/widget.js"></script>

<div
  id="loanfi-widget"
  data-merchant-id="merch_abc123"
  data-amount="500"
  data-token="USDC"
  data-recipient="0x742d35..."
></div>

<script>
  LoanFi.init({
    onSuccess: (txHash) => console.log('Paid:', txHash),
    onError: (error) => console.error('Failed:', error),
  });
</script>
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                         │
│  - Landing page for merchants                               │
│  - Embeddable widget (iframe)                               │
│  - Wallet connection (RainbowKit)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  API Routes (Next.js)                                       │
│  /api/widget/init → options → execute                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Blockchain Layer                                           │
│  - Alchemy RPC (multi-chain)                               │
│  - Aave V3 / Compound V3 integration                       │
│  - Price feeds (Chainlink + CoinGecko)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Data Layer                                                 │
│  - PostgreSQL (Prisma ORM)                                 │
│  - Session cache (Redis optional)                          │
│  - Audit logging                                           │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma |
| Blockchain | Viem + Wagmi |
| Wallet | RainbowKit |
| Styling | Tailwind CSS |
| CLI | Commander + Chalk |

## Project Structure

```
loanfi/
├── prisma/              # Database schema & migrations
├── scripts/             # CLI tools
│   ├── cli.ts
│   ├── setup-check.ts
│   └── commands/
├── src/
│   ├── app/            # Next.js app router
│   │   ├── api/        # API routes
│   │   └── widget/     # Embeddable widget
│   ├── lib/
│   │   ├── blockchain/ # Aave, prices, RPC
│   │   ├── config/     # Environment config
│   │   ├── db/         # Database operations
│   │   └── utils/      # Helpers
│   └── types/          # TypeScript types
├── .env.local          # Your secrets (gitignored)
├── package.json
└── README.md
```

## Environment Variables

**Required:**
```env
DATABASE_URL="postgresql://..."
ALCHEMY_API_KEY="your_key"
NEXT_PUBLIC_WALLETCONNECT_ID="your_id"
```

**Optional:**
```env
REDIS_URL="redis://..."
AAVE_REFERRAL_CODE="1234"
SENTRY_DSN="..."
```

See `.env.local.example` for full list.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run cli` | Run admin CLI |
| `npm run setup:check` | Validate configuration |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |

## Development

### Run Tests

```bash
# Setup check
npm run setup:check

# Start dev server
npm run dev
```

### Database Changes

```bash
# Edit prisma/schema.prisma

# Generate migration
npm run db:migrate --name description

# Update client
npm run db:generate
```

### Add CLI Command

1. Edit `scripts/commands/[name].ts`
2. Export function that takes `program: Command`
3. Import in `scripts/cli.ts`
4. Run with `npm run cli -- [command]`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Railway

1. Push to GitHub
2. Create Railway project
3. Add PostgreSQL
4. Deploy

### Manual

```bash
# Build
npm run build

# Start
npm start
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) for full vision.

**Current:** MVP - Checkout Widget  
**Next:** Standalone comparison site, P2P loans, credit scores

## Support

- **Setup issues:** Run `npm run setup:check`
- **Database:** Run `npm run db:studio`
- **CLI help:** Run `npm run cli -- --help`

## License

MIT

---

Built with ❤️ for the DeFi community
