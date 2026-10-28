import { NextRequest, NextResponse } from 'next/server';
import { db, safeQuery } from '@/lib/db/client';
import { jobs } from '@/lib/db/schema/jobs';
import { countries, regions } from '@/lib/db/schema/shared';
import { eq, desc, ilike, and, or, isNull, isNotNull, ne, gt, count, sql } from 'drizzle-orm';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

export async function GET(request: NextRequest) {
  const limited = await enforceRateLimit(request, { prefix: 'api-jobs', max: 120, window: '1 m' });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || String(PAGE_SIZE), 10) || PAGE_SIZE));
  const offset = (page - 1) * limit;

  const q = searchParams.get('q')?.trim() || '';
  const type = searchParams.get('type')?.trim() || '';
  const company = searchParams.get('company')?.trim() || '';
  const country = searchParams.get('country')?.trim() || '';
  const time = searchParams.get('time')?.trim() || '';

  // Enforce authentic direct employer jobs only:
  // 1. Must be active
  // 2. Deadline must be null or in the future
  // 3. isAggregatorSource must be false (NO aggregators)
  // 4. employerUrl must NOT be null and must NOT be empty string
  const activeCondition = and(
    eq(jobs.isActive, true),
    or(isNull(jobs.deadline), gt(jobs.deadline, sql`now()`)),
    eq(jobs.isAggregatorSource, false),
    isNotNull(jobs.employerUrl),
    ne(jobs.employerUrl, '')
  );

  let countryId: string | undefined;
  let regionId: string | undefined;
  if (country && country !== 'all') {
    const cRes = await safeQuery(db.select({ id: countries.id }).from(countries).where(eq(countries.name, country)).limit(1));
    if (cRes.length > 0) {
      countryId = cRes[0].id;
    } else {
      const rRes = await safeQuery(db.select({ id: regions.id }).from(regions).where(eq(regions.name, country)).limit(1));
      if (rRes.length > 0) regionId = rRes[0].id;
    }
  }

  const now = Date.now();
  const conditions = [
    activeCondition,
    q ? ilike(jobs.title, `%${q}%`) : undefined,
    type && type !== 'all' ? eq(jobs.jobType, type as never) : undefined,
    company ? ilike(jobs.companyName, `%${company}%`) : undefined,
    countryId ? eq(jobs.countryId, countryId) : undefined,
    regionId ? eq(jobs.regionId, regionId) : undefined,
    time === '24h' ? gt(jobs.createdAt, new Date(now - 24 * 60 * 60 * 1000)) : undefined,
    time === '7d' ? gt(jobs.createdAt, new Date(now - 7 * 24 * 60 * 60 * 1000)) : undefined,
    time === '30d' ? gt(jobs.createdAt, new Date(now - 30 * 24 * 60 * 60 * 1000)) : undefined,
  ].filter(Boolean);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const [totalCountResult, data] = await Promise.all([
      safeQuery(
        db.select({ value: count() })
          .from(jobs)
          .where(whereClause)
      ),
      safeQuery(
        db
          .select({
            job: {
              id: jobs.id,
              title: jobs.title,
              companyName: jobs.companyName,
              description: jobs.description,
              requirements: jobs.requirements,
              jobType: jobs.jobType,
              sourceUrl: jobs.sourceUrl,
              postedDate: jobs.postedDate,
              deadline: jobs.deadline,
              createdAt: jobs.createdAt,
              isActive: jobs.isActive,
              isAggregatorSource: jobs.isAggregatorSource,
              employerUrl: jobs.employerUrl
            },
            country: countries.name,
            region: regions.name,
          })
          .from(jobs)
          .leftJoin(countries, eq(jobs.countryId, countries.id))
          .leftJoin(regions, eq(jobs.regionId, regions.id))
          .where(whereClause)
          .orderBy(desc(jobs.createdAt))
          .limit(limit)
          .offset(offset)
      )
    ]);

    const totalCount = totalCountResult?.[0]?.value || 0;
    const hasMore = offset + data.length < totalCount;

    return NextResponse.json({
      jobs: data,
      totalCount,
      page,
      limit,
      hasMore,
    });
  } catch (err: any) {
    console.error('Error fetching jobs API:', err);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
