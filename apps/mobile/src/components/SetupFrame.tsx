import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radii, spacing } from '@alt/tokens';
import { SETUP_STEPS } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';
import { Screen } from './Screen';

type Props = { step: number; title: string; children: ReactNode; actions: ReactNode };

/** "Ρύθμιση μαζί · 4 από 5" progress, a title, content, actions, and the never-asks footer on every step. */
export function SetupFrame({ step, title, children, actions }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const total = SETUP_STEPS.length;
  return (
    <Screen
      footer={
        <>
          {actions}
          <AppText variant="small" color={colors.textSoft} center>
            {t('setup.footer')}
          </AppText>
        </>
      }
    >
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: total, now: step }}
        accessibilityLabel={t('setup.progress', { current: step, total })}
        style={{ gap: spacing.xs }}
      >
        <AppText variant="bodyStrong" color={colors.textSoft}>
          {t('setup.progress', { current: step, total })}
        </AppText>
        <View style={{ height: 10, borderRadius: radii.pill, backgroundColor: colors.borderSoft, overflow: 'hidden' }}>
          <View style={{ width: `${(step / total) * 100}%`, height: '100%', backgroundColor: colors.primary }} />
        </View>
      </View>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </Screen>
  );
}
