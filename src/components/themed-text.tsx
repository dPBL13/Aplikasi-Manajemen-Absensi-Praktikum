import { StyleSheet, Text, type TextProps } from 'react-native';

import { Typography, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextType =
  | 'default'
  | 'title'
  | 'small'
  | 'smallBold'
  | 'subtitle'
  | 'link'
  | 'linkPrimary'
  | 'code'
  | 'display'
  | 'displayMobile'
  | 'headlineLg'
  | 'headlineMd'
  | 'titleMd'
  | 'bodyMd'
  | 'bodySm'
  | 'labelLg'
  | 'labelSm'
  | 'monoSm';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = themeColor
    ? theme[themeColor]
    : type === 'linkPrimary'
      ? theme.link
      : theme.text;

  return <Text style={[{ color }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  /** Legacy aliases kept so existing screens keep rendering. */
  default: Typography.bodyMd,
  small: Typography.bodySm,
  smallBold: Typography.labelLg,
  subtitle: Typography.headlineLg,
  title: Typography.displayMd,
  link: Typography.bodyMd,
  linkPrimary: Typography.bodyMd,
  code: Typography.monoSm,

  /** New design-system names. */
  display: Typography.displayMd,
  displayMobile: Typography.displayMdMobile,
  headlineLg: Typography.headlineLg,
  headlineMd: Typography.headlineMd,
  titleMd: Typography.titleMd,
  bodyMd: Typography.bodyMd,
  bodySm: Typography.bodySm,
  labelLg: Typography.labelLg,
  labelSm: Typography.labelSm,
  monoSm: Typography.monoSm,
});
