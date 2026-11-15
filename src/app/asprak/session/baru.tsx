import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { emptySessionInput, SessionForm } from '@/features/asprak/session-form';
import { useAppData, dataService } from '@/services';

/** FR-07 — membuat jadwal sesi praktikum baru. */
export default function NewSessionScreen() {
  const data = useAppData();

  if (data.classes.length === 0) {
    return (
      <ScreenScroll>
        <EmptyState
          title="Belum ada kelas praktikum"
          hint="Jadwal selalu terikat pada satu kelas. Buat kelas terlebih dahulu."
          actionLabel="Buat kelas"
          onAction={() => router.replace('/asprak/kelas/baru')}
        />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <View style={styles.heading}>
        <ThemedText type="subtitle" style={styles.title}>
          Jadwal Baru
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Sesi baru selalu dibuat dengan status “Belum Dibuka”.
        </ThemedText>
      </View>

      <SessionForm
        classes={data.classes}
        initial={emptySessionInput(data.classes[0].id)}
        submitLabel="Simpan jadwal"
        onSubmit={(input) => dataService.createSession(input)}
        onSuccess={() => router.back()}
        onCancel={() => router.back()}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.one,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
});
