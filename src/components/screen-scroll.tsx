import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenScrollProps = ScrollViewProps & {
  children: ReactNode;
};

/**
 * Pembungkus halaman standar: padding responsif + lebar konten maksimum.
 * Dipakai semua layar baru agar konsisten di HP maupun desktop (FR-14).
 *
 * Padding bawah selalu ditambah safe-area inset agar konten terakhir tidak
 * tertutup gesture bar / tombol navigasi native.
 */
export function ScreenScroll({ children, contentContainerStyle, ...rest }: ScreenScrollProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const padding = width >= 768 ? Spacing.five : width < 600 ? Spacing.three : Spacing.four;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { padding, paddingBottom: padding + insets.bottom },
        contentContainerStyle,
      ]}
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
