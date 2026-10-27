import { NextRequest, NextResponse } from 'next/server';
import { recordAdEvent } from '@/lib/amazon-ads/engine';
import {
  AMAZON_ASSOCIATE_TAG,
  buildAmazonUrl,
  localizeAmazonUrl,
} from '@/lib/amazon-ads/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const site =
    url.searchParams.get('site') ||
    request.headers.get('referer') ||
    'akilibrain';
  const slot = url.searchParams.get('slot') || 'default';
  const productId = url.searchParams.get('product') || undefined;
  const asin = url.searchParams.get('asin') || undefined;
  const query = url.searchParams.get('q') || '';
  const country =
    url.searchParams.get('cc') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    'US';

  const result = recordAdEvent({
    type: 'click',
    site,
    slot,
    productId,
    asin,
    country,
    pageUrl: request.headers.get('referer') || undefined,
  });

  // Mirror conversion event to central D1 telemetry engine
  try {
    fetch('https://tiketichap.com/api/amazon-ads', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        site: 'akilibrain',
        type: 'click',
        slot,
        productId: productId || result.product?.id,
        asin: asin || result.product?.asin,
        country,
        associateTag: AMAZON_ASSOCIATE_TAG,
      }),
    }).catch(() => {});
  } catch {}

  let targetUrl: string;
  if (result.product) {
    let rawProductUrl = result.product.productUrl;
    if (rawProductUrl.includes('B08M8K9L3N')) {
      rawProductUrl = rawProductUrl.replace('B08M8K9L3N', 'B08SBFTXQT');
    }
    targetUrl = localizeAmazonUrl(rawProductUrl, country, AMAZON_ASSOCIATE_TAG);
  } else {
    targetUrl = buildAmazonUrl({
      asin: asin === 'B08M8K9L3N' ? 'B08SBFTXQT' : asin,
      searchQuery: query || 'office electronics',
      countryCode: country,
      tag: AMAZON_ASSOCIATE_TAG,
    });
  }

  const response = NextResponse.redirect(targetUrl, 302);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
