import { router } from 'expo-router';
import { BellRing } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { BigButton } from './BigButton';

/** "Ειδοποίησε την οικογένεια", offered on every ΝΑΙ path of the after-call flow. */
export function CallAlertButton({ callEventId, numberKey }: { callEventId?: string; numberKey?: string | null }) {
  const { t } = useTranslation();
  return (
    <BigButton
      icon={BellRing}
      variant="ember"
      size="lg"
      label={t('verdict.alertFamily')}
      onPress={() =>
        router.push({
          pathname: '/parent/alert/confirm',
          params: { source: 'call', ...(callEventId ? { callEventId } : {}), ...(numberKey ? { callerNumber: numberKey } : {}) },
        })
      }
    />
  );
}
