import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { AICard } from '@/features/praktikan/components/AICard';
import { LeaveStatusBadge } from '@/features/praktikan/components/LeaveStatusBadge';
import { LeaveRequestModal } from '@/features/praktikan/LeaveRequestModal';
import { useCurrentPraktikan } from '@/features/praktikan/use-current-praktikan';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { sessionsForParticipant } from '@/services/selectors';
import type { Permit, PracticumSession } from '@/types/domain';

export default function PraktikanIzinTab() {
  const theme = useTheme();
  const data = useAppData();
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentPraktikan();
  const CURRENT_PRACTIKAN_ID = currentUser.id;

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [selectedSessionForModal, setSelectedSessionForModal] = useState<PracticumSession | null>(
    null,
  );
  const [isSelectSessionOpen, setIsSelectSessionOpen] = useState(false);

  // Daftar izin milik praktikan saat ini
  const myPermits = (data.permits ?? []).filter(
    (p: Permit) =>
      p.participantId === CURRENT_PRACTIKAN_ID ||
      (currentUser.nim !== '' && p.nim === currentUser.nim),
  );

  // Sesi praktikan yang belum dihadiri dan belum selesai
  const allSessions = sessionsForParticipant(data, CURRENT_PRACTIKAN_ID, currentUser.nim);
  const eligibleSessions = allSessions.filter((s) => {
    const me = s.participants.find(
      (p) => p.id === CURRENT_PRACTIKAN_ID || (currentUser.nim !== '' && p.nim === currentUser.nim),
    );
    if (me?.checkInAt) return false;
    const existingPermit = myPermits.find((p) => p.sessionId === s.id && p.status === 'diterima');
    return !existingPermit;
  });

  const handleStartSubmit = () => {
    if (eligibleSessions.length === 0) {
      setFeedback({
        tone: 'error',
        message: 'Tidak ada sesi praktikum aktif yang dapat diajukan izin saat ini.',
      });
      return;
    }

    if (eligibleSessions.length === 1) {
      setSelectedSessionForModal(eligibleSessions[0]);
    } else {
      setIsSelectSessionOpen(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={myPermits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingBottom: Spacing.four + insets.bottom }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.heading}>
              <ThemedText type="headlineLg" themeColor="text">
                Pengajuan Izin
              </ThemedText>
              <ThemedText type="bodyMd" themeColor="textSecondary">
                Daftar permohonan izin praktikum dan hasil klasifikasi AI.
              </ThemedText>
            </View>

            {feedback ? (
              <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} />
            ) : null}

            <Card style={styles.actionCard}>
              <ThemedText type="titleMd" themeColor="onSurface">
                Ajukan Izin Baru
              </ThemedText>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                Berhalangan hadir karena sakit, kegiatan kampus, atau urusan keluarga mendesak?
              </ThemedText>
              <ActionButton
                label="Buat Pengajuan Izin"
                tone="primary"
                onPress={handleStartSubmit}
              />
            </Card>

            {isSelectSessionOpen ? (
              <Card style={styles.pickerCard}>
                <ThemedText type="titleMd" themeColor="onSurface">
                  Pilih Sesi Praktikum:
                </ThemedText>
                {eligibleSessions.map((ses) => (
                  <Pressable
                    key={ses.id}
                    onPress={() => {
                      setIsSelectSessionOpen(false);
                      setSelectedSessionForModal(ses);
                    }}
                    style={({ pressed }) => [
                      styles.sessionChoice,
                      { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="labelLg" themeColor="onSurface">
                      {ses.courseName} ({ses.classGroup})
                    </ThemedText>
                    <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
                      {ses.dayLabel}, {ses.dateLabel} · {ses.startTime}–{ses.endTime} WIB · Ruang {ses.room}
                    </ThemedText>
                  </Pressable>
                ))}
                <ActionButton
                  label="Batal"
                  tone="secondary"
                  onPress={() => setIsSelectSessionOpen(false)}
                />
              </Card>
            ) : null}

            <ThemedText type="titleMd" themeColor="text" style={styles.listSectionTitle}>
              Riwayat Izin Anda ({myPermits.length})
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Belum ada pengajuan izin"
            hint="Jika berhalangan hadir pada sesi praktikum, klik tombol Buat Pengajuan Izin di atas."
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.permitCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <ThemedText type="titleMd" themeColor="onSurface">
                  {item.courseName}
                </ThemedText>
                <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
                  Diajukan: {item.submittedAt ? item.submittedAt.slice(0, 16).replace('T', ' ') : '-'}
                </ThemedText>
              </View>
              <LeaveStatusBadge status={item.status} />
            </View>

            <View style={styles.detailRow}>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                Alasan Izin:
              </ThemedText>
              <ThemedText type="bodyMd" themeColor="onSurface">
                {item.reason}
              </ThemedText>
            </View>

            {item.decidedBy ? (
              <View style={[styles.decisionBox, { backgroundColor: theme.surfaceAlt }]}>
                <ThemedText type="labelSm" themeColor="onSurface">
                  Verifikasi Asisten: {item.status.toUpperCase()}
                </ThemedText>
                <ThemedText type="bodySm" themeColor="onSurface">
                  Oleh: {item.decidedBy} {item.decidedAt ? `(${item.decidedAt.slice(0, 16).replace('T', ' ')})` : ''}
                </ThemedText>
                {item.decisionNote ? (
                  <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                    Catatan: &ldquo;{item.decisionNote}&rdquo;
                  </ThemedText>
                ) : null}
              </View>
            ) : null}

            <AICard
              category={item.aiCategory}
              confidence={item.aiConfidence}
              model={item.aiModel}
            />
          </Card>
        )}
      />

      {selectedSessionForModal ? (
        <LeaveRequestModal
          visible={Boolean(selectedSessionForModal)}
          session={selectedSessionForModal}
          onClose={() => setSelectedSessionForModal(null)}
          onSuccess={(msg) => {
            setSelectedSessionForModal(null);
            setFeedback({ tone: 'success', message: msg });
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.three,
  },
  heading: {
    gap: Spacing.half,
  },
  actionCard: {
    gap: Spacing.two,
  },
  pickerCard: {
    gap: Spacing.two,
  },
  sessionChoice: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.half,
  },
  listSectionTitle: {
    marginTop: Spacing.two,
  },
  permitCard: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
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
  detailRow: {
    gap: Spacing.one,
  },
  decisionBox: {
    padding: Spacing.two,
    borderRadius: Radius.md,
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
