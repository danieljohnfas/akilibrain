import { GraduationCap, ArrowUpRight } from 'lucide-react';
import { enabledAffiliatePartners } from '@/lib/affiliates';

/**
 * Course recommendations through affiliate partners. Renders nothing until at least one
 * partner template is configured (see src/lib/affiliates.ts).
 */
export function CareerResources({ topic, placement }: { topic?: string; placement: string }) {
  const partners = enabledAffiliatePartners();
  if (partners.length === 0) return null;

  const subject = topic?.trim() || '';
  const query = subject || 'career skills';

  return (
    <aside className="w-full rounded-xl border border-primary/20 bg-primary/5 p-6 my-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          {subject ? `Build the skills ${subject} employers ask for` : 'Build the skills employers ask for'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Online courses with certificates you can add to your CV.
          <span className="block text-xs mt-1">Affiliate links: AkiliBrain may earn a commission at no extra cost to you.</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {partners.map((p) => (
          <a
            key={p.id}
            href={`/api/go/${p.id}?q=${encodeURIComponent(query)}&from=${encodeURIComponent(placement)}`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 px-4 py-2 text-sm font-medium hover:bg-primary/10"
          >
            {p.name} courses <ArrowUpRight className="w-4 h-4" />
          </a>
        ))}
      </div>
    </aside>
  );
}
