import { Alert, Share } from 'react-native';
import { i18n } from './i18n';
import { apiFetch, apiUrl } from './server';
import { useAppStore } from './store';
import { supabase } from './supabase';

/** GDPR export: everything we hold about this person, shared as a JSON file via the system share sheet. */
export async function exportMyData(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`${apiUrl}/api/account/export`, { headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` } });
  await Share.share({ title: 'alt-my-data.json', message: await res.text() });
}

/** GDPR erasure, after an explicit confirmation. */
export function confirmDeleteAccount(onDone: () => void) {
  Alert.alert(i18n.t('account.deleteTitle'), i18n.t('account.deleteBody'), [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    {
      text: i18n.t('account.deleteConfirm'),
      style: 'destructive',
      onPress: () =>
        void apiFetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: true }) })
          .then(async () => {
            await supabase.auth.signOut().catch(() => undefined);
            useAppStore.getState().reset();
            onDone();
          })
          .catch(() => Alert.alert(i18n.t('errors.generic'))),
    },
  ]);
}

/** A parent withdraws consent by leaving the circle; their history there is deleted. */
export function confirmLeaveCircle(onDone: () => void) {
  Alert.alert(i18n.t('account.leaveTitle'), i18n.t('account.leaveBody'), [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    {
      text: i18n.t('account.leaveConfirm'),
      style: 'destructive',
      onPress: () =>
        void (async () => {
          const circleId = useAppStore.getState().circleId;
          const { error } = await supabase.rpc('leave_circle', { p_circle: circleId });
          if (error) return Alert.alert(error.message === 'last_guardian' ? i18n.t('account.lastGuardian') : i18n.t('errors.generic'));
          await supabase.auth.signOut().catch(() => undefined);
          useAppStore.getState().reset();
          onDone();
        })(),
    },
  ]);
}
