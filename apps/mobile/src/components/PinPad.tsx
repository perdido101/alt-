import { radii, spacing, tapTarget } from '@alt/tokens';
import * as Haptics from 'expo-haptics';
import { Delete } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './AppText';

/** Large number pad (keys ≥ 72px) with dots showing progress. */
export function PinPad({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const press = (d: string) => {
    if (disabled || value.length >= 4) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onChange(value + d);
  };
  const key = (label: string, onPress: () => void, a11y: string, content?: React.ReactNode) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 88,
        height: tapTarget.primaryLarge,
        borderRadius: radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.surfaceCalm : colors.surface,
        borderWidth: 2,
        borderColor: colors.border,
      })}
    >
      {content ?? <AppText variant="headingLarge">{label}</AppText>}
    </Pressable>
  );
  return (
    <View style={{ alignItems: 'center', gap: spacing.lg }}>
      <View accessible accessibilityLabel={t('parent.pin.entered', { count: value.length })} accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: spacing.md }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.primary, backgroundColor: i < value.length ? colors.primary : 'transparent' }} />
        ))}
      </View>
      {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row) => (
        <View key={row.join()} style={{ flexDirection: 'row', gap: spacing.md }}>
          {row.map((d) => key(d, () => press(d), t('parent.pin.digit', { digit: d })))}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ width: 88 }} />
        {key('0', () => press('0'), t('parent.pin.digit', { digit: '0' }))}
        {key('del', () => onChange(value.slice(0, -1)), t('parent.pin.delete'), <Delete color={colors.text} size={32} />)}
      </View>
    </View>
  );
}
