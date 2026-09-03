/**
 * Over-the-air updates (EAS Update).
 *
 * Ships JS + assets to installed apps without an App Store review. Allowed by
 * Apple: guideline 2.5.2 bars downloading *executable* code, but the Developer
 * Program License Agreement §3.3.2 permits *interpreted* code (JavaScript) as
 * long as the update doesn't change the app's primary purpose, doesn't create a
 * storefront for other code, and doesn't bypass signing/sandbox/IAP.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOT ACTIVE YET — deliberately.
 *
 * `expo-updates` cannot be installed while we develop in Expo Go: its native
 * module initializes an internal database that crashes the Expo Go runtime
 * ("UNIQUE constraint failed: updates.scope_key"). Activate it the day we cut
 * the development build:
 *
 *   1) npx expo install expo-updates
 *   2) eas update:configure          # writes the updates URL + runtimeVersion
 *   3) uncomment the ACTIVATE block below (and delete the stub above it)
 *
 * Publish an update afterwards with:  npm run ota:production
 * ─────────────────────────────────────────────────────────────────────────────
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';

/** True inside Expo Go, where OTA is unavailable and JS reload is unreliable. */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export type UpdateState = 'idle' | 'checking' | 'downloading' | 'ready' | 'unavailable' | 'error';

/* ── STUB (remove when activating) ─────────────────────────────────────────── */
export const otaEnabled = false;
/** Reload the JS bundle. No-op until expo-updates is installed. */
export async function reloadApp(): Promise<void> {}
/** Check for a newer bundle and download it. Returns whether one is ready. */
export async function fetchUpdate(): Promise<UpdateState> {
  return 'unavailable';
}
/** Check on launch, download in the background, apply on the next launch. */
export async function checkOnLaunch(): Promise<void> {}
/* ── end stub ──────────────────────────────────────────────────────────────── */

/* ── ACTIVATE: uncomment this block once expo-updates is installed ───────────
import * as Updates from 'expo-updates';

export const otaEnabled = !isExpoGo && Updates.isEnabled;

export async function reloadApp(): Promise<void> {
  if (!otaEnabled) return;
  try {
    await Updates.reloadAsync();
  } catch (e) {
    if (__DEV__) console.warn('[ota] reload failed', e);
  }
}

export async function fetchUpdate(): Promise<UpdateState> {
  if (!otaEnabled) return 'unavailable';
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return 'unavailable';
    await Updates.fetchUpdateAsync();
    return 'ready';
  } catch (e) {
    if (__DEV__) console.warn('[ota] fetch failed', e);
    return 'error';
  }
}

export async function checkOnLaunch(): Promise<void> {
  // Downloaded updates apply on the NEXT launch, so this never interrupts a session.
  if (!otaEnabled) return;
  await fetchUpdate();
}
─────────────────────────────────────────────────────────────────────────── */
