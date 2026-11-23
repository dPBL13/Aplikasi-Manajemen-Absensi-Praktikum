import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { PERMIT_CATEGORY_LABEL, PERMIT_STATUS_LABEL, SESSION_STATUS_LABEL } from '@/constants/labels';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { PermitCategory, PermitStatus, SessionStatus } from '@/types/domain';

type StatusMeta = {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor?: string;
};

const SESSION_STATUS_META: Record<SessionStatus, StatusMeta> = {
  'belum-dibuka': {
    label: SESSION_STATUS_LABEL['belum-dibuka'],
    color: Palette.textPrimary,
    backgroundColor: Palette.statusPending,
    borderColor: Palette.mossPrimary,
  },
  berlangsung: {
    label: SESSION_STATUS_LABEL.berlangsung,
    color: Palette.textOnDark,
    backgroundColor: Palette.statusActive,
  },
  selesai: {
    label: SESSION_STATUS_LABEL.selesai,
    color: Palette.textPrimary,
    backgroundColor: Palette.statusCompleted,
  },
};

const PERMIT_STATUS_META: Record<PermitStatus, StatusMeta> = {
  menunggu: {
    label: PERMIT_STATUS_LABEL.menunggu,
    color: Palette.textPrimary,
    backgroundColor: Palette.statusPending,
    borderColor: Palette.mossPrimary,
  },
  diterima: {
    label: PERMIT_STATUS_LABEL.diterima,
    color: Palette.textOnDark,
    backgroundColor: Palette.statusActive,
  },
  ditolak: {
    label: PERMIT_STATUS_LABEL.ditolak,
    color: Palette.onStatusAlert,
    backgroundColor: Palette.statusAlert,
    borderColor: Palette.alertBorder,
  },
};

const CATEGORY_NEUTRAL: StatusMeta = {
  label: '',
  color: Palette.textPrimary,
  backgroundColor: Palette.mossCanvas,
};

const PERMIT_CATEGORY_META: Record<PermitCategory, StatusMeta> = {
  sakit: {
    label: PERMIT_CATEGORY_LABEL.sakit,
    color: Palette.onStatusAlert,
    backgroundColor: Palette.statusAlert,
    borderColor: Palette.alertBorder,
  },
  'acara-kampus': {
    ...CATEGORY_NEUTRAL,
    label: PERMIT_CATEGORY_LABEL['acara-kampus'],
  },
  keluarga: {
    ...CATEGORY_NEUTRAL,
    label: PERMIT_CATEGORY_LABEL.keluarga,
  },
  lainnya: {
    ...CATEGORY_NEUTRAL,
    label: PERMIT_CATEGORY_LABEL.lainnya,
  },
  'belum-diklasifikasi': {
    label: PERMIT_CATEGORY_LABEL['belum-diklasifikasi'],
    color: Palette.textPrimary,
    backgroundColor: Palette.mossSurfaceElevated,
    borderColor: Palette.mossPrimary,
  },
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  return <Badge meta={SESSION_STATUS_META[status]} />;
}

export function PermitStatusBadge({ status }: { status: PermitStatus }) {
  return <Badge meta={PERMIT_STATUS_META[status]} />;
}

export function PermitCategoryBadge({ category }: { category: PermitCategory }) {
  return <Badge meta={PERMIT_CATEGORY_META[category]} />;
}

export function AttendanceBadge({ attended }: { attended: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        attended
          ? { backgroundColor: Palette.statusActive }
          : {
              backgroundColor: Palette.statusAlert,
              borderWidth: 1,
              borderColor: Palette.alertBorder,
            },
      ]}>
      <ThemedText
        type="labelSm"
        style={{ color: attended ? Palette.textOnDark : Palette.onStatusAlert }}>
        {attended ? 'Hadir' : 'Belum Hadir'}
      </ThemedText>
    </View>
  );
}

function Badge({ meta }: { meta: StatusMeta }) {
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
      <ThemedText type="labelSm" style={{ color: meta.color }}>
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
