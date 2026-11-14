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
import { useTheme } from '@/hooks/use-theme';
import { submitLeave } from './services/praktikan-service';
import type { PracticumSession } from './types';

interface LeaveRequestModalProps {
  visible: boolean;
  session: PracticumSession;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function LeaveRequestModal({
  visible,
  session,
  onClose,
  onSuccess,
}: LeaveRequestModalProps) {
  const theme = useTheme();

  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setReason('');
    setNotes('');
    setErrorMsg(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();

    // Validasi input form (FR-16)
    if (!trimmedReason) {
      setErrorMsg('Alasan izin wajib diisi.');
      return;
    }
    if (trimmedReason.length < 5) {
      setErrorMsg('Alasan izin terlalu singkat. Harap jelaskan minimal 5 karakter.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await submitLeave({
        sessionId: session.id,
        reason: trimmedReason,
        notes: notes.trim() || undefined,
      });

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
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <ThemedView
          type="backgroundElement"
          style={[styles.sheet, { borderColor: theme.border }]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <ThemedText type="smallBold" style={styles.sheetTitle}>
                Form Pengajuan Izin
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup form"
                onPress={handleClose}
                hitSlop={8}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  ✕ Tutup
                </ThemedText>
              </Pressable>
            </View>

            {/* Info Sesi */}
            <ThemedView
              type="surfaceAlt"
              style={[styles.sessionBox, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">{session.courseName}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {session.classGroup} · {session.dayLabel}, {session.dateLabel} ({session.startTime} - {session.endTime})
              </ThemedText>
            </ThemedView>

            {/* Error Banner jika ada */}
            {errorMsg ? (
              <ThemedView
                type="dangerBackground"
                style={[styles.errorBanner, { borderColor: theme.danger }]}>
                <ThemedText type="smallBold" style={{ color: theme.danger }}>
                  {errorMsg}
                </ThemedText>
              </ThemedView>
            ) : null}

            {/* Input Alasan */}
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
                  {
                    backgroundColor: theme.highlight,
                    borderColor: theme.border,
                    color: theme.text,
                  },
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

            {/* Input Catatan Opsional */}
            <View style={styles.section}>
              <ThemedText type="smallBold">Catatan / Bukti Tambahan (Opsional)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.highlight,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="Contoh: Surat dokter diserahkan saat masuk kembali..."
                placeholderTextColor={theme.textSecondary}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Penjelasan Pendukung AI */}
            <ThemedView
              type="surfaceAlt"
              style={[styles.aiNoticeBox, { borderColor: theme.border }]}>
              <ThemedText type="code" themeColor="textSecondary" style={styles.aiNoticeText}>
                💡 Alasan izin akan dianalisis otomatis oleh sistem AI untuk memprediksi kategori izin sebagai informasi pendukung. Keputusan penerimaan atau penolakan tetap ditentukan oleh Asisten Praktikum.
              </ThemedText>
            </ThemedView>

            {/* Tombol Aksi */}
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
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    borderRadius: Spacing.three,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
  },
  sessionBox: {
    padding: Spacing.two + 4,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.half,
  },
  errorBanner: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  section: {
    gap: Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 80,
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.two + 2,
    fontSize: 14,
  },
  input: {
    height: 44,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  aiNoticeBox: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  aiNoticeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionBtn: {
    flex: 1,
  },
});
