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

/**
 * Dark is the primary theme.
 *
 * The ground is a near-black with a slight cool cast rather than #000: pure
 * black leaves nowhere for the surface ladder to go, and reads flat next to a
 * tinted neutral. Every grey below carries the same ~217° cast so the raised
 * surfaces look like one material lit from one direction, which is most of
 * what separates an expensive-looking dark UI from a cheap one.
 */
/**
 * `textFaint` is set by the DARKEST raised surface it can land on
 * (`surface3`), not by `bg` — faint text mostly lives inside cards. Tuned
 * against `bg` alone it looks fine and measures 3.51:1 on a card, which fails
 * AA and breaks the Sufficient Contrast claim on the App Store product page.
 * Both themes clear 4.5:1 on all four grounds; don't darken either for taste.
 */
const dark = {
  bg: '#07080A',
  surface: '#101216',
  surface2: '#171A1F',
  surface3: '#20242A',
  line: '#2A2F36',
  text: '#F5F6F8',
  textDim: '#A0A6B0',
  textFaint: '#868C95',
  accent: '#31C983',
  accentDeep: '#1B8A5A',
  accentInk: '#06120D',
  accentWash: 'rgba(49, 201, 131, 0.14)',
  amber: '#E5BC58',
  amberWash: 'rgba(229, 188, 88, 0.16)',
  danger: '#E8695E',
  bright: '#FFFFFF',
} as const;

const light: Record<keyof typeof dark, string> = {
  bg: '#F1F3F4',
  surface: '#FFFFFF',
  surface2: '#FFFFFF',
  surface3: '#E7EAEC',
  line: '#DDE1E4',
  text: '#111519',
  textDim: '#4E5A56',
  textFaint: '#5E6B64',
  accent: '#0A7A4E',
  accentDeep: '#06603C',
  accentInk: '#FFFFFF',
  accentWash: 'rgba(10, 122, 78, 0.12)',
  amber: '#896815',
  amberWash: 'rgba(137, 104, 21, 0.14)',
  danger: '#C1372E',
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

/**
 * `app.json` must keep `userInterfaceStyle: "automatic"`. Setting it to "dark"
 * writes `UIUserInterfaceStyle = Dark` into Info.plist, which pins the whole
 * app dark at the OS level — `Appearance.getColorScheme()` then returns "dark"
 * on a light phone and the "system" preference silently stops working. That is
 * invisible in Expo Go, where Expo Go's own plist governs instead of ours.
 */
function resolveScheme(pref: ThemePref): Scheme {
  if (pref !== 'system') return pref;
  // Only an explicit "dark" means dark. A null read (appearance not resolved
  // yet) must not fall through to the darker of the two.
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export const themePref: ThemePref = readPrefSync();
export const activeScheme: Scheme = resolveScheme(themePref);
export const palette = activeScheme === 'light' ? light : dark;

/**
 * Semantic action hues. One meaning each — never decoration.
 *
 * These are jewel tones, not the candy brights they started as: each sits a
 * step deeper and a step less saturated, which is what stops five accents on a
 * dark ground from reading like a toy. Every solid clears 4.5:1 on its own
 * theme's background, so a hue can carry text as well as an icon.
 *
 * Resolved per-theme at launch, exactly like `palette`, so call sites never
 * change: on a near-white ground the same hue has to be far darker to stay
 * legible.
 */
type Hue3 = { solid: string; ink: string; wash: string };

const darkHues = {
  /** kept a streak, made a pledge — this is also `accent` */
  pledge: { solid: '#31C983', ink: '#06120D', wash: 'rgba(49, 201, 131, 0.16)' },
  /** an urge, in the moment — warm, urgent, never red */
  urge: { solid: '#EE7F4E', ink: '#180A03', wash: 'rgba(238, 127, 78, 0.16)' },
  /** daily check-in, mood */
  checkin: { solid: '#6D9DEF', ink: '#04101F', wash: 'rgba(109, 157, 239, 0.16)' },
  /** your reasons for starting — antique gold, not lemon */
  reasons: { solid: '#E5BC58', ink: '#171200', wash: 'rgba(229, 188, 88, 0.16)' },
  /** history, stats, milestones */
  progress: { solid: '#9F8AE8', ink: '#120A24', wash: 'rgba(159, 138, 232, 0.16)' },
  /** subscription surfaces only — champagne, so premium looks premium */
  premium: { solid: '#D8B888', ink: '#171004', wash: 'rgba(216, 184, 136, 0.16)' },
} as const satisfies Record<string, Hue3>;

const lightHues: Record<keyof typeof darkHues, Hue3> = {
  pledge: { solid: '#1E7B50', ink: '#FFFFFF', wash: 'rgba(30, 123, 80, 0.12)' },
  urge: { solid: '#BA4512', ink: '#FFFFFF', wash: 'rgba(186, 69, 18, 0.12)' },
  checkin: { solid: '#1A65E6', ink: '#FFFFFF', wash: 'rgba(26, 101, 230, 0.12)' },
  reasons: { solid: '#896815', ink: '#FFFFFF', wash: 'rgba(137, 104, 21, 0.12)' },
  progress: { solid: '#7253DD', ink: '#FFFFFF', wash: 'rgba(114, 83, 221, 0.12)' },
  premium: { solid: '#8A652D', ink: '#FFFFFF', wash: 'rgba(138, 101, 45, 0.12)' },
};

export const hues: Record<keyof typeof darkHues, Hue3> =
  activeScheme === 'light' ? lightHues : darkHues;
export type Hue = keyof typeof darkHues;

export type Palette = typeof dark;
