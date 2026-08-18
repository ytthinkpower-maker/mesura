import { DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/components/auth-provider';
import { BrandColor } from '@/constants/brand';
import { configureNotificationHandler } from '@/lib/reminders';

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

/**
 * Set before anything can be delivered. The evening nudge is allowed to show
 * while the app is open — it is the same nudge either way — and is never
 * allowed to make a sound.
 */
configureNotificationHandler();

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
        {/*
          A milestone covers everything too: it is the one screen the user did
          not ask for, so it had better be worth the whole display.
        */}
        <Stack.Screen
          name="milestone"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
        {/* Corrections and the developer menu are errands — a sheet each. */}
        <Stack.Screen name="entries" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="dev-menu" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    /*
      Gesture handler needs a root of its own, above everything that might use
      one. Nothing did until the entry list learned to swipe; without this the
      swipe silently does nothing rather than failing loudly.
    */
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={MesuraTheme}>
        <AuthProvider>
          <SplashGate />
          <RootNavigator />
        </AuthProvider>
        <StatusBar style="dark" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BrandColor.paper,
  },
});
