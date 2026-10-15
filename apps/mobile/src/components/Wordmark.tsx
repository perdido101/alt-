import { Text, View } from 'react-native';
import { fontFamily, palette } from '@alt/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/** "ΑΛΤ!" in Commissioner 800 with letter-spacing; teal with an ember "!". */
export function Wordmark({ size = 28 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="ΑΛΤ!" style={{ flexDirection: 'row' }}>
      <Text style={{ fontFamily: fontFamily.extrabold, fontSize: size, letterSpacing: size * 0.08, color: colors.primary }}>
        ΑΛΤ
      </Text>
      <Text style={{ fontFamily: fontFamily.extrabold, fontSize: size, color: palette.ember }}>!</Text>
    </View>
  );
}
