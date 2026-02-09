import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WidgetInitSchema } from '@/lib/utils/validation';
import { ApiResponse } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ session: { id: string; expiresAt: Date } }>>> {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

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
    const merchant = await db.merchants.findById(merchantId);
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Invalid merchant' },
        { status: 401 }
      );
    }

    // Verify merchant is active
    if (!merchant.isActive) {
      return NextResponse.json(
        { success: false, error: 'Merchant account inactive' },
        { status: 403 }
      );
    }

    // Verify origin
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    if (!merchant.allowedOrigins.includes(origin) && !origin.includes('localhost')) {
      return NextResponse.json(
        { success: false, error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    // SECURITY: Recipient must match merchant's registered wallet
    if (recipient.toLowerCase() !== merchant.walletAddress.toLowerCase()) {
      console.warn(`Recipient mismatch for ${merchantId}: ${recipient} vs ${merchant.walletAddress}`);
    }

    // Create session
    const session = await db.sessions.create({
      merchantId,
      amount,
      token,
      recipient: merchant.walletAddress,
      chain: chain || 'base',
    });

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
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
