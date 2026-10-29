'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

interface AdSlotProps {
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
  context?: string;
  limit?: number;
}

interface DynamicAmazonProduct {
  id: string;
  title: string;
  description: string;
  badge: string;
  priceEstimate: string;
  ctaText: string;
  localizedUrl: string;
  clickTrackUrl: string;
}

const FALLBACK_PRODUCTS: DynamicAmazonProduct[] = [
  {
    id: 'ab-active-1',
    title: 'Logitech Zone Vibe 100 Wireless Headset with Noise-Cancelling Mic',
    description: 'Crystal-clear audio for Zoom/Teams remote interviews and daily standups.',
    badge: 'Remote Work Pick',
    priceEstimate: '$89.99',
    ctaText: 'Check Price on Amazon',
    localizedUrl: 'https://www.amazon.com/s?k=Logitech+Zone+Vibe+100+wireless+headset&tag=photoid03-20',
    clickTrackUrl: '/api/amazon-ads/click?site=akilibrain&slot=ad-slot&product=ab-active-1',
  },
  {
    id: 'ab-active-3',
    title: 'Brother ADS-1700W Compact Wireless Duplex Document Scanner',
    description: 'High-speed 25ppm two-sided PDF scanner for tender bid submissions & compliance docs.',
    badge: 'Tender & Office Pick',
    priceEstimate: '$229.99',
    ctaText: 'Shop on Amazon',
    localizedUrl: 'https://www.amazon.com/s?k=Brother+ADS-1700W+wireless+document+scanner&tag=photoid03-20',
    clickTrackUrl: '/api/amazon-ads/click?site=akilibrain&slot=ad-slot&product=ab-active-3',
  },
  {
    id: 'ab-active-2',
    title: 'PMP Exam Prep Simplified (PMBOK 7th Edition + Agile Practice Guide)',
    description: 'Top-rated Project Management Professional certification guide required by UN, World Bank & NGOs.',
    badge: '#1 Career Cert Book',
    priceEstimate: '$42.99',
    ctaText: 'View on Amazon',
    localizedUrl: 'https://www.amazon.com/dp/B08SBFTXQT?tag=photoid03-20',
    clickTrackUrl: '/api/amazon-ads/click?site=akilibrain&slot=ad-slot&product=ab-active-2',
  },
  {
    id: 'akil-4',
    title: 'Logitech C920x HD Pro Webcam 1080p with Stereo Audio',
    description: 'Industry-standard 1080p webcam with auto light correction for remote work consultations.',
    badge: 'Remote Standard',
    priceEstimate: '$59.99',
    ctaText: 'Check Price on Amazon',
    localizedUrl: 'https://www.amazon.com/dp/B006JH8T3S?tag=photoid03-20',
    clickTrackUrl: '/api/amazon-ads/click?site=akilibrain&slot=ad-slot&product=akil-4',
  },
  {
    id: 'akil-13',
    title: 'Anker 737 Power Bank (PowerCore 24K) 140W Fast Laptop Charger',
    description: 'Powers MacBooks, Dell XPS, and ThinkPads during office power cuts or fieldwork across East Africa.',
    badge: 'Laptop Backup',
    priceEstimate: '$129.99',
    ctaText: 'Shop on Amazon',
    localizedUrl: 'https://www.amazon.com/s?k=Anker+737+power+bank+24000mAh+140W+fast+charger&tag=photoid03-20',
    clickTrackUrl: '/api/amazon-ads/click?site=akilibrain&slot=ad-slot&product=akil-13',
  },
  {
    id: 'akil-15',
    title: 'ASUS ZenScreen 15.6" Full HD Portable USB-C Monitor',
    description: 'Dual-screen productivity anywhere — slips into a laptop backpack for remote audit teams.',
    badge: 'Mobile Dual Screen',
    priceEstimate: '$149.00',
    ctaText: 'Check Price on Amazon',
    localizedUrl: 'https://www.amazon.com/dp/B08CVTTNN4?tag=photoid03-20',
    clickTrackUrl: '/api/amazon-ads/click?site=akilibrain&slot=ad-slot&product=akil-15',
  },
  {
    id: 'akil-12',
    title: 'Logitech MX Master 3S Wireless Performance Mouse',
    description: '8K DPI sensor tracks on glass with quiet clicks and hyper-fast MagSpeed scrolling.',
    badge: '#1 Pro Mouse',
    priceEstimate: '$99.99',
    ctaText: 'View on Amazon',
    localizedUrl: 'https://www.amazon.com/dp/B07S395RWD?tag=photoid03-20',
    clickTrackUrl: '/api/amazon-ads/click?site=akilibrain&slot=ad-slot&product=akil-12',
  },
  {
    id: 'akil-19',
    title: 'APC UPS 600VA Battery Backup & Surge Protector',
    description: 'Prevents unexpected shutdowns and data corruption on office workstations during grid dips.',
    badge: 'Power Defense',
    priceEstimate: '$76.99',
    ctaText: 'Check Price on Amazon',
    localizedUrl: 'https://www.amazon.com/s?k=APC+UPS+600VA+battery+backup+surge+protector&tag=photoid03-20',
    clickTrackUrl: '/api/amazon-ads/click?site=akilibrain&slot=ad-slot&product=akil-19',
  },
];

