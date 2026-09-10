import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { SymbolChip } from '@/components/ui/symbol-chip';
import { Tap } from '@/components/ui/tap';
import { useProfile } from '@/db/repo/profile';
import { Cta, Eyebrow, Subtitle, Title } from '@/features/onboarding/components/chrome';
import { fmtHour } from '@/features/shield/format';
import { sdk, SELECTION_ID, requestAuthorization } from '@/features/shield/module';
import { ShieldPicker } from '@/features/shield/ShieldPicker';
import {
  completeSetup,
  defaultWindow,
  endLockAfterDelay,
  LOCK_CHOICES_MIN,
  reconcileLock,
  setFilter,
  setMode,
  setUnlockDelay,
  setWindow,
  shieldNow,
  startLock,
  useShield,
  type ShieldMode,
  type ShieldSetup,
} from '@/features/shield/store';
import { useMinuteTick } from '@/lib/clock';
import { durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * Shield — its own tab, because it is a *state* the person should be able to
 * feel, not a settings page: one big mark that is either up or down.
 *
 *   allow   → what it is, the three steps ahead, Apple's permission
 *   pick    → one button, Apple's picker, the advice that matters
 *   confirm → what got picked, and one decision: always on, hard hours, or
 *             only when asked
 *   status  → up or down, why, and the one thing to do about it; everything
 *             else behind Manage
 *
 * The words are "Shield is up", never "Protected": it is chosen apps plus a
 * Safari-only filter, and saying more than that is how trust is lost.
 */
type Stage = 'unavailable' | 'allow' | 'pick' | 'confirm' | 'status';

export default function ShieldTab() {
  const router = useRouter();
  const { profile } = useProfile();
  const shield = useShield();
  const params = useLocalSearchParams<{ preview?: string }>();
  const [picking, setPicking] = useState(false);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);
  const [justPicked, setJustPicked] = useState<ShieldSetup | null>(null);
  const [managing, setManaging] = useState(false);
  const [refusedSchedule, setRefusedSchedule] = useState(false);
  useMinuteTick();

  useEffect(() => {
    void reconcileLock();
  }, []);

  const isPorn = !!profile?.habits.includes('porn');
  const proposal = profile ? defaultWindow(profile.answers) : null;
  const window = shield.window ?? proposal;

  let stage: Stage = !shield.available
    ? 'unavailable'
    : shield.auth !== 'approved'
      ? 'allow'
      : justPicked
        ? 'confirm'
        : shield.setup
          ? 'status'
          : 'pick';
  // Screen Time never runs in the Simulator; dev-only door to the later stages.
  let previewUp: boolean | null = null;
  if (__DEV__ && params.preview) {
    if (['allow', 'pick', 'confirm', 'status'].includes(params.preview)) stage = params.preview as Stage;
    if (params.preview === 'up') {
      stage = 'status';
      previewUp = true;
    }
    if (params.preview === 'down') {
      stage = 'status';
      previewUp = false;
    }
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
    if (isPorn && !shield.filter) await setFilter(true);
    setJustPicked({ ...counts, at: Date.now() });
  };

  const choose = async (mode: ShieldMode) => {
    if (window) await setMode(mode, window);
    setJustPicked(null);
  };

  /* ---------------------------------------------------------------- */

  if (stage === 'unavailable') {
    return (
      <Screen title="Shield" back={false}>
        <Text style={s.h1}>Shield is an iPhone feature.</Text>
        <Text style={s.body}>
          It uses Apple’s Screen Time to keep chosen apps and sites out of reach — always, in your
          hard hours, or while you wait out an urge.
          {Platform.OS === 'ios' && __DEV__ ? ' It needs a development build — it can’t run in Expo Go.' : ''}
        </Text>
      </Screen>
    );
  }

  if (stage === 'allow') {
    return (
      <Screen
        title="Shield"
        back={false}
        footer={<Cta label={asking ? 'Asking…' : 'Allow Screen Time'} onPress={ask} disabled={asking} />}>
        <Text style={s.h1}>Put a shield between you and it.</Text>
        <Text style={s.body}>
          Choose the apps and sites that pull you in. Curb keeps them out of reach — always, in your
          hard hours, or for a while when you ask mid-urge. When you hit the shield, you see one of
          your own reasons instead.
        </Text>
        <Steps
          items={[
            'Allow Screen Time — Apple’s sheet, then your passcode',
            'Pick the apps and sites in Apple’s list',
            'Decide when it’s up: always, your hard hours, or when you ask',
          ]}
        />
        <Text style={s.body}>Apple asks once. Curb never learns which apps you chose — only how many.</Text>
        {denied || shield.auth === 'denied' ? (
          <Notice tone="warn">
            Screen Time access is off for Curb. Turn it on in Settings › Screen Time › Apps with Screen
            Time access, then come back.
          </Notice>
        ) : null}
      </Screen>
    );
  }

  if (stage === 'pick') {
    const current = sdk()?.getFamilyActivitySelectionId(SELECTION_ID) ?? null;
    return (
      <Screen title="Shield" back={false} footer={<Cta label="Choose apps and sites" onPress={() => setPicking(true)} />}>
        <ShieldPicker visible={picking} current={current} onPicked={picked} onCancel={() => setPicking(false)} />
        <Text style={s.h1}>Choose what to shield.</Text>
        {isPorn ? (
          <>
            <Text style={s.body}>
              <Text style={s.strong}>Pick Chrome and every other browser you use</Text>, plus any app
              that tends to lead you there. Safari is handled separately: Apple’s adult-content filter
              switches on for it at the same time.
            </Text>
            <Text style={s.body}>
              With the browsers shielded and Safari filtered, there is no quiet way round it on this
              phone. That is the point.
            </Text>
          </>
        ) : (
          <Text style={s.body}>
            Apple’s list opens next. Pick whole categories where you can — Social, Entertainment, Games
            — so an app you install next month is covered too. Single apps and websites work as well.
          </Text>
        )}
        <Text style={s.body}>Curb never sees the names — only how many you picked.</Text>
      </Screen>
    );
  }

  if (stage === 'confirm' && window) {
    const setup = justPicked ?? shield.setup ?? { apps: 2, categories: 1, sites: 0, at: 0 };
    const end = Math.min(24, window.startHour + window.hours);
    // For porn the browsers need to be gone all day; for everything else the
    // hard hours are the honest default. Primary button follows.
    return (
      <Screen
        title="Shield"
        back={false}
        footer={
          <View style={{ gap: Spacing.two }}>
            {isPorn ? (
              <>
                <Cta label="Keep it up always" onPress={() => void choose('always')} />
                <Cta label="Only in my hard hours" variant="ghost" onPress={() => void choose('window')} />
              </>
            ) : (
              <>
                <Cta label="Shield my hard hours every day" onPress={() => void choose('window')} />
                <Cta label="Keep it up always" variant="ghost" onPress={() => void choose('always')} />
              </>
            )}
            <Cta label="Only when I ask" variant="ghost" onPress={() => void choose('ask')} />
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
          <Text style={s.h1}>When should it be up?</Text>
          <Text style={s.body}>
            <Text style={s.strong}>Always</Text> keeps it up around the clock — the wall for a browser
            you’d otherwise open at 3 pm. <Text style={s.strong}>Hard hours</Text> puts it up from{' '}
            {fmtHour(window.startHour)} to {fmtHour(end)} every day, from what you told us.{' '}
            <Text style={s.strong}>When I ask</Text> is the 15-minute lock in the urge toolkit, and
            nothing more.
          </Text>
          <Text style={s.body}>You can change your mind any time. Turning it off waits the delay you set.</Text>
        </Animated.View>
      </Screen>
    );
  }

  /* ---------------------------- status ---------------------------- */

  const state =
    previewUp === null
      ? shieldNow(shield)
      : previewUp
        ? { up: true as const, reason: 'window' as const, until: 'midnight' }
        : { up: false as const, next: '9 pm today' };
  const summary = summarise(shield.setup) ?? (previewUp !== null ? '1 category, 3 apps' : null);
  const current = sdk()?.getFamilyActivitySelectionId(SELECTION_ID) ?? null;

  const detail = state.up
    ? state.reason === 'lock'
      ? `Until ${state.until}, because you asked.`
      : state.reason === 'always'
        ? 'Always on. Turning it off waits your delay.'
        : `Until ${state.until} · your hard hours`
    : shield.mode === 'window' && state.next
      ? `Back up at ${state.next}.`
      : 'Up only when you ask.';

  const lock = async (minutes: number) => {
    const scheduled = await startLock(minutes);
    setRefusedSchedule(!scheduled);
  };

  const endEarly = () => {
    const d = shield.unlockDelayMin;
    Alert.alert(
      d > 0 ? `Lift the shield in ${d} min?` : 'Lift the shield now?',
      d > 0 ? 'You set this delay when you were clear-headed. It still applies.' : 'You set no delay. It lifts straight away.',
      [
        { text: 'Keep it up', style: 'cancel' },
        { text: d > 0 ? `Lift in ${d} min` : 'Lift now', onPress: () => void endLockAfterDelay() },
      ],
    );
  };

  const switchMode = (mode: ShieldMode) => {
    if (!window || mode === shield.mode) return;
    if (shield.mode === 'always' && shield.unlockDelayMin > 0) {
      Alert.alert(
        `Turn Always off in ${shield.unlockDelayMin} min?`,
        'You set this delay when you were clear-headed. It still applies.',
        [
          { text: 'Keep it', style: 'cancel' },
          { text: `Turn off in ${shield.unlockDelayMin} min`, onPress: () => void setMode(mode, window) },
        ],
      );
      return;
    }
    void setMode(mode, window);
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ShieldPicker
        visible={picking}
        current={current}
        onPicked={async (p) => {
          setPicking(false);
          await completeSetup(p.token, { apps: p.apps, categories: p.categories, sites: p.sites });
        }}
        onCancel={() => setPicking(false)}
      />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Eyebrow>Shield</Eyebrow>
        <Title>{state.up ? 'Shield is up.' : 'Shield is down.'}</Title>
        <Subtitle>{detail}</Subtitle>

        <View style={s.markWrap} accessibilityLabel={state.up ? 'Shield is up' : 'Shield is down'}>
          <View style={[s.disc, { backgroundColor: state.up ? hues.urge.wash : palette.surface2 }]}>
            <SymbolView
              name={state.up ? 'shield.fill' : 'shield'}
              size={112}
              tintColor={state.up ? hues.urge.solid : palette.textFaint}
              style={s.mark}
            />
          </View>
        </View>

        <Tap haptic="light" onPress={() => setPicking(true)} style={s.summary} accessibilityRole="button">
          <Text style={s.summaryText}>
            {summary ?? 'Nothing chosen'}
            {isPorn && shield.filter ? ' · Safari filter on' : ''}
          </Text>
          <Text style={s.summaryLink}>Change</Text>
        </Tap>

        <Text style={s.section}>When it’s up</Text>
        <View style={s.segment}>
          {(
            [
              ['always', 'Always'],
              ['window', 'Hard hours'],
              ['ask', 'When I ask'],
            ] as const
          ).map(([m, label]) => {
            const on = shield.mode === m;
            return (
              <Tap
                key={m}
                haptic="selection"
                onPress={() => switchMode(m)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={[s.segBtn, on && s.segBtnOn]}>
                <Text style={[s.segLabel, on && s.segLabelOn]}>{label}</Text>
              </Tap>
            );
          })}
        </View>
        {window ? (
          <Text style={s.fine}>
            Hard hours are {fmtHour(window.startHour)} to {fmtHour(Math.min(24, window.startHour + window.hours))}.{' '}
            <Text style={s.link} onPress={() => setManaging(true)}>
              Manage
            </Text>
          </Text>
        ) : null}

        {refusedSchedule ? (
          <Notice tone="info">The shield is up, but iOS didn’t take the timer. Curb lifts it the next time you open the app after it ends.</Notice>
        ) : null}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.footer}>
        {state.up ? (
          state.reason === 'lock' ? (
            <Cta label="End early" variant="ghost" onPress={endEarly} />
          ) : (
            <Tap haptic="light" onPress={() => router.push('/urge')} style={s.quiet} accessibilityRole="button">
              <Text style={s.quietLabel}>Having an urge anyway? Open the toolkit</Text>
            </Tap>
          )
        ) : (
          <View style={s.chips}>
            {LOCK_CHOICES_MIN.map((m) => (
              <Tap
                key={m}
                haptic="medium"
                disabled={!shield.setup && previewUp === null}
                onPress={() => void lock(m)}
                style={s.chip}
                accessibilityRole="button"
                accessibilityLabel={`Shield for ${m} minutes`}>
                <Text style={s.chipLabel}>{m === 60 ? 'Shield 1 hour' : `Shield ${m} min`}</Text>
              </Tap>
            ))}
          </View>
        )}
      </View>

      <Modal visible={managing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setManaging(false)}>
        <SafeAreaView style={s.root} edges={['bottom']}>
          <ScrollView contentContainerStyle={s.content}>
            <Text style={s.h1}>Manage Shield</Text>

            {window ? (
              <>
                <Text style={s.section}>Hard hours</Text>
                <Card style={s.card}>
                  <Stepper label="Start" value={fmtHour(window.startHour)} onChange={(d) => void setWindow({ ...window, startHour: (window.startHour + d + 24) % 24 })} />
                  <View style={s.sep} />
                  <Stepper label="For" value={`${window.hours} h`} onChange={(d) => void setWindow({ ...window, hours: Math.max(1, Math.min(6, window.hours + d)) })} />
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
              <Text style={s.fineIn}>Decided now, while you’re clear. A shield you can drop in one tap is a shield you will drop.</Text>
            </Card>

            {isPorn ? (
              <>
                <Text style={s.section}>Safari</Text>
                <Card style={s.card}>
                  <View style={s.row}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={s.rowLabel}>Adult content filter</Text>
                      <Text style={s.rowSub}>Apple’s filter, Safari only. Other browsers are shielded outright if you picked them.</Text>
                    </View>
                    <Switch
                      value={shield.filter}
                      onValueChange={(v) => void setFilter(v)}
                      trackColor={{ true: palette.accentDeep, false: palette.surface3 }}
                      thumbColor={palette.text}
                    />
                  </View>
                </Card>
              </>
            ) : null}

            <Text style={s.fine}>
              Want it locked for real? In iOS Settings › Screen Time › Lock Screen Time Settings, a passcode
              stops Curb’s access being switched off — and the app being deleted — without it. Ask someone you
              trust to set the code.
            </Text>
          </ScrollView>
          <View style={s.footer}>
            <Cta label="Done" onPress={() => setManaging(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  root: { flex: 1, backgroundColor: palette.bg },
  content: { padding: Spacing.four, gap: Spacing.two },
  h1: { color: palette.text, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, fontFamily: type.display },
  body: { color: palette.textDim, fontSize: 16, lineHeight: 24, fontFamily: type.body },
  strong: { color: palette.text, fontFamily: type.bodySemi },
  section: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, letterSpacing: 0.3, marginTop: Spacing.three },
  markWrap: { alignItems: 'center', marginTop: Spacing.four, marginBottom: Spacing.three },
  disc: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 112, height: 112 },
  summary: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: palette.surface,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  summaryText: { flex: 1, color: palette.text, fontSize: 15, fontFamily: type.bodyMed },
  summaryLink: { color: palette.accent, fontSize: 15, fontFamily: type.bodySemi },
  segment: { flexDirection: 'row', backgroundColor: palette.surface3, borderRadius: 14, padding: 3, gap: 3 },
  segBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  segBtnOn: { backgroundColor: palette.surface },
  segLabel: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  segLabelOn: { color: palette.text, fontFamily: type.bodySemi },
  fine: { color: palette.textFaint, fontSize: 13, lineHeight: 20, fontFamily: type.body, marginTop: Spacing.one },
  fineIn: { color: palette.textFaint, fontSize: 13, lineHeight: 20, fontFamily: type.body, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  link: { color: palette.accent, fontFamily: type.bodySemi },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: Spacing.four, paddingBottom: 100, backgroundColor: 'transparent' },
  chips: { flexDirection: 'row', gap: Spacing.two },
  chip: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: hues.urge.solid },
  chipLabel: { color: hues.urge.ink, fontSize: 15, fontFamily: type.bodySemi, textAlign: 'center' },
  quiet: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quietLabel: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  steps: { gap: Spacing.two, marginTop: Spacing.two },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.surface3, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: palette.text, fontSize: 13, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'] },
  stepText: { flex: 1, color: palette.textDim, fontSize: 15, lineHeight: 21, fontFamily: type.body },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: hues.urge.wash, borderRadius: 16, padding: Spacing.three },
  doneTitle: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  doneSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body },
  card: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: 14, minHeight: 56 },
  sep: { height: 1, backgroundColor: palette.line, marginLeft: Spacing.three },
  rowLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  rowSub: { color: palette.textDim, fontSize: 13, lineHeight: 18, fontFamily: type.body },
  miniBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: palette.surface3 },
  miniLabel: { color: palette.text, fontSize: 20, fontFamily: type.bodyMed },
  value: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'], minWidth: 64, textAlign: 'center' },
});
