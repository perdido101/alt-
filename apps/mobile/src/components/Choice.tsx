import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { radii, spacing, tapTarget } from '@alt/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

type Props = { label: string; selected: boolean; onPress: () => void; previewScale?: number; kind?: 'radio' | 'checkbox' };

/** A large radio or checkbox option (language, text size, relation, guardian/backup flags). */
export function Choice({ label, selected, onPress, previewScale, kind = 'radio' }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const style = theme.text('bodyStrong');
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: tapTarget.primaryMin,
        borderRadius: radii.md,
        borderWidth: selected ? 3 : 2,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.surfaceCalm : colors.surface,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <AppText variant="bodyStrong" style={previewScale ? { fontSize: style.fontSize * previewScale, lineHeight: style.lineHeight * previewScale } : undefined}>
        {label}
      </AppText>
      <View style={{ width: 32, alignItems: 'center' }}>
        {selected && <Check color={colors.primary} size={28} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}
