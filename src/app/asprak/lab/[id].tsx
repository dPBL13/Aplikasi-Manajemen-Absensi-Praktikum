import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { BottomSheetModal } from '@/components/bottom-sheet-modal';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LabForm } from '@/features/asprak/lab-form';
import { laboratoryService, useLaboratory } from '@/services/laboratory';

/** FR-29 — ubah koordinat, radius, dan data lab; hapus lab. */
export default function EditLabScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lab = useLaboratory(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  if (!lab) {
    return (
      <ScreenScroll>
        <EmptyState
          title="Laboratorium tidak ditemukan"
          hint="Data mungkin sudah dihapus atau belum selesai dimuat."
          actionLabel="Kembali"
          onAction={() => router.back()}
        />
      </ScreenScroll>
    );
  }

  const remove = async () => {
    const result = await laboratoryService.deleteLaboratory(lab.id);
    setConfirmDelete(false);
    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.reason });
      return;
    }
    router.back();
  };

  return (
    <ScreenScroll>
      <View style={styles.heading}>
        <ThemedText type="headlineLg" themeColor="text">
          {lab.name}
        </ThemedText>
        <ThemedText type="monoSm" themeColor="textSecondary">
          {lab.code}
        </ThemedText>
      </View>

      {feedback ? <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} /> : null}

      <Card>
        <LabForm
          initial={{
            name: lab.name,
            code: lab.code,
            building: lab.building,
            latitude: lab.latitude,
            longitude: lab.longitude,
            radius: lab.radius,
            capacity: lab.capacity,
            description: lab.description,
          }}
          submitLabel="Simpan perubahan"
          onSubmit={(input) => laboratoryService.updateLaboratory(lab.id, input)}
          onSuccess={() => router.back()}
          onCancel={() => router.back()}
        />
      </Card>

      <ActionButton label="Hapus laboratorium" tone="danger" onPress={() => setConfirmDelete(true)} />

      <BottomSheetModal
        visible={confirmDelete}
        title="Hapus laboratorium?"
        description="Laboratorium yang masih dipakai sesi yang belum selesai tidak dapat dihapus."
        onClose={() => setConfirmDelete(false)}>
        <ActionButton label="Ya, hapus" tone="danger" onPress={remove} />
        <ActionButton label="Batal" tone="secondary" onPress={() => setConfirmDelete(false)} />
      </BottomSheetModal>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({ heading: { gap: Spacing.one } });
