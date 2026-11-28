import { router, Tabs } from 'expo-router';
import { Pressable, useWindowDimensions } from 'react-native';

import { TabBarIcon } from '@/components/tab-bar-icon';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Tab modul Praktikan: Sesi, Izin, Riwayat, & Peta Lab. */
export default function PraktikanTabsLayout() {
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sesi',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="calendar" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="izin"
        options={{
          title: 'Izin',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="permit" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="riwayat"
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="history" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="maps-tab"
        options={{
          title: 'Peta Lab',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="map" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="testAi"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
