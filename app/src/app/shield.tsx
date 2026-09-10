import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SymbolChip } from '@/components/ui/symbol-chip';
import { Tap } from '@/components/ui/tap';
import { useProfile } from '@/db/repo/profile';
import { Cta } from '@/features/onboarding/components/chrome';
import { withAccess } from '@/features/premium/access';
import { fmtHour, fmtTime } from '@/features/shield/format';
import { sdk, SELECTION_ID, requestAuthorization } from '@/features/shield/module';
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
  type ShieldSetup,
} from '@/features/shield/store';
import { useMinuteTick } from '@/lib/clock';
import { durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * Shield — the blocker, wired to the program rather than sat beside it.
 *
 * Setting up is a short guided run, one job per screen, rather than a settings
 * page with nothing chosen on it:
 *
 *   allow   → Apple's permission, explained first
 *   pick    → one button, Apple's picker, no other controls to wonder about
 *   confirm → what got picked, and one decision: shield the hard hours daily?
 *   manage  → the controls, once there is something to control
 *
 * The porn habit gets Apple's Safari filter switched on at pick time rather
 * than left as an off switch to find — it is the reason most people with that
 * habit came here. Everything the category ships beyond this (usage stats,
 * keyword lists, VPN profiles) is deliberately absent.
 */
type Stage = 'unavailable' | 'allow' | 'pick' | 'confirm' | 'manage';

function ShieldScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const shield = useShield();
  const params = useLocalSearchParams<{ preview?: string }>();
  const [picking, setPicking] = useState(false);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);
  const [refusedSchedule, setRefusedSchedule] = useState(false);
  const [justPicked, setJustPicked] = useState<ShieldSetup | null>(null);
  useMinuteTick();

  useEffect(() => {
    void reconcileLock();
  }, []);

  const isPorn = !!profile?.habits.includes('porn');
  const proposal = profile ? defaultWindow(profile.answers) : null;

  let stage: Stage = !shield.available
    ? 'unavailable'
    : shield.auth !== 'approved'
      ? 'allow'
      : justPicked
        ? 'confirm'
        : shield.setup
          ? 'manage'
          : 'pick';
  // Screen Time never runs in the Simulator, so the later stages can only be
  // looked at through this door. Dev only, and only when asked for.
  if (__DEV__ && params.preview && ['allow', 'pick', 'confirm', 'manage'].includes(params.preview)) {
    stage = params.preview as Stage;
  }

  const ask = async () => {
    if (asking) return;
    setAsking(true);
    const result = await requestAuthorization();
    setAsking(false);
    setDenied(result === 'denied');
    shield.refreshAuth();
  };

  const picked = async (p: { token: string; apps: number; categories: number; sites: number }) => {
    setPicking(false);
    const counts = { apps: p.apps, categories: p.categories, sites: p.sites };
    await completeSetup(p.token, counts);
    // The filter is the point for this habit; on by default, switchable later.
    if (isPorn && !shield.filter) await setFilter(true);
    setJustPicked({ ...counts, at: Date.now() });
  };

  const decideWindow = async (on: boolean) => {
    if (proposal) await setWindow({ ...proposal, on });
    setJustPicked(null);
  };

  /* ------------------------------------------------------------------ */

  if (stage === 'unavailable') {
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

  if (stage === 'allow') {
    return (
      <Screen
        title="Shield"
        footer={<Cta label={asking ? 'Asking…' : 'Allow Screen Time'} onPress={ask} disabled={asking} />}>
        <Text style={s.h1}>Put a shield between you and it.</Text>
        <Text style={s.body}>
          Choose the apps and sites that pull you in. Curb keeps them out of reach during your hard
          hours, and for a while when you ask it to mid-urge. When you hit the shield, you see one
          of your own reasons instead.
        </Text>
        <Steps
          items={[
            'Allow Screen Time — Apple’s sheet, then your passcode',
            'Pick the apps and sites in Apple’s list',
            'Decide whether it’s up every day in your hard hours',
          ]}
        />
        <Text style={s.body}>Apple asks once. Curb never learns which apps you chose — only how many.</Text>
        {denied || shield.auth === 'denied' ? (
          <Notice tone="warn">
            Screen Time access is off for Curb. Turn it on in Settings › Screen Time › Apps with
            Screen Time access, then come back.
          </Notice>
        ) : null}
      </Screen>
    );
  }

  if (stage === 'pick') {
    const current = sdk()?.getFamilyActivitySelectionId(SELECTION_ID) ?? null;
    return (
      <Screen title="Shield" footer={<Cta label="Choose apps and sites" onPress={() => setPicking(true)} />}>
        <ShieldPicker visible={picking} current={current} onPicked={picked} onCancel={() => setPicking(false)} />
        <Text style={s.h1}>Choose what to shield.</Text>
        <Text style={s.body}>
          Apple’s list opens next. Pick whole categories where you can — Social, Entertainment,
          Games — so an app you install next month is covered too. Single apps and websites work as
          well.
        </Text>
        {isPorn ? (
          <Text style={s.body}>
            Apple’s adult-content filter for Safari is switched on for you at the same time. Other
            browsers aren’t covered by it.
          </Text>
        ) : null}
        <Text style={s.body}>Curb never sees the names — only how many you picked.</Text>
      </Screen>
    );
  }

  if (stage === 'confirm' && proposal) {
    const setup = justPicked ?? shield.setup ?? { apps: 2, categories: 1, sites: 0, at: 0 };
    const end = Math.min(24, proposal.startHour + proposal.hours);
    return (
      <Screen
        title="Shield"
        back={false}
        footer={
          <View style={{ gap: Spacing.two }}>
            <Cta label="Shield those hours every day" onPress={() => void decideWindow(true)} />
            <Cta label="Only when I ask" variant="ghost" onPress={() => void decideWindow(false)} />
          </View>
        }>
        <Animated.View entering={FadeIn.duration(durations.base)} style={{ gap: Spacing.three }}>
          <View style={s.doneRow}>
            <SymbolChip name="shield.fill" tint={hues.urge.solid} wash={hues.urge.wash} />
            <View style={{ flex: 1 }}>
              <Text style={s.doneTitle}>Shielded</Text>
              <Text style={s.doneSub}>
                {summarise(setup) ?? 'your selection'}
                {isPorn ? ' · Safari filter on' : ''}
              </Text>
            </View>
          </View>
          <Text style={s.h1}>Up every day in your hard hours?</Text>
          <Text style={s.body}>
            You said urges hit hardest {triggerPhrase(proposal.startHour)}. Curb can put the shield up
            from <Text style={s.strong}>{fmtHour(proposal.startHour)}</Text> to{' '}
            <Text style={s.strong}>{fmtHour(end)}</Text> every day and take it down after. You can
            change the hours any time.
          </Text>
          <Text style={s.body}>
            Either way, the urge toolkit gets a “shield for 15 minutes” button for the moments in
            between.
          </Text>
        </Animated.View>
      </Screen>
    );
  }

  /* ---------------------------- manage ---------------------------- */

  const window = shield.window ?? proposal;
  const current = sdk()?.getFamilyActivitySelectionId(SELECTION_ID) ?? null;

  const changeWindow = async (next: Partial<NonNullable<typeof window>>) => {
    if (!window) return;
    await setWindow({ ...window, ...next });
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

  const summary = summarise(shield.setup);

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
              <Text style={[s.chipLabel, (!shield.setup || !!shield.lock) && s.chipLabelOff]}>
                {m === 60 ? '1 hour' : `${m} min`}
              </Text>
            </Tap>
          ))}
        </View>
        {refusedSchedule ? (
          <Notice tone="info">
            The shield is up, but iOS didn’t take the timer. Curb lifts it the next time you open the
            app after it ends.
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
                  {fmtHour(window.startHour)} to {fmtHour(Math.min(24, window.startHour + window.hours))}, from
                  what you told us.
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
            <Stepper
              label="Starts"
              value={fmtHour(window.startHour)}
              onChange={(d) => void changeWindow({ startHour: (window.startHour + d + 24) % 24 })}
            />
            <Stepper
              label="For"
              value={`${window.hours} h`}
              onChange={(d) => void changeWindow({ hours: Math.max(1, Math.min(6, window.hours + d)) })}
            />
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
        Want it locked for real? In iOS Settings › Screen Time › Lock Screen Time Settings, a passcode
        stops Curb’s access being switched off — and the app being deleted — without it. Ask someone
        you trust to set the code.
      </Text>
      <View style={{ height: Spacing.four }} />
      <Tap haptic="none" onPress={() => router.push('/help')} accessibilityRole="button" style={s.helpLink}>
        <Text style={s.link}>Need someone to talk to?</Text>
      </Tap>
    </Screen>
  );
}

