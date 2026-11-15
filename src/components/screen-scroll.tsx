import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, type ScrollViewProps } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenScrollProps = ScrollViewProps & {
  children: ReactNode;
};

/**
 * Pembungkus halaman standar: padding responsif + lebar konten maksimum.
 * Dipakai semua layar baru agar konsisten di HP maupun desktop (FR-14).
 */
export function ScreenScroll({ children, contentContainerStyle, ...rest }: ScreenScrollProps) {
  const { width } = useWindowDimensions();
  const padding = width >= 768 ? Spacing.five : width < 600 ? Spacing.three : Spacing.four;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { padding }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...rest}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
});
