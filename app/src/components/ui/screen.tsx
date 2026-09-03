import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chevron } from '@/features/onboarding/components/chrome';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';
import { Tap } from './tap';

/** Modal/pushed screen shell: safe area, optional back/close header, scrolling body. */
export function Screen({
  title,
  back = true,
  scroll = true,
  children,
  footer,
}: {
  title?: string;
  back?: boolean;
  scroll?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const router = useRouter();
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {(back || title) && (
        <View style={s.header}>
          {back ? (
            <Tap haptic="none" onPress={() => router.back()} accessibilityLabel="Back" style={s.back}>
              <Chevron />
            </Tap>
          ) : (
            <View style={s.back} />
          )}
          {title ? <Text style={s.title}>{title}</Text> : <View style={{ flex: 1 }} />}
          <View style={s.back} />
        </View>
      )}
      <Body style={s.body} contentContainerStyle={scroll ? s.content : undefined} keyboardShouldPersistTaps="handled">
        {children}
      </Body>
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Section({ label, style, ...rest }: ViewProps & { label?: string }) {
  return (
    <View {...rest} style={[s.section, style]}>
      {label ? <Text style={s.sectionLabel}>{label}</Text> : null}
      {rest.children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.four, gap: Spacing.three },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: palette.text, fontSize: 17, fontFamily: type.bodySemi },
  body: { flex: 1 },
  content: { padding: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three },
  footer: { padding: Spacing.four, paddingTop: Spacing.two },
  section: { gap: Spacing.two },
  sectionLabel: { color: palette.textDim, fontSize: 13, fontFamily: type.bodySemi, letterSpacing: 0.3 },
});
