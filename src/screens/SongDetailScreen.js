import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/colors';
import { chordMap } from '../data/songs';

const SongDetailScreen = ({ route }) => {
  const { song } = route.params;
  const [currentKey, setCurrentKey] = useState(song.originalKey);
  const [isFavorite, setIsFavorite] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

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

  const transposeChord = (chord, steps) => {
    if (!chord || chord.length === 0) return chord;
    
    const baseChord = chord.replace('m', '');
    const isMinor = chord.includes('m');
    
    const chordArray = isMinor ? chordMap['Am'] : chordMap['A'];
    const currentIndex = chordArray.findIndex(c => c === chord);
    
    if (currentIndex === -1) return chord;
    
    let newIndex = (currentIndex + steps) % 12;
    if (newIndex < 0) newIndex += 12;
    
    return chordArray[newIndex];
  };

  const transposeChords = (lyrics, steps) => {
    return lyrics.replace(/[A-G]#?m?/g, match => transposeChord(match, steps));
  };

  const changeKey = (steps) => {
    const baseChord = currentKey.replace('m', '');
    const isMinor = currentKey.includes('m');
    const chordArray = isMinor ? chordMap['Am'] : chordMap['A'];
    const currentIndex = chordArray.findIndex(c => c === currentKey);
    
    if (currentIndex === -1) return;
    
    let newIndex = (currentIndex + steps) % 12;
    if (newIndex < 0) newIndex += 12;
    
    setCurrentKey(chordArray[newIndex]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{song.title}</Text>
        <Text style={[styles.artist, { color: theme.text }]}>{song.artist}</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
          <Text style={[styles.favoriteIcon, { color: theme.primary }]}>
            {isFavorite ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.keyControls}>
        <TouchableOpacity onPress={() => changeKey(-1)} style={styles.keyButton}>
          <Text style={[styles.keyButtonText, { color: theme.text }]}>-</Text>
        </TouchableOpacity>
        <Text style={[styles.currentKey, { color: theme.text }]}>Ton: {currentKey}</Text>
        <TouchableOpacity onPress={() => changeKey(1)} style={styles.keyButton}>
          <Text style={[styles.keyButtonText, { color: theme.text }]}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.lyricsContainer}>
        <Text style={[styles.lyrics, { color: theme.text }]}>
          {transposeChords(song.chords, 
            chordMap['A'].indexOf(currentKey) - chordMap['A'].indexOf(song.originalKey))}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    opacity: 0.8,
    marginBottom: 16,
  },
  favoriteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  keyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  keyButton: {
    padding: 10,
    marginHorizontal: 20,
  },
  keyButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  currentKey: {
    fontSize: 18,
  },
  lyricsContainer: {
    flex: 1,
  },
  lyrics: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'monospace',
  },
});

export default SongDetailScreen;
