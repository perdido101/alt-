import { Stack } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

/** Parent mode: no headers, no menus, no tabs. Every screen has its own way home. */
export default function ParentLayout() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false, contentStyle: { backgroundColor: colors.background } }} />;
}
