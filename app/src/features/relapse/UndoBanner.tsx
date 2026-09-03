import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Tap } from '@/components/ui/tap';
import { useLiveQuery } from '@/db/hooks';
import { deleteMilestonesForPeriod } from '@/db/repo/milestones';
import { latestActiveRelapse, undoRelapse } from '@/db/repo/relapses';
import { rescheduleMilestones } from '@/features/streak/milestone-schedule';
import { now, useMinuteTick } from '@/lib/clock';
import { curves } from '@/theme/motion';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const UNDO_WINDOW_MS = 24 * 3_600_000;

export function UndoBanner() {
  const tick = useMinuteTick();
  const { data: relapse } = useLiveQuery(() => latestActiveRelapse(), ['relapses'], [tick]);
  if (!relapse) return null;
  const age = now() - relapse.createdAt;
  if (age > UNDO_WINDOW_MS) return null;
  const mins = Math.floor(age / 60_000);
  const ago = mins < 60 ? `${Math.max(1, mins)} min ago` : `${Math.floor(mins / 60)} h ago`;

  return (
    <Animated.View entering={FadeIn.duration(300).easing(curves.fade)} exiting={FadeOut.duration(200)} style={s.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Streak restarted {ago}</Text>
        <Text style={s.sub}>Logged by mistake? You can undo it for 24 hours.</Text>
      </View>
      <Tap
        haptic="light"
        onPress={async () => {
          await undoRelapse(relapse.id);
          await deleteMilestonesForPeriod(relapse.createdAt);
          await rescheduleMilestones();
        }}
        style={s.btn}>
        <Text style={s.btnLabel}>Undo</Text>
      </Tap>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: Spacing.three,
  },
  title: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  sub: { color: palette.textDim, fontSize: 13, fontFamily: type.body, marginTop: 2 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: palette.surface3 },
  btnLabel: { color: palette.text, fontSize: 14, fontFamily: type.bodySemi },
});
