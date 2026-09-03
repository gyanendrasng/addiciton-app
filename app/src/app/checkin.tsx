import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { useCheckin } from '@/db/repo/checkins';
import { CheckinForm } from '@/features/checkin/CheckinForm';
import { useDayKey } from '@/lib/clock';
import { Spacing } from '@/theme/spacing';
import { useDismiss } from '@/lib/nav';

export default function CheckinScreen() {
  const dismiss = useDismiss();
  const date = useDayKey();
  const { checkin, loading } = useCheckin(date);
  if (loading) return <Screen scroll={false}><View /></Screen>;
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, padding: Spacing.four, paddingTop: Spacing.two }}>
        <CheckinForm date={date} existing={checkin} onSaved={dismiss} />
      </View>
    </Screen>
  );
}
