# Amorti haber botu kuralları

Bu dosya, her sabah çalışan zamanlanmış görevin tüm kurallarını içerir. Görev bu dosyayı okuyup harfiyen uygular.

## Sitenin okuru ve haberin amacı

Okur: İstanbul'da ev almayı, kiralamayı ya da yatırım yapmayı düşünen sıradan biri. Haber ona şu sorulardan birinde yardım etmeli: "Ev fiyatları/kiralar nereye gidiyor?", "Kredi çekmeli miyim?", "Hangi ilçede ne oluyor, değer kazanır mı?", "Kiracı/ev sahibi olarak haklarım ve yükümlülüklerim değişti mi?"

## Konular (öncelik sırasıyla)

1. **Resmî veri açıklamaları:** TÜİK kira artış oranı (TÜFE 12 aylık ortalama), TÜİK konut satış istatistikleri, TCMB Konut Fiyat Endeksi ve Yeni Kiracı Kira Endeksi, TCMB faiz kararları (konut kredisine etkisiyle).
2. **Konut kredisi:** bankaların konut kredisi faiz değişiklikleri, kamu destekli kampanyalar (ör. ilk ev kredisi), BDDK düzenlemeleri.
3. **Mevzuat:** kira hukuku, tapu harcı, emlak vergisi, değerli konut vergisi, kentsel dönüşüm yasası, emlakçı komisyonu düzenlemeleri.
4. **İstanbul ilçe gelişmeleri (yatırımcı gözüyle):** yeni metro/raylı sistem hatları ve açılış tarihleri, kentsel dönüşüm projeleri, imar planı değişiklikleri, büyük kamu projeleri (hastane, kampüs, park, sahil düzenlemesi), TOKİ/KİPTAŞ projeleri. Öncelik Anadolu yakası ilçeleri (sitede rehber sayfası olanlar), ama Avrupa yakası haberleri de yazılabilir.
5. **Piyasa:** büyük konut projeleri, yabancıya satış verileri, deprem ve yapı güvenliğiyle ilgili kamu açıklamaları.

Yazılmayacaklar: tek bir firmanın tanıtım/reklam bülteni ("X projesinde %20 indirim"), ünlülerin ev alım/satımı, magazin, doğrulanamayan "kulis" haberleri, köşe yazısı/yorum özetleri, siyasi polemik.

## Kaynak

- Önce birincil kaynak: TÜİK bülteni, TCMB basın duyurusu/EVDS, Resmî Gazete, ilgili bakanlık, İBB / ilçe belediyesi / Metro İstanbul duyurusu, bankanın kendi sayfası.
- Birincil kaynak yoksa en az iki güvenilir haber sitesinde aynı bilginin geçmesi gerekir.
- Habere kaynak olacak sayfayı mutlaka açıp oku; arama sonucu özetiyle haber yazma.
- Doğrulayamadığın rakamı yazma. Emin olmadığın haberi ekleme.

## Haber değeri ve tekrar

- Son 24 saat içinde yayınlanmış/duyurulmuş gelişmeler. Pazartesi günü hafta sonunu da tara.
- Günde **en fazla 3** haber. Yeni bir şey yoksa haber yazma; zorlama.
- `content/haberler/` altındaki son 30 günlük dosyaları oku. Aynı olayı (aynı veri açıklaması, aynı proje duyurusu) tekrar yazma. Önemli yeni bir gelişme varsa (ör. açılış tarihi kesinleşti) yeni haber yazılabilir ama başlık ve içerik yeni bilgiyi öne çıkarmalı.

## Yazım

- Özgün Türkçe. Kaynağın cümlelerini kopyalama veya yakın parafraz yapma; bilgiyi kendi cümlelerinle anlat. Kaynaktan doğrudan alıntı gerekiyorsa en fazla bir tane ve 15 kelimeden kısa olsun.
- Sade, sakin, bilgi veren ton. Ünlem, "şok", "flaş", "müjde", "dev" gibi tık tuzağı kelimeler yok.
- Okura "sen" diye hitap edilir (sitenin geri kalanıyla aynı).
- Uzunluk: 180–400 kelime. İlk paragraf haberin özü (ne oldu, rakam, tarih).
- En az bir `## ` ara başlık. Okur için "bu ne anlama geliyor?" bölümü ekle (ör. 20.000 TL kira için örnek hesap, 2 milyon TL kredinin taksitine etkisi).
- Uygun yerde sitedeki araçlardan birine link ver:
  - `/araclar/amortisman-hesaplama/`
  - `/araclar/ilan-firsat-mi/`
  - `/araclar/kira-artis-hesaplama/`
  - `/araclar/konut-kredisi-hesaplama/`
  - `/araclar/kredi-mi-kira-mi/`
  - İlçe haberinde ilgili ilçe rehberi: `/istanbul/<ilce-slug>/`
