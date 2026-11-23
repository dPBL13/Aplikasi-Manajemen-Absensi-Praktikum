import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { ScreenScroll } from '@/components/screen-scroll';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dataService, useAppData } from '@/services';
import { findSession, findSessionParticipant } from '@/services/selectors';
import type { Permit } from '@/types/domain';
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
export function SessionDetailScreen({
  sessionId,
  onBack,
}: {
  sessionId: string;
  onBack: () => void;
}) {
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

  const me = findSessionParticipant(session, CURRENT_PRACTIKAN_ID, currentUser.nim);
  const present = Boolean(me?.checkInAt);
  const canCheckIn = session.status === 'berlangsung' && !present;

  const handleCheckIn = async () => {
    setBusy(true);
    const result = await dataService.checkIn(session.id, me?.id ?? CURRENT_PRACTIKAN_ID);
    setBusy(false);
    setFeedback(
      result.ok
        ? { tone: 'success', message: 'Presensi berhasil dicatat pada sesi ini.' }
        : { tone: 'error', message: result.reason },
    );
  };

  const leave = (data.permits ?? []).find(
    (p: Permit) =>
      p.sessionId === session.id &&
      (p.participantId === CURRENT_PRACTIKAN_ID ||
        p.participantId === me?.id ||
        (currentUser.nim !== '' && p.nim === currentUser.nim)),
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
    helper = 'Sesi sedang berlangsung. Silakan lakukan presensi sekarang.';
  }

  const statusLabel = present
    ? `Hadir (${me?.checkInAt} WIB)`
    : leave
      ? `Status izin: ${leave.status}`
      : session.status === 'selesai'
        ? 'Tidak hadir'
        : 'Belum melakukan presensi';

  return (
    <>
      <ScreenScroll>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke daftar sesi"
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <ThemedText type="labelLg" themeColor="textSecondary">
            ← Kembali ke jadwal praktikum
          </ThemedText>
        </Pressable>

        {feedback ? (
          <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} />
        ) : null}

        <Card>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <ThemedText type="labelSm" themeColor="onSurfaceSecondary">
                Mata kuliah praktikum
              </ThemedText>
              <ThemedText type="headlineMd" themeColor="onSurface">
                {session.courseName}
              </ThemedText>
            </View>
            <SessionStatusBadge status={session.status} />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <DetailRow label="Kelompok kelas" value={session.classGroup} />
          <DetailRow label="Ruangan lab" value={session.room} />
          <DetailRow label="Jadwal" value={`${session.dayLabel}, ${session.dateLabel}`} />
          <DetailRow
            label="Waktu pelaksanaan"
            value={`${session.startTime}–${session.endTime} WIB`}
          />
          <DetailRow label="Asisten penanggung jawab" value={session.asprakName} />
          {session.openedAt ? (
            <DetailRow label="Dibuka pada" value={`${session.openedAt} WIB`} />
          ) : null}
          {session.closedAt ? (
            <DetailRow label="Ditutup pada" value={`${session.closedAt} WIB`} />
          ) : null}
          {session.closingNote ? (
            <DetailRow label="Catatan penutupan" value={session.closingNote} />
          ) : null}
        </Card>

        <Card>
          <ThemedText type="titleMd" themeColor="onSurface">
            Status Kehadiran Anda
          </ThemedText>

          <View style={[styles.statusBox, { backgroundColor: theme.surfaceAlt }]}>
            <ThemedText
              type="labelLg"
              style={{ color: present ? theme.success : theme.onSurface }}>
              {statusLabel}
            </ThemedText>
            <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
              {me?.name ?? currentUser.name} ({me?.nim ?? currentUser.nim})
            </ThemedText>
          </View>

          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            {helper}
          </ThemedText>

          <ActionButton
            label={busy ? 'Mencatat…' : present ? 'Sudah presensi' : 'Presensi sekarang'}
            onPress={handleCheckIn}
            disabled={!canCheckIn || busy}
            tone={canCheckIn ? 'primary' : 'secondary'}
          />

          {canRequestLeave && !leave ? (
            <View style={[styles.leavePrompt, { borderTopColor: theme.border }]}>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                Berhalangan hadir karena sakit atau kendala mendesak?
              </ThemedText>
              <ActionButton
                label="Ajukan izin praktikum"
                onPress={() => setIsLeaveModalVisible(true)}
                tone="secondary"
              />
            </View>
          ) : null}
        </Card>

        {leave ? (
          <Card>
            <View style={styles.cardHeader}>
              <ThemedText type="titleMd" themeColor="onSurface">
                Pengajuan Izin Sesi Ini
              </ThemedText>
              <LeaveStatusBadge status={leave.status} />
            </View>
            <DetailRow label="Alasan izin" value={leave.reason} />
            <DetailRow label="Diajukan pada" value={leave.submittedAt} />
            {leave.decidedBy ? (
              <View style={[styles.reviewBox, { backgroundColor: theme.surfaceAlt }]}>
                <ThemedText type="labelSm" themeColor="onSurface">
                  Hasil verifikasi asisten
                </ThemedText>
                <ThemedText type="bodySm" themeColor="onSurface">
                  Diverifikasi oleh {leave.decidedBy} ({leave.decidedAt})
                </ThemedText>
                {leave.decisionNote ? (
                  <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                    Catatan: &ldquo;{leave.decisionNote}&rdquo;
                  </ThemedText>
                ) : null}
              </View>
            ) : null}
            <AICard
              category={leave.aiCategory}
              confidence={leave.aiConfidence}
              model={leave.aiModel}
            />
          </Card>
        ) : null}
      </ScreenScroll>

      <LeaveRequestModal
        visible={isLeaveModalVisible}
        session={session}
        onClose={() => setIsLeaveModalVisible(false)}
        onSuccess={(msg) => setFeedback({ tone: 'success', message: msg })}
      />
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="bodySm" themeColor="onSurfaceSecondary" style={styles.detailLabel}>
        {label}
      </ThemedText>
      <ThemedText type="bodyMd" themeColor="onSurface" style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  cardHeaderText: {
    flexShrink: 1,
    gap: Spacing.half,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  detailLabel: {
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  statusBox: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.one,
  },
  leavePrompt: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  reviewBox: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.one,
  },
});
