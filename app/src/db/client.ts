import * as SQLite from 'expo-sqlite';

import { MIGRATIONS, TABLES } from './schema';

const DB_NAME = 'addiction.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.execAsync(MIGRATIONS[v]);
    await db.execAsync(`PRAGMA user_version = ${v + 1}`);
  }
}

/** Singleton, migrated database. Safe to call from anywhere. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    })().catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

/** Delete every row in every table (used by "delete everything" and reset onboarding). */
export async function wipeDb() {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const t of TABLES) await db.runAsync(`DELETE FROM ${t}`);
  });
}
