import { StyleSheet, View } from 'react-native';

import { AttendanceBadge } from './status-badge';
import { BottomSheetModal } from './bottom-sheet-modal';
import { InfoRow } from './info-row';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Participant, PracticumSession } from '@/types/session';

type ParticipantDetailModalProps = {
  participant: Participant | null;
  session: PracticumSession;
  onClose: () => void;
};

export function ParticipantDetailModal({
  participant,
  session,
  onClose,
}: ParticipantDetailModalProps) {
  const theme = useTheme();

  return (
    <BottomSheetModal
      visible={participant !== null}
      title="Detail Kehadiran"
      description="Informasi presensi praktikan pada sesi ini."
      onClose={onClose}>
      {participant ? (
        <View style={styles.content}>
          <View style={styles.identity}>
            <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
              <ThemedText type="smallBold" style={[styles.avatarText, { color: theme.accentText }]}>
                {getInitials(participant.name)}
              </ThemedText>
            </View>
            <View style={styles.identityText}>
              <ThemedText type="default" style={styles.name}>
                {participant.name}
              </ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                {participant.nim}
              </ThemedText>
            </View>
          </View>

          <AttendanceBadge attended={Boolean(participant.checkInAt)} />

          <View style={[styles.details, { borderTopColor: theme.border }]}>
            <InfoRow
              label="Waktu presensi"
              value={participant.checkInAt ?? 'Belum tercatat'}
              valueType={participant.checkInAt ? 'code' : 'small'}
            />
            <InfoRow label="Praktikum" value={session.courseName} />
            <InfoRow label="Kelas" value={session.classGroup} />
            <InfoRow
              label="Jadwal"
              value={`${session.dayLabel}, ${session.startTime}–${session.endTime}`}
            />
          </View>

          {!participant.checkInAt ? (
            <ThemedText type="small" themeColor="textSecondary">
              Praktikan ini belum melakukan presensi pada sesi ini.
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </BottomSheetModal>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  identityText: {
    flexShrink: 1,
    gap: 2,
  },
  name: {
    fontWeight: 700,
  },
  details: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
