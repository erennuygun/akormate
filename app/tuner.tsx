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
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';

const { width } = Dimensions.get('window');

// Nota frekans aralıkları (Hz)
const NOTE_FREQUENCIES = {
  'E4': 329.63,
  'B3': 246.94,
  'G3': 196.00,
  'D3': 146.83,
  'A2': 110.00,
  'E2': 82.41,
};

const STRINGS = [
  { note: 'E', freq: NOTE_FREQUENCIES.E4, color: '#FF6B6B', sound: require('../assets/sounds/E3.m4a') },
  { note: 'B', freq: NOTE_FREQUENCIES.B3, color: '#4ECDC4', sound: require('../assets/sounds/B2.m4a') },
  { note: 'G', freq: NOTE_FREQUENCIES.G3, color: '#45B7D1', sound: require('../assets/sounds/G2.m4a') },
  { note: 'D', freq: NOTE_FREQUENCIES.D3, color: '#96CEB4', sound: require('../assets/sounds/D2.m4a') },
  { note: 'A', freq: NOTE_FREQUENCIES.A2, color: '#FFEEAD', sound: require('../assets/sounds/A1.m4a') },
  { note: 'E', freq: NOTE_FREQUENCIES.E2, color: '#D4A5A5', sound: require('../assets/sounds/E1.m4a') }
];

// Frekansı en yakın notaya eşleştir
const findClosestNote = (frequency) => {
  if (!frequency) return null;

  let closestNote = null;
  let closestDiff = Infinity;

  Object.entries(NOTE_FREQUENCIES).forEach(([note, freq]) => {
    const diff = Math.abs(frequency - freq);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestNote = note;
    }
  });

  return closestNote;
};

