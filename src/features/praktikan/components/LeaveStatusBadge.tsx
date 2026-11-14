import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette } from '@/constants/theme';
import type { LeaveStatus } from '../types';

type LeaveBadgeMeta = {
  label: string;
  textColor: string;
  backgroundColor: string;
};

const LEAVE_STATUS_META: Record<LeaveStatus, LeaveBadgeMeta> = {
  menunggu: {
    label: 'Menunggu Verifikasi',
    textColor: Palette.inkSoft,
    backgroundColor: Palette.lime,
  },
  diterima: {
    label: 'Izin Diterima',
    textColor: Palette.link,
    backgroundColor: Palette.mint,
  },
  ditolak: {
    label: 'Izin Ditolak',
    textColor: Palette.danger,
    backgroundColor: Palette.dangerSurface,
  },
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const meta = LEAVE_STATUS_META[status] ?? LEAVE_STATUS_META.menunggu;

  return (
    <View style={[styles.badge, { backgroundColor: meta.backgroundColor }]}>
      <ThemedText type="smallBold" style={[styles.badgeText, { color: meta.textColor }]}>
        {meta.label}
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
});
