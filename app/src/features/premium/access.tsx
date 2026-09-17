import { Redirect } from 'expo-router';

import { useProfile } from '@/db/repo/profile';
import { useSetting } from '@/db/repo/settings';
import { ACCOUNT_LINKED_KEY } from './claim';
import { usePremium } from './use-premium';

/**
 * The one place that decides whether the app is open.
 *
 * This used to live only in `(tabs)/_layout`, which meant every route outside
 * the tab group was reachable without it: `curb://urge`, `curb://checkin`,
 * `curb://relapse` and the rest opened the full feature with no account and no
 * subscription. A gate that one deep link walks around is not a gate.
 *
 * The order is onboarding → paywall → account → in. The wall comes straight
 * after onboarding, while the reasons are fresh, and the purchase happens
 * before there is an account (see `claim.ts` for how it finds its owner).
 * The account comes after, once — it is what makes the subscription follow
 * the person to a new phone, and by then they have something worth keeping.
 *
 * Premium is read off the local mirror in SQLite, and "has an account" off a
 * local mirror too, so a paying user opening the app offline goes straight
 * in — being locked out of your own recovery history by a failed network call
 * would be the worst bug this app could ship.
 */
export type AccessState = 'loading' | 'onboarding' | 'signin' | 'paywall' | 'ok';

export function useAccessState(): AccessState {
  const { profile, loading } = useProfile();
  const { premium, signedIn, sessionResolved } = usePremium();
  const { value: linked, loading: linkedLoading } = useSetting<boolean>(ACCOUNT_LINKED_KEY, false);

  if (loading || linkedLoading) return 'loading';
  if (!profile) return 'onboarding';
  if (!premium) return 'paywall';
  if (signedIn || linked) return 'ok';
  return sessionResolved ? 'signin' : 'loading';
}

/** The route an un-entitled user belongs on, or null if they're allowed in. */
export function redirectFor(state: AccessState): string | null {
  switch (state) {
    case 'onboarding':
      return '/onboarding';
    case 'signin':
      return '/sign-in?required=1';
    case 'paywall':
      return '/paywall';
    default:
      return null;
  }
}

/**
 * Wrap a screen that must not be reachable without an account and a
 * subscription. Every route except `onboarding`, `sign-in`, `paywall` and
 * `account` is one of those.
 *
 *   export default withAccess(UrgeScreen);
 */
export function withAccess<P extends object>(Screen: React.ComponentType<P>) {
  return function Guarded(props: P) {
    const state = useAccessState();
    if (state === 'loading') return null;
    const to = redirectFor(state);
    if (to) return <Redirect href={to as never} />;
    return <Screen {...props} />;
  };
}
