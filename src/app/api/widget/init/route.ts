import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WidgetInitSchema } from '@/lib/utils/validation';
import { ApiResponse } from '@/types';
import { config } from '@/lib/config/env';

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ session: { id: string; expiresAt: Date } }>>> {
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

    // Verify origin (in production, check request headers)
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    if (!merchant.allowedOrigins.includes(origin) && !origin.includes('localhost')) {
      // Log suspicious request
      await db.auditLogs.create({
        event: 'widget_init_origin_mismatch',
        merchantId,
        payload: { requestedOrigin: origin, allowedOrigins: merchant.allowedOrigins },
        success: false,
        error: 'Origin not allowed',
      });

      return NextResponse.json(
        { success: false, error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    // SECURITY: Recipient must match merchant's registered wallet
    // We store the passed recipient for reference, but payment goes to merchant.walletAddress
    if (recipient.toLowerCase() !== merchant.walletAddress.toLowerCase()) {
      console.warn(`Recipient mismatch for ${merchantId}: ${recipient} vs ${merchant.walletAddress}`);
      
      await db.auditLogs.create({
        event: 'widget_init_recipient_mismatch',
        merchantId,
        payload: { requestedRecipient: recipient, merchantWallet: merchant.walletAddress },
        success: false,
        error: 'Recipient mismatch',
      });
    }

    // Create session
    const session = await db.sessions.create({
      merchantId,
      amount,
      token,
      recipient: merchant.walletAddress, // Always use merchant's verified wallet
      chain: chain || 'base',
    });

    // Log successful init
    await db.auditLogs.create({
      event: 'widget_init',
      merchantId,
      sessionId: session.id,
      ipAddress: req.ip || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      origin,
      payload: { amount, token, chain },
      success: true,
    });

    if (config.isDevelopment) {
      console.log(`Created widget session: ${session.id} for merchant: ${merchantId}`);
    }

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
