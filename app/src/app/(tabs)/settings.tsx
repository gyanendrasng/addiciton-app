import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { SymbolChip } from '@/components/ui/symbol-chip';
import type { SFSymbol } from 'expo-symbols';
import { Tap } from '@/components/ui/tap';
import { getDb } from '@/db/client';
import { setHabits, setPremium, useProfile } from '@/db/repo/profile';
import { setSetting, useSetting } from '@/db/repo/settings';
import {
  cancelDailyReminders,
  listScheduled,
  requestReminderPermission,
  scheduleDailyReminders,
} from '@/features/notifications';
import { wipeEverything } from '@/features/onboarding/complete';
import { habits as ALL_HABITS } from '@/features/onboarding/content';
import { Eyebrow, Title } from '@/features/onboarding/components/chrome';
import { clearToday, DEV_SKIP_AUTH_KEY, seedDemo, travel } from '@/features/settings/dev';
import { TABLES } from '@/db/schema';
import { getTimeOffset } from '@/lib/clock';
import { activeScheme, hues, palette, themePref, type ThemePref } from '@/theme/palette';
import { isExpoGo, setThemePref } from '@/theme/theme';
import { useAccount } from '@/features/account/use-account';
import { signOutEverywhere } from '@/features/account/sign-in';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { signedIn, user, refreshSession } = useAccount();
  const remindersOn = useSetting<boolean>('reminders.enabled', false);
  const morning = useSetting<number>('reminders.morning', 8);
  const evening = useSetting<number>('reminders.evening', 21);
  const [busy, setBusy] = useState(false);
  if (!profile) return <SafeAreaView style={s.root} />;

  const toggleHabit = async (id: string) => {
    const next = profile.habits.includes(id) ? profile.habits.filter((h) => h !== id) : [...profile.habits, id];
    if (next.length === 0) return;
    await setHabits(next);
  };

  const applyReminders = async (on: boolean, m = morning.value, e = evening.value) => {
    if (on) {
      const perm = await requestReminderPermission();
      if (perm !== 'granted') {
        Alert.alert('Reminders are off', 'Allow notifications in Settings to turn them on.');
        await setSetting('reminders.enabled', false);
        return;
      }
      await scheduleDailyReminders(m, e);
    } else {
      await cancelDailyReminders();
    }
    await setSetting('reminders.enabled', on);
  };

  const confirmSignOut = () => {
    const run = async () => {
      setBusy(true);
      await signOutEverywhere();
      await refreshSession();
      setBusy(false);
      router.replace('/');
    };
    if (busy) return;
    if (Platform.OS === 'web') return void run();
    Alert.alert(
      'Sign out?',
      'Your subscription lives on your account, so you’ll need to sign back in to use Curb. Your streaks, slips and notes stay on this phone either way.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: run },
      ],
    );
  };

  const setHour = async (key: 'reminders.morning' | 'reminders.evening', delta: number) => {
    const cur = key === 'reminders.morning' ? morning.value : evening.value;
    const next = (cur + delta + 24) % 24;
    await setSetting(key, next);
    if (remindersOn.value) await scheduleDailyReminders(key === 'reminders.morning' ? next : morning.value, key === 'reminders.evening' ? next : evening.value);
  };

  const exportData = async () => {
    setBusy(true);
    try {
      const db = await getDb();
      const dump: Record<string, unknown> = { exportedAt: new Date().toISOString() };
      for (const t of TABLES) dump[t] = await db.getAllAsync(`SELECT * FROM ${t}`);
      const json = JSON.stringify(dump, null, 2);
      if (Platform.OS === 'web') {
        Alert.alert('Export', `${json.length} bytes ready (sharing is native-only).`);
        return;
      }
      const uri = `${FileSystem.cacheDirectory}addiction-export.json`;
      await FileSystem.writeAsStringAsync(uri, json);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json' });
    } finally {
      setBusy(false);
    }
  };

  const deleteEverything = () => {
    const doIt = async () => {
      await wipeEverything();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') return void doIt();
    Alert.alert('Delete everything?', 'Streak, history, reasons — all of it, permanently.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Really delete?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete everything', style: 'destructive', onPress: doIt }]) },
    ]);
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Eyebrow>Settings</Eyebrow>
        <Title>Yours to tune.</Title>

        <Section label="Account">
          <Row
            icon={signedIn ? 'person.crop.circle.fill' : 'person.crop.circle'}
            iconTint={signedIn ? palette.accent : palette.textFaint}
            iconWash={signedIn ? palette.accentWash : palette.surface3}
            /* The gate means a signed-out user can't reach Settings in a
               shipping build — that state is only possible behind the dev
               skip, so "Sign in" is a development affordance, not a feature. */
            label={signedIn ? 'Manage account' : 'Sign in (dev)'}
            sub={
              signedIn
                ? (user?.email ?? 'Your name, devices and subscription')
                : 'Only reachable because the dev skip is on.'
            }
            onPress={() => router.push(signedIn ? '/account' : '/sign-in')}
            chevron
          />
          {/* Sign out is one tap from here, not buried on the account screen —
              it's the thing people look for in Settings. */}
          {signedIn ? (
            <Row
              icon="rectangle.portrait.and.arrow.right"
              iconTint={palette.text}
              iconWash={palette.surface3}
              label="Sign out"
              sub="Premium goes with your account. Your on-device history stays."
              onPress={confirmSignOut}
            />
          ) : null}
          {__DEV__ ? (
            <Row
              icon="hammer.fill"
              iconTint={palette.amber}
              iconWash={palette.amberWash}
              label="Reset the wall (dev)"
              sub="Drops the dev skip and the local premium flag, so the gate runs again."
              onPress={async () => {
                // Both, not just the skip: the gate checks premium first, so
                // clearing only the skip would leave the app open.
                await setSetting(DEV_SKIP_AUTH_KEY, false);
                await setPremium(false);
                router.replace('/');
              }}
            />
          ) : null}
        </Section>

        <Section label="Appearance">
          <ThemeRow />
        </Section>

        <Section label="What you’re quitting">
          <View style={s.chips}>
            {ALL_HABITS.map((h) => {
              const on = profile.habits.includes(h.id);
              return (
                <Tap key={h.id} onPress={() => toggleHabit(h.id)} style={[s.chip, on && s.chipOn]}>
                  <Text style={[s.chipLabel, on && s.chipLabelOn]}>{h.label}</Text>
                </Tap>
              );
            })}
          </View>
        </Section>

        <Section label="Your quiz">
          <Row
            icon="list.bullet.rectangle"
            iconTint={hues.checkin.solid}
            iconWash={hues.checkin.wash}
            label="Your answers"
            sub="Change what you said during onboarding."
            onPress={() => router.push('/answers')}
            chevron
          />
        </Section>

        <Section label="Reminders">
          <Row icon="bell.fill" iconTint={palette.amber} iconWash={palette.amberWash} label="Daily reminders" sub="Morning pledge and evening check-in. Nothing else.">
            <Switch value={remindersOn.value} onValueChange={applyReminders} trackColor={{ true: palette.accentDeep, false: palette.surface3 }} thumbColor={palette.text} />
          </Row>
          <Stepper label="Morning pledge" value={morning.value} onChange={(d) => setHour('reminders.morning', d)} disabled={!remindersOn.value} />
          <Stepper label="Evening check-in" value={evening.value} onChange={(d) => setHour('reminders.evening', d)} disabled={!remindersOn.value} />
        </Section>

        <Section label="Motivation">
          <Row icon="heart.fill" iconTint={hues.reasons.solid} iconWash={hues.reasons.wash} label="Your reasons" sub="Shown when an urge hits." onPress={() => router.push('/reasons')} chevron />
        </Section>

        <Section label="Your data">
          <Row icon="square.and.arrow.up" iconTint={hues.checkin.solid} iconWash={hues.checkin.wash} label="Export everything" sub="A JSON file of all your data." onPress={busy ? undefined : exportData} chevron />
          <Row icon="trash.fill" iconTint={palette.danger} iconWash="rgba(240, 100, 90, 0.16)" label="Delete everything" sub="Permanent. Starts you over." onPress={deleteEverything} danger />
        </Section>

        {__DEV__ && (
          <Section label="Developer">
            <Row label="Time travel" sub={`offset ${Math.round(getTimeOffset() / 86_400_000)} d`}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 7, 30].map((d) => (
                  <Tap key={d} onPress={() => travel(d)} style={s.miniBtn}><Text style={s.miniLabel}>+{d}d</Text></Tap>
                ))}
                <Tap onPress={() => travel(0)} style={s.miniBtn}><Text style={s.miniLabel}>reset</Text></Tap>
              </View>
            </Row>
            <Row label="Clear today" sub="Remove today’s pledge and check-in." onPress={clearToday} chevron />
            <Row label="Seed demo data" sub="12 days of history with one slip." onPress={seedDemo} chevron />
            <Row label="Fire milestone" sub="Open the 7-day celebration." onPress={() => router.push({ pathname: '/milestone', params: { tier: '7', period: '0' } })} chevron />
            <Row
              label="Scheduled notifications"
              sub="Count what is queued."
              onPress={async () => Alert.alert('Scheduled', String((await listScheduled()).map((n) => n.identifier).join('\n') || 'none'))}
              chevron
            />
            <Row label="Reset onboarding" sub="Wipe and start the quiz again." onPress={deleteEverything} danger />
          </Section>
        )}
        <View style={{ height: 96 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeRow() {
  const { value } = useSetting<ThemePref>('theme', 'system');
  const opts: { id: ThemePref; label: string }[] = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];
  /**
   * The palette resolves once at launch, so a change can't take effect until
   * the next open. Saying that unconditionally is misleading, though — most of
   * the time the selection already IS what you're looking at. Only say it when
   * the choice and the running theme actually differ.
   */
  const pending = value !== themePref;
  const sub = !isExpoGo
    ? 'Switches instantly.'
    : pending
      ? 'Applies next time you open Curb.'
      : `Using ${activeScheme === 'light' ? 'light' : 'dark'}.`;
  return (
    <View style={s.row}>
      <SymbolChip name="circle.lefthalf.filled" tint={hues.progress.solid} wash={hues.progress.wash} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>Theme</Text>
        <Text style={[s.rowSub, pending && { color: palette.amber }]}>{sub}</Text>
      </View>
      <View style={s.segment}>
        {opts.map((o) => {
          const on = value === o.id;
          return (
            <Tap key={o.id} haptic="selection" onPress={() => !on && setThemePref(o.id)} style={[s.segBtn, on && s.segBtnOn]}>
              <Text style={[s.segLabel, on && s.segLabelOn]}>{o.label}</Text>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const kids = React.Children.toArray(children);
  return (
    <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
      <Text style={s.sectionLabel}>{label}</Text>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {kids.map((k, i) => (
          <View key={i}>
            {k}
            {i < kids.length - 1 && <View style={s.sep} />}
          </View>
        ))}
      </Card>
    </View>
  );
}

function Row({ label, sub, onPress, chevron, danger, icon, iconTint, iconWash, children }: { label: string; sub?: string; onPress?: () => void; chevron?: boolean; danger?: boolean; icon?: SFSymbol; iconTint?: string; iconWash?: string; children?: React.ReactNode }) {
  const inner = (
    <View style={s.row}>
      {icon ? <SymbolChip name={icon} tint={iconTint ?? palette.text} wash={iconWash ?? palette.surface3} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: palette.danger }]}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {children}
      {chevron ? <Text style={s.chev}>›</Text> : null}
    </View>
  );
  return onPress ? <Tap haptic="light" onPress={onPress}>{inner}</Tap> : inner;
}

function Stepper({ label, value, onChange, disabled }: { label: string; value: number; onChange: (delta: number) => void; disabled?: boolean }) {
  const h = value % 12 === 0 ? 12 : value % 12;
  const ampm = value < 12 ? 'am' : 'pm';
  return (
    <View style={[s.row, disabled && { opacity: 0.4 }]}>
      <Text style={[s.rowLabel, { flex: 1 }]}>{label}</Text>
      <Tap haptic="selection" onPress={() => !disabled && onChange(-1)} style={s.miniBtn}><Text style={s.miniLabel}>−</Text></Tap>
      <Text style={s.time}>{h}:00 {ampm}</Text>
      <Tap haptic="selection" onPress={() => !disabled && onChange(1)} style={s.miniBtn}><Text style={s.miniLabel}>+</Text></Tap>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  content: { padding: Spacing.four, gap: Spacing.three },
  sectionLabel: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, letterSpacing: 0.3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, padding: Spacing.three },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: palette.surface2, borderWidth: 1.5, borderColor: palette.surface2 },
  chipOn: { backgroundColor: palette.accentWash, borderColor: palette.accent },
  chipLabel: { color: palette.text, fontSize: 14, fontFamily: type.bodyMed },
  chipLabelOn: { color: palette.accent, fontFamily: type.bodySemi },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: 14 },
  sep: { height: 1, backgroundColor: palette.line, marginLeft: 54 },
  segment: { flexDirection: 'row', backgroundColor: palette.surface3, borderRadius: 10, padding: 2 },
  segBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  segBtnOn: { backgroundColor: palette.surface },
  segLabel: { color: palette.textDim, fontSize: 13, fontFamily: type.bodyMed },
  segLabelOn: { color: palette.text, fontFamily: type.bodySemi },
  rowLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  rowSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body, marginTop: 2 },
  chev: { color: palette.textFaint, fontSize: 22 },
  miniBtn: { minWidth: 40, height: 34, paddingHorizontal: 10, borderRadius: 10, backgroundColor: palette.surface3, alignItems: 'center', justifyContent: 'center' },
  miniLabel: { color: palette.text, fontSize: 14, fontFamily: type.bodySemi },
  time: { color: palette.text, fontSize: 14, fontFamily: type.bodySemi, fontVariant: ['tabular-nums'], minWidth: 72, textAlign: 'center' },
});
