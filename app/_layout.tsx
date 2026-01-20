import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { socket } from '../services/socket';

export default function RootLayout() {
  const { token, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } 
    else if (token) {
      // Re-connect Socket
      if (!socket.connected) {
        socket.connect();
        if (user?.id) socket.emit('join', user.id);
        if (user?.role === 'canteen') socket.emit('join', 'canteen_room');
      }

      // Role Redirects
      if (user?.role === 'canteen') {
        if (segments[0] !== 'canteen-dashboard') router.replace('/canteen-dashboard');
      } else if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [token, segments, isReady, user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="canteen-dashboard" options={{ animation: 'fade' }} />
      
      {/* Feature Screens - Names must match filenames EXACTLY */}
      <Stack.Screen name="request-now" options={{ title: 'Request Meal', animation: 'slide_from_right' }} />
      <Stack.Screen name="payment" options={{ title: 'Payment', animation: 'slide_from_right' }} />
      <Stack.Screen name="BookMenu" options={{ title: 'Book Meal', animation: 'slide_from_right' }} />
    </Stack>
  );
}