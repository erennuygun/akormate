import pandas as pd
import json
import uuid
from datetime import datetime

# Excel dosyasını oku
df = pd.read_excel('sarkilar_ve_akorlar.xlsx')

# Sütun isimlerini düzelt (varsa boşlukları ve özel karakterleri kaldır)
df.columns = ['title', 'artist', 'originalKey', 'chords']

# NaN değerleri temizle
df = df.fillna('')

# Şarkıları JSON formatına dönüştür
songs = []
for _, row in df.iterrows():
    song = {
        'id': str(uuid.uuid4()),
        'title': row['title'].strip(),
        'artist': row['artist'].strip(),
        'originalKey': row['originalKey'].strip(),
        'chords': row['chords'].strip(),
        'created_at': datetime.now().isoformat()
    }
    songs.append(song)

# Mevcut songs.json dosyasını oku (varsa)
try:
    with open('songs.json', 'r', encoding='utf-8') as f:
        existing_songs = json.load(f)
except FileNotFoundError:
    existing_songs = []

# Yeni şarkıları ekle
all_songs = existing_songs + songs

# JSON dosyasına kaydet
with open('songs.json', 'w', encoding='utf-8') as f:
    json.dump(all_songs, f, ensure_ascii=False, indent=2)

print(f"{len(songs)} şarkı başarıyla eklendi.")
print(f"Toplam şarkı sayısı: {len(all_songs)}")

# İlk birkaç şarkıyı göster
print("\nÖrnek şarkılar:")
for song in songs[:3]:
    print(f"\nBaşlık: {song['title']}")
    print(f"Sanatçı: {song['artist']}")
    print(f"Ton: {song['originalKey']}")
    print(f"Akorlar: {song['chords'][:100]}...")
