# 🧬 Skin Harmony Lab

Bilim bazlı, reklamsız, dürüst cilt bakımı & makyaj asistanı.

## Vercel'e Deploy Etme (Adım Adım)

### 1. Google Gemini API Key Al (ÜCRETSİZ)
1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) adresine git
2. Google hesabınla giriş yap
3. **Create API Key** butonuna tıkla
4. `AIzaSy...` ile başlayan anahtarı kopyala ve kaydet
5. **Kredi kartı gerekmez, tamamen ücretsiz!**

### 2. GitHub'a Yükle
1. [github.com](https://github.com) hesabın yoksa oluştur
2. Sağ üstten **New Repository** → isim: `skin-harmony-lab` → **Create**
3. **"uploading an existing file"** linkine tıkla
4. ZIP'ten çıkardığın tüm dosyaları sürükle bırak
5. **Commit changes** butonuna bas

### 3. Vercel'e Deploy Et
1. [vercel.com](https://vercel.com) adresine git → **GitHub ile giriş yap**
2. **Add New Project** → `skin-harmony-lab` reposunu seç
3. **Environment Variables** bölümüne:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** 1. adımda aldığın `AIzaSy...` anahtarı yapıştır
4. **Deploy** butonuna bas
5. 1-2 dakika bekle — site hazır! 🎉

### 4. iPhone'a Ekle
1. Vercel'in verdiği URL'yi (mesela `skin-harmony-lab.vercel.app`) **Safari**'de aç
2. Alttaki **paylaş butonuna** bas (kare + yukarı ok)
3. **"Ana Ekrana Ekle"** seçeneğine tıkla
4. İsim olarak **"Skin Harmony Lab"** yaz → **Ekle**
5. Artık bir uygulama gibi kullanabilirsin! 📱

## Dosya Yapısı
```
skin-harmony-lab/
├── app/
│   ├── layout.js              # HTML yapısı
│   ├── page.js                # Ana sayfa
│   ├── SkinHarmonyLab.jsx     # Tüm uygulama kodu
│   └── api/
│       └── chat/
│           └── route.js       # Gemini API bağlantısı
├── package.json
├── next.config.js
├── .env.local.example         # API key şablonu
└── .gitignore
```

## Sorun Giderme
- **"API hatası"** → Gemini API key'ini kontrol et, doğru yapıştırdığından emin ol
- **Sayfa açılmıyor** → Vercel dashboard'dan deploy loglarını kontrol et
- **iPhone'da tam ekran açılmıyor** → Sadece Safari'den ekle, Chrome'dan olmaz
