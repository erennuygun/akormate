import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const buttonWidth = width * 0.8;

export default function Home() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const renderButton = (
    title: string,
    icon: string,
    onPress?: () => void,
    disabled?: boolean
  ) => (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.card },
        disabled && styles.disabledButton
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon as any} size={24} color={disabled ? theme.text + '40' : theme.primary} />
      <Text style={[
        styles.buttonText,
        { color: disabled ? theme.text + '40' : theme.text }
      ]}>
        {title}
      </Text>
      {disabled && (
        <View style={styles.comingSoonBadge}>
          <Text style={[styles.comingSoonText, { color: theme.background }]}>
            Yapım Aşamasında
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.logoContainer}>
        <Text style={[styles.logo, { color: theme.primary }]}>Akor Mate</Text>
      </View>

      <View style={styles.buttonContainer}>
        {renderButton('Akorlar', 'musical-notes', () => router.push('/chords'))}
        {renderButton('Akort Et', 'musical-note', () => router.push('/tuner'))}
        {renderButton('Akor Bul', 'search', undefined, true)}
        {renderButton('Ayarlar', 'settings', () => router.push('/profile'))}
        {renderButton('Katkıda Bulun', 'add-circle', () => router.push('/addSong'))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    marginTop: 8,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    width: buttonWidth,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  disabledButton: {
    opacity: 0.8,
  },
  comingSoonBadge: {
    position: 'absolute',
    right: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
