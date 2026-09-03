/**
 * Theme-aware palette. Because every screen bakes colors into StyleSheet.create
 * at import time, we resolve the active scheme SYNCHRONOUSLY at launch (from the
 * saved preference) and reload the app when it changes (see theme.ts). That keeps
 * a real light/dark theme without threading a hook through every style block.
 */
import { Appearance, Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

export type ThemePref = 'light' | 'dark' | 'system';
export type Scheme = 'light' | 'dark';

const dark = {
  bg: '#000000',
  surface: '#111214',
  surface2: '#1A1B1E',
  surface3: '#232528',
  line: '#2A2C30',
  text: '#F2F3F5',
  textDim: '#9A9FA8',
  textFaint: '#5F646D',
  accent: '#3FDE9C',
  accentDeep: '#1E8A64',
  accentInk: '#06120D',
  accentWash: 'rgba(63, 222, 156, 0.14)',
  amber: '#F5B544',
  amberWash: 'rgba(245, 181, 68, 0.16)',
  danger: '#F0645A',
  bright: '#FFFFFF',
} as const;

const light: Record<keyof typeof dark, string> = {
  bg: '#ECEFED',
  surface: '#FFFFFF',
  surface2: '#FFFFFF',
  surface3: '#E4E8E5',
  line: '#DCE1DE',
  text: '#111C17',
  textDim: '#586460',
  textFaint: '#93A099',
  accent: '#0E8F5E',
  accentDeep: '#0B6E48',
  accentInk: '#FFFFFF',
  accentWash: 'rgba(14, 143, 94, 0.12)',
  amber: '#B77B12',
  amberWash: 'rgba(183, 123, 18, 0.14)',
  danger: '#CF3E34',
  bright: '#0B1512',
};

/** Read the saved theme preference synchronously so styles resolve correctly on first paint. */
function readPrefSync(): ThemePref {
  try {
    if (Platform.OS === 'web') {
      const v = globalThis.localStorage?.getItem('theme');
      if (v === 'light' || v === 'dark' || v === 'system') return v;
      return 'system';
    }
    const db = SQLite.openDatabaseSync('addiction.db');
    const row = db.getFirstSync<{ value: string }>("SELECT value FROM settings WHERE key = 'theme'");
    db.closeSync();
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (parsed === 'light' || parsed === 'dark' || parsed === 'system') return parsed;
    }
  } catch {
    // settings table may not exist on first launch — fall back to system
  }
  return 'system';
}

function resolveScheme(pref: ThemePref): Scheme {
  if (pref === 'system') return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
  return pref;
}

export const themePref: ThemePref = readPrefSync();
export const activeScheme: Scheme = resolveScheme(themePref);
export const palette = activeScheme === 'light' ? light : dark;

/** Semantic action hues — same bright solids + dark inks in both themes. */
export const hues = {
  pledge: { solid: '#3FDE9C', ink: '#06120D', wash: 'rgba(63, 222, 156, 0.16)' },
  urge: { solid: '#FF8A4C', ink: '#180A03', wash: 'rgba(255, 138, 76, 0.16)' },
  checkin: { solid: '#5EA8FF', ink: '#04101F', wash: 'rgba(94, 168, 255, 0.16)' },
  reasons: { solid: '#F5D04B', ink: '#171200', wash: 'rgba(245, 208, 75, 0.16)' },
  progress: { solid: '#B48CFF', ink: '#120A24', wash: 'rgba(180, 140, 255, 0.16)' },
} as const;
export type Hue = keyof typeof hues;

export type Palette = typeof dark;
