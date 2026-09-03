import { Screen } from '@/components/ui/screen';
import { Subtitle, Title } from '@/features/onboarding/components/chrome';
import { ReasonsList } from '@/features/reasons/ReasonsList';
import { withAccess } from '@/features/premium/access';

function ReasonsScreen() {
  return (
    <Screen>
      <Title>Your reasons</Title>
      <Subtitle>You’ll see these when an urge hits. Make them yours.</Subtitle>
      <ReasonsList />
    </Screen>
  );
}

// Not reachable without an account and a subscription — see features/premium/access.
export default withAccess(ReasonsScreen);
