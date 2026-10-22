'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  ArrowRightLeft,
  ExternalLink,
  Globe,
  MousePointerClick,
  Eye,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ManagedProduct {
  id: string;
  siteKey: string;
  domain: string;
  slotKey: string;
  category: string;
  asin: string;
  title: string;
  description: string;
  searchQuery: string;
  productUrl: string;
  priceEstimate: string;
  rating: number;
  badge: string;
  status: 'active' | 'candidate' | 'quarantined_dog' | 'retired_low_ctr';
  impressions: number;
  clicks: number;
  ctr: number;
  lastHealthCheckAt: string | null;
  lastHttpStatus: number;
  isDogPage: boolean;
  healthNote: string;
}

interface SiteMetrics {
  key: string;
  domain: string;
  name: string;
  niche: string;
  modality: string;
  defaultSearchKeywords: string[];
  slots: Array<{ key: string; label: string; placementDescription: string }>;
  activeCount: number;
  candidateCount: number;
  traffic: {
    requests24h: number;
    pageviews24h: number;
    uniques24h: number;
    pageviews7d: number;
    uniques7d: number;
    pageviews30d: number;
    uniques30d: number;
    bandwidthMb24h: number;
    productImpressions: number;
    productClicks: number;
    productCtr: number;
    visitorToAdClickRate: number;
    source: string;
    lastUpdatedAt: string;
  };
}

interface TimeSeriesRow {
  period: string;
  label: string;
  clicks: number;
  impressions: number;
  ctr: number;
  bySite: Record<string, number>;
}

interface RotationLog {
  id: string;
  siteKey: string;
  domain: string;
  slotKey: string;
  removedProductTitle: string;
  addedProductTitle: string;
  reason: string;
  details: string;
  rotatedAt: string;
}

interface DashboardPayload {
  associateTag: string;
  eligibleSitesCount: number;
  excludedSites: string[];
  lastSyncedAt: string;
  nextScheduledSyncAt: string;
  lastSyncTrigger: string;
  summary: {
    clicksToday: number;
    impressionsToday: number;
    ctrToday: number;
    clicksThisWeek: number;
    impressionsThisWeek: number;
    ctrThisWeek: number;
    clicksThisMonth: number;
    impressionsThisMonth: number;
    ctrThisMonth: number;
    allTimeClicks: number;
    allTimeImpressions: number;
    allTimeCtr: number;
    totalCloudflarePageviews24h: number;
    totalCloudflareUniques24h: number;
    activeProductsCount: number;
    candidateProductsCount: number;
    quarantinedDogCount: number;
    retiredLowCtrCount: number;
  };
  sites: SiteMetrics[];
  timeSeries: {
    daily: TimeSeriesRow[];
    weekly: TimeSeriesRow[];
    monthly: TimeSeriesRow[];
  };
  products: ManagedProduct[];
  rotationLogs: RotationLog[];
}

interface SearchResultItem {
  asin: string;
  title: string;
  priceEstimate: string;
  rating: number;
  productUrl: string;
  searchQuery: string;
  source: string;
  siteKey: string;
}

