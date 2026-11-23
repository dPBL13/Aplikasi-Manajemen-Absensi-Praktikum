import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
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
        <ThemedText type="headlineLg" themeColor="text">
          Kelas Baru
        </ThemedText>
        <ThemedText type="bodyMd" themeColor="textSecondary">
          Kelas menjadi induk dari daftar peserta dan seluruh jadwal sesi.
        </ThemedText>
      </View>

      <Card>
        <ClassForm
          initial={EMPTY_CLASS}
          submitLabel="Simpan kelas"
          onSubmit={(input) => dataService.createClass(input)}
          onSuccess={() => router.back()}
          onCancel={() => router.back()}
        />
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.one,
  },
});
