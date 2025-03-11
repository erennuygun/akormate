import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { useAuth } from '../src/context/AuthContext';
import BottomNavigation from '../components/BottomNavigation';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  description: string;
}

export default function Profile() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user, signOut, checkTokenExpiration } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const isExpired = await checkTokenExpiration();
      if (isExpired) {
        console.log('Token expired in profile page');
        return;
      }
    };

    checkAuth();
  }, [user]);

  const menuItems: MenuItem[] = [
    {
      id: '1',
      title: 'Beğendiklerim',
      icon: 'heart',
      route: 'favorites',
      description: 'Beğendiğiniz şarkıları burada bulabilirsiniz',
    },
    {
      id: '2',
      title: 'Repertuarlarım',
      icon: 'list',
      route: 'repertoires',
      description: 'Oluşturduğunuz repertuarlar burada listelenir',
    },
    {
      id: '3',
      title: 'Özel Şarkılarım',
      icon: 'musical-notes',
      route: 'private-songs',
      description: 'Sadece size özel şarkılarınız',
    },
    {
      id: '4',
      title: 'İndirilenler',
      icon: 'cloud-offline',
      route: 'downloads',
      description: 'Çevrimdışı görüntülemek için indirdiğiniz şarkılar',
    },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel' as const,
        },
        {
          text: 'Çıkış Yap',
          style: 'destructive' as const,
          onPress: signOut,
        },
      ]
    );
  };

  const handleMenuItemPress = (route: string) => {
    if (!user || !user.id) {
      Alert.alert('Hata', 'Bu özelliği kullanmak için giriş yapmalısınız.');
      return;
    }
    router.push(`/${route}`);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Profilim</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.profileImageContainer}>
          {user.photoURL ? (
            <Image
              source={{ 
                uri: user.photoURL.startsWith('http') 
                  ? user.photoURL 
                  : `http://192.168.1.23:5000${user.photoURL}`,
                cache: 'reload'
              }}
              style={styles.profileImage}
              onError={(e) => console.log('Fotoğraf yükleme hatası:', e.nativeEvent.error)}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatarContainer, { backgroundColor: theme.card }]}>
              <Ionicons name="person" size={45} color={theme.primary} />
            </View>
          )}
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/editProfile')}
          >
            <Ionicons name="pencil" size={15} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.userName, { color: theme.text }]}>{user?.name || user?.email}</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, { backgroundColor: theme.card }]}
            onPress={() => handleMenuItemPress(item.route)}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={24} color={theme.primary} />
                <View style={styles.menuItemTextContainer}>
                  <Text style={[styles.menuItemTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.menuItemDescription, { color: theme.text + '99' }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.text + '99'} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <BottomNavigation currentRoute={pathname} />
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
  signOutButton: {
    padding: 8,
  },
  userInfo: {
    alignItems: 'center',
    padding: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    right: -1,
    top: -1,
    width: 25,
    height: 25,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    opacity: 0.9
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
  },
});
