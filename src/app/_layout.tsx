import { Commissioner_400Regular, Commissioner_500Medium, Commissioner_600SemiBold, Commissioner_700Bold } from '@expo-google-fonts/commissioner';
import { RedHatDisplay_600SemiBold, RedHatDisplay_700Bold } from '@expo-google-fonts/red-hat-display';
import { SplineSansMono_500Medium } from '@expo-google-fonts/spline-sans-mono';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors, Fonts } from '@/constants/theme';
import { AuthProvider } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.accent,
    background: Colors.dark.background,
    card: Colors.dark.backgroundSelected,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.danger,
  },
};

/**
 * Root navigator. The app is dark-only (Eclipse & Moss) and loads the three
 * typefaces from the stitched designs before the first screen renders.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [Fonts.display]: RedHatDisplay_700Bold,
    [Fonts.displaySemiBold]: RedHatDisplay_600SemiBold,
    [Fonts.body]: Commissioner_400Regular,
    [Fonts.bodyMedium]: Commissioner_500Medium,
    [Fonts.bodySemiBold]: Commissioner_600SemiBold,
    [Fonts.bodyBold]: Commissioner_700Bold,
    [Fonts.mono]: SplineSansMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <AuthProvider>
          <AnimatedSplashOverlay />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.dark.backgroundSelected },
              headerTintColor: Colors.dark.text,
              headerTitleStyle: { fontFamily: Fonts.display, fontSize: 18 },
              contentStyle: { backgroundColor: Colors.dark.background },
            }}>
            <Stack.Screen name="index" options={{ title: 'Manajemen Absensi Praktikum' }} />
            <Stack.Screen name="asprak" options={{ headerShown: false }} />
            <Stack.Screen name="praktikan" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
