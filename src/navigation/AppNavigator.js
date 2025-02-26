import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SongDetailScreen from '../screens/SongDetailScreen';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <NavigationContainer>
      <Stack.Navigator
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
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'AkorMate',
          }}
        />
        <Stack.Screen
          name="SongDetail"
          component={SongDetailScreen}
          options={{
            title: 'Şarkı Detayı',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
