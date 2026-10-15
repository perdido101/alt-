import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, PermissionsAndroid, Platform } from 'react-native';
import { CallShield, type CallShieldHealth } from '../../../../modules/call-shield';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { PermissionRow } from '@/components/PermissionRow';
import { SetupFrame } from '@/components/SetupFrame';
import { reportHealth, syncScreeningCache } from '@/lib/callShield';
import { registerForPush } from '@/lib/push';
import { useAppStore } from '@/lib/store';

/**
 * Step 2: call protection. Android: call-screening role and the permissions it needs, each explained.
 * iOS: how to turn on caller labels, and the manual "someone just called me" button.
 */
export default function SetupCalls() {
  const { t } = useTranslation();
  const [health, setHealth] = useState<CallShieldHealth | null>(CallShield?.getHealth() ?? null);
  const refresh = useCallback(() => setHealth(CallShield?.getHealth() ?? null), []);

  useEffect(() => {
    // Settings screens return here; re-read the state each time the app comes back.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  const next = () => {
    void syncScreeningCache().catch(() => undefined);
    void reportHealth().catch(() => undefined);
    useAppStore.getState().completeSetupStep('calls');
    router.push('/parent/setup/family');
  };

  const actions = <BigButton testID="setup-continue" label={t('common.continue')} onPress={next} />;

  if (Platform.OS === 'ios') {
    return (
      <SetupFrame step={2} title={t('setup.calls.title')} actions={actions}>
        <AppText>{t('setup.calls.iosBody')}</AppText>
        <BigButton variant="outline" label={t('setup.calls.openSettings')} onPress={() => void Linking.openSettings()} />
        <Card tone="calm">
          <AppText>{t('setup.calls.iosManual')}</AppText>
        </Card>
      </SetupFrame>
    );
  }

  if (!CallShield || !health?.supported) {
    return (
      <SetupFrame step={2} title={t('setup.calls.title')} actions={actions}>
        <Card tone="calm">
          <AppText>{t('setup.calls.notSupported')}</AppText>
        </Card>
      </SetupFrame>
    );
  }

  const shield = CallShield;
  const ask = (permission: (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS]) => async () => {
    const res = await PermissionsAndroid.request(permission);
    if (res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) shield.openAppSettings();
    refresh();
  };

  return (
    <SetupFrame step={2} title={t('setup.calls.title')} actions={actions}>
      <AppText>{t('setup.calls.intro')}</AppText>
      <PermissionRow
        title={t('setup.calls.role')}
        why={t('setup.calls.roleWhy')}
        done={health.callScreeningRole}
        onEnable={() => void shield.requestScreeningRole().then(refresh)}
      />
      <PermissionRow
        title={t('setup.calls.notifications')}
        why={t('setup.calls.notificationsWhy')}
        done={health.notifications}
        onEnable={() => void registerForPush().then(refresh).catch(() => shield.openNotificationSettings())}
      />
      <PermissionRow title={t('setup.calls.phoneState')} why={t('setup.calls.phoneStateWhy')} done={health.phoneState} onEnable={() => void ask(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE)()} />
      <PermissionRow title={t('setup.calls.overlay')} why={t('setup.calls.overlayWhy')} done={health.overlay} onEnable={() => shield.openOverlaySettings()} />
      <PermissionRow title={t('setup.calls.fullScreen')} why={t('setup.calls.fullScreenWhy')} done={health.fullScreenIntent} onEnable={() => shield.openFullScreenIntentSettings()} />
      <PermissionRow title={t('setup.calls.battery')} why={t('setup.calls.batteryWhy')} done={health.batteryExempt} onEnable={() => shield.openBatterySettings()} />
    </SetupFrame>
  );
}
