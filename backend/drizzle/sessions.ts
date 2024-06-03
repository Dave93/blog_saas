import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', { id: text('id').primaryKey(), user_id: text('user_id').notNull(), user_agent: text('user_agent').notNull(), device_name: text('device_name').notNull(), created_at: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(), updated_at: timestamp('updated_at', { mode: 'date', precision: 3 }).defaultNow().notNull() });