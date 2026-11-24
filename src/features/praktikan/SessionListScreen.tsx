import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { findSessionParticipant, sessionsForParticipant } from '@/services/selectors';
import { useCurrentPraktikan } from './use-current-praktikan';

import type { PracticumSession } from '@/types/domain';
import { parseDateLabel } from '@/utils/date-label';

type StatusFilter = 'semua' | 'berlangsung' | 'belum-dibuka' | 'selesai';

const [query, setQuery] = useState('');
const [newestFirst, setNewestFirst] = useState(false);

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'berlangsung', label: 'Berlangsung' },
  { value: 'belum-dibuka', label: 'Belum Dibuka' },
  { value: 'selesai', label: 'Selesai' },
];

interface SessionListScreenProps {
  onSelect: (sessionId: string) => void;
}

export function SessionListScreen({ onSelect }: SessionListScreenProps) {
  const theme = useTheme();
  const data = useAppData();
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentPraktikan();
  const CURRENT_PRACTIKAN_ID = currentUser.id;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');

  const sessions = sessionsForParticipant(data, CURRENT_PRACTIKAN_ID, currentUser.nim);
  const permits = data.permits.filter(
    (p) =>
      p.participantId === CURRENT_PRACTIKAN_ID ||
      (currentUser.nim !== '' && p.nim === currentUser.nim),
  );

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const timeOf = (s: PracticumSession) => parseDateLabel(s.dateLabel)?.getTime() ?? 0;
  
    return sessions
      .filter((session) => {
        if (statusFilter !== 'semua' && session.status !== statusFilter) return false;
        if (!q) return true;
        return [session.courseName, session.classGroup, session.room]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const diff = timeOf(a) - timeOf(b) || a.startTime.localeCompare(b.startTime);
        return newestFirst ? -diff : diff;
      });
  }, [sessions, statusFilter, query, newestFirst]);

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          title="Tidak ada sesi praktikum"
          hint={
            statusFilter !== 'semua'
              ? 'Tidak ada sesi dengan status tersebut. Tampilkan semua sesi untuk melihat jadwal lainnya.'
              : 'Belum ada jadwal sesi praktikum yang berkaitan dengan Anda saat ini.'
          }
          actionLabel={statusFilter !== 'semua' ? 'Tampilkan semua sesi' : undefined}
          onAction={statusFilter !== 'semua' ? () => setStatusFilter('semua') : undefined}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={filteredSessions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.content, { paddingBottom: Spacing.three + insets.bottom }]}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.heading}>
            <ThemedText type="headlineLg" themeColor="text">
              Jadwal Praktikum
            </ThemedText>
            <ThemedText type="bodyMd" themeColor="textSecondary">
              Sesi yang Anda ikuti beserta status kehadirannya.
            </ThemedText>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari praktikum, kelas, atau ruang"
            placeholderTextColor={theme.textSecondary}
            selectionColor={theme.accent}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.searchInput,
              { color: theme.text, backgroundColor: theme.highlight, borderColor: theme.border },
            ]}
          />

          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map((opt) => {
              const isActive = statusFilter === opt.value;

              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setStatusFilter(opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? theme.accent : theme.highlight,
                      borderColor: isActive ? theme.accent : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText
                    type="labelSm"
                    style={{ color: isActive ? theme.accentText : theme.textSecondary }}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => setNewestFirst((v) => !v)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.filterChip,
              { backgroundColor: theme.highlight, borderColor: theme.border, alignSelf: 'flex-start' },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="labelSm" style={{ color: theme.text }}>
              Urutan: {newestFirst ? 'Terbaru dulu' : 'Terdekat dulu'}
            </ThemedText>
          </Pressable>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="Tidak ada sesi yang cocok"
          hint="Ubah kata kunci atau filter status."
          actionLabel="Reset"
          onAction={() => {
            setQuery('');
            setStatusFilter('semua');
          }}
        />
      }
      renderItem={({ item }) => {
        const me = findSessionParticipant(item, CURRENT_PRACTIKAN_ID, currentUser.nim);
        const sudahHadir = Boolean(me?.checkInAt);
        const leaveRec = permits.find((l) => l.sessionId === item.id);

        return (
          <Pressable
            onPress={() => onSelect(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Buka detail sesi ${item.courseName}`}
            style={({ pressed }) => pressed && styles.pressed}>
            <Card>
              <View style={styles.cardHeader}>
                <View style={styles.titleWrap}>
                  <ThemedText type="titleMd" themeColor="onSurface">
                    {item.courseName}
                  </ThemedText>
                  <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                    {item.classGroup} · {item.room}
                  </ThemedText>
                </View>
                <SessionStatusBadge status={item.status} />
              </View>

              <View style={[styles.timeBox, { backgroundColor: theme.surfaceAlt }]}>
                <ThemedText type="monoSm" themeColor="onSurface">
                  {item.dayLabel}, {item.dateLabel} · {item.startTime}–{item.endTime} WIB
                </ThemedText>
              </View>

              <View style={[styles.statusFooter, { borderTopColor: theme.border }]}>
                <View style={styles.statusText}>
                  {sudahHadir ? (
                    <ThemedText type="labelLg" style={{ color: theme.success }}>
                      Anda sudah hadir ({me?.checkInAt} WIB)
                    </ThemedText>
                  ) : leaveRec ? (
                    <ThemedText
                      type="labelLg"
                      style={{
                        color:
                          leaveRec.status === 'diterima'
                            ? theme.success
                            : leaveRec.status === 'ditolak'
                              ? theme.danger
                              : theme.onSurfaceSecondary,
                      }}>
                      Izin diajukan ({leaveRec.status})
                    </ThemedText>
                  ) : item.status === 'berlangsung' ? (
                    <ThemedText type="labelLg" themeColor="onSurface">
                      Sesi berlangsung — ketuk untuk presensi
                    </ThemedText>
                  ) : (
                    <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                      {item.status === 'belum-dibuka'
                        ? 'Menunggu sesi dibuka oleh Asprak'
                        : 'Sesi telah selesai'}
                    </ThemedText>
                  )}
                  <ThemedText type="labelLg" themeColor="onSurface">
                    Lihat detail →
                  </ThemedText>
                </View>
              </View>
            </Card>
          </Pressable>
        );
      }}
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
  emptyWrap: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
  },
  header: {
    gap: Spacing.three,
  },
  heading: {
    gap: Spacing.one,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  filterChip: {
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
  titleWrap: {
    flexShrink: 1,
    gap: 2,
  },
  timeBox: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  statusFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  statusText: {
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.8,
  },
  searchInput: {
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
});
