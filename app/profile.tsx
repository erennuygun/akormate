import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';
import {
  getFavorites,
  getUserRepertoires,
  getUserPrivateSongs,
} from '../src/db/database';
import { useAuth } from '../src/context/AuthContext';
import { useColorScheme } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // 16 padding on each side

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  count: number;
  description: string;
}

export default function Profile() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      loadCounts();
    }
  }, [user]);

  const loadCounts = async () => {
    try {
      const favorites = await getFavorites(user.id);
      const repertoires = await getUserRepertoires(user.id);
      const privateSongs = await getUserPrivateSongs(user.id);

      setMenuItems([
        {
          id: '1',
          title: 'Beğendiklerim',
          icon: 'heart',
          route: '/favorites',
          count: favorites.length,
          description: 'Beğendiğiniz şarkıları burada bulabilirsiniz',
        },
        {
          id: '2',
          title: 'Repertuarlarım',
          icon: 'list',
          route: '/repertoires',
          count: repertoires.length,
          description: 'Oluşturduğunuz repertuarlar burada listelenir',
        },
        {
          id: '3',
          title: 'Özel Şarkılarım',
          icon: 'musical-notes',
          route: '/private-songs',
          count: privateSongs.length,
          description: 'Sadece size özel şarkılarınız',
        },
      ]);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>Profilim</Text>
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.signOutButton}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="person" size={40} color={theme.primary} />
        </View>
        <Text style={[styles.userName, { color: theme.text }]}>{user.name || user.email}</Text>
        <Text style={[styles.userEmail, { color: theme.text + '99' }]}>{user.email}</Text>
      </View>

      <View style={styles.cardsContainer}>
        {menuItems.map((item) => (
          <Link href={item.route} asChild key={item.id}>
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: theme.card + '20',
                  borderColor: theme.card + '40',
                }
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Ionicons name={item.icon} size={24} color={theme.primary} />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.cardCount, { color: theme.text + '99' }]}>
                    {item.count}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.text + '66'}
                    style={styles.arrowIcon}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  signOutButton: {
    padding: 8,
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCount: {
    fontSize: 14,
    marginRight: 8,
  },
  arrowIcon: {
    marginLeft: 4,
  },
});
