import { Pressable, StyleSheet, View } from 'react-native';

import { SessionStatusBadge } from './status-badge';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Palette, Spacing } from '@/constants/theme';
import type { PracticumSession } from '@/types/session';

type SessionCardProps = {
  session: PracticumSession;
  onPress: () => void;
};

export function SessionCard({ session, onPress }: SessionCardProps) {
  const attendedCount = session.participants.filter((participant) => participant.checkInAt).length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buka detail ${session.courseName}`}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.headerRow}>
          <ThemedText type="default" style={styles.courseName}>
            {session.courseName}
          </ThemedText>
          <SessionStatusBadge status={session.status} />
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          {session.classGroup} · {session.room}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {session.dayLabel}, {session.dateLabel} · {session.startTime}–{session.endTime}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {attendedCount}/{session.participants.length} praktikan hadir
        </ThemedText>

        <View style={styles.footerRow}>
          <ThemedText type="smallBold" themeColor="link">
            Lihat detail
          </ThemedText>
          <ThemedText type="smallBold" themeColor="link">
            →
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
    backgroundColor: Palette.button,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  courseName: {
    flexShrink: 1,
    fontWeight: 600,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
});
