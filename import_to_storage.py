import pandas as pd
import json
import uuid
from datetime import datetime
import os

# AsyncStorage dosya yolu
ASYNC_STORAGE_DIR = os.path.expanduser('~/.expo/async-storage')
STORAGE_KEY = 'songs'

# Dizini oluştur (yoksa)
os.makedirs(ASYNC_STORAGE_DIR, exist_ok=True)

# Excel dosyasını oku
df = pd.read_excel('sarkilar_ve_akorlar.xlsx')

# Sütun isimlerini düzelt
df.columns = ['title', 'artist', 'originalKey', 'chords']

# NaN değerleri temizle
df = df.fillna('')

# Şarkıları oluştur
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

# AsyncStorage dosya yolu
storage_file = os.path.join(ASYNC_STORAGE_DIR, STORAGE_KEY)

# Dosyayı oluştur ve şarkıları kaydet
with open(storage_file, 'w', encoding='utf-8') as f:
    json.dump(songs, f, ensure_ascii=False, indent=2)

print(f"{len(songs)} şarkı başarıyla AsyncStorage'a eklendi.")
print(f"Dosya konumu: {storage_file}")

# Manifest dosyasını güncelle
manifest_file = os.path.join(ASYNC_STORAGE_DIR, 'manifest.json')
try:
    with open(manifest_file, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    manifest = {}

manifest[STORAGE_KEY] = {
    "key": STORAGE_KEY,
    "value": storage_file
}

with open(manifest_file, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Manifest dosyası güncellendi.")
