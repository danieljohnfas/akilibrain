#!/usr/bin/env node
/**
 * Purely Online Hourly Sync Trigger for Central Amazon Associates Engine (photoid03-20)
 * Triggered every hour via GitHub Actions (.github/workflows/amazon-ads-hourly.yml)
 * Calls the live online production endpoint https://akilibrain.com/api/amazon-ads/refresh
 * with zero local file or local database dependencies.
 */

const LIVE_ENDPOINT = 'https://tiketichap.com/api/amazon-ads';

async function main() {
  console.log(`Triggering online hourly sync at ${LIVE_ENDPOINT}...`);
  const res = await fetch(LIVE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'full_sync',
      trigger: 'hourly_cron',
    }),
  });

  if (!res.ok) {
    console.warn(`Online endpoint returned HTTP ${res.status} (deployment may still be propagating).`);
    return;
  }

  const data = await res.json();
  console.log('Online hourly sync complete:', {
    syncedAt: data.dashboard?.lastSyncedAt,
    nextScheduledSyncAt: data.dashboard?.nextScheduledSyncAt,
    activeProductsCount: data.dashboard?.summary?.activeProductsCount,
    clicksToday: data.dashboard?.summary?.clicksToday,
  });
}

main().catch((err) => {
  console.error('Online sync warning:', err.message);
});
