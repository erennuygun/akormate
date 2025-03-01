import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { addToFavorites, removeFromFavorites, checkIsFavorite } from '../src/db/database';

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
  
  // Eğer song verisi yoksa loading veya error state göster
  if (!song) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Şarkı yüklenemedi.</Text>
      </View>
    );
  }

  const [isFavorite, setIsFavorite] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [selectedKey, setSelectedKey] = useState(song?.originalKey || '');
  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user } = useAuth();
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(100); // default 100ms
  const scrollViewRef = useRef(null);
  const scrollInterval = useRef(null);
  const { height: windowHeight } = Dimensions.get('window');
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  // Otomatik scroll'u temizle
  useEffect(() => {
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, []);

  const startAutoScroll = () => {
    if (!scrollViewRef.current) return;

    const SCROLL_STEP = 1;
    scrollInterval.current = setInterval(() => {
      const currentOffset = scrollViewRef.current?._lastScrollPos || 0;
      
      // En alttaki içerik görünür olduğunda dur
      if (currentOffset + scrollViewHeight >= contentHeight + 10) { // 20 piksel tolerans
        stopAutoScroll();
        return;
      }

      scrollViewRef.current?.scrollTo({
        y: currentOffset + SCROLL_STEP,
        animated: false
      });
    }, scrollSpeed);

    setIsAutoScrolling(true);
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
    setIsAutoScrolling(false);
  };

  const toggleAutoScroll = () => {
    if (isAutoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setScrollSpeed(newSpeed);
    if (isAutoScrolling) {
      stopAutoScroll();
      startAutoScroll();
    }
    setShowSpeedPicker(false);
  };

  const getSpeedText = () => {
    switch (scrollSpeed) {
      case 150: return 'Yavaş';
      case 50: return 'Hızlı';
      default: return 'Normal';
    }
  };

  // Şarkı sözlerinin toplam uzunluğunu hesapla
  const calculateTotalLength = () => {
    if (!song?.chords) return 0;
    return song.chords.length;
  };

  // Otomatik kaydırma hızını hesapla (karakter başına milisaniye)
  const calculateScrollDuration = () => {
    const totalLength = calculateTotalLength();
    // Her karakter için ortalama 100ms (ayarlanabilir)
    const baseSpeed = 500;
    return totalLength * baseSpeed;
  };

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const isTransposed = selectedKey !== song?.originalKey;

  useEffect(() => {
    if (song?._id) {
      checkFavorite();
    }
  }, [song]);

  const checkFavorite = async () => {
    try {
      const isFav = await checkIsFavorite(song._id);
      setIsFavorite(isFav);
    } catch (error) {
      // Hata durumunda favori olmadığını varsay
      setIsFavorite(false);
    }
  };

  const handleFavoritePress = async () => {
    try {
      if (!user) {
        Alert.alert(
          'Giriş Yapın',
          'Favorilere eklemek için giriş yapmanız gerekiyor.',
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Giriş Yap', onPress: () => router.push('/auth/login') }
          ]
        );
        return;
      }

      if (isFavorite) {
        await removeFromFavorites(song._id);
        setIsFavorite(false);
      } else {
        await addToFavorites(song._id);
        setIsFavorite(true);
      }
    } catch (error) {
      Alert.alert(
        'Hata',
        error.message || 'Bir hata oluştu'
      );
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
          <TouchableOpacity onPress={handleFavoritePress} style={styles.iconButton}>
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

        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: isAutoScrolling ? theme.primary : theme.card }]}
          onPress={toggleAutoScroll}
          onLongPress={() => setShowSpeedPicker(true)}
        >
          <Ionicons
            name={isAutoScrolling ? "pause" : "play"}
            size={24}
            color={isAutoScrolling ? theme.background : theme.text}
          />
        </TouchableOpacity>

        <View style={styles.controlGroup}>
          <TouchableOpacity 
            onPress={() => setFontSize(prev => Math.max(12, prev - 2))}
            style={styles.fontButton}
          >
            <Text style={[styles.fontButtonText, { color: theme.text }]}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setFontSize(prev => Math.min(24, prev + 2))}
            style={styles.fontButton}
          >
            <Text style={[styles.fontButtonText, { color: theme.text }]}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollViewRef.current._lastScrollPos = event.nativeEvent.contentOffset.y;
        }}
        onLayout={(event) => {
          setScrollViewHeight(event.nativeEvent.layout.height);
        }}
      >
        <View 
          style={[styles.songContent, { backgroundColor: theme.card }]}
          onLayout={(event) => {
            setContentHeight(event.nativeEvent.layout.height);
          }}
        >
          {transposedChords.map((line, index) => (
            <LyricLine 
              key={index}
              line={line}
              theme={theme}
              fontSize={fontSize}
            />
          ))}
        </View>
        <View style={{ height: windowHeight * 0.5 }} />
      </ScrollView>

      {/* Ton Seçici Modal */}
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

      {/* Hız Seçici Modal */}
      <Modal
        visible={showSpeedPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSpeedPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeedPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Kaydırma Hızı</Text>
            
            <TouchableOpacity
              style={[styles.speedOption, scrollSpeed === 150 && styles.selectedSpeed]}
              onPress={() => handleSpeedChange(150)}
            >
              <Text style={{ color: theme.text }}>Yavaş</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.speedOption, scrollSpeed === 100 && styles.selectedSpeed]}
              onPress={() => handleSpeedChange(100)}
            >
              <Text style={{ color: theme.text }}>Normal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.speedOption, scrollSpeed === 50 && styles.selectedSpeed]}
              onPress={() => handleSpeedChange(50)}
            >
              <Text style={{ color: theme.text }}>Hızlı</Text>
            </TouchableOpacity>
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
    padding: 8,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  keyLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  keyValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  keyPickerIcon: {
    marginLeft: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  speedOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: 'center',
  },
  selectedSpeed: {
    backgroundColor: 'rgba(0,0,0,0.1)',
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
