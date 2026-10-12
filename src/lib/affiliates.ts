/**
 * Affiliate partners for career resources (courses).
 *
 * A partner is shown only when its link template is configured, so the site never shows a
 * link that cannot earn. Each template comes from the partner's affiliate network and contains
 * `{url}` where the destination page goes, for example:
 *
 *   AFFILIATE_COURSERA_TEMPLATE=https://<network-domain>/c/<publisher-id>/<ad-id>/<campaign-id>?u={url}
 *   AFFILIATE_UDEMY_TEMPLATE=https://click.linksynergy.com/deeplink?id=<publisher-id>&mid=<udemy-merchant-id>&murl={url}
 *
 * Visitors reach a partner through /api/go/<partner>, which builds the final link server-side
 * (so the route can only ever redirect to a configured partner) and logs the click.
 */

export type AffiliatePartner = 'coursera' | 'udemy';

interface PartnerConfig {
  name: string;
  envVar: string;
  searchUrl: (query: string) => string;
  homeUrl: string;
}

const PARTNERS: Record<AffiliatePartner, PartnerConfig> = {
  coursera: {
    name: 'Coursera',
    envVar: 'AFFILIATE_COURSERA_TEMPLATE',
    searchUrl: (q) => `https://www.coursera.org/search?query=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.coursera.org/',
  },
  udemy: {
    name: 'Udemy',
    envVar: 'AFFILIATE_UDEMY_TEMPLATE',
    searchUrl: (q) => `https://www.udemy.com/courses/search/?q=${encodeURIComponent(q)}`,
    homeUrl: 'https://www.udemy.com/',
  },
};

export function isAffiliatePartner(value: string): value is AffiliatePartner {
  return Object.prototype.hasOwnProperty.call(PARTNERS, value);
}

function templateFor(partner: AffiliatePartner): string | null {
  const template = process.env[PARTNERS[partner].envVar]?.trim();
  return template && template.includes('{url}') && /^https:\/\//.test(template) ? template : null;
}

/** Partners that have a configured template, in display order. */
export function enabledAffiliatePartners(): Array<{ id: AffiliatePartner; name: string }> {
  return (Object.keys(PARTNERS) as AffiliatePartner[])
    .filter((id) => templateFor(id) !== null)
    .map((id) => ({ id, name: PARTNERS[id].name }));
}

/** Final affiliate URL for a course search (or the partner's home page when query is empty). */
export function buildAffiliateUrl(partner: AffiliatePartner, query: string): string | null {
  const template = templateFor(partner);
  if (!template) return null;
  const config = PARTNERS[partner];
  const destination = query ? config.searchUrl(query) : config.homeUrl;
  return template.replace('{url}', encodeURIComponent(destination));
}
