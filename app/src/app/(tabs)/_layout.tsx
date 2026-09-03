import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import AppTabs from '@/components/app-tabs';
import { useProfile } from '@/db/repo/profile';
import { migrateLegacyOnboarding } from '@/features/onboarding/complete';
import { redirectFor, useAccessState } from '@/features/premium/access';
import { useMilestoneWatcher } from '@/features/streak/use-milestone-watcher';

/**
 * The tabs are gated like every other route — the decision itself lives in
 * `features/premium/access`, so there is exactly one of it. This layout adds
 * only the one thing unique to the tab root: migrating users who finished
 * onboarding back when it lived in AsyncStorage.
 */
export default function TabsLayout() {
  const { profile, loading, refetch } = useProfile();
  const [migrated, setMigrated] = useState<boolean | null>(null);
  const access = useAccessState();

  useEffect(() => {
    if (loading || profile) return;
    if (migrated !== null) return;
    migrateLegacyOnboarding().then((ok) => {
      setMigrated(ok);
      if (ok) refetch();
    });
  }, [loading, migrated, profile, refetch]);

  // Give the legacy migration a chance before sending anyone to onboarding.
  if (access === 'onboarding') {
    if (migrated === null) return null; // still trying
    if (migrated) return null; // refetching the profile it just built
  }

  if (access === 'loading') return null;
  const to = redirectFor(access);
  if (to) return <Redirect href={to as never} />;

  return <TabsWithWatcher />;
}

function TabsWithWatcher() {
  useMilestoneWatcher();
  return <AppTabs />;
}
