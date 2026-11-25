import { Tabs, router } from 'expo-router';
import { Pressable, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Tab modul Asisten Praktikum.
 * - HP: tab bar di bawah (eclipse deep).
 * - Layar lebar (>= 900px): sidebar kiri (FR-14).
 */
export default function AsprakTabsLayout() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.text,
        headerTitleStyle: { fontFamily: Fonts.display, fontSize: 20 },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundSelected,
          borderTopColor: theme.highlight,
          borderRightColor: theme.highlight,
        },
        tabBarLabelStyle: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
        tabBarPosition: isWide ? 'left' : 'bottom',
        tabBarVariant: isWide ? 'material' : 'uikit',
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ganti peran"
            onPress={() => router.replace('/')}
            hitSlop={8}
            style={{
              backgroundColor: theme.highlight,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: Radius.full,
              paddingVertical: Spacing.one,
              paddingHorizontal: Spacing.md,
              marginRight: Spacing.three,
            }}>
            <ThemedText type="labelSm" themeColor="text">
              Ganti peran
            </ThemedText>
          </Pressable>
        ),
      }}>
      <Tabs.Screen name="index" options={{ title: 'Jadwal' }} />
      <Tabs.Screen name="kelas" options={{ title: 'Kelas' }} />
      <Tabs.Screen name="rekap" options={{ title: 'Rekap' }} />
      <Tabs.Screen name="izin" options={{ title: 'Izin' }} />
      <Tabs.Screen name="lab" options={{ title: 'Lab' }} />
    </Tabs>
  );
}
