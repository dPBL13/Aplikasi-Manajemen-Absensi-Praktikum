import { StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';
import type { SessionStatus } from './types';

const MAP: Record<SessionStatus, { label: string; fg: string; bg: string }> = {
  scheduled: { label: 'Belum Dibuka', fg: colors.muted, bg: colors.neutralBg },
  ongoing: { label: 'Sedang Berlangsung', fg: colors.success, bg: colors.successBg },
  completed: { label: 'Selesai', fg: colors.warning, bg: colors.warningBg },
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const m = MAP[status];
  return (
    <View style={[styles.badge, { backgroundColor: m.bg }]}>
      <Text style={[styles.text, { color: m.fg }]}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '600' },
});