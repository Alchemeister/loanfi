import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WidgetExecuteSchema } from '@/lib/utils/validation';
import { buildBorrowAndPayTransaction, getTokenAddress, getTokenDecimals } from '@/lib/blockchain/aave';
import { ApiResponse } from '@/types';
import { type Address, parseUnits } from 'viem';
import { config } from '@/lib/config/env';

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
    const collateralTokenAddress = getTokenAddress(session.collateralToken || 'WETH');

    if (!borrowTokenAddress || !collateralTokenAddress) {
      return NextResponse.json(
        { success: false, error: 'Token not supported' },
        { status: 400 }
      );
    }

    // Get token decimals for proper amount conversion
    const borrowDecimals = await getTokenDecimals(session.chain, borrowTokenAddress);
    const collateralDecimals = await getTokenDecimals(session.chain, collateralTokenAddress);

    // Convert amounts to wei
    const borrowAmountWei = parseUnits(session.amount.toString(), borrowDecimals);
    
    // Estimate collateral (use session amount or default to 0.25 ETH)
    const collateralAmount = session.collateralAmount || 0.25;
    const collateralAmountWei = parseUnits(collateralAmount.toString(), collateralDecimals);

    // Build transaction data
    const txData = buildBorrowAndPayTransaction({
      poolAddress: pool.contractAddress as Address,
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
      },
      success: true,
    });

    // Return transaction steps for user to sign
    return NextResponse.json({
      success: true,
      data: {
        steps: [
          {
            name: 'Approve Collateral',
            to: txData.approveCollateral.to,
            data: txData.approveCollateral.data,
            description: `Approve ${session.collateralToken || 'WETH'} for deposit`,
          },
          {
            name: 'Supply Collateral',
            to: txData.supplyCollateral.to,
            data: txData.supplyCollateral.data,
            description: `Deposit collateral to ${pool.name}`,
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
        poolAddress: pool.contractAddress as Address,
        borrowAmount: borrowAmountWei.toString(),
        collateralAmount: collateralAmountWei.toString(),
        chain: session.chain,
      },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`Error ${errorId}:`, error);

    return NextResponse.json(
      { success: false, error: 'Something went wrong', errorId },
      { status: 500 }
    );
  }
}
