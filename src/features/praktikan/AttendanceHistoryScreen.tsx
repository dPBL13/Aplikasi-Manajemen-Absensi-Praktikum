import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { StatTile } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { CURRENT_PRACTIKAN_ID } from '@/data/current-user';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { findSessionParticipant, sessionsForParticipant } from '@/services/selectors';

/** FR-14 — riwayat kehadiran pribadi praktikan. */
export function AttendanceHistoryScreen() {
  const data = useAppData();
  const theme = useTheme();
  const sessions = sessionsForParticipant(data, CURRENT_PRACTIKAN_ID);
  const finished = sessions.filter((session) => session.status !== 'belum-dibuka');
  const attended = finished.filter(
    (session) => findSessionParticipant(session, CURRENT_PRACTIKAN_ID)?.checkInAt,
  ).length;
  const rate = finished.length === 0 ? 0 : Math.round((attended / finished.length) * 100);

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={sessions}
      keyExtractor={(session) => session.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.heading}>
            <ThemedText type="subtitle" style={styles.title}>
              Riwayat Kehadiran
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Rekap presensi Anda pada seluruh sesi yang diikuti.
            </ThemedText>
          </View>

          <View style={styles.statRow}>
            <StatTile label="Hadir" value={`${attended}`} hint="Sesi tercatat" />
            <StatTile label="Total Sesi" value={`${sessions.length}`} />
            <StatTile label="Persentase" value={`${rate}%`} hint="Dari sesi terbuka" />
          </View>
        </View>
      }
      renderItem={({ item }) => {
        const me = findSessionParticipant(item, CURRENT_PRACTIKAN_ID);
        const present = Boolean(me?.checkInAt);
        const label = present
          ? `Hadir · ${me?.checkInAt}`
          : item.status === 'selesai'
            ? 'Tidak hadir'
            : item.status === 'berlangsung'
              ? 'Belum presensi'
              : 'Sesi belum dibuka';
        const color = present
          ? theme.success
          : item.status === 'selesai'
            ? theme.danger
            : theme.textSecondary;

        return (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.info}>
              <ThemedText type="small">{item.courseName}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.dayLabel}, {item.dateLabel} · {item.startTime}–{item.endTime}
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={{ color }}>
              {label}
            </ThemedText>
          </ThemedView>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          title="Belum ada riwayat kehadiran"
          hint="Riwayat muncul setelah sesi pertama dijadwalkan."
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
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  info: {
    flexShrink: 1,
    gap: 2,
  },
});
