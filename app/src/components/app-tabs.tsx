import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { palette } from '@/theme/palette';

/**
 * `sf` is read on iOS, `src` on Android — both are always supplied, because a
 * tab with only one of them renders blank on the other platform. Three of the
 * four tabs previously pointed at the same leftover `explore.png`, so Progress,
 * Games and Settings were literally the same picture on Android.
 *
 * The PNGs are `template` mode: alpha carries the shape and `iconColor` tints
 * it, so they follow the palette in both themes rather than baking a colour in.
 */
export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={palette.bg}
      iconColor={{ default: palette.textFaint, selected: palette.accent }}
      labelStyle={{ default: { color: palette.textFaint }, selected: { color: palette.accent } }}
      /* Android-only below; iOS ignores them. Material 3 defaults the selected
         pill and the ripple to `secondaryContainer`, which renders lavender and
         has nothing to do with this palette -- the one saturated non-brand
         colour in the whole app sat under the primary navigation. */
      indicatorColor={palette.accentWash}
      rippleColor={palette.accentWash}
      /* M3 shows the label for the selected tab only, so three of four tabs are
         unlabelled icons the user has to guess at. Four short labels fit. */
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          src={require('@/assets/images/tabIcons/progress.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="games">
        <NativeTabs.Trigger.Label>Games</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gamecontroller', selected: 'gamecontroller.fill' }}
          src={require('@/assets/images/tabIcons/games.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          src={require('@/assets/images/tabIcons/settings.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
