/*
 * FR-14: Praktikan dapat melihat riwayat kehadiran pribadi berdasarkan data yang tersimpan di Firestore.
 * Implementasi menampilkan ringkasan (hadir, izin, diterima, persentase) serta list sesi dengan status kehadiran.
 */
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { StatTile } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { findSessionParticipant, sessionsForParticipant } from '@/services/selectors';
import { AICard } from './components/AICard';
import { LeaveStatusBadge } from './components/LeaveStatusBadge';
import { useCurrentPraktikan } from './use-current-praktikan';

export function AttendanceHistoryScreen() {
  const theme = useTheme();
  const data = useAppData();
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentPraktikan();
  const CURRENT_PRACTIKAN_ID = currentUser.id;

  const sessions = sessionsForParticipant(data, CURRENT_PRACTIKAN_ID, currentUser.nim);
  const permits = (data.permits ?? []).filter(
    (p) =>
      p.participantId === CURRENT_PRACTIKAN_ID ||
      (currentUser.nim !== '' && p.nim === currentUser.nim),
  );

  const identity = data.classes
    .flatMap((c) => c.participants)
    .find(
      (p) =>
        p.id === CURRENT_PRACTIKAN_ID ||
        (currentUser.nim !== '' && p.nim === currentUser.nim),
    );
  const displayName = identity?.name ?? currentUser.name;
  const displayNim = identity?.nim ?? currentUser.nim;

  const attended = sessions.filter((s) =>
    Boolean(findSessionParticipant(s, CURRENT_PRACTIKAN_ID, currentUser.nim)?.checkInAt),
  ).length;
  const approved = permits.filter((p) => p.status === 'diterima').length;
  const rate = sessions.length === 0 ? 0 : Math.round((attended / sessions.length) * 100);

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={sessions}
      keyExtractor={(s) => s.id}
      contentContainerStyle={[styles.content, { paddingBottom: Spacing.three + insets.bottom }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.heading}>
            <ThemedText type="headlineLg" themeColor="text">
              Riwayat Kehadiran
            </ThemedText>
            <ThemedText type="monoSm" themeColor="textSecondary">
              {displayName ? `${displayName} · ${displayNim}` : '-'}
            </ThemedText>
          </View>

          <Card>
            <View style={styles.statsRow}>
              <StatTile compact label="Hadir" value={String(attended)} />
              <StatTile compact label="Izin" value={String(permits.length)} />
              <StatTile compact label="Diterima" value={String(approved)} />
              <StatTile compact label="Kehadiran" value={`${rate}%`} />
            </View>
          </Card>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="Belum ada riwayat"
          hint="Riwayat muncul setelah kamu terdaftar di sesi praktikum."
        />
      }
      renderItem={({ item }) => {
        const me = findSessionParticipant(item, CURRENT_PRACTIKAN_ID, currentUser.nim);
        const leave = permits.find((p) => p.sessionId === item.id);
        const hadir = Boolean(me?.checkInAt);
        const statusText = hadir
          ? `Hadir pukul ${me?.checkInAt}`
          : item.status === 'selesai'
            ? 'Tidak hadir'
            : 'Belum presensi';

        return (
          <Card>
            <View style={styles.cardHeader}>
              <ThemedText type="titleMd" themeColor="onSurface" style={styles.cardTitle}>
                {item.courseName}
              </ThemedText>
              <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
                {item.dateLabel} · {item.startTime}–{item.endTime}
              </ThemedText>
            </View>

            <ThemedText
              type="labelLg"
              style={{ color: hadir ? theme.success : theme.onSurfaceSecondary }}>
              {statusText}
            </ThemedText>

            {leave ? (
              <View style={[styles.leaveInfo, { borderTopColor: theme.border }]}>
                <LeaveStatusBadge status={leave.status} />
                <ThemedText type="bodySm" themeColor="onSurface">
                  Alasan: {leave.reason}
                </ThemedText>
                {leave.decisionNote ? (
                  <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                    Catatan asisten: {leave.decisionNote}
                  </ThemedText>
                ) : null}
                <AICard
                  category={leave.aiCategory}
                  confidence={leave.aiConfidence}
                  model={leave.aiModel}
                />
              </View>
            ) : null}
          </Card>
        );
      }}
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  cardHeader: {
    gap: 2,
  },
  cardTitle: {
    flexShrink: 1,
  },
  leaveInfo: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
