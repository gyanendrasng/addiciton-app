/**
 * Send a tapped notification where it says it goes.
 *
 * Every notification the app schedules carries `data.route`. Without this,
 * tapping "Half off your first year" just opens the app wherever it last was,
 * which is a worse experience than not notifying at all.
 *
 * Handles both cases: the app was already running (listener), and the app was
 * launched cold by the tap (`getLastNotificationResponseAsync`).
 */
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

type Routable = { route?: unknown };

function routeOf(response: Notifications.NotificationResponse | null): string | null {
  const data = response?.notification.request.content.data as Routable | undefined;
  return typeof data?.route === 'string' ? data.route : null;
}

export function useNotificationRouting() {
  const router = useRouter();
  // A cold launch delivers the same response through both paths; route once.
  const handled = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;

    const go = (response: Notifications.NotificationResponse | null) => {
      const route = routeOf(response);
      if (!route || !alive) return;
      const id = response?.notification.request.identifier ?? route;
      if (handled.current === id) return;
      handled.current = id;
      router.push(route as never);
    };

    // Cold launch: the tap that started the app.
    Notifications.getLastNotificationResponseAsync().then(go).catch(() => undefined);

    // Warm: tapped while the app was already running.
    const sub = Notifications.addNotificationResponseReceivedListener(go);
    return () => {
      alive = false;
      sub.remove();
    };
  }, [router]);
}
