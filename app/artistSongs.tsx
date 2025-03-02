import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { getArtistSongs } from '../src/db/database';
import { useColorScheme } from 'react-native';

interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
}

export default function ArtistSongs() {
  const { artist } = useLocalSearchParams();
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (artist) {
      loadSongs();
    }
  }, [artist]);

  const loadSongs = async () => {
    try {
      setLoading(true);
      const songList = await getArtistSongs(artist as string);
      setSongs(songList);
    } catch (error) {
      console.error('Şarkıları getirirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSongPress = (song: Song) => {
    router.push({
      pathname: '/songDetail',
      params: { song: JSON.stringify(song) }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{artist}</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={48} color={theme.text + '66'} />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Bu sanatçıya ait şarkı bulunmuyor
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.songItem, { backgroundColor: theme.card }]}
              onPress={() => handleSongPress(item)}
            >
              <View style={styles.songInfo}>
                <Text style={[styles.songTitle, { color: theme.text }]}>{item.title}</Text>
              </View>
              <View style={[styles.keyBadge, { backgroundColor: theme.background }]}>
                <Text style={[styles.keyText, { color: theme.text }]}>{item.originalKey}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.text + '99'} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  keyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  keyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
