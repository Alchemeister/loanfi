# LoanFi - DeFi Checkout Widget

## What This Is

A "Pay with Klarna" button for crypto checkouts. Merchants embed the widget, users see loan options from DeFi pools (Aave, Compound), pick their terms, and complete purchase with borrowed funds.

**You're not the lender.** Aave/Compound are. You're the aggregator that makes borrowing easy at checkout.

```
┌────────────────────────────────────────────────────────┐
│  NFT Checkout                                          │
│  Total: $500 USDC                                      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pay with LoanFi                                 │  │
│  │                                                  │  │
│  │  ○ Aave    4.2% APR   $173/mo × 3 months        │  │
│  │  ● Aave    8.0% APR   $65/mo × 8 months         │  │
│  │  ○ Compound 5.1% APR  $128/mo × 4 months        │  │
│  │                                                  │  │
│  │  Collateral: 0.25 ETH ($475)                    │  │
│  │  Health Factor: 1.8 (Safe)                      │  │
│  │                                                  │  │
│  │  [Connect Wallet & Pay]                         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**Flow:**
1. User at checkout, clicks "Pay with LoanFi"
2. Widget shows loan options (different pools, different terms)
3. User picks option, connects wallet
4. Single transaction: deposit collateral → borrow → pay merchant
5. User pays back monthly to the pool

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Framework | Next.js 14 (App Router) | Full-stack, API routes built-in |
| Widget | React + iframe | Isolated, easy to embed |
| Database | PostgreSQL | Track loans, merchants |
| Cache | Redis | Rate caching |
| Blockchain | Viem + Wagmi | Modern, type-safe |
| Wallet | RainbowKit | Easy connection |
| Styling | Tailwind CSS | Fast iteration |
| Target Chains | Base, Arbitrum | Low gas, Aave V3 deployed |
| Hosting | Vercel + Railway | Frontend + DB/Redis |

## Project Structure

```
/defi-loan-aggregator
  /src
    /app
      /page.tsx                 # Landing/docs for merchants
      /widget/page.tsx          # The embeddable widget
      /dashboard/page.tsx       # Merchant dashboard
      /api
        /widget
          /init/route.ts        # Initialize widget session
          /options/route.ts     # Get loan options
          /execute/route.ts     # Execute borrow + pay
        /merchants
          /route.ts             # Merchant CRUD
        /pools
          /route.ts             # Pool data
        /prices
          /route.ts             # Token prices
    /components
      /widget                   # Widget UI components
        /LoanOptions.tsx
        /CollateralInput.tsx
        /WalletConnect.tsx
        /HealthFactor.tsx
    /lib
      /blockchain
        /aave.ts                # Aave interactions
        /compound.ts            # Compound interactions
        /multicall.ts           # Batch transactions
        /prices.ts              # Price feeds
      /db
      /utils
    /types
  /prisma
    /schema.prisma
  /public
    /widget.js                  # Embed script for merchants
  .env.local
  package.json
```

## How Merchants Integrate

```html
<!-- Merchant adds this to their checkout page -->
<script src="https://loanfi.xyz/widget.js"></script>

<div
  id="loanfi-widget"
  data-merchant-id="merch_abc123"
  data-amount="500"
  data-token="USDC"
  data-recipient="0x1234...abcd"
></div>

<script>
  LoanFi.init({
    onSuccess: (txHash) => {
      // Payment complete, fulfill order
      console.log('Paid via loan:', txHash);
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    }
  });
</script>
```

## Core Data Models

```typescript
// Supported chains
type Chain = 'base' | 'arbitrum';

// A merchant using the widget
interface Merchant {
  id: string;
  name: string;
  walletAddress: string;          // Where payments go
  apiKey: string;
  allowedOrigins: string[];       // CORS whitelist
  createdAt: Date;
}

// A lending pool
interface LendingPool {
  id: string;
  name: string;                   // "Aave V3"
  chain: Chain;
  contractAddress: string;
  borrowAPR: number;              // Current variable rate
  minCollateralRatio: number;     // e.g., 1.5 = 150%
  liquidationThreshold: number;
  supportedCollateral: string[];  // ['ETH', 'WETH', 'WBTC']
  supportedBorrow: string[];      // ['USDC', 'USDT', 'DAI']
}

