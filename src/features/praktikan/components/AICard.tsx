import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { PermitCategory } from '@/types/domain';
import { StyleSheet } from 'react-native';

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
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.border }]}>
      <ThemedText style={styles.title}>Prediksi AI (informasi pendukung)</ThemedText>
      <ThemedText>
        Kategori: {LABEL[category]}
        {pct != null ? ` · ${pct}%` : ''}
      </ThemedText>
      {model ? <ThemedText style={styles.small}>Model: {model}</ThemedText> : null}
      <ThemedText style={styles.small}>
        Hasil ini hanya prediksi. Keputusan izin ada pada asisten.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  title: { fontWeight: '700' },
  small: { fontSize: 12, opacity: 0.7 },
});