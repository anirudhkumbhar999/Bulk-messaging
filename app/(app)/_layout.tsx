import { Stack } from 'expo-router';
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function AppLayout() {
  return (
    <ProtectedRoute>
      <Stack>
        <Stack.Screen
          name="home"
          options={{
            title: '',
            headerBackVisible: false,
            headerStyle: {
              backgroundColor: '#f4511e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack>
    </ProtectedRoute>
  );
}
