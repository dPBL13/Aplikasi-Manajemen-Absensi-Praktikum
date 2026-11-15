import { ActionButton } from '@/components/action-button';
import { EmptyState } from '@/components/empty-state';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { ScreenScroll } from '@/components/screen-scroll';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dataService, useAppData } from '@/services';
import { findSession, findSessionParticipant } from '@/services/selectors';
import type { Permit } from '@/types/domain';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AICard } from './components/AICard';
import { LeaveStatusBadge } from './components/LeaveStatusBadge';
import { LeaveRequestModal } from './LeaveRequestModal';
import { useCurrentPraktikan } from './use-current-praktikan';

/*
 * FR-10 & FR-11: Implementasi presensi (check‑in) untuk praktikan serta pencegahan presensi ganda.
 * - Tombol "Presensi Sekarang" hanya aktif bila sesi berstatus "berlangsung" dan praktikan belum hadir.
 * - handleCheckIn memanggil dataService.checkIn dan menampilkan FeedbackBanner.
 * - Logika tambahan memastikan tidak ada pemanggilan API bila sudah hadir.
 */
export function SessionDetailScreen({ sessionId, onBack }: { sessionId: string; onBack: () => void; }) {
  const theme = useTheme();
  const data = useAppData();
  const currentUser = useCurrentPraktikan();
  const CURRENT_PRACTIKAN_ID = currentUser.id;
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);

  const session = findSession(data, sessionId);
  if (!session) {
    return (
      <ScreenScroll>
        <EmptyState
          title="Sesi tidak ditemukan"
          hint="Sesi mungkin sudah dihapus oleh Asisten Praktikum."
          actionLabel="Kembali"
          onAction={onBack}
        />
      </ScreenScroll>
    );
  }

  const me = findSessionParticipant(session, CURRENT_PRACTIKAN_ID);
  const present = Boolean(me?.checkInAt);
  const canCheckIn = session.status === 'berlangsung' && !present;

  const handleCheckIn = async () => {
    setBusy(true);
    const result = await dataService.checkIn(session.id, CURRENT_PRACTIKAN_ID);
    setBusy(false);
    setFeedback(
      result.ok
        ? { tone: 'success', message: 'Presensi berhasil dicatat pada sesi ini.' }
        : { tone: 'error', message: result.reason },
    );
  };

  const leave = (data.permits ?? []).find(
    (p: Permit) => p.sessionId === session.id && p.participantId === CURRENT_PRACTIKAN_ID,
  ) as Permit | undefined;
  const hasAcceptedLeave = leave?.status === 'diterima';
  const canRequestLeave = !present && !hasAcceptedLeave;

  let helper = '';
  if (present) {
    helper = `Kehadiran tercatat pada pukul ${me?.checkInAt}.`;
  } else if (session.status === 'belum-dibuka') {
    helper = 'Presensi dibuka setelah Asisten Praktikum membuka sesi.';
  } else if (session.status === 'selesai') {
    helper = 'Sesi sudah selesai, presensi terkunci.';
  } else {
    helper = '⚡ Sesi sedang berlangsung! Silakan lakukan presensi sekarang.';
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Kembali ke daftar sesi"
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
      >
        <ThemedText type="smallBold" themeColor="link">← Kembali ke Jadwal Praktikum</ThemedText>
      </Pressable>

      {feedback && (
        <FeedbackBanner tone={feedback.tone} message={feedback.message} onDismiss={() => setFeedback(null)} />
      )}

      <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText type="small" themeColor="textSecondary">Mata Kuliah Praktikum</ThemedText>
            <ThemedText type="smallBold" style={styles.courseTitle}>{session.courseName}</ThemedText>
          </View>
          <SessionStatusBadge status={session.status} />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.metaGrid}>
          <DetailRow label="Kelompok Kelas" value={session.classGroup} />
          <DetailRow label="Ruangan Lab" value={session.room} />
          <DetailRow label="Jadwal Praktikum" value={`${session.dayLabel}, ${session.dateLabel}`} />
          <DetailRow label="Waktu Pelaksanaan" value={`${session.startTime} - ${session.endTime} WIB`} />
          <DetailRow label="Asisten Penanggung Jawab" value={session.asprakName} />
          {session.openedAt && <DetailRow label="Dibuka Pada" value={`${session.openedAt} WIB`} />}
          {session.closedAt && <DetailRow label="Ditutup Pada" value={`${session.closedAt} WIB`} />}
          {session.closingNote && <DetailRow label="Catatan Penutupan" value={session.closingNote} />}
        </View>
      </ThemedView>

      <ThemedView type="surfaceAlt" style={[styles.card, { borderColor: theme.border }]}>
        <ThemedText type="smallBold" style={styles.sectionTitle}>Status Kehadiran Anda</ThemedText>
        <ThemedView type="highlight" style={styles.statusBox}>
          <ThemedText type="smallBold">
            {present
              ? `✓ Hadir (${me?.checkInAt} WIB)`
              : leave
                ? `ℹ️ Status Izin: ${leave.status.toUpperCase()}`
                : session.status === 'selesai'
                  ? '✕ Tidak hadir'
                  : 'Belum Melakukan Presensi'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Praktikan: {me?.name ?? currentUser.name} ({me?.nim ?? currentUser.nim})
          </ThemedText>
        </ThemedView>
        <ThemedText type="small" themeColor="textSecondary" style={styles.helperText}>{helper}</ThemedText>
        <ActionButton
          label={busy ? 'Mencatat…' : present ? '✓ Sudah Presensi' : 'Presensi Sekarang'}
          onPress={handleCheckIn}
          disabled={!canCheckIn || busy}
          tone={canCheckIn ? 'primary' : 'secondary'}
        />
        {canRequestLeave && !leave && (
          <View style={[styles.leavePrompt, { borderTopColor: theme.border }]}>
            <ThemedText type="small" themeColor="textSecondary">Berhalangan hadir karena sakit atau kendala mendesak?</ThemedText>
            <ActionButton label="Ajukan Izin Praktikum" onPress={() => setIsLeaveModalVisible(true)} tone="secondary" />
          </View>
        )}
      </ThemedView>

      {leave && (
        <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>Pengajuan Izin Sesi Ini</ThemedText>
            <LeaveStatusBadge status={leave.status} />
          </View>
          <DetailRow label="Alasan Izin" value={leave.reason} />
          <DetailRow label="Diajukan Pada" value={leave.submittedAt} />
          {leave.decidedBy && (
            <ThemedView type="surfaceAlt" style={styles.reviewBox}>
              <ThemedText type="smallBold">Hasil Verifikasi Asisten:</ThemedText>
              <ThemedText type="small">Diverifikasi oleh {leave.decidedBy} ({leave.decidedAt})</ThemedText>
              {leave.decisionNote && (
                <ThemedText type="small" themeColor="textSecondary">Catatan: "{leave.decisionNote}"</ThemedText>
              )}
            </ThemedView>
          )}
          <AICard category={leave.aiCategory} confidence={leave.aiConfidence} model={leave.aiModel} />
        </ThemedView>
      )}

      <LeaveRequestModal
        visible={isLeaveModalVisible}
        session={session}
        onClose={() => setIsLeaveModalVisible(false)}
        onSuccess={(msg) => setFeedback({ tone: 'success', message: msg })}
      />
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText type="smallBold" style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.three },
  scrollContent: { padding: Spacing.three, gap: Spacing.three },
  backBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  pressed: { opacity: 0.7 },
  card: { padding: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.two },
  courseTitle: { fontSize: 18, lineHeight: 24, marginTop: Spacing.half },
  divider: { height: 1, marginVertical: Spacing.half },
  metaGrid: { gap: Spacing.one + 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.two },
  detailLabel: { fontSize: 13, flex: 1 },
  detailValue: { fontSize: 13, flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 16 },
  statusBox: { padding: Spacing.two + 2, borderRadius: Spacing.two, gap: Spacing.half },
  helperText: { fontSize: 13, lineHeight: 18 },
  leavePrompt: { marginTop: Spacing.two, borderTopWidth: 1, paddingTop: Spacing.two, gap: Spacing.two },
  reviewBox: { padding: Spacing.two, borderRadius: Spacing.one, gap: Spacing.half },
  devBox: { padding: Spacing.two, borderRadius: Spacing.two, borderWidth: 1, borderStyle: 'dashed', gap: Spacing.two, marginTop: Spacing.one },
  devActions: { flexDirection: 'row', gap: Spacing.two },
  devBtn: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two },
  titleText: { flexShrink: 1, fontWeight: '600' },
});