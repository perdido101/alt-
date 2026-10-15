import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { FamilyContactsEditor } from '@/components/FamilyContactsEditor';
import { SetupFrame } from '@/components/SetupFrame';
import { TextField } from '@/components/TextField';
import { setOwnPhone } from '@/lib/api';
import { useFamilyContacts } from '@/lib/queries';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

/** Step 3: family numbers. Calls from these never show a warning; guardians get alerts; a backup gets escalation SMS. */
export default function SetupFamily() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const circleId = useAppStore((s) => s.circleId);
  const contacts = useFamilyContacts();
  const [ownPhone, setOwnPhoneValue] = useState('');
  const [ownPhoneError, setOwnPhoneError] = useState<string | null>(null);

  const next = async () => {
    if (ownPhone.trim() && circleId) {
      try {
        await setOwnPhone(circleId, ownPhone);
      } catch {
        setOwnPhoneError(t('errors.phoneInvalid'));
        return;
      }
    }
    useAppStore.getState().completeSetupStep('family');
    router.push('/parent/setup/safe-word');
  };

  return (
    <SetupFrame
      step={3}
      title={t('setup.family.title')}
      actions={<BigButton testID="setup-continue" label={t('common.continue')} disabled={(contacts.data ?? []).length === 0} onPress={() => void next()} />}
    >
      <TextField
        label={t('setup.family.ownPhoneLabel')}
        value={ownPhone}
        onChangeText={(v) => {
          setOwnPhoneValue(v);
          setOwnPhoneError(null);
        }}
        keyboardType="phone-pad"
        autoComplete="tel"
        error={ownPhoneError}
      />
      <AppText variant="small" color={colors.textSoft}>
        {t('setup.family.ownPhoneHint')}
      </AppText>
      <AppText>{t('setup.family.body')}</AppText>
      <FamilyContactsEditor />
    </SetupFrame>
  );
}
