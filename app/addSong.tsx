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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme, darkTheme } from '../src/theme/colors';
import { saveSong } from '../src/db/database';

export default function AddSong() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [chords, setChords] = useState('');
  const [originalKey, setOriginalKey] = useState('');
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const handleSave = async () => {
    if (!title.trim() || !artist.trim() || !chords.trim() || !originalKey.trim()) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      await saveSong({
        id: Date.now().toString(),
        title: title.trim(),
        artist: artist.trim(),
        chords: chords.trim(),
        originalKey: originalKey.trim(),
      });
      router.replace('/'); // Ana sayfaya yönlendir ve yeniden yükle
    } catch (error) {
      console.error('Error saving song:', error);
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
          <Text style={[styles.title, { color: theme.text }]}>Şarkı Ekle</Text>
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
              style={[styles.chordsInput, { color: theme.text }]}
              value={chords}
              onChangeText={setChords}
              placeholder="Akorları ve şarkı sözlerini girin"
              placeholderTextColor={theme.text + '66'}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  chordsInput: {
    fontSize: 16,
    height: 300,
    padding: 0,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
