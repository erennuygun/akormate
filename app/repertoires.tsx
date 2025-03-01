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
import { getUserRepertoires } from '../src/db/database';
import { useAuth } from '../src/context/AuthContext';
import { useColorScheme } from 'react-native';

interface Repertoire {
  id: string;
  name: string;
  songs: string[];
  created_at: string;
}

export default function Repertoires() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadRepertoires();
  }, []);

  const loadRepertoires = async () => {
    if (!user || !user.id) {
      router.replace('/auth/login');
      return;
    }

    try {
      setLoading(true);
      const userRepertoires = await getUserRepertoires(user.id);
      setRepertoires(userRepertoires);
    } catch (error) {
      console.error('Repertuarları getirirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRepertoirePress = (repertoire: Repertoire) => {
    router.push({
      pathname: '/repertoireDetail',
      params: { repertoire: JSON.stringify(repertoire) }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Repertuarlarım</Text>
        <TouchableOpacity onPress={() => router.push('/addRepertoire')} style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : repertoires.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list" size={48} color={theme.text + '66'} />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Henüz repertuarınız bulunmuyor
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/addRepertoire')}
            style={[styles.addRepertoireButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.addRepertoireButtonText}>Repertuar Oluştur</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={repertoires}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.repertoireItem, { backgroundColor: theme.card }]}
              onPress={() => handleRepertoirePress(item)}
            >
              <View>
                <Text style={[styles.repertoireName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.songCount, { color: theme.text + '99' }]}>
                  {item.songs.length} şarkı
                </Text>
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
  addRepertoireButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addRepertoireButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  repertoireItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  repertoireName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  songCount: {
    fontSize: 14,
  },
});
