import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../../src/theme/colors';

export default function AuthLayout() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.card,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Giriş Yap',
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Kayıt Ol',
        }}
      />
    </Stack>
  );
}
