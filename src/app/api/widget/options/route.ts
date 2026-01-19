import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WidgetOptionsSchema } from '@/lib/utils/validation';
import { generateLoanOptions } from '@/lib/blockchain/aave';
import { ApiResponse, LoanOption } from '@/types';

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
    const session = db.sessions.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check session expiry
    if (db.sessions.isExpired(session)) {
      db.sessions.delete(sessionId);
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 410 }
      );
    }

    // Generate loan options (server-side calculations)
    const options = await generateLoanOptions(
      session.amount,
      session.token,
      collateralToken,
      collateralAmount
    );

    if (options.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No loan options available for this collateral amount' },
        { status: 400 }
      );
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
