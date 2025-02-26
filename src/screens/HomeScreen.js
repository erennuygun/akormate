import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { songs } from '../data/songs';
import { lightTheme, darkTheme } from '../theme/colors';

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.songItem, { backgroundColor: theme.card }]}
      onPress={() => navigation.navigate('SongDetail', { song: item })}
    >
      <Text style={[styles.songTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.songArtist, { color: theme.text }]}>{item.artist}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TextInput
        style={[styles.searchInput, { 
          backgroundColor: theme.card,
          color: theme.text,
          borderColor: theme.border
        }]}
        placeholder="Şarkı veya sanatçı ara..."
        placeholderTextColor={theme.text}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredSongs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    margin: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  listContainer: {
    padding: 10,
  },
  songItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default HomeScreen;
