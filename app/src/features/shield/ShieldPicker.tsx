/**
 * Apple's app picker, as a sheet.
 *
 * The only UI Apple allows for choosing what to shield. It hands back an
 * opaque token and counts — never names — which is exactly the shape Nocrave
 * wants to hold. Mounted only while `visible`; the native view presents the
 * sheet on mount and reports every change, then a dismiss.
 */
import { useRef } from 'react';
import { StyleSheet } from 'react-native';

import { sdk } from './module';

export type PickedSelection = { token: string; apps: number; categories: number; sites: number };

export function ShieldPicker({
  visible,
  current,
  onPicked,
  onCancel,
}: {
  visible: boolean;
  /** the existing token, so the sheet opens with the current picks ticked */
  current: string | null;
  onPicked: (selection: PickedSelection) => void;
  onCancel: () => void;
}) {
  const latest = useRef<PickedSelection | null>(null);
  const Sheet = sdk()?.DeviceActivitySelectionSheetView;
  if (!visible || !Sheet) return null;
  return (
    <Sheet
      style={s.hidden}
      familyActivitySelection={current}
      headerText="Choose what Nocrave shields"
      footerText="Pick whole categories where you can — it keeps the selection small and covers new apps too."
      onSelectionChange={(e) => {
        const { familyActivitySelection, applicationCount, categoryCount, webDomainCount } = e.nativeEvent;
        latest.current = familyActivitySelection
          ? { token: familyActivitySelection, apps: applicationCount, categories: categoryCount, sites: webDomainCount }
          : null;
      }}
      onDismissRequest={() => {
        const picked = latest.current;
        latest.current = null;
        if (picked) onPicked(picked);
        else onCancel();
      }}
    />
  );
}

const s = StyleSheet.create({
  // The view is a host for the sheet, not something to see.
  hidden: { width: 0, height: 0 },
});
