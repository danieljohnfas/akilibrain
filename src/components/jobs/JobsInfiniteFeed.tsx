'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { JobCard } from '@/components/jobs/JobCard';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface JobItem {
  job: {
    id: string;
    title: string;
    companyName: string;
    description: string | null;
    requirements: string | null;
    jobType: any;
    sourceUrl: string | null;
    postedDate: string | Date | null;
    deadline: string | Date | null;
    createdAt: string | Date;
    isActive: boolean;
    isAggregatorSource: boolean;
    employerUrl: string | null;
  };
  country: string | null;
  region: string | null;
}

interface JobsInfiniteFeedProps {
  initialJobs: JobItem[];
  totalCount: number;
  initialPage?: number;
  searchParams: {
    q?: string;
    type?: string;
    company?: string;
    country?: string;
    time?: string;
  };
  layout?: 'grid' | 'list';
  careerResourcesSlot?: React.ReactNode;
  adSlot?: React.ReactNode;
}

export function JobsInfiniteFeed({
  initialJobs,
  totalCount,
  searchParams,
  layout = 'grid',
  careerResourcesSlot,
  adSlot,
}: JobsInfiniteFeedProps) {
  const [items, setItems] = useState<JobItem[]>(initialJobs);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(initialJobs.length < totalCount);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(nextPage));
      if (searchParams.q) queryParams.set('q', searchParams.q);
      if (searchParams.type) queryParams.set('type', searchParams.type);
      if (searchParams.company) queryParams.set('company', searchParams.company);
      if (searchParams.country) queryParams.set('country', searchParams.country);
      if (searchParams.time) queryParams.set('time', searchParams.time);

      const res = await fetch(`/api/jobs?${queryParams.toString()}`);
      if (!res.ok) {
        setHasMore(false);
        return;
      }

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      const newJobs: JobItem[] = data.jobs || [];

      if (newJobs.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.job.id));
          const filtered = newJobs.filter((i) => !existingIds.has(i.job.id));
          return [...prev, ...filtered];
        });
        setPage(nextPage);
        setHasMore(Boolean(data.hasMore));
      }
    } catch (err) {
      console.error('Failed to load more jobs:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, searchParams]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '400px 0px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  return (
    <div className="space-y-6">
      <div
        className={
          layout === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'flex flex-col gap-3'
        }
      >
        {items.map(({ job, country, region }, idx) => (
          <React.Fragment key={job.id}>
            <JobCard
              id={job.id}
              title={job.title}
              companyName={job.companyName}
              description={job.description || ''}
              requirements={job.requirements}
              location={region || null}
              country={country || 'Africa'}
              jobType={(job.jobType as any) ?? 'full_time'}
              isAggregatorSource={job.isAggregatorSource}
              employerUrl={job.employerUrl}
              sourceUrl={job.sourceUrl || ''}
              postedDate={job.postedDate ? new Date(job.postedDate) : null}
              deadline={job.deadline ? new Date(job.deadline) : null}
              createdAt={new Date(job.createdAt)}
              layout={layout}
            />
            {idx === 2 && careerResourcesSlot && (
              <div
                className={
                  layout === 'grid'
                    ? 'col-span-1 md:col-span-2 lg:col-span-3'
                    : 'w-full'
                }
              >
                {careerResourcesSlot}
              </div>
            )}
            {(idx === 5 || idx === 11 || idx === 17 || idx === 23) && adSlot && (
              <div
                className={
                  layout === 'grid'
                    ? 'col-span-1 md:col-span-2 lg:col-span-3'
                    : 'w-full'
                }
              >
                {adSlot}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} className="h-4 w-full" />

      {/* Loading state indicator */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
            Loading more verified employer jobs...
          </span>
        </div>
      )}

      {/* End of results message */}
      {!hasMore && items.length > 0 && (
        <div className="flex items-center justify-center py-8 text-center border-t border-white/5 mt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>You&apos;ve viewed all {items.length} verified direct employer positions</span>
          </div>
        </div>
      )}
    </div>
  );
}
