import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SessionStatus } from '@/types/session';

import { EmptyState } from './components/EmptyState';
import { LoadingView } from './components/LoadingView';
import {
  getCurrentPraktikan,
  subscribeAttendance,
  subscribeLeaves,
  subscribeSessions,
} from './services/praktikan-service';
import type { AttendanceRecord, LeaveRequest, PracticumSession } from './types';

interface SessionListScreenProps {
  onSelect: (sessionId: string) => void;
}

type StatusFilter = 'semua' | SessionStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'berlangsung', label: 'Berlangsung' },
  { value: 'belum-dibuka', label: 'Belum Dibuka' },
  { value: 'selesai', label: 'Selesai' },
];

export function SessionListScreen({ onSelect }: SessionListScreenProps) {
  const theme = useTheme();

  const [sessions, setSessions] = useState<PracticumSession[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');

  const currentUser = getCurrentPraktikan();

  useEffect(() => {
    const unsubSessions = subscribeSessions((data) => {
      setSessions(data);
      setLoading(false);
    });
    const unsubAttendance = subscribeAttendance((data) => {
      setAttendances(data);
    });
    const unsubLeaves = subscribeLeaves((data) => {
      setLeaves(data);
    });

    return () => {
      unsubSessions();
      unsubAttendance();
      unsubLeaves();
    };
  }, []);

  // Filter sesi yang relevan dengan praktikan dan filter status
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Praktikan terdaftar pada sesi ini
      const isEnrolled = session.participants.some((p) => p.id === currentUser?.id);
      if (!isEnrolled) return false;

      if (statusFilter !== 'semua' && session.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [sessions, currentUser?.id, statusFilter]);

  if (loading) {
    return <LoadingView message="Memuat jadwal praktikum..." />;
  }

  if (!currentUser) {
    return (
      <EmptyState
        title="Belum Masuk Sebagai Praktikan"
        hint="Silakan masuk terlebih dahulu untuk melihat jadwal sesi praktikum Anda."
        icon="🔒"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Panel Filter Status */}
      <ThemedView
        type="surfaceAlt"
        style={[styles.filterPanel, { borderColor: theme.border }]}>
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
                    backgroundColor: isActive
                      ? theme.backgroundSelected
                      : theme.backgroundElement,
                    borderColor: isActive ? theme.link : theme.border,
                  },
                ]}>
                <ThemedText
                  type="small"
                  style={{
                    color: isActive ? theme.link : theme.text,
                    fontWeight: isActive ? '700' : '500',
                  }}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>

      {/* Daftar Sesi */}
      <FlatList
        data={filteredSessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="Tidak Ada Sesi Praktikum"
            hint={
              statusFilter !== 'semua'
                ? `Tidak ada sesi dengan status "${statusFilter}". Coba ubah filter di atas.`
                : 'Belum ada jadwal sesi praktikum yang berkaitan dengan Anda saat ini.'
            }
            actionLabel={statusFilter !== 'semua' ? 'Tampilkan Semua Sesi' : undefined}
            onAction={statusFilter !== 'semua' ? () => setStatusFilter('semua') : undefined}
          />
        }
        renderItem={({ item }) => {
          const attendanceRec = attendances.find((a) => a.sessionId === item.id);
          const hasAttended = attendanceRec?.status === 'hadir';
          const leaveRec = leaves.find((l) => l.sessionId === item.id);

          return (
            <Pressable
              onPress={() => onSelect(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Buka detail sesi ${item.courseName}`}
              style={({ pressed }) => [
                styles.cardPressable,
                pressed && styles.cardPressed,
              ]}>
              <ThemedView
                type="backgroundElement"
                style={[styles.card, { borderColor: theme.border }]}>
                {/* Header Kartu: Judul + Status Sesi */}
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

                {/* Info Jadwal */}
                <ThemedView type="highlight" style={styles.timeBadge}>
                  <ThemedText type="small" style={styles.timeText}>
                    📅 {item.dayLabel}, {item.dateLabel} ({item.startTime} - {item.endTime} WIB)
                  </ThemedText>
                </ThemedView>

                {/* Status Kehadiran Praktikan */}
                <View style={[styles.statusFooter, { borderTopColor: theme.border }]}>
                  {hasAttended ? (
                    <ThemedText type="smallBold" themeColor="link">
                      ✓ Anda Sudah Hadir ({attendanceRec?.checkInAt} WIB)
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
                      }>
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
  },
  filterPanel: {
    padding: Spacing.three,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.one,
  },
  filterTitle: {
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  filterChip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  listContent: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardPressable: {
    width: '100%',
  },
  cardPressed: {
    opacity: 0.88,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titleWrap: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    lineHeight: 22,
  },
  timeBadge: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
  },
  timeText: {
    fontSize: 13,
  },
  statusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
});
