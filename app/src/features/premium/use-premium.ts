/**
 * Is this user premium?
 *
 * Curb is premium-only, so this decides whether the app opens at all. Two
 * sources, deliberately:
 *
 *  - **The server** (`useAccount` → RevenueCat webhooks → `entitlement`) is the
 *    truth, and is what makes premium follow the user to a new phone.
 *  - **`profile.premium` in local SQLite** mirrors the last definitive server
 *    answer.
 *
 * The gate reads the local mirror, which is why launching offline doesn't lock
 * a paying user out of their own recovery data — a real risk when the whole app
 * is behind the wall. The server refresh corrects the mirror in the background.
 */
import { useProfile } from '@/db/repo/profile';
import { useSetting } from '@/db/repo/settings';
import { useAccount } from '@/features/account/use-account';
import { DEV_SKIP_AUTH_KEY } from '@/features/settings/dev';

export function usePremium() {
  const { profile, loading: profileLoading } = useProfile();
  const account = useAccount();
  const { value: devSkip } = useSetting<boolean>(DEV_SKIP_AUTH_KEY, false);

  // Local mirror first: instant, and correct offline.
  const cached = profile?.premium ?? false;

  return {
    premium: cached || account.premium,
    /** false while we still don't know either way */
    resolved: !profileLoading,
    signedIn: account.signedIn || (__DEV__ && devSkip),
    sessionResolved: !account.loading,
    checking: account.checking,
    refresh: account.refresh,
  };
}
