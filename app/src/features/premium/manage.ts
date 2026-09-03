import { Linking, Platform } from 'react-native';

import { PLANS } from './plans';

/**
 * Send the user to the store page where they can cancel.
 *
 * **Google Play requires this.** Their subscription policy: "you must also
 * provide an option for users to cancel their subscriptions in your app and on
 * your website", with a deep link to the Play subscription centre as the
 * intended route. Apple doesn't mandate it, but hiding cancellation is both
 * hostile and, in a recovery app, exactly the wrong signal — someone who wants
 * out should not have to hunt.
 *
 * Neither store lets an app cancel a subscription itself; the platform owns
 * that. All we can do is take the user straight there.
 */
const APPLE_URL = 'https://apps.apple.com/account/subscriptions';
const PLAY_URL = 'https://play.google.com/store/account/subscriptions';

/** From app.json — must match the Play listing or the deep link 404s. */
const ANDROID_PACKAGE = 'app.joincurb.curb';

export function manageSubscriptionUrl(productId?: string | null): string {
  if (Platform.OS === 'android') {
    // Play deep-links to a specific subscription when given both parameters,
    // and falls back to the list when it can't resolve them.
    return productId
      ? `${PLAY_URL}?sku=${encodeURIComponent(productId)}&package=${ANDROID_PACKAGE}`
      : PLAY_URL;
  }
  return APPLE_URL;
}

/**
 * @param productId the store product the user is on, if known — improves the
 *   Android deep link, ignored on iOS.
 * @returns false if the store page couldn't be opened, so the caller can say so
 *   rather than appearing to do nothing.
 */
export async function openManageSubscription(productId?: string | null): Promise<boolean> {
  const url = manageSubscriptionUrl(productId ?? PLANS[0]?.productId);
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
