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
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { getFavorites, removeFromFavorites } from '../src/db/database';
import { useAuth } from '../src/context/AuthContext';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

interface FavoriteSong {
  id: string;
  title: string;
  artist: string;
  created_at: string;
}

export default function Favorites() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [songs, setSongs] = useState<FavoriteSong[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    if (!user || !user.id) {
      router.replace('/auth/login');
      return;
    }

    try {
      setLoading(true);
      const favoriteSongs = await getFavorites();
      
      // Null veya undefined değerleri filtrele
      const validSongs = favoriteSongs.filter((song: FavoriteSong) => 
        song && song.id && song.title && song.artist
      );
      
      setSongs(validSongs);
    } catch (error) {
      console.error('Favorileri getirirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSongPress = (song: FavoriteSong) => {
    router.push({
      pathname: '/songDetail',
      params: { song: JSON.stringify(song) }
    });
  };

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, item: FavoriteSong) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const trans = dragX.interpolate({
      inputRange: [-101, -100, -50, 0],
      outputRange: [-50, 0, 0, 80],
    });

    return (
      <Animated.View
        style={[
          styles.deleteButton,
          {
            transform: [{ translateX: trans }],
            borderRadius: 12,
          },
        ]}
      >
        <Animated.View style={[{ transform: [{ scale }] }]}>
          <Ionicons name="trash-outline" size={24} color="white" />
        </Animated.View>
      </Animated.View>
    );
  };

  const handleDelete = async (songId: string) => {
    try {
      await removeFromFavorites(songId);
      setSongs(prevSongs => prevSongs.filter(song => song.id !== songId));
    } catch (error) {
      console.error('Şarkı silinirken hata:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Beğendiklerim</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : songs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart" size={48} color={theme.text + '66'} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              Henüz beğendiğiniz şarkı bulunmuyor
            </Text>
          </View>
        ) : (
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
                rightThreshold={100}
                overshootRight={false}
                onSwipeableRightOpen={() => handleDelete(item.id)}
              >
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
              </Swipeable>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
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
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
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
  deleteButton: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
});
