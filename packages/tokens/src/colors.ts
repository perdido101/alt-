/**
 * ΑΛΤ! colour tokens. The only source of colour for mobile and web.
 * See docs/ARCHITECTURE.md §Design system for usage rules.
 */
export const palette = {
  teal700: '#0E5E5A',
  teal900: '#0A4441',
  teal50: '#EAF3F1',
  teal200: '#CFE3DF',
  /** ONLY for the "someone is asking me for money" button, family-alert actions and the logo "!". */
  ember: '#C2410C',
  emberShadow: '#8F2F08',
  /** Lighter ember used for the "!" on the teal app icon. */
  emberLight: '#F59E6B',
  ground: '#FBF8F2',
  sand: '#F6F3EC',
  line: '#D8D2C6',
  ink: '#1F2A2E',
  inkSoft: '#4A5A5E',
  white: '#FFFFFF',
  safe: '#1F7A3E',
  safeText: '#1F6B3A',
  safeBg: '#E3F2E6',
  caution: '#B45309',
  cautionText: '#8A4006',
  cautionBg: '#FDF0DC',
  danger: '#B42318',
  dangerBg: '#FDE8E4',
  callSurface: '#22302F',
} as const;

export type ColorScheme = {
  background: string;
  surface: string;
  surfaceCalm: string;
  border: string;
  borderSoft: string;
  text: string;
  textSoft: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  ember: string;
  emberShadow: string;
  onEmber: string;
  safe: string;
  safeText: string;
  safeBg: string;
  caution: string;
  cautionText: string;
  cautionBg: string;
  danger: string;
  dangerText: string;
  dangerBg: string;
  callSurface: string;
  onCallSurface: string;
};

/** Parent mode: always light, warm ground. */
export const parentLight: ColorScheme = {
  background: palette.ground,
  surface: palette.white,
  surfaceCalm: palette.teal50,
  border: palette.line,
  borderSoft: palette.teal200,
  text: palette.ink,
  textSoft: palette.inkSoft,
  primary: palette.teal700,
  primaryPressed: palette.teal900,
  onPrimary: palette.white,
  ember: palette.ember,
  emberShadow: palette.emberShadow,
  onEmber: palette.white,
  safe: palette.safe,
  safeText: palette.safeText,
  safeBg: palette.safeBg,
  caution: palette.caution,
  cautionText: palette.cautionText,
  cautionBg: palette.cautionBg,
  danger: palette.danger,
  dangerText: palette.danger,
  dangerBg: palette.dangerBg,
  callSurface: palette.callSurface,
  onCallSurface: palette.white,
};

/** Guardian mode + web, light. */
export const guardianLight: ColorScheme = {
  ...parentLight,
  background: palette.sand,
};

/** Guardian mode + web, dark. Derived from the brand hues; all text pairs meet WCAG AA (see tests). */
export const guardianDark: ColorScheme = {
  background: '#121A1B',
  surface: '#1B2627',
  surfaceCalm: '#173230',
  border: '#33413F',
  borderSoft: '#2A4A47',
  text: '#F1EEE7',
  textSoft: '#B9C4C2',
  primary: '#5FB3AA',
  primaryPressed: '#7CC5BD',
  onPrimary: '#0A1F1E',
  ember: '#E0611F',
  emberShadow: '#8F2F08',
  onEmber: '#1A0A02',
  safe: '#5BC27F',
  safeText: '#8FD9A6',
  safeBg: '#15301F',
  caution: '#E0A050',
  cautionText: '#F2C68A',
  cautionBg: '#33240F',
  danger: '#F07A6E',
  dangerText: '#F7A79F',
  dangerBg: '#3A1714',
  callSurface: palette.callSurface,
  onCallSurface: palette.white,
};

export const schemes = { parentLight, guardianLight, guardianDark } as const;
export type SchemeName = keyof typeof schemes;
