import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BottomSheetModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

const SHEET_FADE_IN = 240;
const SHEET_TRAVEL = 28;

/**
 * Modal yang tampil sebagai bottom sheet di layar sempit dan dialog tengah
 * di layar lebar. Tidak memerlukan dependency tambahan.
 *
 * Scrim memudar lembut lewat `animationType="fade"` milik Modal, sementara
 * sheet naik sedikit saat dibuka — latar tidak tiba-tiba menghitam.
 */
export function BottomSheetModal({
  visible,
  title,
  description,
  onClose,
  children,
}: BottomSheetModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isWide = width >= 720;

  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(SHEET_TRAVEL));

  useEffect(() => {
    if (!visible) {
      return;
    }

    opacity.setValue(0);
    translateY.setValue(SHEET_TRAVEL);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: SHEET_FADE_IN,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: SHEET_FADE_IN + 40,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  const bottomPadding = isWide ? Spacing.four : Spacing.four + insets.bottom;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={[styles.backdrop, isWide ? styles.backdropCenter : styles.backdropBottom]}>
        <Animated.View
          style={[styles.scrim, { backgroundColor: theme.overlay, opacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Tutup dialog"
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheetWrapper, isWide && styles.sheetWrapperWide]}>
          <Animated.View style={[styles.sheetAnimated, { transform: [{ translateY }] }]}>
            <View
              accessibilityViewIsModal
              style={[
                styles.sheet,
                isWide ? styles.sheetWide : styles.sheetCompact,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  maxHeight: height * (isWide ? 0.82 : 0.9),
                  paddingBottom: bottomPadding,
                },
              ]}>
              {!isWide ? <View style={[styles.handle, { backgroundColor: theme.border }]} /> : null}

              <View style={styles.header}>
                <View style={styles.headerText}>
                  <ThemedText type="titleMd" themeColor="onSurface" style={styles.title}>
                    {title}
                  </ThemedText>
                  {description ? (
                    <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
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
                    { backgroundColor: theme.surfaceAlt },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="labelSm" themeColor="onSurface">
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
          </Animated.View>
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
  sheetAnimated: {
    width: '100%',
  },
  sheet: {
    width: '100%',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  sheetCompact: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  sheetWide: {
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: Radius.full,
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
    flexShrink: 1,
  },
  closeButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
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
