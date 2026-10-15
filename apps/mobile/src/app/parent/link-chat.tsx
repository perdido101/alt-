import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { House } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/theme/ThemeProvider';

/** Shows a one-time code the parent sends to ΑΛΤ! on Viber/WhatsApp to link that chat account. */
export default function LinkChat() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const code = useQuery({
    queryKey: ['channelCode'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('create_channel_link_code');
      if (error) throw error;
      return data as string;
    },
    staleTime: 25 * 60_000,
  });
  return (
    <Screen footer={<BigButton icon={House} label={t('common.home')} onPress={() => router.replace('/parent/home')} />}>
      <AppText variant="heading" accessibilityRole="header">
        {t('channels.linkTitle')}
      </AppText>
      <AppText>{t('channels.linkBody')}</AppText>
      <Card tone="calm" style={{ alignItems: 'center' }}>
        {code.data ? (
          <AppText variant="headingLarge" selectable accessibilityLabel={code.data.split('').join(' ')}>
            {code.data}
          </AppText>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </Card>
      <AppText variant="small" color={colors.textSoft}>
        {t('channels.linkExpires')}
      </AppText>
    </Screen>
  );
}
