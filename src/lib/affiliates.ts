/**
 * Affiliate partners for career resources, professional books, and remote work equipment.
 *
 * Amazon Associates (`photoid03-20`) is always enabled across AkiliBrain.
 * Optional course network templates (Coursera / Udemy) are also supported when configured.
 */

import { AMAZON_ASSOCIATE_TAG } from './amazon-ads/catalog';

export type AffiliatePartner = 'amazon' | 'coursera' | 'udemy';

interface PartnerConfig {
  name: string;
  envVar?: string;
  alwaysEnabled?: boolean;
  searchUrl: (query: string) => string;
  homeUrl: string;
}

const PARTNERS: Record<AffiliatePartner, PartnerConfig> = {
  amazon: {
    name: 'Amazon',
    alwaysEnabled: true,
    searchUrl: (q) =>
      `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${encodeURIComponent(AMAZON_ASSOCIATE_TAG)}`,
    homeUrl: `https://www.amazon.com/?tag=${encodeURIComponent(AMAZON_ASSOCIATE_TAG)}`,
  },
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
  const cfg = PARTNERS[partner];
  if (cfg.alwaysEnabled) return '{url}';
  if (!cfg.envVar) return null;
  const template = process.env[cfg.envVar]?.trim();
  return template && template.includes('{url}') && /^https:\/\//.test(template) ? template : null;
}

/** Partners that are enabled, in display order. */
export function enabledAffiliatePartners(): Array<{ id: AffiliatePartner; name: string }> {
  return (Object.keys(PARTNERS) as AffiliatePartner[])
    .filter((id) => templateFor(id) !== null)
    .map((id) => ({ id, name: PARTNERS[id].name }));
}

/** Final affiliate URL for a search query (or the partner's home page when query is empty). */
export function buildAffiliateUrl(partner: AffiliatePartner, query: string): string | null {
  const cfg = PARTNERS[partner];
  if (cfg.alwaysEnabled) {
    return query ? cfg.searchUrl(query) : cfg.homeUrl;
  }
  const template = templateFor(partner);
  if (!template) return null;
  const destination = query ? cfg.searchUrl(query) : cfg.homeUrl;
  return template.replace('{url}', encodeURIComponent(destination));
}
