import { pgTable, text, timestamp, uuid, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userDocuments = pgTable('user_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: text('session_id').notNull(), // To link anonymous users
  filename: text('filename').notNull(),
  // Full extracted text
  content: text('content').notNull(),
  // Concise or AI-compressed summary of the uploaded document
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  check('user_documents_summary_not_empty_chk', sql`${table.summary} IS NOT NULL AND trim(${table.summary}) <> ''`),
]);
