import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { Card } from '@/components/card';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { InfoRow } from '@/components/info-row';
import { ScreenScroll } from '@/components/screen-scroll';
import { PermitCategoryBadge, PermitStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
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
        <Card>
          <ThemedText type="headlineMd" themeColor="onSurface">
            Pengajuan tidak ditemukan
          </ThemedText>
          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            Pengajuan izin sudah dihapus atau tidak tersedia.
          </ThemedText>
          <ActionButton label="Kembali" tone="secondary" onPress={() => router.back()} />
        </Card>
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
        <Card>
          <View style={styles.titleRow}>
            <ThemedText type="headlineMd" themeColor="onSurface" style={styles.titleText}>
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
        </Card>

        {feedback ? <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} /> : null}

        <Card>
          <ThemedText type="titleMd" themeColor="onSurface">
            Alasan Ketidakhadiran
          </ThemedText>
          <View style={[styles.reasonBox, { backgroundColor: theme.surfaceAlt }]}>
            <ThemedText type="bodyMd" themeColor="onSurface">
              “{permit.reason}”
            </ThemedText>
          </View>
        </Card>

        <Card>
          <View style={styles.titleRow}>
            <ThemedText type="titleMd" themeColor="onSurface">
              Klasifikasi AI
            </ThemedText>
            <PermitCategoryBadge category={permit.aiCategory} />
          </View>

          {permit.aiCategory === 'belum-diklasifikasi' ? (
            <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
              Alasan belum diklasifikasi. Hasil akan muncul setelah API AI (FR-17/FR-18) merespons.
            </ThemedText>
          ) : (
            <>
              <InfoRow
                label="Kategori"
                value={permit.aiCategory.replace('-', ' ')}
                valueType="bodySm"
              />
              <InfoRow
                label="Keyakinan model"
                value={confidence === null ? '-' : `${confidence}%`}
              />
              {permit.aiModel ? <InfoRow label="Model" value={permit.aiModel} /> : null}
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                Hasil klasifikasi bersifat bantuan. Keputusan akhir tetap berada pada asisten
                praktikum.
              </ThemedText>
            </>
          )}
        </Card>

        <Card>
          <ThemedText type="titleMd" themeColor="onSurface">
            Keputusan
          </ThemedText>

          {isPending ? (
            <>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
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
                  <ThemedText type="labelSm" themeColor="onSurface">
                    Catatan keputusan
                  </ThemedText>
                  <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
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
        </Card>
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
          <ThemedText type="labelSm" themeColor="onSurface">
            Catatan keputusan (opsional)
          </ThemedText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Contoh: surat izin sudah diverifikasi"
            placeholderTextColor={theme.onSurfaceSecondary}
            selectionColor={theme.accent}
            maxLength={160}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel="Catatan keputusan izin"
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleText: {
    flexShrink: 1,
  },
  reasonBox: {
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  noteBlock: {
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
