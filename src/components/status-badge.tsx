import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Palette } from '@/constants/theme';
import type { SessionStatus } from '@/types/session';

type StatusMeta = {
  label: string;
  color: string;
  backgroundColor: string;
};

const SESSION_STATUS_META: Record<SessionStatus, StatusMeta> = {
  'belum-dibuka': { label: 'Belum Dibuka', color: Palette.inkSoft, backgroundColor: Palette.lime },
  berlangsung: { label: 'Sedang Berlangsung', color: Palette.link, backgroundColor: Palette.mint },
  selesai: { label: 'Selesai', color: Palette.inkSoft, backgroundColor: Palette.button },
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const meta = SESSION_STATUS_META[status];

  return (
    <View style={[styles.badge, { backgroundColor: meta.backgroundColor }]}>
      <ThemedText type="smallBold" style={[styles.badgeText, { color: meta.color }]}>
        {meta.label}
      </ThemedText>
    </View>
  );
}

export function AttendanceBadge({ attended }: { attended: boolean }) {
  return (
    <View style={[styles.badge, attended ? styles.attended : styles.absent]}>
      <ThemedText
        type="smallBold"
        style={[styles.badgeText, attended ? styles.attendedText : styles.absentText]}>
        {attended ? 'Hadir' : 'Belum Hadir'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  attended: {
    backgroundColor: Palette.mint,
  },
  absent: {
    backgroundColor: Palette.dangerSurface,
  },
  attendedText: {
    color: Palette.link,
  },
  absentText: {
    color: Palette.danger,
  },
});