// A loan option shown in widget
interface LoanOption {
  pool: LendingPool;
  borrowAmount: number;
  borrowToken: string;
  termMonths: number;             // 3, 6, 8, 12
  apr: number;                    // Effective APR for this term
  monthlyPayment: number;
  totalRepayment: number;
  collateralToken: string;
  collateralAmount: number;
  collateralValueUSD: number;
  healthFactor: number;
  liquidationPrice: number;
}

// Widget initialization params
interface WidgetParams {
  merchantId: string;
  amount: number;                 // Payment amount
  token: string;                  // Payment token (USDC, etc.)
  recipient: string;              // Merchant wallet
  chain?: Chain;
  collateralToken?: string;       // User's preferred collateral
}

// A completed loan (for tracking repayments)
interface Loan {
  id: string;

  // Parties
  borrowerAddress: string;
  merchantId: string;
  merchantAddress: string;

  // Loan details
  poolId: string;
  chain: Chain;
  principalAmount: number;
  principalToken: string;
  termMonths: number;
  apr: number;
  monthlyPayment: number;

  // Collateral
  collateralAmount: number;
  collateralToken: string;

  // Status
  currentDebt: number;
  healthFactor: number;
  status: 'active' | 'repaid' | 'liquidated';

  // Transactions
  borrowTxHash: string;
  paymentTxHash: string;          // Payment to merchant

  createdAt: Date;
}
```

## API Routes

```
# Widget
POST /api/widget/init             # Start widget session
POST /api/widget/options          # Get loan options for amount
POST /api/widget/execute          # Execute borrow + payment

# Merchants
POST /api/merchants               # Register merchant
GET  /api/merchants/:id           # Get merchant details
GET  /api/merchants/:id/loans     # Merchant's processed loans

# Pool data
GET  /api/pools                   # List pools with rates
GET  /api/pools/:id               # Single pool

# Prices
GET  /api/prices                  # Current token prices

# User loans (optional - for repayment tracking)
GET  /api/loans                   # User's active loans
GET  /api/loans/:id               # Loan details
```

## Widget Session Flow

```typescript
// 1. Widget loads, calls init
POST /api/widget/init
{
  merchantId: "merch_abc123",
  amount: 500,
  token: "USDC",
  recipient: "0x1234...abcd"
}
// Returns: sessionId, merchant verified

// 2. User selects collateral, get options
POST /api/widget/options
{
  sessionId: "sess_xyz",
  collateralToken: "ETH",
  collateralAmount: 0.3
}
// Returns: array of LoanOption with different terms

// 3. User picks option, connects wallet, execute
POST /api/widget/execute
{
  sessionId: "sess_xyz",
  optionId: "opt_123",
  borrowerAddress: "0xuser..."
}
// Returns: transaction data to sign

// 4. User signs in wallet, tx executes:
//    - Deposit collateral to pool
//    - Borrow from pool
//    - Send borrowed funds to merchant
//    All in one multicall
```

## Key Calculations

```typescript
// Monthly payment with different term lengths
function calculateMonthlyPayment(
  principal: number,
  aprDecimal: number,
  months: number
): number {
  const monthlyRate = aprDecimal / 12;
  if (monthlyRate === 0) return principal / months;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months))
    / (Math.pow(1 + monthlyRate, months) - 1);
}

// Generate options with different terms
function generateLoanOptions(
  amount: number,
  collateral: { token: string; amount: number; priceUSD: number },
  pool: LendingPool
): LoanOption[] {
  const terms = [3, 6, 8, 12]; // months
  const collateralValueUSD = collateral.amount * collateral.priceUSD;

  return terms.map(months => {
    // Longer terms might have slightly higher APR (simplified)
    const termAdjustment = 1 + (months - 3) * 0.005;
    const effectiveAPR = pool.borrowAPR * termAdjustment;
    const monthlyPayment = calculateMonthlyPayment(amount, effectiveAPR, months);

    return {
      pool,
      borrowAmount: amount,
      borrowToken: 'USDC',
      termMonths: months,
      apr: effectiveAPR,
      monthlyPayment,
      totalRepayment: monthlyPayment * months,
      collateralToken: collateral.token,
      collateralAmount: collateral.amount,
      collateralValueUSD,
      healthFactor: calculateHealthFactor(collateralValueUSD, amount, pool.liquidationThreshold),
      liquidationPrice: calculateLiquidationPrice(collateral.amount, amount, pool.liquidationThreshold),
    };
  });
}

