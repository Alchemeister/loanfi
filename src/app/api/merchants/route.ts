import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MerchantCreateSchema } from '@/lib/utils/validation';
import { ApiResponse, Merchant } from '@/types';

// GET /api/merchants - List all merchants (for demo)
export async function GET(): Promise<NextResponse<ApiResponse<{ merchants: Merchant[] }>>> {
  try {
    const merchants = await db.merchants.list();

    // Remove sensitive data
    const safeList = merchants.map(({ apiKey, ...rest }) => ({
      ...rest,
      apiKey: `${apiKey.slice(0, 8)}...`,
    }));

    return NextResponse.json({
      success: true,
      data: { merchants: safeList as Merchant[] },
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

// POST /api/merchants - Register new merchant
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ merchant: Merchant }>>> {
  try {
    const body = await req.json();

    // Validate input
    const parsed = MerchantCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', },
        { status: 400 }
      );
    }

    const { name, walletAddress, allowedOrigins } = parsed.data;

    // Create merchant
    const merchant = await db.merchants.create({
      name,
      walletAddress,
      allowedOrigins,
    });

    return NextResponse.json({
      success: true,
      data: { merchant },
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
