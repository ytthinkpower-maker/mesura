import { DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { BrandColor } from '@/constants/brand';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Mesura is never dark-dominant, so there is exactly one navigation theme. */
const MesuraTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: BrandColor.spruce,
    background: BrandColor.paper,
    card: BrandColor.paper,
    text: BrandColor.ink,
    border: BrandColor.line,
    notification: BrandColor.rose,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={MesuraTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: BrandColor.paper } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
