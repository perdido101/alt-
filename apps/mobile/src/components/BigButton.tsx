import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import { radii, spacing, tapTarget } from '@alt/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'ember' | 'outline' | 'calm' | 'plain';
type Size = 'md' | 'lg' | 'hero';

type Props = {
  label: string;
  sub?: string;
  icon?: LucideIcon;
  variant?: ButtonVariant;
  size?: Size;
  align?: 'center' | 'left';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  testID?: string;
  style?: ViewStyle;
};

const heights: Record<Size, number> = { md: tapTarget.primaryMin, lg: tapTarget.primaryLarge, hero: tapTarget.hero };

/**
 * The one button for parent and guardian UIs: big, labelled, strong haptics.
 * Ember is reserved for "someone is asking me for money" and family-alert actions.
 */
export function BigButton({
  label,
  sub,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  align = 'center',
  onPress,
  disabled,
  loading,
  accessibilityHint,
  testID,
  style,
}: Props) {
  const { colors, mode } = useTheme();
  const palette = {
    primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary, border: colors.primary },
    ember: { bg: colors.ember, pressed: colors.emberShadow, fg: colors.onEmber, border: colors.ember },
    outline: { bg: colors.surface, pressed: colors.surfaceCalm, fg: colors.primary, border: colors.primary },
    calm: { bg: colors.surfaceCalm, pressed: colors.borderSoft, fg: colors.text, border: colors.borderSoft },
    plain: { bg: 'transparent', pressed: colors.surfaceCalm, fg: colors.primary, border: 'transparent' },
  }[variant];
  const parent = mode === 'parent';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}. ${sub}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={() => {
        void Haptics.impactAsync(parent ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={({ pressed }) => [
        {
          minHeight: parent ? heights[size] : Math.min(heights[size], 52),
          borderRadius: size === 'hero' ? radii.lg : radii.md,
          backgroundColor: pressed ? palette.pressed : palette.bg,
          borderWidth: variant === 'outline' ? 2.5 : 0,
          borderColor: palette.border,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: align === 'center' ? 'center' : 'flex-start',
          gap: spacing.md,
          opacity: disabled ? 0.5 : 1,
        },
        // Raised ember button: a solid shadow edge underneath, flattened when pressed.
        variant === 'ember' && { borderBottomWidth: pressed ? 0 : 6, borderBottomColor: colors.emberShadow },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {Icon && <Icon color={palette.fg} size={parent ? 34 : 24} strokeWidth={2.25} accessibilityElementsHidden importantForAccessibility="no" />}
          <View style={{ flexShrink: 1, alignItems: align === 'center' && !Icon ? 'center' : 'flex-start' }}>
            <AppText variant={parent ? (size === 'md' ? 'bodyStrong' : 'tileTitle') : 'gTitle'} color={palette.fg} center={align === 'center' && !Icon}>
              {label}
            </AppText>
            {sub ? (
              <AppText variant={parent ? 'small' : 'gBody'} color={palette.fg} style={{ opacity: 0.92 }}>
                {sub}
              </AppText>
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}
