// Sitenin adı, domaini ve genel ayarları tek yerden buradan değişir.
module.exports = {
  name: 'Amorti',
  tagline: 'Ev alırken ve kiralarken hesabı netleştir',
  domain: 'https://amorti.online',
  lang: 'tr',
  publisher: 'Advance Dijital Medya Reklam Hizmetleri A.Ş.',
  editor: 'Sıtkı Pehlivan',
  contactEmail: 'iletisim@amorti.online',
  address: 'İstiklal Mah. Şehit Ali Çelik Sk. Asran Apt. No: 33 İç Kapı No: 3, Ümraniye / İstanbul',
  mersis: '0008193677700001',
  hosting: 'Netlify, Inc. (ABD)',
  // Reklam alanlarını önizlemede göstermek için true. Ad Manager bağlanınca
  // her alanın içine GPT slot kodu konacak.
  showAdPlaceholders: false,
  // GA4 ölçüm kimliği gelince buraya yazılacak (ör. 'G-XXXXXXX')
  ga4: '',
  // Güncel oranlar (araçların varsayılanları). Her ay güncellenmeli.
  defaults: {
    konutKredisiAylikFaiz: 2.89, // % aylık, Ekim 2026 piyasası: avantajlı teklifler ~%2,87'den başlıyor
    kiraArtisVarsayimi: 30,       // % yıllık, senaryo hesapları için
  },
  palette: 'turuncu', // renk paleti: elektrik | pembe | turuncu | zumrut
  updated: '5 Kasım 2026',
};
