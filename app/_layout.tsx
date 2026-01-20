import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';

export default function RootLayout() {
  const { token } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // 1. Wait for the Layout to mount to avoid "Attempted to navigate" errors
  useEffect(() => {
    setIsReady(true);
  }, []);

  // 2. Navigation Guard logic
  useEffect(() => {
    if (!isReady) return;

    // segments[0] tells us if we are in '(auth)' or '(tabs)'
    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // If no token and trying to access the app, force Login
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // If token exists and we are at the Login screen, redirect to Home
      router.replace('/(tabs)');
    }
  }, [token, segments, isReady]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
    </Stack>
  );
}