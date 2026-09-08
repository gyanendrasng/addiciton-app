import { useLiveQuery } from '@/db/hooks';
import { listCheckins, type Checkin } from '@/db/repo/checkins';
import { listPledgeDates } from '@/db/repo/pledges';
import { listRelapses, type Relapse } from '@/db/repo/relapses';
import { countUrges, listUrges, type Urge } from '@/db/repo/urges';

export type ProgressData = {
  checkins: Checkin[];
  pledgeDates: Set<string>;
  relapses: Relapse[];
  urgesSurvived: number;
  urgesTotal: number;
  urges: Urge[];
};

export function useProgressData() {
  const q = useLiveQuery<ProgressData>(
    async () => {
      const [checkins, pledges, relapses, urgesSurvived, urgesTotal, urges] = await Promise.all([
        listCheckins(365),
        listPledgeDates(),
        listRelapses(365),
        countUrges('survived'),
        countUrges(),
        listUrges(500),
      ]);
      return { checkins, pledgeDates: new Set(pledges), relapses, urgesSurvived, urgesTotal, urges };
    },
    ['checkins', 'pledges', 'relapses', 'urges'],
  );
  return { data: q.data, loading: q.loading };
}
