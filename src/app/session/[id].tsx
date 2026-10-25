import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { InfoRow } from '@/components/info-row';
import { ParticipantDetailModal } from '@/components/participant-detail-modal';
import { AttendanceBadge, SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSessions } from '@/context/session-context';
import { useTheme } from '@/hooks/use-theme';

type PendingAction = 'open' | 'close';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession, openSession, closeSession } = useSessions();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [closeNote, setCloseNote] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  const session = getSession(id);
  const isWide = width >= 960;
  const contentPadding = width >= 768 ? Spacing.five : Spacing.four;

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = setTimeout(() => setFeedback(null), 5000);

    return () => clearTimeout(timer);
  }, [feedback]);

  if (!session) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { padding: contentPadding }]}>
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Sesi tidak ditemukan</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Sesi praktikum yang Anda cari tidak tersedia.
            </ThemedText>
          </ThemedView>
        </View>
      </ThemedView>
    );
  }

  const attendedParticipants = session.participants.filter((participant) => participant.checkInAt);
  const absentCount = session.participants.length - attendedParticipants.length;
  const selectedParticipant =
    session.participants.find((participant) => participant.id === selectedParticipantId) ?? null;
  const isClosing = pendingAction === 'close';

  const closeActionModal = () => {
    setPendingAction(null);
    setCloseNote('');
  };

  const requestOpenSession = () => {
    setPendingAction('open');
    setCloseNote('');
  };

  const requestCloseSession = () => {
    setPendingAction('close');
    setCloseNote('');
  };

  const confirmAction = () => {
    if (pendingAction === 'open') {
      setFeedback(
        openSession(session.id)
          ? {
              tone: 'success',
              message: 'Sesi berhasil dibuka. Praktikan sekarang dapat melakukan presensi.',
            }
          : {
              tone: 'error',
              message: 'Sesi tidak dapat dibuka pada status saat ini.',
            },
      );
    }

    if (pendingAction === 'close') {
      setFeedback(
        closeSession(session.id, closeNote)
          ? {
              tone: 'success',
              message: 'Sesi berhasil ditutup. Presensi baru tidak dapat dilakukan.',
            }
          : {
              tone: 'error',
              message: 'Sesi tidak dapat ditutup pada status saat ini.',
            },
      );
    }

    closeActionModal();
  };

  return (
    <>
      <Stack.Screen options={{ title: session.courseName }} />

      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={[
          styles.content,
          { padding: contentPadding, paddingBottom: Spacing.six },
        ]}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.titleRow}>
            <ThemedText type="default" style={styles.titleText}>
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
              <ThemedText type="smallBold">Catatan penutupan</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {session.closingNote}
              </ThemedText>
            </View>
          ) : null}
        </ThemedView>

        {feedback ? (
          <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} />
        ) : null}

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="default" style={styles.sectionTitle}>
            Aksi Sesi
          </ThemedText>

          {session.status === 'belum-dibuka' ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Buka sesi agar praktikan dapat melakukan presensi.
              </ThemedText>
              <ActionButton label="Buka Sesi" onPress={requestOpenSession} />
            </>
          ) : null}

          {session.status === 'berlangsung' ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Sesi sedang berlangsung. Tutup sesi setelah praktikum selesai.
              </ThemedText>
              <ActionButton label="Tutup Sesi" tone="danger" onPress={requestCloseSession} />
            </>
          ) : null}

          {session.status === 'selesai' ? (
            <ThemedText type="small" themeColor="textSecondary">
              Sesi telah ditutup{session.closedAt ? ` pukul ${session.closedAt}` : ''}. Presensi baru
              tidak dapat dilakukan.
            </ThemedText>
          ) : null}
        </ThemedView>

        <View style={[styles.split, isWide && styles.splitWide]}>
          <ThemedView
            type="backgroundElement"
            style={[styles.card, isWide && styles.cardSplit]}>
            <View style={styles.titleRow}>
              <ThemedText type="default" style={styles.sectionTitle}>
                Pemantauan Kehadiran
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {attendedParticipants.length}/{session.participants.length} hadir
              </ThemedText>
            </View>

            {session.participants.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Belum ada praktikan yang terdaftar pada sesi ini.
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
                      <ThemedText type="small">{participant.name}</ThemedText>
                      <ThemedText type="code" themeColor="textSecondary">
                        {participant.nim}
                      </ThemedText>
                    </View>

                    <View style={styles.participantMeta}>
                      <AttendanceBadge attended={Boolean(participant.checkInAt)} />
                      <ThemedText type="code" themeColor="textSecondary">
                        {participant.checkInAt ?? '—'}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}

                <ThemedText type="small" themeColor="textSecondary">
                  Ketuk nama praktikan untuk melihat detail kehadiran.
                </ThemedText>
              </>
            )}
          </ThemedView>

          <ThemedView
            type="backgroundElement"
            style={[styles.card, isWide && styles.cardSplit]}>
            <ThemedText type="default" style={styles.sectionTitle}>
              Rekap Presensi
            </ThemedText>

            {attendedParticipants.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Belum ada presensi tercatat.
              </ThemedText>
            ) : (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {attendedParticipants.length} dari {session.participants.length} praktikan telah
                  melakukan presensi.
                </ThemedText>

                {attendedParticipants.map((participant) => (
                  <View key={participant.id} style={styles.recapRow}>
                    <View style={styles.participantInfo}>
                      <ThemedText type="small">{participant.name}</ThemedText>
                      <ThemedText type="code" themeColor="textSecondary">
                        {participant.nim}
                      </ThemedText>
                    </View>
                    <ThemedText type="code" themeColor="textSecondary">
                      {participant.checkInAt}
                    </ThemedText>
                  </View>
                ))}

                {absentCount > 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {absentCount} praktikan belum melakukan presensi.
                  </ThemedText>
                ) : null}
              </>
            )}
          </ThemedView>
        </View>
      </ScrollView>

      <BottomSheetModal
        visible={pendingAction !== null}
        title={isClosing ? 'Tutup sesi praktikum?' : 'Buka sesi praktikum?'}
        description={
          isClosing
            ? 'Setelah sesi ditutup, praktikan tidak dapat melakukan presensi baru.'
            : 'Praktikan hanya dapat melakukan presensi ketika sesi berlangsung.'
        }
        onClose={closeActionModal}>
        <View style={styles.modalSummary}>
          <InfoRow label="Praktikum" value={session.courseName} />
          <InfoRow label="Kelas" value={session.classGroup} />
          <InfoRow label="Waktu" value={`${session.startTime} – ${session.endTime}`} />
          <InfoRow
            label="Kehadiran"
            value={`${attendedParticipants.length}/${session.participants.length} praktikan`}
          />
        </View>

        {isClosing ? (
          <View style={styles.field}>
            <ThemedText type="smallBold">Catatan sesi (opsional)</ThemedText>
            <TextInput
              value={closeNote}
              onChangeText={setCloseNote}
              placeholder="Contoh: praktikum selesai tepat waktu"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.link}
              maxLength={160}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Catatan penutupan sesi"
              style={[
                styles.noteInput,
                {
                  backgroundColor: theme.highlight,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />
            <ThemedText type="small" themeColor="textSecondary" style={styles.counter}>
              {closeNote.length}/160
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.modalActions}>
          <ActionButton
            label="Batal"
            tone="secondary"
            onPress={closeActionModal}
            style={styles.modalButton}
          />
          <ActionButton
            label={isClosing ? 'Tutup Sesi' : 'Buka Sesi'}
            tone={isClosing ? 'danger' : 'primary'}
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
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
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
    width: 'auto',
    alignSelf: 'stretch',
  },
  participantRow: {
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
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 14,
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
