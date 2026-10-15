import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';

/** Timeline of calls, checks, alerts and quizzes: filled in from milestone 2 onwards. */
export default function GuardianHistory() {
  const { t } = useTranslation();
  return (
    <Screen>
      <AppText variant="gHeading" accessibilityRole="header">
        {t('guardian.nav.history')}
      </AppText>
      <Card tone="calm">
        <AppText variant="gBody">{t('guardian.history.empty')}</AppText>
      </Card>
    </Screen>
  );
}
