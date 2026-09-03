import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { palette } from '@/theme/palette';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={palette.bg}
      iconColor={{ default: palette.textFaint, selected: palette.accent }}
      labelStyle={{ default: { color: palette.textFaint }, selected: { color: palette.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} src={require('@/assets/images/tabIcons/home.png')} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} src={require('@/assets/images/tabIcons/explore.png')} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="games">
        <NativeTabs.Trigger.Label>Games</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gamecontroller', selected: 'gamecontroller.fill' }} src={require('@/assets/images/tabIcons/explore.png')} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} src={require('@/assets/images/tabIcons/explore.png')} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
