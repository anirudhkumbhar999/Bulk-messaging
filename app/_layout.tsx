import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useSegments, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayoutNav() {
  const { authState, checkUserProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(app)';

    if (!authState.loading) {
      if (!authState.isAuthenticated && inAuthGroup) {
        // Redirect to login if trying to access protected routes while not authenticated
        router.replace('/');
      } else if (authState.isAuthenticated && !inAuthGroup) {
        // Redirect to home if authenticated and trying to access auth routes
        router.replace('/(app)/home');
      }
    }
  }, [authState.isAuthenticated, authState.loading, segments]);

  return (
    <Stack screenOptions={{
      headerStyle: {
        backgroundColor: '#3498db',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
      },
      headerShadowVisible: false,
      contentStyle: {
        backgroundColor: '#fff',
      },
    }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Welcome',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign Up',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="admin-login"
        options={{
          title: 'Admin Login',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="admin-dashboard"
        options={{
          title: 'Admin Dashboard',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(app)"
        options={{
          headerShown: false
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}