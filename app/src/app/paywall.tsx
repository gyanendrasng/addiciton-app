import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/ui/app-logo';
import { Notice } from '@/components/ui/notice';
import { Tap } from '@/components/ui/tap';
import { setPremium } from '@/db/repo/profile';
import { usePremium } from '@/features/premium/use-premium';
import { BENEFITS, PLANS, PRIVACY_URL, TERMS_URL, type Plan } from '@/features/premium/plans';
import { track } from '@/lib/analytics';
import { humanError } from '@/lib/errors';
import { hues, palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

/**
 * The wall.
 *
 * Curb has no free tier and no trial — this screen is the only way into the
 * app, and it is deliberately not dismissible. Apple 3.1.2 requires the price,
 * the billing period and links to Terms and Privacy to be visible here, plus a
 * Restore control, so none of those are optional decoration.
 */
export default function PaywallScreen() {
  const router = useRouter();
  const { premium, refresh, checking } = usePremium();

  const [selected, setSelected] = useState<Plan['id'] | null>(null);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * The gate decides *whether* the wall shows; the wall has to dismiss itself.
   * It sits on top of the tab stack, so flipping the entitlement isn't enough —
   * without this the screen stays put after a successful purchase. Covers
   * restore and a background entitlement refresh too.
   */
  useEffect(() => {
    if (premium) router.replace('/');
  }, [premium, router]);

  // Weekly is preselected — the lowest number to say yes to.
  const plan = PLANS.find((p) => p.id === selected) ?? PLANS[0];

  const buy = async () => {
    if (busy) return;
    setError(null);
    setBusy('buy');
    try {
      // TODO(revenuecat): Purchases.purchasePackage(pkg for plan.productId).
      // The RevenueCat webhook then writes the entitlement, and `refresh()`
      // below picks it up. Until the SDK is wired (it needs a dev build),
      // development grants premium locally so the rest of the app is reachable.
      if (__DEV__) {
        await setPremium(true);
        track('paywall_viewed', { plan: plan.id });
      } else {
        throw new Error('Purchases are not available yet.');
      }
      await refresh();
    } catch (e) {
      setError(humanError(e, 'generic'));
    }
    setBusy(null);
  };

  const restore = async () => {
    if (busy) return;
    setError(null);
    setBusy('restore');
    try {
      // TODO(revenuecat): Purchases.restorePurchases(), then refresh.
      await refresh();
      if (!premium) {
        setError('No previous purchase found on this account.');
      }
    } catch (e) {
      setError(humanError(e, 'generic'));
    }
    setBusy(null);
  };

  const open = (url: string) => {
    Linking.openURL(url).catch(() => setError('Couldn’t open that link.'));
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <ScrollView
        style={s.fill}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(320)} style={s.head}>
          <AppLogo size={52} />
          <Text style={s.h1}>Everything, from{'\n'}day one.</Text>
          <Text style={s.sub}>
            Curb has no free tier and no ads. One subscription, everything unlocked, on
            every device you sign in on.
          </Text>
        </Animated.View>

        <View style={s.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={s.benefitRow}>
              {Platform.OS === 'ios' ? (
                <SymbolView
                  name="checkmark"
                  size={13}
                  weight="bold"
                  tintColor={palette.accent}
                  style={s.check}
                />
              ) : (
                <View style={s.checkDot} />
              )}
              <Text style={s.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={s.plans}>
          {PLANS.map((p) => {
            const on = p.id === plan.id;
            return (
              <Tap
                key={p.id}
                haptic="light"
                onPress={() => setSelected(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${p.name}, ${p.price}${p.period}. ${p.sub}`}
                style={[s.plan, on && s.planOn]}>
                <View style={[s.radio, on && s.radioOn]}>
                  {on ? <View style={s.radioDot} /> : null}
                </View>
                <View style={s.planBody}>
                  <View style={s.planTop}>
                    <Text style={s.planName}>{p.name}</Text>
                    {p.badge ? (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{p.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={s.planSub}>{p.sub}</Text>
                </View>
                <Text style={s.planPrice}>
                  {p.price}
                  <Text style={s.planPeriod}>{p.period}</Text>
                </Text>
              </Tap>
            );
          })}
        </View>
      </ScrollView>

      <View style={s.actions}>
        {error ? <Notice>{error}</Notice> : null}

        <Tap
          haptic="light"
          onPress={buy}
          accessibilityRole="button"
          style={[s.cta, busy !== null && s.dim]}>
          {busy === 'buy' ? (
            <ActivityIndicator color={palette.accentInk} />
          ) : (
            <Text style={s.ctaLabel}>
              {plan.recurring ? `Subscribe — ${plan.price}${plan.period}` : `Buy — ${plan.price}`}
            </Text>
          )}
        </Tap>

        {/* Apple 3.1.2: price and billing period, stated plainly. */}
        <Text style={s.disclosure}>{plan.disclosure}</Text>

        <View style={s.legal}>
          <Tap haptic="none" onPress={restore} accessibilityRole="button" style={s.legalTap}>
            <Text style={s.legalLink}>
              {busy === 'restore' || checking ? 'Restoring…' : 'Restore purchase'}
            </Text>
          </Tap>
          <Text style={s.legalDot}>·</Text>
          <Tap
            haptic="none"
            onPress={() => open(TERMS_URL)}
            accessibilityRole="link"
            style={s.legalTap}>
            <Text style={s.legalLink}>Terms</Text>
          </Tap>
          <Text style={s.legalDot}>·</Text>
          <Tap
            haptic="none"
            onPress={() => open(PRIVACY_URL)}
            accessibilityRole="link"
            style={s.legalTap}>
            <Text style={s.legalLink}>Privacy</Text>
          </Tap>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  fill: { flex: 1 },
  // Bottom padding so the last plan can scroll clear of the sticky footer.
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.five },

  head: { gap: Spacing.three },
  h1: {
    color: palette.text,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.7,
    fontFamily: type.display,
  },
  sub: { color: palette.textDim, fontSize: 15, lineHeight: 22, fontFamily: type.body },

  benefits: { marginTop: Spacing.five, gap: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two + 2 },
  check: { width: 13, height: 13, marginTop: 4 },
  checkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 7,
    marginHorizontal: 3,
    backgroundColor: palette.accent,
  },
  benefitText: { flex: 1, color: palette.textDim, fontSize: 14.5, lineHeight: 21, fontFamily: type.body },

  plans: { marginTop: Spacing.five, gap: Spacing.two },
  plan: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.line,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  planOn: { borderColor: palette.accent, backgroundColor: palette.surface2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: palette.accent },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: palette.accent },
  planBody: { flex: 1, gap: 3 },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  planName: { color: palette.text, fontSize: 16, fontFamily: type.bodySemi },
  planSub: { color: palette.textDim, fontSize: 13, fontFamily: type.body },
  planPrice: { color: palette.text, fontSize: 17, fontFamily: type.bodySemi },
  planPeriod: { color: palette.textDim, fontSize: 13, fontFamily: type.body },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: hues.premium.wash,
  },
  badgeText: {
    color: hues.premium.solid,
    fontSize: 10,
    letterSpacing: 0.6,
    fontFamily: type.bodySemi,
  },

  actions: {
    paddingHorizontal: Spacing.four,
    // No bottom padding: the safe-area inset already clears the home
    // indicator, and stacking our own on top of it left a visible dead band
    // under the legal links.
    gap: Spacing.two,
  },
  cta: {
    height: 54,
    borderRadius: 16,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: palette.accentInk, fontSize: 16, fontFamily: type.bodySemi },
  dim: { opacity: 0.4 },
  disclosure: {
    color: palette.textFaint,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: type.body,
    textAlign: 'center',
  },
  legal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    // Pull the row's own tap padding back out of the layout so the links sit
    // closer to the disclosure while keeping a 44pt touch target.
    marginTop: -6,
    marginBottom: -8,
  },
  legalTap: { paddingVertical: 10, paddingHorizontal: 6 },
  legalLink: { color: palette.textDim, fontSize: 13, fontFamily: type.bodyMed },
  legalDot: { color: palette.textFaint, fontSize: 13 },
});
