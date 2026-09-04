import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useGlobalSearchParams, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { Appearance, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PostHogProvider } from 'posthog-react-native';

import { DbProvider } from '@/db/provider';
import { loadDevOffset } from '@/features/settings/dev';
import { checkOnLaunch } from '@/lib/ota';
import { posthog } from '@/lib/posthog';
import { SessionProvider } from '@/lib/session';
import { activeScheme, palette } from '@/theme/palette';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  /**
   * Keep native chrome pinned to the theme the JS palette is actually using.
   *
   * The iOS tab bar is a system material: it takes its colour from the app's
   * interface style, not from the `backgroundColor` we hand it. Setting this
   * once on mount wasn't enough — anything that re-evaluates the palette
   * without remounting the root (a theme change, a Fast Refresh, the OS
   * appearance flipping under a `system` preference) left the two disagreeing,
   * and you'd get a dark floating tab bar sitting on a light screen.
   *
   * `activeScheme` is fixed for the session, so re-asserting it on every
   * foreground is both safe and self-healing.
   */
  useEffect(() => {
    const apply = () => Appearance.setColorScheme?.(activeScheme);
    apply();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') apply();
    });
    return () => sub.remove();
  }, []);
  /**
   * Pull any newer JS bundle in the background.
   *
   * Deliberately fire-and-forget: a downloaded update applies on the NEXT
   * launch, never mid-session, so this can never interrupt someone in the
   * middle of an urge. Re-checked on foreground because the app is opened far
   * more often than it is cold-started.
   *
   * No-ops in Expo Go and in any build where updates are disabled.
   */
  useEffect(() => {
    void checkOnLaunch();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkOnLaunch();
    });
    return () => sub.remove();
  }, []);
  const onDbReady = useCallback(() => {
    if (__DEV__) loadDevOffset();
    SplashScreen.hideAsync();
  }, []);
  if (!fontsLoaded) return null; // splash stays up
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.bg }}>
      <StatusBar style={activeScheme === 'light' ? 'dark' : 'light'} />
      <PostHogProvider
        client={posthog ?? undefined}
        autocapture={false}
      >
        {/* Manual screen tracking — autocapture is off per privacy contract */}
        <ScreenTracker />
        <ThemeProvider
          value={{
            ...(activeScheme === 'light' ? DefaultTheme : DarkTheme),
            colors: {
              ...(activeScheme === 'light' ? DefaultTheme : DarkTheme).colors,
              background: palette.bg,
              card: palette.surface,
              primary: palette.accent,
              text: palette.text,
              border: palette.line,
            },
          }}>
        <DbProvider onReady={onDbReady}>
          <SessionProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen name="checkin" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="reasons" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="answers" options={{ animation: 'slide_from_right' }} />
            {/* Not gated: someone in trouble reaches this paid or not. */}
            <Stack.Screen name="help" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="recovery" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="savings" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="sign-in" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            {/* The wall. No swipe-to-dismiss — there is no free tier to fall back to. */}
            <Stack.Screen name="paywall" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="urge" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="relapse" options={{ presentation: 'modal', animation: 'fade' }} />
            <Stack.Screen name="milestone" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="milestones" options={{ animation: 'slide_from_right' }} />
          </Stack>
          </SessionProvider>
        </DbProvider>
        </ThemeProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Manual screen tracking for Expo Router.
 *
 * PostHog screen events are sent here using the posthog singleton (not
 * usePostHog()) so this component can live outside the provider tree if needed.
 * Screen tracking respects the analytics opt-out: if the posthog instance has
 * opted out, screen() calls are discarded internally.
 */
function ScreenTracker() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!posthog) return;
    if (previousPathname.current === pathname) return;
    void posthog.screen(pathname, { previous_screen: previousPathname.current ?? null });
    previousPathname.current = pathname;
  }, [pathname, params]);

  return null;
}

