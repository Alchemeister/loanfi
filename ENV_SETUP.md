# Environment Setup Guide

This guide walks you through configuring all required environment variables for LoanFi.

## Quick Start Checklist

- [ ] Database (PostgreSQL) URL
- [ ] Alchemy API Key
- [ ] WalletConnect Project ID
- [ ] Run `npm run setup:check`

## Step-by-Step Setup

### 1. Database (Required)

You need a PostgreSQL database. Choose one:

#### Option A: Supabase (Recommended for Production)

1. Go to https://supabase.com/
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI tab)
5. Replace `[YOUR-PASSWORD]` with your actual password

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

**Note:** Use the direct connection string, not the pooler for migrations.

#### Option B: Railway (Easiest)

1. Go to https://railway.app/
2. Create new project → Add PostgreSQL
3. Railway auto-sets `DATABASE_URL`
4. Just use: `DATABASE_URL="${{Postgres.DATABASE_URL}}"`

#### Option C: Local PostgreSQL

```bash
# Install PostgreSQL (Mac)
brew install postgresql
brew services start postgresql

# Create database
createdb loanfi
```

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/loanfi"
```

---

### 2. Alchemy API Key (Required)

For blockchain RPC connections.

1. Go to https://dashboard.alchemy.com/
2. Sign up / Log in
3. Click **"Create new app"**
4. Name: "LoanFi"
5. Chain: Base
6. Network: Base Mainnet
7. Copy the **API Key**

```env
ALCHEMY_API_KEY="your_actual_api_key_here"
```

**Free tier:** 300M compute units/month (plenty for development)

---

### 3. WalletConnect Project ID (Required)

For wallet connections.

1. Go to https://cloud.walletconnect.com/
2. Sign up / Log in
3. Click **"Create Project"**
4. Name: "LoanFi"
5. Copy the **Project ID**

```env
NEXT_PUBLIC_WALLETCONNECT_ID="your_project_id_here"
```

**Free tier:** Unlimited connections

---

### 4. Configure .env.local

Copy the example file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your values:

```env
# Required
DATABASE_URL="your_database_url"
ALCHEMY_API_KEY="your_alchemy_key"
NEXT_PUBLIC_WALLETCONNECT_ID="your_walletconnect_id"

# Development URLs
NEXT_PUBLIC_WIDGET_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

### 5. Validate Setup

Run the setup checker:

```bash
npm run setup:check
```

You'll see output like:

```
╔═══════════════════════════════════════════════════╗
║         LoanFi Setup Validation                   ║
╚═══════════════════════════════════════════════════╝

🔧 Checking Environment Variables...

✅ DATABASE_URL is set (postgresql://postg...)
✅ ALCHEMY_API_KEY is set (abc123...)
✅ NEXT_PUBLIC_WALLETCONNECT_ID is set (xyz789...)

📊 Checking Database...

✅ Database connection successful
✅ Database has 9 tables (migrations applied)
✅ Database has 1 merchant(s) (seeded)
✅ Database has 2 lending pool(s) (seeded)

⛓️  Checking Blockchain Connection...

✅ Base mainnet connected (block #12,345,678)
✅ Aave V3 Pool contract exists on Base

═══════════════════════════════════════════════════

✅ Passed: 12
⚠️  Warnings: 0
❌ Failed: 0

═══════════════════════════════════════════════════

🎉 Setup complete! Everything looks good.
```

---

## Optional Configurations

### Redis (Rate Limiting)

**Recommended for production** to prevent API abuse.

1. Go to https://upstash.com/
2. Create a Redis database
3. Copy the **Redis URL**

```env
REDIS_URL="***REMOVED_SECRET***"
```

### Aave Referral Code

Earn % of protocol fees from loans you originate.

1. Register at: https://governance.aave.com/
2. Apply for referral program
3. Get your referral code

```env
AAVE_REFERRAL_CODE="1234"
```

Without this, you earn $0 from Aave protocol fees.

### Sentry (Error Tracking)

Track errors in production.

1. Go to https://sentry.io/
2. Create a project
3. Copy the **DSN**

```env
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
```

---

## Environment Variables Reference

### Required

| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Supabase/Railway/Local | PostgreSQL connection |
| `ALCHEMY_API_KEY` | Alchemy Dashboard | Blockchain RPC |
| `NEXT_PUBLIC_WALLETCONNECT_ID` | WalletConnect Cloud | Wallet connections |

### Recommended

| Variable | Source | Purpose |
|----------|--------|---------|
| `REDIS_URL` | Upstash | Rate limiting |
| `AAVE_REFERRAL_CODE` | Aave Governance | Earn protocol fees |
| `SENTRY_DSN` | Sentry | Error tracking |

### Optional

| Variable | Source | Purpose |
|----------|--------|---------|
| `SENDGRID_API_KEY` | SendGrid | Email notifications |
| `STRIPE_SECRET_KEY` | Stripe | B2B billing |
| `ANTHROPIC_API_KEY` | Anthropic | AI features |

---

## Troubleshooting

### "DATABASE_URL is required"

```bash
# Check if .env.local exists
ls -la .env.local

# Create from example
cp .env.local.example .env.local

# Edit and add your DATABASE_URL
nano .env.local
```

### "Database connection failed"

```bash
# For Supabase: Check if password has special characters
# If so, URL-encode them:
# @ → %40
# # → %23
# etc.

# Test connection
psql "your_database_url"
```

### "Blockchain connection failed"

```bash
# Check Alchemy key is correct
# Test in browser:
# https://base-mainnet.g.alchemy.com/v2/YOUR_KEY

# Should return JSON, not an error
```

### Setup check shows warnings

Warnings are OK - the app will still run. Warnings typically mean:
- Redis not configured (rate limiting disabled)
- Sentry not configured (error tracking disabled)
- Aave referral code not set (missing fee revenue)

These are optional for development.

---

## Production Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Railway

1. Push code to GitHub
2. Create new project from GitHub repo
3. Add PostgreSQL (auto-sets DATABASE_URL)
4. Add other env vars manually
5. Deploy

### Manual Server

```bash
# Set NODE_ENV
export NODE_ENV=production

# Run migrations
npm run db:migrate:prod

# Seed if first deploy
npm run db:seed

# Start app
npm start
```

---

## Next Steps

After environment setup:
1. ✅ Phase 1: Database (done)
2. ✅ Phase 2: Environment (done)
3. Phase 3: Real blockchain integration
4. Phase 4: CLI tools
5. Phase 5: Production deployment

Run `npm run setup:check` anytime to verify your configuration.
