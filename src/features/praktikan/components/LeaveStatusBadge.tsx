import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { PermitStatus } from '@/types/domain';
import { StyleSheet, View } from 'react-native';

type LeaveBadgeMeta = {
  label: string;
  textColor: string;
  backgroundColor: string;
  borderColor?: string;
};

const LEAVE_STATUS_META: Record<PermitStatus, LeaveBadgeMeta> = {
  menunggu: {
    label: 'Menunggu Verifikasi',
    textColor: Palette.textPrimary,
    backgroundColor: Palette.statusPending,
    borderColor: Palette.mossPrimary,
  },
  diterima: {
    label: 'Izin Diterima',
    textColor: Palette.textOnDark,
    backgroundColor: Palette.statusActive,
  },
  ditolak: {
    label: 'Izin Ditolak',
    textColor: Palette.onStatusAlert,
    backgroundColor: Palette.statusAlert,
    borderColor: Palette.alertBorder,
  },
};

export function LeaveStatusBadge({ status }: { status: PermitStatus }) {
  const meta = LEAVE_STATUS_META[status] ?? LEAVE_STATUS_META.menunggu;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: meta.backgroundColor,
          borderWidth: meta.borderColor ? 1 : 0,
          borderColor: meta.borderColor,
        },
      ]}>
      <ThemedText type="labelSm" style={{ color: meta.textColor }}>
        {meta.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
});
