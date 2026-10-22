import { NextRequest, NextResponse } from 'next/server';
import { addOrActivateProduct, searchProductsForSite } from '@/lib/amazon-ads/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const site = url.searchParams.get('site') || 'akilibrain';
  const query = url.searchParams.get('q') || undefined;
  const limit = Number(url.searchParams.get('limit') || '8');

  const results = await searchProductsForSite({ site, query, limit });
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = addOrActivateProduct({
      site: body.site || 'akilibrain',
      slotKey: body.slotKey || 'default',
      title: body.title,
      asin: body.asin,
      searchQuery: body.searchQuery || body.title,
      priceEstimate: body.priceEstimate,
      badge: body.badge,
      description: body.description,
      replaceExistingInSlot: Boolean(body.replaceExistingInSlot),
    });
    return NextResponse.json({ ok: true, product: created });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 400 },
    );
  }
}
