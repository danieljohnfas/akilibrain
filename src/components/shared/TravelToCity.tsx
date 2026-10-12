import { Bus, ArrowUpRight } from 'lucide-react';

// Tanzanian cities covered by tiketichap.com (bus, ferry, SGR train and domestic flights).
const TIKETICHAP_CITIES = new Set([
  'dar es salaam', 'arusha', 'mwanza', 'dodoma', 'mbeya', 'morogoro', 'tanga', 'zanzibar',
  'moshi', 'kigoma', 'tabora', 'iringa', 'mtwara', 'lindi', 'songea', 'shinyanga', 'singida',
  'musoma', 'bukoba', 'sumbawanga', 'kahama', 'geita', 'babati', 'njombe', 'mpanda', 'bariadi',
]);

/**
 * Cross-link to tiketichap.com for job seekers who need to travel within Tanzania.
 * Renders only for Tanzanian locations.
 */
export function TravelToCity({ city, country }: { city?: string; country?: string }) {
  const cityKey = (city || '').trim().toLowerCase().replace(/-/g, ' ');
  const inTanzania = (country || '').trim().toLowerCase() === 'tanzania';
  const known = TIKETICHAP_CITIES.has(cityKey);
  if (!known && !inTanzania) return null;

  const href = known
    ? `https://tiketichap.com/?destination=${encodeURIComponent(city!.trim())}&utm_source=akilibrain.com&utm_medium=referral`
    : 'https://tiketichap.com/?utm_source=akilibrain.com&utm_medium=referral';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 my-6 hover:border-primary/40"
    >
      <span className="flex items-center gap-3">
        <Bus className="w-5 h-5 text-primary shrink-0" />
        <span>
          <span className="font-medium">
            {known ? `Travelling to ${city!.trim()} for an interview?` : 'Travelling for an interview in Tanzania?'}
          </span>
          <span className="block text-sm text-muted-foreground">
            Compare buses, ferries, the SGR train and flights on TiketiChap.
          </span>
        </span>
      </span>
      <ArrowUpRight className="w-4 h-4 shrink-0" />
    </a>
  );
}
