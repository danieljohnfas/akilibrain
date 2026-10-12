import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { affiliateClicks } from '@/lib/db/schema/analytics';
import { buildAffiliateUrl, isAffiliatePartner } from '@/lib/affiliates';
import { enforceRateLimit } from '@/lib/security/rate-limit';

/**
 * Affiliate redirect: /api/go/<partner>?q=<course search>&from=<placement>
 *
 * Only redirects to a partner configured in src/lib/affiliates.ts (never to a URL taken from
 * the request), and logs the click so earnings can be matched to placements.
 */
export async function GET(request: Request, { params }: { params: Promise<{ partner: string }> }) {
  const limited = await enforceRateLimit(request, { prefix: 'go', max: 60, window: '1 m' });
  if (limited) return limited;

  const { partner } = await params;
  if (!isAffiliatePartner(partner)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const placement = (url.searchParams.get('from') || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 50);

  const target = buildAffiliateUrl(partner, query);
  if (!target) {
    return new NextResponse('Not found', { status: 404 });
  }

  db.insert(affiliateClicks)
    .values({ partner, placement: placement || null, query: query || null })
    .execute()
    .catch((err) => console.error('[go] Failed to log affiliate click:', (err as Error).message));

  const response = NextResponse.redirect(target, 302);
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
