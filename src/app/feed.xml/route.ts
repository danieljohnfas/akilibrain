import { NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db/client';
import { jobs } from '@/lib/db/schema/jobs';
import { countries, regions } from '@/lib/db/schema/shared';
import { eq, and, or, isNull, gt, desc } from 'drizzle-orm';

export const revalidate = 3600;

function escapeCdata(str: string): string {
  return str.replace(/]]>/g, ']]]]><![CDATA[>');
}

export async function GET() {
  const activeCondition = and(
    eq(jobs.isActive, true),
    or(isNull(jobs.deadline), gt(jobs.deadline, new Date()))
  );

  const latestJobs = await safeQuery(
    db
      .select({
        id: jobs.id,
        title: jobs.title,
        companyName: jobs.companyName,
        description: jobs.description,
        createdAt: jobs.createdAt,
        postedDate: jobs.postedDate,
        region: regions.name,
        country: countries.name,
      })
      .from(jobs)
      .leftJoin(countries, eq(jobs.countryId, countries.id))
      .leftJoin(regions, eq(jobs.regionId, regions.id))
      .where(activeCondition)
      .orderBy(desc(jobs.createdAt))
      .limit(50)
  );

  const itemsXml = latestJobs
    .map((job) => {
      const pubDate = (job.postedDate || job.createdAt).toUTCString();
      const location = [job.region, job.country].filter(Boolean).join(', ') || 'East Africa';
      const company = job.companyName && job.companyName.toLowerCase() !== 'unknown' ? ` at ${job.companyName}` : '';
      const title = `${job.title}${company} (${location})`;
      const link = `https://akilibrain.com/jobs/${job.id}`;
      const descText = job.description
        ? job.description.slice(0, 400) + (job.description.length > 400 ? '...' : '')
        : `Apply for ${job.title} in ${location}.`;

      return `    <item>
      <title><![CDATA[${escapeCdata(title)}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${escapeCdata(descText)}]]></description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AkiliBrain — Latest Jobs &amp; Opportunities in East Africa</title>
    <link>https://akilibrain.com</link>
    <description>Daily updated verified job vacancies, careers, and procurement opportunities across Kenya, Tanzania, Uganda, and Rwanda.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://akilibrain.com/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
