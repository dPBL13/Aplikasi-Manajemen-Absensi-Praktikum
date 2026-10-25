/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Sage green palette used across the app.
 *
 * background  -> app background
 * surface     -> session cards
 * button      -> primary / additional buttons
 * mint, lime  -> alternating accents so the UI doesn't feel flat
 */
export const Palette = {
  background: '#87A878',
  surface: '#C7CCB9',
  button: '#B0BC98',
  mint: '#CAE2BC',
  lime: '#DBF9B8',
  ink: '#1F2A1B',
  inkSoft: '#3D4B34',
  border: '#6F8A5E',
  link: '#235C3A',
  danger: '#8F2D22',
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
    successBackground: '#33502A',
    danger: '#FFB4AB',
    dangerBackground: '#4B1D1A',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