export default function AmazonAdsCentralDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [periodTab, setPeriodTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Product Search state
  const [searchSite, setSearchSite] = useState<string>('getnyash');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/amazon-ads/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load Amazon Ads dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboard();
    }, 0);
    // Actively poll every hour (and check every 60s for live clicks/impressions)
    const interval = setInterval(loadDashboard, 60_000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadDashboard]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setStatusBanner('Syncing Cloudflare website traffic, checking Amazon product pages for Dogs/404s, and rotating zero-click products...');
    try {
      const res = await fetch('/api/amazon-ads/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full_refresh', trigger: 'manual_button', checkHealth: true }),
      });
      const json = await res.json();
      if (json.dashboard) setData(json.dashboard);
      const checked = json.syncResult?.healthReport?.checkedCount ?? 0;
      const rotated =
        (json.syncResult?.healthReport?.quarantinedCount ?? 0) +
        (json.syncResult?.rotationReport?.rotatedCount ?? 0);
      setStatusBanner(
        `Refresh complete! Synced 6 websites via Cloudflare Analytics, verified ${checked} Amazon product pages, and rotated ${rotated} products.`,
      );
    } catch (err) {
      setStatusBanner(`Refresh error: ${(err as Error).message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRotateProduct = async (productId: string, title: string) => {
    setIsRefreshing(true);
    setStatusBanner(`Rotating "${title}" and activating replacement product...`);
    try {
      const res = await fetch('/api/amazon-ads/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotate_product', productId }),
      });
      const json = await res.json();
      if (json.dashboard) setData(json.dashboard);
      setStatusBanner(`Replaced "${title}" with top backup candidate product.`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSimulateDogReplacement = async (productId: string, title: string) => {
    setIsRefreshing(true);
    setStatusBanner(`Running Dogs-of-Amazon health check on "${title}"...`);
    try {
      const res = await fetch('/api/amazon-ads/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health_check', simulateDogProductId: productId }),
      });
      const json = await res.json();
      if (json.dashboard) setData(json.dashboard);
      setStatusBanner(`Quarantined unreachable/Dog product "${title}" and activated healthy replacement.`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProductSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    try {
      const q = customQuery !== undefined ? customQuery : searchQuery;
      const res = await fetch(
        `/api/amazon-ads/search?site=${encodeURIComponent(searchSite)}&q=${encodeURIComponent(q)}&limit=6`,
      );
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.results || []);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddDiscoveredProduct = async (item: SearchResultItem) => {
    const targetSite = data?.sites.find((s) => s.key === searchSite);
    const defaultSlot = targetSite?.slots[0]?.key || 'default';
    setStatusBanner(`Activating "${item.title}" on ${targetSite?.domain || searchSite}...`);
    const res = await fetch('/api/amazon-ads/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: searchSite,
        slotKey: defaultSlot,
        title: item.title,
        asin: item.asin,
        searchQuery: item.searchQuery,
        priceEstimate: item.priceEstimate,
        badge: 'Newly Added',
      }),
    });
    if (res.ok) {
      await loadDashboard();
      setStatusBanner(`Added & activated "${item.title}" (tag=${data?.associateTag}) on ${targetSite?.domain}!`);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
          <p className="text-sm font-medium">Loading Central Amazon Associates Engine (photoid03-20)...</p>
        </div>
      </div>
    );
  }

  const filteredProducts =
    selectedSiteFilter === 'all'
      ? data.products
      : data.products.filter((p) => p.siteKey === selectedSiteFilter);

  const activeTimeSeries = data.timeSeries[periodTab] || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-8 space-y-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Top Header + Hourly Sync Status + Manual Refresh Button */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-7 w-7 text-amber-400" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Amazon Associates Central Ad Engine
              </h1>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono text-xs">
                ID: {data.associateTag}
              </Badge>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Managing dynamic products, Cloudflare site traffic, product impressions, click rollups, and Dogs-of-Amazon health across{' '}
              <span className="text-zinc-200 font-medium">{data.eligibleSitesCount} eligible websites</span>{' '}
              (excluding <code className="text-red-400">hentaivault.me</code>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <div>
                <div>
                  Updated: <span className="text-zinc-200 font-mono">{new Date(data.lastSyncedAt).toLocaleTimeString()}</span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Auto-updates every 1h • Next: {new Date(data.nextScheduledSyncAt).toLocaleTimeString()}
                </div>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-semibold px-4 py-2.5 text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing Traffic & Health...' : 'Refresh Analytics & Product Health Now'}
            </button>
          </div>
        </div>

        {statusBanner && (
          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 px-4 py-3 text-sm text-indigo-200 flex items-center justify-between">
            <span>{statusBanner}</span>
            <button onClick={() => setStatusBanner(null)} className="text-xs text-indigo-300 underline ml-4">
              Dismiss
            </button>
          </div>
        )}

        {/* Section 1: Associate ID (photoid03-20) Clicks by Day, Week, Month & All-Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Clicks Today (24h)</span>
                <MousePointerClick className="w-4 h-4 text-amber-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">{data.summary.clicksToday.toLocaleString()}</div>
              <p className="text-xs text-zinc-400 mt-1">
                {data.summary.impressionsToday.toLocaleString()} product views •{' '}
                <span className="text-emerald-400 font-medium">{data.summary.ctrToday}% CTR</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Clicks This Week</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-100">{data.summary.clicksThisWeek.toLocaleString()}</div>
              <p className="text-xs text-zinc-400 mt-1">
                {data.summary.impressionsThisWeek.toLocaleString()} product views •{' '}
                <span className="text-emerald-400 font-medium">{data.summary.ctrThisWeek}% CTR</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Clicks This Month</span>
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-100">{data.summary.clicksThisMonth.toLocaleString()}</div>
              <p className="text-xs text-zinc-400 mt-1">
                {data.summary.impressionsThisMonth.toLocaleString()} product views •{' '}
                <span className="text-emerald-400 font-medium">{data.summary.ctrThisMonth}% CTR</span>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <span>Website Traffic & Product Health</span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-400">
                {data.summary.totalCloudflarePageviews24h.toLocaleString()}{' '}
                <span className="text-sm font-normal text-zinc-400">PV/24h</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {data.summary.activeProductsCount} active • {data.summary.candidateProductsCount} backup •{' '}
                {data.summary.quarantinedDogCount} dog/404 replaced
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Website Traffic (Cloudflare) -> Product Traffic (Impressions) -> Product Clicks */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  Six-Website Traffic (Cloudflare Analytics) vs. Product Impressions & Clicks
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Side-by-side comparison of Cloudflare website traffic, product impressions (traffic to products), and outbound clicks for{' '}
                  <code className="text-amber-300">{data.associateTag}</code>.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Website</th>
                  <th className="px-4 py-3">Ad Modality</th>
                  <th className="px-4 py-3 text-right">CF Pageviews (24h / 7d)</th>
                  <th className="px-4 py-3 text-right">CF Uniques (24h)</th>
                  <th className="px-4 py-3 text-right">Product Traffic (Impressions)</th>
                  <th className="px-4 py-3 text-right">Product Clicks</th>
                  <th className="px-4 py-3 text-right">Product CTR</th>
                  <th className="px-4 py-3 text-center">Active / Backup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {data.sites.map((site) => (
                  <tr key={site.key} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3.5 font-medium">
                      <div className="text-zinc-100">{site.domain}</div>
                      <div className="text-xs text-zinc-500">{site.niche}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-300 max-w-xs">{site.modality}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-zinc-200">
                      {site.traffic.pageviews24h.toLocaleString()}{' '}
                      <span className="text-xs text-zinc-500">/ {site.traffic.pageviews7d.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-cyan-300">
                      {site.traffic.uniques24h.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-indigo-300">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {site.traffic.productImpressions.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-amber-400">
                      {site.traffic.productClicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono">
                      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                        {site.traffic.productCtr}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs font-mono text-zinc-300">
                      {site.activeCount} active / {site.candidateCount} backup
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Section 3: Historical Click Ledger for photoid03-20 (Day / Week / Month) */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold">
                  Associate ID (<code className="text-amber-400">{data.associateTag}</code>) Historical Clicks — Day, Week & Month
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tracks exact click volume received by <code className="text-amber-300">{data.associateTag}</code> across each period and website.
                </p>
              </div>
              <div className="flex gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPeriodTab(tab)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition cursor-pointer ${
                      periodTab === tab
                        ? 'bg-amber-500 text-zinc-950'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3 text-right">Total Clicks ({data.associateTag})</th>
                  <th className="px-4 py-3 text-right">Product Impressions</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">GetNyash</th>
                  <th className="px-4 py-3 text-right">PhotoSplit</th>
                  <th className="px-4 py-3 text-right">IMIW</th>
                  <th className="px-4 py-3 text-right">AudioRap</th>
                  <th className="px-4 py-3 text-right">TiketiChap</th>
                  <th className="px-4 py-3 text-right">AkiliBrain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
                {activeTimeSeries.map((row) => (
                  <tr key={row.period} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-2.5 font-semibold text-zinc-200">{row.label}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-amber-400">{row.clicks.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-300">{row.impressions.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-400">{row.ctr}%</td>
                    <td className="px-4 py-2.5 text-right text-zinc-400">{row.bySite.getnyash || 0}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-400">{row.bySite.photosplitstudio || 0}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-400">{row.bySite['is-my-internet-working'] || 0}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-400">{row.bySite.audiorap || 0}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-400">{row.bySite.tiketichap || 0}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-400">{row.bySite.akilibrain || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Section 4: Search Relevant Products for a Specific Website & Dynamically Add */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              Search Relevant Amazon Products for Any Website
            </CardTitle>
            <p className="text-xs text-zinc-400">
              Search live Amazon listings and curated niche candidates for any of the 6 websites and deploy them directly with{' '}
              <code className="text-amber-300">tag={data.associateTag}</code>.
            </p>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <form onSubmit={(e) => handleProductSearch(e)} className="flex flex-col md:flex-row gap-3">
              <select
                value={searchSite}
                onChange={(e) => setSearchSite(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
              >
                {data.sites.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.domain} ({s.name})
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter product keyword (or leave blank for site's top researched keyword)..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-sm text-zinc-100"
              />

              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-lg text-sm transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
                {isSearching ? 'Searching Amazon...' : 'Search Products'}
              </button>
            </form>

            {/* Quick Niche Keyword Pills for Selected Site */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-400">Recommended keywords for {searchSite}:</span>
              {data.sites
                .find((s) => s.key === searchSite)
                ?.defaultSearchKeywords.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => {
                      setSearchQuery(kw);
                      handleProductSearch(undefined, kw);
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded-full transition cursor-pointer"
                  >
                    {kw}
                  </button>
                ))}
            </div>

            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {searchResults.map((item, idx) => (
                  <div
                    key={`${item.asin}-${idx}`}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-mono text-amber-400">{item.asin || 'SEARCH'}</span>
                        <span>{item.priceEstimate}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-100 line-clamp-2">{item.title}</h4>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="sponsored nofollow noopener"
                        className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
                      >
                        Preview on Amazon <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleAddDiscoveredProduct(item)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Activate on {searchSite}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Active Product Inventory, Health Status (Dogs of Amazon Detector) & 1-Click Rotator */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold">
                  Product Inventory, Click Performance & Dogs-of-Amazon Health Status
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Products that return 404 / Dogs of Amazon or fail to generate clicks are automatically swapped with backup candidates.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedSiteFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    selectedSiteFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All 6 Sites ({data.products.length})
                </button>
                {data.sites.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSelectedSiteFilter(s.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      selectedSiteFilter === s.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Website & Slot</th>
                  <th className="px-4 py-3">Product & ASIN</th>
                  <th className="px-4 py-3">Status & Page Health</th>
                  <th className="px-4 py-3 text-right">Impressions</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-200">{p.domain}</div>
                      <div className="text-xs text-zinc-500 font-mono">{p.slotKey}</div>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <div className="font-medium text-zinc-100">{p.title}</div>
                      <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-amber-400">{p.asin || 'SEARCH'}</span>
                        <span>•</span>
                        <span>{p.priceEstimate}</span>
                        <span>•</span>
                        <a
                          href={p.productUrl}
                          target="_blank"
                          rel="sponsored nofollow noopener"
                          className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          Amazon Link <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'active' && (
                        <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active (HTTP {p.lastHttpStatus})
                        </Badge>
                      )}
                      {p.status === 'candidate' && (
                        <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30">
                          Backup Candidate
                        </Badge>
                      )}
                      {p.status === 'quarantined_dog' && (
                        <Badge className="bg-red-500/15 text-red-300 border-red-500/30 inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Quarantined (Dog / 404)
                        </Badge>
                      )}
                      {p.status === 'retired_low_ctr' && (
                        <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">
                          Rotated (Low Clicks)
                        </Badge>
                      )}
                      <div className="text-[11px] text-zinc-500 mt-1">{p.healthNote}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-300">{p.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-amber-400">
                      {p.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{p.ctr}%</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'active' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRotateProduct(p.id, p.title)}
                            className="inline-flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            title="Replace this product with next candidate"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Swap
                          </button>
                          <button
                            onClick={() => handleSimulateDogReplacement(p.id, p.title)}
                            className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            title="Flag as unreachable / Dogs of Amazon and auto-replace"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Flag Dog
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Section 6: Auto-Rotation & Dogs-of-Amazon Replacement Log */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              Automated Product Replacement & Health Quarantine Log
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-800/60">
            {data.rotationLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-zinc-800 text-zinc-300">{log.domain}</Badge>
                    <span className="font-mono text-zinc-500">{log.slotKey}</span>
                    <span className="text-amber-400 font-medium">{log.reason}</span>
                  </div>
                  <p className="text-zinc-300">{log.details}</p>
                </div>
                <span className="font-mono text-zinc-500 shrink-0">
                  {new Date(log.rotatedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
