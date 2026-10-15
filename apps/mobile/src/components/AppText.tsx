import { Text, type TextProps } from 'react-native';
import { useTheme, type TextVariant } from '@/theme/ThemeProvider';

type Props = TextProps & { variant?: TextVariant; color?: string; center?: boolean };

/** All text goes through here so sizes come from tokens and parent text never drops below 17px. */
export function AppText({ variant = 'body', color, center, style, ...rest }: Props) {
  const theme = useTheme();
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={2}
      style={[theme.text(variant), { color: color ?? theme.colors.text }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
