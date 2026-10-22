import { NextRequest, NextResponse } from 'next/server';
import { serveDynamicProducts } from '@/lib/amazon-ads/engine';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const site =
    url.searchParams.get('site') ||
    request.headers.get('origin') ||
    request.headers.get('referer') ||
    'akilibrain';
  const slot = url.searchParams.get('slot') || undefined;
  const context = url.searchParams.get('context') || undefined;
  const limit = Number(url.searchParams.get('limit') || '4');
  const country =
    url.searchParams.get('country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    'US';
  const recordImpression = url.searchParams.get('track') !== '0';

  const payload = serveDynamicProducts({
    site,
    slot,
    context,
    country,
    limit,
    recordImpression,
  });

  if (!payload.allowed) {
    return NextResponse.json(payload, { status: 403, headers: CORS_HEADERS });
  }

  return NextResponse.json(payload, { status: 200, headers: CORS_HEADERS });
}
