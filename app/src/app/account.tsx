import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SymbolChip } from '@/components/ui/symbol-chip';
import { Tap } from '@/components/ui/tap';
import { useAccount } from '@/features/account/use-account';
import { signOutEverywhere } from '@/features/account/sign-in';
import { Cta, Eyebrow, Subtitle, Title } from '@/features/onboarding/components/chrome';
import { Notice } from '@/components/ui/notice';
import { authClient } from '@/lib/auth-client';
import { humanError } from '@/lib/errors';
import { track } from '@/lib/analytics';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

type SessionRow = { id: string; createdAt?: Date; userAgent?: string | null };

export default function AccountScreen() {
  const router = useRouter();
  const { user, signedIn, loading, entitlement, premium, checking, refresh, refreshSession } =
    useAccount();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  /** null = not editing; a string = the draft being typed. */
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await authClient.listSessions();
      setSessions(data ?? []);
    } catch {
      setSessions([]);
    }
  }, []);


  useEffect(() => {
    if (!signedIn) return;
    let alive = true;
    void (async () => {
      const { data } = await authClient.listSessions().catch(() => ({ data: [] as SessionRow[] }));
      if (alive) setSessions((data as SessionRow[]) ?? []);
    })();
    return () => {
      alive = false;
    };
  }, [signedIn]);

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={s.center}>
          <ActivityIndicator color={palette.accent} />
        </View>
      </Screen>
    );
  }

  if (!signedIn) {
    return (
      <Screen>
        <Eyebrow>Account</Eyebrow>
        <Title>Not signed in.</Title>
        <Subtitle>
          Sign in to carry your premium subscription to a new phone. Your recovery data stays on
          this device regardless.
        </Subtitle>
        <View style={{ height: Spacing.four }} />
        <Cta label="Sign in" onPress={() => router.push('/sign-in')} />
      </Screen>
    );
  }

  const doSignOut = async () => {
    setBusy(true);
    await signOutEverywhere();
    // The reactive session store doesn't notify on Expo (#10545) — pull it.
    await refreshSession();
    setBusy(false);
    // Premium went with the session, so the gate will show the wall again.
    router.replace('/');
  };

  const revokeOthers = async () => {
    setBusy(true);
    try {
      await authClient.revokeOtherSessions();
      await loadSessions();
      if (Platform.OS !== 'web') Alert.alert('Done', 'Signed out on your other devices.');
    } catch {
      Alert.alert('Something went wrong', 'Please try again.');
    }
    setBusy(false);
  };

  const deleteAccount = () => {
    const run = async () => {
      setBusy(true);
      try {
        await authClient.deleteUser();
        track('account_deleted');
        await refreshSession();
        router.replace('/');
      } catch {
        Alert.alert('Could not delete account', 'Please try again or email support@joincurb.app.');
      }
      setBusy(false);
    };
    if (Platform.OS === 'web') return void run();
    Alert.alert(
      'Delete your account?',
      'This removes your email and subscription record from our servers. It does not cancel billing — cancel that in your ' +
        (Platform.OS === 'ios' ? 'Apple' : 'Google') +
        ' account settings. Your on-device data is untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Are you sure?', 'This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: run },
            ]),
        },
      ],
    );
  };

  const saveName = async () => {
    const next = (nameDraft ?? '').trim();
    if (!next) {
      setNameError('Give yourself a name, or leave it as it was.');
      return;
    }
    setBusy(true);
    setNameError(null);
    try {
      await authClient.updateUser({ name: next });
      await refreshSession();
      setNameDraft(null);
    } catch (e) {
      setNameError(humanError(e, 'generic'));
    }
    setBusy(false);
  };

  const expiry = entitlement.expiresAt
    ? new Date(entitlement.expiresAt).toLocaleDateString()
    : null;

  return (
    <Screen>
      <Eyebrow>Account</Eyebrow>
      <Title>{user?.email ?? 'Signed in'}</Title>
      <Subtitle>
        Only your email and subscription status live on our servers — never your streaks, slips or
        notes.
      </Subtitle>

      <Text style={s.section}>Profile</Text>
      <Card style={s.card}>
        {nameDraft === null ? (
          <Tap haptic="light" onPress={() => setNameDraft(user?.name ?? '')}>
            <View style={s.row}>
              <SymbolChip
                name="person.text.rectangle"
                tint={hues.checkin.solid}
                wash={hues.checkin.wash}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{user?.name?.trim() || 'Add your name'}</Text>
                <Text style={s.rowSub}>
                  {user?.name?.trim() ? 'Tap to change it.' : 'Only you ever see it.'}
                </Text>
              </View>
              <Text style={s.chev}>›</Text>
            </View>
          </Tap>
        ) : (
          <View style={s.editRow}>
            <TextInput
              style={s.input}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Your name"
              placeholderTextColor={palette.textFaint}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            {nameError ? <Notice>{nameError}</Notice> : null}
            <View style={s.editActions}>
              <Tap
                haptic="none"
                onPress={() => {
                  setNameDraft(null);
                  setNameError(null);
                }}
                style={s.ghostBtn}>
                <Text style={s.ghostLabel}>Cancel</Text>
              </Tap>
              <Tap haptic="light" onPress={busy ? undefined : saveName} style={s.saveBtn}>
                {busy ? (
                  <ActivityIndicator color={palette.accentInk} />
                ) : (
                  <Text style={s.saveLabel}>Save</Text>
                )}
              </Tap>
            </View>
          </View>
        )}
      </Card>

      <Text style={s.section}>Subscription</Text>
      <Card style={s.card}>
        <View style={s.row}>
          {/* Champagne, not the accent green — subscription surfaces are the
              one place this app is allowed to look expensive. */}
          <SymbolChip
            name={premium ? 'checkmark.seal.fill' : 'seal'}
            tint={premium ? hues.premium.solid : palette.textFaint}
            wash={premium ? hues.premium.wash : palette.surface3}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.rowLabel}>{premium ? 'Premium active' : 'No active subscription'}</Text>
            <Text style={s.rowSub}>
              {premium
                ? entitlement.isLifetime
                  ? 'Lifetime access'
                  : expiry
                    ? entitlement.willRenew
                      ? `Renews ${expiry}`
                      : `Access until ${expiry}`
                    : 'Active'
                : 'Subscribe to unlock everything.'}
            </Text>
          </View>
          {checking ? <ActivityIndicator color={palette.textFaint} /> : null}
        </View>
        <View style={s.sep} />
        <Tap haptic="light" onPress={refresh}>
          <View style={s.row}>
            <SymbolChip name="arrow.clockwise" tint={hues.checkin.solid} wash={hues.checkin.wash} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Refresh subscription</Text>
              <Text style={s.rowSub}>Check again if premium isn’t showing up.</Text>
            </View>
          </View>
        </Tap>
      </Card>

      <Text style={s.section}>Devices</Text>
      <Card style={s.card}>
        <View style={s.row}>
          <SymbolChip name="iphone" tint={hues.progress.solid} wash={hues.progress.wash} />
          <View style={{ flex: 1 }}>
            <Text style={s.rowLabel}>
              {sessions === null
                ? 'Loading…'
                : `${sessions.length} active ${sessions.length === 1 ? 'session' : 'sessions'}`}
            </Text>
            <Text style={s.rowSub}>Including this one.</Text>
          </View>
        </View>
        {sessions && sessions.length > 1 ? (
          <>
            <View style={s.sep} />
            <Tap haptic="light" onPress={busy ? undefined : revokeOthers}>
              <View style={s.row}>
                <SymbolChip
                  name="rectangle.portrait.and.arrow.right"
                  tint={palette.amber}
                  wash={palette.amberWash}
                />
                <View style={{ flex: 1 }}>
                  <Text style={s.rowLabel}>Sign out other devices</Text>
                  <Text style={s.rowSub}>Keeps you signed in here.</Text>
                </View>
              </View>
            </Tap>
          </>
        ) : null}
      </Card>

      <Text style={s.section}>Danger zone</Text>
      <Card style={s.card}>
        <Tap haptic="light" onPress={busy ? undefined : doSignOut}>
          <View style={s.row}>
            <SymbolChip name="arrow.backward.circle" tint={palette.text} wash={palette.surface3} />
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Sign out</Text>
              <Text style={s.rowSub}>Your on-device data stays put.</Text>
            </View>
          </View>
        </Tap>
        <View style={s.sep} />
        <Tap haptic="light" onPress={busy ? undefined : deleteAccount}>
          <View style={s.row}>
            <SymbolChip name="trash.fill" tint={palette.danger} wash="rgba(240,100,90,0.16)" />
            <View style={{ flex: 1 }}>
              <Text style={[s.rowLabel, { color: palette.danger }]}>Delete account</Text>
              <Text style={s.rowSub}>Removes your email and subscription record.</Text>
            </View>
          </View>
        </Tap>
      </Card>

      <Text style={s.foot}>
        Deleting your account does not cancel billing, and does not erase your on-device history —
        use Settings → Delete everything for that.
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 0, marginTop: Spacing.two, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  sep: { height: 1, backgroundColor: palette.line, marginLeft: 54 },
  rowLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  rowSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body, marginTop: 2 },
  section: {
    color: palette.textDim,
    fontSize: 13,
    fontFamily: type.bodySemi,
    letterSpacing: 0.3,
    marginTop: Spacing.four,
  },
  chev: { color: palette.textFaint, fontSize: 22, fontFamily: type.body },
  editRow: { padding: Spacing.three, gap: Spacing.two },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: palette.surface2,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: Spacing.three,
    color: palette.text,
    fontSize: 16,
    fontFamily: type.bodyMed,
  },
  editActions: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },
  ghostBtn: { height: 44, justifyContent: 'center', paddingHorizontal: Spacing.three },
  ghostLabel: { color: palette.textDim, fontSize: 15, fontFamily: type.bodyMed },
  saveBtn: {
    height: 44,
    minWidth: 92,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: { color: palette.accentInk, fontSize: 15, fontFamily: type.bodySemi },
  foot: {
    color: palette.textFaint,
    fontSize: 13,
    fontFamily: type.body,
    marginTop: Spacing.four,
    lineHeight: 19,
  },
});
