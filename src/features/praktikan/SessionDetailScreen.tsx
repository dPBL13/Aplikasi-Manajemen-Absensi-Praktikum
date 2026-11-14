import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AICard } from './components/AICard';
import { EmptyState } from './components/EmptyState';
import { FeedbackBanner, type FeedbackData } from './components/FeedbackBanner';
import { LeaveStatusBadge } from './components/LeaveStatusBadge';
import { LoadingView } from './components/LoadingView';
import { LeaveRequestModal } from './LeaveRequestModal';
import {
  checkIn,
  devReviewLeave,
  getCurrentPraktikan,
  subscribeAttendance,
  subscribeLeaves,
  subscribeSessions,
} from './services/praktikan-service';
import type { AttendanceRecord, LeaveRequest, PracticumSession } from './types';

interface SessionDetailScreenProps {
  sessionId: string;
  onBack: () => void;
}

export function SessionDetailScreen({ sessionId, onBack }: SessionDetailScreenProps) {
  const theme = useTheme();

  const [session, setSession] = useState<PracticumSession | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);

  const currentUser = getCurrentPraktikan();

  useEffect(() => {
    const unsubSessions = subscribeSessions((sessions) => {
      const found = sessions.find((s) => s.id === sessionId);
      setSession(found || null);
      setLoading(false);
    });

    const unsubAttendance = subscribeAttendance((records) => {
      const found = records.find((a) => a.sessionId === sessionId);
      setAttendance(found || null);
    });

    const unsubLeaves = subscribeLeaves((leaves) => {
      const found = leaves.find((l) => l.sessionId === sessionId);
      setLeave(found || null);
    });

    return () => {
      unsubSessions();
      unsubAttendance();
      unsubLeaves();
    };
  }, [sessionId]);

  const handleCheckIn = async () => {
    if (!session) return;
    setIsCheckingIn(true);
    setFeedback(null);

    try {
      const res = await checkIn(session.id);
      if (res.ok) {
        setFeedback({
          tone: 'success',
          message: res.message,
        });
      } else {
        setFeedback({
          tone: 'error',
          message: res.message,
        });
      }
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Terjadi kesalahan sistem saat melakukan presensi.',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (loading) {
    return <LoadingView message="Memuat detail sesi praktikum..." />;
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Sesi Tidak Ditemukan"
          hint="Sesi praktikum yang Anda pilih tidak tersedia atau telah dihapus."
          actionLabel="← Kembali ke Jadwal"
          onAction={onBack}
        />
      </View>
    );
  }

  const hasAttended = attendance?.status === 'hadir';
  const hasAcceptedLeave = leave?.status === 'diterima';

  // FR-22 & FR-10: Syarat presensi bisa dilakukan
  const canCheckIn =
    session.status === 'berlangsung' && !hasAttended && !hasAcceptedLeave;

  // Syarat pengajuan izin: belum hadir dan belum ada izin yang diterima
  const canRequestLeave = !hasAttended && !hasAcceptedLeave;

  let attendanceHelperText = '';
  if (hasAttended) {
    attendanceHelperText = `Anda telah tercatat hadir pada pukul ${attendance?.checkInAt} WIB.`;
  } else if (hasAcceptedLeave) {
    attendanceHelperText = 'Pengajuan izin Anda telah disetujui oleh Asisten Praktikum.';
  } else if (session.status === 'belum-dibuka') {
    attendanceHelperText = '⏳ Presensi belum dapat dilakukan karena sesi belum dibuka oleh Asisten Praktikum.';
  } else if (session.status === 'selesai') {
    attendanceHelperText = '🔒 Sesi praktikum telah ditutup. Presensi tidak lagi dapat dilakukan.';
  } else {
    attendanceHelperText = '⚡ Sesi sedang berlangsung! Silakan lakukan presensi sekarang.';
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Tombol Kembali (FR-25) */}
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Kembali ke daftar sesi"
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
        <ThemedText type="smallBold" themeColor="link">
          ← Kembali ke Jadwal Praktikum
        </ThemedText>
      </Pressable>

      {/* Banner Feedback Sukses/Gagal (FR-26) */}
      {feedback ? (
        <FeedbackBanner
          feedback={feedback}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      {/* Kartu Informasi Utama Sesi (FR-07, FR-09) */}
      <ThemedView
        type="backgroundElement"
        style={[styles.card, { borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" themeColor="textSecondary">
              Mata Kuliah Praktikum
            </ThemedText>
            <ThemedText type="smallBold" style={styles.courseTitle}>
              {session.courseName}
            </ThemedText>
          </View>
          <SessionStatusBadge status={session.status} />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Informasi Detail */}
        <View style={styles.metaGrid}>
          <DetailRow label="Kelompok Kelas" value={session.classGroup} />
          <DetailRow label="Ruangan Lab" value={session.room} />
          <DetailRow
            label="Jadwal Praktikum"
            value={`${session.dayLabel}, ${session.dateLabel}`}
          />
          <DetailRow
            label="Waktu Pelaksanaan"
            value={`${session.startTime} - ${session.endTime} WIB`}
          />
          <DetailRow label="Asisten Penanggung Jawab" value={session.asprakName} />
          {session.openedAt ? (
            <DetailRow label="Dibuka Pada" value={`${session.openedAt} WIB`} />
          ) : null}
          {session.closedAt ? (
            <DetailRow label="Ditutup Pada" value={`${session.closedAt} WIB`} />
          ) : null}
          {session.closingNote ? (
            <DetailRow label="Catatan Penutupan" value={session.closingNote} />
          ) : null}
        </View>
      </ThemedView>

      {/* Kartu Status Kehadiran Pribadi (FR-10, FR-11, FR-22) */}
      <ThemedView
        type="surfaceAlt"
        style={[styles.card, { borderColor: theme.border }]}>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          Status Kehadiran Anda
        </ThemedText>

        <ThemedView type="highlight" style={styles.statusBox}>
          <ThemedText type="smallBold">
            {hasAttended
              ? `✓ Hadir (${attendance?.checkInAt} WIB)`
              : leave
                ? `ℹ️ Status Izin: ${leave.status.toUpperCase()}`
                : session.status === 'selesai'
                  ? '✕ Tidak Hadir'
                  : 'Belum Melakukan Presensi'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Praktikan: {currentUser?.name} ({currentUser?.nim})
          </ThemedText>
        </ThemedView>

        {/* Helper status text */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.helperText}>
          {attendanceHelperText}
        </ThemedText>

        {/* Tombol Presensi (FR-10, FR-11, FR-22) */}
        <ActionButton
          label={
            isCheckingIn
              ? 'Mencatat Presensi...'
              : hasAttended
                ? '✓ Sudah Melakukan Presensi'
                : 'Presensi Sekarang'
          }
          onPress={handleCheckIn}
          disabled={!canCheckIn || isCheckingIn}
          tone={canCheckIn ? 'primary' : 'secondary'}
        />

        {/* Tombol Pengajuan Izin (FR-16) jika belum hadir */}
        {canRequestLeave && !leave ? (
          <View style={[styles.leavePrompt, { borderTopColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Berhalangan hadir karena sakit atau kendala mendesak?
            </ThemedText>
            <ActionButton
              label="Ajukan Izin Praktikum"
              onPress={() => setIsLeaveModalVisible(true)}
              tone="secondary"
            />
          </View>
        ) : null}
      </ThemedView>

      {/* Kartu Informasi Pengajuan Izin & Hasil AI (FR-21) */}
      {leave ? (
        <ThemedView
          type="backgroundElement"
          style={[styles.card, { borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Pengajuan Izin Sesi Ini
            </ThemedText>
            <LeaveStatusBadge status={leave.status} />
          </View>

          <DetailRow label="Alasan Izin" value={leave.reason} />
          {leave.notes ? <DetailRow label="Catatan Tambahan" value={leave.notes} /> : null}
          <DetailRow label="Diajukan Pada" value={leave.submittedAt} />

          {leave.reviewedBy ? (
            <ThemedView type="surfaceAlt" style={styles.reviewBox}>
              <ThemedText type="smallBold">
                Hasil Verifikasi Asisten:
              </ThemedText>
              <ThemedText type="small">
                Diverifikasi oleh {leave.reviewedBy} ({leave.reviewedAt})
              </ThemedText>
              {leave.reviewerNote ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Catatan: &quot;{leave.reviewerNote}&quot;
                </ThemedText>
              ) : null}
            </ThemedView>
          ) : null}

          {/* Hasil Klasifikasi AI sebagai Informasi Pendukung (FR-21) */}
          <AICard ai={leave.aiClassification} />

          {/* Dev Demo Simulator: uji verifikasi Asisten untuk demonstrasi status FR-21 */}
          {__DEV__ && leave.status === 'menunggu' ? (
            <ThemedView
              type="surfaceAlt"
              style={[styles.devBox, { borderColor: theme.border }]}>
              <ThemedText type="code" themeColor="textSecondary">
                🛠️ Mode Pengujian Demo (Simulasi Tindakan Asprak):
              </ThemedText>
              <View style={styles.devActions}>
                <ActionButton
                  label="Simulasi Disetujui Asprak"
                  onPress={() => {
                    devReviewLeave(leave.id, 'diterima', 'Surat keterangan dokter terverifikasi.');
                    setFeedback({ tone: 'success', message: 'Izin berhasil disetujui (simulasi Asprak).' });
                  }}
                  tone="primary"
                  style={styles.devBtn}
                />
                <ActionButton
                  label="Simulasi Ditolak Asprak"
                  onPress={() => {
                    devReviewLeave(leave.id, 'ditolak', 'Alasan tidak memenuhi kriteria dispensasi.');
                    setFeedback({ tone: 'error', message: 'Izin ditolak (simulasi Asprak).' });
                  }}
                  tone="danger"
                  style={styles.devBtn}
                />
              </View>
            </ThemedView>
          ) : null}
        </ThemedView>
      ) : null}

      {/* Modal Pengajuan Izin (FR-16) */}
      <LeaveRequestModal
        visible={isLeaveModalVisible}
        session={session}
        onClose={() => setIsLeaveModalVisible(false)}
        onSuccess={(msg) => {
          setFeedback({ tone: 'success', message: msg });
        }}
      />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.three,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
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
  courseTitle: {
    fontSize: 18,
    lineHeight: 24,
    marginTop: Spacing.half,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.half,
  },
  metaGrid: {
    gap: Spacing.one + 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  detailLabel: {
    fontSize: 13,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
  },
  statusBox: {
    padding: Spacing.two + 2,
    borderRadius: Spacing.two,
    gap: Spacing.half,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  leavePrompt: {
    marginTop: Spacing.two,
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  reviewBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    gap: Spacing.half,
  },
  devBox: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  devActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  devBtn: {
    flex: 1,
  },
});
