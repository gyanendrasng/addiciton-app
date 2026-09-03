import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/**
 * Dismiss a modal or pushed screen safely.
 *
 * Every route in this app is reachable by deep link (`curb://relapse`,
 * notification taps, the dev deep links), and in that case there is no history
 * — a bare `router.back()` throws
 * "The action 'GO_BACK' was not handled by any navigator" and, in production,
 * simply does nothing. Falling back to the tabs root is always correct.
 */
export function useDismiss(fallback: string = '/') {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  }, [fallback, router]);
}
