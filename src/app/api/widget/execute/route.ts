import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WidgetExecuteSchema } from '@/lib/utils/validation';
import { 
  buildBorrowAndPayTransaction, 
  getTokenAddress, 
  getTokenDecimals,
  calculateRequiredCollateral,
  checkSufficientBalance,
  getAavePoolAddress,
} from '@/lib/blockchain/aave';
import { ApiResponse } from '@/types';
import { type Address, parseUnits } from 'viem';

interface TransactionData {
  steps: Array<{
    name: string;
    to: Address;
    data: `0x${string}`;
    description: string;
  }>;
  poolAddress: Address;
  borrowAmount: string;
  collateralAmount: string;
  chain: string;
  warnings?: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<TransactionData>>> {
  try {
    const body = await req.json();

    // Validate input
    const parsed = WidgetExecuteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const { sessionId, optionId, borrowerAddress } = parsed.data;

    // Get session
    const session = await db.sessions.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check session expiry
    if (db.sessions.isExpired(session)) {
      await db.sessions.update(sessionId, { status: 'expired' });
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 410 }
      );
    }

    // Get merchant (for verified recipient address)
    const merchant = await db.merchants.findById(session.merchantId);
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Parse option ID to get pool and term
    const [poolId] = optionId.split('-');
    const pool = db.pools.findById(poolId);
    if (!pool) {
      return NextResponse.json(
        { success: false, error: 'Pool not found' },
        { status: 404 }
      );
    }

    // Get token addresses
    const borrowTokenAddress = getTokenAddress(session.token);
    const collateralToken = session.collateralToken || 'WETH';
    const collateralTokenAddress = getTokenAddress(collateralToken);

    if (!borrowTokenAddress || !collateralTokenAddress) {
      return NextResponse.json(
        { success: false, error: 'Token not supported' },
        { status: 400 }
      );
    }

    // Calculate required collateral based on loan terms
    const borrowTokenPrice = await db.tokenPrices.findByToken(session.token);
    const borrowAmountUSD = session.amount * (borrowTokenPrice?.priceUSD || 1);
    
    const requiredCollateral = await calculateRequiredCollateral(
      borrowAmountUSD,
      collateralToken,
      pool.minCollateralRatio,
      session.chain
    );

    // Use session collateral amount if provided, otherwise use calculated minimum
    // Add 10% buffer for safety
    const collateralAmount = session.collateralAmount 
      ? Math.max(session.collateralAmount, requiredCollateral.amount * 1.1)
      : requiredCollateral.amount * 1.1;

    // Get token decimals for proper amount conversion
    const borrowDecimals = await getTokenDecimals(session.chain, borrowTokenAddress);
    const collateralDecimals = await getTokenDecimals(session.chain, collateralTokenAddress);

    // Convert amounts to wei
    const borrowAmountWei = parseUnits(session.amount.toString(), borrowDecimals);
    const collateralAmountWei = parseUnits(collateralAmount.toString(), collateralDecimals);

    // Check if user has sufficient balance
    const balanceCheck = await checkSufficientBalance(
      session.chain,
      collateralTokenAddress,
      borrowerAddress as Address,
      collateralAmountWei
    );

    if (!balanceCheck.sufficient) {
      const deficitFormatted = Number(balanceCheck.deficit) / (10 ** collateralDecimals);
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient ${collateralToken} balance. Need ${deficitFormatted.toFixed(4)} more.` 
        },
        { status: 400 }
      );
    }

    // Get the correct Aave Pool address
    const poolAddress = getAavePoolAddress(session.chain);
    if (!poolAddress) {
      return NextResponse.json(
        { success: false, error: `No Aave pool available for ${session.chain}` },
        { status: 400 }
      );
    }

    // Build transaction data
    const txData = buildBorrowAndPayTransaction({
      poolAddress,
      collateralToken: collateralTokenAddress,
      collateralAmount: collateralAmountWei,
      borrowToken: borrowTokenAddress,
      borrowAmount: borrowAmountWei,
      borrower: borrowerAddress as Address,
      recipient: merchant.walletAddress as Address, // ALWAYS use verified merchant wallet
    });

    // Update session with selection
    await db.sessions.update(sessionId, {
      selectedOptionId: optionId,
      collateralToken,
      collateralAmount,
    });

    // Log audit
    await db.auditLogs.create({
      event: 'widget_execute',
      merchantId: session.merchantId,
      sessionId,
      payload: {
        borrowerAddress,
        poolId,
        amount: session.amount,
        token: session.token,
        collateralAmount,
        collateralToken,
      },
      success: true,
    });

    // Build warnings
    const warnings: string[] = [];
    if (balanceCheck.balance < collateralAmountWei * BigInt(2)) {
      warnings.push(`Low ${collateralToken} balance remaining after transaction`);
    }

    // Return transaction steps for user to sign
    return NextResponse.json({
      success: true,
      data: {
        steps: [
          {
            name: 'Approve Collateral',
            to: txData.approveCollateral.to,
            data: txData.approveCollateral.data,
            description: `Approve ${collateralAmount.toFixed(4)} ${collateralToken} for deposit`,
          },
          {
            name: 'Supply Collateral',
            to: txData.supplyCollateral.to,
            data: txData.supplyCollateral.data,
            description: `Deposit ${collateralAmount.toFixed(4)} ${collateralToken} to ${pool.name}`,
          },
          {
            name: 'Borrow',
            to: txData.borrow.to,
            data: txData.borrow.data,
            description: `Borrow ${session.amount} ${session.token}`,
          },
          {
            name: 'Pay Merchant',
            to: txData.transferToMerchant.to,
            data: txData.transferToMerchant.data,
            description: `Send ${session.amount} ${session.token} to merchant`,
          },
        ],
        poolAddress,
        borrowAmount: borrowAmountWei.toString(),
        collateralAmount: collateralAmountWei.toString(),
        chain: session.chain,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`Error ${errorId}:`, error);

    return NextResponse.json(
      { success: false, error: 'Transaction build failed', errorId },
      { status: 500 }
    );
  }
}
