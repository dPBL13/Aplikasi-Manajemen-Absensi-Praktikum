import { router, Tabs } from 'expo-router';
import { Pressable, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** Tab modul Praktikan: Sesi & Riwayat. */
export default function PraktikanTabsLayout() {
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
      <Tabs.Screen name="index" options={{ title: 'Sesi' }} />
      <Tabs.Screen name="riwayat" options={{ title: 'Riwayat' }} />
      <Tabs.Screen name="testAi" options={{ title: 'Test AI' }} />
    </Tabs>
  );
}
