import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { FormField } from '@/components/form-field';
import { InfoRow } from '@/components/info-row';
import { ScreenScroll } from '@/components/screen-scroll';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ClassForm } from '@/features/asprak/class-form';
import { useTheme } from '@/hooks/use-theme';
import { dataService, useAppData } from '@/services';
import { findClass } from '@/services/selectors';
import { hasErrors, validateParticipantInput } from '@/services/validation';
import type { Participant } from '@/types/domain';

/** FR-05 + FR-06 — detail kelas, ubah/hapus kelas, kelola peserta. */
export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useAppData();
  const theme = useTheme();

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<Participant | null>(null);
  const [newName, setNewName] = useState('');
  const [newNim, setNewNim] = useState('');
  const [participantErrors, setParticipantErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const practicumClass = findClass(data, id);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = setTimeout(() => setFeedback(null), 5000);

    return () => clearTimeout(timer);
  }, [feedback]);

  if (!practicumClass) {
    return (
      <ScreenScroll>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">Kelas tidak ditemukan</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Kelas sudah dihapus atau tidak tersedia.
          </ThemedText>
          <ActionButton label="Kembali" tone="secondary" onPress={() => router.back()} />
        </ThemedView>
      </ScreenScroll>
    );
  }

  const sessions = data.sessions.filter((session) => session.classId === practicumClass.id);

  const addParticipant = async () => {
    const input = { name: newName, nim: newNim };
    const errors = validateParticipantInput(input);
    setParticipantErrors(errors);

    if (hasErrors(errors)) {
      return;
    }

    setBusy(true);
    const result = await dataService.addParticipant(practicumClass.id, input);
    setBusy(false);

    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.reason });
      return;
    }

    setNewName('');
    setNewNim('');
    setParticipantErrors({});
    setFeedback({ tone: 'success', message: 'Peserta berhasil ditambahkan ke kelas.' });
  };

  const confirmRemoveParticipant = async () => {
    if (!participantToRemove) {
      return;
    }

    const result = await dataService.removeParticipant(practicumClass.id, participantToRemove.id);
    setParticipantToRemove(null);

    setFeedback(
      result.ok
        ? { tone: 'success', message: 'Peserta berhasil dihapus dari kelas.' }
        : { tone: 'error', message: result.reason },
    );
  };

  const confirmDeleteClass = async () => {
    const result = await dataService.deleteClass(practicumClass.id);
    setIsDeleting(false);

    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.reason });
      return;
    }

    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: practicumClass.courseName }} />

      <ScreenScroll>
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.titleRow}>
            <ThemedText type="default" style={styles.titleText}>
              {practicumClass.courseName}
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              {practicumClass.code}
            </ThemedText>
          </View>

          <InfoRow label="Kelompok" value={practicumClass.classGroup} />
          <InfoRow label="Ruang" value={practicumClass.room} />
          <InfoRow label="Asprak" value={practicumClass.asprakName} />
          <InfoRow label="Peserta" value={`${practicumClass.participants.length} orang`} />
          <InfoRow label="Sesi" value={`${sessions.length} sesi`} />
          {practicumClass.description ? (
            <View style={[styles.noteBlock, { borderTopColor: theme.border }]}>
              <ThemedText type="smallBold">Deskripsi</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {practicumClass.description}
              </ThemedText>
            </View>
          ) : null}
        </ThemedView>

        {feedback ? <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} /> : null}

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="default" style={styles.sectionTitle}>
            {isEditing ? 'Ubah Informasi Kelas' : 'Aksi Kelas'}
          </ThemedText>

          {isEditing ? (
            <ClassForm
              initial={{
                courseName: practicumClass.courseName,
                code: practicumClass.code,
                classGroup: practicumClass.classGroup,
                room: practicumClass.room,
                description: practicumClass.description ?? '',
              }}
              submitLabel="Simpan perubahan"
              onSubmit={(input) => dataService.updateClass(practicumClass.id, input)}
              onSuccess={() => {
                setIsEditing(false);
                setFeedback({ tone: 'success', message: 'Informasi kelas berhasil diperbarui.' });
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <ActionButton
                label="Ubah Informasi Kelas"
                tone="secondary"
                onPress={() => setIsEditing(true)}
              />
              <ActionButton label="Hapus Kelas" tone="danger" onPress={() => setIsDeleting(true)} />
            </>
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.titleRow}>
            <ThemedText type="default" style={styles.sectionTitle}>
              Peserta Praktikum
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {practicumClass.participants.length} orang
            </ThemedText>
          </View>

          {practicumClass.participants.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Belum ada peserta. Tambahkan peserta di bawah.
            </ThemedText>
          ) : (
            practicumClass.participants.map((participant, index) => (
              <View
                key={participant.id}
                style={[
                  styles.participantRow,
                  index < practicumClass.participants.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border,
                  },
                ]}>
                <View style={styles.participantInfo}>
                  <ThemedText type="small">{participant.name}</ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">
                    {participant.nim}
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus ${participant.name} dari kelas`}
                  onPress={() => setParticipantToRemove(participant)}
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedText type="smallBold" style={{ color: theme.danger }}>
                    Hapus
                  </ThemedText>
                </Pressable>
              </View>
            ))
          )}

          <View style={[styles.addForm, { borderTopColor: theme.border }]}>
            <ThemedText type="smallBold">Tambah peserta</ThemedText>
            <FormField
              label="Nama peserta"
              value={newName}
              onChangeText={(value) => {
                setNewName(value);
                setParticipantErrors((previous) => ({ ...previous, name: '' }));
              }}
              placeholder="Nama lengkap"
              error={participantErrors.name}
            />
            <FormField
              label="NIM"
              value={newNim}
              onChangeText={(value) => {
                setNewNim(value);
                setParticipantErrors((previous) => ({ ...previous, nim: '' }));
              }}
              placeholder="Contoh: 240601221400001"
              keyboardType="number-pad"
              maxLength={15}
              error={participantErrors.nim}
            />
            <ActionButton
              label={busy ? 'Menambahkan…' : 'Tambah Peserta'}
              onPress={addParticipant}
              disabled={busy}
            />
          </View>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.titleRow}>
            <ThemedText type="default" style={styles.sectionTitle}>
              Sesi Kelas Ini
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {sessions.length} sesi
            </ThemedText>
          </View>

          {sessions.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Belum ada sesi untuk kelas ini.
            </ThemedText>
          ) : (
            sessions.map((session) => (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                accessibilityLabel={`Buka sesi ${session.dateLabel}`}
                onPress={() =>
                  router.push({ pathname: '/asprak/session/[id]', params: { id: session.id } })
                }
                style={({ pressed }) => [styles.sessionRow, pressed && styles.pressed]}>
                <View style={styles.participantInfo}>
                  <ThemedText type="small">
                    {session.dayLabel}, {session.dateLabel}
                  </ThemedText>
                  <ThemedText type="code" themeColor="textSecondary">
                    {session.startTime}–{session.endTime} · {session.room}
                  </ThemedText>
                </View>
                <SessionStatusBadge status={session.status} />
              </Pressable>
            ))
          )}
        </ThemedView>
      </ScreenScroll>

      <BottomSheetModal
        visible={participantToRemove !== null}
        title="Hapus peserta?"
        description="Peserta akan dihapus dari kelas ini beserta seluruh sesi dan pengajuan izinnya."
        onClose={() => setParticipantToRemove(null)}>
        <View style={styles.modalSummary}>
          <InfoRow label="Nama" value={participantToRemove?.name ?? '-'} />
          <InfoRow label="NIM" value={participantToRemove?.nim ?? '-'} />
        </View>
        <View style={styles.modalActions}>
          <ActionButton
            label="Batal"
            tone="secondary"
            onPress={() => setParticipantToRemove(null)}
            style={styles.modalButton}
          />
          <ActionButton
            label="Hapus Peserta"
            tone="danger"
            onPress={confirmRemoveParticipant}
            style={styles.modalButton}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={isDeleting}
        title="Hapus kelas?"
        description="Seluruh sesi, data kehadiran, dan pengajuan izin pada kelas ini akan dihapus permanen."
        onClose={() => setIsDeleting(false)}>
        <View style={styles.modalSummary}>
          <InfoRow label="Praktikum" value={practicumClass.courseName} />
          <InfoRow label="Kelas" value={practicumClass.classGroup} />
          <InfoRow label="Peserta" value={`${practicumClass.participants.length} orang`} />
          <InfoRow label="Sesi" value={`${sessions.length} sesi`} />
        </View>
        <View style={styles.modalActions}>
          <ActionButton
            label="Batal"
            tone="secondary"
            onPress={() => setIsDeleting(false)}
            style={styles.modalButton}
          />
          <ActionButton
            label="Hapus Kelas"
            tone="danger"
            onPress={confirmDeleteClass}
            style={styles.modalButton}
          />
        </View>
      </BottomSheetModal>
    </>
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
  noteBlock: {
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  participantInfo: {
    flexShrink: 1,
    gap: 2,
  },
  addForm: {
    marginTop: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  modalSummary: {
    gap: Spacing.two,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalButton: {
    flex: 1,
  },
});
