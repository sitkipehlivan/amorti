// Hazır ilan araması: kullanıcının seçimlerinden emlak ilan sitelerinde
// filtreli arama linki üretilir. Linklerin biçimi bu dosyada; tarayıcıdaki
// kod (app.js → ilanAra) window.AMORTI_ILAN üzerinden okur.
//
// sahibinden: /{satilik|kiralik}-daire/istanbul-{ilce}?price_min=..&price_max=..&a20=<oda kodu>&a812=<bina yaşı kodu>
//   Kodlar 13 Kasım 2026'da kullanıcının paylaştığı linklerden eşlendi (sb alanları).
// Hepsiemlak: /{ilce}-{satilik|kiralik}/daire?buildingAges=0-0,1-5,6-10&p63=<oda kodu>-<oda kodu>&p31=<min>&p32=<max>&p33=1
//   Yaş seçenekleri sabit: 0-0, 1-5, 6-10, 11-15, 16-20, 21-999. Oda kodları 180401… (1+1=180402, 2+1=180404,
//   3+1=180407, 4+1=180411, 5+1 ve üzeri=180416-180421-180426-180431-180435)
//   Konut tipi: /{ilce}-{islem}?subCategories=daire,villa,... (kullanıcının 14 Kasım 2026 linkinden)
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
  { k: '1+1', ej: ['1-1'], sb: ['38473'], hp: ['180402'] },
  { k: '2+1', ej: ['2-1'], sb: ['38470'], hp: ['180404'] },
  { k: '3+1', ej: ['3-1'], sb: ['38474'], hp: ['180407'] },
  { k: '4+1', ej: ['4-1'], sb: ['38471'], hp: ['180411'] },
  { k: '5+1 ve üzeri', ej: ['5-1', '5-2', '6-1', '6-2', '7-1', '8-1'], sb: ['38475'], hp: ['180416', '180421', '180426', '180431', '180435'] },
];

const yaslar = [
  { k: '', ad: 'Fark etmez', ej: [], sb: [], hp: [] },
  { k: '0-10', ad: '0–10 yaş', ej: ['0-oturuma-hazir', '0-yapim-asamasinda', '1', '2', '3', '4', '5', '6-10'], sb: ['40602', '40603', '40604', '40605', '40606', '1297863', '1297864', '1297865'], hp: ['0-0', '1-5', '6-10'] },
  { k: '11-20', ad: '11–20 yaş', ej: ['11-15', '16-20'], sb: ['40607', '43901'], hp: ['11-15', '16-20'] },
  { k: '21-30', ad: '21–30 yaş', ej: ['21-25', '26-30'], sb: ['43902', '43903'], hp: ['21-999'], hpNot: 'Yaş filtresi bu sitede 21 yaş ve üzeri olarak uygulanır' },
  { k: '31+', ad: '31 yaş ve üzeri', ej: ['31-ve-uzeri'], sb: ['43904'], hp: ['21-999'], hpNot: 'Yaş filtresi bu sitede 21 yaş ve üzeri olarak uygulanır' },
];

// Fiyat kısayolları (TL)
// Konut tipi. sb: sahibinden kategori adresi (satilik-<sb>), ej: Emlakjet (satilik-<ej>, Çeşme'de denendi), hp: Hepsiemlak subCategories
const tipler = [
  { k: 'daire', ad: 'Daire', cogul: 'daireler', sb: 'daire', ej: 'daire', hp: ['daire'] },
  { k: 'rezidans', ad: 'Rezidans', cogul: 'rezidanslar', sb: 'residence', ej: 'residence', hp: ['residence'] },
  { k: 'villa', ad: 'Villa', cogul: 'villalar', sb: 'villa', ej: 'villa', hp: ['villa'] },
  { k: 'mustakil', ad: 'Müstakil ev', cogul: 'müstakil evler', sb: 'mustakil-ev', ej: 'mustakil-ev', hp: ['mustakil-ev'] },
  { k: 'yazlik', ad: 'Yazlık', cogul: 'yazlıklar', sb: 'yazlik', ej: 'yazlik', hp: ['yazlik'] },
  { k: 'tum', ad: 'Tüm konutlar', cogul: 'evler', sb: '', ej: 'konut', hp: ['daire', 'residence', 'villa', 'mustakil-ev', 'yazlik', 'bina', 'prefabrik', 'bungalov', 'koy-evi', 'ciftlik-evi', 'kosk', 'yali-dairesi', 'yali', 'dag-evi', 'loft-daire', 'kooperatif'] },
];

const fiyatlar = {
  satilik: [[0, 5e6, '5 milyona kadar'], [5e6, 10e6, '5–10 milyon'], [10e6, 20e6, '10–20 milyon'], [20e6, 0, '20 milyon üstü']],
  kiralik: [[0, 25000, '25 bine kadar'], [25000, 40000, '25–40 bin'], [40000, 70000, '40–70 bin'], [70000, 0, '70 bin üstü']],
};

module.exports = { ilceler, odalar, yaslar, fiyatlar, tipler };
