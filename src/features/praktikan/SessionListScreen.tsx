import { EmptyState } from '@/components/empty-state';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { findSessionParticipant, sessionsForParticipant } from '@/services/selectors';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useCurrentPraktikan } from './use-current-praktikan';

type StatusFilter = 'semua' | 'berlangsung' | 'belum-dibuka' | 'selesai';

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'berlangsung', label: 'Berlangsung' },
  { value: 'belum-dibuka', label: 'Belum Dibuka' },
  { value: 'selesai', label: 'Selesai' },
];

interface SessionListScreenProps {
  onSelect: (sessionId: string) => void;
}

export function SessionListScreen({ onSelect }: SessionListScreenProps) {
  const theme = useTheme();
  const data = useAppData();
  const currentUser = useCurrentPraktikan();
  const CURRENT_PRACTIKAN_ID = currentUser.id;
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');

  useEffect(() => {
    setLoading(false);
  }, []);

  const sessions = sessionsForParticipant(data, CURRENT_PRACTIKAN_ID);
  const permits = data.permits.filter((p) => p.participantId === CURRENT_PRACTIKAN_ID);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (statusFilter !== 'semua' && session.status !== statusFilter) return false;
      return true;
    });
  }, [sessions, statusFilter]);

  if (loading) {
    return <EmptyState title="Memuat jadwal praktikum..." />;
  }

  if (filteredSessions.length === 0) {
    return (
      <EmptyState
        title="Tidak Ada Sesi Praktikum"
        hint={
          statusFilter !== 'semua'
            ? `Tidak ada sesi dengan status "${statusFilter}". Tekan tombol di bawah untuk menampilkan semua sesi.`
            : 'Belum ada jadwal sesi praktikum yang berkaitan dengan Anda saat ini.'
        }
        actionLabel={statusFilter !== 'semua' ? 'Tampilkan Semua Sesi' : undefined}
        onAction={statusFilter !== 'semua' ? () => setStatusFilter('semua') : undefined}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ThemedView type="surfaceAlt" style={[styles.filterPanel, { borderColor: theme.border }]}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.filterTitle}>
          Filter Status Sesi:
        </ThemedText>
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setStatusFilter(opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? theme.backgroundSelected : theme.backgroundElement,
                    borderColor: isActive ? theme.link : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: isActive ? theme.link : theme.text, fontWeight: isActive ? '700' : '500' }}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const me = findSessionParticipant(item, CURRENT_PRACTIKAN_ID);
          const sudahHadir = Boolean(me?.checkInAt);
          const leaveRec = permits.find((l) => l.sessionId === item.id);
          return (
            <Pressable
              onPress={() => onSelect(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Buka detail sesi ${item.courseName}`}
              style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
            >
              <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleWrap}>
                    <ThemedText type="smallBold" style={styles.courseName}>
                      {item.courseName}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.classGroup} · {item.room}
                    </ThemedText>
                  </View>
                  <SessionStatusBadge status={item.status} />
                </View>
                <ThemedView type="highlight" style={styles.timeBadge}>
                  <ThemedText type="small" style={styles.timeText}>
                    📅 {item.dayLabel}, {item.dateLabel} ({item.startTime} - {item.endTime} WIB)
                  </ThemedText>
                </ThemedView>
                <View style={[styles.statusFooter, { borderTopColor: theme.border }]}>
                  {sudahHadir ? (
                    <ThemedText type="smallBold" themeColor="link">
                      ✓ Anda Sudah Hadir ({me?.checkInAt} WIB)
                    </ThemedText>
                  ) : leaveRec ? (
                    <ThemedText
                      type="smallBold"
                      themeColor={
                        leaveRec.status === 'diterima'
                          ? 'link'
                          : leaveRec.status === 'ditolak'
                          ? 'danger'
                          : 'textSecondary'
                      }
                    >
                      ℹ️ Izin Diajukan ({leaveRec.status.toUpperCase()})
                    </ThemedText>
                  ) : item.status === 'berlangsung' ? (
                    <ThemedText type="smallBold" themeColor="link">
                      ⚡ Sesi sedang berlangsung — Ketuk untuk presensi!
                    </ThemedText>
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.status === 'belum-dibuka'
                        ? '⏳ Menunggu sesi dibuka oleh Asprak'
                        : '🔒 Sesi telah selesai'}
                    </ThemedText>
                  )}
                  <ThemedText type="linkPrimary">Lihat Detail →</ThemedText>
                </View>
              </ThemedView>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  filterPanel: {
    padding: Spacing.three,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.one,
  },
  filterTitle: { fontSize: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  filterChip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  listContent: { padding: Spacing.three, gap: Spacing.two },
  cardPressable: { width: '100%' },
  cardPressed: { opacity: 0.88 },
  card: { padding: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.two },
  titleWrap: { flex: 1 },
  courseName: { fontSize: 14, lineHeight: 20 },
  timeBadge: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two, borderRadius: Spacing.one },
  timeText: { fontSize: 13 },
  statusFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: Spacing.two, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two, marginBottom: Spacing.one },
  cardTitle: { flexShrink: 1, fontWeight: '600' },
  pressed: { opacity: 0.75 },
});