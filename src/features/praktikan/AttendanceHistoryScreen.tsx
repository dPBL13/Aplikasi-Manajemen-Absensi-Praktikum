// FR-09
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from './EmptyState';
import { CURRENT_STUDENT_ID, useAttendanceStore } from './store';
import { colors } from './theme';

export function AttendanceHistoryScreen() {
  const { sessions, attendance } = useAttendanceStore();
  const mine = attendance.filter((a) => a.studentId === CURRENT_STUDENT_ID);
  const finished = sessions.filter((s) => s.status !== 'scheduled');
  const hadir = mine.filter((a) => a.status === 'present').length;

  return (
    <FlatList
      data={finished}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={
        <View style={styles.summary}>
          <Text style={styles.summaryNum}>{hadir}/{sessions.length}</Text>
          <Text style={styles.summaryLabel}>pertemuan dihadiri</Text>
        </View>
      }
      ListEmptyComponent={<EmptyState title="Belum ada riwayat kehadiran" hint="Riwayat muncul setelah sesi pertama dimulai." />}
      renderItem={({ item }) => {
        const rec = mine.find((a) => a.sessionId === item.id);
        const present = rec?.status === 'present';
        const label = present ? `Hadir · ${rec?.checkedInAt ?? '-'}` : item.status === 'completed' ? 'Tidak hadir' : 'Belum presensi';
        const color = present ? colors.success : item.status === 'completed' ? colors.danger : colors.muted;
        return (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.date}</Text>
            </View>
            <Text style={[styles.status, { color }]}>{label}</Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 4 },
  summaryNum: { fontSize: 28, fontWeight: '800', color: colors.primary },
  summaryLabel: { fontSize: 13, color: colors.muted },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  status: { fontSize: 13, fontWeight: '700' },
});