function summarise(setup: ShieldSetup | null | undefined): string | null {
  if (!setup) return null;
  const parts = [
    setup.categories ? `${setup.categories} ${setup.categories === 1 ? 'category' : 'categories'}` : null,
    setup.apps ? `${setup.apps} ${setup.apps === 1 ? 'app' : 'apps'}` : null,
    setup.sites ? `${setup.sites} ${setup.sites === 1 ? 'site' : 'sites'}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

/** The onboarding answer, said back the way they said it. */
function triggerPhrase(startHour: number): string {
  if (startHour >= 21) return 'late at night';
  if (startHour >= 19) return 'in the evening';
  return 'at the end of the day';
}

function Steps({ items }: { items: string[] }) {
  return (
    <View style={s.steps}>
      {items.map((t, i) => (
        <View key={t} style={s.step}>
          <View style={s.stepNum}>
            <Text style={s.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={s.stepText}>{t}</Text>
        </View>
      ))}
    </View>
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
  strong: { color: palette.text, fontFamily: type.bodySemi },
  section: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, letterSpacing: 0.3, marginTop: Spacing.two },
  card: { padding: 0, overflow: 'hidden' },
  steps: { gap: Spacing.two, marginTop: Spacing.two },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.surface3, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: palette.text, fontSize: 13, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  stepText: { flex: 1, color: palette.textDim, fontSize: 15, lineHeight: 21, fontFamily: type.body },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: hues.urge.wash, borderRadius: 16, padding: Spacing.three },
  doneTitle: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  doneSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body },
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
  chipLabelOff: { color: palette.textFaint },
  ghost: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: palette.line },
  ghostLabel: { color: palette.accent, fontSize: 15, fontFamily: type.bodySemi },
  miniBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: palette.surface3 },
  miniLabel: { color: palette.text, fontSize: 20, fontFamily: type.bodyMed },
  value: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'], minWidth: 64, textAlign: 'center' },
  fine: { color: palette.textFaint, fontSize: 13, lineHeight: 20, fontFamily: type.body, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  link: { color: palette.accent, fontFamily: type.bodySemi },
  helpLink: { minHeight: 44, justifyContent: 'center' },
});

export default withAccess(ShieldScreen);
