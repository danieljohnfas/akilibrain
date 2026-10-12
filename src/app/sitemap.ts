import type { MetadataRoute } from 'next';
import { db, safeQuery } from '@/lib/db/client';
import { jobs } from '@/lib/db/schema/jobs';
import { guides } from '@/lib/db/schema/guides';
import { tenders } from '@/lib/db/schema/tenders';
import { eq, and, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://akilibrain.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tenders`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/salaries`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compliance`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/developers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  try {
    // Top 500 recent active jobs for Google SEO indexing
    const recentJobs = await safeQuery(
      db
        .select({ id: jobs.id, updatedAt: jobs.updatedAt })
        .from(jobs)
        .where(eq(jobs.isActive, true))
        .orderBy(desc(jobs.createdAt))
        .limit(500),
      5000,
      'Sitemap jobs fetch'
    );

    const jobRoutes: MetadataRoute.Sitemap = (recentJobs || []).map((j) => ({
      url: `${baseUrl}/jobs/${j.id}`,
      lastModified: j.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Published Guides
    const publishedGuides = await safeQuery(
      db
        .select({ slug: guides.slug, updatedAt: guides.updatedAt })
        .from(guides)
        .where(eq(guides.isPublished, true))
        .limit(100),
      5000,
      'Sitemap guides fetch'
    );

    const guideRoutes: MetadataRoute.Sitemap = (publishedGuides || []).map((g) => ({
      url: `${baseUrl}/guides/${g.slug}`,
      lastModified: g.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Open Tenders
    const openTenders = await safeQuery(
      db
        .select({ id: tenders.id, updatedAt: tenders.updatedAt })
        .from(tenders)
        .where(eq(tenders.status, 'open'))
        .limit(100),
      5000,
      'Sitemap tenders fetch'
    );

    const tenderRoutes: MetadataRoute.Sitemap = (openTenders || []).map((t) => ({
      url: `${baseUrl}/tenders/${t.id}`,
      lastModified: t.updatedAt || new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    return [...staticRoutes, ...jobRoutes, ...guideRoutes, ...tenderRoutes];
  } catch (err) {
    console.error('[Sitemap Generation Error]', err);
    return staticRoutes;
  }
}
