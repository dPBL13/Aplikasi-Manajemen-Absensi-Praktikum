import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLaboratories } from '@/services/laboratory';
import type { Laboratory } from '@/types/domain';

/** FR-29 — daftar laboratorium & parameter geofencing yang dikelola Asprak. */
export default function LabListScreen() {
  const labs = useLaboratories();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return labs;
    return labs.filter((lab) =>
      [lab.name, lab.code, lab.building].join(' ').toLowerCase().includes(normalized),
    );
  }, [labs, query]);

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.content, { paddingBottom: Spacing.three + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.heading}>
            <ThemedText type="headlineLg" themeColor="text">
              Laboratorium
            </ThemedText>
            <ThemedText type="bodyMd" themeColor="textSecondary">
              Atur lokasi dan radius geofencing untuk presensi.
            </ThemedText>
          </View>

          <ActionButton label="+ Lab Baru" onPress={() => router.push('/asprak/lab/baru')} />
          <ActionButton label="Lihat di Peta" tone="secondary" onPress={() => router.push('/maps')} />

          <View
            style={[styles.searchBox, { backgroundColor: theme.highlight, borderColor: theme.border }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari nama, kode, atau gedung"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.accent}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Cari laboratorium"
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          <ThemedText type="bodySm" themeColor="textSecondary">
            {filtered.length} dari {labs.length} laboratorium
          </ThemedText>
        </View>
      }
      renderItem={({ item }) => <LabCard lab={item} />}
      ListEmptyComponent={
        <EmptyState
          title={labs.length === 0 ? 'Belum ada laboratorium' : 'Laboratorium tidak ditemukan'}
          hint={
            labs.length === 0
              ? 'Tambahkan laboratorium agar presensi berbasis lokasi dapat digunakan.'
              : 'Tidak ada laboratorium yang cocok dengan pencarian Anda.'
          }
          actionLabel={labs.length === 0 ? 'Tambah laboratorium' : 'Reset pencarian'}
          onAction={labs.length === 0 ? () => router.push('/asprak/lab/baru') : () => setQuery('')}
        />
      }
    />
  );
}

function LabCard({ lab }: { lab: Laboratory }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Kelola laboratorium ${lab.name}`}
      onPress={() => router.push({ pathname: '/asprak/lab/[id]', params: { id: lab.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card>
        <View style={styles.cardHeader}>
          <ThemedText type="titleMd" themeColor="onSurface" style={styles.cardTitle}>
            {lab.name}
          </ThemedText>
          <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
            {lab.code}
          </ThemedText>
        </View>
        <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
          {lab.building} · radius {lab.radius} m
        </ThemedText>
        <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
          {lab.latitude.toFixed(6)}, {lab.longitude.toFixed(6)}
        </ThemedText>
        <ThemedText type="labelLg" themeColor="onSurface">
          Edit lokasi →
        </ThemedText>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: { gap: Spacing.three },
  heading: { gap: Spacing.one },
  searchBox: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchInput: { minHeight: 42, fontSize: 14 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardTitle: { flexShrink: 1 },
  pressed: { opacity: 0.8 },
});
