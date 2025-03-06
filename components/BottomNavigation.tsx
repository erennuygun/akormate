import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { useAuth } from '../src/context/AuthContext';

interface Props {
  currentRoute?: string;
}

export const BOTTOM_NAV_HEIGHT = Platform.OS === 'ios' ? 85 : 65;

export default function BottomNavigation({ currentRoute }: Props) {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user } = useAuth();

  return (
    <View style={[styles.bottomNav, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => router.push('/chords')}
      >
        <Ionicons 
          name={currentRoute === '/chords' ? "musical-notes" : "musical-notes-outline"} 
          size={24} 
          color={currentRoute === '/chords' ? theme.primary : theme.text} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.homeButton, { backgroundColor: theme.primary }]}
        onPress={() => router.replace('/')}
      >
        <Ionicons 
          name="home" 
          size={30} 
          color="#FFF" 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => {
          if (!user) {
            router.push('/auth/login');
          } else {
            router.push('/profile');
          }
        }}
      >
        <Ionicons 
          name={currentRoute === '/profile' ? "person" : "person-outline"} 
          size={24} 
          color={currentRoute === '/profile' ? theme.primary : theme.text} 
        />
      </TouchableOpacity>
    </View>
  );
}

interface Styles {
  bottomNav: ViewStyle;
  navButton: ViewStyle;
  homeButton: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: BOTTOM_NAV_HEIGHT,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 0.5,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
  },
  navButton: {
    padding: 10,
  },
  homeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
