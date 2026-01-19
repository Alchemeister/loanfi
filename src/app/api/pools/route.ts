import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiResponse, LendingPool } from '@/types';

// GET /api/pools - List lending pools
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<{ pools: LendingPool[] }>>> {
  try {
    const { searchParams } = new URL(req.url);
    const chain = searchParams.get('chain') || undefined;

    const pools = db.pools.list(chain);

    return NextResponse.json({
      success: true,
      data: { pools },
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
