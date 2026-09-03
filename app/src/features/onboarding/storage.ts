import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const KEY = 'onboarding.completed.v1';
const ANSWERS_KEY = 'onboarding.answers.v1';

export async function markOnboarded(answers: unknown) {
  await AsyncStorage.multiSet([
    [KEY, '1'],
    [ANSWERS_KEY, JSON.stringify(answers ?? {})],
  ]);
}

export async function resetOnboarding() {
  await AsyncStorage.multiRemove([KEY, ANSWERS_KEY]);
}

/** null = still loading, then boolean. */
export function useOnboarded(): boolean | null {
  const [state, setState] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((v) => alive && setState(v === '1'))
      .catch(() => alive && setState(false));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
