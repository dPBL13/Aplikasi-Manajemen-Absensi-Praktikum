/*
 * FR-16: Formulir pengajuan izin praktikan.
 * - Tidak ada kolom "Catatan / Bukti Tambahan".
 * - Hanya mengirim alasan, sessionId, participantId.
 * - participantName dan nim dibiarkan string kosong.
 */
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CURRENT_PRACTIKAN_ID } from '@/data/current-user';
import { useTheme } from '@/hooks/use-theme';
import { dataService } from '@/services';
import type { Permit, PracticumSession } from '@/types/domain';

interface LeaveRequestModalProps {
  visible: boolean;
  session: PracticumSession;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type SubmitResult = { ok: true; message: string; leave: Permit } | { ok: false; message: string };

/**
 * Pengganti sementara. Hanya memvalidasi dan membentuk objek Permit, TIDAK disimpan ke store.
 * TODO: ganti dengan dataService.submitPermit (belum tersimpan ke store, belum muncul di tab izin asisten).
 */
async function submitPermit(
  input: { sessionId: string; reason: string },
  session: PracticumSession,
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
      participantId: CURRENT_PRACTIKAN_ID,
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
    participantId: CURRENT_PRACTIKAN_ID,
    participantName: '',
    nim: '',
    courseName: session.courseName,
    reason,
    submittedAt: new Date().toISOString(),
    aiCategory: 'belum-diklasifikasi',
    aiConfidence: null,
    status: 'menunggu',
  };

  return {
    ok: true,
    message: 'Pengajuan izin tercatat.',
    leave,
  };
}

export function LeaveRequestModal({ visible, session, onClose, onSuccess }: LeaveRequestModalProps) {
  const theme = useTheme();

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
      const res = await submitPermit({ sessionId: session.id, reason }, session);
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: theme.overlay }]}
      >
        <ThemedView type="backgroundElement" style={[styles.sheet, { borderColor: theme.border }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.sheetHeader}>
              <ThemedText type="smallBold" style={styles.sheetTitle}>
                Form Pengajuan Izin
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup form"
                onPress={handleClose}
                hitSlop={8}
              >
                <ThemedText type="smallBold" themeColor="textSecondary">
                  ✕ Tutup
                </ThemedText>
              </Pressable>
            </View>

            <ThemedView type="surfaceAlt" style={[styles.sessionBox, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">{session.courseName}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {session.classGroup} · {session.dayLabel}, {session.dateLabel} ({session.startTime} -{' '}
                {session.endTime})
              </ThemedText>
            </ThemedView>

            {errorMsg ? (
              <ThemedView
                type="dangerBackground"
                style={[styles.errorBanner, { borderColor: theme.danger }]}
              >
                <ThemedText type="smallBold" style={{ color: theme.danger }}>
                  {errorMsg}
                </ThemedText>
              </ThemedView>
            ) : null}

            <View style={styles.section}>
              <View style={styles.labelRow}>
                <ThemedText type="smallBold">
                  Alasan Izin <ThemedText themeColor="danger">*</ThemedText>
                </ThemedText>
                <ThemedText type="code" themeColor="textSecondary">
                  {reason.trim().length} karakter
                </ThemedText>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  { backgroundColor: theme.highlight, borderColor: theme.border, color: theme.text },
                ]}
                placeholder="Tuliskan alasan izin Anda secara jelas (contoh: Mengalami demam tinggi dan perlu istirahat)..."
                placeholderTextColor={theme.textSecondary}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <ThemedView type="surfaceAlt" style={[styles.aiNoticeBox, { borderColor: theme.border }]}>
              <ThemedText type="code" themeColor="textSecondary" style={styles.aiNoticeText}>
                💡 Alasan izin akan dianalisis otomatis oleh sistem AI untuk memprediksi kategori izin
                sebagai informasi pendukung. Keputusan penerimaan atau penolakan tetap ditentukan oleh
                Asisten Praktikum.
              </ThemedText>
            </ThemedView>

            <View style={styles.actionRow}>
              <ActionButton
                label="Batal"
                onPress={handleClose}
                tone="secondary"
                disabled={isSubmitting}
                style={styles.actionBtn}
              />
              <ActionButton
                label={isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Izin'}
                onPress={handleSubmit}
                tone="primary"
                disabled={isSubmitting}
                style={styles.actionBtn}
              />
            </View>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scrollContent: { padding: Spacing.four, gap: Spacing.three },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontSize: 18 },
  sessionBox: { padding: Spacing.two + 4, borderRadius: Spacing.two, borderWidth: 1, gap: Spacing.half },
  errorBanner: { padding: Spacing.two, borderRadius: Spacing.one, borderWidth: 1 },
  section: { gap: Spacing.one },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textArea: {
    minHeight: 80,
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.two + 2,
    fontSize: 14,
  },
  aiNoticeBox: { padding: Spacing.two, borderRadius: Spacing.two, borderWidth: 1 },
  aiNoticeText: { fontSize: 12, lineHeight: 16 },
  actionRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  actionBtn: { flex: 1 },
});