import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WidgetInitSchema } from '@/lib/utils/validation';
import { ApiResponse, WidgetSession } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ session: WidgetSession }>>> {
  try {
    const body = await req.json();

    // Validate input
    const parsed = WidgetInitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const { merchantId, amount, token, recipient, chain } = parsed.data;

    // Verify merchant exists
    const merchant = db.merchants.findById(merchantId);
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Invalid merchant' },
        { status: 401 }
      );
    }

    // Verify origin (in production, check request headers)
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    if (!merchant.allowedOrigins.includes(origin) && !origin.includes('localhost')) {
      return NextResponse.json(
        { success: false, error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    // SECURITY: Recipient must match merchant's registered wallet
    // We store the passed recipient for reference, but payment goes to merchant.walletAddress
    if (recipient.toLowerCase() !== merchant.walletAddress.toLowerCase()) {
      console.warn(`Recipient mismatch for ${merchantId}: ${recipient} vs ${merchant.walletAddress}`);
    }

    // Create session
    const session = db.sessions.create({
      merchantId,
      amount,
      token,
      recipient: merchant.walletAddress, // Always use merchant's verified wallet
      chain: chain || 'base',
    });

    return NextResponse.json({
      success: true,
      data: {
        session,
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
