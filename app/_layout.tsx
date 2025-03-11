import { Stack } from 'expo-router';
import { useColorScheme, View, Text } from 'react-native';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { AuthProvider } from '../src/context/AuthContext';
import { useEffect, useState } from 'react';
import NetworkService from '../src/services/networkService';

export default function Layout() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // İlk bağlantı kontrolü
    NetworkService.checkConnection().then(isConnected => {
      setIsOffline(!isConnected);
    });

    // Bağlantı değişikliklerini dinle
    const unsubscribe = NetworkService.subscribeToConnectionChanges(isConnected => {
      setIsOffline(!isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthProvider>
      {isOffline && (
        <View style={{ 
          backgroundColor: theme.error, 
          padding: 5,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{ color: theme.background }}>
            Çevrimdışı mod - Sadece indirilen şarkılar görüntülenebilir
          </Text>
        </View>
      )}
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
