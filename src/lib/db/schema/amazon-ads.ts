import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
} from 'drizzle-orm/pg-core';

export const amazonProducts = pgTable('amazon_products', {
  id: varchar('id', { length: 100 }).primaryKey(),
  siteKey: varchar('site_key', { length: 64 }).notNull(),
  domain: varchar('domain', { length: 120 }).notNull(),
  slotKey: varchar('slot_key', { length: 64 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  asin: varchar('asin', { length: 32 }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  searchQuery: text('search_query').notNull(),
  productUrl: text('product_url').notNull(),
  imageUrl: text('image_url'),
  priceEstimate: varchar('price_estimate', { length: 32 }),
  rating: doublePrecision('rating').default(4.7),
  badge: varchar('badge', { length: 64 }),
  ctaText: varchar('cta_text', { length: 64 }).default('View on Amazon'),
  associateTag: varchar('associate_tag', { length: 64 }).default('photoid03-20').notNull(),
  status: varchar('status', { length: 32 }).default('active').notNull(), // 'active' | 'candidate' | 'quarantined_dog' | 'retired_low_ctr'
  impressions: integer('impressions').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  ctr: doublePrecision('ctr').default(0).notNull(),
  lastHealthCheckAt: timestamp('last_health_check_at'),
  lastHttpStatus: integer('last_http_status').default(200),
  isDogPage: boolean('is_dog_page').default(false).notNull(),
  healthNote: text('health_note'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const amazonAdEvents = pgTable('amazon_ad_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 24 }).notNull(), // 'impression' | 'click'
  associateTag: varchar('associate_tag', { length: 64 }).default('photoid03-20').notNull(),
  siteKey: varchar('site_key', { length: 64 }).notNull(),
  slotKey: varchar('slot_key', { length: 64 }).notNull(),
  productId: varchar('product_id', { length: 100 }).notNull(),
  asin: varchar('asin', { length: 32 }),
  country: varchar('country', { length: 12 }).default('US'),
  storefront: varchar('storefront', { length: 64 }).default('amazon.com'),
  pageUrl: text('page_url'),
  dayBucket: varchar('day_bucket', { length: 16 }).notNull(), // YYYY-MM-DD
  weekBucket: varchar('week_bucket', { length: 16 }).notNull(), // YYYY-Www
  monthBucket: varchar('month_bucket', { length: 16 }).notNull(), // YYYY-MM
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const amazonSiteTraffic = pgTable('amazon_site_traffic', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteKey: varchar('site_key', { length: 64 }).notNull(),
  domain: varchar('domain', { length: 120 }).notNull(),
  periodBucket: varchar('period_bucket', { length: 32 }).notNull(), // e.g. '24h', '7d', '30d'
  requests: integer('requests').default(0).notNull(),
  pageviews: integer('pageviews').default(0).notNull(),
  uniques: integer('uniques').default(0).notNull(),
  bandwidthBytes: integer('bandwidth_bytes').default(0).notNull(),
  source: varchar('source', { length: 32 }).default('cloudflare').notNull(),
  syncedAt: timestamp('synced_at').defaultNow().notNull(),
});

export const amazonRotationLogs = pgTable('amazon_rotation_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteKey: varchar('site_key', { length: 64 }).notNull(),
  slotKey: varchar('slot_key', { length: 64 }).notNull(),
  removedProductId: varchar('removed_product_id', { length: 100 }).notNull(),
  removedProductTitle: text('removed_product_title').notNull(),
  addedProductId: varchar('added_product_id', { length: 100 }).notNull(),
  addedProductTitle: text('added_product_title').notNull(),
  reason: varchar('reason', { length: 64 }).notNull(), // 'dog_page_or_404' | 'low_ctr_zero_clicks' | 'manual_swap'
  details: text('details'),
  rotatedAt: timestamp('rotated_at').defaultNow().notNull(),
});
