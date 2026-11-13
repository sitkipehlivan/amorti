// Hazır ilan araması: kullanıcının seçimlerinden emlak ilan sitelerinde
// filtreli arama linki üretilir. Linklerin biçimi bu dosyada; tarayıcıdaki
// kod (app.js → ilanAra) window.AMORTI_ILAN üzerinden okur.
//
// sahibinden: /{satilik|kiralik}-daire/istanbul-{ilce}?price_min=..&price_max=..&a20=<oda kodu>&a812=<bina yaşı kodu>
//   (kodlar her seçenek için ayrı; sb alanlarında. Boş kalanlar linke eklenmez, kullanıcıya "sitede seç" denir.)
// Emlakjet biçimi 13 Kasım 2026'da tarayıcıda denenerek doğrulandı:
//   /{satilik|kiralik}-daire/istanbul-{ilce}?filtreler=binanin-yasi=..&max-fiyat=..&min-fiyat=..&oda-sayisi=2-1,3-1

const ilceler = [
  // Anadolu yakası
  ['adalar', 'Adalar', 'Anadolu'], ['atasehir', 'Ataşehir', 'Anadolu'], ['beykoz', 'Beykoz', 'Anadolu'],
  ['cekmekoy', 'Çekmeköy', 'Anadolu'], ['kadikoy', 'Kadıköy', 'Anadolu'], ['kartal', 'Kartal', 'Anadolu'],
  ['maltepe', 'Maltepe', 'Anadolu'], ['pendik', 'Pendik', 'Anadolu'], ['sancaktepe', 'Sancaktepe', 'Anadolu'],
  ['sultanbeyli', 'Sultanbeyli', 'Anadolu'], ['sile', 'Şile', 'Anadolu'], ['tuzla', 'Tuzla', 'Anadolu'],
  ['umraniye', 'Ümraniye', 'Anadolu'], ['uskudar', 'Üsküdar', 'Anadolu'],
  // Avrupa yakası
  ['arnavutkoy', 'Arnavutköy', 'Avrupa'], ['avcilar', 'Avcılar', 'Avrupa'], ['bagcilar', 'Bağcılar', 'Avrupa'],
  ['bahcelievler', 'Bahçelievler', 'Avrupa'], ['bakirkoy', 'Bakırköy', 'Avrupa'], ['basaksehir', 'Başakşehir', 'Avrupa'],
  ['bayrampasa', 'Bayrampaşa', 'Avrupa'], ['besiktas', 'Beşiktaş', 'Avrupa'], ['beylikduzu', 'Beylikdüzü', 'Avrupa'],
  ['beyoglu', 'Beyoğlu', 'Avrupa'], ['buyukcekmece', 'Büyükçekmece', 'Avrupa'], ['catalca', 'Çatalca', 'Avrupa'],
  ['esenler', 'Esenler', 'Avrupa'], ['esenyurt', 'Esenyurt', 'Avrupa'], ['eyupsultan', 'Eyüpsultan', 'Avrupa'],
  ['fatih', 'Fatih', 'Avrupa'], ['gaziosmanpasa', 'Gaziosmanpaşa', 'Avrupa'], ['gungoren', 'Güngören', 'Avrupa'],
  ['kagithane', 'Kağıthane', 'Avrupa'], ['kucukcekmece', 'Küçükçekmece', 'Avrupa'], ['sariyer', 'Sarıyer', 'Avrupa'],
  ['silivri', 'Silivri', 'Avrupa'], ['sultangazi', 'Sultangazi', 'Avrupa'], ['sisli', 'Şişli', 'Avrupa'],
  ['zeytinburnu', 'Zeytinburnu', 'Avrupa'],
].map(([slug, ad, yaka]) => ({ slug, ad, yaka }));

const odalar = [
  { k: '1+1', ej: ['1-1'], sb: [] },
  { k: '2+1', ej: ['2-1'], sb: [] },
  { k: '3+1', ej: ['3-1'], sb: [] },
  { k: '4+1', ej: ['4-1'], sb: [] },
  { k: '5+1 ve üzeri', ej: ['5-1', '5-2', '6-1', '6-2', '7-1', '8-1'], sb: [] },
];

const yaslar = [
  { k: '', ad: 'Fark etmez', ej: [], sb: [] },
  { k: '0-10', ad: '0–10 yaş', ej: ['0-oturuma-hazir', '0-yapim-asamasinda', '1', '2', '3', '4', '5', '6-10'], sb: [] },
  { k: '11-20', ad: '11–20 yaş', ej: ['11-15', '16-20'], sb: [] },
  { k: '21-30', ad: '21–30 yaş', ej: ['21-25', '26-30'], sb: [] },
  { k: '31+', ad: '31 yaş ve üzeri', ej: ['31-ve-uzeri'], sb: [] },
];

// Fiyat kısayolları (TL)
const fiyatlar = {
  satilik: [[0, 5e6, '5 milyona kadar'], [5e6, 10e6, '5–10 milyon'], [10e6, 20e6, '10–20 milyon'], [20e6, 0, '20 milyon üstü']],
  kiralik: [[0, 25000, '25 bine kadar'], [25000, 40000, '25–40 bin'], [40000, 70000, '40–70 bin'], [70000, 0, '70 bin üstü']],
};

module.exports = { ilceler, odalar, yaslar, fiyatlar };
