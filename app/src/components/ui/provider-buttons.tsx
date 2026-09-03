import * as AppleAuthentication from 'expo-apple-authentication';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { activeScheme } from '@/theme/palette';
import { AppleMark, GoogleMark } from './brand-marks';
import { Tap } from './tap';

/**
 * Third-party sign-in buttons, built to each platform's own specification.
 *
 * These are the two controls that decide whether an auth screen feels native
 * or home-made, and neither vendor leaves the styling to us:
 *
 * **Apple** (HIG, Sign in with Apple → Buttons): show the button prominently,
 * make it "no smaller than other sign-in buttons", don't make people scroll to
 * reach it, and title it only "Sign in with Apple", "Sign up with Apple" or
 * "Continue with Apple". Shipping builds use Apple's own control, which is why
 * it always looks right — the hand-drawn one below exists only because the
 * Simulator can't run Sign in with Apple at all.
 *
 * **Google** (Sign in with Google branding guidelines) publishes exact values:
 *   dark    fill #131314, 1px inside stroke #8E918F, text #E3E3E3
 *   light   fill #FFFFFF, 1px inside stroke #747775, text #1F1F1F
 *   type    Google Sans Medium 14/20 — we can't bundle Google Sans, so the
 *           platform system face is the honest substitute; the brand font is
 *           not an option here
 *   logo    the four-colour G, never resized or recoloured
 *
 * Deliberately NOT themed from `palette`: these belong to Apple and Google, and
 * matching our surface colours to them is what made the screen look generic.
 */

/** Both buttons share a height so Apple's "no smaller" rule holds. */
export const PROVIDER_BUTTON_HEIGHT = 54;
const RADIUS = 16;

const GOOGLE = {
  dark: { fill: '#131314', stroke: '#8E918F', text: '#E3E3E3' },
  light: { fill: '#FFFFFF', stroke: '#747775', text: '#1F1F1F' },
} as const;

/** The system face — Google Sans isn't ours to ship, and our brand font isn't allowed. */
const SYSTEM_FONT = Platform.select({ ios: 'System', default: 'sans-serif-medium' });

export function GoogleButton({
  label = 'Continue with Google',
  onPress,
  busy,
  disabled,
}: {
  label?: 'Sign in with Google' | 'Sign up with Google' | 'Continue with Google';
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const c = activeScheme === 'light' ? GOOGLE.light : GOOGLE.dark;
  return (
    <Tap
      haptic="light"
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        s.btn,
        { backgroundColor: c.fill, borderColor: c.stroke, borderWidth: 1 },
        disabled && s.dim,
      ]}>
      {busy ? (
        <ActivityIndicator color={c.text} />
      ) : (
        <View style={s.inner}>
          <GoogleMark size={20} />
          <Text style={[s.label, { color: c.text, fontFamily: SYSTEM_FONT }]}>{label}</Text>
        </View>
      )}
    </Tap>
  );
}

/**
 * Apple's real control. Returns null off iOS.
 *
 * `available` comes from `isAvailableAsync()`. It is false on the Simulator,
 * where `signInAsync` always throws — see `AppleFallbackButton`.
 */
export function AppleButton({
  available,
  onPress,
  busy,
}: {
  available: boolean;
  onPress: () => void;
  busy?: boolean;
}) {
  if (Platform.OS !== 'ios') return null;
  if (busy) {
    return (
      <View style={[s.btn, s.appleFill]}>
        <ActivityIndicator color="#000000" />
      </View>
    );
  }
  if (!available) return null;
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={
        activeScheme === 'light'
          ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
      }
      cornerRadius={RADIUS}
      style={s.btn}
      onPress={onPress}
    />
  );
}

/**
 * A stand-in for Apple's button, drawn to their custom-button rules
 * (logo height matches the button, no cropping, approved title).
 *
 * Development only. It exists so the Simulator shows the screen as it ships
 * instead of appearing to be missing Apple sign-in; tapping it fails with a
 * readable message, because `signInAsync` genuinely cannot work there.
 */
export function AppleFallbackButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const light = activeScheme === 'light';
  return (
    <Tap
      haptic="light"
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel="Continue with Apple"
      style={[s.btn, light ? s.appleInk : s.appleFill, disabled && s.dim]}>
      <View style={s.inner}>
        <AppleMark size={20} color={light ? '#FFFFFF' : '#000000'} />
        <Text
          style={[
            s.label,
            { color: light ? '#FFFFFF' : '#000000', fontFamily: SYSTEM_FONT },
          ]}>
          Continue with Apple
        </Text>
      </View>
    </Tap>
  );
}

const s = StyleSheet.create({
  btn: {
    height: PROVIDER_BUTTON_HEIGHT,
    borderRadius: RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 16, fontWeight: '600' },
  appleFill: { backgroundColor: '#FFFFFF' },
  appleInk: { backgroundColor: '#000000' },
  dim: { opacity: 0.4 },
});
