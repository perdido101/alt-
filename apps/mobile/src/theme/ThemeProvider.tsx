import {
  fontFamily,
  guardianDark,
  guardianLight,
  guardianType,
  parentLight,
  parentType,
  PARENT_MIN_FONT_SIZE,
  textScales,
  type ColorScheme,
  type TextScale,
} from '@alt/tokens';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

export type UiMode = 'parent' | 'guardian';

export type TextVariant =
  | 'heading'
  | 'headingLarge'
  | 'tileTitle'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'gHeading'
  | 'gTitle'
  | 'gBody';

type Theme = {
  mode: UiMode;
  colors: ColorScheme;
  dark: boolean;
  scale: number;
  text: (variant: TextVariant) => { fontSize: number; lineHeight: number; fontFamily: string };
};

const families = { regular: fontFamily.regular, semibold: fontFamily.semibold, extrabold: fontFamily.extrabold } as const;

function buildTheme(mode: UiMode, dark: boolean, textScale: TextScale): Theme {
  const scale = mode === 'parent' ? textScales[textScale] : 1;
  const colors = mode === 'parent' ? parentLight : dark ? guardianDark : guardianLight;
  return {
    mode,
    colors,
    dark: mode === 'guardian' && dark,
    scale,
    text: (variant) => {
      const def =
        variant === 'gHeading'
          ? guardianType.heading
          : variant === 'gTitle'
            ? guardianType.title
            : variant === 'gBody'
              ? guardianType.body
              : parentType[variant];
      const isParentVariant = !variant.startsWith('g');
      const fontSize = isParentVariant ? Math.max(PARENT_MIN_FONT_SIZE, Math.round(def.fontSize * scale)) : def.fontSize;
      return { fontSize, lineHeight: Math.round(def.lineHeight * (fontSize / def.fontSize)), fontFamily: families[def.weight] };
    },
  };
}

const ThemeContext = createContext<Theme>(buildTheme('parent', false, 'extraLarge'));

export function ThemeProvider({ mode, textScale, children }: { mode: UiMode; textScale: TextScale; children: ReactNode }) {
  const dark = useColorScheme() === 'dark';
  const theme = useMemo(() => buildTheme(mode, dark, textScale), [mode, dark, textScale]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
