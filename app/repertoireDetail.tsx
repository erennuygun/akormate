import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { updateRepertoire, getRepertoireDetails, getSongs } from '../src/db/database';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

interface Song {
  _id: string;
  title: string;
  artist: string;
  originalKey: string;
}

interface Repertoire {
  _id: string;
  name: string;
  songs: Song[];
  created_at: string;
}

export default function RepertoireDetail() {
  const params = useLocalSearchParams();
  const initialRepertoire: Repertoire = JSON.parse(params.repertoire as string);
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(initialRepertoire.name);
  const [repertoire, setRepertoire] = useState<Repertoire>(initialRepertoire);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadRepertoireDetails();
  }, []);

  const loadRepertoireDetails = async () => {
    try {
      setLoading(true);
      const details = await getRepertoireDetails(initialRepertoire._id);
      setRepertoire(details);
      setEditedName(details.name);
    } catch (error) {
      console.error('Repertuar detayları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await getSongs(query, {});
        // Mevcut şarkıları filtrele
        const filteredResults = results.filter(
          song => !repertoire.songs.some(s => s._id === song._id)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Şarkı araması sırasında hata:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddSong = async (song: Song) => {
    try {
      const updatedSongs = [...repertoire.songs, song];
      await updateRepertoire(repertoire._id, {
        songs: updatedSongs
      });
      setRepertoire(prev => ({
        ...prev,
        songs: updatedSongs
      }));
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Şarkı eklenirken hata:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateRepertoire(repertoire._id, {
        name: editedName
      });
      setIsEditing(false);
      setIsSearching(false);
      await loadRepertoireDetails();
      // Başarılı bir şekilde kaydedildikten sonra geri dön
      router.back();
    } catch (error) {
      console.error('Repertuvar güncellenirken hata:', error);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    try {
      const updatedSongs = repertoire.songs.filter(song => song._id !== songId);
      await updateRepertoire(repertoire._id, {
        songs: updatedSongs
      });
      setRepertoire(prev => ({
        ...prev,
        songs: updatedSongs
      }));
    } catch (error) {
      console.error('Şarkı silinirken hata:', error);
    }
  };

  const renderSongItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={[styles.songItem, { backgroundColor: theme.card }]}
      onPress={() => !isEditing && router.push({
        pathname: '/songDetail',
        params: { song: JSON.stringify(item) }
      })}
    >
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.songArtist, { color: theme.text + '99' }]}>{item.artist}</Text>
      </View>
      {isEditing && (
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.error }]}
          onPress={() => handleDeleteSong(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderSearchItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={[styles.songItem, { backgroundColor: theme.card }]}
      onPress={() => handleAddSong(item)}
    >
      <View style={styles.songInfo}>
        <Text style={[styles.songTitle, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.songArtist, { color: theme.text + '99' }]}>{item.artist}</Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            {isEditing ? (
              <TextInput
                style={[styles.nameInput, { color: theme.text, borderColor: theme.primary }]}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
              />
            ) : (
              <Text style={[styles.title, { color: theme.text }]}>{repertoire.name}</Text>
            )}
            <TouchableOpacity 
              onPress={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                  setIsSearching(true);
                }
              }}
            >
              <Ionicons
                name={isEditing ? "checkmark" : "create-outline"}
                size={24}
                color={theme.primary}
              />
            </TouchableOpacity>
          </View>

          {isEditing && (
            <View style={[styles.searchBox, { backgroundColor: theme.card }]}>
              <Ionicons name="search" size={20} color={theme.text + '66'} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Şarkı ara..."
                placeholderTextColor={theme.text + '66'}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color={theme.text + '66'} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {loading ? (
            <ActivityIndicator style={styles.loader} color={theme.primary} />
          ) : searchQuery.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                  Şarkı bulunamadı
                </Text>
              }
            />
          ) : (
            <FlatList
              data={repertoire.songs}
              renderItem={renderSongItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                  Henüz şarkı eklenmemiş
                </Text>
              }
            />
          )}
        </View>
      </TouchableWithoutFeedback>
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
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  nameInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  songArtist: {
    fontSize: 14,
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 4,
  },
});
