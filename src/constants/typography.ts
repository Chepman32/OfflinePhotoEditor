import { TextStyle } from 'react-native';

export const FONT_FAMILIES = {
  regular: 'Roboto-Regular',
  medium: 'Roboto-Medium',
  bold: 'Roboto-Bold',
} as const;

export const FONT_SIZES = {
  headline1: 24,
  headline2: 20,
  body1: 16,
  body2: 14,
  button: 14,
  caption: 12,
} as const;

export const TYPOGRAPHY: Record<keyof typeof FONT_SIZES, TextStyle> = {
  headline1: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.headline1,
    lineHeight: FONT_SIZES.headline1 * 1.2,
  },
  headline2: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.headline2,
    lineHeight: FONT_SIZES.headline2 * 1.2,
  },
  body1: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.body1,
    lineHeight: FONT_SIZES.body1 * 1.4,
  },
  body2: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.body2,
    lineHeight: FONT_SIZES.body2 * 1.4,
  },
  button: {
    fontFamily: FONT_FAMILIES.medium,
    fontSize: FONT_SIZES.button,
    lineHeight: FONT_SIZES.button * 1.2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caption: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.caption,
    lineHeight: FONT_SIZES.caption * 1.4,
  },
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY;
