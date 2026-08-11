import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Cropsat design tokens — mirrors the admin web panel's theme (MOBILE_APP.md §5).
 * Everything visual in the app should come from here; no ad-hoc hex values.
 */

export const palette = {
  accent: '#2f7d32',
  accentDark: '#235e26',
  accentSoft: '#e6f2e6',
  ink: '#1c2a1d',
  mist: '#f6f8f5',
  line: '#e3e9e1',
  white: '#ffffff',

  /** Status chips */
  pendingBg: '#fef3c7',
  pendingFg: '#92400e',
  activeBg: '#e6f2e6',
  activeFg: '#235e26',
  rejectedBg: '#fee2e2',
  rejectedFg: '#b91c1c',

  /** Risk */
  riskLow: '#2f7d32',
  riskModerate: '#b45309',
  riskHigh: '#b91c1c',

  /** Map / imagery chrome */
  imagery: '#1d2b20',
} as const;

/** `ink` at a given opacity — used for secondary text and hairlines. */
export function ink(opacity: number): string {
  return `rgba(28, 42, 29, ${opacity})`;
}

/** White at a given opacity — used over imagery. */
export function onImagery(opacity: number): string {
  return `rgba(255, 255, 255, ${opacity})`;
}

export const colors = {
  ...palette,
  bg: palette.mist,
  surface: palette.white,
  border: palette.line,
  text: palette.ink,
  textMuted: ink(0.62),
  textFaint: ink(0.45),
} as const;

export const fonts = {
  /** Space Grotesk — titles, numbers, anything that should feel measured. */
  display: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  /** IBM Plex Sans — body copy, labels, form text. */
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodySemi: 'IBMPlexSans_600SemiBold',
} as const;

/** 4pt-based spacing scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 999,
} as const;

/** Type ramp. Titles use tight leading; labels are small, uppercase, tracked. */
export const type = {
  display: {
    fontFamily: fonts.displayBold,
    fontSize: 30,
    lineHeight: 34,
    color: colors.text,
    letterSpacing: -0.6,
  } as TextStyle,
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 26,
    color: colors.text,
    letterSpacing: -0.3,
  } as TextStyle,
  heading: {
    fontFamily: fonts.display,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  } as TextStyle,
  numeric: {
    fontFamily: fonts.displayBold,
    fontSize: 26,
    lineHeight: 28,
    color: colors.text,
    letterSpacing: -0.5,
  } as TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  } as TextStyle,
  bodyStrong: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  } as TextStyle,
  small: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  } as TextStyle,
  /** Small uppercase eyebrow labels — letter-spacing ~0.12–0.18em. */
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textFaint,
  } as TextStyle,
  badge: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    lineHeight: 14,
    letterSpacing: 0.3,
  } as TextStyle,
} as const;

/** Soft, low-contrast elevation. Cards read as paper on mist, not as pop-ups. */
export const shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1c2a1d',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 1 },
    default: {},
  })!,
  raised: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1c2a1d',
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 6 },
    default: {},
  })!,
} as const;

export const layout = {
  screenPadding: space.xl,
  cardRadius: radius.lg,
  controlRadius: radius.md,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;
