import { NextRequest, NextResponse } from 'next/server';
import { recordAdEvent } from '@/lib/amazon-ads/engine';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type =
      body.type === 'click' || body.type === 'pageview' ? body.type : 'impression';
    const site =
      body.site ||
      request.headers.get('origin') ||
      request.headers.get('referer') ||
      'akilibrain';
    const country =
      body.country ||
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-vercel-ip-country') ||
      'US';

    const result = recordAdEvent({
      type,
      site,
      slot: body.slot,
      productId: body.productId,
      asin: body.asin,
      country,
      pageUrl: body.pageUrl,
    });

    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { recorded: false, error: (err as Error).message },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
