import { Tabs, router } from 'expo-router';
import { Pressable, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/**
 * Tab modul Asisten Praktikum.
 * - HP: tab bar di bawah.
 * - Layar lebar (>= 900px): sidebar kiri (FR-14).
 */
export default function AsprakTabsLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.backgroundSelected },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: 600, fontSize: 18 },
        tabBarActiveTintColor: theme.link,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundSelected,
          borderTopColor: theme.border,
          borderRightColor: theme.border,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: 700 },
        tabBarPosition: isWide ? 'left' : 'bottom',
        tabBarVariant: isWide ? 'material' : 'uikit',
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ganti peran"
            onPress={() => router.replace('/')}
            hitSlop={8}
            style={{ paddingHorizontal: 12 }}>
            <ThemedText type="smallBold" style={{ color: theme.link }}>
              Ganti peran
            </ThemedText>
          </Pressable>
        ),
      }}>
      <Tabs.Screen name="index" options={{ title: 'Jadwal' }} />
      <Tabs.Screen name="kelas" options={{ title: 'Kelas' }} />
      <Tabs.Screen name="rekap" options={{ title: 'Rekap' }} />
      <Tabs.Screen name="izin" options={{ title: 'Izin' }} />
    </Tabs>
  );
}
