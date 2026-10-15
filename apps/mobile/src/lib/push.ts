import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

/** Android channels: alerts are urgent; quizzes are gentle. The parent never gets marketing notifications. */
async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'ΑΛΤ! ειδοποιήσεις',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400, 200, 400],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
  await Notifications.setNotificationChannelAsync('quiz', { name: 'Η λέξη μας', importance: Notifications.AndroidImportance.DEFAULT });
}

export function deviceInfo() {
  return {
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    appVersion: Constants.expoConfig?.version ?? null,
    osVersion: `${Device.osName ?? Platform.OS} ${Device.osVersion ?? ''}`.trim(),
  };
}

/** Asks for notification permission and stores this device's Expo push token. Returns whether push works. */
export async function registerForPush(): Promise<boolean> {
  await ensureChannels();
  if (!Device.isDevice) return false;
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return false;
  const projectId = (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ?? Constants.easConfig?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  const info = deviceInfo();
  await supabase.rpc('register_device', { p_platform: info.platform, p_push_token: token, p_app_version: info.appVersion, p_os_version: info.osVersion });
  return true;
}

function routeFor(data: Record<string, unknown> | undefined): Href | null {
  if (!data) return null;
  if (data.type === 'alert' && typeof data.alertId === 'string') return { pathname: '/guardian/alert/[id]', params: { id: data.alertId } };
  return null;
}

/** Opens the right screen when a notification is tapped (also on cold start). */
export function useNotificationRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const go = (n: Notifications.Notification) => {
      const href = routeFor(n.request.content.data as Record<string, unknown> | undefined);
      if (href) router.push(href);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) go(last.notification);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => go(r.notification));
    return () => sub.remove();
  }, [enabled]);
}
