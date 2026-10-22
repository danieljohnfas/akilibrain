import { NextRequest, NextResponse } from 'next/server';
import {
  checkProductHealthAndReplace,
  getDashboardAnalytics,
  rotateUnderperformingProducts,
  runHourlySync,
} from '@/lib/amazon-ads/engine';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'full_refresh';

    if (action === 'rotate_product') {
      const rotation = rotateUnderperformingProducts({
        site: body.site,
        forceProductId: body.productId,
      });
      const dashboard = await getDashboardAnalytics({ autoRefreshIfStale: false });
      return NextResponse.json({ ok: true, action, rotation, dashboard });
    }

    if (action === 'health_check') {
      const healthReport = await checkProductHealthAndReplace({
        site: body.site,
        simulateDogProductId: body.simulateDogProductId,
      });
      const dashboard = await getDashboardAnalytics({ autoRefreshIfStale: false });
      return NextResponse.json({ ok: true, action, healthReport, dashboard });
    }

    // Default: Full hourly refresh (Cloudflare traffic + Dogs of Amazon health check + Low-CTR auto-rotation)
    const syncResult = await runHourlySync({
      trigger: body.trigger || 'manual_button',
      checkHealth: body.checkHealth !== false,
    });
    const dashboard = await getDashboardAnalytics({ autoRefreshIfStale: false });
    return NextResponse.json({ ok: true, action: 'full_refresh', syncResult, dashboard });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