export default function Tuner() {
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [tuningAccuracy, setTuningAccuracy] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const accuracyAnimation = new Animated.Value(0);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const startListening = async () => {
    try {
      if (isListening) {
        if (recording) {
          await recording.stopAndUnloadAsync();
          setRecording(null);
        }
        setIsListening(false);
        setDetectedFreq(null);
        setCurrentNote('');
      } else {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Hata', 'Mikrofon izni gerekli');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const newRecording = new Audio.Recording();
        try {
          await newRecording.prepareToRecordAsync({
            android: {
              extension: '.m4a',
              outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
              audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 128000,
            },
            ios: {
              extension: '.m4a',
              audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 128000,
              linearPCMBitDepth: 16,
              linearPCMIsBigEndian: false,
              linearPCMIsFloat: false,
            },
          });
          await newRecording.startAsync();
          setRecording(newRecording);
          setIsListening(true);

          // Ses analizi simülasyonu
          const analyzeInterval = setInterval(() => {
            if (selectedString !== null) {
              const targetFreq = STRINGS[selectedString].freq;
              const mevcutZaman = Date.now();
              
              // Ses seviyesine göre frekans sapması
              const amplitude = Math.sin(mevcutZaman / 200) * 5; // Daha gerçekçi salınım
              const detectedFreq = targetFreq + amplitude;
              
              setDetectedFreq(detectedFreq);
              
              // Frekans farkına göre hassasiyet ayarı
              const freqDifference = Math.abs(targetFreq - detectedFreq);
              const tolerance = targetFreq * 0.03; // %3 tolerans
              
              if (freqDifference <= tolerance) {
                setTuningAccuracy(0);
                setCurrentNote(STRINGS[selectedString].note);
              } else {
                const accuracy = Math.min(50, Math.max(-50, 
                  (detectedFreq - targetFreq) / tolerance * 50
                ));
                setTuningAccuracy(accuracy);
                
                // En yakın notayı bul
                const closestNote = findClosestNote(detectedFreq);
                if (closestNote) {
                  setCurrentNote(closestNote.slice(0, -1));
                }
              }

              // Animasyonu güncelle
              Animated.spring(accuracyAnimation, {
                toValue: tuningAccuracy,
                useNativeDriver: true,
                tension: 40,
                friction: 7
              }).start();
            }
          }, 100);

          return () => {
            clearInterval(analyzeInterval);
            if (recording) {
              recording.stopAndUnloadAsync();
            }
          };
        } catch (error) {
          console.error('Error recording:', error);
          Alert.alert('Hata', 'Kayıt başlatılamadı');
          setIsListening(false);
        }
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      Alert.alert('Hata', 'Mikrofon başlatılamadı');
      setIsListening(false);
    }
  };

  const playReferenceNote = async (index: number) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        STRINGS[index].sound,
        { 
          shouldPlay: true,
          volume: 1.0,
          isLooping: false,
        }
      );
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const handleStringPress = (index: number) => {
    setSelectedString(index);
    playReferenceNote(index);
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
      onPress={() => handleStringPress(index)}
    >
      <Text style={[styles.stringNote, { color: theme.text }]}>
        {string.note}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Algılanan Nota ve Akort Göstergesi */}
      <View style={styles.tuningDisplay}>
        <View style={styles.notesContainer}>
          <Text style={[styles.targetNote, { color: theme.text }]}>
            {selectedString !== null ? STRINGS[selectedString].note : '---'}
          </Text>
          <Text style={[styles.detectedNote, { 
            color: tuningAccuracy === 0 ? '#4CAF50' : '#FF5252'
          }]}>
            {detectedFreq ? currentNote : '---'}
          </Text>
        </View>
        
        <View style={styles.tuningMeterContainer}>
          <View style={styles.tuningMeter}>
            <View style={styles.tuningScale}>
              {[-4, -3, -2, -1].map(i => (
                <View 
                  key={`left-${i}`}
                  style={[styles.scaleMark, { height: 8 + Math.abs(i) * 2 }]} 
                />
              ))}
              <View style={[styles.scaleMark, styles.centerMark]} />
              {[1, 2, 3, 4].map(i => (
                <View 
                  key={`right-${i}`}
                  style={[styles.scaleMark, { height: 8 + Math.abs(i) * 2 }]} 
                />
              ))}
            </View>
            
            <Animated.View 
              style={[
                styles.tuningIndicator,
                {
                  backgroundColor: tuningAccuracy === 0 ? '#4CAF50' : '#FF5252',
                  transform: [{
                    translateX: accuracyAnimation.interpolate({
                      inputRange: [-50, 50],
                      outputRange: [-width * 0.35, width * 0.35]
                    })
                  }],
                }
              ]}
            />
          </View>
          
          <View style={styles.tuningLabels}>
            <Text style={styles.tuningLabel}>♭ Pest</Text>
            <Text style={styles.tuningLabel}>Tiz ♯</Text>
          </View>
        </View>
      </View>

      {/* Mikrofon Butonu */}
      <TouchableOpacity
        style={[
          styles.micButton, 
          { 
            backgroundColor: isListening ? '#4CAF50' : theme.card,
            transform: [{ scale: isListening ? 1.1 : 1 }]
          }
        ]}
        onPress={startListening}
      >
        <Ionicons 
          name={isListening ? "mic" : "mic-outline"} 
          size={30} 
          color={isListening ? "#FFF" : theme.text} 
        />
      </TouchableOpacity>

      {/* Gitar Telleri */}
      <View style={styles.strings}>
        {STRINGS.map((string, index) => renderString(string, index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  tuningDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  targetNote: {
    fontSize: 36,
    fontWeight: 'bold',
    marginRight: 20,
  },
  detectedNote: {
    fontSize: 72,
    fontWeight: 'bold',
  },
  tuningMeterContainer: {
    width: width * 0.9,
    alignItems: 'center',
  },
  tuningMeter: {
    width: width * 0.8,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tuningScale: {
    width: width * 0.7,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
  },
  scaleMark: {
    width: 2,
    backgroundColor: '#666',
    borderRadius: 1,
  },
  centerMark: {
    height: 16,
    width: 3,
    backgroundColor: '#4CAF50',
  },
  tuningIndicator: {
    width: 15,
    height: 15,
    borderRadius: 15,
    position: 'absolute',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tuningLabels: {
    width: width * 0.8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  tuningLabel: {
    fontSize: 14,
    color: '#666',
  },
  strings: {
    width: width * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
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
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
});
