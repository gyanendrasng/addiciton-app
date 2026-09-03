import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL as string },
  // Better Auth owns `user`/`session`/`account`/`verification`; keep the
  // generator honest about destructive changes to them.
  strict: true,
  verbose: true,
});
