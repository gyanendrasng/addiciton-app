/** Versioned migrations applied via PRAGMA user_version. Append; never edit a shipped entry. */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    quit_started_at INTEGER NOT NULL,
    habits TEXT NOT NULL,
    score INTEGER NOT NULL,
    freedom_date TEXT NOT NULL,
    answers TEXT NOT NULL,
    premium INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS pledges (
    date TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS checkins (
    date TEXT PRIMARY KEY,
    mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    note TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS urges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    trigger TEXT,
    intensity INTEGER,
    outcome TEXT NOT NULL DEFAULT 'open' CHECK (outcome IN ('open','survived','slipped','abandoned')),
    duration_s INTEGER,
    steps_completed TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS relapses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    habit_ids TEXT NOT NULL,
    trigger TEXT,
    note TEXT,
    next_actions TEXT NOT NULL DEFAULT '[]',
    urge_id INTEGER,
    undone INTEGER NOT NULL DEFAULT 0,
    undone_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS relapses_active ON relapses (undone, created_at);
  CREATE TABLE IF NOT EXISTS reasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    sort INTEGER NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('onboarding','user')),
    archived INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS milestones (
    tier INTEGER NOT NULL,
    period_start INTEGER NOT NULL,
    reached_at INTEGER NOT NULL,
    celebrated_at INTEGER,
    PRIMARY KEY (tier, period_start)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];

export const TABLES = [
  'profile',
  'pledges',
  'checkins',
  'urges',
  'relapses',
  'reasons',
  'milestones',
  'settings',
] as const;
export type Table = (typeof TABLES)[number];
