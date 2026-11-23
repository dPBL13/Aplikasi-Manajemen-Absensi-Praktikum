import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { StatTile } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { asprakOverview, summarizeAttendance } from '@/services/selectors';
import type { SessionStatus } from '@/types/domain';

type StatusFilter = SessionStatus | 'semua';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'belum-dibuka', label: 'Belum Dibuka' },
  { value: 'berlangsung', label: 'Berlangsung' },
  { value: 'selesai', label: 'Selesai' },
];

/** FR-13 — rekap kehadiran seluruh sesi beserta waktu presensi. */
export default function RecapScreen() {
  const data = useAppData();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<StatusFilter>('semua');
  const overview = asprakOverview(data);

  const sessions = useMemo(
    () => data.sessions.filter((session) => filter === 'semua' || session.status === filter),
    [data.sessions, filter],
  );

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={sessions}
      keyExtractor={(session) => session.id}
      contentContainerStyle={[styles.content, { paddingBottom: Spacing.three + insets.bottom }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.heading}>
            <ThemedText type="headlineLg" themeColor="text">
              Rekap Kehadiran
            </ThemedText>
            <ThemedText type="bodyMd" themeColor="textSecondary">
              Ringkasan presensi dan waktu check-in praktikan per sesi.
            </ThemedText>
          </View>

          <View style={styles.statRow}>
            <StatTile label="Sesi" value={String(overview.sessionCount)} />
            <StatTile
              label="Kehadiran"
              value={`${overview.attendanceRate}%`}
              hint="Rata-rata sesi terbuka"
            />
            <StatTile
              label="Izin Menunggu"
              value={String(overview.pendingPermitCount)}
              hint="Perlu keputusan"
            />
          </View>

          <View style={styles.chips}>
            {FILTERS.map((option) => {
              const isActive = filter === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setFilter(option.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: isActive ? theme.accent : theme.highlight,
                      borderColor: isActive ? theme.accent : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText
                    type="labelSm"
                    style={{ color: isActive ? theme.accentText : theme.text }}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const summary = summarizeAttendance(item);

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Lihat rekap ${item.courseName}`}
            onPress={() =>
              router.push({ pathname: '/asprak/session/[id]', params: { id: item.id } })
            }
            style={({ pressed }) => pressed && styles.pressed}>
            <Card>
              <View style={styles.cardHeader}>
                <ThemedText type="titleMd" themeColor="onSurface" style={styles.cardTitle}>
                  {item.courseName}
                </ThemedText>
                <ThemedText type="headlineMd" style={{ color: theme.accent }}>
                  {summary.rate}%
                </ThemedText>
              </View>

              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                {item.classGroup} · {item.dayLabel}, {item.dateLabel} · {item.startTime}–
                {item.endTime}
              </ThemedText>

              <View style={[styles.bar, { backgroundColor: theme.surfaceAlt }]}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${summary.rate}%`, backgroundColor: theme.accent },
                  ]}
                />
              </View>

              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                {summary.attended}/{summary.total} hadir · {summary.absent} belum presensi
              </ThemedText>
            </Card>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          title="Belum ada sesi pada filter ini"
          hint="Ubah filter status atau buat jadwal baru terlebih dahulu."
          actionLabel={filter === 'semua' ? undefined : 'Tampilkan semua'}
          onAction={filter === 'semua' ? undefined : () => setFilter('semua')}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.three,
  },
  heading: {
    gap: Spacing.one,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardTitle: {
    flexShrink: 1,
  },
  bar: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginVertical: Spacing.one,
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  pressed: {
    opacity: 0.8,
  },
});
