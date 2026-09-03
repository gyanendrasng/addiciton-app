import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import AppTabs from '@/components/app-tabs';
import { useProfile } from '@/db/repo/profile';
import { migrateLegacyOnboarding } from '@/features/onboarding/complete';
import { usePremium } from '@/features/premium/use-premium';
import { useMilestoneWatcher } from '@/features/streak/use-milestone-watcher';

/**
 * The gate. Three things must be true before the app opens:
 *
 *   1. onboarding is done   → otherwise `/onboarding`
 *   2. there's an account   → otherwise `/sign-in`  (needed to own the purchase
 *                             and to carry it to a new phone)
 *   3. the subscription is  → otherwise `/paywall`
 *      active
 *
 * Curb has no free tier, so this is a hard wall rather than feature gating
 * inside the app: once you're past it, everything is unlocked and nothing else
 * ever checks.
 *
 * Order matters. Premium is checked FIRST, off the local mirror in SQLite, so a
 * paying user opening the app on a plane goes straight in — being locked out of
 * your own recovery history by a failed network call would be the worst bug
 * this app could have.
 */
export default function TabsLayout() {
  const { profile, loading, refetch } = useProfile();
  const { premium, signedIn, sessionResolved } = usePremium();
  const [migrated, setMigrated] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading || profile) return;
    if (migrated !== null) return;
    migrateLegacyOnboarding().then((ok) => {
      setMigrated(ok);
      if (ok) refetch();
    });
  }, [loading, migrated, profile, refetch]);

  if (loading) return null;

  if (!profile) {
    if (migrated === null) return null; // trying legacy migration
    if (!migrated) return <Redirect href="/onboarding" />;
    return null; // refetching after migration
  }

  if (!premium) {
    // An account comes before the purchase so the entitlement has an owner.
    if (!signedIn) {
      if (!sessionResolved) return null; // still reading the session
      return <Redirect href="/sign-in?required=1" />;
    }
    return <Redirect href="/paywall" />;
  }

  return <TabsWithWatcher />;
}

function TabsWithWatcher() {
  useMilestoneWatcher();
  return <AppTabs />;
}
