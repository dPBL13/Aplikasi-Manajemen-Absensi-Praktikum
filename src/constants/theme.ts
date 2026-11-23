/**
 * Design tokens for the "Eclipse & Moss" theme.
 *
 * Source of truth: `stitch_praktikum_absensi_ui_redesign/` (all 15 screens share
 * the same token block). The app is intentionally dark-only: every screen uses
 * the eclipse canvas with cream moss surfaces.
 *
 * Do not hardcode hex colours in components. Add a semantic key here and read it
 * through `useTheme()`, `ThemedView`, or `ThemedText`.
 */

import '@/global.css';

/**
 * Primitive palette. These are the raw values from the stitched mockups.
 * Components should normally read semantic keys from `Colors`, not primitives.
 */
export const Palette = {
  /** Dark canvas family */
  eclipseCanvas: '#272757',
  eclipseDeep: '#0F0E47',
  eclipseMid: '#505081',
  eclipseMuted: '#8686AC',

  /** Cream surface family */
  mossCanvas: '#CBCBCB',
  mossSurface: '#FFFFE3',
  mossSurfaceElevated: '#CBCBCB',
  mossPrimary: '#586B7E',
  mossDeep: '#4A4A4A',

  /** Text */
  textOnDark: '#FFFFE3',
  textOnDarkMuted: '#CBCBCB',
  textPrimary: '#4A4A4A',
  textSecondary: '#4A4A4A',

  /** Status */
  statusActive: '#586B7E',
  statusPending: '#CBCBCB',
  statusCompleted: '#FFFFE3',
  statusAlert: '#E8C5BE',
  onStatusAlert: '#7A2E22',
  alertBorder: '#A84A3B',

  /** Disabled */
  disabled: '#CBCBCB',
  onDisabled: '#4A4A4A',
} as const;

/**
 * Semantic colours. Every key exists in both `light` and `dark` because the app
 * is dark-only — both maps resolve to the same eclipse theme so any legacy
 * `Colors.light` / `Colors.dark` read still lands on the new design.
 */
const Eclipse = {
  /** Default text on the dark canvas. */
  text: Palette.textOnDark,
  /** Muted text on the dark canvas. */
  textSecondary: Palette.textOnDarkMuted,

  /** App background (eclipse canvas). */
  background: Palette.eclipseCanvas,
  /** Cream card surface. Text on it must use `onSurface`. */
  backgroundElement: Palette.mossSurface,
  /** Header / tab bar / pressed canvas. */
  backgroundSelected: Palette.eclipseDeep,
  /** Inner elevated row on a cream card. */
  surfaceAlt: Palette.mossSurfaceElevated,
  /** Chips and selected controls on the dark canvas. */
  highlight: Palette.eclipseMid,
  /** Subtle borders on the dark canvas and around cream cards. */
  border: Palette.eclipseMuted,

  /** Interactive text on the dark canvas. */
  link: Palette.textOnDark,

  /** Primary action (moss primary). */
  accent: Palette.mossPrimary,
  /** Text/icon on the primary action. */
  accentText: Palette.mossSurface,
  /** Primary action pressed state. */
  accentPressed: Palette.mossDeep,

  /** Default text on a cream card. */
  onSurface: Palette.textPrimary,
  /** Muted text on a cream card. */
  onSurfaceSecondary: Palette.textSecondary,
  /** Text on an elevated row inside a cream card. */
  onSurfaceAlt: Palette.textPrimary,

  /** Secondary action surface + border + text. */
  secondarySurface: Palette.mossSurfaceElevated,
  secondaryBorder: Palette.mossDeep,
  secondaryText: Palette.mossDeep,

  /** Success feedback. */
  success: '#2F5D46',
  successBackground: '#DDEBDD',

  /** Danger / alert feedback (matches the mockup alert tokens). */
  danger: Palette.onStatusAlert,
  dangerBackground: Palette.statusAlert,
  dangerBorder: Palette.alertBorder,

  /** Disabled control. */
  disabled: Palette.disabled,
  onDisabled: Palette.onDisabled,

  /** Modal scrim. Low enough to keep the screen readable behind the sheet. */
  overlay: 'rgba(15, 14, 71, 0.48)',
} as const;

export const Colors = {
  light: Eclipse,
  dark: Eclipse,
} as const;

export type ThemeColor = keyof typeof Colors.light;

/**
 * Font families loaded in `src/app/_layout.tsx` via `expo-font`.
 * `display` is Red Hat Display; body/label is Commissioner; mono is Spline Sans Mono.
 */
export const Fonts = {
  display: 'RedHatDisplay_700Bold',
  displaySemiBold: 'RedHatDisplay_600SemiBold',
  body: 'Commissioner_400Regular',
  bodyMedium: 'Commissioner_500Medium',
  bodySemiBold: 'Commissioner_600SemiBold',
  bodyBold: 'Commissioner_700Bold',
  mono: 'SplineSansMono_500Medium',
} as const;

/** Type scale from the stitched designs (sizes, line heights, tracking). */
export const Typography = {
  displayMd: {
    fontFamily: Fonts.display,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  displayMdMobile: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.25,
  },
  headlineLg: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  headlineMd: {
    fontFamily: Fonts.display,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  titleMd: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyMd: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.1,
  },
  labelLg: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  labelSm: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.25,
  },
  monoSm: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

/**
 * Spacing scale (4px base). Legacy keys (`one`…`six`) are kept so existing
 * screens keep working while they are restyled screen-by-screen.
 */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  md: 12,
  three: 16,
  section: 20,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Corner radii from the stitched designs. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const BottomTabInset = 80;
export const MaxContentWidth = 800;
