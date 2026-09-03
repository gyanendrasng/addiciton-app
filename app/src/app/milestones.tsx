import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Eyebrow, Subtitle, Title } from '@/features/onboarding/components/chrome';
import { TIERS } from '@/features/streak/tiers';
import { useStreak } from '@/features/streak/use-streak';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { withAccess } from '@/features/premium/access';

/** The whole ladder: where you are, what's behind you, what each name means. */
function MilestonesScreen() {
  const { state } = useStreak();
  const days = state?.streak.days ?? 0;
  const nextIdx = TIERS.findIndex((t) => t.days > days);

  return (
    <Screen>
      <Eyebrow>The journey</Eyebrow>
      <Title>Ten milestones to Free.</Title>
      <Subtitle>Every streak climbs the same ladder. A slip restarts the climb — never the map.</Subtitle>
      <View style={s.list}>
        {TIERS.map((t, i) => {
          const done = days >= t.days;
          const isNext = i === nextIdx;
          const last = i === TIERS.length - 1;
          const first = i === 0;
          return (
            <View key={t.days} style={s.row}>
              <View style={s.rail}>
                <View style={[s.line, first && s.lineHidden, done && s.lineDone]} />
                <View style={[s.dot, done && s.dotDone, isNext && s.dotNext]} />
                <View style={[s.line, last && s.lineHidden, done && s.lineDone]} />
              </View>
              <View style={[s.body, isNext && s.bodyNext]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, done && { color: palette.accent }, isNext && { color: palette.text }]}>{t.name}</Text>
                  <Text style={s.meta}>
                    {t.days} {t.days === 1 ? 'day' : 'days'} clean
                  </Text>
                </View>
                {done ? (
                  <Text style={s.check}>✓</Text>
                ) : isNext ? (
                  <Text style={s.eta}>in {t.days - days}d</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  list: { marginTop: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.three },
  rail: { width: 20, alignItems: 'center', alignSelf: 'stretch' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.surface3, marginVertical: 3 },
  dotDone: { backgroundColor: palette.accent, width: 12, height: 12, borderRadius: 6 },
  dotNext: { backgroundColor: palette.bg, borderWidth: 3, borderColor: palette.accent, width: 16, height: 16, borderRadius: 8 },
  line: { flex: 1, width: 2, backgroundColor: palette.surface3 },
  lineHidden: { backgroundColor: 'transparent' },
  lineDone: { backgroundColor: palette.accentDeep },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    borderRadius: 16,
    backgroundColor: palette.surface,
  },
  bodyNext: { backgroundColor: palette.accentWash },
  name: { color: palette.textDim, fontSize: 16, fontFamily: type.bodySemi },
  meta: { color: palette.textFaint, fontSize: 13, fontFamily: type.body, marginTop: 2 },
  check: { color: palette.accent, fontSize: 18, fontFamily: type.bodySemi },
  eta: { color: palette.accent, fontSize: 14, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
});

// Not reachable without an account and a subscription — see features/premium/access.
export default withAccess(MilestonesScreen);
