import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { getUserPrivateSongs } from '../src/db/database';
import { useAuth } from '../src/context/AuthContext';
import { useColorScheme } from 'react-native';

interface PrivateSong {
  id: string;
  title: string;
  artist: string;
  created_at: string;
}

export default function PrivateSongs() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [songs, setSongs] = useState<PrivateSong[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadPrivateSongs();
  }, []);

  const loadPrivateSongs = async () => {
    if (!user || !user.id) {
      router.replace('/auth/login');
      return;
    }

    try {
      setLoading(true);
      const privateSongs = await getUserPrivateSongs(user.id);
      setSongs(privateSongs);
    } catch (error) {
      console.error('Özel şarkıları getirirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSongPress = (song: PrivateSong) => {
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
        <Text style={[styles.title, { color: theme.text }]}>Özel Şarkılarım</Text>
        <TouchableOpacity onPress={() => router.push('/addPrivateSong')} style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={48} color={theme.text + '66'} />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Henüz özel şarkınız bulunmuyor
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/addPrivateSong')}
            style={[styles.addSongButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.addSongButtonText}>Şarkı Ekle</Text>
          </TouchableOpacity>
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
              <View>
                <Text style={[styles.songTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.songArtist, { color: theme.text + '99' }]}>{item.artist}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
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
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  addSongButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addSongButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
  },
});
