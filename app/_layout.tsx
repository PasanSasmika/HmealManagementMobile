import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { socket } from '../services/socket'; // Import socket to connect on auto-login

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
      // 1. Not logged in -> Go to Login
      router.replace('/(auth)/login');
    } 
    else if (token) {
      // 2. Logged in -> Re-connect Socket
      if (!socket.connected) {
        socket.connect();
        if (user?.id) socket.emit('join', user.id);
        if (user?.role === 'canteen') socket.emit('join', 'canteen_room');
      }

      // 3. Role-Based Redirect
      if (user?.role === 'canteen') {
        // If logged in as Canteen but not on dashboard, redirect
        // We check the path to prevent infinite loops
        if (segments[0] !== 'canteen-dashboard') {
          router.replace('/canteen-dashboard');
        }
      } else {
        // Employee -> Go to Tabs
        if (inAuthGroup) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [token, segments, isReady, user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="canteen-dashboard" options={{ animation: 'fade' }} />
    </Stack>
  );
}