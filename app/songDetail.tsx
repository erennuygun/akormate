import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
  useColorScheme,
  Share,
  Modal,
  Switch
} from 'react-native';
import {
  useLocalSearchParams, router
} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { addToFavorites, removeFromFavorites, checkIsFavorite, getRepertoires, addSongToRepertoire, updateRepertoire } from '../src/db/database';
import { useRouter, usePathname } from 'expo-router';
import BottomNavigation from '../components/BottomNavigation';

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
  const pathname = usePathname();
  
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
  const [showFavoriteModal, setShowFavoriteModal] = useState(false);
  const [showRepertoireModal, setShowRepertoireModal] = useState(false);
  const [repertoires, setRepertoires] = useState([]);
  const [selectedRepertoires, setSelectedRepertoires] = useState([]);
  const [selectedRepertoireNames, setSelectedRepertoireNames] = useState([]);
  const [isOfflineEnabled, setIsOfflineEnabled] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);

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
      loadRepertoires();
      checkOfflineStatus();
    }
  }, [song]);

  const loadRepertoires = async () => {
    try {
      const userRepertoires = await getRepertoires();
      if (userRepertoires) {
        setRepertoires(userRepertoires);
      }
    } catch (error) {
      console.error('Error loading repertoires:', error);
      Alert.alert('Hata', 'Repertuarlar yüklenirken bir hata oluştu');
    }
  };

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
        setShowFavoriteModal(true);
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

  const handleRepertoireSelect = (repertoireId) => {
    setSelectedRepertoires(prev => {
      if (prev.includes(repertoireId)) {
        return prev.filter(id => id !== repertoireId);
      } else {
        return [...prev, repertoireId];
      }
    });
  };

  const handleRepertoireConfirm = async () => {
    try {
      // Save selected repertoire names for display
      const selectedNames = repertoires
        .filter(rep => selectedRepertoires.includes(rep._id))
        .map(rep => rep.name);
      setSelectedRepertoireNames(selectedNames);
      
      // Directly switch modals without showing alert
      setShowRepertoireModal(false);
      setShowFavoriteModal(true);
    } catch (error) {
      console.error('Error saving to repertoire:', error);
      Alert.alert('Hata', 'Repertuara eklenirken bir hata oluştu');
    }
  };

  const saveToRepertoires = async () => {
    try {
      // Check for duplicate songs in selected repertoires
      const duplicateRepertoires = [];
      for (const repId of selectedRepertoires) {
        const repertoire = repertoires.find(r => r._id === repId);
        if (repertoire) {
          // Check if song already exists in this repertoire
          const songExists = repertoire.songs.some(s => s._id === song._id);
          if (songExists) {
            duplicateRepertoires.push(repertoire.name);
          }
        }
      }

      // If there are duplicates, show warning and return
      if (duplicateRepertoires.length > 0) {
        Alert.alert(
          'Uyarı',
          `Bu şarkı zaten ${duplicateRepertoires.join(', ')} repertuar${duplicateRepertoires.length > 1 ? 'larınızda' : 'ınızda'} mevcut.`
        );
        return;
      }

      // Add song to selected repertoires in the database one by one
      for (const repId of selectedRepertoires) {
        const repertoire = repertoires.find(r => r._id === repId);
        if (repertoire) {
          const updatedSongs = [...repertoire.songs, song];
          await updateRepertoire(repId, {
            songs: updatedSongs
          });
        }
      }
      
      Alert.alert('Başarılı', 'Şarkı repertuarlara kaydedildi');
      setShowFavoriteModal(false);
    } catch (error) {
      console.error('Error saving to repertoires:', error);
      Alert.alert('Hata', 'Repertuarlara kaydedilirken bir hata oluştu');
    }
  };

  const checkOfflineStatus = async () => {
    try {
      const offlineSongs = await AsyncStorage.getItem('offline_songs');
      if (offlineSongs) {
        const songs = JSON.parse(offlineSongs);
        const isSaved = songs.some(s => s._id === song._id);
        setIsOfflineSaved(isSaved);
      }
    } catch (error) {
      console.error('Error checking offline status:', error);
    }
  };

  const toggleOfflineMode = async () => {
    try {
      const offlineSongs = await AsyncStorage.getItem('offline_songs') || '[]';
      let songs = JSON.parse(offlineSongs);

      if (!isOfflineSaved) {
        // Şarkıyı offline storage'a ekle
        songs.push(song);
        await AsyncStorage.setItem('offline_songs', JSON.stringify(songs));
        setIsOfflineSaved(true);
        Alert.alert('Başarılı', 'Şarkı çevrimdışı kullanım için kaydedildi');
      } else {
        // Şarkıyı offline storage'dan kaldır
        songs = songs.filter(s => s._id !== song._id);
        await AsyncStorage.setItem('offline_songs', JSON.stringify(songs));
        setIsOfflineSaved(false);
        Alert.alert('Bilgi', 'Şarkı çevrimdışı listesinden kaldırıldı');
      }
    } catch (error) {
      console.error('Error toggling offline mode:', error);
      Alert.alert('Hata', 'Çevrimdışı mod değiştirilirken bir hata oluştu');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: theme.text }]}> {song.title}</Text>
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/artistSongs',
              params: { artist: song.artist }
            })}
          >
            <Text style={[styles.artist, { color: theme.text + '99' }]}>{song.artist}</Text>
          </TouchableOpacity>
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
          <TouchableOpacity onPress={toggleOfflineMode} style={styles.iconButton}>
            <Ionicons
              name={isOfflineSaved ? "cloud-done" : "cloud-download"}
              size={24}
              color={theme.text + '66'}
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
              theme={isDarkMode ? darkTheme : lightTheme} 
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

      {/* Favorite Added Modal */}
      <Modal
        visible={showFavoriteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFavoriteModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFavoriteModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Şarkı favorilere eklendi
            </Text>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                setShowFavoriteModal(false);
                setShowRepertoireModal(true);
              }}
            >
              <Text style={[styles.modalButtonText, { color: theme.background }]}>
                Repertuara Ekle
              </Text>
            </TouchableOpacity>

            {selectedRepertoireNames.length > 0 && (
              <View style={styles.selectedRepertoiresContainer}>
                <Text style={[styles.selectedRepertoiresTitle, { color: theme.text }]}>
                  Seçilen Repertuarlar:
                </Text>
                {selectedRepertoireNames.map((name, index) => (
                  <Text key={index} style={[styles.selectedRepertoireName, { color: theme.text + '99' }]}>
                    • {name}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.offlineContainer}>
              <TouchableOpacity 
                style={styles.offlineContainer}
                onPress={toggleOfflineMode}
              >
                <View style={[
                  styles.customCheckbox,
                  { borderColor: theme.text + '66' },
                  isOfflineSaved && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}>
                  {isOfflineSaved && (
                    <Ionicons name="checkmark" size={16} color={theme.background} />
                  )}
                </View>
                <Text style={[styles.offlineText, { color: theme.text }]}>
                  Çevrimdışı Görüntülemek için İndir
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 1 }]}
              onPress={() => {
                if (selectedRepertoireNames.length > 0) {
                  saveToRepertoires();
                } else {
                  setShowFavoriteModal(false);
                }
              }}
            >
              <Text style={[styles.modalButtonText, { color: theme.primary }]}>
                {selectedRepertoireNames.length > 0 || isOfflineSaved ? 'Kaydet' : 'Kapat'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Repertoire Selection Modal */}
      <Modal
        visible={showRepertoireModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRepertoireModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRepertoireModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Repertuar Seçin
            </Text>

            {repertoires.length === 0 ? (
              <View>
                <Text style={[styles.modalText, { color: theme.text }]}>
                  Henüz repertuarınız yok
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowRepertoireModal(false);
                    router.push('/repertoires');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: theme.background }]}>
                    Repertuar Ekle
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <ScrollView style={styles.repertoireList}>
                  {repertoires.map(repertoire => (
                    <TouchableOpacity
                      key={repertoire._id}
                      style={[
                        styles.repertoireItem,
                        selectedRepertoires.includes(repertoire._id) && {
                          backgroundColor: theme.primary + '20'
                        }
                      ]}
                      onPress={() => handleRepertoireSelect(repertoire._id)}
                    >
                      <Text style={[styles.repertoireItemText, { color: theme.text }]}>
                        {repertoire.name}
                      </Text>
                      {selectedRepertoires.includes(repertoire._id) && (
                        <Ionicons name="checkmark" size={24} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                  onPress={handleRepertoireConfirm}
                >
                  <Text style={[styles.modalButtonText, { color: theme.background }]}>
                    Tamam
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      <BottomNavigation currentRoute={pathname} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    padding: 8,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    fontSize: 16,
  },
  repertoireList: {
    maxHeight: 300,
    width: '100%',
    marginBottom: 15,
  },
  repertoireItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  repertoireItemText: {
    fontSize: 16,
  },
  selectedRepertoiresContainer: {
    width: '100%',
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#00000020', 
    borderRadius: 8,
  },
  selectedRepertoiresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedRepertoireName: {
    fontSize: 14,
    marginVertical: 2,
  },
});