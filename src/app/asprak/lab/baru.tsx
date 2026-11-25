import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { EMPTY_LAB_INPUT, LabForm } from '@/features/asprak/lab-form';
import { laboratoryService } from '@/services/laboratory';

/** FR-29 — menambah laboratorium baru. */
export default function NewLabScreen() {
  return (
    <ScreenScroll>
      <View style={styles.heading}>
        <ThemedText type="headlineLg" themeColor="text">
          Lab Baru
        </ThemedText>
        <ThemedText type="bodyMd" themeColor="textSecondary">
          Tentukan titik pusat dan radius toleransi presensi.
        </ThemedText>
      </View>

      <Card>
        <LabForm
          initial={EMPTY_LAB_INPUT}
          submitLabel="Simpan laboratorium"
          onSubmit={(input) => laboratoryService.createLaboratory(input)}
          onSuccess={() => router.back()}
          onCancel={() => router.back()}
        />
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({ heading: { gap: Spacing.one } });