const QUICK_CATEGORIES = [
  { label: '🎧 Noise-Cancelling Headsets', q: 'wireless headset noise cancelling microphone zoom teams' },
  { label: '🖨️ Duplex Tender Scanners', q: 'wireless duplex document scanner office pdf' },
  { label: '🔋 140W Laptop Power Banks', q: '140W laptop power bank 24000mAh USB C PD' },
  { label: '📚 PMP, AWS & CPA Study Guides', q: 'PMP AWS CompTIA certification official study guide' },
];

export function AdSlot({ slotId = 'in-feed', className = '', context = '', limit = 8 }: AdSlotProps) {
  const [products, setProducts] = useState<DynamicAmazonProduct[]>(FALLBACK_PRODUCTS.slice(0, limit));

  useEffect(() => {
    let mounted = true;
    const mappedSlot = slotId.includes('tender')
      ? 'tender-office-gear'
      : slotId.includes('compliance')
        ? 'guide-compliance-inline'
        : 'career-resources';

    fetch(
      `/api/amazon-ads/serve?site=akilibrain&slot=${encodeURIComponent(mappedSlot)}&context=${encodeURIComponent(
        context,
      )}&limit=${limit}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data?.allowed && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [slotId, context, limit]);

  return (
    <div
      className={`w-full rounded-xl border border-white/10 bg-card/60 p-4 my-4 ${className}`}
      data-amz-slot={slotId}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground mb-3">
        <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5" /> Featured Professional, Remote Work &amp; Office Gear (Amazon)
        </span>
        <span>As an Amazon Associate (photoid03-20) we earn from qualifying purchases</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {products.map((prod) => (
          <a
            key={prod.id}
            href={prod.clickTrackUrl || prod.localizedUrl}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="group rounded-lg border border-white/10 bg-background/50 hover:border-amber-400/40 p-3 flex flex-col justify-between gap-2 transition-all text-left"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 truncate">
                  {prod.badge}
                </span>
                <span className="text-xs font-mono text-emerald-400 shrink-0">{prod.priceEstimate}</span>
              </div>
              <p className="text-xs font-semibold text-foreground group-hover:text-amber-300 line-clamp-2">
                {prod.title}
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{prod.description}</p>
            </div>
            <span className="w-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-md group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
              {prod.ctaText || 'View on Amazon'} <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </a>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-white/5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Quick Shop:</span>
        {QUICK_CATEGORIES.map((cat) => (
          <a
            key={cat.label}
            href={`https://www.amazon.com/s?k=${encodeURIComponent(cat.q)}&tag=photoid03-20`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 hover:border-amber-400/40 hover:text-amber-300 transition-colors"
          >
            {cat.label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}