// Health factor
function calculateHealthFactor(
  collateralValueUSD: number,
  debtValueUSD: number,
  liquidationThreshold: number
): number {
  return (collateralValueUSD * liquidationThreshold) / debtValueUSD;
}

// Liquidation price
function calculateLiquidationPrice(
  collateralAmount: number,
  debtValueUSD: number,
  liquidationThreshold: number
): number {
  return debtValueUSD / (collateralAmount * liquidationThreshold);
}
```

## Multicall Transaction

The key is executing everything in one transaction:

```typescript
import { encodeFunctionData } from 'viem';

async function buildBorrowAndPayTransaction(
  params: {
    pool: LendingPool;
    borrower: string;
    collateralToken: string;
    collateralAmount: bigint;
    borrowToken: string;
    borrowAmount: bigint;
    recipient: string; // Merchant
  }
) {
  // For Aave V3, we need to:
  // 1. Approve collateral spend
  // 2. Supply collateral
  // 3. Borrow
  // 4. Transfer to merchant

  // Using a multicall contract or Aave's batch features
  const calls = [
    // Supply collateral
    {
      target: params.pool.contractAddress,
      data: encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'supply',
        args: [params.collateralToken, params.collateralAmount, params.borrower, 0],
      }),
    },
    // Borrow
    {
      target: params.pool.contractAddress,
      data: encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'borrow',
        args: [params.borrowToken, params.borrowAmount, 2, 0, params.borrower],
      }),
    },
    // Transfer to merchant
    {
      target: params.borrowToken,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [params.recipient, params.borrowAmount],
      }),
    },
  ];

  return calls;
}
```

## Environment Variables

```bash
# Database (Railway)
DATABASE_URL=postgresql://...

# Redis (Railway)
REDIS_URL=redis://...

# Blockchain RPC (Alchemy)
ALCHEMY_API_KEY=...
NEXT_PUBLIC_ALCHEMY_ID=...

# Wallet Connection
NEXT_PUBLIC_WALLETCONNECT_ID=...

# Widget
NEXT_PUBLIC_WIDGET_URL=https://loanfi.xyz

# Chain
NEXT_PUBLIC_DEFAULT_CHAIN=base
```

## Git Workflow

```bash
# Two branches: main (prod) and dev
git checkout dev
# make changes
git add . && git commit -m "feat: add 8-month term option"
git push origin dev

