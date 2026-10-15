import { Tabs } from 'expo-router';
import { History, House, Settings, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@alt/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function GuardianTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSoft,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 64 },
        tabBarLabelStyle: { fontFamily: fontFamily.semibold, fontSize: 13 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('guardian.nav.home'), tabBarIcon: ({ color }) => <House color={color} size={24} /> }} />
      <Tabs.Screen name="history" options={{ title: t('guardian.nav.history'), tabBarIcon: ({ color }) => <History color={color} size={24} /> }} />
      <Tabs.Screen name="family" options={{ title: t('guardian.nav.family'), tabBarIcon: ({ color }) => <Users color={color} size={24} /> }} />
      <Tabs.Screen name="settings" options={{ title: t('guardian.nav.settings'), tabBarIcon: ({ color }) => <Settings color={color} size={24} /> }} />
    </Tabs>
  );
}
