import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { PermitCategoryBadge, PermitStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import type { PermitStatus } from '@/types/domain';
import { formatDateTime } from '@/utils/format-date';

type StatusFilter = PermitStatus | 'semua';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'ditolak', label: 'Ditolak' },
];

type SortKey = 'terbaru' | 'terlama' | 'nama';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'terlama', label: 'Terlama' },
  { value: 'nama', label: 'Nama A–Z' },
];

/** FR-19 — daftar pengajuan izin beserta hasil klasifikasi AI. */
export default function PermitListScreen() {
  const data = useAppData();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<StatusFilter>('semua');
  const [sortKey, setSortKey] = useState<SortKey>('terbaru');

  const permits = useMemo(() => {
    const list = data.permits.filter(
      (permit) => filter === 'semua' || permit.status === filter,
    );

    return list.sort((a, b) => {
      if (sortKey === 'nama') return a.participantName.localeCompare(b.participantName);
      if (sortKey === 'terlama') return a.submittedAt.localeCompare(b.submittedAt);
      return b.submittedAt.localeCompare(a.submittedAt);
    });
  }, [data.permits, filter, sortKey]);

  const pendingCount = data.permits.filter((permit) => permit.status === 'menunggu').length;

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={permits}
      keyExtractor={(permit) => permit.id}
      contentContainerStyle={[styles.content, { paddingBottom: Spacing.three + insets.bottom }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.heading}>
            <ThemedText type="headlineLg" themeColor="text">
              Pengajuan Izin
            </ThemedText>
            <ThemedText type="bodyMd" themeColor="textSecondary">
              {pendingCount} pengajuan menunggu keputusan Anda.
            </ThemedText>
          </View>

          <View style={styles.chips}>
            {FILTERS.map((option) => {
              const isActive = filter === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setFilter(option.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: isActive ? theme.accent : theme.highlight,
                      borderColor: isActive ? theme.accent : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText
                    type="labelSm"
                    style={{ color: isActive ? theme.accentText : theme.text }}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.chips}>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortKey === option.value;
            
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setSortKey(option.value)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: isActive ? theme.accent : theme.highlight,
                      borderColor: isActive ? theme.accent : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText
                    type="labelSm"
                    style={{ color: isActive ? theme.accentText : theme.text }}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Tinjau pengajuan izin ${item.participantName}`}
          onPress={() => router.push({ pathname: '/asprak/izin/[id]', params: { id: item.id } })}
          style={({ pressed }) => pressed && styles.pressed}>
          <Card>
            <View style={styles.cardHeader}>
              <ThemedText type="titleMd" themeColor="onSurface" style={styles.cardTitle}>
                {item.participantName}
              </ThemedText>
              <PermitStatusBadge status={item.status} />
            </View>

            <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
              {item.nim}
            </ThemedText>
            <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
              {item.courseName}
            </ThemedText>
            <ThemedText type="bodySm" themeColor="onSurface" numberOfLines={2}>
              “{item.reason}”
            </ThemedText>

            <View style={styles.cardFooter}>
              <PermitCategoryBadge category={item.aiCategory} />
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                {formatDateTime(item.submittedAt)}
              </ThemedText>
            </View>
          </Card>
        </Pressable>
      )}
      ListEmptyComponent={
        <EmptyState
          title="Tidak ada pengajuan izin"
          hint={
            filter === 'semua'
              ? 'Pengajuan izin dari praktikan akan muncul di sini.'
              : 'Tidak ada pengajuan dengan status tersebut.'
          }
          actionLabel={filter === 'semua' ? undefined : 'Tampilkan semua'}
          onAction={filter === 'semua' ? undefined : () => setFilter('semua')}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.three,
  },
  heading: {
    gap: Spacing.one,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardTitle: {
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.8,
  },
});
