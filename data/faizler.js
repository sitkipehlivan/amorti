// data/faizler.json'u okur; en düşük, ortanca ve hesaplayıcı varsayılanını hesaplar.
const raw = require('./faizler.json');
const cfg = require('../site.config');

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const tarihMetin = (t) => { if (!t) return ''; const [y, m, d] = t.split('-').map(Number); return `${d} ${AYLAR[m - 1]} ${y}`; };

const bankalar = raw.bankalar.map((b) => ({ ...b, kontrolMetin: tarihMetin(b.kontrol) }));
const olan = bankalar.filter((b) => typeof b.oran === 'number').sort((a, b) => a.oran - b.oran);
const bekleyen = bankalar.filter((b) => typeof b.oran !== 'number');

const oranlar = olan.map((b) => b.oran);
const m = Math.floor(oranlar.length / 2);
const ortanca = oranlar.length ? (oranlar.length % 2 ? oranlar[m] : (oranlar[m - 1] + oranlar[m]) / 2) : cfg.defaults.konutKredisiAylikFaiz;
const sonKontrol = olan.map((b) => b.kontrol).sort().pop() || null;

module.exports = {
  olan, // oranı bilinen bankalar, düşükten yükseğe
  bekleyen,
  enDusuk: olan[0] || null,
  ortanca: Math.round(ortanca * 100) / 100,
  // Hesaplayıcıların varsayılan faizi: bankaların ortanca oranı
  tipik: Math.round(ortanca * 100) / 100,
  sonKontrol,
  sonKontrolMetin: tarihMetin(sonKontrol),
};
