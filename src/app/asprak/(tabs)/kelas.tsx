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
import { useAppData } from '@/services';
import type { PracticumClass } from '@/types/domain';

type SortKey = 'nama' | 'kode' | 'terbaru';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'nama', label: 'Nama A–Z' },
  { value: 'kode', label: 'Kode' },
  { value: 'terbaru', label: 'Terbaru' },
];

/** FR-05 — daftar kelas praktikum yang dikelola Asprak. */
export default function ClassListScreen() {
  const data = useAppData();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nama'); //sorting

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
  
    const list = normalized
      ? data.classes.filter((practicumClass) =>
          [practicumClass.courseName, practicumClass.code, practicumClass.classGroup, practicumClass.room]
            .join(' ')
            .toLowerCase()
            .includes(normalized),
        )
      : [...data.classes];
      
    return list.sort((a, b) => {
      if (sortKey === 'kode') return a.code.localeCompare(b.code);
      if (sortKey === 'terbaru') return b.createdAt.localeCompare(a.createdAt);
      return a.courseName.localeCompare(b.courseName);
    });
  }, [data.classes, query, sortKey]);

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
              Kelas Praktikum
            </ThemedText>
            <ThemedText type="bodyMd" themeColor="textSecondary">
              Kelola kelas dan daftar peserta praktikan.
            </ThemedText>
          </View>

          <ActionButton label="+ Kelas Baru" onPress={() => router.push('/asprak/kelas/baru')} />

          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.highlight, borderColor: theme.border },
            ]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari nama, kode, atau ruang"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.accent}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Cari kelas praktikum"
              style={[styles.searchInput, { color: theme.text }]}
            />
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

          <ThemedText type="bodySm" themeColor="textSecondary">
            {filtered.length} dari {data.classes.length} kelas
          </ThemedText>
        </View>
      }
      renderItem={({ item }) => (
        <ClassCard
          practicumClass={item}
          sessionCount={data.sessions.filter((session) => session.classId === item.id).length}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          title={data.classes.length === 0 ? 'Belum ada kelas' : 'Kelas tidak ditemukan'}
          hint={
            data.classes.length === 0
              ? 'Tambahkan kelas praktikum untuk mulai mengelola peserta dan jadwal.'
              : 'Tidak ada kelas yang cocok dengan pencarian Anda.'
          }
          actionLabel={data.classes.length === 0 ? 'Buat kelas baru' : 'Reset pencarian'}
          onAction={
            data.classes.length === 0
              ? () => router.push('/asprak/kelas/baru')
              : () => setQuery('')
          }
        />
      }
    />
  );
}

function ClassCard({
  practicumClass,
  sessionCount,
}: {
  practicumClass: PracticumClass;
  sessionCount: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Kelola kelas ${practicumClass.courseName}`}
      onPress={() =>
        router.push({ pathname: '/asprak/kelas/[id]', params: { id: practicumClass.id } })
      }
      style={({ pressed }) => pressed && styles.pressed}>
      <Card>
        <View style={styles.cardHeader}>
          <ThemedText type="titleMd" themeColor="onSurface" style={styles.cardTitle}>
            {practicumClass.courseName}
          </ThemedText>
          <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
            {practicumClass.code}
          </ThemedText>
        </View>

        <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
          {practicumClass.classGroup} · {practicumClass.room}
        </ThemedText>
        <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
          {practicumClass.participants.length} peserta · {sessionCount} sesi
        </ThemedText>

        <ThemedText type="labelLg" themeColor="onSurface">
          Kelola kelas →
        </ThemedText>
      </Card>
    </Pressable>
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
  searchBox: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    minHeight: 42,
    fontSize: 14,
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
  pressed: {
    opacity: 0.8,
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
});
