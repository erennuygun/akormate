import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  useColorScheme,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Link, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { getSongs, getRandomArtists } from '../src/db/database';
import { useAuth } from '../src/context/AuthContext';

interface Song {
  _id: string;  
  title: string;
  artist: string;
  originalKey: string;
}

type TabType = 'popular' | 'new' | 'random' | 'artists';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user, checkAndNavigateToProfile } = useAuth();

  useEffect(() => {
    loadSongs();
  }, [activeTab]);

  const loadSongs = async (search?: string) => {
    try {
      setLoading(true);
      const options = {
        tag: activeTab === 'random' ? undefined : activeTab,
        random: activeTab === 'random'
      };
      const data = await getSongs(search, options);
      setSongs(data);
    } catch (error) {
      console.error('Şarkıları getirirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length === 0) {
      loadSongs();
    } else if (query.length >= 2) {
      // Tüm şarkılarda arama yapmak için tag ve random opsiyonlarını kaldırıyoruz
      const data = await getSongs(query, {});
      setSongs(data);
    }
  };

  const handleTabPress = (tab: TabType) => {
    if (tab === activeTab && tab === 'random') {
      loadSongs();
    }
    setActiveTab(tab);
  };

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSongItem = ({ item }: { item: Song }) => (
    <Link
      href={{
        pathname: item.originalKey === 'artist' ? "/artistSongs" : "/songDetail",
        params: item.originalKey === 'artist' ? { artist: item.title } : { song: JSON.stringify(item) }
      }}
      asChild
    >
      <TouchableOpacity
        style={[styles.songItem, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        activeOpacity={0.7}
      >
        <View style={styles.songInfo}>
          <View style={styles.songMainRow}>
            <Text 
              style={[styles.songTitle, { color: theme.text }]} 
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.originalKey !== 'artist' && (
              <View style={styles.songItemRight}>
                <View style={[styles.keyBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.keyText, { color: theme.primary }]}>
                    {item.originalKey}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={theme.text + '66'} 
                  style={styles.arrowIcon}
                />
              </View>
            )}
            {item.originalKey === 'artist' && (
              <View style={styles.songItemRight}>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={theme.text + '66'} 
                  style={styles.arrowIcon}
                />
              </View>
            )}
          </View>
          {item.originalKey !== 'artist' && (
            <Text 
              style={[styles.songArtist, { color: theme.text + '99' }]}
              numberOfLines={1}
            >
              {item.artist}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Akor Mate</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.card }]}>
          <Ionicons name="search" size={20} color={theme.text + '66'} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Şarkı veya sanatçı ara..."
            placeholderTextColor={theme.text + '66'}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={theme.text + '66'} 
              onPress={() => setSearchQuery('')}
            />
          )}
        </View>
      </View>

      <View style={styles.tabContainer}>
        {(['popular', 'new', 'random', 'artists'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: theme.primary }
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? theme.background : theme.text }
              ]}
            >
              {tab === 'popular' ? 'Popüler' :
               tab === 'new' ? 'Yeni' : 
               tab === 'random' ? 'Rastgele' : 'Sanatçılar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        <FlatList
          data={filteredSongs}
          renderItem={renderSongItem}
          keyExtractor={(item) => item._id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={[styles.bottomNav, { backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => {
            if (!user) {
              router.push('/auth/login');
            } else {
              router.push('/favorites');
            }
          }}
        >
          <Ionicons name="heart-outline" size={24} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.homeButton, { backgroundColor: theme.primary }]}
          onPress={() => router.replace('/')}
        >
          <Ionicons name="home" size={30} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => {
            if (!user) {
              router.push('/auth/login');
            } else {
              router.push('/profile');
            }
          }}
        >
          <Ionicons name="person-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  searchContainer: ViewStyle;
  searchBox: ViewStyle;
  searchInput: TextStyle;
  tabContainer: ViewStyle;
  tab: ViewStyle;
  tabText: TextStyle;
  listContent: ViewStyle;
  songItem: ViewStyle;
  songInfo: ViewStyle;
  songMainRow: ViewStyle;
  songTitle: TextStyle;
  songArtist: TextStyle;
  songItemRight: ViewStyle;
  keyBadge: ViewStyle;
  keyText: TextStyle;
  arrowIcon: ViewStyle;
  bottomNav: ViewStyle;
  navButton: ViewStyle;
  homeButton: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 40,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  songItem: {
    padding: 20,
    marginBottom: 6,
    borderRadius: 12
  },
  songInfo: {
    flex: 1,
    marginBottom: 10,
    
  },
  songMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  songArtist: {
    fontSize: 14,
  },
  songItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 80,
  },
  keyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  keyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  arrowIcon: {
    marginLeft: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    padding: 10,
  },
  homeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
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
