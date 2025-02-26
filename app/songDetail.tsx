import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Share,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';

const LyricLine = ({ line, theme, fontSize }) => {
  const isChordLine = /^([A-G][#b]?m?(aj)?[0-9]*\s*)+$/.test(line.trim());
  
  return (
    <Text 
      style={[
        styles.line, 
        { 
          color: isChordLine ? theme.primary : theme.text,
          fontSize,
          fontFamily: 'monospace',
        }
      ]}
    >
      {line}
    </Text>
  );
};

const transposeChord = (chord, semitones) => {
  const chords = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const baseChord = chord.replace(/m$/, '');
  const isMinor = chord.endsWith('m');
  
  let index = chords.indexOf(baseChord);
  if (index === -1) return chord;
  
  index = (index + semitones + 12) % 12;
  return chords[index] + (isMinor ? 'm' : '');
};

const transposeLine = (line, semitones) => {
  return line.replace(/[A-G][#]?m?/g, match => transposeChord(match, semitones));
};

export default function SongDetail() {
  const params = useLocalSearchParams();
  const song = params.song ? JSON.parse(params.song) : null;
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [selectedKey, setSelectedKey] = useState(song?.originalKey || '');
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const isTransposed = selectedKey !== song?.originalKey;

  useEffect(() => {
    checkFavorite();
  }, []);

  const checkFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      const favoritesArray = favorites ? JSON.parse(favorites) : [];
      setIsFavorite(favoritesArray.includes(song.id));
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      const favoritesArray = favorites ? JSON.parse(favorites) : [];
      
      if (isFavorite) {
        const newFavorites = favoritesArray.filter(id => id !== song.id);
        await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
      } else {
        favoritesArray.push(song.id);
        await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
      }
      
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const shareSong = async () => {
    try {
      await Share.share({
        message: `${song.title} - ${song.artist}\n\n${song.chords}`,
        title: `${song.title} Akorları`,
      });
    } catch (error) {
      console.error('Error sharing song:', error);
    }
  };

  if (!song) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>Şarkı bulunamadı</Text>
      </SafeAreaView>
    );
  }

  // Seçilen tona göre semitone farkını hesapla
  const getSemitones = () => {
    const originalIndex = keys.indexOf(song.originalKey.replace(/m$/, ''));
    const selectedIndex = keys.indexOf(selectedKey.replace(/m$/, ''));
    if (originalIndex === -1 || selectedIndex === -1) return 0;
    return (selectedIndex - originalIndex + 12) % 12;
  };

  const transposedChords = song.chords.split('\n').map(line => 
    transposeLine(line, getSemitones())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {song.title}
          </Text>
          <Text style={[styles.artist, { color: theme.text + '99' }]} numberOfLines={1}>
            {song.artist}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={shareSong} style={styles.iconButton}>
            <Ionicons name="share-outline" size={24} color={theme.text + '66'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={styles.iconButton}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? theme.primary : theme.text + '66'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.controls, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={styles.keySelector}
          onPress={() => setShowKeyPicker(true)}
        >
          <Text style={[styles.keyLabel, { color: theme.text + '99' }]}>
            {isTransposed ? 'Yeni Ton:' : 'Orijinal Ton:'}
          </Text>
          <Text style={[styles.keyValue, { color: theme.text }]}>
            {selectedKey}
          </Text>
          <View style={styles.keyPickerIcon}>
            <Ionicons name="chevron-down" size={16} color={theme.text + '66'} />
          </View>
        </TouchableOpacity>

        <View style={styles.controlGroup}>
          <TouchableOpacity 
            onPress={() => setFontSize(prev => Math.max(12, prev - 2))}
            style={styles.fontButton}
          >
            <Text style={[styles.fontButtonText, { color: theme.text }]}>-A</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFontSize(prev => Math.min(24, prev + 2))}
            style={styles.fontButton}
          >
            <Text style={[styles.fontButtonText, { color: theme.text }]}>+A</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.songContent, { backgroundColor: theme.card }]}>
          {transposedChords.map((line, index) => (
            <LyricLine 
              key={index} 
              line={line} 
              theme={theme}
              fontSize={fontSize}
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={showKeyPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowKeyPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowKeyPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={[
                styles.keyOption,
                selectedKey === song.originalKey && { backgroundColor: theme.primary + '20' }
              ]}
              onPress={() => {
                setSelectedKey(song.originalKey);
                setShowKeyPicker(false);
              }}
            >
              <Text style={[styles.keyOptionText, { color: theme.text }]}>
                {song.originalKey} (Orijinal Ton)
              </Text>
            </TouchableOpacity>
            {keys.filter(key => key !== song.originalKey).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.keyOption,
                  selectedKey === key && { backgroundColor: theme.primary + '20' }
                ]}
                onPress={() => {
                  setSelectedKey(key);
                  setShowKeyPicker(false);
                }}
              >
                <Text style={[styles.keyOptionText, { color: theme.text }]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: Platform.OS === 'ios' ? 0 : 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artist: {
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  keySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme => theme.inputBackground,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  keyLabel: {
    fontSize: 13,
    marginRight: 4,
  },
  keyValue: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  keyPickerIcon: {
    marginLeft: 2,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  },
  fontButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginHorizontal: 12,
  },
  songContent: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  line: {
    lineHeight: 24,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '60%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 12,
  },
  keyOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  keyOptionText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
