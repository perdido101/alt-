import { spacing } from '@alt/tokens';
import { CircleCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { BigButton } from './BigButton';
import { Card } from './Card';

/** One permission in setup step 2: what it is, why in plain words, and its state. */
export function PermissionRow({ title, why, done, onEnable }: { title: string; why: string; done: boolean; onEnable: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Card tone={done ? 'calm' : 'surface'}>
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText variant="small">{why}</AppText>
      {done ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }} accessible accessibilityLabel={`${title}: ${t('setup.calls.ready')}`}>
          <CircleCheck color={colors.safe} size={28} />
          <AppText variant="bodyStrong" color={colors.safeText}>
            {t('setup.calls.ready')}
          </AppText>
        </View>
      ) : (
        <BigButton label={t('setup.calls.enable')} onPress={onEnable} accessibilityHint={why} />
      )}
    </Card>
  );
}
