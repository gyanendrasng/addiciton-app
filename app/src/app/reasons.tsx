import { Screen } from '@/components/ui/screen';
import { Subtitle, Title } from '@/features/onboarding/components/chrome';
import { ReasonsList } from '@/features/reasons/ReasonsList';

export default function ReasonsScreen() {
  return (
    <Screen>
      <Title>Your reasons</Title>
      <Subtitle>You’ll see these when an urge hits. Make them yours.</Subtitle>
      <ReasonsList />
    </Screen>
  );
}
