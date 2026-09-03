import { ScrollView, View } from 'react-native';

import { Cta } from '@/features/onboarding/components/chrome';
import { ReasonsList } from '@/features/reasons/ReasonsList';
import { shared, StepHeader } from './shared';

export function Reasons({ onDone }: { onDone: () => void }) {
  return (
    <View style={shared.pane}>
      <StepHeader kicker="Step 3 · Remember why" title="You wrote these when you were clear-headed." />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <ReasonsList compact />
      </ScrollView>
      <Cta label="I remember" onPress={onDone} />
    </View>
  );
}
