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
 * ACTIVE as of the first development build.
 *
 * This was a stub for as long as the app ran in Expo Go — `expo-updates`
 * initializes a native database that crashes the Expo Go runtime with
 * "UNIQUE constraint failed: updates.scope_key". That constraint is gone now
 * that we build our own client, and `isExpoGo` below still guards the paths
 * for anyone who opens the project in Expo Go.
 *
 * Publish an update with:  npm run ota:production
 * ─────────────────────────────────────────────────────────────────────────────
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Updates from 'expo-updates';

/** True inside Expo Go, where OTA is unavailable and JS reload is unreliable. */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export type UpdateState = 'idle' | 'checking' | 'downloading' | 'ready' | 'unavailable' | 'error';

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
