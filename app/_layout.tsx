import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { AuthProvider } from '../src/context/AuthContext';

export default function Layout() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: theme.background,
          },
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'AkorMate',
          }}
        />
        <Stack.Screen
          name="songDetail"
          options={{
            title: 'Şarkı Detayı',
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Profilim',
          }}
        />
        <Stack.Screen
          name="favorites"
          options={{
            title: 'Beğendiklerim',
          }}
        />
        <Stack.Screen
          name="repertoires"
          options={{
            title: 'Repertuarlarım',
          }}
        />
        <Stack.Screen
          name="private-songs"
          options={{
            title: 'Özel Şarkılarım',
          }}
        />
        <Stack.Screen
          name="auth/login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chords"
          options={{
            title: 'Akorlar',
          }}
        />
        <Stack.Screen
          name="tuner"
          options={{
            title: 'Akort Et',
            headerShown: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
