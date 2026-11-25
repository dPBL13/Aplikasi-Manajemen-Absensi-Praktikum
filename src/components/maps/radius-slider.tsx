import { useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LAB_RADIUS_MAX, LAB_RADIUS_MIN } from '@/services/laboratory-contract';

type RadiusSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
};

type SliderState = {
  width: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
};

function updateFromX({ width, onChange, min, max, step }: SliderState, x: number) {
  if (width <= 0) return;
  const raw = min + (Math.min(width, Math.max(0, x)) / width) * (max - min);
  onChange(Math.min(max, Math.max(min, Math.round(raw / step) * step)));
}

const THUMB = 28;
const PREVIEW = 96;

/**
 * Slider radius 15–200 m (FR-29.3) tanpa dependency native, jadi tetap jalan di
 * Android/iOS/web. Dilengkapi tombol −/+ (aksesibilitas) dan pratinjau
 * lingkaran skala relatif terhadap radius maksimum.
 */
export function RadiusSlider({
  value,
  onChange,
  min = LAB_RADIUS_MIN,
  max = LAB_RADIUS_MAX,
  step = 5,
  error,
}: RadiusSliderProps) {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  // Dibuat ulang saat props berubah supaya handler tidak pernah membaca nilai usang.
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) =>
          updateFromX({ width: trackWidth, onChange, min, max, step }, event.nativeEvent.locationX),
        onPanResponderMove: (event) =>
          updateFromX({ width: trackWidth, onChange, min, max, step }, event.nativeEvent.locationX),
      }),
    [trackWidth, onChange, min, max, step],
  );

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const snap = (n: number) => clamp(Math.round(n / step) * step);
  const ratio = (clamp(value) - min) / (max - min);

  const previewSize = Math.max(12, PREVIEW * (clamp(value) / max));

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <ThemedText type="labelSm" themeColor="onSurface">
          Radius geofencing
        </ThemedText>
        <ThemedText type="monoSm" themeColor="onSurface">
          {Math.round(clamp(value))} m
        </ThemedText>
      </View>

      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kurangi radius"
          onPress={() => onChange(snap(value - step))}
          style={[styles.stepper, { backgroundColor: theme.surfaceAlt, borderColor: theme.accent }]}>
          <ThemedText type="titleMd" themeColor="onSurface">
            −
          </ThemedText>
        </Pressable>

        <View
          accessibilityRole="adjustable"
          accessibilityLabel="Radius geofencing"
          accessibilityValue={{ min, max, now: Math.round(clamp(value)), text: `${Math.round(clamp(value))} meter` }}
          style={styles.trackArea}
          onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
          {...responder.panHandlers}>
          <View
            pointerEvents="none"
            style={[styles.track, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          />
          <View
            pointerEvents="none"
            style={[styles.fill, { backgroundColor: theme.accent, width: `${ratio * 100}%` }]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.thumb,
              {
                backgroundColor: theme.accent,
                borderColor: theme.backgroundElement,
                left: Math.max(0, ratio * trackWidth - THUMB / 2),
              },
            ]}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tambah radius"
          onPress={() => onChange(snap(value + step))}
          style={[styles.stepper, { backgroundColor: theme.surfaceAlt, borderColor: theme.accent }]}>
          <ThemedText type="titleMd" themeColor="onSurface">
            +
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.previewBox}>
        <View
          style={[
            styles.preview,
            {
              width: previewSize,
              height: previewSize,
              borderRadius: previewSize / 2,
              borderColor: theme.accent,
              backgroundColor: theme.surfaceAlt,
            },
          ]}
        />
      </View>

      <ThemedText type="bodySm" themeColor={error ? 'danger' : 'onSurfaceSecondary'}>
        {error ?? `Rentang ${min}–${max} m. Gedung bertingkat umumnya butuh radius lebih besar.`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.two },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepper: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackArea: { flex: 1, height: 44, justifyContent: 'center' },
  track: { height: 8, borderRadius: Radius.full, borderWidth: 1 },
  fill: { position: 'absolute', left: 0, height: 8, borderRadius: Radius.full },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    top: (44 - THUMB) / 2,
  },
  previewBox: { height: PREVIEW, alignItems: 'center', justifyContent: 'center' },
  preview: { borderWidth: 2 },
});
