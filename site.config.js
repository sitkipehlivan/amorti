// Sitenin adı, domaini ve genel ayarları tek yerden buradan değişir.
module.exports = {
  name: 'Amorti',
  tagline: 'Ev alırken ve kiralarken hesabı netleştir',
  domain: 'https://amorti-mugw.netlify.app', // kendi domain bağlanınca güncellenecek
  lang: 'tr',
  publisher: 'Advance Dijital Medya Reklam Hizmetleri A.Ş.',
  editor: 'Sıtkı Pehlivan',
  contactEmail: 'iletisim@amorti.com.tr',
  // Reklam alanlarını önizlemede göstermek için true. Ad Manager bağlanınca
  // her alanın içine GPT slot kodu konacak.
  showAdPlaceholders: true,
  // GA4 ölçüm kimliği gelince buraya yazılacak (ör. 'G-XXXXXXX')
  ga4: '',
  // Güncel oranlar (araçların varsayılanları). Her ay güncellenmeli.
  defaults: {
    konutKredisiAylikFaiz: 2.89, // % aylık, Ekim 2026 piyasası: avantajlı teklifler ~%2,87'den başlıyor
    kiraArtisVarsayimi: 30,       // % yıllık, senaryo hesapları için
  },
  updated: '5 Kasım 2026',
};
