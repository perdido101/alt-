export const fontFamily = {
  regular: 'Commissioner_400Regular',
  semibold: 'Commissioner_600SemiBold',
  extrabold: 'Commissioner_800ExtraBold',
  /** CSS stack for the web. */
  css: "'Commissioner', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
} as const;

export const fontWeight = { regular: '400', semibold: '600', extrabold: '800' } as const;

type TextStyle = { fontSize: number; lineHeight: number; weight: keyof typeof fontWeight };

/** Parent mode: nothing below 17px. Sizes are multiplied by the user's chosen text size and OS scaling. */
export const parentType = {
  heading: { fontSize: 32, lineHeight: 40, weight: 'extrabold' },
  headingLarge: { fontSize: 34, lineHeight: 42, weight: 'extrabold' },
  tileTitle: { fontSize: 25, lineHeight: 32, weight: 'extrabold' },
  body: { fontSize: 20, lineHeight: 28, weight: 'regular' },
  bodyStrong: { fontSize: 20, lineHeight: 28, weight: 'semibold' },
  small: { fontSize: 17, lineHeight: 24, weight: 'regular' },
} as const satisfies Record<string, TextStyle>;

export const guardianType = {
  heading: { fontSize: 24, lineHeight: 30, weight: 'extrabold' },
  title: { fontSize: 17, lineHeight: 24, weight: 'semibold' },
  body: { fontSize: 15, lineHeight: 22, weight: 'regular' },
} as const satisfies Record<string, TextStyle>;

export const webType = {
  hero: { fontSize: 56, lineHeight: 62, weight: 'extrabold' },
  ...guardianType,
} as const satisfies Record<string, TextStyle>;

export const PARENT_MIN_FONT_SIZE = 17;

/** Parent "text size" setting chosen in setup step 1. Default is extraLarge. */
export const textScales = { large: 1, extraLarge: 1.15, huge: 1.3 } as const;
export type TextScale = keyof typeof textScales;
