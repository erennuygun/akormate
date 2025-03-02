import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  useColorScheme,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';

const { width } = Dimensions.get('window');
const STRINGS = [
  { note: 'E', freq: 329.63, color: '#FF6B6B' },
  { note: 'B', freq: 246.94, color: '#4ECDC4' },
  { note: 'G', freq: 196.00, color: '#45B7D1' },
  { note: 'D', freq: 146.83, color: '#96CEB4' },
  { note: 'A', freq: 110.00, color: '#FFEEAD' },
  { note: 'E', freq: 82.41, color: '#D4A5A5' }
];

export default function Tuner() {
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [tuningAccuracy, setTuningAccuracy] = useState(0); // -50 to 50
  const [isListening, setIsListening] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const accuracyAnimation = new Animated.Value(0);

  useEffect(() => {
    // Mikrofon izni ve başlatma işlemleri burada yapılacak
    return () => {
      // Cleanup işlemleri
    };
  }, []);

  const playReferenceNote = async (freq: number) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/sine.mp3'), // Referans ses dosyası gerekli
        {
          shouldPlay: true,
          volume: 1.0,
          rate: freq / 440, // Frekansa göre hızı ayarla
        }
      );
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const startListening = () => {
    setIsListening(!isListening);
    // Mikrofon dinleme işlemleri burada yapılacak
  };

  const renderString = (string: typeof STRINGS[0], index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.string,
        { 
          backgroundColor: string.color + '40',
          borderColor: string.color,
          borderWidth: selectedString === index ? 2 : 1,
        }
      ]}
      onPress={() => {
        setSelectedString(index);
        playReferenceNote(string.freq);
      }}
    >
      <Text style={[styles.stringNote, { color: theme.text }]}>
        {string.note}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.noteDisplay}>
        <Text style={[styles.currentNote, { color: theme.text }]}>
          {currentNote || '---'}
        </Text>
        <View style={styles.accuracyContainer}>
          <View style={styles.accuracyScale}>
            <Animated.View 
              style={[
                styles.accuracyIndicator,
                {
                  backgroundColor: theme.primary,
                  transform: [{
                    translateX: accuracyAnimation.interpolate({
                      inputRange: [-50, 50],
                      outputRange: [-100, 100]
                    })
                  }]
                }
              ]}
            />
          </View>
          <View style={styles.accuracyMarkers}>
            <Text style={[styles.accuracyText, { color: theme.text + '66' }]}>♭</Text>
            <Text style={[styles.accuracyText, { color: theme.text + '66' }]}>♯</Text>
          </View>
        </View>
      </View>

      <View style={styles.strings}>
        {STRINGS.map((string, index) => renderString(string, index))}
      </View>

      <TouchableOpacity
        style={[styles.micButton, { backgroundColor: isListening ? theme.primary : theme.card }]}
        onPress={startListening}
      >
        <Ionicons 
          name={isListening ? "mic" : "mic-outline"} 
          size={30} 
          color={isListening ? "#FFF" : theme.text} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  noteDisplay: {
    alignItems: 'center',
    marginTop: 40,
  },
  currentNote: {
    fontSize: 72,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  accuracyContainer: {
    width: width * 0.8,
    alignItems: 'center',
  },
  accuracyScale: {
    width: width * 0.8,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  accuracyIndicator: {
    width: 8,
    height: 16,
    borderRadius: 4,
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -4,
  },
  accuracyMarkers: {
    width: width * 0.8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 5,
  },
  accuracyText: {
    fontSize: 18,
  },
  strings: {
    width: width * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  string: {
    width: width * 0.8,
    height: 50,
    borderRadius: 25,
    marginVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  stringNote: {
    fontSize: 24,
    fontWeight: '600',
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 40 : 20,
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
