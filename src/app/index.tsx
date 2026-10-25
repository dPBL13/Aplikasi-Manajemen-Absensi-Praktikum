import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { ActionButton } from '@/components/action-button';
import { SessionCard } from '@/components/session-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSessions } from '@/context/session-context';
import { CURRENT_ASPRAK_NAME } from '@/data/sessions';
import { useTheme } from '@/hooks/use-theme';
import type { SessionStatus } from '@/types/session';

type StatusFilter = SessionStatus | 'semua';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'belum-dibuka', label: 'Belum Dibuka' },
  { value: 'berlangsung', label: 'Berlangsung' },
  { value: 'selesai', label: 'Selesai' },
];

export default function AsprakScheduleScreen() {
  const { sessions } = useSessions();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');

  const isCompact = width < 600;
  const columns = width >= 1000 ? 2 : 1;
  const contentPadding = width >= 768 ? Spacing.five : isCompact ? Spacing.three : Spacing.four;
  const hasFilters = query.trim().length > 0 || statusFilter !== 'semua';

  const filteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sessions.filter((session) => {
      if (statusFilter !== 'semua' && session.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        session.courseName,
        session.classGroup,
        session.room,
        session.dayLabel,
        session.dateLabel,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, sessions, statusFilter]);

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('semua');
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        key={`schedule-${columns}`}
        data={filteredSessions}
        keyExtractor={(session) => session.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, { padding: contentPadding }]}
        ListHeaderComponent={
          <View style={[styles.header, isCompact && styles.headerCompact]}>
            <View style={[styles.heading, isCompact && styles.headingCompact]}>
              <ThemedText type="small" themeColor="textSecondary">
                Asprak · {CURRENT_ASPRAK_NAME}
              </ThemedText>
              <ThemedText type="subtitle" style={isCompact && styles.titleCompact}>
                Jadwal Saya
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Sesi praktikum yang menjadi tanggung jawab Anda.
              </ThemedText>
            </View>

            {sessions.length > 0 ? (
              <ThemedView
                type="surfaceAlt"
                style={[
                  styles.form,
                  isCompact && styles.formCompact,
                  { borderColor: theme.border },
                ]}>
                <View style={styles.field}>
                  {!isCompact ? <ThemedText type="smallBold">Cari sesi</ThemedText> : null}
                  <View
                    style={[
                      styles.searchRow,
                      isCompact && styles.searchRowCompact,
                      { backgroundColor: theme.highlight, borderColor: theme.border },
                    ]}>
                    <TextInput
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Nama praktikum, kelas, atau ruang"
                      placeholderTextColor={theme.textSecondary}
                      selectionColor={theme.link}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="search"
                      accessibilityLabel="Cari sesi praktikum"
                      style={[
                        styles.searchInput,
                        isCompact && styles.searchInputCompact,
                        { color: theme.text },
                      ]}
                    />
                    {query ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Bersihkan pencarian"
                        onPress={() => setQuery('')}
                        hitSlop={8}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText type="smallBold" themeColor="textSecondary">
                          Hapus
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <View style={styles.field}>
                  {!isCompact ? <ThemedText type="smallBold">Status sesi</ThemedText> : null}
                  <View style={styles.chips}>
                    {STATUS_OPTIONS.map((option) => {
                      const isActive = statusFilter === option.value;

                      return (
                        <Pressable
                          key={option.value}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isActive }}
                          onPress={() => setStatusFilter(option.value)}
                          style={({ pressed }) => [
                            styles.chip,
                            isCompact && styles.chipCompact,
                            {
                              backgroundColor: isActive ? theme.highlight : theme.background,
                              borderColor: theme.border,
                            },
                            pressed && styles.pressed,
                          ]}>
                          <ThemedText
                            type="small"
                            style={[
                              styles.chipLabel,
                              { color: isActive ? theme.text : theme.textSecondary },
                            ]}>
                            {option.label}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formFooter}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Menampilkan {filteredSessions.length} dari {sessions.length} sesi
                  </ThemedText>
                  {hasFilters ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Reset pencarian dan filter"
                      onPress={resetFilters}
                      hitSlop={8}
                      style={({ pressed }) => pressed && styles.pressed}>
                      <ThemedText type="smallBold" style={{ color: theme.link }}>
                        Reset filter
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              </ThemedView>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.block, columns > 1 && styles.blockColumn]}>
            <SessionCard session={item} onPress={() => router.push(`/session/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.block}>
            <ThemedView type="backgroundElement" style={styles.emptyState}>
              <ThemedText type="smallBold">
                {sessions.length === 0 ? 'Belum ada sesi praktikum' : 'Sesi tidak ditemukan'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {sessions.length === 0
                  ? 'Belum ada sesi praktikum yang ditugaskan kepada Anda.'
                  : 'Tidak ada sesi yang cocok dengan pencarian atau filter status saat ini.'}
              </ThemedText>
              {sessions.length > 0 && hasFilters ? (
                <ActionButton
                  label="Reset filter"
                  tone="secondary"
                  onPress={resetFilters}
                  style={styles.emptyAction}
                />
              ) : null}
            </ThemedView>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  headerCompact: {
    gap: Spacing.two,
  },
  heading: {
    gap: Spacing.one,
  },
  headingCompact: {
    gap: 0,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  form: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.three,
  },
  formCompact: {
    padding: Spacing.two + 2,
    gap: Spacing.two,
    borderRadius: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  searchRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  searchRowCompact: {
    minHeight: 38,
    paddingHorizontal: Spacing.two + 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.two + 2,
    fontSize: 14,
  },
  searchInputCompact: {
    paddingVertical: Spacing.one + 2,
    fontSize: 13,
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
  chipCompact: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
  },
  chipLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
  formFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  columnWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  block: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.two,
  },
  blockColumn: {
    flex: 1,
    width: 'auto',
  },
  emptyState: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  emptyAction: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});
