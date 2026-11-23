/*
 * FR-16: Formulir pengajuan izin praktikan.
 * - Tidak ada kolom "Catatan / Bukti Tambahan".
 * - Hanya mengirim alasan, sessionId, participantId.
 * - participantName dan nim dibiarkan string kosong.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { FeedbackBanner } from '@/components/feedback-banner';
import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dataService } from '@/services';
import type { Permit, PracticumSession } from '@/types/domain';
import { useCurrentPraktikan } from './use-current-praktikan';

interface LeaveRequestModalProps {
  visible: boolean;
  session: PracticumSession;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type SubmitResult = { ok: true; message: string; leave: Permit } | { ok: false; message: string };

/**
 * Memakai dataService.submitPermit bila tersedia (Firestore + klasifikasi AI).
 * Bila tidak tersedia, jatuh ke objek lokal yang TIDAK disimpan ke store.
 */
async function submitPermit(
  input: { sessionId: string; reason: string },
  session: PracticumSession,
  user: { id: string; name: string; nim: string },
): Promise<SubmitResult> {
  const reason = input.reason.trim();

  if (!reason) return { ok: false, message: 'Alasan izin wajib diisi.' };
  if (reason.length < 5) {
    return { ok: false, message: 'Alasan izin terlalu singkat. Harap jelaskan minimal 5 karakter.' };
  }

  if (dataService.submitPermit) {
    const res = await dataService.submitPermit({
      sessionId: input.sessionId,
      reason,
      participantId: user.id,
      participantName: user.name,
      nim: user.nim,
    });
    if (res.ok && res.permit) {
      return {
        ok: true,
        message: 'Pengajuan izin berhasil dikirim dan dianalisis AI.',
        leave: res.permit,
      };
    }
    return { ok: false, message: !res.ok ? res.reason : 'Gagal mengirim pengajuan izin.' };
  }

  const leave: Permit = {
    id: `temp-permit-${Date.now()}`,
    sessionId: input.sessionId,
    classId: session.classId,
    participantId: user.id,
    participantName: user.name,
    nim: user.nim,
    courseName: session.courseName,
    reason,
    submittedAt: new Date().toISOString(),
    aiCategory: 'belum-diklasifikasi',
    aiConfidence: null,
    status: 'menunggu',
  };

  return {
    ok: true,
    message: 'Pengajuan izin tercatat (mode lokal, belum tersimpan ke server).',
    leave,
  };
}

export function LeaveRequestModal({ visible, session, onClose, onSuccess }: LeaveRequestModalProps) {
  const theme = useTheme();
  const currentUser = useCurrentPraktikan();

  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setReason('');
    setErrorMsg(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await submitPermit({ sessionId: session.id, reason }, session, currentUser);
      if (res.ok) {
        onSuccess(res.message);
        handleClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat mengirim pengajuan izin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      title="Form Pengajuan Izin"
      description="Jelaskan alasan ketidakhadiran Anda pada sesi ini."
      onClose={handleClose}>
      <View style={[styles.sessionBox, { backgroundColor: theme.surfaceAlt }]}>
        <ThemedText type="titleMd" themeColor="onSurface">
          {session.courseName}
        </ThemedText>
        <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
          {session.classGroup} · {session.dayLabel}, {session.dateLabel} ({session.startTime}–
          {session.endTime})
        </ThemedText>
      </View>

      {errorMsg ? (
        <FeedbackBanner tone="error" message={errorMsg} onDismiss={() => setErrorMsg(null)} />
      ) : null}

      <View style={styles.section}>
        <FormField
          label="Alasan izin"
          value={reason}
          onChangeText={setReason}
          placeholder="Contoh: mengalami demam tinggi dan perlu istirahat"
          multiline
          numberOfLines={3}
          accessibilityLabel="Alasan izin"
        />
        <ThemedText type="monoSm" themeColor="onSurfaceSecondary" style={styles.counter}>
          {reason.trim().length} karakter
        </ThemedText>
      </View>

      <View style={[styles.aiNoticeBox, { backgroundColor: theme.surfaceAlt }]}>
        <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
          Alasan izin akan dianalisis otomatis oleh sistem AI untuk memprediksi kategori izin sebagai
          informasi pendukung. Keputusan penerimaan atau penolakan tetap ditentukan oleh Asisten
          Praktikum.
        </ThemedText>
      </View>

      <View style={styles.actionRow}>
        <ActionButton
          label="Batal"
          onPress={handleClose}
          tone="secondary"
          disabled={isSubmitting}
          style={styles.actionBtn}
        />
        <ActionButton
          label={isSubmitting ? 'Mengirim…' : 'Kirim pengajuan izin'}
          onPress={handleSubmit}
          tone="primary"
          disabled={isSubmitting}
          style={styles.actionBtn}
        />
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sessionBox: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.half,
  },
  section: {
    gap: Spacing.one,
  },
  counter: {
    alignSelf: 'flex-end',
  },
  aiNoticeBox: {
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionBtn: {
    flex: 1,
  },
});
