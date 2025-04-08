import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

neonConfig.fetchConnectionCache = true;

// Support both local dev (NEON_DATABASE_URL) and Vercel (DATABASE_URL) environments
const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
if (!dbUrl) {
  throw new Error('Database URL not found in environment variables');
}

const sql = neon(dbUrl);
export const db = drizzle(sql, { schema });
