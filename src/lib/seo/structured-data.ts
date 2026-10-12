/**
 * structured-data.ts
 * Re-exports schema builders and provides helper functions for injecting JSON-LD
 * across App Router pages.
 */

export * from '@/components/seo/schemas';

/**
 * Serializes schema objects safely for injection into <script type="application/ld+json">
 */
export function serializeJsonLd(schema: Record<string, unknown> | Array<Record<string, unknown>>): string {
  return JSON.stringify(schema, null, 2);
}