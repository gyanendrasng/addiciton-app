import { useLiveQuery } from '@/db/hooks';
import { listCheckins, type Checkin } from '@/db/repo/checkins';
import { listPledgeDates } from '@/db/repo/pledges';
import { listRelapses, type Relapse } from '@/db/repo/relapses';
import { countUrges } from '@/db/repo/urges';

export type ProgressData = {
  checkins: Checkin[];
  pledgeDates: Set<string>;
  relapses: Relapse[];
  urgesSurvived: number;
  urgesTotal: number;
};

export function useProgressData() {
  const q = useLiveQuery<ProgressData>(
    async () => {
      const [checkins, pledges, relapses, urgesSurvived, urgesTotal] = await Promise.all([
        listCheckins(365),
        listPledgeDates(),
        listRelapses(365),
        countUrges('survived'),
        countUrges(),
      ]);
      return { checkins, pledgeDates: new Set(pledges), relapses, urgesSurvived, urgesTotal };
    },
    ['checkins', 'pledges', 'relapses', 'urges'],
  );
  return { data: q.data, loading: q.loading };
}