- Sayılar Türkçe biçimde: 1.250.000 TL, %31,23, 2,89.
- Yatırım tavsiyesi verme ("şimdi alın", "kaçırmayın" yok). Ne olduğunu ve okur için ne anlama geldiğini anlat.

## SEO

- `baslik`: 50–75 karakter, ana anahtar kelime başta (ör. "Aralık 2026 kira artış oranı %30,9 oldu", "Ümraniye'ye yeni metro: ... hattı için tarih verildi").
- `ozet`: 120–160 karakter, meta açıklama olarak da kullanılır; haberin özünü rakamla söyler.
- Slug: Türkçe karakterler sadeleştirilmiş, küçük harf, tire ile, en fazla 8 kelime (ör. `aralik-2026-kira-artis-orani`).

## Dosya biçimi

Yeni haber = yeni dosya: `content/haberler/YYYY-MM-DD-<slug>.md` (tarih: haberin yayın günü, İstanbul saatiyle).

```
---
baslik: Başlık
ozet: Bir iki cümlelik özet.
tarih: 2026-11-05
kategori: Kira
ilceler: istanbul
kaynak: TÜİK Tüketici Fiyat Endeksi, Ekim 2026
---
İlk paragraf...

## Ara başlık

Metin. [Link metni](/araclar/kira-artis-hesaplama/) ve **kalın** kullanılabilir.

- Liste maddesi
```

- `kategori` şu değerlerden biri: `Kira`, `Konut fiyatları`, `Kredi`, `Mevzuat`, `Ulaşım`, `Kentsel dönüşüm`, `Projeler`, `Piyasa`.
- `ilceler`: virgülle ayrılmış ilçe slug'ları. Genel (tüm İstanbul'u ilgilendiren) haberlerde `istanbul`. İlçeye özel haberlerde ilgili ilçe slug'ları; slug listesi `data/ilceler.js` içindedir (adalar, atasehir, beykoz, cekmekoy, kadikoy, kartal, maltepe, pendik, sancaktepe, sultanbeyli, sile, tuzla, umraniye, uskudar). Listede olmayan bir ilçe (ör. Avrupa yakası) için `istanbul` yaz.
- `kaynak`: kaynağın adı; birincil kaynak linki varsa markdown link olarak: `[TÜİK TÜFE Ekim 2026](https://data.tuik.gov.tr/...)`.
- Gövdede yalnızca: paragraf, `## ` / `### ` başlık, `- ` liste, `**kalın**`, `[link](url)`. HTML yazma.

## Kira artış oranı tablosu (her ay)

TÜİK her ayın 3'ünde (hafta sonu/tatile denk gelirse sonraki iş günü) enflasyonu açıklar. O gün veya sonrasında, yeni ayın oranı `data/kira-oranlari.js` listesinde yoksa:

1. TÜİK bülteninden "12 aylık ortalamalara göre" TÜFE değişimini doğrula (en az iki kaynak veya TÜİK'in kendisi).
2. Listenin **en başına** ekle: `{ ay: '<Ay> <Yıl>', oran: <sayı>, aciklama: '<açıklama günü>' },` — ay, oranın uygulanacağı aydır (ör. 3 Aralık'ta açıklanan oran "Aralık 2026").
3. Aynı gün bununla ilgili bir haber yaz (kategori `Kira`, ilceler `istanbul`), örnek hesaplarla.
4. `site.config.js` içindeki `updated` alanını bugünün tarihiyle güncelle (ör. `'3 Aralık 2026'`).

## Konut kredisi faizi varsayılanı

Bankaların konut kredisi faizlerinde belirgin ve genel bir değişiklik haberi yazdıysan, `site.config.js` içindeki `defaults.konutKredisiAylikFaiz` değerini piyasanın yeni tipik oranına (ör. 2,89) güncelle ve haberde bu oranı kullan.

## Teknik adımlar

1. `node build.js` çalıştır; hata vermeden bitmeli ("Tamam: N sayfa").
2. Değişiklik varsa hepsini `main` dalına TEK commit ile ekle ve push et. Commit mesajı: `Haberler: N yeni` (oran güncellemesi varsa `+ kira oranı <Ay Yıl>`).
3. Netlify push sonrası siteyi otomatik derler; ayrıca deploy yapma.
4. Yeni haber ve oran güncellemesi yoksa hiçbir değişiklik yapma, commit atma.

## Rapor

- Değişiklik yoksa yalnızca: "Yeni haber yok."
- Varsa kısa özet: yayınlanan her haberin başlığı, kategorisi, ilgili ilçeleri ve canlı linki (`site.config.js` içindeki `domain` + `/haberler/<slug>/`), varsa kira oranı veya faiz varsayılanı güncellemesi.
