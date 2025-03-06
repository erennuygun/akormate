import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { router, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { useAuth } from '../src/context/AuthContext';
import { savePrivateSong } from '../src/db/database';
import BottomNavigation from '../components/BottomNavigation';

export default function AddPrivateSong() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [chords, setChords] = useState('');
  const [originalKey, setOriginalKey] = useState('');
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user } = useAuth();
  const pathname = usePathname();

  const handleSave = async () => {
    if (!user || !user.id) {
      Alert.alert('Hata', 'Oturum açmanız gerekiyor.');
      router.replace('/auth/login');
      return;
    }

    if (!title.trim() || !artist.trim() || !chords.trim() || !originalKey.trim()) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      await savePrivateSong({
        title: title.trim(),
        artist: artist.trim(),
        chords: chords.trim(),
        originalKey: originalKey.trim(),
        userId: user.id,
        isPrivate: true
      });
      router.replace('/private-songs');
    } catch (error) {
      console.error('Error saving private song:', error);
      Alert.alert('Hata', 'Şarkı kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Özel Şarkı Ekle</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={[styles.saveButtonText, { color: theme.primary }]}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.text + '99' }]}>Şarkı Adı</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Şarkı adını girin"
              placeholderTextColor={theme.text + '66'}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.text + '99' }]}>Sanatçı</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={artist}
              onChangeText={setArtist}
              placeholder="Sanatçı adını girin"
              placeholderTextColor={theme.text + '66'}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.text + '99' }]}>Orijinal Ton</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={originalKey}
              onChangeText={setOriginalKey}
              placeholder="Örn: Am"
              placeholderTextColor={theme.text + '66'}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.text + '99' }]}>Akorlar ve Sözler</Text>
            <TextInput
              style={[styles.input, styles.chordsInput, { color: theme.text }]}
              value={chords}
              onChangeText={setChords}
              placeholder="Akorları ve sözleri girin"
              placeholderTextColor={theme.text + '66'}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
        <BottomNavigation currentRoute={pathname} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 8,
  },
  chordsInput: {
    height: 200,
  },
});
