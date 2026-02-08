# LoanFi Setup Guide

Complete setup instructions for the LoanFi DeFi loan aggregator.

## Prerequisites

- Node.js 18+ 
- npm, pnpm, or yarn
- Git

## Quick Start (5 minutes)

```bash
# 1. Navigate to project
cd /root/clawd/loanfi

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local.example .env.local
# Edit .env.local with your values (see below)

# 4. Set up database
npm run db:generate
npm run db:migrate
# Name the migration: "init"
npm run db:seed

# 5. Check everything is working
npm run setup:check

# 6. Start development server
npm run dev
```

Visit: http://localhost:3000

## Detailed Setup

### Phase 1: Database (Required)

See: `prisma/SETUP.md`

Choose your database:
- **Supabase** (recommended for production)
- **Railway** (easiest setup)
- **Local PostgreSQL** (development only)

### Phase 2: Environment (Required)

See: `ENV_SETUP.md`

You need 3 API keys:
1. **Database URL** - From Supabase/Railway/Local
2. **Alchemy API Key** - From https://dashboard.alchemy.com/
3. **WalletConnect ID** - From https://cloud.walletconnect.com/

### Phase 3: Validate

```bash
npm run setup:check
```

This checks:
- ✅ All env vars are set
- ✅ Database is connected and migrated
- ✅ Blockchain RPC is working
- ✅ Aave contracts are accessible

### Phase 4: Run

```bash
npm run dev
```

## Project Structure

```
loanfi/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts           # Initial data
│   └── SETUP.md          # Database setup guide
├── scripts/
│   └── setup-check.ts    # Validation script
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/          # API routes
│   │   └── widget/       # Embeddable widget
│   ├── lib/
│   │   ├── config/       # Environment config
│   │   ├── db/           # Database operations
│   │   ├── blockchain/   # Aave/Compound integration
│   │   └── utils/        # Helpers
│   └── types/            # TypeScript types
├── .env.local            # Your secrets (gitignored)
├── .env.local.example    # Template
├── ENV_SETUP.md          # Environment setup guide
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run setup:check` | Validate setup |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio (GUI) |
| `npm run db:seed` | Seed database |
| `npm run db:reset` | ⚠️ Reset database (destructive) |

## API Endpoints

Once running, these endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/widget/init` | POST | Start widget session |
| `/api/widget/options` | POST | Get loan options |
| `/api/widget/execute` | POST | Execute borrow+pay |
| `/api/pools` | GET | List lending pools |
| `/api/prices` | GET | Token prices |
| `/api/merchants` | GET/POST | Merchant management |

## Widget Integration

Merchants embed the widget:

```html
<script src="http://localhost:3000/widget.js"></script>

<div
  id="loanfi-widget"
  data-merchant-id="merch_demo123"
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

## What's Working

✅ **Database:** PostgreSQL with Prisma ORM  
✅ **API:** All widget endpoints implemented  
✅ **Widget:** Embeddable iframe widget  
✅ **Aave Integration:** Transaction building  
✅ **Loan Options:** 3/6/8/12 month terms  
✅ **Security:** Input validation, CORS, session expiry  

## What's Not Working Yet (Phase 3+)

❌ Real blockchain calls (mock data only)  
❌ Actual transaction execution  
❌ Real-time price feeds  
❌ Rate limiting (needs Redis)  
❌ Admin dashboard  
❌ Production deployment  

## Next Phases

- **Phase 3:** Real blockchain integration (RPC, transactions)
- **Phase 4:** CLI tools and admin dashboard
- **Phase 5:** Production deployment
- **Phase 6:** Advanced features (notifications, AI, etc.)

## Support

Run setup check anytime:
```bash
npm run setup:check
```

View database:
```bash
npm run db:studio
```

## Environment Variables

See `.env.local.example` for all options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection
- `ALCHEMY_API_KEY` - Blockchain RPC
- `NEXT_PUBLIC_WALLETCONNECT_ID` - Wallet connections

**Optional:**
- `REDIS_URL` - Rate limiting
- `AAVE_REFERRAL_CODE` - Earn protocol fees
- `SENTRY_DSN` - Error tracking

## Troubleshooting

**"Missing required environment variables"**
→ Copy `.env.local.example` to `.env.local` and fill in values

**"Database connection failed"**
→ Check `DATABASE_URL` is correct and database is running

**"Blockchain connection failed"**
→ Check `ALCHEMY_API_KEY` is valid

**Run the setup checker:**
```bash
npm run setup:check
```

---

**Status:** Phase 1 & 2 Complete ✅  
**Ready for:** Phase 3 - Real Blockchain Integration
