# LoanFi Bug Report & Code Review

**Date:** 2026-02-08
**Status:** Issues Found - Action Required Before Production

## 🐛 CRITICAL BUGS (Must Fix)

### 1. AAVE_POOL_ABI Wrong Address Usage
**File:** `src/lib/blockchain/aave.ts`
**Line:** 73-89 (getAaveBorrowAPR function)

**Issue:** The function uses `AAVE_ADDRESSES_PROVIDER` address directly to call `getReserveData`, but this is the PoolAddressesProvider contract, NOT the Pool contract.

```typescript
// WRONG:
const poolAddress = AAVE_ADDRESSES_PROVIDER[chainName];
const reserveData = await client.readContract({
  address: poolAddress,  // This is the provider, not the pool!
  functionName: 'getReserveData',  // This function is on the Pool, not Provider
});
```

**Fix:** Need to either:
- Call `getPool()` on the PoolAddressesProvider to get actual Pool address
- Or use hardcoded Pool addresses

```typescript
// Aave V3 Pool Addresses (not the provider)
const AAVE_POOL_ADDRESSES: Record<string, Address> = {
  base: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
  arbitrum: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  // ... etc
};
```

### 2. Same Address for DAI and USDT on Base
**File:** `src/lib/blockchain/aave.ts`
**Line:** 55

**Issue:**
```typescript
const TOKEN_ADDRESSES: Record<string, Address> = {
  USDT: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // SAME AS USDT!
```

**Correct DAI address on Base:** `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` is actually DAI, but USDT is `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2`

### 3. getAaveBorrowAPR Using Wrong Contract
**File:** `src/lib/blockchain/aave.ts`
**Line:** 73-93

**Issue:** The function tries to call `getReserveData` which doesn't exist on PoolAddressesProvider. Also, the ABI function signature and return type are incorrect.

**Impact:** This will always fail and fall back to mock 4.2% rate, making the "real" APR feature useless.

## ⚠️ HIGH PRIORITY ISSUES

### 4. Missing Prisma Export in db/index.ts
**File:** `src/lib/db/index.ts`
**Line:** 12

**Issue:** The file exports `prisma` instance, but it's being used with `config.logQueries` which may fail during build if env isn't loaded yet.

**Fix:** Add try/catch or lazy initialization:
```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
```

### 5. Chain Enum Mismatch
**File:** `src/types/index.ts`
**Line:** 4

**Issue:**
```typescript
export type Chain = 'base' | 'arbitrum';
```

But the Prisma schema has:
```prisma
enum Chain {
  base
  arbitrum
  ethereum
  polygon
  optimism
}
```

**Fix:** Add all chains to TypeScript type:
```typescript
export type Chain = 'base' | 'arbitrum' | 'ethereum' | 'polygon' | 'optimism';
```

### 6. Hardcoded Collateral Amount
**File:** `src/app/api/widget/execute/route.ts`
**Line:** 90

**Issue:**
```typescript
const collateralAmount = session.collateralAmount || 0.25; // Always 0.25 ETH fallback
```

This is arbitrary and not based on actual collateral requirements. Should calculate based on loan amount and collateral ratio.

**Fix:** Calculate required collateral:
```typescript
const requiredCollateralUSD = session.amount * pool.minCollateralRatio;
const collateralPrice = await getTokenPrice(collateralToken);
const requiredCollateral = requiredCollateralUSD / collateralPrice.priceUSD;
```

### 7. No Balance Check Before Transaction
**File:** `src/app/api/widget/execute/route.ts`

**Issue:** Never checks if user has sufficient collateral balance before building transaction. User will waste gas on a transaction that will revert.

**Fix:** Add balance check:
```typescript
const balance = await getTokenBalance(session.chain, collateralTokenAddress, borrowerAddress);
if (balance < collateralAmountWei) {
  return Response.json(
    { success: false, error: 'Insufficient collateral balance' },
    { status: 400 }
  );
}
```

## ⚡ MEDIUM PRIORITY ISSUES

### 8. Missing index.ts in lib/config
**File:** Should be `src/lib/config/index.ts`

**Issue:** Importing from `@/lib/config/env` works but best practice is to have an index.ts that re-exports.

### 9. Type Mismatch in Loan Interface
**File:** `src/types/index.ts`
**Line:** 69

**Issue:** `currentDebt` field suggests mutable state, but loans in Aave don't have a "current debt" field that's queryable without knowing the specific debt token. This might be hard to track.

### 10. Widget Session Missing Status Field in Type
**File:** `src/types/index.ts`
**Line:** 40-50

**Issue:** The TypeScript interface doesn't have `status` field, but the database schema does.

**Fix:**
```typescript
export interface WidgetSession {
  id: string;
  merchantId: string;
  amount: number;
  token: string;
  recipient: string;
  chain: Chain;
  status: 'pending' | 'completed' | 'expired';  // MISSING
  expiresAt: Date;
  createdAt: Date;
}
```

## 📝 LOW PRIORITY / RECOMMENDATIONS

