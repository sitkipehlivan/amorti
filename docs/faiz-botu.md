# Amorti banka faiz taraması kuralları

Bu görev hafta içi her gün bankaların **kendi sitelerinde** yayınladığı konut kredisi aylık faiz oranlarını okur ve `data/faizler.json` dosyasını günceller. Sitedeki `/konut-kredisi-faiz-oranlari/` sayfası, anasayfadaki faiz kutusu ve hesaplayıcıların varsayılan faizi bu dosyadan üretilir.

## Neden tarayıcı

Bankaların çoğu oranı sayfaya JavaScript ile yüklüyor; düz sayfa okuma (WebFetch) çoğunlukla boş döner. Bu yüzden oranlar kullanıcının bilgisayarındaki Chrome (Claude in Chrome) ile okunur: sayfayı aç, 4–5 saniye bekle, `javascript_tool` ile metni ve hesaplayıcı alanlarını oku. Chrome araçları yüklenemiyorsa ya da bilgisayara ulaşılamıyorsa hiçbir şey değiştirme ve bunu raporla.

## Kurallar

- Yalnızca bankanın kendi alan adındaki sayfaları kullan. Karşılaştırma sitelerinden, haberlerden veya arama sonuçlarından oran alma.
- Sadece oku: başvuru formu doldurma, giriş yapma, çerez/izin dışında bir şeye tıklama, form gönderme yok.
- Çerez bandı çıkarsa yalnızca zorunlu çerezleri kabul eden / reddeden seçeneği kullan.
- Oran yüzde olarak, aylık, nokta ile ondalık sayı yazılır (`2.89`). Sayfada yıllık maliyet oranı, aylık maliyet oranı veya nakit iade sonrası oran yazıyorsa bunları **faiz oranı yerine kullanma**; "faiz oranı" ya da "sözleşme faizi" olan değeri al.
- Birden fazla oran varsa, tablodaki satır için şu önceliği izle: (1) standart / kampanyalı ana konut kredisi ürünü, (2) hayat sigortalı seçenek, (3) 120 ay vadeye en yakın vade. Okuduğun durumu `kosul` alanına kısaca yaz (ör. `120 ay, hayat sigortalı (sigortasız %3,45)`).
- Mantık kontrolü: oran 1,00 ile 6,00 arasında olmalı. Önceki değere göre 0,50 puandan büyük değişim varsa sayfayı yeniden okuyup doğrula; emin değilsen eski değeri bırak.
- Okuyamadığın bankada `oran`, `kosul`, `kontrol` alanlarına dokunma (son doğrulanan değer kalır). Hiç okunamamış banka `durum: "bekliyor"` olarak kalır.
- Başarıyla okuduğun her bankada `kontrol` alanını bugünün tarihi (YYYY-MM-DD, İstanbul) yap, `durum: "ok"`.
- Dosyadaki `bankalar` listesine yeni banka ekleme veya çıkarma yapma; liste kullanıcının kararıdır.

## Bankalar ve nerede okunur

| Banka | Sayfa | Nereden okunur |
|---|---|---|
| ING | https://www.ing.com.tr/tr/sizin-icin/krediler/avantajli-konut-kredisi-kampanyasi | Örnek ödeme tablosunda "Sözleşme Faizi (%)" satırı, **Eşit Taksit Ödemeli** sütunu |
| Yapı Kredi | https://www.yapikredi.com.tr/kredi/konut-kredisi/ | Taksit tablosunda "Faiz Oranı" sütunu; 120 ay satırı (36 ay farklıysa koşula yaz) |
| Ziraat Bankası | https://www.ziraatbank.com.tr/tr/bireysel/krediler/konut-gayrimenkul/konut-kredisi | Hesaplama aracındaki `#faiz-orani` alanının değeri |
| Halkbank | https://www.halkbank.com.tr/tr/bireysel/krediler/konut-kredileri/hesapli-evim-konut | "Örnek Maliyet Tablosu"ndaki "Aylık Faiz Oranı (%)" (120 ay satırı) |
| QNB | https://www.qnb.com.tr/standart-konut-kredisi | Hesaplama aracının altındaki "Aylık Faiz Oranı" |
| İş Bankası | https://www.isbank.com.tr/konut-kredisi | "Güncel Konut Kredisi Faizleri" tablosunda "Ev Kredisi Kampanyası – Hayat Sigortalı" satırı |
| Garanti BBVA | https://webforms.garantibbva.com.tr/mortgage/mortgage-calculator/white?lang=tr | Hesaplama aracındaki "FAİZ ORANI" (varsayılan tutar ve vadeyi koşula yaz) |
| Akbank | https://www.akbank.com/krediler/konut-kredisi-hesaplama | Hesaplama aracındaki "Hayat Sigortalı Faiz Oranı" (varsayılan vadeyi koşula yaz) |

Bir sayfanın yapısı değişmişse, aynı bankanın sitesinde konut kredisi hesaplama sayfasını bulup oradan oku ve `url` alanını yeni sayfayla güncelle. Tarayıcı bir alan adına "izin verilmiyor" diyorsa o bankayı atla ve raporla.

## Teknik adımlar

1. Depoyu klonla, `npm ci` ve `node build.js` ile derlemenin geçtiğini kontrol et.
2. Bankaları tara, `data/faizler.json` dosyasını güncelle (JSON biçimini koru).
3. `node build.js` tekrar çalıştır; hata vermemeli.
4. Değişiklik varsa `main` dalına TEK commit: `Faizler: <tarih> (N banka güncellendi)`. Değişiklik yoksa commit atma.

## Rapor

Kısa tablo: banka, eski oran → yeni oran, okunamayanlar ve nedeni (izin yok, sayfa değişti, oran bulunamadı). Hiçbir oran değişmediyse: "Faizler değişmedi (N banka kontrol edildi)."
