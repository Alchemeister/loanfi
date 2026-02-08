# Phase 4: CLI Tools

**Status:** ✅ COMPLETE

Administrative command-line interface for managing LoanFi.

## Installation

```bash
cd /root/clawd/loanfi
npm install
```

## Usage

```bash
# Show all commands
npm run cli

# Or use directly
npx tsx scripts/cli.ts [command] [options]
```

## Available Commands

### Merchant Management

```bash
# Create new merchant
npm run cli -- merchant:create \
  --name "My Store" \
  --wallet 0x742d35... \
  --origin https://mystore.com \
  --email contact@mystore.com

# List all merchants
npm run cli -- merchant:list

# Show merchant details
npm run cli -- merchant:show --id merch_abc123

# Update merchant
npm run cli -- merchant:update \
  --id merch_abc123 \
  --name "New Store Name" \
  --origin https://newdomain.com

# Deactivate merchant
npm run cli -- merchant:update --id merch_abc123 --deactivate

# Delete merchant (⚠️ destructive)
npm run cli -- merchant:delete --id merch_abc123 --force

# Rotate API key
npm run cli -- merchant:rotate-key --id merch_abc123
```

### Lending Pools

```bash
# List all pools
npm run cli -- pool:list

# Show pool details
npm run cli -- pool:show --id aave-v3-base
```

### Loans

```bash
# List all loans
npm run cli -- loan:list

# Filter by merchant
npm run cli -- loan:list --merchant merch_abc123

# Filter by status
npm run cli -- loan:list --status active

# Show loan details
npm run cli -- loan:show --id loan_xyz789

# Loan statistics
npm run cli -- loan:stats

# Merchant-specific stats
npm run cli -- loan:stats --merchant merch_abc123
```

### Price Feeds

```bash
# Update all prices
npm run cli -- price:update

# Show current prices
npm run cli -- price:show

# Get specific token
npm run cli -- price:get --token ETH
```

### Database

```bash
# Seed with test data
npm run cli -- db:seed

# Open Prisma Studio (GUI)
npm run cli -- db:studio

# Generate Prisma client
npm run cli -- db:generate

# Run migrations
npm run cli -- db:migrate --name add_new_feature

# Reset database (⚠️ deletes everything)
npm run cli -- db:reset --force
```

### Reports

```bash
# Daily report
npm run cli -- report:daily

# Report for specific date
npm run cli -- report:daily --date 2026-02-08

# Merchant performance report
npm run cli -- report:merchant --id merch_abc123
```

## Command Structure

```
loanfi [command] [subcommand] [options]

Commands:
  merchant    Merchant management
  pool        Lending pool management
  loan        Loan operations
  price       Price feed management
  db          Database operations
  report      Generate reports

Options:
  -h, --help     Show help
  -V, --version  Show version
```

## Examples

### Create a New Merchant

```bash
npm run cli -- merchant:create \
  --name "Cool NFT Store" \
  --wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78 \
  --origin https://coolnfts.com \
  --email admin@coolnfts.com
```

Output:
```
🏪 Creating new merchant...

✅ Merchant created successfully!

Merchant Details:
  ID:       merch_a1b2c3d4
  Name:     Cool NFT Store
  Wallet:   0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78
  API Key:  key_abc123def456
  Origins:  https://coolnfts.com
  Status:   Active
  Created:  2/8/2026, 6:45:23 PM

⚠️  Save the API Key securely - it will not be shown again!
```

### View Loan Statistics

```bash
npm run cli -- loan:stats
```

Output:
```
📈 Loan Statistics

Overview:
  Total Loans:       47
  Total Volume:      $234,567
  Total Repayments:  $251,234

By Status:
┌─────────────┬───────┬────────────┐
│ Status      │ Count │ Volume     │
├─────────────┼───────┼────────────┤
│ active      │ 32    │ $156,789   │
│ repaid      │ 14    │ $76,543    │
│ liquidated  │ 1     │ $1,235     │
└─────────────┴───────┴────────────┘
```

### Daily Report

```bash
npm run cli -- report:daily
```

Output:
```
📅 Daily Report: 2026-02-08

Activity:
  Widget Sessions:     156
  Loans Created:       12
  Volume:              $45,678
  Est. Revenue (0.5%): $228.39

Loan Details:
┌────────────────────┬────────────────────┬───────────┬────────────┐
│ ID                 │ Merchant           │ Amount    │ Status     │
├────────────────────┼────────────────────┼───────────┼────────────┤
│ loan_abc123        │ Cool NFT Store     │ $5,000    │ active     │
│ loan_def456        │ DeFi Marketplace   │ $12,000   │ active     │
│ ...                │ ...                │ ...       │ ...        │
└────────────────────┴────────────────────┴───────────┴────────────┘
```

## File Structure

```
scripts/
├── cli.ts                 # Main CLI entry point
├── setup-check.ts         # Setup validation
└── commands/
    ├── merchant.ts        # Merchant commands
    ├── pool.ts           # Pool commands
    ├── loan.ts           # Loan commands
    ├── price.ts          # Price commands
    ├── db.ts             # Database commands
    └── report.ts         # Report commands
```

## Adding New Commands

1. Create file in `scripts/commands/`
2. Export function that takes `program: Command`
3. Import in `scripts/cli.ts`
4. Register with `commandNameCommands(program)`

Example:

```typescript
// scripts/commands/custom.ts
import { Command } from 'commander';

export function customCommands(program: Command) {
  program
    .command('custom')
    .description('Custom command')
    .action(async () => {
      console.log('Running custom command');
    });
}
```

```typescript
// scripts/cli.ts
import { customCommands } from './commands/custom';

customCommands(program);
```

## Dependencies

**CLI Libraries:**
- `commander` - Command parsing
- `chalk` - Terminal colors
- `cli-table3` - Table formatting
- `tsx` - TypeScript execution

## Security

- ✅ CLI runs server-side only
- ✅ Direct database access (Prisma)
- ✅ No sensitive data in logs
- ✅ API keys masked in output

## Troubleshooting

### "Cannot find module"

```bash
# Regenerate Prisma client
npm run db:generate

# Or
npm run cli -- db:generate
```

### "Database connection failed"

```bash
# Check DATABASE_URL in .env.local
npm run setup:check
```

### Command not found

```bash
# Make sure you're in the loanfi directory
cd /root/clawd/loanfi

# Use full command
npm run cli -- [command]
```

## Next Steps

With CLI tools complete, you're ready for:
- **Phase 5:** Production deployment
- Custom automation scripts
- Scheduled reporting (cron jobs)

---

**All Phases Complete!** 🎉

Your LoanFi loan aggregator now has:
- ✅ Database (PostgreSQL + Prisma)
- ✅ Environment configuration
- ✅ Real blockchain integration
- ✅ CLI admin tools

Ready for production deployment! 🚀
