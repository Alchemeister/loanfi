import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WidgetOptionsSchema } from '@/lib/utils/validation';
import { generateLoanOptions } from '@/lib/blockchain/aave';
import { ApiResponse, LoanOption } from '@/types';
import { config } from '@/lib/config/env';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ options: LoanOption[] }>>> {
  try {
    const body = await req.json();

    // Validate input
    const parsed = WidgetOptionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const { sessionId, collateralToken, collateralAmount } = parsed.data;

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

    // Update session with collateral selection
    await db.sessions.update(sessionId, {
      collateralToken,
      collateralAmount,
    });

    // Generate loan options with real-time blockchain data
    const options = await generateLoanOptions(
      session.amount,
      session.token,
      collateralToken,
      collateralAmount,
      session.chain
    );

    if (options.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No loan options available for this collateral amount' },
        { status: 400 }
      );
    }

    // Log for analytics
    if (config.isDevelopment) {
      console.log(`Generated ${options.length} loan options for session ${sessionId}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        options,
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
