import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '@alt/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Props = { children: ReactNode; footer?: ReactNode; scroll?: boolean; contentStyle?: ViewStyle };

/** Safe-area screen with the mode's background, scrolling content and an optional pinned footer. */
export function Screen({ children, footer, scroll = true, contentStyle }: Props) {
  const { colors } = useTheme();
  const content = [{ padding: spacing.lg, gap: spacing.lg }, contentStyle];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, content]}>{children}</View>
        )}
        {footer ? <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
