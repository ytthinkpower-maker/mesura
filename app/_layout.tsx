import { DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/components/auth-provider';
import { BrandColor } from '@/constants/brand';

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

/**
 * Hold the splash screen until we know whether there is a stored session.
 * Without this, a returning user sees the sign-in screen flash past before the
 * session loads from disk — which reads as "it forgot me", the exact thing this
 * product promises never to do.
 */
void SplashScreen.preventAutoHideAsync();

function SplashGate() {
  const { initializing } = useAuth();

  useEffect(() => {
    if (!initializing) void SplashScreen.hideAsync();
  }, [initializing]);

  return null;
}

function RootNavigator() {
  const { session, recoveringPassword } = useAuth();

  /**
   * A password-recovery session is a real session, but it is not "signed in":
   * the user still has to choose a new password. Treating it as signed out
   * keeps them in the auth stack until they do.
   */
  const signedIn = !!session && !recoveringPassword;

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: BrandColor.paper } }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/*
          Urge SOS covers the tabs completely: the point of the screen is that
          nothing else is competing for attention while an urge passes.
        */}
        <Stack.Screen
          name="urge"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={MesuraTheme}>
      <AuthProvider>
        <SplashGate />
        <RootNavigator />
      </AuthProvider>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
