import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/** Stack modul Praktikan (FR-25). */
export default function PraktikanLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.backgroundSelected },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: 600, fontSize: 18 },
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Detail Sesi' }} />
    </Stack>
  );
}
