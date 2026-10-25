import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AttendanceHistoryScreen } from './AttendanceHistoryScreen';
import { SessionDetailScreen } from './SessionDetailScreen';
import { SessionListScreen } from './SessionListScreen';
import { colors } from './theme';

type Tab = 'sesi' | 'riwayat';

export function PraktikanModule() {
  const [tab, setTab] = useState<Tab>('sesi');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const maxWidth = width >= 768 ? 720 : undefined; // responsif: konten dibatasi di layar lebar

  return (
    <View style={styles.root}>
      <View style={[styles.container, { maxWidth }]}>
        <View style={styles.tabs}>
          {(['sesi', 'riwayat'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => { setTab(t); setSelectedId(null); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'sesi' ? 'Sesi Praktikum' : 'Riwayat Kehadiran'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1 }}>
          {tab === 'riwayat' ? (
            <AttendanceHistoryScreen />
          ) : selectedId ? (
            <SessionDetailScreen sessionId={selectedId} onBack={() => setSelectedId(null)} />
          ) : (
            <SessionListScreen onSelect={setSelectedId} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center' },
  container: { flex: 1, width: '100%' },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.neutralBg, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.onPrimary },
});