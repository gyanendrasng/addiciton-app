import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/app-logo';
import { GoogleMark } from '@/components/ui/brand-marks';
import { Notice } from '@/components/ui/notice';
import { SymbolChip } from '@/components/ui/symbol-chip';
import { Tap } from '@/components/ui/tap';
import {
  availableProviders,
  isAppleAvailable,
  sendEmailCode,
  signInWith,
  verifyEmailCode,
  type Provider,
} from '@/features/account/sign-in';
import { useSession } from '@/lib/session';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

type Pane = 'providers' | 'email' | 'code';

/** What signing in actually buys you. Concrete, not marketing. */
const POINTS = [
  {
    symbol: 'iphone.and.arrow.forward' as const,
    hue: hues.checkin,
    label: 'Premium on a new phone',
    sub: 'Restore in one tap instead of paying twice.',
  },
  {
    symbol: 'lock.fill' as const,
    hue: hues.pledge,
    label: 'Your recovery stays here',
    sub: 'Streaks, slips and notes are never uploaded.',
  },
  {
    symbol: 'envelope.fill' as const,
    hue: hues.reasons,
    label: 'iPhone or Android',
    sub: 'An email code works on both.',
  },
];

export default function SignInScreen() {
  const router = useRouter();
  const { refresh: refreshSession } = useSession();
  const [pane, setPane] = useState<Pane>('providers');
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleOk, setAppleOk] = useState(Platform.OS === 'ios');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    isAppleAvailable().then(setAppleOk);
  }, []);

  const showApple = appleOk && availableProviders().includes('apple');

  /**
   * The session store does not notify on Expo (better-auth #10545), so pull the
   * session ourselves before leaving — otherwise Settings still says
   * "Not signed in".
   */
  const finish = async () => {
    await refreshSession();
    leave();
  };

  /** This screen can be reached by deep link, so there may be no history. */
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const go = async (provider: 'apple' | 'google') => {
    if (busy) return;
    setError(null);
    setBusy(provider);
    const result = await signInWith(provider);
    setBusy(null);
    if (result.ok) return void finish();
    if (!result.cancelled) setError(result.message);
  };

  const requestCode = async () => {
    if (busy) return;
    Keyboard.dismiss();
    setError(null);
    setBusy('email');
    const result = await sendEmailCode(email);
    setBusy(null);
    if (result.ok) {
      setCode('');
      setPane('code');
    } else if (!result.cancelled) setError(result.message);
  };

  const submitCode = async () => {
    if (busy || code.length !== 6) return;
    Keyboard.dismiss();
    setError(null);
    setBusy('email');
    const result = await verifyEmailCode(email, code);
    setBusy(null);
    if (result.ok) return void finish();
    if (!result.cancelled) setError(result.message);
  };

  const back = () => {
    setError(null);
    Keyboard.dismiss();
    if (pane === 'code') setPane('email');
    else if (pane === 'email') setPane('providers');
    else leave();
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.bar}>
        <Tap
          haptic="none"
          onPress={back}
          accessibilityRole="button"
          accessibilityLabel={pane === 'providers' ? 'Close' : 'Back'}
          style={s.close}>
          {Platform.OS === 'ios' ? (
            <SymbolView
              name={pane === 'providers' ? 'xmark' : 'chevron.left'}
              size={17}
              tintColor={palette.textDim}
              weight="semibold"
              style={s.closeIcon}
            />
          ) : (
            <Text style={s.closeGlyph}>{pane === 'providers' ? '✕' : '‹'}</Text>
          )}
        </Tap>
      </View>

      <KeyboardAvoidingView
        style={s.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {pane === 'providers' ? (
          <Animated.View entering={FadeIn.duration(320)} style={s.fill}>
            <View style={s.top}>
              <AppLogo size={56} />
              <Text style={s.h1}>Keep your premium{'\n'}on every device.</Text>
              <Text style={s.sub}>One account, used for one thing: proving you’ve paid.</Text>
            </View>

            <View style={s.middle}>
              <View style={s.points}>
                {POINTS.map((p) => (
                  <View key={p.label} style={s.point}>
                    <SymbolChip name={p.symbol} tint={p.hue.solid} wash={p.hue.wash} size={32} />
                    <View style={s.pointText}>
                      <Text style={s.pointLabel}>{p.label}</Text>
                      <Text style={s.pointSub}>{p.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.actions}>
              {error ? <Notice>{error}</Notice> : null}

              {/* Apple's own control, not a copy of it: their HIG requires the
                  real button wherever Sign in with Apple is offered. */}
              {showApple ? (
                busy === 'apple' ? (
                  <View style={[s.btn, s.appleBusy]}>
                    <ActivityIndicator color={palette.bg} />
                  </View>
                ) : (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                    cornerRadius={16}
                    style={s.btn}
                    onPress={() => go('apple')}
                  />
                )
              ) : null}

              <Tap
                haptic="light"
                onPress={() => go('google')}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                style={[s.btn, s.google, busy !== null && s.dim]}>
                {busy === 'google' ? (
                  <ActivityIndicator color={palette.text} />
                ) : (
                  <View style={s.btnInner}>
                    <GoogleMark size={19} />
                    <Text style={s.googleLabel}>Continue with Google</Text>
                  </View>
                )}
              </Tap>

              <Tap
                haptic="none"
                onPress={() => {
                  setError(null);
                  setPane('email');
                }}
                accessibilityRole="button"
                style={s.ghost}>
                <Text style={s.ghostLabel}>Use an email code instead</Text>
              </Tap>

              <Text style={s.legal}>
                We store your email address and whether your subscription is active. Nothing else.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(240)} style={s.fill}>
            <View style={s.top}>
              <Text style={s.h1}>
                {pane === 'email' ? 'What’s your email?' : 'Enter your code.'}
              </Text>
              <Text style={s.sub}>
                {pane === 'email'
                  ? 'We’ll send a six-digit code. No password to remember.'
                  : `Sent to ${email}. It expires in five minutes.`}
              </Text>
            </View>

            <View style={s.form}>
              {pane === 'email' ? (
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={palette.textFaint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="go"
                  onSubmitEditing={requestCode}
                />
              ) : (
                <TextInput
                  style={[s.input, s.codeInput]}
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="——————"
                  placeholderTextColor={palette.textFaint}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  autoFocus
                  maxLength={6}
                  returnKeyType="go"
                  onSubmitEditing={submitCode}
                />
              )}
              {error ? <Notice>{error}</Notice> : null}
            </View>

            <View style={s.spacer} />

            <View style={s.actions}>
              <Tap
                haptic="light"
                onPress={pane === 'email' ? requestCode : submitCode}
                accessibilityRole="button"
                style={[
                  s.btn,
                  s.primary,
                  (busy !== null || (pane === 'code' && code.length !== 6)) && s.dim,
                ]}>
                {busy === 'email' ? (
                  <ActivityIndicator color={palette.accentInk} />
                ) : (
                  <Text style={s.primaryLabel}>{pane === 'email' ? 'Send code' : 'Sign in'}</Text>
                )}
              </Tap>

              {pane === 'code' ? (
                <Tap haptic="none" onPress={requestCode} style={s.ghost}>
                  <Text style={s.ghostLabel}>Send a new code</Text>
                </Tap>
              ) : null}
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  fill: { flex: 1 },
  bar: { height: 44, justifyContent: 'center', paddingHorizontal: Spacing.two },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { width: 17, height: 17 },
  closeGlyph: { color: palette.textDim, fontSize: 22, fontFamily: type.bodyMed },

  top: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  h1: {
    color: palette.text,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.7,
    fontFamily: type.display,
  },
  sub: { color: palette.textDim, fontSize: 15, lineHeight: 22, fontFamily: type.body },

  middle: { flex: 1, justifyContent: 'center' },
  points: { paddingHorizontal: Spacing.four, gap: Spacing.four },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two + 2 },
  pointText: { flex: 1, gap: 2 },
  pointLabel: { color: palette.text, fontSize: 15, fontFamily: type.bodySemi },
  pointSub: { color: palette.textDim, fontSize: 13, lineHeight: 18, fontFamily: type.body },

  spacer: { flex: 1, minHeight: Spacing.four },

  form: { paddingHorizontal: Spacing.four, marginTop: Spacing.five, gap: Spacing.two },
  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: palette.surface2,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: Spacing.three,
    color: palette.text,
    fontSize: 17,
    fontFamily: type.bodyMed,
  },
  codeInput: { textAlign: 'center', fontSize: 26, letterSpacing: 10, fontFamily: type.bodySemi },

  actions: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two, gap: Spacing.two },
  btn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appleBusy: { backgroundColor: palette.bright },
  google: { backgroundColor: palette.surface2, borderWidth: 1, borderColor: palette.line },
  googleLabel: { color: palette.text, fontSize: 16, fontFamily: type.bodySemi },
  primary: { backgroundColor: palette.accent },
  primaryLabel: { color: palette.accentInk, fontSize: 16, fontFamily: type.bodySemi },
  dim: { opacity: 0.4 },
  ghost: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  ghostLabel: { color: palette.textDim, fontSize: 15, fontFamily: type.bodyMed },
  legal: {
    color: palette.textFaint,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: type.body,
    textAlign: 'center',
    marginTop: 4,
  },
});
