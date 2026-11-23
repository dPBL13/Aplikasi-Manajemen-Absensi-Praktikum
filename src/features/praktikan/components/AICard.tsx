import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PermitCategory } from '@/types/domain';

const LABEL: Record<PermitCategory, string> = {
  sakit: 'Sakit',
  'acara-kampus': 'Acara Kampus',
  keluarga: 'Keluarga',
  lainnya: 'Lainnya',
  'belum-diklasifikasi': 'Belum diklasifikasi',
};

interface AICardProps {
  category: PermitCategory;
  confidence: number | null;
  model?: string;
}

export function AICard({ category, confidence, model }: AICardProps) {
  const theme = useTheme();
  const pct = confidence == null ? null : Math.round(confidence * 100);

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceAlt }]}>
      <ThemedText type="labelSm" themeColor="onSurface">
        Prediksi AI (informasi pendukung)
      </ThemedText>
      <ThemedText type="bodySm" themeColor="onSurface">
        Kategori: {LABEL[category]}
        {pct != null ? ` · ${pct}%` : ''}
      </ThemedText>
      {model ? (
        <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
          Model: {model}
        </ThemedText>
      ) : null}
      <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
        Hasil ini hanya prediksi. Keputusan izin ada pada asisten.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.one,
  },
});
