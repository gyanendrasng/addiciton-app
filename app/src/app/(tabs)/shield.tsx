import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SFSymbol } from 'expo-symbols';

import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/notice';
import { SymbolChip } from '@/components/ui/symbol-chip';
import { Tap } from '@/components/ui/tap';
import { useProfile } from '@/db/repo/profile';
import { useReasons } from '@/db/repo/reasons';
import { Cta, Eyebrow, Subtitle, Title } from '@/features/onboarding/components/chrome';
import { fmtHour } from '@/features/shield/format';
import { sdk, SELECTION_ID, SHIELD_COPY, requestAuthorization } from '@/features/shield/module';
import { ShieldMark } from '@/features/shield/ShieldMark';
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
  type ShieldWindow,
} from '@/features/shield/store';
import { now, useMinuteTick } from '@/lib/clock';
import { durations } from '@/theme/motion';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * Shield — its own tab, because a blocker is a state the person should be able
 * to feel, not a settings page.
 *
 * First run is a three-step setup in the tab's own skeleton (eyebrow, heading,
 * one sentence, content, action in the thumb zone), the same skeleton every
 * other tab uses:
 *
 *   1  allow    what it does, then Apple's permission
 *   2  pick     one button into Apple's picker, and the advice that matters
 *   3  when     what got picked, and one decision: always / hard hours / ask
 *
 * After that the tab is a status screen: the mark, up or down and why, what is
 * shielded, when it is up, and the one thing to do about it. The words are
 * "up" and "down", never "protected".
 */
type Stage = 'unavailable' | 'allow' | 'pick' | 'when' | 'status';

const MODES: { id: ShieldMode; icon: SFSymbol; label: string; sub: (w: ShieldWindow) => string }[] = [
  { id: 'always', icon: 'lock.fill', label: 'Always', sub: () => 'Up around the clock. Turning it off waits your delay.' },
  { id: 'window', icon: 'clock.fill', label: 'Hard hours', sub: (w) => `Every day, ${fmtHour(w.startHour)} to ${fmtHour(Math.min(24, w.startHour + w.hours))}.` },
  { id: 'ask', icon: 'hand.raised.fill', label: 'When I ask', sub: () => 'Only the 15 to 60 minute locks from the urge toolkit.' },
];

