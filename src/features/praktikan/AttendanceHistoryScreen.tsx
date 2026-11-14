import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AttendanceBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AICard } from './components/AICard';
import { EmptyState } from './components/EmptyState';
import { LeaveStatusBadge } from './components/LeaveStatusBadge';
import { LoadingView } from './components/LoadingView';
import {
  getCurrentPraktikan,
  subscribeAttendance,
  subscribeLeaves,
  subscribeSessions,
} from './services/praktikan-service';
import type { AttendanceRecord, LeaveRequest, PracticumSession } from './types';

type HistoryTab = 'semua' | 'hadir' | 'izin';

export function AttendanceHistoryScreen() {
  const theme = useTheme();

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [sessions, setSessions] = useState<PracticumSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HistoryTab>('semua');

  const currentUser = getCurrentPraktikan();

  useEffect(() => {
    const unsubSessions = subscribeSessions((s) => setSessions(s));
    const unsubAttendance = subscribeAttendance((records) => {
      setAttendances(records);
      setLoading(false);
    });
    const unsubLeaves = subscribeLeaves((l) => setLeaves(l));

    return () => {
      unsubSessions();
      unsubAttendance();
      unsubLeaves();
    };
  }, []);

  // Hitung ringkasan statistik
  const stats = useMemo(() => {
    const attendedCount = attendances.filter((a) => a.status === 'hadir').length;
    const leaveCount = leaves.length;
    const approvedLeaveCount = leaves.filter((l) => l.status === 'diterima').length;
    const totalEnrolled = sessions.filter((s) =>
      s.participants.some((p) => p.id === currentUser?.id),
    ).length;

    return {
      attendedCount,
      leaveCount,
      approvedLeaveCount,
      totalEnrolled,
    };
  }, [attendances, leaves, sessions, currentUser?.id]);

  if (loading) {
    return <LoadingView message="Memuat riwayat kehadiran..." />;
  }

  if (!currentUser) {
    return (
      <EmptyState
        title="Belum Masuk Sebagai Praktikan"
        hint="Silakan masuk untuk melihat riwayat kehadiran Anda."
        icon="🔒"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Kartu Ringkasan Statistik Kehadiran (FR-14) */}
      <ThemedView
        type="backgroundElement"
        style={[styles.summaryCard, { borderColor: theme.border }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Rekapitulasi Kehadiran Praktikan
        </ThemedText>
        <ThemedText type="smallBold" style={styles.studentName}>
          {currentUser.name} ({currentUser.nim})
        </ThemedText>

        <View style={styles.statsRow}>
          <ThemedView type="highlight" style={styles.statBox}>
            <ThemedText type="subtitle" style={styles.statNumber}>
              {stats.attendedCount}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Sesi Hadir
            </ThemedText>
          </ThemedView>

          <ThemedView type="surfaceAlt" style={styles.statBox}>
            <ThemedText type="subtitle" style={styles.statNumber}>
              {stats.leaveCount}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Izin Diajukan
            </ThemedText>
          </ThemedView>

          <ThemedView type="highlight" style={styles.statBox}>
            <ThemedText type="subtitle" style={styles.statNumber}>
              {stats.totalEnrolled}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Total Sesi
            </ThemedText>
          </ThemedView>
        </View>
      </ThemedView>

      {/* Segment Tab: Semua / Presensi Hadir / Pengajuan Izin */}
      <View style={styles.segmentWrap}>
        {(
          [
            { key: 'semua', label: 'Semua Riwayat' },
            { key: 'hadir', label: `Hadir (${stats.attendedCount})` },
            { key: 'izin', label: `Izin (${stats.leaveCount})` },
          ] as const
        ).map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isSelected
                    ? theme.backgroundSelected
                    : theme.surfaceAlt,
                  borderColor: isSelected ? theme.link : theme.border,
                },
              ]}>
              <ThemedText
                type="smallBold"
                style={{
                  color: isSelected ? theme.link : theme.text,
                }}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Konten Riwayat */}
      <FlatList
        data={['content']}
        keyExtractor={() => 'history-content'}
        contentContainerStyle={styles.listContent}
        renderItem={() => (
          <View style={styles.sectionsContainer}>
            {/* Bagian Catatan Presensi Hadir (FR-14) */}
            {activeTab === 'semua' || activeTab === 'hadir' ? (
              <View style={styles.section}>
                <ThemedText type="smallBold" style={styles.sectionHeader}>
                  Daftar Presensi Hadir
                </ThemedText>

                {attendances.length === 0 ? (
                  <EmptyState
                    title="Belum Ada Presensi Hadir"
                    hint="Catatan presensi akan muncul setelah Anda melakukan check-in pada sesi yang sedang berlangsung."
                    icon="🕒"
                  />
                ) : (
                  attendances.map((att) => (
                    <ThemedView
                      key={att.id}
                      type="backgroundElement"
                      style={[styles.historyCard, { borderColor: theme.border }]}>
                      <View style={styles.cardTop}>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold">{att.courseName}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {att.classGroup} · {att.room}
                          </ThemedText>
                        </View>
                        <AttendanceBadge attended={att.status === 'hadir'} />
                      </View>

                      <ThemedView type="highlight" style={styles.timeInfoBox}>
                        <ThemedText type="small" themeColor="link">
                          ✓ Presensi tercatat pada pukul {att.checkInAt ?? '-'} WIB
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {att.dateLabel} ({att.timeLabel})
                        </ThemedText>
                      </ThemedView>

                      {att.notes ? (
                        <ThemedText type="code" themeColor="textSecondary">
                          Catatan: {att.notes}
                        </ThemedText>
                      ) : null}
                    </ThemedView>
                  ))
                )}
              </View>
            ) : null}

            {/* Bagian Pengajuan Izin & Hasil AI (FR-21) */}
            {activeTab === 'semua' || activeTab === 'izin' ? (
              <View style={styles.section}>
                <ThemedText type="smallBold" style={styles.sectionHeader}>
                  Daftar Pengajuan Izin & Informasi Pendukung AI
                </ThemedText>

                {leaves.length === 0 ? (
                  <EmptyState
                    title="Belum Ada Pengajuan Izin"
                    hint="Anda belum pernah mengajukan izin praktikum."
                    icon="📄"
                  />
                ) : (
                  leaves.map((leave) => (
                    <ThemedView
                      key={leave.id}
                      type="backgroundElement"
                      style={[styles.historyCard, { borderColor: theme.border }]}>
                      <View style={styles.cardTop}>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold">{leave.sessionTitle}</ThemedText>
                          {leave.aiClassification?.predictedCategory ? (
                            <ThemedText type="small" themeColor="textSecondary">
                              Prediksi AI: {leave.aiClassification.predictedCategory}
                            </ThemedText>
                          ) : null}
                        </View>
                        <LeaveStatusBadge status={leave.status} />
                      </View>

                      <View style={styles.reasonBox}>
                        <ThemedText type="small" themeColor="textSecondary">
                          Alasan Izin:
                        </ThemedText>
                        <ThemedText type="small">&quot;{leave.reason}&quot;</ThemedText>
                        {leave.notes ? (
                          <ThemedText type="small" themeColor="textSecondary">
                            Bukti/Catatan: {leave.notes}
                          </ThemedText>
                        ) : null}
                        <ThemedText type="code" themeColor="textSecondary">
                          Diajukan: {leave.submittedAt}
                        </ThemedText>
                      </View>

                      {leave.reviewedBy ? (
                        <ThemedView type="surfaceAlt" style={styles.reviewedNotice}>
                          <ThemedText type="smallBold">
                            Diverifikasi oleh: {leave.reviewedBy}
                          </ThemedText>
                          <ThemedText type="small">
                            Status: {leave.status.toUpperCase()} ({leave.reviewedAt})
                          </ThemedText>
                          {leave.reviewerNote ? (
                            <ThemedText type="small" themeColor="textSecondary">
                              Catatan: &quot;{leave.reviewerNote}&quot;
                            </ThemedText>
                          ) : null}
                        </ThemedView>
                      ) : null}

                      {/* Hasil AI sebagai Informasi Pendukung (FR-21) */}
                      <AICard ai={leave.aiClassification} />
                    </ThemedView>
                  ))
                )}
              </View>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    padding: Spacing.three,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.one,
  },
  studentName: {
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  statBox: {
    flex: 1,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: Spacing.half,
  },
  statNumber: {
    fontSize: 22,
    lineHeight: 28,
  },
  segmentWrap: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  sectionsContainer: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    fontSize: 15,
  },
  historyCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  timeInfoBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    gap: Spacing.half,
  },
  reasonBox: {
    gap: Spacing.half,
  },
  reviewedNotice: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    gap: Spacing.half,
  },
});
