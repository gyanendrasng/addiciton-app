import { Pool } from 'pg';

/**
 * Postgres pool shared by Better Auth and our own queries.
 *
 * On Vercel each serverless invocation may reuse the module scope, so we cache
 * the pool on `globalThis` to avoid exhausting connections across cold starts.
 * Use a POOLED connection string (Neon/Supabase pgbouncer) — not the direct one.
 */
const globalForDb = globalThis as unknown as { curbPool?: Pool };

export const pool =
  globalForDb.curbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.curbPool = pool;