export default function ShieldTab() {
  const router = useRouter();
  const { profile } = useProfile();
  const shield = useShield();
  const { reasons } = useReasons();
  const params = useLocalSearchParams<{ preview?: string }>();
  const [picking, setPicking] = useState(false);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);
  const [justPicked, setJustPicked] = useState<ShieldSetup | null>(null);
  const [chosenMode, setChosenMode] = useState<ShieldMode | null>(null);
  // How many setup steps the person has stepped back from where the data says they are.
  const [back, setBack] = useState(0);
  const [duration, setDuration] = useState<(typeof LOCK_CHOICES_MIN)[number]>(30);
  const [managing, setManaging] = useState(false);
  const [refusedSchedule, setRefusedSchedule] = useState(false);
  useMinuteTick();

  useEffect(() => {
    void reconcileLock();
  }, []);

  const isPorn = !!profile?.habits.includes('porn');
  const window: ShieldWindow | null = shield.window ?? (profile ? defaultWindow(profile.answers) : null);

  let stage: Stage = !shield.available
    ? 'unavailable'
    : shield.auth !== 'approved'
      ? 'allow'
      : justPicked
        ? 'when'
        : shield.setup
          ? 'status'
          : 'pick';
  // Screen Time never runs in the Simulator; dev-only door to the later stages.
  let previewUp: boolean | null = null;
  if (__DEV__ && params.preview) {
    if (['allow', 'pick', 'when', 'status'].includes(params.preview)) stage = params.preview as Stage;
    if (params.preview === 'up' || params.preview === 'down') {
      stage = 'status';
      previewUp = params.preview === 'up';
    }
  }
  const SETUP: Stage[] = ['allow', 'pick', 'when'];
  const natural = SETUP.indexOf(stage);
  if (natural > 0 && back > 0) stage = SETUP[Math.max(0, natural - back)];
  const forward = () => setBack((b) => Math.max(0, b - 1));
  const backward = () => setBack((b) => b + 1);

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
    setChosenMode(isPorn ? 'always' : 'window');
    setBack(0);
    setJustPicked({ ...counts, at: Date.now() });
  };

  const finishSetup = async () => {
    if (window && chosenMode) await setMode(chosenMode, window);
    setJustPicked(null);
  };

  /* ------------------------------ setup ------------------------------ */

  if (stage === 'unavailable') {
    return (
      <Frame eyebrow="Shield" title="Shield is an iPhone feature." subtitle="It uses Apple’s Screen Time to keep chosen apps and sites out of reach — always, in your hard hours, or while you wait out an urge.">
        {Platform.OS === 'ios' && __DEV__ ? <Subtitle>It needs a development build — it can’t run in Expo Go.</Subtitle> : null}
      </Frame>
    );
  }

  if (stage === 'allow') {
    return (
      <Frame
        eyebrow="Shield · Step 1 of 3"
        title="Put a shield between you and it."
        subtitle="Choose the apps and sites that pull you in. Curb keeps them out of reach, and shows you one of your own reasons when you try."
        footer={
          shield.auth === 'approved' ? (
            <Cta label="Continue" onPress={forward} />
          ) : (
            <Cta label={asking ? 'Asking…' : 'Allow Screen Time'} onPress={ask} disabled={asking} />
          )
        }>
        <Card style={s.card}>
          <InfoRow icon="checklist" hue="progress" label="You choose, in Apple’s list" sub="Apps, whole categories, or websites. Curb only ever sees how many." />
          <Sep />
          <InfoRow icon="clock.fill" hue="checkin" label="Up when it matters" sub="Always, in your hard hours, or only when you ask." />
          <Sep />
          <InfoRow icon="heart.fill" hue="reasons" label="Your reason on the wall" sub="The shield screen shows something you wrote, and a way back into Curb." />
        </Card>
        <Text style={s.section}>What they’ll see when they try</Text>
        <ShieldMock reason={reasons[0]?.text ?? null} />
        {shield.auth === 'approved' ? (
          <View style={s.pickedRow}>
            <SymbolChip name="checkmark" tint={hues.pledge.solid} wash={hues.pledge.wash} />
            <Text style={s.pickedText}>Screen Time access is allowed</Text>
          </View>
        ) : (
          <Text style={s.fine}>Apple asks once, with your device passcode.</Text>
        )}
        {denied || shield.auth === 'denied' ? (
          <Notice tone="warn">Screen Time access is off for Curb. Turn it on in Settings › Screen Time › Apps with Screen Time access, then come back.</Notice>
        ) : null}
      </Frame>
    );
  }

  if (stage === 'pick') {
    const current = sdk()?.getFamilyActivitySelectionId(SELECTION_ID) ?? null;
    return (
      <Frame
        eyebrow="Shield · Step 2 of 3"
        title="Choose what to shield."
        subtitle="Apple’s list opens next. Curb never sees the names — only how many you picked."
        footer={
          <View style={s.footerStack}>
            <Cta label="Open Apple’s list" onPress={() => setPicking(true)} />
            <View style={s.ghostRow}>
              <View style={{ flex: 1 }}>
                <Cta label="Back" variant="ghost" onPress={backward} />
              </View>
              {natural === 2 ? (
                <View style={{ flex: 1 }}>
                  <Cta label="Keep what I picked" variant="ghost" onPress={forward} />
                </View>
              ) : null}
            </View>
          </View>
        }>
        <ShieldPicker visible={picking} current={current} onPicked={picked} onCancel={() => setPicking(false)} />
        <Card style={s.card}>
          {isPorn ? (
            <>
              <InfoRow icon="safari.fill" hue="urge" label="Every browser you use" sub="Chrome, Firefox, Brave — shielded outright. Safari gets Apple’s adult-content filter instead, switched on for you." />
              <Sep />
              <InfoRow icon="square.grid.2x2.fill" hue="progress" label="Anything that leads you there" sub="Pick the apps that tend to come first. Whole categories cover apps you haven’t installed yet." />
            </>
          ) : (
            <>
              <InfoRow icon="square.grid.2x2.fill" hue="progress" label="Whole categories where you can" sub="Social, Entertainment, Games — an app you install next month is covered too." />
              <Sep />
              <InfoRow icon="app.badge.fill" hue="checkin" label="Single apps and sites work as well" sub="Add the specific ones that get you." />
            </>
          )}
        </Card>
      </Frame>
    );
  }

  if (stage === 'when' && window) {
    const setup = justPicked ?? shield.setup ?? { apps: 2, categories: 1, sites: 0, at: 0 };
    const selected = chosenMode ?? (isPorn ? 'always' : 'window');
    return (
      <Frame
        eyebrow="Shield · Step 3 of 3"
        title="When should it be up?"
        subtitle="You can change this any time from the Shield tab."
        footer={
          <View style={s.footerStack}>
            <Cta label="Finish setup" onPress={() => void finishSetup()} />
            <Cta label="Change selection" variant="ghost" onPress={backward} />
          </View>
        }>
        <View style={s.pickedRow}>
          <SymbolChip name="checkmark" tint={hues.pledge.solid} wash={hues.pledge.wash} />
          <Text style={s.pickedText}>
            {summarise(setup) ?? 'Your selection'}
            {isPorn ? ' · Safari filter on' : ''}
          </Text>
        </View>
        <Card style={s.card}>
          {MODES.map((m, i) => (
            <View key={m.id}>
              {i === 0 ? null : <Sep />}
              <OptionRow icon={m.icon} label={m.label} sub={m.sub(window)} selected={selected === m.id} onPress={() => setChosenMode(m.id)} />
            </View>
          ))}
        </Card>
        {isPorn ? <Text style={s.fine}>Always is the honest choice for a browser: a shield that comes down at breakfast isn’t one.</Text> : null}
      </Frame>
    );
  }

  /* ------------------------------ status ------------------------------ */

  const state =
    previewUp === null
      ? shieldNow(shield)
      : previewUp
        ? { up: true as const, reason: 'window' as const, until: 'midnight' }
        : { up: false as const, next: '9 pm today' };
  const summary = summarise(shield.setup) ?? (previewUp !== null ? '1 category, 3 apps' : null);
  const current = sdk()?.getFamilyActivitySelectionId(SELECTION_ID) ?? null;
  const mode: ShieldMode = previewUp === null ? shield.mode : previewUp ? 'window' : 'ask';

  // Ring: how much of the current lock or window is left.
  let remaining: number | undefined;
  if (state.up && state.reason === 'lock' && shield.lock) {
    const total = Math.max(1, shield.lock.minutes ?? 30) * 60_000;
    remaining = Math.max(0, Math.min(1, (shield.lock.until - now()) / total));
  } else if (state.up && state.reason === 'window' && window) {
    const start = window.startHour * 60;
    const end = Math.min(24 * 60, (window.startHour + window.hours) * 60);
    const d = new Date(now());
    const cur = d.getHours() * 60 + d.getMinutes();
    remaining = previewUp !== null ? 0.62 : Math.max(0, Math.min(1, (end - cur) / (end - start)));
  } else if (state.up && state.reason === 'always') {
    remaining = 1;
  }

  const headline = state.up ? 'Shield is up.' : 'Shield is down.';
  const detail = state.up
    ? state.reason === 'lock'
      ? `Until ${state.until}, because you asked.`
      : state.reason === 'always'
        ? 'Always on. Turning it off waits your delay.'
        : `Until ${state.until}, your hard hours.`
    : mode === 'window' && state.next
      ? `Back up at ${state.next}.`
      : 'Up only when you ask.';

  const lock = async () => {
    const scheduled = await startLock(duration);
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

  const switchMode = (next: ShieldMode) => {
    if (!window || next === mode) return;
    if (mode === 'always' && shield.unlockDelayMin > 0) {
      Alert.alert(`Turn Always off in ${shield.unlockDelayMin} min?`, 'You set this delay when you were clear-headed. It still applies.', [
        { text: 'Keep it', style: 'cancel' },
        { text: `Turn off in ${shield.unlockDelayMin} min`, onPress: () => void setMode(next, window) },
      ]);
      return;
    }
    void setMode(next, window);
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
        <Title>{headline}</Title>
        <Subtitle>{detail}</Subtitle>

        <Animated.View layout={LinearTransition.duration(durations.base)}>
          <Card style={s.hero}>
            <ShieldMark up={state.up} remaining={remaining} size={120} />
            <View style={{ flex: 1, gap: Spacing.one }}>
              <Text style={s.heroLabel}>{state.up ? 'Up' : 'Down'}</Text>
              <Text style={s.heroValue}>
                {state.up ? (state.reason === 'always' ? 'Always' : `until ${state.until}`) : mode === 'window' && state.next ? `until ${state.next}` : 'until you ask'}
              </Text>
              {state.up && state.reason === 'lock' ? (
                <Tap haptic="light" onPress={endEarly} accessibilityRole="button" style={s.heroLink}>
                  <Text style={s.link}>End early</Text>
                </Tap>
              ) : state.up ? (
                <Tap haptic="light" onPress={() => router.push('/urge')} accessibilityRole="button" style={s.heroLink}>
                  <Text style={s.link}>Having an urge anyway?</Text>
                </Tap>
              ) : null}
            </View>
          </Card>
        </Animated.View>

        <Text style={s.section}>What’s shielded</Text>
        <Card style={s.card}>
          <Tap haptic="light" onPress={() => setPicking(true)} accessibilityRole="button">
            <View style={s.row}>
              <SymbolChip name="square.grid.2x2.fill" tint={hues.progress.solid} wash={hues.progress.wash} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{summary ?? 'Nothing chosen yet'}</Text>
                <Text style={s.rowSub}>Picked in Apple’s list. Tap to change.</Text>
              </View>
              <Text style={s.chev}>›</Text>
            </View>
          </Tap>
          {isPorn ? (
            <>
              <Sep />
              <View style={s.row}>
                <SymbolChip name="safari.fill" tint={hues.urge.solid} wash={hues.urge.wash} />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowLabel}>Safari adult-content filter</Text>
                  <Text style={s.rowSub}>Apple’s filter, Safari only.</Text>
                </View>
                <Switch value={shield.filter} onValueChange={(v) => void setFilter(v)} trackColor={{ true: palette.accentDeep, false: palette.surface3 }} thumbColor={palette.text} />
              </View>
            </>
          ) : null}
        </Card>

        <Text style={s.section}>When it’s up</Text>
        <Card style={s.card}>
          {window
            ? MODES.map((m, i) => (
                <View key={m.id}>
                  {i === 0 ? null : <Sep />}
                  <OptionRow icon={m.icon} label={m.label} sub={m.sub(window)} selected={mode === m.id} onPress={() => switchMode(m.id)} />
                </View>
              ))
            : null}
          <Sep />
          <Tap haptic="light" onPress={() => setManaging(true)} accessibilityRole="button">
            <View style={s.row}>
              <SymbolChip name="slider.horizontal.3" tint={palette.textDim} wash={palette.surface3} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>Hours and delay</Text>
                <Text style={s.rowSub}>
                  {window ? `${fmtHour(window.startHour)} to ${fmtHour(Math.min(24, window.startHour + window.hours))}` : ''} · {shield.unlockDelayMin === 0 ? 'no delay' : `${shield.unlockDelayMin} min to lift`}
                </Text>
              </View>
              <Text style={s.chev}>›</Text>
            </View>
          </Tap>
        </Card>

        {refusedSchedule ? (
          <Animated.View entering={FadeIn.duration(durations.fast)} exiting={FadeOut.duration(durations.fast)}>
            <Notice tone="info">The shield is up, but iOS didn’t take the timer. Curb lifts it the next time you open the app after it ends.</Notice>
          </Animated.View>
        ) : null}
        <View style={{ height: state.up ? 96 : 220 }} />
      </ScrollView>

      {!state.up ? (
        <View style={s.footer}>
          <View style={s.durations} accessibilityRole="radiogroup">
            {LOCK_CHOICES_MIN.map((m) => {
              const on = duration === m;
              return (
                <Tap key={m} haptic="selection" onPress={() => setDuration(m)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[s.durBtn, on && s.durBtnOn]}>
                  <Text style={[s.durLabel, on && s.durLabelOn]}>{m === 60 ? '1 hour' : `${m} min`}</Text>
                </Tap>
              );
            })}
          </View>
          <Cta label={`Shield for ${duration === 60 ? '1 hour' : `${duration} min`}`} onPress={() => void lock()} disabled={!shield.setup && previewUp === null} />
        </View>
      ) : null}

      <Modal visible={managing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setManaging(false)}>
        <SafeAreaView style={s.root} edges={['bottom']}>
          <ScrollView contentContainerStyle={s.content}>
            <Eyebrow>Shield</Eyebrow>
            <Title>Hours and delay.</Title>
            {window ? (
              <>
                <Text style={s.section}>Hard hours</Text>
                <Card style={s.card}>
                  <Stepper label="Start" value={fmtHour(window.startHour)} onChange={(d) => void setWindow({ ...window, startHour: (window.startHour + d + 24) % 24 })} />
                  <Sep />
                  <Stepper label="For" value={`${window.hours} h`} onChange={(d) => void setWindow({ ...window, hours: Math.max(1, Math.min(6, window.hours + d)) })} />
                </Card>
              </>
            ) : null}
            <Text style={s.section}>Ending early</Text>
            <Card style={s.card}>
              <Stepper label="Wait before it lifts" value={shield.unlockDelayMin === 0 ? 'none' : `${shield.unlockDelayMin} min`} onChange={(d) => void setUnlockDelay(shield.unlockDelayMin + d * 5)} />
              <Text style={s.fineIn}>Decided now, while you’re clear. A shield you can drop in one tap is a shield you will drop.</Text>
            </Card>
            <Text style={s.fine}>Want it locked for real? In iOS Settings › Screen Time › Lock Screen Time Settings, a passcode stops Curb’s access being switched off — and the app being deleted — without it. Ask someone you trust to set the code.</Text>
            <View style={{ height: 120 }} />
          </ScrollView>
          <View style={[s.footer, s.footerSheet]}>
            <Cta label="Done" onPress={() => setManaging(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------------------- pieces ---------------------------- */

function Frame({
  eyebrow,
  title,
  subtitle,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <View style={{ height: Spacing.two }} />
        {children}
        <View style={{ height: 220 }} />
      </ScrollView>
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

/**
 * A drawn copy of the iOS shield screen, so the promise "your reason on the
 * wall" is something the person can see before they grant anything. Flat
 * colours, the real copy, their real first reason.
 */
function ShieldMock({ reason }: { reason: string | null }) {
  return (
    <Card style={s.mock}>
      <View style={s.mockIcon}>
        <SymbolChip name="shield.fill" tint={hues.urge.solid} wash={hues.urge.wash} />
      </View>
      <Text style={s.mockTitle}>{SHIELD_COPY.title}</Text>
      <Text style={s.mockReason} numberOfLines={2}>
        {reason ?? SHIELD_COPY.fallback}
      </Text>
      <View style={s.mockPrimary}>
        <Text style={s.mockPrimaryLabel}>{SHIELD_COPY.primary}</Text>
      </View>
      <Text style={s.mockSecondary}>{SHIELD_COPY.secondary}</Text>
    </Card>
  );
}

function Sep() {
  return <View style={s.sep} />;
}

function InfoRow({ icon, hue, label, sub }: { icon: SFSymbol; hue: keyof typeof hues; label: string; sub: string }) {
  return (
    <View style={s.row}>
      <SymbolChip name={icon} tint={hues[hue].solid} wash={hues[hue].wash} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
    </View>
  );
}

function OptionRow({ icon, label, sub, selected, onPress }: { icon: SFSymbol; label: string; sub: string; selected: boolean; onPress: () => void }) {
  return (
    <Tap haptic="selection" onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <View style={s.row}>
        <SymbolChip name={icon} tint={selected ? palette.accent : palette.textDim} wash={selected ? palette.accentWash : palette.surface3} />
        <View style={{ flex: 1 }}>
          <Text style={s.rowLabel}>{label}</Text>
          <Text style={s.rowSub}>{sub}</Text>
        </View>
        <View style={[s.radio, selected && s.radioOn]}>{selected ? <View style={s.radioDot} /> : null}</View>
      </View>
    </Tap>
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

function summarise(setup: ShieldSetup | null | undefined): string | null {
  if (!setup) return null;
  const parts = [
    setup.categories ? `${setup.categories} ${setup.categories === 1 ? 'category' : 'categories'}` : null,
    setup.apps ? `${setup.apps} ${setup.apps === 1 ? 'app' : 'apps'}` : null,
    setup.sites ? `${setup.sites} ${setup.sites === 1 ? 'site' : 'sites'}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { padding: Spacing.four, gap: Spacing.two },
  section: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, letterSpacing: 0.3, marginTop: Spacing.four },
  card: { padding: 0, overflow: 'hidden' },
  hero: { marginTop: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  heroLabel: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, letterSpacing: 0.3 },
  heroValue: { color: palette.text, fontSize: 22, lineHeight: 27, letterSpacing: -0.4, fontFamily: type.display, fontVariant: ['tabular-nums'] },
  heroLink: { minHeight: 44, justifyContent: 'center' },
  link: { color: palette.accent, fontSize: 15, fontFamily: type.bodySemi },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: 14, minHeight: 60 },
  sep: { height: 1, backgroundColor: palette.line, marginLeft: 54 },
  rowLabel: { color: palette.text, fontSize: 15, lineHeight: 20, fontFamily: type.bodySemi },
  rowSub: { color: palette.textDim, fontSize: 13, lineHeight: 18, fontFamily: type.body, marginTop: 2 },
  chev: { color: palette.textFaint, fontSize: 20, fontFamily: type.body },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: palette.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.accent },
  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: palette.accentWash, borderRadius: 16, padding: Spacing.three, marginBottom: Spacing.two },
  pickedText: { flex: 1, color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  durations: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  durBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: palette.surface2, borderWidth: 1, borderColor: palette.line },
  durBtnOn: { backgroundColor: palette.accentWash, borderColor: palette.accent },
  durLabel: { color: palette.textDim, fontSize: 15, fontFamily: type.bodyMed },
  durLabelOn: { color: palette.accent, fontFamily: type.bodySemi },
  mock: { alignItems: 'center', padding: Spacing.four, gap: Spacing.two, backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.line },
  mockIcon: { marginBottom: Spacing.one },
  mockTitle: { color: palette.text, fontSize: 17, lineHeight: 22, fontFamily: type.bodySemi, textAlign: 'center' },
  mockReason: { color: palette.textDim, fontSize: 14, lineHeight: 19, fontFamily: type.body, textAlign: 'center', fontStyle: 'italic' },
  mockPrimary: { marginTop: Spacing.one, alignSelf: 'stretch', height: 44, borderRadius: 12, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  mockPrimaryLabel: { color: palette.accentInk, fontSize: 15, fontFamily: type.bodySemi },
  mockSecondary: { color: palette.textDim, fontSize: 14, fontFamily: type.bodyMed },
  fine: { color: palette.textFaint, fontSize: 12, lineHeight: 17, fontFamily: type.body, marginTop: Spacing.two },
  fineIn: { color: palette.textFaint, fontSize: 12, lineHeight: 17, fontFamily: type.body, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: Spacing.four, paddingBottom: 100, backgroundColor: palette.bg },
  footerStack: { gap: Spacing.one },
  ghostRow: { flexDirection: 'row', gap: Spacing.two },
  footerSheet: { paddingBottom: Spacing.four },
  miniBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: palette.surface3 },
  miniLabel: { color: palette.text, fontSize: 20, fontFamily: type.bodyMed },
  value: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'], minWidth: 64, textAlign: 'center' },
});
