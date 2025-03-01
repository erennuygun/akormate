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
} from 'react-native';
import { Link, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { getSongs } from '../src/db/database';
import { useAuth } from '../src/context/AuthContext';

interface Song {
  _id: string;  
  title: string;
  artist: string;
  originalKey: string;
}

type TabType = 'popular' | 'new' | 'random';

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
      console.error('Error loading songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length === 0) {
      loadSongs();
    } else if (query.length >= 2) {
      loadSongs(query);
    }
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSongItem = ({ item }: { item: Song }) => (
    <Link
      href={{
        pathname: "/songDetail",
        params: { song: JSON.stringify(item) }
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
          </View>
          <Text 
            style={[styles.songArtist, { color: theme.text + '99' }]}
            numberOfLines={1}
          >
            {item.artist}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Akor Mate</Text>
          <TouchableOpacity
            onPress={() => checkAndNavigateToProfile()}
            style={[styles.addButton, { backgroundColor: theme.card }]}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="person-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBox, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="search" size={20} color={theme.text + '66'} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Şarkı veya sanatçı ara"
              placeholderTextColor={theme.text + '66'}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => handleSearch('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color={theme.text + '66'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.tabContainer}>
          {(['popular', 'new', 'random'] as TabType[]).map((tab) => (
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
                 tab === 'new' ? 'Yeni' : 'Rastgele'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredSongs}
          renderItem={renderSongItem}
          keyExtractor={item => item._id}  
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                {searchQuery ? 'Aranan şarkı bulunamadı' : 'Henüz şarkı eklenmemiş'}
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface Styles {
  safeArea: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  addButton: ViewStyle;
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
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    margin: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6A0DAD',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchContainer: {
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
  },
});
