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
  background: '#87A878',
  surface: '#B8C1A5',
  button: '#A0B68C',
  mint: '#C2DDAB',
  lime: '#D1E8A5',
  ink: '#1A2420',
  inkSoft: '#394733',
  border: '#6A8455',
  link: '#2A6A44',
  danger: '#C54737',
  dangerSurface: '#F7DAD3',
} as const;

export const Colors = {
  light: {
    text: Palette.ink,
    background: Palette.background,
    backgroundElement: Palette.surface,
    backgroundSelected: Palette.button,
    surfaceAlt: Palette.mint,
    highlight: Palette.lime,
    textSecondary: Palette.inkSoft,
    border: Palette.border,
    link: Palette.link,
    accent: Palette.button,
    accentText: Palette.ink,
    success: Palette.link,
    successBackground: Palette.mint,
    danger: Palette.danger,
    dangerBackground: Palette.dangerSurface,
    overlay: 'rgba(31, 42, 27, 0.55)',
  },
  dark: {
    text: '#F3F8EE',
    background: '#3C5533',
    backgroundElement: '#557346',
    backgroundSelected: '#6C8F5C',
    surfaceAlt: '#48663D',
    highlight: '#4A6A3E',
    textSecondary: '#D2E3C6',
    border: '#88A87A',
    link: Palette.lime,
    accent: Palette.button,
    accentText: Palette.ink,
    success: Palette.lime,
    successBackground: '#3A6B37',
    danger: '#FFB4AB',
    dangerBackground: '#4B1D1A',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
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
