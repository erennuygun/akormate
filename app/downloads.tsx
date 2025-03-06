import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';
import BottomNavigation from '../components/BottomNavigation';

export default function Downloads() {
  const [downloadedSongs, setDownloadedSongs] = useState([]);
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadDownloadedSongs();
  }, []);

  const loadDownloadedSongs = async () => {
    try {
      const songs = await AsyncStorage.getItem('offline_songs');
      if (songs) {
        setDownloadedSongs(JSON.parse(songs));
      }
    } catch (error) {
      console.error('Error loading downloaded songs:', error);
      Alert.alert('Hata', 'İndirilen şarkılar yüklenirken bir hata oluştu');
    }
  };

  const removeDownload = async (songId) => {
    try {
      const updatedSongs = downloadedSongs.filter(song => song._id !== songId);
      await AsyncStorage.setItem('offline_songs', JSON.stringify(updatedSongs));
      setDownloadedSongs(updatedSongs);
    } catch (error) {
      console.error('Error removing download:', error);
      Alert.alert('Hata', 'Şarkı kaldırılırken bir hata oluştu');
    }
  };

  const navigateToSong = (song) => {
    router.push({
      pathname: '/songDetail',
      params: { song: JSON.stringify(song) }
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>İndirilenler</Text>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {downloadedSongs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cloud-offline" size={64} color={theme.text + '66'} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                Henüz indirilmiş şarkı yok
              </Text>
            </View>
          ) : (
            downloadedSongs.map((song) => (
              <TouchableOpacity
                key={song._id}
                style={[styles.songCard, { backgroundColor: theme.card }]}
                onPress={() => navigateToSong(song)}
              >
                <View style={styles.songInfo}>
                  <Text style={[styles.songTitle, { color: theme.text }]} numberOfLines={1}>
                    {song.title}
                  </Text>
                  <Text style={[styles.songArtist, { color: theme.text + '99' }]} numberOfLines={1}>
                    {song.artist}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeDownload(song._id)}
                >
                  <Ionicons name="trash-outline" size={24} color={theme.text + '66'} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <BottomNavigation currentRoute={pathname} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: Platform.OS === 'ios' ? 12 : StatusBar.currentHeight + 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
});
