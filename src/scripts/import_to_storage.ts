import AsyncStorage from '@react-native-async-storage/async-storage';
import * as fs from 'fs';
import * as path from 'path';

const importSongs = async () => {
  try {
    // JSON dosyasını oku
    const jsonPath = path.join(__dirname, '../../songs.json');
    const songsData = fs.readFileSync(jsonPath, 'utf-8');
    const songs = JSON.parse(songsData);

    // Mevcut şarkıları kontrol et
    const existingSongsStr = await AsyncStorage.getItem('songs');
    const existingSongs = existingSongsStr ? JSON.parse(existingSongsStr) : [];

    // Yeni şarkıları ekle
    const allSongs = [...existingSongs, ...songs];

    // AsyncStorage'a kaydet
    await AsyncStorage.setItem('songs', JSON.stringify(allSongs));

    console.log(`${songs.length} şarkı başarıyla AsyncStorage'a eklendi.`);
    console.log(`Toplam şarkı sayısı: ${allSongs.length}`);
  } catch (error) {
    console.error('Hata:', error);
  }
};

importSongs();
