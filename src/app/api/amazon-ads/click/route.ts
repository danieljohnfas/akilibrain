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

  let targetUrl: string;
  if (result.product) {
    targetUrl = localizeAmazonUrl(result.product.productUrl, country, AMAZON_ASSOCIATE_TAG);
  } else {
    targetUrl = buildAmazonUrl({
      asin,
      searchQuery: query || 'office electronics',
      countryCode: country,
      tag: AMAZON_ASSOCIATE_TAG,
    });
  }

  const response = NextResponse.redirect(targetUrl, 302);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
