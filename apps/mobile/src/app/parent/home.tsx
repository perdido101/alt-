import { router } from 'expo-router';
import { CircleCheck, HandCoins, KeyRound, MessageSquareText, PhoneIncoming, Volume2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { radii, spacing } from '@alt/tokens';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { greetingKey } from '@/lib/greeting';
import { readAloud } from '@/lib/speech';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Parent home. The same layout forever: wordmark + read-aloud, greeting, status, two tiles,
 * the big ember button, the safe-word card. No menus, tabs or settings.
 */
export default function ParentHome() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { displayName, locale } = useAppStore();
  const greeting = t(greetingKey(), { name: displayName ?? '' });

  const tiles = {
    check: { label: t('parent.home.checkMessage'), sub: t('parent.home.checkMessageSub') },
    called: { label: t('parent.home.justCalled'), sub: t('parent.home.justCalledSub') },
    money: { label: t('parent.home.askingMoney'), sub: t('parent.home.askingMoneySub') },
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark size={30} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.readAloud')}
          onPress={() =>
            readAloud(
              [greeting, t('parent.home.status'), ...Object.values(tiles).flatMap((x) => [x.label, x.sub]), t('parent.home.safeWordBody')],
              locale,
            )
          }
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 56, paddingHorizontal: spacing.sm, borderRadius: radii.md }}
        >
          <Volume2 color={colors.primary} size={28} />
          <AppText variant="bodyStrong" color={colors.primary}>
            {t('common.readAloud')}
          </AppText>
        </Pressable>
      </View>

      <View style={{ gap: spacing.xs }}>
        <AppText variant="heading" accessibilityRole="header">
          {greeting}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <CircleCheck color={colors.safe} size={30} strokeWidth={2.5} />
          <AppText variant="bodyStrong" color={colors.safeText}>
            {t('parent.home.status')}
          </AppText>
        </View>
      </View>

      <BigButton
        testID="home-check"
        icon={MessageSquareText}
        size="lg"
        align="left"
        label={tiles.check.label}
        sub={tiles.check.sub}
        onPress={() => router.push('/parent/check')}
      />
      <BigButton
        testID="home-called"
        icon={PhoneIncoming}
        size="lg"
        align="left"
        variant="outline"
        label={tiles.called.label}
        sub={tiles.called.sub}
        onPress={() => router.push({ pathname: '/parent/coming-soon', params: { feature: 'call' } })}
      />
      <BigButton
        testID="home-money"
        icon={HandCoins}
        size="hero"
        align="left"
        variant="ember"
        label={tiles.money.label}
        sub={tiles.money.sub}
        onPress={() => router.push({ pathname: '/parent/alert/confirm', params: { source: 'button' } })}
      />

      <Card tone="calm">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <KeyRound color={colors.primary} size={28} />
          <AppText variant="tileTitle">{t('parent.home.safeWordTitle')}</AppText>
        </View>
        <AppText>{t('parent.home.safeWordBody')}</AppText>
      </Card>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/parent/who-protects-me')}
        style={{ minHeight: 56, justifyContent: 'center', alignItems: 'center' }}
      >
        <AppText variant="bodyStrong" color={colors.primary} style={{ textDecorationLine: 'underline' }}>
          {t('consent.whoProtectsMe')}
        </AppText>
      </Pressable>
    </Screen>
  );
}
