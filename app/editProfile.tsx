import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { useAuth } from '../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import api from '../src/config/api';

export default function EditProfile() {
  const { user, updateUserProfile } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      // Eğer kullanıcının fotoğrafı varsa, tam URL'i kullan
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Fotoğraf seçmek için izin gerekiyor!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log('Seçilen fotoğraf:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Fotoğrafı küçült
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800, height: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        setPhotoURL(manipResult.uri);
      }
    } catch (error) {
      console.error('Fotoğraf seçilirken hata:', error);
      alert('Fotoğraf seçilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      let photoData = photoURL;
      if (photoURL && photoURL.startsWith('file://')) {
        // Fotoğrafı base64'e çevir
        const response = await fetch(photoURL);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        photoData = base64 as string;
      }

      const response = await api.put('/users/profile', {
        displayName,
        photoURL: photoData,
      });

      const { user: updatedUser } = response.data;
      
      // Context üzerinden profil güncelleme
      await updateUserProfile({
        displayName,
        photoURL: updatedUser.photoURL,
      });

      // Profil sayfasına yönlendir ve sayfayı yenile
      router.replace('/profile');
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      alert('Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Profili Düzenle</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={[styles.saveButton, { color: theme.primary }]}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.profileImageContainer}>
            {photoURL ? (
              <Image
                source={{ 
                  uri: photoURL.startsWith('http') 
                    ? photoURL 
                    : photoURL.startsWith('file://')
                      ? photoURL
                      : `http://192.168.1.23:5000${photoURL}`,
                  cache: 'reload'
                }}
                style={styles.profileImage}
                onError={(e) => console.log('Fotoğraf yükleme hatası:', e.nativeEvent.error)}
              />
            ) : (
              <View style={[styles.avatarContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="person" size={60} color={theme.primary} />
              </View>
            )}

            <TouchableOpacity 
              style={[styles.editPhotoButton, { backgroundColor: theme.primary }]}
              onPress={pickImage}
            >
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>İsim Soyisim</Text>
              <TextInput
                style={[styles.input, { 
                  color: theme.text,
                  backgroundColor: theme.card,
                  borderColor: theme.border 
                }]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="İsim Soyisim"
                placeholderTextColor={theme.text + '66'}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>E-posta</Text>
              <Text style={[styles.emailText, { 
                color: theme.text + '99',
                backgroundColor: theme.card + '66',
              }]}>{user?.email}</Text>
            </View>
          </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  emailText: {
    height: 48,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlignVertical: 'center',
  },
});
