import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { Card } from '@/components/card';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { InfoRow } from '@/components/info-row';
import { ParticipantDetailModal } from '@/components/participant-detail-modal';
import { ScreenScroll } from '@/components/screen-scroll';
import { AttendanceBadge, PermitStatusBadge, SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { SessionForm } from '@/features/asprak/session-form';
import { useTheme } from '@/hooks/use-theme';
import { dataService, useAppData } from '@/services';
import { findSession, permitsForSession, summarizeAttendance } from '@/services/selectors';

type PendingAction = 'open' | 'close' | 'delete';

/** FR-08 — detail sesi, buka/tutup, ubah informasi, hapus. */
export default function AsprakSessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useAppData();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [closeNote, setCloseNote] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const session = findSession(data, id);
  const isWide = width >= 960;

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = setTimeout(() => setFeedback(null), 5000);

    return () => clearTimeout(timer);
  }, [feedback]);

  if (!session) {
    return (
      <ScreenScroll>
        <Card>
          <ThemedText type="headlineMd" themeColor="onSurface">
            Sesi tidak ditemukan
          </ThemedText>
          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            Sesi praktikum yang Anda cari tidak tersedia atau sudah dihapus.
          </ThemedText>
          <ActionButton label="Kembali ke jadwal" tone="secondary" onPress={() => router.back()} />
        </Card>
      </ScreenScroll>
    );
  }

  const summary = summarizeAttendance(session);
  const permits = permitsForSession(data, session.id);
  const pendingPermits = permits.filter((permit) => permit.status === 'menunggu');
  const selectedParticipant =
    session.participants.find((participant) => participant.id === selectedParticipantId) ?? null;

  const closeModal = () => {
    setPendingAction(null);
    setCloseNote('');
  };

  const confirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    if (pendingAction === 'delete') {
      const result = await dataService.deleteSession(session.id);
      closeModal();

      if (!result.ok) {
        setFeedback({ tone: 'error', message: result.reason });
        return;
      }

      router.back();
      return;
    }

    const result =
      pendingAction === 'open'
        ? await dataService.openSession(session.id)
        : await dataService.closeSession(session.id, closeNote);

    closeModal();

    setFeedback(
      result.ok
        ? {
            tone: 'success',
            message:
              pendingAction === 'open'
                ? 'Sesi berhasil dibuka. Praktikan sekarang dapat melakukan presensi.'
                : 'Sesi berhasil ditutup. Presensi baru tidak dapat dilakukan.',
          }
        : { tone: 'error', message: result.reason },
    );
  };

  const modalTitle =
    pendingAction === 'delete'
      ? 'Hapus sesi praktikum?'
      : pendingAction === 'close'
        ? 'Tutup sesi praktikum?'
        : 'Buka sesi praktikum?';

  const modalDescription =
    pendingAction === 'delete'
      ? 'Sesi, data kehadiran, dan pengajuan izin terkait akan dihapus permanen.'
      : pendingAction === 'close'
        ? 'Setelah sesi ditutup, praktikan tidak dapat melakukan presensi baru.'
        : 'Praktikan hanya dapat melakukan presensi ketika sesi berlangsung.';

  return (
    <>
      <Stack.Screen options={{ title: session.courseName }} />

      <ScreenScroll>
        <Card>
          <View style={styles.titleRow}>
            <ThemedText type="headlineMd" themeColor="onSurface" style={styles.titleText}>
              {session.courseName}
            </ThemedText>
            <SessionStatusBadge status={session.status} />
          </View>

          <InfoRow label="Kelas" value={session.classGroup} />
          <InfoRow label="Ruang" value={session.room} />
          <InfoRow label="Hari" value={session.dayLabel} />
          <InfoRow label="Tanggal" value={session.dateLabel} />
          <InfoRow label="Waktu" value={`${session.startTime} – ${session.endTime}`} />
          <InfoRow label="Asprak" value={session.asprakName} />
          {session.openedAt ? <InfoRow label="Dibuka" value={session.openedAt} /> : null}
          {session.closedAt ? <InfoRow label="Ditutup" value={session.closedAt} /> : null}

          {session.closingNote ? (
            <View style={[styles.noteBlock, { borderTopColor: theme.border }]}>
              <ThemedText type="labelSm" themeColor="onSurface">
                Catatan penutupan
              </ThemedText>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                {session.closingNote}
              </ThemedText>
            </View>
          ) : null}
        </Card>

        {feedback ? <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} /> : null}

        <Card>
          <ThemedText type="titleMd" themeColor="onSurface">
            Aksi Sesi
          </ThemedText>

          {isEditing ? (
            <SessionForm
              classes={data.classes}
              initial={{
                classId: session.classId,
                dayLabel: session.dayLabel,
                dateLabel: session.dateLabel,
                startTime: session.startTime,
                endTime: session.endTime,
                room: session.room,
              }}
              submitLabel="Simpan perubahan"
              onSubmit={(input) => dataService.updateSession(session.id, input)}
              onSuccess={() => {
                setIsEditing(false);
                setFeedback({ tone: 'success', message: 'Informasi sesi berhasil diperbarui.' });
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              {session.status === 'belum-dibuka' ? (
                <>
                  <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                    Buka sesi agar praktikan dapat melakukan presensi.
                  </ThemedText>
                  <ActionButton label="Buka Sesi" onPress={() => setPendingAction('open')} />
                </>
              ) : null}

              {session.status === 'berlangsung' ? (
                <>
                  <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                    Sesi sedang berlangsung. Tutup sesi setelah praktikum selesai.
                  </ThemedText>
                  <ActionButton
                    label="Tutup Sesi"
                    tone="danger"
                    onPress={() => setPendingAction('close')}
                  />
                </>
              ) : null}

              {session.status === 'selesai' ? (
                <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                  Sesi telah ditutup{session.closedAt ? ` pukul ${session.closedAt}` : ''}. Presensi
                  baru tidak dapat dilakukan.
                </ThemedText>
              ) : null}

              <ActionButton
                label="Ubah Informasi Sesi"
                tone="secondary"
                onPress={() => setIsEditing(true)}
              />
              <ActionButton
                label="Hapus Sesi"
                tone="danger"
                onPress={() => setPendingAction('delete')}
              />
            </>
          )}
        </Card>

        {permits.length > 0 ? (
          <Card>
            <View style={styles.titleRow}>
              <ThemedText type="titleMd" themeColor="onSurface">
                Pengajuan Izin
              </ThemedText>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                {pendingPermits.length} menunggu
              </ThemedText>
            </View>

            {permits.map((permit, index) => (
              <Pressable
                key={permit.id}
                accessibilityRole="button"
                accessibilityLabel={`Lihat pengajuan izin ${permit.participantName}`}
                onPress={() =>
                  router.push({ pathname: '/asprak/izin/[id]', params: { id: permit.id } })
                }
                style={({ pressed }) => [
                  styles.permitRow,
                  index < permits.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <View style={styles.participantInfo}>
                  <ThemedText type="bodyMd" themeColor="onSurface">
                    {permit.participantName}
                  </ThemedText>
                  <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
                    {permit.nim}
                  </ThemedText>
                </View>
                <PermitStatusBadge status={permit.status} />
              </Pressable>
            ))}

            <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
              Ketuk untuk membuka detail dan memutuskan pengajuan.
            </ThemedText>
          </Card>
        ) : null}

        <View style={[styles.split, isWide && styles.splitWide]}>
          <Card style={isWide && styles.cardSplit}>
            <View style={styles.titleRow}>
              <ThemedText type="titleMd" themeColor="onSurface">
                Pemantauan Kehadiran
              </ThemedText>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                {summary.attended}/{summary.total} hadir
              </ThemedText>
            </View>

            {session.participants.length === 0 ? (
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                Belum ada praktikan yang terdaftar pada sesi ini. Tambahkan peserta melalui detail
                kelas.
              </ThemedText>
            ) : (
              <>
                {session.participants.map((participant, index) => (
                  <Pressable
                    key={participant.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Lihat detail kehadiran ${participant.name}`}
                    onPress={() => setSelectedParticipantId(participant.id)}
                    style={({ pressed }) => [
                      styles.participantRow,
                      index < session.participants.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.participantInfo}>
                      <ThemedText type="bodyMd" themeColor="onSurface">
                        {participant.name}
                      </ThemedText>
                      <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
                        {participant.nim}
                      </ThemedText>
                    </View>

                    <View style={styles.participantMeta}>
                      <AttendanceBadge attended={Boolean(participant.checkInAt)} />
                      <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
                        {participant.checkInAt ?? '—'}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}

                <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                  Ketuk nama praktikan untuk melihat detail kehadiran.
                </ThemedText>
              </>
            )}
          </Card>

          <Card style={isWide && styles.cardSplit}>
            <ThemedText type="titleMd" themeColor="onSurface">
              Rekap Presensi
            </ThemedText>

            <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
              {summary.attended} dari {summary.total} praktikan telah melakukan presensi
              {summary.total > 0 ? ` (${summary.rate}%)` : ''}.
            </ThemedText>

            {summary.attended === 0 ? (
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                Belum ada presensi tercatat pada sesi ini.
              </ThemedText>
            ) : (
              <>
                {session.participants
                  .filter((participant) => participant.checkInAt)
                  .map((participant) => (
                    <View key={participant.id} style={styles.recapRow}>
                      <View style={styles.participantInfo}>
                        <ThemedText type="bodyMd" themeColor="onSurface">
                          {participant.name}
                        </ThemedText>
                        <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
                          {participant.nim}
                        </ThemedText>
                      </View>
                      <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
                        {participant.checkInAt}
                      </ThemedText>
                    </View>
                  ))}

                {summary.absent > 0 ? (
                  <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                    {summary.absent} praktikan belum melakukan presensi.
                  </ThemedText>
                ) : null}
              </>
            )}
          </Card>
        </View>
      </ScreenScroll>

      <BottomSheetModal
        visible={pendingAction !== null}
        title={modalTitle}
        description={modalDescription}
        onClose={closeModal}>
        <View style={styles.modalSummary}>
          <InfoRow label="Praktikum" value={session.courseName} />
          <InfoRow label="Kelas" value={session.classGroup} />
          <InfoRow label="Waktu" value={`${session.startTime} – ${session.endTime}`} />
          <InfoRow label="Kehadiran" value={`${summary.attended}/${summary.total} praktikan`} />
        </View>

        {pendingAction === 'close' ? (
          <View style={styles.field}>
            <ThemedText type="labelSm" themeColor="onSurface">
              Catatan sesi (opsional)
            </ThemedText>
            <TextInput
              value={closeNote}
              onChangeText={setCloseNote}
              placeholder="Contoh: praktikum selesai tepat waktu"
              placeholderTextColor={theme.onSurfaceSecondary}
              selectionColor={theme.accent}
              maxLength={160}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Catatan penutupan sesi"
              style={[
                styles.noteInput,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.accent,
                  color: theme.onSurface,
                },
              ]}
            />
            <ThemedText type="bodySm" themeColor="onSurfaceSecondary" style={styles.counter}>
              {closeNote.length}/160
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.modalActions}>
          <ActionButton label="Batal" tone="secondary" onPress={closeModal} style={styles.modalButton} />
          <ActionButton
            label={
              pendingAction === 'delete'
                ? 'Hapus Sesi'
                : pendingAction === 'close'
                  ? 'Tutup Sesi'
                  : 'Buka Sesi'
            }
            tone={pendingAction === 'open' ? 'primary' : 'danger'}
            onPress={confirmAction}
            style={styles.modalButton}
          />
        </View>
      </BottomSheetModal>

      <ParticipantDetailModal
        participant={selectedParticipant}
        session={session}
        onClose={() => setSelectedParticipantId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleText: {
    flexShrink: 1,
  },
  noteBlock: {
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  split: {
    width: '100%',
    gap: Spacing.three,
  },
  splitWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardSplit: {
    flex: 1,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  permitRow: {
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
  participantMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.65,
  },
  modalSummary: {
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  noteInput: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    ...Typography.bodyMd,
  },
  counter: {
    alignSelf: 'flex-end',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalButton: {
    flex: 1,
  },
});
