import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { getRepertoires, createRepertoire, getSongs, deleteRepertoire } from '../src/db/database';
import { useAuth } from '../src/context/AuthContext';

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

export default function Repertoires() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRepertoireName, setNewRepertoireName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadRepertoires();
  }, []);

  useEffect(() => {
    if (pathname === '/repertoires') {
      loadRepertoires();
    }
  }, [pathname]);

  const loadRepertoires = async () => {
    try {
      console.log('Repertuvarlar yüklenmeye başlıyor...');
      setLoading(true);
      const data = await getRepertoires();
      console.log('Alınan repertuvar verileri:', data);
      setRepertoires(data);
    } catch (error) {
      console.error('Repertuvarlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await getSongs(query, {});
        setSearchResults(results);
      } catch (error) {
        console.error('Şarkı araması sırasında hata:', error);
      }
    } else {
      setSearchResults(selectedSongs);
    }
  };

  const toggleSongSelection = (song: Song) => {
    setSelectedSongs(prev => {
      const isSelected = prev.some(s => s._id === song._id);
      if (isSelected) {
        return prev.filter(s => s._id !== song._id);
      } else {
        return [...prev, song];
      }
    });
  };

  const handleCreateRepertoire = async () => {
    if (!newRepertoireName.trim() || selectedSongs.length === 0) {
      return;
    }

    try {
      console.log('Yeni repertuvar oluşturuluyor...');
      console.log('Seçilen şarkılar:', selectedSongs);
      
      const songIds = selectedSongs.map(song => song._id);
      console.log('Şarkı ID listesi:', songIds);
      
      await createRepertoire(newRepertoireName.trim(), songIds);
      console.log('Repertuvar başarıyla oluşturuldu');
      
      setModalVisible(false);
      setNewRepertoireName('');
      setSelectedSongs([]);
      setSearchQuery('');
      setSearchResults([]);
      loadRepertoires();
    } catch (error) {
      console.error('Repertuvar oluşturulurken hata:', error);
    }
  };

  const renderRepertoireItem = ({ item }: { item: Repertoire }) => (
    <TouchableOpacity
      style={[
        styles.repertoireCard,
        { 
          backgroundColor: theme.card,
          marginLeft: isEditing ? 0 : 16,
          marginRight: isEditing ? 50 : 16
        }
      ]}
      onPress={() => router.push({
        pathname: '/repertoireDetail',
        params: { repertoire: JSON.stringify(item) }
      })}
    >
      <View style={styles.repertoireInfo}>
        <Text style={[styles.repertoireName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.songCount, { color: theme.text + '99' }]}>
          {item.songs.length} şarkı
        </Text>
      </View>
      {isEditing ? (
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.error }]}
          onPress={() => handleDeleteRepertoire(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={24} color={theme.text + '99'} />
      )}
    </TouchableOpacity>
  );

  const handleDeleteRepertoire = async (id: string) => {
    try {
      await deleteRepertoire(id);
      loadRepertoires();
    } catch (error) {
      console.error('Repertuar silinirken hata:', error);
    }
  };

  const renderSearchItem = ({ item }: { item: Song }) => {
    const isSelected = selectedSongs.some(s => s._id === item._id);
    return (
      <TouchableOpacity
        style={[
          styles.searchItem,
          { backgroundColor: theme.card },
          isSelected && { backgroundColor: theme.primary + '20' }
        ]}
        onPress={() => toggleSongSelection(item)}
      >
        <View>
          <Text style={[styles.songTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.songArtist, { color: theme.text + '99' }]}>{item.artist}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Repertuvarlarım</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Ionicons 
            name={isEditing ? "close" : "create-outline"} 
            size={24} 
            color={theme.primary} 
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : repertoires.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={48} color={theme.text + '66'} />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Henüz repertuvarınız bulunmuyor
          </Text>
          <Text style={[styles.emptyText, { color: theme.text + '66', fontSize: 14, marginTop: 8 }]}>
            Repertuvar oluşturmak için + butonuna tıklayınız.
          </Text>
        </View>
      ) : (
        <FlatList
          data={repertoires}
          renderItem={renderRepertoireItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: isEditing ? 16 : 0 }
          ]}
        />
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setModalVisible(false);
                      setNewRepertoireName('');
                      setSelectedSongs([]);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  >
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Yeni Repertuvar</Text>
                  <TouchableOpacity
                    onPress={handleCreateRepertoire}
                    disabled={!newRepertoireName.trim() || selectedSongs.length === 0}
                  >
                    <Text
                      style={[
                        styles.saveButton,
                        {
                          color: !newRepertoireName.trim() || selectedSongs.length === 0
                            ? theme.text + '50'
                            : theme.primary
                        }
                      ]}
                    >
                      Kaydet
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    placeholder="Repertuvar İsmi"
                    placeholderTextColor={theme.text + '66'}
                    value={newRepertoireName}
                    onChangeText={setNewRepertoireName}
                  />

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

                  <View style={styles.listContainer}>
                    <FlatList
                      data={searchQuery.length === 0 ? selectedSongs : searchResults}
                      renderItem={renderSearchItem}
                      keyExtractor={(item) => item._id}
                      style={styles.searchList}
                      keyboardShouldPersistTaps="handled"
                      ListEmptyComponent={
                        searchQuery.length > 0 ? (
                          <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                            Şarkı bulunamadı
                          </Text>
                        ) : selectedSongs.length === 0 ? (
                          <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                            Henüz şarkı seçilmedi
                          </Text>
                        ) : null
                      }
                    />

                    {selectedSongs.length > 0 && (
                      <View style={[styles.selectedCount, { backgroundColor: theme.primary }]}>
                        <Text style={styles.selectedCountText}>
                          {selectedSongs.length} şarkı seçildi
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC3545',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: -45,
  },
  editButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  repertoireCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  repertoireInfo: {
    flex: 1,
  },
  repertoireName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  songCount: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  searchList: {
    flex: 1,
    marginTop: 16,
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
  },
  selectedCount: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedCountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    position: 'relative',
    marginTop: 16,
  },
});
