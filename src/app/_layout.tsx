import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider } from '@/context/session-context';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

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
      <SessionProvider>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            header: ({ options }) => (
              <SafeAreaView
                edges={['top']}
                style={{
                  backgroundColor: theme.backgroundSelected,
                }}
              >
                <View
                  style={{
                    height: 40, 
                    justifyContent: 'center',
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.background,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '600',
                      color: theme.text,
                    }}
                  >
                    {options.title}
                  </Text>
                </View>
              </SafeAreaView>
            ),
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Jadwal Praktikum',headerShown:true }} />
          <Stack.Screen name="session/[id]" options={{ title: 'Detail Sesi' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SessionProvider>
    </ThemeProvider>
  );
}