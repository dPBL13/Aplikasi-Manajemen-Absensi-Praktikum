import React, { useEffect, useState, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import type { PushNotificationPayload } from '@/types/domain';

let Haptics: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics');
} catch {
  // Expo Go fallback
}

interface InAppToastProps {
  payload: PushNotificationPayload;
  onPress: (payload: PushNotificationPayload) => void;
  onDismiss: () => void;
}

export function InAppToast({ payload, onPress, onDismiss }: InAppToastProps) {
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(-120));
  const [opacity] = useState(() => new Animated.Value(0));

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [opacity, translateY, onDismiss]);

  useEffect(() => {
    // Haptic feedback ringan saat toast muncul
    Haptics?.impactAsync?.(Haptics?.ImpactFeedbackStyle?.Light ?? 'light')?.catch(() => {});

    // Animasi slide down & fade in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss 4 detik (sesuai spesifikasi SRS)
    const timer = setTimeout(() => {
      dismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, [dismiss, opacity, translateY]);

  const getBadgeLabel = () => {
    switch (payload.data.type) {
      case 'SESSION_OPENED':
        return 'SESI';
      case 'SCHEDULE_CHANGED':
        return 'JADWAL';
      case 'PERMIT_DECISION':
        return 'IZIN';
      default:
        return 'INFO';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          dismiss();
          onPress(payload);
        }}
        style={styles.contentCard}
      >
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{getBadgeLabel()}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {payload.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {payload.body}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            dismiss();
            onPress(payload);
          }}
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.actionButtonText}>Lihat</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeContainer: {
    marginRight: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.dark.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.dark.text,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontFamily: Fonts.displaySemiBold,
    fontSize: 13,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.accent,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.dark.backgroundSelected,
  },
});
