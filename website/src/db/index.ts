/**
 * Drizzle handle.
 *
 * The same `pg` pool the app has always used (module-scoped so Next's dev
 * hot-reload doesn't leak connections) — Drizzle sits on top of it, so Better
 * Auth and Curb's own queries share one connection pool.
 */
import { drizzle } from 'drizzle-orm/node-postgres';

import { pool } from '../lib/db';
import * as schema from './schema';

export const db = drizzle(pool, { schema });
export { schema };
