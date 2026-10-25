import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BottomSheetModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Modal yang tampil sebagai bottom sheet di layar sempit dan dialog tengah
 * di layar lebar. Tidak memerlukan dependency tambahan.
 */
export function BottomSheetModal({
  visible,
  title,
  description,
  onClose,
  children,
}: BottomSheetModalProps) {
  const { width, height } = useWindowDimensions();
  const theme = useTheme();
  const isWide = width >= 720;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isWide ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={[styles.backdrop, isWide ? styles.backdropCenter : styles.backdropBottom]}>
        <Pressable
          style={[styles.scrim, { backgroundColor: theme.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup dialog"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheetWrapper, isWide && styles.sheetWrapperWide]}>
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              isWide ? styles.sheetWide : styles.sheetCompact,
              {
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
                maxHeight: height * (isWide ? 0.82 : 0.9),
              },
            ]}>
            {!isWide ? <View style={[styles.handle, { backgroundColor: theme.border }]} /> : null}

            <View style={styles.header}>
              <View style={styles.headerText}>
                <ThemedText type="default" style={styles.title}>
                  {title}
                </ThemedText>
                {description ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {description}
                  </ThemedText>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup dialog"
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Tutup
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
  },
  backdropBottom: {
    justifyContent: 'flex-end',
  },
  backdropCenter: {
    justifyContent: 'center',
    padding: Spacing.four,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheetWrapper: {
    width: '100%',
    maxWidth: 640,
    alignItems: 'center',
  },
  sheetWrapperWide: {
    width: '100%',
    maxWidth: 560,
  },
  sheet: {
    width: '100%',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  sheetCompact: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: Spacing.five,
  },
  sheetWide: {
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontWeight: 700,
  },
  closeButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  body: {
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.72,
  },
});
