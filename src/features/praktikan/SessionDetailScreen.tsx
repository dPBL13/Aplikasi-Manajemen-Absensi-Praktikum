import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { EmptyState } from '@/components/empty-state';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { InfoRow } from '@/components/info-row';
import { ScreenScroll } from '@/components/screen-scroll';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CURRENT_PRACTIKAN_ID } from '@/data/current-user';
import { useAppData, dataService } from '@/services';
import { findSession, findSessionParticipant } from '@/services/selectors';

/**
 * FR-10 / FR-11 — presensi praktikan dengan validasi status sesi & presensi ganda.
 * Aturan validasi ada di data layer (`dataService.checkIn`), bukan di layar.
 */
export function SessionDetailScreen({
  sessionId,
  onBack,
}: {
  sessionId: string;
  onBack: () => void;
}) {
  const data = useAppData();
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [busy, setBusy] = useState(false);

  const session = findSession(data, sessionId);

  if (!session) {
    return (
      <ScreenScroll>
        <EmptyState
          title="Sesi tidak ditemukan"
          hint="Sesi mungkin sudah dihapus oleh asisten praktikum."
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

  let helper = '';

  if (present) {
    helper = `Kehadiran tercatat pada pukul ${me?.checkInAt}.`;
  } else if (session.status === 'belum-dibuka') {
    helper = 'Presensi dibuka setelah asisten praktikum membuka sesi.';
  } else if (session.status === 'selesai') {
    helper = 'Sesi sudah selesai, presensi terkunci.';
  }

  return (
    <ScreenScroll>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.titleRow}>
          <ThemedText type="default" style={styles.titleText}>
            {session.courseName}
          </ThemedText>
          <SessionStatusBadge status={session.status} />
        </View>

        <InfoRow label="Kelas" value={session.classGroup} />
        <InfoRow label="Hari" value={session.dayLabel} />
        <InfoRow label="Tanggal" value={session.dateLabel} />
        <InfoRow label="Waktu" value={`${session.startTime} – ${session.endTime}`} />
        <InfoRow label="Ruang" value={session.room} />
        <InfoRow label="Asprak" value={session.asprakName} />
        <InfoRow
          label="Status kehadiran"
          value={present ? `Hadir · ${me?.checkInAt}` : session.status === 'selesai' ? 'Tidak hadir' : 'Belum presensi'}
        />
      </ThemedView>

      {feedback ? <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} /> : null}

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="default" style={styles.sectionTitle}>
          Presensi
        </ThemedText>

        <ActionButton
          label={busy ? 'Mencatat…' : present ? '✓ Sudah Presensi' : 'Presensi Sekarang'}
          onPress={handleCheckIn}
          disabled={!canCheckIn || busy}
        />

        {helper ? (
          <ThemedText type="small" themeColor="textSecondary">
            {helper}
          </ThemedText>
        ) : null}
      </ThemedView>

      <ActionButton label="← Kembali ke daftar sesi" tone="secondary" onPress={onBack} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleText: {
    flexShrink: 1,
    fontWeight: 600,
  },
  sectionTitle: {
    fontWeight: 600,
  },
});
