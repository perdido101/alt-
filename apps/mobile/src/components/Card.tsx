import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { radii, spacing } from '@alt/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function Card({ children, tone = 'surface', style }: { children: ReactNode; tone?: 'surface' | 'calm'; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: tone === 'calm' ? colors.surfaceCalm : colors.surface,
          borderColor: tone === 'calm' ? colors.borderSoft : colors.border,
          borderWidth: 1,
          borderRadius: radii.lg,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
