import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { CURRENT_PRACTIKAN_ID } from '@/data/current-user';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import {
  findSessionParticipant,
  sessionsForParticipant,
} from '@/services/selectors';

/**
 * FR-07 / FR-09 (sisi praktikan) — daftar sesi yang diikuti praktikan aktif.
 * Data berasal dari store yang sama dengan modul Asprak.
 */
export function SessionListScreen({ onSelect }: { onSelect: (sessionId: string) => void }) {
  const data = useAppData();
  const theme = useTheme();
  const sessions = sessionsForParticipant(data, CURRENT_PRACTIKAN_ID);

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.background }]}
      data={sessions}
      keyExtractor={(session) => session.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.heading}>
          <ThemedText type="subtitle" style={styles.title}>
            Sesi Praktikum
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {sessions.length} sesi terdaftar untuk kelas Anda.
          </ThemedText>
        </View>
      }
      renderItem={({ item }) => {
        const me = findSessionParticipant(item, CURRENT_PRACTIKAN_ID);
        const present = Boolean(me?.checkInAt);

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Buka detail ${item.courseName}`}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.row}>
                <ThemedText type="default" style={styles.cardTitle}>
                  {item.courseName}
                </ThemedText>
                <SessionStatusBadge status={item.status} />
              </View>

              <ThemedText type="small" themeColor="textSecondary">
                {item.classGroup} · {item.dayLabel}, {item.dateLabel}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.startTime}–{item.endTime} · {item.room}
              </ThemedText>

              {present ? (
                <ThemedText type="smallBold" style={{ color: theme.success }}>
                  ✓ Sudah presensi pukul {me?.checkInAt}
                </ThemedText>
              ) : item.status === 'berlangsung' ? (
                <ThemedText type="smallBold" style={{ color: theme.link }}>
                  Sesi sedang berlangsung — segera lakukan presensi
                </ThemedText>
              ) : null}
            </ThemedView>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          title="Belum ada sesi praktikum"
          hint="Sesi akan muncul setelah asisten praktikum membuat jadwal untuk kelas Anda."
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
  heading: {
    gap: Spacing.one,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  row: {
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
    opacity: 0.75,
  },
});
