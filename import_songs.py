import pandas as pd
from pymongo import MongoClient
from datetime import datetime

# MongoDB bağlantısı
client = MongoClient('mongodb://localhost:27017/')
db = client['akormate']
songs_collection = db['songs']

# Excel dosyasını oku
df = pd.read_excel('sarkilar_ve_akorlar.xlsx')

# Sütun isimlerini düzelt (varsa boşlukları ve özel karakterleri kaldır)
df.columns = ['title', 'artist', 'originalKey', 'chords']

# NaN değerleri temizle
df = df.fillna('')

# Şarkıları MongoDB'ye ekle
added_count = 0
for _, row in df.iterrows():
    # Aynı başlık ve sanatçıya sahip şarkı var mı kontrol et
    existing_song = songs_collection.find_one({
        'title': row['title'].strip(),
        'artist': row['artist'].strip()
    })
    
    if not existing_song:
        song = {
            'title': row['title'].strip(),
            'artist': row['artist'].strip(),
            'originalKey': row['originalKey'].strip(),
            'chords': row['chords'].strip(),
            'created_at': datetime.now()
        }
        songs_collection.insert_one(song)
        added_count += 1

print(f"{added_count} yeni şarkı başarıyla eklendi.")
print(f"Toplam şarkı sayısı: {songs_collection.count_documents({})}")

# İlk birkaç şarkıyı göster
print("\nÖrnek şarkılar:")
for song in songs_collection.find().limit(3):
    print(f"\nBaşlık: {song['title']}")
    print(f"Sanatçı: {song['artist']}")
    print(f"Ton: {song['originalKey']}")
    print(f"Akorlar: {song['chords'][:100]}...")
