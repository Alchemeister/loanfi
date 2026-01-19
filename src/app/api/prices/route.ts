import { NextRequest, NextResponse } from 'next/server';
import { getTokenPrices } from '@/lib/blockchain/prices';
import { ApiResponse, TokenPrice } from '@/types';

// Supported tokens
const SUPPORTED_TOKENS = ['ETH', 'WETH', 'WBTC', 'cbETH', 'USDC', 'USDT', 'DAI'];

// GET /api/prices - Get token prices
export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<{ prices: Record<string, TokenPrice> }>>> {
  try {
    const { searchParams } = new URL(req.url);
    const tokensParam = searchParams.get('tokens');

    const tokens = tokensParam
      ? tokensParam.split(',').filter(t => SUPPORTED_TOKENS.includes(t.toUpperCase()))
      : SUPPORTED_TOKENS;

    const prices = await getTokenPrices(tokens);

    return NextResponse.json({
      success: true,
      data: { prices },
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
