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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { Card } from '@/components/card';
import { DateTimeField } from '@/components/date-time-field';
import { EmptyState } from '@/components/empty-state';
import { SelectField } from '@/components/select-field';
import { SessionCard } from '@/components/session-card';
import { StatTile } from '@/components/stat-tile';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { asprakOverview } from '@/services/selectors';
import type { PracticumSession, SessionStatus } from '@/types/domain';
import { formatDateLabel, parseDateLabel, parseTimeLabel } from '@/utils/date-label';

type StatusFilter = SessionStatus | 'semua' | 'berlalu';

type ScheduleRow =
  | { type: 'section'; key: string; title: string }
  | { type: 'sessions'; key: string; sessions: PracticumSession[] };

type DecoratedSession = {
  session: PracticumSession;
  start: number | null;
  end: number | null;
  past: boolean;
};

const ALL_CLASSES = 'semua';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'belum-dibuka', label: 'Belum Dibuka' },
  { value: 'berlangsung', label: 'Berlangsung' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'berlalu', label: 'Berlalu' },
];

const { userProfile } = useAuth();

/** Gabungkan label tanggal + jam domain menjadi satu Date. */
function sessionMoment(dateLabel: string, timeLabel: string): Date | null {
  const date = parseDateLabel(dateLabel);
  if (!date) {
    return null;
  }

  const time = parseTimeLabel(timeLabel);
  date.setHours(time?.getHours() ?? 0, time?.getMinutes() ?? 0, 0, 0);

  return date;
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

/**
 * "Berlalu" = sudah ditutup, atau jadwalnya terlewat tanpa pernah dibuka.
 * Sesi yang sedang berlangsung tetap dianggap aktif walau jamnya sudah lewat.
 */
function isPastSession(session: PracticumSession, now: number): boolean {
  if (session.status === 'selesai') {
    return true;
  }

  if (session.status === 'berlangsung') {
    return false;
  }

  const end = sessionMoment(session.dateLabel, session.endTime);
  return end !== null && end.getTime() < now;
}

function compareUpcoming(left: DecoratedSession, right: DecoratedSession): number {
  const rank = (session: PracticumSession) => (session.status === 'berlangsung' ? 0 : 1);
  const byStatus = rank(left.session) - rank(right.session);
  if (byStatus !== 0) {
    return byStatus;
  }

  if (left.start === null && right.start === null) {
    return 0;
  }
  if (left.start === null) {
    return 1;
  }
  if (right.start === null) {
    return -1;
  }

  return left.start - right.start;
}

function comparePast(left: DecoratedSession, right: DecoratedSession): number {
  if (left.end === null && right.end === null) {
    return 0;
  }
  if (left.end === null) {
    return 1;
  }
  if (right.end === null) {
    return -1;
  }

  return right.end - left.end;
}

/** FR-07 / FR-09 — daftar jadwal yang menjadi tanggung jawab Asprak. */
export default function AsprakScheduleScreen() {
  const data = useAppData();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [classFilter, setClassFilter] = useState(ALL_CLASSES);
  const [dateFilter, setDateFilter] = useState('');

  const isCompact = width < 600;
  const columns = width >= 1000 ? 2 : 1;
  const contentPadding = width >= 768 ? Spacing.five : isCompact ? Spacing.three : Spacing.four;
  const overview = asprakOverview(data);
  const hasFilters =
    query.trim().length > 0 ||
    statusFilter !== 'semua' ||
    classFilter !== ALL_CLASSES ||
    dateFilter.trim().length > 0;

  const classOptions = useMemo(
    () => [
      { label: 'Semua kelas', value: ALL_CLASSES },
      ...data.classes.map((practicumClass) => ({
        label: `${practicumClass.courseName} · ${practicumClass.classGroup}`,
        value: practicumClass.id,
      })),
    ],
    [data.classes],
  );

  const filteredSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedDate = parseDateLabel(dateFilter);

    return data.sessions.filter((session) => {
      if (statusFilter === 'berlalu') {
        if (!isPastSession(session, now)) {
          return false;
        }
      } else if (statusFilter !== 'semua' && session.status !== statusFilter) {
        return false;
      }

      if (classFilter !== ALL_CLASSES && session.classId !== classFilter) {
        return false;
      }

      if (selectedDate) {
        const sessionDate = parseDateLabel(session.dateLabel);
        if (!sessionDate || !isSameDay(sessionDate, selectedDate)) {
          return false;
        }
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
  }, [data.sessions, query, statusFilter, classFilter, dateFilter, now]);

  const rows = useMemo<ScheduleRow[]>(() => {
    const decorated = filteredSessions.map<DecoratedSession>((session) => {
      const start = sessionMoment(session.dateLabel, session.startTime);
      const end = sessionMoment(session.dateLabel, session.endTime);

      return {
        session,
        start: start?.getTime() ?? null,
        end: end?.getTime() ?? null,
        past: isPastSession(session, now),
      };
    });

    const upcoming = decorated.filter((item) => !item.past).sort(compareUpcoming);
    const past = decorated.filter((item) => item.past).sort(comparePast);

    const result: ScheduleRow[] = [];
    const pushSessions = (items: DecoratedSession[]) => {
      for (let index = 0; index < items.length; index += columns) {
        const chunk = items.slice(index, index + columns);
        result.push({
          type: 'sessions',
          key: chunk.map((item) => item.session.id).join('|'),
          sessions: chunk.map((item) => item.session),
        });
      }
    };

    pushSessions(upcoming);

    if (past.length > 0) {
      result.push({ type: 'section', key: 'section-berlalu', title: 'Berlalu' });
      pushSessions(past);
    }

    return result;
  }, [filteredSessions, columns, now]);

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('semua');
    setClassFilter(ALL_CLASSES);
    setDateFilter('');
  };

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={rows}
      keyExtractor={(row) => row.key}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.listContent,
        { padding: contentPadding, paddingBottom: contentPadding + insets.bottom },
      ]}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.heading}>
            <ThemedText type="bodySm" themeColor="textSecondary">
              Asprak · {`Asprak · ${userProfile?.name?.trim() || 'Asprak Null'}`}
            </ThemedText>
            <ThemedText type="headlineLg" themeColor="text">
              Jadwal Saya
            </ThemedText>
            <ThemedText type="bodyMd" themeColor="textSecondary">
              Sesi praktikum yang menjadi tanggung jawab Anda.
            </ThemedText>
          </View>

          <View style={styles.statRow}>
            <StatTile compact label="Kelas" value={String(overview.classCount)} />
            <StatTile compact label="Sesi" value={String(overview.sessionCount)} />
            <StatTile
              compact
              label="Berlangsung"
              value={String(overview.ongoingCount)}
              hint={overview.ongoingCount > 0 ? 'Perlu dipantau' : 'Tidak ada sesi aktif'}
            />
          </View>

          <ActionButton
            label="+ Jadwal Baru"
            onPress={() => router.push('/asprak/session/baru')}
          />

          {data.sessions.length > 0 ? (
            <View style={styles.filters}>
              <View
                style={[
                  styles.searchRow,
                  { backgroundColor: theme.highlight, borderColor: theme.border },
                ]}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Nama praktikum, kelas, atau ruang"
                  placeholderTextColor={theme.textSecondary}
                  selectionColor={theme.accent}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  accessibilityLabel="Cari sesi praktikum"
                  style={[styles.searchInput, { color: theme.text }]}
                />
                {query ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Bersihkan pencarian"
                    onPress={() => setQuery('')}
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <ThemedText type="labelSm" themeColor="textSecondary">
                      Hapus
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>

              <Card>
                <ThemedText type="titleMd" themeColor="onSurface">
                  Filter & Urutkan
                </ThemedText>

                <View style={styles.filterFields}>
                  <View style={styles.filterField}>
                    <SelectField
                      label="Kelas"
                      value={classFilter}
                      placeholder="Semua kelas"
                      options={classOptions}
                      onSelect={setClassFilter}
                    />
                  </View>
                  <View style={styles.filterField}>
                    <DateTimeField
                      label="Tanggal"
                      mode="date"
                      value={dateFilter}
                      placeholder="Semua tanggal"
                      onChange={(date) => setDateFilter(formatDateLabel(date))}
                      onChangeText={setDateFilter}
                    />
                  </View>
                </View>

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
                          {
                            backgroundColor: isActive ? theme.accent : theme.surfaceAlt,
                            borderColor: theme.accent,
                          },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText
                          type="labelSm"
                          style={{ color: isActive ? theme.accentText : theme.onSurface }}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.formFooter}>
                  <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                    Menampilkan {filteredSessions.length} dari {data.sessions.length} sesi
                  </ThemedText>
                  <View style={styles.footerActions}>
                    {dateFilter.trim().length > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Hapus filter tanggal"
                        onPress={() => setDateFilter('')}
                        hitSlop={8}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText type="labelSm" themeColor="onSurface">
                          Hapus tanggal
                        </ThemedText>
                      </Pressable>
                    ) : null}
                    {hasFilters ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Reset pencarian dan filter"
                        onPress={resetFilters}
                        hitSlop={8}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText type="labelSm" themeColor="onSurface">
                          Reset filter
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </Card>
            </View>
          ) : null}
        </View>
      }
      renderItem={({ item }) => {
        if (item.type === 'section') {
          return (
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionRule, { backgroundColor: theme.border }]} />
              <ThemedText type="labelSm" themeColor="textSecondary" style={styles.sectionTitle}>
                {item.title}
              </ThemedText>
              <View style={[styles.sectionRule, { backgroundColor: theme.border }]} />
            </View>
          );
        }

        return (
          <View style={styles.sessionRow}>
            {item.sessions.map((session) => (
              <View key={session.id} style={styles.sessionCell}>
                <SessionCard
                  session={session}
                  onPress={() =>
                    router.push({ pathname: '/asprak/session/[id]', params: { id: session.id } })
                  }
                />
              </View>
            ))}
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.block}>
          <EmptyState
            title={data.sessions.length === 0 ? 'Belum ada sesi praktikum' : 'Sesi tidak ditemukan'}
            hint={
              data.sessions.length === 0
                ? 'Buat jadwal baru untuk mulai mengelola sesi praktikum.'
                : 'Tidak ada sesi yang cocok dengan pencarian, kelas, tanggal, atau filter status saat ini.'
            }
            actionLabel={
              data.sessions.length === 0 ? 'Buat jadwal baru' : hasFilters ? 'Reset filter' : undefined
            }
            onAction={
              data.sessions.length === 0
                ? () => router.push('/asprak/session/baru')
                : hasFilters
                  ? resetFilters
                  : undefined
            }
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.three,
  },
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  heading: {
    gap: Spacing.one,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    maxWidth: '100%',
  },
  filters: {
    gap: Spacing.three,
  },
  searchRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  filterFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  filterField: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 0,
    maxWidth: '100%',
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
  formFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  sectionHeader: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  sectionRule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    letterSpacing: 1,
  },
  sessionRow: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.three,
  },
  sessionCell: {
    flex: 1,
    minWidth: 0,
  },
  block: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
