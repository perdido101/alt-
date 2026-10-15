import { locales } from '@alt/i18n';
import { textScales, type TextScale } from '@alt/tokens';
import { spacing } from '@alt/tokens';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Choice } from '@/components/Choice';
import { SetupFrame } from '@/components/SetupFrame';
import { updateProfile } from '@/lib/api';
import { useAppStore } from '@/lib/store';

const sizeLabels: Record<TextScale, string> = {
  large: 'setup.language.sizeLarge',
  extraLarge: 'setup.language.sizeExtraLarge',
  huge: 'setup.language.sizeHuge',
};

/** Step 1: language and text size. Defaults: Greek, extra large. Changes apply immediately. */
export default function SetupLanguage() {
  const { t } = useTranslation();
  const { locale, setLocale, textScale, setTextScale, completeSetupStep } = useAppStore();

  return (
    <SetupFrame
      step={1}
      title={t('setup.language.title')}
      actions={
        <BigButton
          testID="setup-continue"
          label={t('common.continue')}
          onPress={() => {
            void updateProfile({ locale, text_scale: textScale }).catch(() => undefined);
            completeSetupStep('language');
            router.push('/parent/setup/calls');
          }}
        />
      }
    >
      <AppText variant="bodyStrong">{t('setup.language.languageLabel')}</AppText>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {locales.map((l) => (
          <Choice key={l} label={t(`languages.${l}`)} selected={locale === l} onPress={() => setLocale(l)} />
        ))}
      </View>
      <AppText variant="bodyStrong">{t('setup.language.textSizeLabel')}</AppText>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {(Object.keys(textScales) as TextScale[]).map((s) => (
          <Choice
            key={s}
            label={t(sizeLabels[s])}
            selected={textScale === s}
            onPress={() => setTextScale(s)}
            previewScale={textScales[s] / textScales[textScale]}
          />
        ))}
      </View>
      <Card tone="calm">
        <AppText>{t('setup.language.preview')}</AppText>
      </Card>
    </SetupFrame>
  );
}
