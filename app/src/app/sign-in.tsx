import * as AppleAuthentication from 'expo-apple-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
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
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppleMark, GoogleMark } from '@/components/ui/brand-marks';
import { Notice } from '@/components/ui/notice';
import { Tap } from '@/components/ui/tap';
import {
  availableProviders,
  isAppleAvailable,
  sendEmailCode,
  signInWith,
  verifyEmailCode,
  type Provider,
} from '@/features/account/sign-in';
import { skipAuthForDev } from '@/features/settings/dev';
import { useSession } from '@/lib/session';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

type Pane = 'providers' | 'email' | 'code';

/**
 * Sign in / create an account.
 *
 * Kept deliberately short. In the required flow this lands straight after a
 * dozen onboarding questions, so it is not the place for a second pitch — one
 * heading, one line, three buttons. The reasons to have an account were made
 * already; here the user just wants through.
 */
export default function SignInScreen() {
  const router = useRouter();
  /**
   * `required=1` means the tabs gate sent the user here: an account is a step
   * on the way in, not an option, so there is no close button and no "not now".
   * Opened from Settings instead, it's an ordinary dismissible modal.
   */
  const { required } = useLocalSearchParams<{ required?: string }>();
  const mustSignIn = required === '1';

  const { refresh: refreshSession } = useSession();
  const [pane, setPane] = useState<Pane>('providers');
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleReady, setAppleReady] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    isAppleAvailable().then(setAppleReady);
  }, []);

  const onApplePlatform = availableProviders().includes('apple');
  /**
   * Sign in with Apple runs on every real iPhone we support, but NOT on the
   * Simulator — `isAvailableAsync()` reports false there and `signInAsync`
   * always throws (Expo's docs say so outright). Hiding the button in that case
   * made the screen look like Apple sign-in was missing, so in development we
   * draw our own and let the tap fail with a readable message. Shipping builds
   * always get Apple's real control, which their HIG requires.
   */
  const showRealAppleButton = onApplePlatform && appleReady;
  const showStandInAppleButton = onApplePlatform && !appleReady && __DEV__;

  const leave = () => {
    if (mustSignIn) return router.replace('/'); // let the gate decide what's next
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  /**
   * The session store doesn't notify on Expo (better-auth #10545), so pull the
   * session ourselves before leaving — otherwise the gate still sees no account.
   */
  const finish = async () => {
    await refreshSession();
    leave();
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
    else if (!mustSignIn) leave();
  };

  const heading =
    pane === 'email'
      ? 'What’s your email?'
      : pane === 'code'
        ? 'Enter your code.'
        : mustSignIn
          ? 'Create your account.'
          : 'Sign in.';

  const subheading =
    pane === 'email'
      ? 'We’ll send a 6-digit code.'
      : pane === 'code'
        ? `Sent to ${email}.`
        : 'So your subscription follows you to a new phone.';

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.bar}>
        {mustSignIn && pane === 'providers' ? null : (
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
        )}
      </View>

      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View entering={FadeIn.duration(280)} style={s.fill}>
          {/* The screen is three buttons and a sentence. Splitting those to
              opposite ends of the phone leaves a hole in the middle, so the
              slack goes above the block instead. */}
          <View style={s.spacer} />

          <View style={s.top}>
            <Text style={s.h1}>{heading}</Text>
            <Text style={s.sub}>{subheading}</Text>
          </View>

          {pane === 'email' ? (
            <View style={s.form}>
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
            </View>
          ) : pane === 'code' ? (
            <View style={s.form}>
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
            </View>
          ) : null}

          <View style={s.actions}>
            {error ? <Notice>{error}</Notice> : null}

            {pane === 'providers' ? (
              <>
                {busy === 'apple' ? (
                  <View style={[s.btn, s.apple]}>
                    <ActivityIndicator color="#000000" />
                  </View>
                ) : showRealAppleButton ? (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                    cornerRadius={16}
                    style={s.btn}
                    onPress={() => go('apple')}
                  />
                ) : showStandInAppleButton ? (
                  <Tap
                    haptic="light"
                    onPress={() => go('apple')}
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Apple"
                    style={[s.btn, s.apple, busy !== null && s.dim]}>
                    <View style={s.btnInner}>
                      <AppleMark size={19} color="#000000" />
                      <Text style={[s.btnLabel, { color: '#000000' }]}>Continue with Apple</Text>
                    </View>
                  </Tap>
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
                      <Text style={s.btnLabel}>Continue with Google</Text>
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

                <Text style={s.legal}>Only your email and subscription status are stored.</Text>

                {__DEV__ && mustSignIn ? (
                  <Tap
                    haptic="none"
                    onPress={async () => {
                      await skipAuthForDev();
                      router.replace('/');
                    }}
                    style={s.ghost}>
                    <Text style={s.devLabel}>Skip (dev only)</Text>
                  </Tap>
                ) : null}
              </>
            ) : (
              <>
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
                    <Text style={[s.btnLabel, { color: palette.accentInk }]}>
                      {pane === 'email' ? 'Send code' : 'Sign in'}
                    </Text>
                  )}
                </Tap>

                {pane === 'code' ? (
                  <Tap haptic="none" onPress={requestCode} style={s.ghost}>
                    <Text style={s.ghostLabel}>Send a new code</Text>
                  </Tap>
                ) : null}
              </>
            )}
          </View>
        </Animated.View>
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

  top: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.two },
  h1: {
    color: palette.text,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.7,
    fontFamily: type.display,
  },
  sub: { color: palette.textDim, fontSize: 15, lineHeight: 22, fontFamily: type.body },

  form: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
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

  spacer: { flex: 1, minHeight: Spacing.five },

  actions: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.two, gap: Spacing.two },
  btn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnLabel: { color: palette.text, fontSize: 16, fontFamily: type.bodySemi },
  apple: { backgroundColor: '#FFFFFF' },
  google: { backgroundColor: palette.surface2, borderWidth: 1, borderColor: palette.line },
  primary: { backgroundColor: palette.accent },
  dim: { opacity: 0.4 },
  ghost: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20 },
  ghostLabel: { color: palette.textDim, fontSize: 15, fontFamily: type.bodyMed },
  devLabel: { color: palette.amber, fontSize: 13, fontFamily: type.bodyMed },
  legal: {
    color: palette.textFaint,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: type.body,
    textAlign: 'center',
  },
});
