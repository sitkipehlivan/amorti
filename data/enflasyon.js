// Enflasyon varsayımı: araçlardaki kira artışı tahmini buradan gelir.
// Güncelleme: her ay TCMB Piyasa Katılımcıları Anketi yayınlanınca "beklenti" alanları;
// her ocakta bir önceki yılın yıl sonu TÜFE'si "gecmis" listesine eklenir.

// TÜİK yıl sonu (aralık, yıllık) TÜFE, %
const gecmis = {
  2000: 39.0, 2001: 68.53, 2002: 29.75, 2003: 18.36, 2004: 9.32, 2005: 7.72,
  2006: 9.65, 2007: 8.39, 2008: 10.06, 2009: 6.53, 2010: 6.40, 2011: 10.45,
  2012: 6.16, 2013: 7.40, 2014: 8.17, 2015: 8.81, 2016: 8.53, 2017: 11.92,
  2018: 20.30, 2019: 11.84, 2020: 14.60, 2021: 36.08, 2022: 64.27, 2023: 64.77,
  2024: 44.38, 2025: 30.89,
};

const beklenti = {
  kaynak: 'TCMB Piyasa Katılımcıları Anketi, Kasım 2026',
  ay12: 24.04, // 12 ay sonrası TÜFE beklentisi
  ay24: 18.02, // 24 ay sonrası TÜFE beklentisi
  tcmb: { 2027: 21, 2028: 13.5, ortaVade: 5, kaynak: 'TCMB Enflasyon Raporu, Kasım 2026' },
};

const degerler = Object.values(gecmis).sort((a, b) => a - b);
const m = Math.floor(degerler.length / 2);
const medyan = degerler.length % 2 ? degerler[m] : (degerler[m - 1] + degerler[m]) / 2;
const geoOrt = (Math.pow(Object.values(gecmis).reduce((p, v) => p * (1 + v / 100), 1), 1 / degerler.length) - 1) * 100;

// Uzun vadeli çapa: 2000'den bu yana yıl sonu enflasyonun medyanı (tipik bir yıl).
// Yol: 1. yıl = 12 ay beklentisi, 2. yıl = 24 ay beklentisi, 3–6. yıl = çapaya doğrusal yakınsama, sonrası çapa.
const capa = Math.round(medyan * 100) / 100;
const YIL = 40;
const yol = [];
for (let i = 1; i <= YIL; i++) {
  let v;
  if (i === 1) v = beklenti.ay12;
  else if (i === 2) v = beklenti.ay24;
  else if (i <= 6) v = beklenti.ay24 + (capa - beklenti.ay24) * ((i - 2) / 4);
  else v = capa;
  yol.push(Math.round(v * 100) / 100);
}

module.exports = {
  gecmis,
  beklenti,
  medyan: capa,
  geoOrt: Math.round(geoOrt * 100) / 100,
  yol, // yıllık beklenen enflasyon, % (1. yıl, 2. yıl, ...)
};
