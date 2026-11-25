import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { useTheme } from '@/hooks/use-theme';
import type { UserLocationFix } from '@/hooks/use-user-location';

type UserLocationMarkerProps = {
  fix: UserLocationFix;
};

const SIZE = 56;

/**
 * Titik biru berdenyut posisi pengguna (JH-05). Pulse memakai Animated native
 * driver; `tracksViewChanges` tetap true karena isi marker beranimasi — marker
 * ini hanya satu buah, sehingga biayanya dapat diterima.
 */
export function UserLocationMarker({ fix }: UserLocationMarkerProps) {
  const theme = useTheme();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Marker
      coordinate={fix.coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      tracksViewChanges
      zIndex={10}
      accessibilityLabel="Posisi Anda"
      tappable={false}>
      <View style={styles.box}>
        <Animated.View
          style={[styles.pulse, { backgroundColor: theme.accent, opacity, transform: [{ scale }] }]}
        />
        <View style={[styles.dot, { backgroundColor: theme.accent, borderColor: theme.backgroundElement }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  box: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3 },
});
