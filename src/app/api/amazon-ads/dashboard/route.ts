import { NextRequest, NextResponse } from 'next/server';
import { getDashboardAnalytics } from '@/lib/amazon-ads/engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const autoRefresh = url.searchParams.get('autoRefresh') !== '0';
  const data = await getDashboardAnalytics({ autoRefreshIfStale: autoRefresh });
  return NextResponse.json(data);
}
