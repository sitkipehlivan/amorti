# Amorti

Ev amortisman, ilan karşılaştırma, kira artışı ve konut kredisi araçları + İstanbul ilçe rehberleri + emlak haberleri.

## Çalıştırma
    node build.js        # dist/ klasörüne siteyi üretir (bağımlılık yok)

## Netlify
Repo Netlify'a bağlanınca `netlify.toml` build ayarlarını otomatik okur. "Kiranı paylaş" formu Netlify Forms ile çalışır; gönderimler Netlify panelinde Forms bölümünde görünür.

## Güncelleme
- Site adı, domain, GA4, reklam alanları: `site.config.js`
- Her ayın 3'ünde yeni kira artış oranı: `data/kira-oranlari.js` listesinin başına ekle
- Haberler: `content/haberler/` (kurallar `docs/haber-botu.md`)
- İlçeler: `data/ilceler.js`
- Araçlar: `pages/tools.js`, hesap mantığı `src/assets/app.js`

## Haberler
Her haber `content/haberler/YYYY-MM-DD-slug.md` dosyasıdır. Biçim ve günlük haber botunun kuralları: `docs/haber-botu.md`.