# When ready
git checkout main
git merge dev
git push origin main
```

---

## Security

### Core Principles

#### 1. Verify Merchant on Every Widget Request

```typescript
export async function POST(req: Request) {
  const { merchantId, origin } = await req.json();

  const merchant = await db.merchant.findUnique({ where: { id: merchantId } });

  if (!merchant) {
    return Response.json({ error: 'Invalid merchant' }, { status: 401 });
  }

  // Verify request origin is whitelisted
  if (!merchant.allowedOrigins.includes(origin)) {
    return Response.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  // Proceed
}
```

#### 2. Validate Recipient Address Matches Merchant

```typescript
// CRITICAL: Never let widget params override merchant's wallet
export async function POST(req: Request) {
  const { sessionId, optionId } = await req.json();

  const session = await getSession(sessionId);
  const merchant = await getMerchant(session.merchantId);

  // Payment ALWAYS goes to merchant's registered wallet
  // NOT the recipient param from widget init
  const recipient = merchant.walletAddress;

  // Build transaction with verified recipient
}
```

#### 3. Keep Secrets Server-Side

```typescript
// BAD - API key in widget
const provider = new JsonRpcProvider(
  `https://base-mainnet.g.alchemy.com/v2/${EXPOSED_KEY}`
);

// GOOD - Widget calls your API, server holds keys
// Widget:
const options = await fetch('/api/widget/options', { body: params });

// Server:
const provider = new JsonRpcProvider(
  `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
);
```

#### 4. Server-Side Financial Calculations

```typescript
// NEVER trust client-calculated values
// Widget sends: amount, collateral
// Server calculates: health factor, liquidation price, monthly payment

export async function POST(req: Request) {
  const { collateralAmount, collateralToken } = await req.json();

  // Get price from oracle, not from request
  const price = await getOraclePrice(collateralToken);
  const collateralValueUSD = collateralAmount * price;

  // Server calculates everything
  const healthFactor = calculateHealthFactor(collateralValueUSD, borrowAmount, 0.8);

  // Return calculated values
}
```

#### 5. Input Validation

```typescript
import { z } from 'zod';

const WidgetInitSchema = z.object({
  merchantId: z.string().startsWith('merch_'),
  amount: z.number().positive().max(1_000_000),
  token: z.enum(['USDC', 'USDT', 'DAI']),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

const WidgetOptionsSchema = z.object({
  sessionId: z.string().startsWith('sess_'),
  collateralToken: z.enum(['ETH', 'WETH', 'WBTC']),
  collateralAmount: z.number().positive(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = WidgetInitSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
}
```

#### 6. Rate Limiting Per Merchant

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

export async function POST(req: Request) {
  const { merchantId } = await req.json();

  // Rate limit per merchant
  const { success } = await ratelimit.limit(`merchant:${merchantId}`);

  if (!success) {
    return Response.json({ error: 'Rate limited' }, { status: 429 });
  }
}
```

#### 7. User Signs All Transactions

```typescript
// Server builds transaction, user signs
export async function POST(req: Request) {
  const txData = await buildBorrowAndPayTransaction(params);

  // Return unsigned transaction
  return Response.json({
    to: txData.to,
    data: txData.data,
    value: txData.value,
    chainId: txData.chainId,
    // User signs in their wallet
  });
}
```

#### 8. Session Expiry

```typescript
// Widget sessions expire after 15 minutes
interface WidgetSession {
  id: string;
  merchantId: string;
  amount: number;
  token: string;
  recipient: string;
  expiresAt: Date; // 15 minutes from creation
}

export async function POST(req: Request) {
  const session = await getSession(sessionId);

  if (new Date() > session.expiresAt) {
    return Response.json({ error: 'Session expired' }, { status: 410 });
  }
}
```

#### 9. Multi-Oracle Price Feeds

```typescript
async function getPrice(token: string): Promise<{ price: number; confidence: string }> {
  const [chainlink, coingecko] = await Promise.all([
    getChainlinkPrice(token),
    getCoingeckoPrice(token),
  ]);

  const deviation = Math.abs(chainlink - coingecko) / chainlink;

  if (deviation > 0.05) {
    console.warn(`Price deviation for ${token}: ${deviation * 100}%`);
    return { price: chainlink, confidence: 'low' };
  }

  return { price: chainlink, confidence: 'high' };
}
```

#### 10. Error Handling

```typescript
export async function POST(req: Request) {
  try {
    const result = await processWidgetRequest(req);
    return Response.json(result);
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`Error ${errorId}:`, error);

    // Generic message to client
    return Response.json(
      { error: 'Something went wrong', errorId },
      { status: 500 }
    );
  }
}
```

### Security Checklist

Before deploying:

- [ ] Merchant ID verified on every widget request
- [ ] Payment recipient always from merchant record, never from params
- [ ] ALCHEMY_API_KEY is server-side only
- [ ] All financial calculations done server-side
- [ ] All inputs validated with Zod
- [ ] Rate limiting per merchant
- [ ] Widget sessions expire after 15 minutes
- [ ] User signs all transactions (server never holds keys)
- [ ] Multi-oracle price feeds
- [ ] Error messages don't leak details
- [ ] Widget served from your domain only (CORS)
- [ ] HTTPS enforced

---

## Development Commands

```bash
npm install
npm run dev

# Database
npx prisma migrate dev
npx prisma studio

# Type checking
npm run typecheck

# Linting
npm run lint
```

## MVP Features (In Order)

1. **Merchant registration** - API key, wallet address, allowed origins
2. **Pool data fetching** - Aave/Compound rates on Base
3. **Widget UI** - Show loan options with different terms
4. **Loan option calculation** - Monthly payments for 3/6/8/12 months
5. **Wallet connection** - RainbowKit in widget
6. **Transaction building** - Multicall: collateral → borrow → pay merchant
7. **Transaction execution** - User signs, payment completes

See ROADMAP.md for future features (standalone site, credit scores, P2P, B2B API).
