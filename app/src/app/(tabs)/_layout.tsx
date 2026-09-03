import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import AppTabs from '@/components/app-tabs';
import { useProfile } from '@/db/repo/profile';
import { migrateLegacyOnboarding } from '@/features/onboarding/complete';
import { useMilestoneWatcher } from '@/features/streak/use-milestone-watcher';

export default function TabsLayout() {
  const { profile, loading, refetch } = useProfile();
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
  return <TabsWithWatcher />;
}

function TabsWithWatcher() {
  useMilestoneWatcher();
  return <AppTabs />;
}
