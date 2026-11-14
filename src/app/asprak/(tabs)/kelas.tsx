import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import type { PracticumClass } from '@/types/domain';

/** FR-05 — daftar kelas praktikum yang dikelola Asprak. */
export default function ClassListScreen() {
  const data = useAppData();
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return data.classes;
    }

    return data.classes.filter((practicumClass) =>
      [practicumClass.courseName, practicumClass.code, practicumClass.classGroup, practicumClass.room]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [data.classes, query]);

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.heading}>
            <ThemedText type="subtitle" style={styles.title}>
              Kelas Praktikum
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Kelola kelas dan daftar peserta praktikan.
            </ThemedText>
          </View>

          <ActionButton label="+ Kelas Baru" onPress={() => router.push('/asprak/kelas/baru')} />

          <ThemedView
            type="surfaceAlt"
            style={[styles.searchBox, { borderColor: theme.border }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari nama, kode, atau ruang"
              placeholderTextColor={theme.textSecondary}
              selectionColor={theme.link}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Cari kelas praktikum"
              style={[styles.searchInput, { color: theme.text, backgroundColor: theme.highlight }]}
            />
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary">
            {filtered.length} dari {data.classes.length} kelas
          </ThemedText>
        </View>
      }
      renderItem={({ item }) => (
        <ClassCard practicumClass={item} sessionCount={data.sessions.filter((session) => session.classId === item.id).length} />
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
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Kelola kelas ${practicumClass.courseName}`}
      onPress={() => router.push({ pathname: '/asprak/kelas/[id]', params: { id: practicumClass.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText type="default" style={styles.cardTitle}>
            {practicumClass.courseName}
          </ThemedText>
          <ThemedText type="code" themeColor="textSecondary">
            {practicumClass.code}
          </ThemedText>
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          {practicumClass.classGroup} · {practicumClass.room}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {practicumClass.participants.length} peserta · {sessionCount} sesi
        </ThemedText>

        <ThemedText type="smallBold" style={{ color: theme.link }}>
          Kelola kelas →
        </ThemedText>
      </ThemedView>
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
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  searchBox: {
    padding: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  searchInput: {
    minHeight: 42,
    paddingHorizontal: Spacing.two + 2,
    borderRadius: Spacing.two,
    fontSize: 14,
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
  pressed: {
    opacity: 0.7,
  },
});
