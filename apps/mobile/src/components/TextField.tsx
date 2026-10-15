import { TextInput, View, type TextInputProps } from 'react-native';
import { radii, spacing, tapTarget } from '@alt/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

type Props = Omit<TextInputProps, 'style'> & { label: string; error?: string | null };

/** Always-visible label (never placeholder-only), big touch target, error read out by screen readers. */
export function TextField({ label, error, ...input }: Props) {
  const theme = useTheme();
  const { colors, mode } = theme;
  const parent = mode === 'parent';
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant={parent ? 'bodyStrong' : 'gTitle'} nativeID={`${label}-label`}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityLabelledBy={`${label}-label`}
        placeholderTextColor={colors.textSoft}
        style={[
          theme.text(parent ? 'body' : 'gBody'),
          {
            minHeight: parent ? tapTarget.primaryMin : 48,
            borderWidth: 2,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radii.sm,
            backgroundColor: colors.surface,
            color: colors.text,
            paddingHorizontal: spacing.md,
          },
        ]}
        {...input}
      />
      {error ? (
        <AppText variant={parent ? 'small' : 'gBody'} color={colors.dangerText} accessibilityLiveRegion="polite" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
