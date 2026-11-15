import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

/**
 * Root navigator.
 *
 * - `index`      : pemilih peran (sementara, sampai modul autentikasi siap).
 * - `asprak`     : seluruh modul Asisten Praktikum (FR-05 – FR-09, FR-12/13, FR-19/20).
 * - `praktikan`  : seluruh modul Praktikan (FR-07, FR-09 – FR-11, FR-14).
 *
 * Setiap modul punya Stack + Tabs sendiri di dalam foldernya.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.accent,
      background: theme.background,
      card: theme.backgroundSelected,
      text: theme.text,
      border: theme.border,
      notification: theme.danger,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.backgroundSelected },
            headerTintColor: theme.text,
            headerTitleStyle: { fontWeight: 600, fontSize: 18 },
            contentStyle: { backgroundColor: theme.background },
          }}>
          <Stack.Screen name="index" options={{ title: 'Manajemen Absensi Praktikum' }} />
          <Stack.Screen name="asprak" options={{ headerShown: false }} />
          <Stack.Screen name="praktikan" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );

}
