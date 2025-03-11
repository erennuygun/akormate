# Dosya adı
dosya_adi = "test.txt"

# Dosyayı oku ve satırları liste olarak al
with open(dosya_adi, "r", encoding="utf-8") as f:
    satirlar = f.readlines()

# Satırları temizle (başında/sonunda boşluk veya newline karakterleri olabilir)
satirlar = [satir.strip() for satir in satirlar]

# Tekrar edenleri teke düşürmek için set kullan
tekil_satirlar = sorted(set(satirlar))  # Sorted ekleyerek alfabetik sıralama sağladım

# Temizlenmiş veriyi tekrar dosyaya yaz
with open(dosya_adi, "w", encoding="utf-8") as f:
    for satir in tekil_satirlar:
        f.write(satir + "\n")

print("Tekrar eden satırlar teke düşürüldü!")
