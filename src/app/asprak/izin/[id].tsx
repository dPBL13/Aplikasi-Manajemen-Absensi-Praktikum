import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { InfoRow } from '@/components/info-row';
import { ScreenScroll } from '@/components/screen-scroll';
import { PermitCategoryBadge, PermitStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { CURRENT_ASPRAK_NAME } from '@/data/current-user';
import { useTheme } from '@/hooks/use-theme';
import { dataService, useAppData } from '@/services';
import { findPermit, findSession } from '@/services/selectors';
import { formatDateTime } from '@/utils/format-date';

type Decision = 'diterima' | 'ditolak';

/** FR-19 + FR-20 — detail pengajuan izin, hasil klasifikasi AI, terima/tolak. */
export default function PermitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useAppData();
  const theme = useTheme();

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const permit = findPermit(data, id);
  const session = permit ? findSession(data, permit.sessionId) : undefined;

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = setTimeout(() => setFeedback(null), 5000);

    return () => clearTimeout(timer);
  }, [feedback]);

  if (!permit) {
    return (
      <ScreenScroll>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">Pengajuan tidak ditemukan</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Pengajuan izin sudah dihapus atau tidak tersedia.
          </ThemedText>
          <ActionButton label="Kembali" tone="secondary" onPress={() => router.back()} />
        </ThemedView>
      </ScreenScroll>
    );
  }

  const isPending = permit.status === 'menunggu';
  const confidence =
    permit.aiConfidence === null ? null : Math.round(permit.aiConfidence * 100);

  const confirmDecision = async () => {
    if (!decision) {
      return;
    }

    setBusy(true);
    const result = await dataService.decidePermit(permit.id, {
      status: decision,
      note,
      decidedBy: CURRENT_ASPRAK_NAME,
    });
    setBusy(false);
    setDecision(null);

    setFeedback(
      result.ok
        ? {
            tone: 'success',
            message:
              decision === 'diterima'
                ? 'Pengajuan izin diterima dan keputusan tersimpan.'
                : 'Pengajuan izin ditolak dan keputusan tersimpan.',
          }
        : { tone: 'error', message: result.reason },
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Detail Pengajuan Izin' }} />

      <ScreenScroll>
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.titleRow}>
            <ThemedText type="default" style={styles.titleText}>
              {permit.participantName}
            </ThemedText>
            <PermitStatusBadge status={permit.status} />
          </View>

          <InfoRow label="NIM" value={permit.nim} />
          <InfoRow label="Praktikum" value={permit.courseName} />
          <InfoRow label="Diajukan" value={formatDateTime(permit.submittedAt)} />
          {session ? (
            <InfoRow
              label="Sesi"
              value={`${session.dayLabel}, ${session.dateLabel} · ${session.startTime}–${session.endTime}`}
            />
          ) : null}
        </ThemedView>

        {feedback ? <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} /> : null}

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="default" style={styles.sectionTitle}>
            Alasan Ketidakhadiran
          </ThemedText>
          <ThemedView type="highlight" style={styles.reasonBox}>
            <ThemedText type="small">“{permit.reason}”</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.titleRow}>
            <ThemedText type="default" style={styles.sectionTitle}>
              Klasifikasi AI
            </ThemedText>
            <PermitCategoryBadge category={permit.aiCategory} />
          </View>

          {permit.aiCategory === 'belum-diklasifikasi' ? (
            <ThemedText type="small" themeColor="textSecondary">
              Alasan belum diklasifikasi. Hasil akan muncul setelah API AI (FR-17/FR-18) merespons.
            </ThemedText>
          ) : (
            <>
              <InfoRow
                label="Kategori"
                value={permit.aiCategory.replace('-', ' ')}
                valueType="small"
              />
              <InfoRow
                label="Keyakinan model"
                value={confidence === null ? '-' : `${confidence}%`}
              />
              {permit.aiModel ? <InfoRow label="Model" value={permit.aiModel} /> : null}
              <ThemedText type="small" themeColor="textSecondary">
                Hasil klasifikasi bersifat bantuan. Keputusan akhir tetap berada pada asisten
                praktikum.
              </ThemedText>
            </>
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="default" style={styles.sectionTitle}>
            Keputusan
          </ThemedText>

          {isPending ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Setujui atau tolak pengajuan ini. Keputusan tersimpan dan langsung terlihat oleh
                praktikan.
              </ThemedText>
              <ActionButton label="Terima Pengajuan" onPress={() => setDecision('diterima')} />
              <ActionButton
                label="Tolak Pengajuan"
                tone="danger"
                onPress={() => setDecision('ditolak')}
              />
            </>
          ) : (
            <>
              <InfoRow
                label="Status"
                value={permit.status === 'diterima' ? 'Diterima' : 'Ditolak'}
              />
              {permit.decidedAt ? (
                <InfoRow label="Diputuskan" value={formatDateTime(permit.decidedAt)} />
              ) : null}
              {permit.decidedBy ? <InfoRow label="Oleh" value={permit.decidedBy} /> : null}
              {permit.decisionNote ? (
                <View style={[styles.noteBlock, { borderTopColor: theme.border }]}>
                  <ThemedText type="smallBold">Catatan keputusan</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {permit.decisionNote}
                  </ThemedText>
                </View>
              ) : null}
            </>
          )}

          {session ? (
            <ActionButton
              label="Buka Detail Sesi"
              tone="secondary"
              onPress={() =>
                router.push({ pathname: '/asprak/session/[id]', params: { id: session.id } })
              }
            />
          ) : null}
        </ThemedView>
      </ScreenScroll>

      <BottomSheetModal
        visible={decision !== null}
        title={decision === 'diterima' ? 'Terima pengajuan izin?' : 'Tolak pengajuan izin?'}
        description={
          decision === 'diterima'
            ? 'Praktikan akan melihat status izin “Diterima”.'
            : 'Praktikan akan melihat status izin “Ditolak”.'
        }
        onClose={() => setDecision(null)}>
        <View style={styles.modalSummary}>
          <InfoRow label="Praktikan" value={permit.participantName} />
          <InfoRow label="Praktikum" value={permit.courseName} />
          <InfoRow label="Kategori AI" value={permit.aiCategory.replace('-', ' ')} />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Catatan keputusan (opsional)</ThemedText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Contoh: surat izin sudah diverifikasi"
            placeholderTextColor={theme.textSecondary}
            selectionColor={theme.link}
            maxLength={160}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel="Catatan keputusan izin"
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
            {note.length}/160
          </ThemedText>
        </View>

        <View style={styles.modalActions}>
          <ActionButton
            label="Batal"
            tone="secondary"
            onPress={() => setDecision(null)}
            style={styles.modalButton}
          />
          <ActionButton
            label={busy ? 'Menyimpan…' : decision === 'diterima' ? 'Terima' : 'Tolak'}
            tone={decision === 'diterima' ? 'primary' : 'danger'}
            onPress={confirmDecision}
            disabled={busy}
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
  reasonBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  noteBlock: {
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
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
