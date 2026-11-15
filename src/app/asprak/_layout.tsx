import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/**
 * Stack modul Asisten Praktikum.
 * Halaman daftar ada di grup `(tabs)`; halaman detail/form push di atas tab bar.
 */
export default function AsprakLayout() {
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
      <Stack.Screen name="kelas/baru" options={{ title: 'Kelas Baru' }} />
      <Stack.Screen name="kelas/[id]" options={{ title: 'Detail Kelas' }} />
      <Stack.Screen name="session/baru" options={{ title: 'Jadwal Baru' }} />
      <Stack.Screen name="session/[id]" options={{ title: 'Detail Sesi' }} />
      <Stack.Screen name="izin/[id]" options={{ title: 'Detail Pengajuan Izin' }} />
    </Stack>
  );
}
