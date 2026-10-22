import { afterEach, describe, expect, it } from 'vitest';
import { buildAffiliateUrl, enabledAffiliatePartners, isAffiliatePartner } from '@/lib/affiliates';

const ENV_KEYS = ['AFFILIATE_COURSERA_TEMPLATE', 'AFFILIATE_UDEMY_TEMPLATE'] as const;

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe('affiliates', () => {
  it('shows amazon as always enabled and no external course partners until configured', () => {
    expect(enabledAffiliatePartners()).toEqual([{ id: 'amazon', name: 'Amazon' }]);
    expect(buildAffiliateUrl('coursera', 'data analyst')).toBeNull();
    expect(buildAffiliateUrl('amazon', 'laptop stand')).toContain('tag=photoid03-20');
  });

  it('builds a search deep link inside the configured template', () => {
    process.env.AFFILIATE_COURSERA_TEMPLATE = 'https://aff.example/c/1/2/3?u={url}';
    expect(enabledAffiliatePartners()).toEqual([
      { id: 'amazon', name: 'Amazon' },
      { id: 'coursera', name: 'Coursera' },
    ]);
    const url = buildAffiliateUrl('coursera', 'data analyst');
    expect(url).toBe(
      'https://aff.example/c/1/2/3?u=' + encodeURIComponent('https://www.coursera.org/search?query=data%20analyst'),
    );
  });

  it('uses the partner home page when the query is empty', () => {
    process.env.AFFILIATE_UDEMY_TEMPLATE = 'https://aff.example/deeplink?murl={url}';
    expect(buildAffiliateUrl('udemy', '')).toBe(
      'https://aff.example/deeplink?murl=' + encodeURIComponent('https://www.udemy.com/'),
    );
  });

  it('ignores templates that are not https or lack {url}', () => {
    process.env.AFFILIATE_COURSERA_TEMPLATE = 'http://aff.example/?u={url}';
    process.env.AFFILIATE_UDEMY_TEMPLATE = 'https://aff.example/no-placeholder';
    expect(enabledAffiliatePartners()).toEqual([{ id: 'amazon', name: 'Amazon' }]);
  });

  it('only accepts known partner ids', () => {
    expect(isAffiliatePartner('coursera')).toBe(true);
    expect(isAffiliatePartner('toString')).toBe(false);
    expect(isAffiliatePartner('evil.example')).toBe(false);
  });
});
