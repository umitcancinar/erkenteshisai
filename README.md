# Erken Teşhis AI

Erken Teşhis AI, modern sağlık izleme ve ön teşhis platformudur. Google Gemini AI desteği ile multimodal analiz, sağlık danışmanlığı ve otomatik raporlama sunar.

## Özellikler
- **Apple & Google Tarzı Modern Arayüz:** Karanlık tema ve Glassmorphism.
- **Sağlık Takibi:** Günlük veri girişi ve trend analizleri.
- **AI Görüntü Analizi:** Cilt, göz vb. fotoğraflar için ön teşhis.
- **AI Sağlık Danışmanı:** Gemini destekli sohbet asistanı.
- **Yönetici Paneli:** Sistem istatistikleri ve kullanıcı yönetimi.

## Teknoloji Yığını
- **Frontend:** Vanilla Javascript (SPA)
- **Backend:** Node.js + Express
- **Veritabanı:** PostgreSQL (Neon)
- **AI:** Google Gemini 3.0 Flash Preview

## Kurulum
1. Repoyu klonlayın.
2. `backend` klasöründe `npm install` çalıştırın.
3. `.env` dosyasını oluşturun (DATABASE_URL ve GEMINI_API_KEY ekleyin).
4. `node server.js` ile sunucuyu başlatın.
