import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SymbolChip } from '@/components/ui/symbol-chip';
import { Tap } from '@/components/ui/tap';
import { useProfile } from '@/db/repo/profile';
import { withAccess } from '@/features/premium/access';
import { sdk, SELECTION_ID, requestAuthorization } from '@/features/shield/module';
import { fmtHour, fmtTime } from '@/features/shield/format';
import { ShieldPicker } from '@/features/shield/ShieldPicker';
import {
  completeSetup,
  defaultWindow,
  endLockAfterDelay,
  LOCK_CHOICES_MIN,
  reconcileLock,
  setFilter,
  setUnlockDelay,
  setWindow,
  startLock,
  useShield,
} from '@/features/shield/store';
import { useMinuteTick } from '@/lib/clock';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * Shield — the blocker, wired to the program rather than beside it.
 *
 * One screen, three jobs: pick what to shield, decide when it's up on its own
 * (the trigger window), and see or end a lock. Everything else the category
 * ships — usage stats, keyword lists, VPN profiles — is deliberately absent.
 */
function ShieldScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const shield = useShield();
  const [picking, setPicking] = useState(false);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);
  const [refusedSchedule, setRefusedSchedule] = useState(false);
  useMinuteTick();

  useEffect(() => {
    void reconcileLock();
  }, []);

  if (!shield.available) {
    return (
      <Screen title="Shield">
        <Text style={s.h1}>Shield is an iPhone feature.</Text>
        <Text style={s.body}>
          It uses Apple’s Screen Time to keep chosen apps and sites out of reach during your hard
          hours, and while you wait out an urge.
          {Platform.OS === 'ios' && __DEV__ ? ' It needs a development build — it can’t run in Expo Go.' : ''}
        </Text>
      </Screen>
    );
  }

  const ask = async () => {
    if (asking) return;
    setAsking(true);
    const result = await requestAuthorization();
    setAsking(false);
    setDenied(result === 'denied');
    shield.refreshAuth();
  };

  if (shield.auth !== 'approved') {
    return (
      <Screen
        title="Shield"
        footer={
          <Tap haptic="medium" onPress={ask} style={s.primary} accessibilityRole="button" disabled={asking}>
            <Text style={s.primaryLabel}>{asking ? 'Asking…' : 'Allow Screen Time'}</Text>
          </Tap>
        }>
        <Text style={s.h1}>Put a shield between you and it.</Text>
        <Text style={s.body}>
          Choose the apps and sites that pull you in. Curb keeps them out of reach during your hard
          hours, and for a while when you ask it to mid-urge. When you hit the shield, you see one
          of your own reasons instead.
        </Text>
        <Text style={s.body}>
          Apple asks once. Curb never learns which apps you chose — only how many.
        </Text>
        {denied || shield.auth === 'denied' ? (
          <Notice tone="warn">
            Screen Time access is off for Curb. Turn it on in Settings › Screen Time › Apps with
            Screen Time access, then come back.
          </Notice>
        ) : null}
      </Screen>
    );
  }

  const window = shield.window ?? (profile ? defaultWindow(profile.answers) : null);
  const current = sdk()?.getFamilyActivitySelectionId(SELECTION_ID) ?? null;
  const isPorn = !!profile?.habits.includes('porn');

  const changeWindow = async (next: Partial<typeof window>) => {
    if (!window) return;
    const merged = { ...window, ...next };
    if (merged.on && !shield.setup) {
      Alert.alert('Choose apps first', 'The window needs something to shield.');
      return;
    }
    await setWindow(merged);
  };

  const lock = async (minutes: number) => {
    if (!shield.setup) return;
    const scheduled = await startLock(minutes);
    setRefusedSchedule(!scheduled);
  };

  const endEarly = () => {
    const d = shield.unlockDelayMin;
    Alert.alert(
      d > 0 ? `Lift the shield in ${d} min?` : 'Lift the shield now?',
      d > 0
        ? 'You set this delay when you were clear-headed. It still applies.'
        : 'You set no delay. It lifts straight away.',
      [
        { text: 'Keep it up', style: 'cancel' },
        { text: d > 0 ? `Lift in ${d} min` : 'Lift now', onPress: () => void endLockAfterDelay() },
      ],
    );
  };

  const summary = shield.setup
    ? [
        shield.setup.categories ? `${shield.setup.categories} ${shield.setup.categories === 1 ? 'category' : 'categories'}` : null,
        shield.setup.apps ? `${shield.setup.apps} ${shield.setup.apps === 1 ? 'app' : 'apps'}` : null,
        shield.setup.sites ? `${shield.setup.sites} ${shield.setup.sites === 1 ? 'site' : 'sites'}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <Screen title="Shield">
      <ShieldPicker
        visible={picking}
        current={current}
        onPicked={async (p) => {
          setPicking(false);
          await completeSetup(p.token, { apps: p.apps, categories: p.categories, sites: p.sites });
        }}
        onCancel={() => setPicking(false)}
      />

      {shield.lock ? (
        <Card style={s.liveCard}>
          <View style={s.liveRow}>
            <SymbolChip name="shield.fill" tint={hues.urge.solid} wash={hues.urge.wash} />
            <View style={{ flex: 1 }}>
              <Text style={s.liveTitle}>Shield is up</Text>
              <Text style={s.liveSub}>until {fmtTime(shield.lock.until)}</Text>
            </View>
            <Tap haptic="light" onPress={endEarly} style={s.ghost} accessibilityRole="button">
              <Text style={s.ghostLabel}>End early</Text>
            </Tap>
          </View>
        </Card>
      ) : null}

      <Text style={s.section}>What’s shielded</Text>
      <Card style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.rowLabel}>{summary ?? 'Nothing yet'}</Text>
            <Text style={s.rowSub}>
              {summary ? 'Picked in Apple’s list. Change it any time.' : 'Apps, categories, or websites.'}
            </Text>
          </View>
          <Tap haptic="light" onPress={() => setPicking(true)} style={s.ghost} accessibilityRole="button">
            <Text style={s.ghostLabel}>{summary ? 'Change' : 'Choose'}</Text>
          </Tap>
        </View>
        {isPorn ? (
          <>
            <View style={s.sep} />
            <View style={s.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.rowLabel}>Adult content in Safari</Text>
                <Text style={s.rowSub}>Apple’s filter. Safari only — other browsers aren’t covered.</Text>
              </View>
              <Switch
                value={shield.filter}
                onValueChange={(v) => void setFilter(v)}
                trackColor={{ true: palette.accentDeep, false: palette.surface3 }}
                thumbColor={palette.text}
              />
            </View>
          </>
        ) : null}
      </Card>

      <Text style={s.section}>Shield now</Text>
      <Card style={s.card}>
        <View style={s.row}>
          <Text style={[s.rowSub, { flex: 1 }]}>
            {shield.setup ? 'For an urge you can feel coming.' : 'Choose something to shield first.'}
          </Text>
        </View>
        <View style={s.chips}>
          {LOCK_CHOICES_MIN.map((m) => (
            <Tap
              key={m}
              haptic="medium"
              disabled={!shield.setup || !!shield.lock}
              onPress={() => void lock(m)}
              style={[s.chip, (!shield.setup || !!shield.lock) && s.chipOff]}
              accessibilityRole="button"
              accessibilityLabel={`Shield for ${m} minutes`}>
              <Text style={s.chipLabel}>{m === 60 ? '1 hour' : `${m} min`}</Text>
            </Tap>
          ))}
        </View>
        {refusedSchedule ? (
          <Notice tone="info">
            The shield is up, but iOS didn’t take the timer. Curb lifts it the next time you open the app after it ends.
          </Notice>
        ) : null}
      </Card>

      {window ? (
        <>
          <Text style={s.section}>Every day</Text>
          <Card style={s.card}>
            <View style={s.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.rowLabel}>Your hard hours</Text>
                <Text style={s.rowSub}>
                  {fmtHour(window.startHour)} to {fmtHour(Math.min(24, window.startHour + window.hours))}, from what you told us.
                </Text>
              </View>
              <Switch
                value={window.on}
                onValueChange={(v) => void changeWindow({ on: v })}
                trackColor={{ true: palette.accentDeep, false: palette.surface3 }}
                thumbColor={palette.text}
              />
            </View>
            <View style={s.sep} />
            <Stepper label="Starts" value={fmtHour(window.startHour)} onChange={(d) => void changeWindow({ startHour: (window.startHour + d + 24) % 24 })} />
            <Stepper label="For" value={`${window.hours} h`} onChange={(d) => void changeWindow({ hours: Math.max(1, Math.min(6, window.hours + d)) })} />
          </Card>
        </>
      ) : null}

      <Text style={s.section}>Ending early</Text>
      <Card style={s.card}>
        <Stepper
          label="Wait before it lifts"
          value={shield.unlockDelayMin === 0 ? 'none' : `${shield.unlockDelayMin} min`}
          onChange={(d) => void setUnlockDelay(shield.unlockDelayMin + d * 5)}
        />
        <Text style={s.fine}>
          Decided now, while you’re clear. A shield you can drop in one tap is a shield you will drop.
        </Text>
      </Card>

      <Text style={s.fine}>
        Want it locked for real? iOS can put a passcode on Screen Time settings so Curb’s access can’t
        be switched off, and the app can’t be deleted, without it — ask someone you trust to set the
        code.{' '}
        <Text style={s.link} onPress={() => void Linking.openURL('App-prefs:SCREEN_TIME').catch(() => Linking.openSettings())}>
          Open Screen Time settings
        </Text>
      </Text>
      <View style={{ height: Spacing.four }} />
      <Tap haptic="none" onPress={() => router.push('/help')} accessibilityRole="button" style={s.helpLink}>
        <Text style={s.link}>Need someone to talk to?</Text>
      </Tap>
    </Screen>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: string; onChange: (delta: number) => void }) {
  return (
    <View style={s.row}>
      <Text style={[s.rowLabel, { flex: 1 }]}>{label}</Text>
      <Tap haptic="selection" onPress={() => onChange(-1)} style={s.miniBtn} accessibilityLabel={`${label}, less`}>
        <Text style={s.miniLabel}>−</Text>
      </Tap>
      <Text style={s.value}>{value}</Text>
      <Tap haptic="selection" onPress={() => onChange(1)} style={s.miniBtn} accessibilityLabel={`${label}, more`}>
        <Text style={s.miniLabel}>+</Text>
      </Tap>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { color: palette.text, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, fontFamily: type.display },
  body: { color: palette.textDim, fontSize: 16, lineHeight: 24, fontFamily: type.body },
  section: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, letterSpacing: 0.3, marginTop: Spacing.two },
  card: { padding: 0, overflow: 'hidden' },
  liveCard: { backgroundColor: hues.urge.wash, padding: 0 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  liveTitle: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  liveSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: 14, minHeight: 56 },
  sep: { height: 1, backgroundColor: palette.line, marginLeft: Spacing.three },
  rowLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  rowSub: { color: palette.textDim, fontSize: 13, lineHeight: 18, fontFamily: type.body },
  chips: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  chip: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: hues.urge.solid },
  chipOff: { backgroundColor: palette.surface3 },
  chipLabel: { color: hues.urge.ink, fontSize: 15, fontFamily: type.bodySemi },
  ghost: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: palette.line },
  ghostLabel: { color: palette.accent, fontSize: 15, fontFamily: type.bodySemi },
  miniBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: palette.surface3 },
  miniLabel: { color: palette.text, fontSize: 20, fontFamily: type.bodyMed },
  value: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'], minWidth: 64, textAlign: 'center' },
  fine: { color: palette.textFaint, fontSize: 13, lineHeight: 20, fontFamily: type.body, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  link: { color: palette.accent, fontFamily: type.bodySemi },
  helpLink: { minHeight: 44, justifyContent: 'center' },
  primary: { minHeight: 56, borderRadius: 18, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  primaryLabel: { color: palette.accentInk, fontSize: 17, fontFamily: type.bodySemi },
});

export default withAccess(ShieldScreen);
