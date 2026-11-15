import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { PERMIT_CATEGORY_LABEL, PERMIT_STATUS_LABEL, SESSION_STATUS_LABEL } from '@/constants/labels';
import { Palette } from '@/constants/theme';
import type { PermitCategory, PermitStatus, SessionStatus } from '@/types/domain';

type StatusMeta = {
  label: string;
  color: string;
  backgroundColor: string;
};

const SESSION_STATUS_META: Record<SessionStatus, StatusMeta> = {
  'belum-dibuka': {
    label: SESSION_STATUS_LABEL['belum-dibuka'],
    color: Palette.inkSoft,
    backgroundColor: Palette.lime,
  },
  berlangsung: {
    label: SESSION_STATUS_LABEL.berlangsung,
    color: Palette.link,
    backgroundColor: Palette.mint,
  },
  selesai: {
    label: SESSION_STATUS_LABEL.selesai,
    color: Palette.inkSoft,
    backgroundColor: Palette.button,
  },
};

const PERMIT_STATUS_META: Record<PermitStatus, StatusMeta> = {
  menunggu: {
    label: PERMIT_STATUS_LABEL.menunggu,
    color: Palette.inkSoft,
    backgroundColor: Palette.lime,
  },
  diterima: {
    label: PERMIT_STATUS_LABEL.diterima,
    color: Palette.link,
    backgroundColor: Palette.mint,
  },
  ditolak: {
    label: PERMIT_STATUS_LABEL.ditolak,
    color: Palette.danger,
    backgroundColor: Palette.dangerSurface,
  },
};

const PERMIT_CATEGORY_META: Record<PermitCategory, StatusMeta> = {
  sakit: { label: PERMIT_CATEGORY_LABEL.sakit, color: Palette.link, backgroundColor: Palette.mint },
  'acara-kampus': {
    label: PERMIT_CATEGORY_LABEL['acara-kampus'],
    color: Palette.inkSoft,
    backgroundColor: Palette.button,
  },
  keluarga: {
    label: PERMIT_CATEGORY_LABEL.keluarga,
    color: Palette.link,
    backgroundColor: Palette.mint,
  },
  lainnya: {
    label: PERMIT_CATEGORY_LABEL.lainnya,
    color: Palette.inkSoft,
    backgroundColor: Palette.button,
  },
  'belum-diklasifikasi': {
    label: PERMIT_CATEGORY_LABEL['belum-diklasifikasi'],
    color: Palette.inkSoft,
    backgroundColor: Palette.surface,
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
    <View style={[styles.badge, attended ? styles.attended : styles.absent]}>
      <ThemedText
        type="smallBold"
        style={[styles.badgeText, attended ? styles.attendedText : styles.absentText]}>
        {attended ? 'Hadir' : 'Belum Hadir'}
      </ThemedText>
    </View>
  );
}

function Badge({ meta }: { meta: StatusMeta }) {
  return (
    <View style={[styles.badge, { backgroundColor: meta.backgroundColor }]}>
      <ThemedText type="smallBold" style={[styles.badgeText, { color: meta.color }]}>
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
