import { Pressable, StyleSheet, View } from 'react-native';

import { SessionStatusBadge } from './status-badge';
import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PracticumSession } from '@/types/domain';

type SessionCardProps = {
  session: PracticumSession;
  onPress: () => void;
};

export function SessionCard({ session, onPress }: SessionCardProps) {
  const theme = useTheme();
  const attendedCount = session.participants.filter((participant) => participant.checkInAt).length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Buka detail ${session.courseName}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? theme.surfaceAlt : theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <ThemedText type="titleMd" themeColor="onSurface" style={styles.courseName}>
            {session.courseName}
          </ThemedText>
          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            {session.classGroup} · {session.room}
          </ThemedText>
        </View>
        <SessionStatusBadge status={session.status} />
      </View>

      <View style={[styles.schedule, { backgroundColor: theme.surfaceAlt }]}>
        <ThemedText type="bodySm" themeColor="onSurfaceAlt">
          {session.dayLabel}, {session.dateLabel} · {session.startTime}–{session.endTime}
        </ThemedText>
      </View>

      <View style={styles.footerRow}>
        <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
          {attendedCount}/{session.participants.length} praktikan hadir
        </ThemedText>
        <ThemedText type="labelLg" themeColor="onSurface">
          Lihat detail →
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerText: {
    flexShrink: 1,
    gap: Spacing.one,
  },
  courseName: {
    flexShrink: 1,
  },
  schedule: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
