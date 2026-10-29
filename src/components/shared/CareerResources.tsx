import { GraduationCap, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { serveDynamicProducts } from '@/lib/amazon-ads/engine';
import { AMAZON_ASSOCIATE_TAG } from '@/lib/amazon-ads/catalog';

/**
 * Contextual Amazon Associates (photoid03-20) Career Books, Certification Guides & Remote Interview Gear
 * Dynamically pulled from the Central Amazon Ads Engine with impression & click telemetry.
 */
export function CareerResources({
  topic,
  placement,
  limit = 12,
}: {
  topic?: string;
  placement: string;
  limit?: number;
}) {
  const subject = topic?.trim() || '';
  const feed = serveDynamicProducts({
    site: 'akilibrain',
    slot: 'career-resources',
    context: subject,
    limit,
    recordImpression: true,
  });

  const products = feed.products;
  const quickCategories = [
    { label: '📚 PMP & Agile Certs', q: 'PMP PMBOK 7th Edition exam prep book' },
    { label: '☁️ AWS & Cloud Guides', q: 'AWS Certified Solutions Architect study guide' },
    { label: '💻 Software & System Design', q: 'System Design Interview Cracking the Coding Interview' },
    { label: '🛡️ Cybersecurity & CompTIA', q: 'CompTIA Security+ CISSP official study guide' },
    { label: '🎧 Zoom Interview Headsets', q: 'wireless headset noise cancelling microphone zoom' },
    { label: '🖨️ Tender & Office Scanners', q: 'Brother Epson duplex document scanner pdf' },
  ];

  return (
    <aside
      className="w-full rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] via-card to-indigo-500/[0.05] p-5 my-6 space-y-4"
      aria-label="Recommended Career Books & Remote Work Gear"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 text-foreground">
            <GraduationCap className="w-5 h-5 text-amber-400 shrink-0" />
            {subject
              ? `Top Books, Certifications & Remote Work Gear for ${subject} Professionals`
              : 'Recommended Career Prep Books, Certification Guides & Remote Work Equipment'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            As an Amazon Associate (ID: {AMAZON_ASSOCIATE_TAG}) AkiliBrain earns from qualifying purchases.
          </p>
        </div>
        <a
          href={`https://www.amazon.com/s?k=${encodeURIComponent(
            subject ? `${subject} certification exam prep book` : 'career interview preparation books remote work headset',
          )}&tag=${AMAZON_ASSOCIATE_TAG}`}
          target="_blank"
          rel="sponsored nofollow noopener"
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 shrink-0"
        >
          Browse All on Amazon <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map((prod) => (
          <a
            key={prod.id}
            href={`/api/amazon-ads/click?site=akilibrain&slot=${encodeURIComponent(
              placement || 'career-resources',
            )}&product=${encodeURIComponent(prod.id)}`}
            target="_blank"
            rel="sponsored nofollow noopener"
            data-amz-product-id={prod.id}
            data-amz-slot={placement}
            className="group rounded-lg border border-white/10 bg-background/60 hover:border-amber-400/50 hover:bg-amber-500/[0.04] p-3.5 flex flex-col justify-between gap-2.5 transition-all"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 truncate">
                  {prod.badge}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold shrink-0">{prod.priceEstimate}</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground group-hover:text-amber-300 transition-colors line-clamp-2">
                {prod.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{prod.description}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-medium text-amber-400">
              <span className="inline-flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" /> {prod.ctaText}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </a>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Explore Categories:</span>
        {quickCategories.map((cat) => (
          <a
            key={cat.label}
            href={`https://www.amazon.com/s?k=${encodeURIComponent(cat.q)}&tag=${AMAZON_ASSOCIATE_TAG}`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="text-xs px-3 py-1 rounded-full bg-background/60 border border-white/10 hover:border-amber-400/50 hover:text-amber-300 transition-colors"
          >
            {cat.label} ↗
          </a>
        ))}
      </div>
    </aside>
  );
}
