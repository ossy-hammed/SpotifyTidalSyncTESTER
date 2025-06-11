import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@shared/schema';

const dbFile = process.env.DATABASE_URL || 'sqlite.db';
export const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });
