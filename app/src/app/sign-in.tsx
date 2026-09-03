import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppLogo } from '@/components/ui/app-logo';
import { Screen } from '@/components/ui/screen';
import { Tap } from '@/components/ui/tap';
import { Cta, Subtitle, Title } from '@/features/onboarding/components/chrome';
import {
  availableProviders,
  isAppleAvailable,
  sendEmailCode,
  signInWith,
  verifyEmailCode,
  type Provider,
} from '@/features/account/sign-in';
import { useSession } from '@/lib/session';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

const LABEL: Record<Provider, string> = {
  apple: 'Continue with Apple',
  google: 'Continue with Google',
  email: 'Continue with email',
};

type Pane = 'providers' | 'email' | 'code';

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

  const providers = availableProviders().filter((p) => p !== 'apple' || appleOk);

  /**
   * The session store does not notify on Expo (better-auth #10545), so pull the
   * session ourselves before leaving — otherwise Settings still says
   * "Not signed in".
   */
  const finish = async () => {
    await refreshSession();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const go = async (provider: Provider) => {
    if (provider === 'email') {
      setError(null);
      setPane('email');
      return;
    }
    setError(null);
    setBusy(provider);
    const result = await signInWith(provider);
    setBusy(null);
    if (result.ok) return void finish();
    if (!result.cancelled) setError(result.message);
  };

  const requestCode = async () => {
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
    setError(null);
    setBusy('email');
    const result = await verifyEmailCode(email, code);
    setBusy(null);
    if (result.ok) return void finish();
    if (!result.cancelled) setError(result.message);
  };

  const back = () => {
    setError(null);
    if (pane === 'code') setPane('email');
    else if (pane === 'email') setPane('providers');
    else router.back();
  };

  return (
    <Screen scroll={false}>
      <View style={s.body}>
        <Animated.View entering={FadeIn.duration(350)} style={s.head}>
          <AppLogo size={72} />
          {pane === 'providers' ? (
            <>
              <Title center>Keep your premium{'\n'}on every device.</Title>
              <Subtitle center>
                Sign in so your subscription follows you to a new phone. Your streaks, slips and
                notes stay on this device either way — we never upload them.
              </Subtitle>
            </>
          ) : pane === 'email' ? (
            <>
              <Title center>What’s your email?</Title>
              <Subtitle center>
                We’ll send a 6-digit code. No password to remember, and email works on both iPhone
                and Android — so your premium can move either way.
              </Subtitle>
            </>
          ) : (
            <>
              <Title center>Enter your code.</Title>
              <Subtitle center>Sent to {email}. It expires in 5 minutes.</Subtitle>
            </>
          )}
        </Animated.View>

        {pane === 'providers' ? (
          <View style={s.buttons}>
            {providers.map((p) => (
              <Tap
                key={p}
                haptic="light"
                onPress={() => busy === null && go(p)}
                accessibilityRole="button"
                style={[
                  s.btn,
                  p === 'apple' ? s.apple : p === 'google' ? s.google : s.email,
                  busy !== null && s.dim,
                ]}>
                {busy === p ? (
                  <ActivityIndicator color={p === 'apple' ? palette.bg : palette.text} />
                ) : (
                  <>
                    {p === 'apple' ? (
                      <AppleAuthentication.AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                        cornerRadius={0}
                        style={s.hiddenNativeButton}
                        onPress={() => go('apple')}
                      />
                    ) : null}
                    <Text style={[s.btnLabel, p === 'apple' && { color: palette.bg }]}>
                      {LABEL[p]}
                    </Text>
                  </>
                )}
              </Tap>
            ))}
          </View>
        ) : pane === 'email' ? (
          <View style={s.buttons}>
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
              onSubmitEditing={() => busy === null && requestCode()}
            />
            <Cta
              label={busy === 'email' ? 'Sending…' : 'Send code'}
              onPress={requestCode}
              disabled={busy !== null}
            />
          </View>
        ) : (
          <View style={s.buttons}>
            <TextInput
              style={[s.input, s.codeInput]}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={palette.textFaint}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoFocus
              maxLength={6}
              returnKeyType="go"
              onSubmitEditing={() => busy === null && submitCode()}
            />
            <Cta
              label={busy === 'email' ? 'Checking…' : 'Sign in'}
              onPress={submitCode}
              disabled={busy !== null || code.length !== 6}
            />
            <Tap haptic="none" onPress={busy === null ? requestCode : undefined} style={s.skip}>
              <Text style={s.skipLabel}>Send a new code</Text>
            </Tap>
          </View>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}

        <Tap haptic="none" onPress={back} style={s.skip}>
          <Text style={s.skipLabel}>{pane === 'providers' ? 'Not now' : 'Back'}</Text>
        </Tap>

        <Text style={s.legal}>
          We store only your email and subscription status. Nothing about your recovery.
        </Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, padding: Spacing.four, justifyContent: 'center', gap: Spacing.four },
  head: { alignItems: 'center', gap: Spacing.three },
  buttons: { gap: Spacing.two, marginTop: Spacing.two },
  btn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  apple: { backgroundColor: palette.bright },
  google: { backgroundColor: palette.surface2 },
  email: { backgroundColor: 'transparent', borderWidth: 1, borderColor: palette.line },
  dim: { opacity: 0.6 },
  btnLabel: { color: palette.text, fontSize: 16, fontFamily: type.bodySemi },
  // The real Apple button sits invisibly on top so the tap is a genuine
  // AppleAuthenticationButton press (Apple's HIG requires their button).
  hiddenNativeButton: { position: 'absolute', top: 0, left: 0, right: 0, height: 56, opacity: 0.02 },
  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: palette.surface2,
    paddingHorizontal: Spacing.three,
    color: palette.text,
    fontSize: 17,
    fontFamily: type.bodyMed,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 26,
    letterSpacing: 8,
    fontFamily: type.bodySemi,
  },
  error: { color: palette.danger, fontSize: 14, fontFamily: type.body, textAlign: 'center' },
  skip: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  skipLabel: { color: palette.textDim, fontSize: 15, fontFamily: type.bodyMed },
  legal: {
    color: palette.textFaint,
    fontSize: 12,
    fontFamily: type.body,
    textAlign: 'center',
    marginTop: -Spacing.two,
  },
});
