import { ShoppingBag, ArrowUpRight, Sparkles } from 'lucide-react';
import { serveDynamicProducts } from '@/lib/amazon-ads/engine';
import { AMAZON_ASSOCIATE_TAG } from '@/lib/amazon-ads/catalog';

export function AmazonGearBox({
  slot = 'job-detail-sidebar',
  context = '',
  title = 'Remote Interview, Executive & Tender Office Gear',
  compact = false,
  limit,
}: {
  slot?: string;
  context?: string;
  title?: string;
  compact?: boolean;
  limit?: number;
}) {
  const feed = serveDynamicProducts({
    site: 'akilibrain',
    slot,
    context,
    limit: limit ?? (compact ? 6 : 9),
    recordImpression: true,
  });

  if (!feed.products.length) return null;

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{title}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Amazon • {AMAZON_ASSOCIATE_TAG}</span>
      </div>

      <div className={compact ? 'space-y-2.5' : 'grid grid-cols-1 md:grid-cols-3 gap-3'}>
        {feed.products.map((p) => (
          <a
            key={p.id}
            href={`/api/amazon-ads/click?site=akilibrain&slot=${encodeURIComponent(slot)}&product=${encodeURIComponent(
              p.id,
            )}`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="block rounded-lg border border-white/10 bg-background/70 hover:border-amber-400/50 p-3 space-y-1.5 transition-all group"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded">
                {p.badge}
              </span>
              <span className="font-mono text-emerald-400 font-semibold">{p.priceEstimate}</span>
            </div>
            <div className="text-xs font-semibold text-foreground group-hover:text-amber-300 line-clamp-2">
              {p.title}
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>
            <div className="pt-1 flex items-center justify-between text-[11px] font-medium text-amber-400">
              <span className="inline-flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" /> {p.ctaText}
              </span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </a>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        As an Amazon Associate we earn from qualifying purchases.
      </p>
    </div>
  );
}
