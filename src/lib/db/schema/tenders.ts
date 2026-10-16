import { pgTable, text, timestamp, uuid, numeric, boolean, index, uniqueIndex, pgEnum, check } from 'drizzle-orm/pg-core';
import { countries, regions } from './shared';
import { sql } from 'drizzle-orm';

export const tenderStatusEnum = pgEnum('tender_status', ['open', 'closed', 'awarded', 'cancelled']);
export const tenderCategoryEnum = pgEnum('tender_category', ['goods', 'works', 'services', 'consultancy']);

export const tenderSectors = pgTable('tender_sectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const tenders = pgTable('tenders', {
  id: uuid('id').primaryKey().defaultRandom(),
  referenceNo: text('reference_no').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  contractingAuthority: text('contracting_authority').notNull(),
  countryId: uuid('country_id').notNull().references(() => countries.id),
  regionId: uuid('region_id').references(() => regions.id),
  sectorId: uuid('sector_id').references(() => tenderSectors.id),
  category: tenderCategoryEnum('category').default('services'),
  status: tenderStatusEnum('status').notNull().default('open'),
  budget: numeric('budget', { precision: 18, scale: 2 }),
  currency: text('currency').default('USD'),
  publishedAt: timestamp('published_at'),
  deadline: timestamp('deadline'),  // null = deadline not published yet
  sourceUrl: text('source_url').notNull().unique(),
  documentUrl: text('document_url'),
  // Employer-first sourcing — resolved direct contracting authority URL
  employerUrl: text('employer_url'),              // resolved authority/government portal URL
  aiSummary: text('ai_summary'),
  isAggregatorSource: boolean('is_aggregator_source').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('tenders_country_idx').on(table.countryId),
  index('tenders_region_idx').on(table.regionId),
  index('tenders_status_idx').on(table.status),
  index('tenders_deadline_idx').on(table.deadline),
  index('tenders_created_at_idx').on(table.createdAt),
  index('tenders_search_idx').using('gin', sql`to_tsvector('english', ${table.title} || ' ' || coalesce(${table.description}, ''))`),
  // Secondary dedup guard: prevents same tender re-inserted with a different auto-generated referenceNo
  uniqueIndex('tenders_title_authority_country_udx').on(table.title, table.contractingAuthority, table.countryId),
  check('tenders_contracting_authority_valid_chk', sql`length(trim(${table.contractingAuthority})) >= 3 AND lower(trim(${table.contractingAuthority})) NOT IN ('the', 'to', 'by', 'a', 'under', 'procuring entity', 'south sudan contracting authority', 'unknown', 'n/a')`),
  check('tenders_ai_summary_not_empty_chk', sql`${table.aiSummary} IS NOT NULL AND length(trim(${table.aiSummary})) >= 20`),
  check('tenders_sector_id_not_null_chk', sql`${table.sectorId} IS NOT NULL`),
  check('tenders_employer_url_not_empty_chk', sql`${table.employerUrl} IS NOT NULL AND trim(${table.employerUrl}) <> ''`),
]);
