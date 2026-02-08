# Database Setup Instructions

This document outlines how to set up the PostgreSQL database for LoanFi.

## Prerequisites

1. **PostgreSQL 14+** installed locally or use a cloud provider:
   - [Railway](https://railway.app/) (Recommended - free tier available)
   - [Supabase](https://supabase.com/)
   - [Neon](https://neon.tech/)
   - Local PostgreSQL

2. **Node.js 18+** and npm/pnpm/yarn

## Setup Steps

### 1. Install Dependencies

```bash
cd /root/clawd/loanfi
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your database URL
```

For Railway:
```env
DATABASE_URL="${{Postgres.DATABASE_URL}}"
```

For local PostgreSQL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/loanfi"
```

### 3. Run Database Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# You'll be prompted to name the migration
# Name it: "init"
```

### 4. Seed the Database

```bash
npm run db:seed
```

This will create:
- 2 lending pools (Aave V3, Compound V3)
- 1 demo merchant
- Token prices

### 5. Verify Setup

```bash
# Open Prisma Studio to view data
npm run db:studio
```

Visit: http://localhost:5555

You should see:
- Merchants (1 demo)
- LendingPools (2)
- TokenPrices (7)

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma Client from schema |
| `npm run db:migrate` | Run migrations in development |
| `npm run db:migrate:prod` | Run migrations in production |
| `npm run db:studio` | Open Prisma Studio (GUI) |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:reset` | Reset database (⚠️ deletes all data) |

## Schema Changes

When you modify `prisma/schema.prisma`:

1. Update the schema file
2. Run: `npm run db:migrate`
3. Name your migration descriptively (e.g., "add_credit_score")
4. Run: `npm run db:generate` to update the client

## Production Deployment

### Railway (Recommended)

1. Create a Railway account
2. Create a new project
3. Add a PostgreSQL database
4. Deploy your code (GitHub integration)
5. Railway automatically sets `DATABASE_URL`
6. Run: `npm run db:migrate:prod`
7. Run: `npm run db:seed`

### Manual Production Setup

1. Set `NODE_ENV=production`
2. Set `DATABASE_URL` to your production database
3. Run: `npm run db:migrate:prod`
4. Run: `npm run db:seed`
5. Never run `db:reset` in production!

## Troubleshooting

### Connection Error
```
Error: P1001: Can't reach database server
```
- Check your `DATABASE_URL` is correct
- Ensure database server is running
- Check firewall/network settings

### Migration Error
```
Error: P3005: The database schema is not empty
```
- For local dev: `npm run db:reset`
- For production: Use `db:migrate:prod` instead

### Prisma Client Error
```
Error: @prisma/client did not initialize yet
```
- Run: `npm run db:generate`
- Or: `npm install` (runs postinstall hook)

## Data Model Overview

See `prisma/schema.prisma` for full details.

Key entities:
- **Merchant**: Businesses using the widget
- **LendingPool**: Aave/Compound pools
- **WidgetSession**: Temporary checkout sessions
- **Loan**: Completed loans
- **Repayment**: Individual payment records
- **TokenPrice**: Cached token prices
- **AuditLog**: Security/event logging

## Next Steps

After database setup:
1. Set up blockchain RPC connections (Alchemy)
2. Configure WalletConnect
3. Set up Redis (optional but recommended)
4. Deploy to production
