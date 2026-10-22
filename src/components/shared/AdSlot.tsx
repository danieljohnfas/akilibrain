'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

interface AdSlotProps {
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
  context?: string;
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
];

export function AdSlot({ slotId = 'in-feed', className = '', context = '' }: AdSlotProps) {
  const [products, setProducts] = useState<DynamicAmazonProduct[]>(FALLBACK_PRODUCTS);

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
      )}&limit=2`,
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
  }, [slotId, context]);

  return (
    <div
      className={`w-full rounded-xl border border-white/10 bg-card/60 p-4 my-4 ${className}`}
      data-amz-slot={slotId}
    >
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2.5">
        <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5" /> Featured Professional & Office Gear (Amazon)
        </span>
        <span>As an Amazon Associate we earn from qualifying purchases</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {products.map((prod) => (
          <a
            key={prod.id}
            href={prod.clickTrackUrl || prod.localizedUrl}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="group rounded-lg border border-white/10 bg-background/50 hover:border-amber-400/40 p-3 flex items-center justify-between gap-3 transition-all text-left"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                  {prod.badge}
                </span>
                <span className="text-xs font-mono text-emerald-400">{prod.priceEstimate}</span>
              </div>
              <p className="text-sm font-medium text-foreground group-hover:text-amber-300 truncate">
                {prod.title}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">{prod.description}</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-md group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
              View <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
