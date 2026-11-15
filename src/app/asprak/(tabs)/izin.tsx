import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { PermitCategoryBadge, PermitStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { formatDateTime } from '@/utils/format-date';
import type { PermitStatus } from '@/types/domain';

type StatusFilter = PermitStatus | 'semua';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'ditolak', label: 'Ditolak' },
];

/** FR-19 — daftar pengajuan izin beserta hasil klasifikasi AI. */
export default function PermitListScreen() {
  const data = useAppData();
  const theme = useTheme();
  const [filter, setFilter] = useState<StatusFilter>('semua');

  const permits = useMemo(
    () => data.permits.filter((permit) => filter === 'semua' || permit.status === filter),
    [data.permits, filter],
  );

  const pendingCount = data.permits.filter((permit) => permit.status === 'menunggu').length;

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={permits}
      keyExtractor={(permit) => permit.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.heading}>
            <ThemedText type="subtitle" style={styles.title}>
              Pengajuan Izin
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
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
                      backgroundColor: isActive ? theme.highlight : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText
                    type="small"
                    style={{ color: isActive ? theme.text : theme.textSecondary }}>
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
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText type="default" style={styles.cardTitle}>
                {item.participantName}
              </ThemedText>
              <PermitStatusBadge status={item.status} />
            </View>

            <ThemedText type="code" themeColor="textSecondary">
              {item.nim}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.courseName}
            </ThemedText>
            <ThemedText type="small" numberOfLines={2}>
              “{item.reason}”
            </ThemedText>

            <View style={styles.cardFooter}>
              <PermitCategoryBadge category={item.aiCategory} />
              <ThemedText type="small" themeColor="textSecondary">
                {formatDateTime(item.submittedAt)}
              </ThemedText>
            </View>
          </ThemedView>
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
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  cardTitle: {
    flexShrink: 1,
    fontWeight: 600,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