### 11. No Rate Limiting on API Routes
**Files:** All API routes in `src/app/api/`

**Issue:** No Redis rate limiting implemented despite the config. API is vulnerable to spam.

### 12. Missing Input Sanitization on Origins
**File:** `src/app/api/widget/init/route.ts`

**Issue:** `allowedOrigins` aren't validated to be proper URLs with protocol.

### 13. No Transaction Simulation
**File:** `src/app/api/widget/execute/route.ts`

**Issue:** Before returning transaction data to user, should simulate the transaction to check for reverts.

### 14. Missing Pool Provider Integration
**File:** `src/lib/blockchain/aave.ts`

**Issue:** The `AAVE_ADDRESSES_PROVIDER` is defined but never used properly. Should implement:
```typescript
async function getPoolAddress(chain: string): Promise<Address> {
  const provider = AAVE_ADDRESSES_PROVIDER[chain];
  const pool = await client.readContract({
    address: provider,
    abi: POOL_ADDRESSES_PROVIDER_ABI,
    functionName: 'getPool',
  });
  return pool;
}
```

### 15. Decimal Handling Issues
**File:** `src/lib/blockchain/aave.ts`
**Line:** 236 (getTokenDecimals)

**Issue:** Returns 18 as fallback, which is wrong for USDC (6 decimals). Could cause order-of-magnitude errors.

## 🔧 CODE QUALITY ISSUES

### 16. Unused Imports
**File:** `src/app/api/widget/options/route.ts`
**Line:** 5

**Issue:** Imports `config` from env but never uses it.

### 17. Missing Error Context
**File:** Multiple API routes

**Issue:** Many catch blocks just return generic "Something went wrong" without context.

**Better:**
```typescript
} catch (error) {
  console.error('Widget execute failed:', error);
  const errorId = crypto.randomUUID();
  return NextResponse.json(
    { success: false, error: 'Transaction build failed', errorId },
    { status: 500 }
  );
}
```

### 18. No Health Check Endpoint
**Missing:** `src/app/api/health/route.ts`

**Should add:** A health check endpoint for monitoring:
```typescript
export async function GET() {
  // Check database
  // Check blockchain RPC
  // Return status
}
```

## 🎯 FUNCTIONALITY GAPS

### 19. No Loan Repayment Tracking
**Issue:** The loan model has repayment fields, but there's no API to:
- Record repayments
- Update loan status when repaid
- Track payment history

### 20. No Liquidation Monitoring
**Issue:** No cron job or service to:
- Monitor health factors
- Alert users near liquidation
- Update liquidated loans

### 21. Missing MultiCall Support
**File:** `src/lib/blockchain/aave.ts`

**Issue:** The 4 transaction steps should ideally be bundled into a single multicall for better UX, but it's implemented as separate steps.

## ✅ VERIFICATION CHECKLIST

Before production, verify:

- [ ] All Aave contract addresses are correct
- [ ] All token addresses are correct
- [ ] ABIs match actual contract ABIs
- [ ] Health factor calculations are correct
- [ ] Transaction simulation works
- [ ] Error handling catches all edge cases
- [ ] Rate limiting is enabled
- [ ] Database migrations run successfully
- [ ] All CLI commands work

## 🚀 RECOMMENDED FIX ORDER

### Phase 1 (Critical - Do First):
1. Fix Aave Pool address usage
2. Fix token addresses
3. Fix getAaveBorrowAPR function

### Phase 2 (High Priority):
4. Add collateral calculation (not hardcoded 0.25)
5. Add balance check before transaction
6. Fix Chain type mismatch

### Phase 3 (Medium Priority):
7. Add rate limiting
8. Add transaction simulation
9. Fix WidgetSession type

### Phase 4 (Low Priority):
10. Add health check endpoint
11. Improve error messages
12. Add repayment tracking API

## 📊 IMPACT ASSESSMENT

| Issue | Severity | Impact if Not Fixed |
|-------|----------|---------------------|
| #1 Aave wrong address | 🔴 Critical | APR always wrong, falls back to mock |
| #2 DAI/USDT same address | 🔴 Critical | Transactions will fail |
| #3 getReserveData wrong | 🔴 Critical | Real rates never fetched |
| #6 Hardcoded collateral | 🟡 High | Users may be under-collateralized |
| #7 No balance check | 🟡 High | Wasted gas on failed transactions |
| #10 Missing status field | 🟡 High | TypeScript errors, session bugs |
| #5 Chain enum mismatch | 🟡 Medium | Type errors on multi-chain |

## 📝 SUMMARY

**Good:**
- ✅ Overall architecture is solid
- ✅ Database schema is comprehensive
- ✅ CLI tools are well-structured
- ✅ Security practices are good (origin check, recipient verification)

**Must Fix Before Production:**
- ❌ Aave contract integration has bugs
- ❌ Token addresses need verification
- ❌ Hardcoded values should be calculated
- ❌ Missing balance validation

**Estimated Fix Time:** 2-4 hours

**Recommendation:** Fix critical bugs before deploying. The app will work with mock data, but real blockchain integration has issues.
