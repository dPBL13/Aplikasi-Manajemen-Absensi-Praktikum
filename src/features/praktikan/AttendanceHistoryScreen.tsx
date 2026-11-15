/*
 * FR-14: Praktikan dapat melihat riwayat kehadiran pribadi berdasarkan data yang tersimpan di Firestore.
 * Implementasi menampilkan ringkasan (hadir, izin, diterima, persentase) serta list sesi dengan status kehadiran.
 */
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CURRENT_PRACTIKAN_ID } from '@/data/current-user';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { findSessionParticipant, sessionsForParticipant } from '@/services/selectors';
import { FlatList, StyleSheet, View } from 'react-native';
import { AICard } from './components/AICard';
import { LeaveStatusBadge } from './components/LeaveStatusBadge';

export function AttendanceHistoryScreen() {
  const theme = useTheme();
  const data = useAppData();

  const sessions = sessionsForParticipant(data, CURRENT_PRACTIKAN_ID);
  const permits = (data.permits ?? []).filter((p) => p.participantId === CURRENT_PRACTIKAN_ID);

  const identity = data.classes
    .flatMap((c) => c.participants)
    .find((p) => p.id === CURRENT_PRACTIKAN_ID);

  const attended = sessions.filter((s) =>
    Boolean(findSessionParticipant(s, CURRENT_PRACTIKAN_ID)?.checkInAt),
  ).length;
  const approved = permits.filter((p) => p.status === 'diterima').length;
  const rate = sessions.length === 0 ? 0 : Math.round((attended / sessions.length) * 100);

  return (
    <View style={styles.container}>
      <ThemedView type="backgroundElement" style={[styles.summary, { borderColor: theme.border }]}>
        <ThemedText style={styles.name}>
          {identity ? `${identity.name} (${identity.nim})` : '-'}
        </ThemedText>
        <View style={styles.statsRow}>
          <ThemedText>Hadir: {attended}</ThemedText>
          <ThemedText>Izin: {permits.length}</ThemedText>
          <ThemedText>Diterima: {approved}</ThemedText>
          <ThemedText>Kehadiran: {rate}%</ThemedText>
        </View>
      </ThemedView>

      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Belum ada riwayat"
            hint="Riwayat muncul setelah kamu terdaftar di sesi praktikum."
          />
        }
        renderItem={({ item }) => {
          const me = findSessionParticipant(item, CURRENT_PRACTIKAN_ID);
          const leave = permits.find((p) => p.sessionId === item.id);
          const hadir = Boolean(me?.checkInAt);
          const statusText = hadir
            ? `Hadir pukul ${me?.checkInAt}`
            : item.status === 'selesai'
              ? 'Tidak hadir'
              : 'Belum presensi';

          return (
            <ThemedView
              type="backgroundElement"
              style={[styles.card, { borderColor: theme.border }]}>
              <ThemedText style={styles.title}>{item.courseName}</ThemedText>
              <ThemedText>
                {item.dateLabel} · {item.startTime}–{item.endTime}
              </ThemedText>
              <ThemedText>{statusText}</ThemedText>
              {leave ? (
                <View style={styles.leaveInfo}>
                  <LeaveStatusBadge status={leave.status} />
                  <ThemedText>Alasan: {leave.reason}</ThemedText>
                  {leave.decisionNote ? (
                    <ThemedText>Catatan asisten: {leave.decisionNote}</ThemedText>
                  ) : null}
                  <AICard
                    category={leave.aiCategory}
                    confidence={leave.aiConfidence}
                    model={leave.aiModel}
                  />
                </View>
              ) : null}
            </ThemedView>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  summary: { padding: 16, margin: 16, marginBottom: 8, borderRadius: 16, borderWidth: 1, gap: 8 },
  name: { fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  list: { padding: 16, paddingTop: 8, gap: 12 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  title: { fontWeight: '700' },
  leaveInfo: { gap: 8, marginTop: 4 },
});