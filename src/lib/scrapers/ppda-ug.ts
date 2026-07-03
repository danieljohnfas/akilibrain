import { StrategyEngine } from '../strategies/engine';
import {
  FirecrawlStrategy,
  MaxunStrategy,
  Crawl4AiStrategy,
  CrawleeStrategy,
} from '../strategies/scraper-strategies';
import { db } from '../db/client';
import { tenders } from '../db/schema/tenders';
import { countries } from '../db/schema/shared';
import { eq } from 'drizzle-orm';

/**
 * Uganda Public Procurement and Disposal of Public Assets Authority (PPDA)
 * Portal: https://www.ppda.go.ug/
 */
export async function scrapePPDAUganda(): Promise<number> {
  const targetUrl = 'https://www.ppda.go.ug/public-notices/';

  const scraperEngine = new StrategyEngine([
    new FirecrawlStrategy(),
    new MaxunStrategy(),
    new Crawl4AiStrategy(),
    new CrawleeStrategy(),
  ]);

  try {
    console.log(`Starting PPDA Uganda scrape for ${targetUrl}...`);

    const { result, strategyUsed } = await scraperEngine.executeWithFallback({
      url: targetUrl,
      portalType: 'ppda_ug',
    });

    console.log(`Scraped ${result.length} tenders via ${strategyUsed}.`);
    if (result.length === 0) return 0;

    const [ug] = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.code, 'UG'))
      .limit(1);

    if (!ug) {
      console.warn('Uganda country record not found. Cannot insert tenders.');
      return 0;
    }

    const formattedTenders = result.map((t: any) => ({
      title: t.title,
      referenceNo: t.referenceNo || `UG-TND-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      description: t.description || null,
      contractingAuthority: t.contractingAuthority || 'PPDA Uganda',
      countryId: ug.id,
      publishedAt: new Date(t.publishedDate || Date.now()),
      deadline: new Date(t.deadline || Date.now() + 86400000 * 30),
      sourceUrl: t.sourceUrl || targetUrl,
      status: t.status || 'open',
    }));

    const inserted = await db
      .insert(tenders)
      .values(formattedTenders)
      .onConflictDoNothing({ target: tenders.referenceNo })
      .returning({ id: tenders.id });

    console.log(`Inserted ${inserted.length} new Uganda tenders.`);
    return inserted.length;
  } catch (error) {
    console.error('All scraper strategies failed for PPDA Uganda:', error);
    return 0;
  }
}