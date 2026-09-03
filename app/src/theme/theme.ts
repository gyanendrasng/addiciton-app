import { Platform } from 'react-native';

import { setSetting } from '@/db/repo/settings';
import { isExpoGo, otaEnabled, reloadApp } from '@/lib/ota';
import type { ThemePref } from './palette';

export { isExpoGo };

/**
 * Persist the theme, then apply it.
 *  - Web: location.reload → instant.
 *  - Real build (once expo-updates is installed): Updates.reloadAsync → instant.
 *  - Expo Go: no programmatic reload (it crashes with "ExpoAsset"); the palette
 *    resolves synchronously at launch, so the choice applies on next open.
 */
export async function setThemePref(pref: ThemePref) {
  await setSetting('theme', pref);

  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem('theme', pref);
      globalThis.location?.reload();
    } catch {}
    return;
  }

  // No-op until expo-updates is installed; instant switch the moment it is.
  if (otaEnabled) {
    setTimeout(() => reloadApp(), 60);
  }
}
