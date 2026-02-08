# LoanFi Deployment Guide

## Option 1: Vercel (Recommended - Easiest)

### Step 1: Prepare for Deployment

```bash
cd /root/clawd/loanfi

# Make sure everything is committed
git status

# Build locally to test
npm run build
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Step 3: Set Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all from `.env.local`:

```
DATABASE_URL=your_production_db_url
ALCHEMY_API_KEY=your_key
NEXT_PUBLIC_WALLETCONNECT_ID=your_id
NEXT_PUBLIC_WIDGET_URL=https://your-domain.vercel.app
AAVE_REFERRAL_CODE=your_code
```

### Step 4: Database Setup

Option A: Vercel Postgres (easiest)
```
# In Vercel Dashboard
# Storage → Create Database → Vercel Postgres
# It auto-sets DATABASE_URL
```

Option B: Railway PostgreSQL
```
# Create project on railway.app
# Add PostgreSQL
# Copy DATABASE_URL to Vercel env vars
```

### Step 5: Run Migrations

```bash
# In Vercel Dashboard
# Go to Project → Deployments
# Click "..." on latest deployment → "Redeploy"
# Or run locally with prod DB:
DATABASE_URL=your_prod_url npx prisma migrate deploy
```

---

## Option 2: Railway (Best for Database + App Together)

### Step 1: Push to GitHub

Already done! Repo is at:
`https://github.com/Alchemeister/loanfi`

### Step 2: Deploy on Railway

1. Go to https://railway.app/
2. New Project → Deploy from GitHub repo
3. Select `Alchemeister/loanfi`
4. Add PostgreSQL: New → Database → Add PostgreSQL
5. Railway auto-sets `DATABASE_URL`

### Step 3: Add Environment Variables

In Railway Dashboard:
- Project Settings → Variables
- Add:
  - `ALCHEMY_API_KEY`
  - `NEXT_PUBLIC_WALLETCONNECT_ID`
  - `AAVE_REFERRAL_CODE`
  - `NEXT_PUBLIC_WIDGET_URL` (your railway domain)

### Step 4: Deploy

Railway auto-deploys on every push to main!

### Step 5: Seed Database

```bash
# Railway CLI
railway login
railway link
railway run npm run db:seed
```

---

## Option 3: Self-Hosted (Advanced)

### Requirements
- Server with Node.js 18+
- PostgreSQL
- Domain + SSL

### Setup

```bash
# On server
git clone https://github.com/Alchemeister/loanfi.git
cd loanfi
npm install

# Set env vars
export DATABASE_URL=...
export ALCHEMY_API_KEY=...
# ... etc

# Database
npm run db:migrate
npm run db:seed

# Build
npm run build

# Start
npm start
```

Use PM2 for process management:
```bash
npm i -g pm2
pm2 start npm --name "loanfi" -- start
pm2 save
pm2 startup
```

---

## Post-Deployment Checklist

- [ ] App loads at domain
- [ ] Database connected
- [ ] API routes work
- [ ] Widget loads
- [ ] Test transaction flow
- [ ] SSL certificate active
- [ ] Environment variables set

## Domain Setup

### Vercel
```
# Add custom domain
# Project Settings → Domains
# Add: loanfi.yourdomain.com
# Follow DNS instructions
```

### Railway
```
# Project Settings → Domains
# Generate domain or add custom
# Follow DNS instructions
```

## Monitoring

Add Sentry for error tracking:
```env
SENTRY_DSN=your_sentry_dsn
```

## Cost Estimates

| Platform | Database | Hosting | Total/Month |
|----------|----------|---------|-------------|
| Vercel | $0 (free tier) | $0 (free tier) | $0 |
| Railway | $5 | $5 | $10 |
| Self-hosted | $5 (VPS) | $5 (VPS) | $10 |

Free tiers usually sufficient for MVP!

## Next Steps After Deploy

1. **Create first merchant** via CLI
2. **Test widget** on a test page
3. **Post to Moltbook** to get Bankr agents using it
4. **Monitor logs** for any issues
5. **Scale up** as usage grows

---

## Troubleshooting

### Build fails
```bash
# Check for TypeScript errors
npm run build

# Fix any type errors
```

### Database connection fails
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check if migrations ran
npx prisma migrate status
```

### API returns 500
```bash
# Check Vercel/Railway logs
# Look for missing env vars
```

---

**Recommendation:** Start with Vercel (free, fast, easy). Move to Railway if you need more control.
