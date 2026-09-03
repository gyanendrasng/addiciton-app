import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tap } from '@/components/ui/tap';
import { useProfile } from '@/db/repo/profile';
import { RelapseFlow } from '@/features/relapse/RelapseFlow';
import { palette } from '@/theme/palette';
import { Spacing } from '@/theme/spacing';
import { type } from '@/theme/type';

export default function RelapseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { urgeId, habit } = useLocalSearchParams<{ urgeId?: string; habit?: string }>();
  const id = urgeId ? Number(urgeId) : null;
  return (
    <View style={[s.root, { paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={s.header}>
        <Tap haptic="none" onPress={() => router.back()} style={s.close} accessibilityLabel="Close">
          <Text style={s.closeGlyph}>×</Text>
        </Tap>
      </View>
      {profile ? (
        <RelapseFlow urgeId={Number.isFinite(id as number) ? id : null} presetHabit={habit ?? null} />
      ) : (
        <View style={{ flex: 1 }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  header: { height: 48, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: Spacing.four },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface3, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' },
  closeGlyph: { color: palette.text, fontSize: 22, fontFamily: type.body, lineHeight: 24 },
});
