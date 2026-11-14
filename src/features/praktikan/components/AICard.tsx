import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AIClassification } from '../types';

interface AICardProps {
  ai: AIClassification;
}

export function AICard({ ai }: AICardProps) {
  const theme = useTheme();
  const confidencePercent = Math.round(ai.confidence * 100);

  const urgencyLabel =
    ai.urgency === 'tinggi' ? 'Tinggi' : ai.urgency === 'sedang' ? 'Sedang' : 'Rendah';

  return (
    <ThemedView
      type="surfaceAlt"
      style={[
        styles.container,
        {
          borderColor: theme.border,
        },
      ]}>
      {/* Header AI */}
      <View style={styles.header}>
        <ThemedView type="highlight" style={styles.badgeAi}>
          <ThemedText type="smallBold" themeColor="link">
            🤖 Analisis AI (Informasi Pendukung)
          </ThemedText>
        </ThemedView>
        <ThemedText type="smallBold" themeColor="link">
          {confidencePercent}% Cocok
        </ThemedText>
      </View>

      {/* Baris Kategori Prediksi */}
      <View style={styles.metaRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Kategori Prediksi:
        </ThemedText>
        <ThemedText type="smallBold">{ai.predictedCategory}</ThemedText>
      </View>

      {/* Baris Urgensi */}
      <View style={styles.metaRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Tingkat Urgensi:
        </ThemedText>
        <ThemedText
          type="smallBold"
          themeColor={ai.urgency === 'tinggi' ? 'danger' : 'text'}>
          {urgencyLabel}
        </ThemedText>
      </View>

      {/* Ringkasan Analisa */}
      <ThemedView type="highlight" style={styles.summaryBox}>
        <ThemedText type="small" style={styles.summaryText}>
          {ai.summary}
        </ThemedText>
      </ThemedView>

      {/* Disclaimer Resmi */}
      <View style={[styles.disclaimerBox, { borderTopColor: theme.border }]}>
        <ThemedText type="code" themeColor="textSecondary" style={styles.disclaimerText}>
          {ai.disclaimer}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.two + 4,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeAi: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.one + 2,
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  summaryBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one + 2,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimerBox: {
    borderTopWidth: 1,
    paddingTop: Spacing.one,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
  },
});
