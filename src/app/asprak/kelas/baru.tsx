import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ClassForm } from '@/features/asprak/class-form';
import { dataService } from '@/services';
import type { ClassInput } from '@/services/types';

const EMPTY_CLASS: ClassInput = {
  courseName: '',
  code: '',
  classGroup: '',
  room: '',
  description: '',
};

/** FR-05 — membuat kelas praktikum baru. */
export default function NewClassScreen() {
  return (
    <ScreenScroll>
      <View style={styles.heading}>
        <ThemedText type="subtitle" style={styles.title}>
          Kelas Baru
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Kelas menjadi induk dari daftar peserta dan seluruh jadwal sesi.
        </ThemedText>
      </View>

      <ClassForm
        initial={EMPTY_CLASS}
        submitLabel="Simpan kelas"
        onSubmit={(input) => dataService.createClass(input)}
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
