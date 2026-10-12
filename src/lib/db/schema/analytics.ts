import { pgTable, uuid, timestamp, text, varchar } from 'drizzle-orm/pg-core';

export const outboundClicks = pgTable('outbound_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'job', 'tender', 'compliance_resource'
  entityId: uuid('entity_id').notNull(),
  targetUrl: text('target_url').notNull(),
  clickedAt: timestamp('clicked_at').defaultNow().notNull(),
});

// Clicks on affiliate links (/api/go/<partner>), so earnings can be matched to page placements.
export const affiliateClicks = pgTable('affiliate_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  partner: varchar('partner', { length: 50 }).notNull(),
  placement: varchar('placement', { length: 50 }),
  query: text('query'),
  clickedAt: timestamp('clicked_at').defaultNow().notNull(),
});
