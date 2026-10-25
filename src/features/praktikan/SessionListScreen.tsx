// FR-07 (bagian daftar sesi)
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';
import { CURRENT_STUDENT_ID, useAttendanceStore } from './store';
import { colors } from './theme';

export function SessionListScreen({ onSelect }: { onSelect: (sessionId: string) => void }) {
  const { sessions, attendance } = useAttendanceStore();
  return (
    <FlatList
      data={sessions}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListEmptyComponent={<EmptyState title="Belum ada sesi praktikum" hint="Sesi akan muncul setelah dijadwalkan asprak." />}
      renderItem={({ item }) => {
        const present = attendance.find((a) => a.sessionId === item.id && a.studentId === CURRENT_STUDENT_ID)?.status === 'present';
        return (
          <Pressable
            onPress={() => onSelect(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Buka detail ${item.title}`}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.meta}>{item.date} · {item.time} · {item.room}</Text>
            {present ? <Text style={styles.present}>✓ Kamu sudah presensi</Text> : null}
            {item.status === 'ongoing' && !present ? <Text style={styles.cta}>Sesi sedang berlangsung, ayo presensi</Text> : null}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
  present: { fontSize: 13, color: colors.success, fontWeight: '600' },
  cta: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});