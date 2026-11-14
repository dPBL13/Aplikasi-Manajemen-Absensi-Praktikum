import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AttendanceHistoryScreen } from './AttendanceHistoryScreen';
import {
  CURRENT_PRAKTIKAN,
  getCurrentPraktikan,
  setCurrentPraktikan,
} from './services/praktikan-service';
import { SessionDetailScreen } from './SessionDetailScreen';
import { SessionListScreen } from './SessionListScreen';

type MainTab = 'sesi' | 'riwayat';

export function PraktikanModule() {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<MainTab>('sesi');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(getCurrentPraktikan());

  const isCompact = width < 600;
  const contentWidth = Math.min(width, MaxContentWidth);

  // Switch dummy auth untuk pengujian skenario
  const handleToggleAuth = () => {
    if (currentUser) {
      setCurrentPraktikan(null);
      setCurrentUser(null);
    } else {
      setCurrentPraktikan(CURRENT_PRAKTIKAN);
      setCurrentUser(CURRENT_PRAKTIKAN);
    }
  };

  return (
    <ThemedView style={styles.root}>
      <View style={[styles.container, { width: contentWidth }]}>
        {/* Header Modul Praktikan */}
        <ThemedView
          type="surfaceAlt"
          style={[
            styles.header,
            isCompact && styles.headerCompact,
            { borderColor: theme.border },
          ]}>
          <View style={styles.headerInfo}>
            <ThemedText type="small" themeColor="textSecondary">
              Modul Praktikan · Portal Absensi
            </ThemedText>
            <ThemedText type="smallBold" style={styles.userName}>
              {currentUser ? `${currentUser.name} (${currentUser.nim})` : 'Belum Masuk (Tamu)'}
            </ThemedText>
            {currentUser?.classGroup ? (
              <ThemedText type="code" themeColor="textSecondary">
                {currentUser.classGroup}
              </ThemedText>
            ) : null}
          </View>

          {/* Tombol Simulasi Login / Logout Dummy */}
          {__DEV__ ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={currentUser ? 'Simulasi keluar' : 'Simulasi masuk'}
              onPress={handleToggleAuth}
              style={({ pressed }) => [
                styles.authBtn,
                {
                  backgroundColor: currentUser
                    ? theme.backgroundElement
                    : theme.backgroundSelected,
                  borderColor: theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.link }}>
                {currentUser ? 'Simulasi Keluar' : 'Simulasi Masuk'}
              </ThemedText>
            </Pressable>
          ) : null}
        </ThemedView>

        {/* Tab Navigasi Utama (FR-25) */}
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => {
              setActiveTab('sesi');
              setSelectedSessionId(null);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'sesi' }}
            style={[
              styles.navTab,
              {
                backgroundColor:
                  activeTab === 'sesi'
                    ? theme.backgroundSelected
                    : theme.surfaceAlt,
                borderColor: activeTab === 'sesi' ? theme.link : theme.border,
              },
            ]}>
            <ThemedText
              type="smallBold"
              style={{
                color: activeTab === 'sesi' ? theme.link : theme.text,
              }}>
              📅 Jadwal Sesi Praktikum
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              setActiveTab('riwayat');
              setSelectedSessionId(null);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'riwayat' }}
            style={[
              styles.navTab,
              {
                backgroundColor:
                  activeTab === 'riwayat'
                    ? theme.backgroundSelected
                    : theme.surfaceAlt,
                borderColor: activeTab === 'riwayat' ? theme.link : theme.border,
              },
            ]}>
            <ThemedText
              type="smallBold"
              style={{
                color: activeTab === 'riwayat' ? theme.link : theme.text,
              }}>
              📜 Riwayat & Status Izin
            </ThemedText>
          </Pressable>
        </View>

        {/* Konten Tab Aktif */}
        <View style={styles.contentArea}>
          {activeTab === 'riwayat' ? (
            <AttendanceHistoryScreen />
          ) : selectedSessionId ? (
            <SessionDetailScreen
              sessionId={selectedSessionId}
              onBack={() => setSelectedSessionId(null)}
            />
          ) : (
            <SessionListScreen onSelect={(id) => setSelectedSessionId(id)} />
          )}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.two,
  },
  headerCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerInfo: {
    gap: Spacing.half,
  },
  userName: {
    fontSize: 16,
    lineHeight: 22,
  },
  authBtn: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.two + 4,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.75,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  navTab: {
    flex: 1,
    paddingVertical: Spacing.two + 2,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
    flex: 1,
  },
});
