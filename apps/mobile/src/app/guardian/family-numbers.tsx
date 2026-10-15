import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { FamilyContactsEditor } from '@/components/FamilyContactsEditor';
import { Screen } from '@/components/Screen';

export default function FamilyNumbers() {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText variant="gHeading" accessibilityRole="header">
        {t('guardian.settings.familyNumbers')}
      </AppText>
      <AppText variant="gBody">{t('setup.family.body')}</AppText>
      <FamilyContactsEditor />
    </Screen>
  );
}
