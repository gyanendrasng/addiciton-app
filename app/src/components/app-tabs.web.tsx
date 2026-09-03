import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/theme/spacing';
import { palette } from '@/theme/palette';
import { type } from '@/theme/type';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <View style={styles.bar}>
          <TabTrigger name="index" href="/" asChild><TabButton>Home</TabButton></TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild><TabButton>Progress</TabButton></TabTrigger>
          <TabTrigger name="games" href="/games" asChild><TabButton>Games</TabButton></TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild><TabButton>Settings</TabButton></TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={[styles.btn, isFocused && styles.btnOn]}>
      <Text style={[styles.label, isFocused && styles.labelOn]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
    paddingBottom: Spacing.three,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.line,
  },
  btn: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, borderRadius: 12 },
  btnOn: { backgroundColor: palette.accentWash },
  label: { color: palette.textFaint, fontSize: 13, fontFamily: type.bodySemi },
  labelOn: { color: palette.accent },
});
