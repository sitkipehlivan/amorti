// İstanbul Anadolu yakası ilçeleri. Her ilçe için bir sayfa üretilir: /istanbul/<slug>/
// ortalama alanları "kiranı paylaş" verisi ve editör girişleriyle doldurulacak (şimdilik boş).
module.exports = [
  {
    slug: 'adalar', ad: 'Adalar', yaka: 'Anadolu',
    ozet: 'Büyükada, Heybeliada, Burgazada ve Kınalıada\'dan oluşan, motorlu araç trafiğinin olmadığı ilçe. Konut stoku büyük ölçüde müstakil ve tarihi yapılardan oluşuyor; talep yaz aylarında belirgin şekilde artıyor.',
    mahalleler: ['Büyükada', 'Heybeliada', 'Burgazada', 'Kınalıada'],
    ulasim: ['Şehir Hatları vapurları', 'Bostancı ve Kabataş\'tan deniz motorları'],
    notlar: [
      'Kiralama talebi mevsimsel; yıllık kira yerine yazlık kiralama düşünülüyorsa boş kalma süresini yüksek tut.',
      'Tarihi ve tescilli yapılarda tadilat izin süreçleri uzun olabilir, bakım maliyeti genelde şehir ortalamasının üstünde.',
    ],
  },
  {
    slug: 'atasehir', ad: 'Ataşehir', yaka: 'Anadolu',
    ozet: 'İstanbul Finans Merkezi\'nin bulunduğu, site ve rezidans yoğunluğu yüksek ilçe. Beyaz yaka kiracı talebi güçlü; yeni projelerle eski mahalleler yan yana duruyor.',
    mahalleler: ['Barbaros', 'Atatürk', 'İçerenköy', 'Küçükbakkalköy', 'Kayışdağı', 'Ferhatpaşa', 'Yenisahra'],
    ulasim: ['M4 Kadıköy–Tavşantepe metrosu (Yenisahra)', 'M8 Bostancı–Parseller metrosu', 'TEM ve D-100 bağlantıları'],
    notlar: [
      'Rezidans ve site dairelerinde aidat yüksek olabilir; kiracı aidatı ödese bile boş kaldığı aylarda aidat ev sahibine kalır.',
      'Finans merkezine yürüme mesafesindeki dairelerde kira talebi daha istikrarlı.',
    ],
  },
  {
    slug: 'beykoz', ad: 'Beykoz', yaka: 'Anadolu',
    ozet: 'Boğaz kıyısı ile orman alanlarını bir arada barındıran, yapılaşmanın görece sınırlı olduğu ilçe. Kıyı mahalleleri ile iç kesimler arasında fiyat farkı büyük.',
    mahalleler: ['Kavacık', 'Anadoluhisarı', 'Kanlıca', 'Paşabahçe', 'Çubuklu', 'Acarlar', 'Riva'],
    ulasim: ['Fatih Sultan Mehmet Köprüsü bağlantısı (Kavacık)', 'Boğaz vapur iskeleleri', 'Raylı sistem bağlantısı yok'],
    notlar: [
      'Boğaziçi öngörünüm ve geri görünüm bölgelerinde imar kısıtları var; tapu ve imar durumunu mutlaka kontrol et.',
      'Raylı sistem olmadığı için araçsız kiracı kitlesi dar.',
    ],
  },
  {
    slug: 'cekmekoy', ad: 'Çekmeköy', yaka: 'Anadolu',
    ozet: 'Ormanla çevrili, son yıllarda site tipi konut projeleriyle büyüyen ilçe. Aileler ve geniş daire arayanlar arasında popüler.',
    mahalleler: ['Taşdelen', 'Alemdağ', 'Mimar Sinan', 'Hamidiye', 'Ömerli', 'Merkez'],
    ulasim: ['M5 Üsküdar–Samandıra metrosu', 'Kuzey Marmara Otoyolu bağlantısı'],
    notlar: [
      'Metro istasyonuna yakınlık kira talebini doğrudan etkiliyor; ilanın istasyona yürüme mesafesini kontrol et.',
    ],
  },
  {
    slug: 'kadikoy', ad: 'Kadıköy', yaka: 'Anadolu',
    ozet: 'Anadolu yakasının en yoğun kira talebi gören ilçelerinden biri. Moda\'dan Bostancı\'ya uzanan sahil şeridi, Bağdat Caddesi çevresi ve kentsel dönüşümle yenilenen bölgeler farklı fiyat seviyelerinde.',
    mahalleler: ['Moda (Caferağa)', 'Fenerbahçe', 'Caddebostan', 'Göztepe', 'Erenköy', 'Suadiye', 'Bostancı', 'Kozyatağı', 'Fikirtepe'],
    ulasim: ['Marmaray', 'M4 Kadıköy–Tavşantepe metrosu', 'Kadıköy ve Bostancı vapur iskeleleri', 'Kadıköy–Moda tramvayı'],
    notlar: [
      'Kentsel dönüşümdeki eski binalarda kira geliri, yıkım ve yeniden yapım süresince kesilir; bina yaşını ve dönüşüm durumunu sor.',
      'Öğrenci ve genç çalışan talebi küçük dairelerde boş kalma süresini kısaltıyor.',
    ],
  },
  {
    slug: 'kartal', ad: 'Kartal', yaka: 'Anadolu',
    ozet: 'Sahil şeridi, eski sanayi alanlarının dönüşümü ve raylı sistem bağlantılarıyla dikkat çeken ilçe. Yakacık ve Soğanlık tarafında yeni projeler yoğun.',
    mahalleler: ['Kordonboyu', 'Yakacık', 'Soğanlık', 'Cevizli', 'Uğur Mumcu', 'Atalar', 'Topselvi'],
    ulasim: ['Marmaray', 'M4 Kadıköy–Tavşantepe metrosu', 'D-100 ve TEM bağlantıları'],
    notlar: [
      'Eski sanayi bölgesindeki dönüşüm projeleri uzun vadede çevre değerini etkileyebilir; proje takvimlerini takip et.',
    ],
  },
  {
    slug: 'maltepe', ad: 'Maltepe', yaka: 'Anadolu',
    ozet: 'Uzun sahil parkı ve raylı sistem erişimiyle orta segment kiracıların tercih ettiği ilçe. Sahile yakın mahallelerle E-5 kuzeyi arasında belirgin fiyat farkı var.',
    mahalleler: ['Bağlarbaşı', 'Altayçeşme', 'Zümrütevler', 'Feyzullah', 'Cevizli', 'Başıbüyük', 'İdealtepe'],
    ulasim: ['Marmaray', 'M4 Kadıköy–Tavşantepe metrosu', 'D-100 bağlantısı'],
    notlar: [
      'Marmaray ve M4 istasyonlarına yakın daireler hem kira hem satışta daha hızlı dönüyor.',
    ],
  },
  {
    slug: 'pendik', ad: 'Pendik', yaka: 'Anadolu',
    ozet: 'Sabiha Gökçen Havalimanı\'na ve hızlı tren garına ev sahipliği yapan, nüfusu hızla artan ilçe. Kurtköy tarafı yeni projelerle büyüyor.',
    mahalleler: ['Kurtköy', 'Kaynarca', 'Güzelyalı', 'Batı', 'Bahçelievler', 'Yenişehir', 'Çamçeşme'],
    ulasim: ['Marmaray', 'M4 metrosu (Tavşantepe)', 'Pendik hızlı tren garı', 'Sabiha Gökçen Havalimanı'],
    notlar: [
      'Havalimanı çevresinde havacılık çalışanlarından gelen kira talebi var; ancak uçuş rotası altındaki gürültüye dikkat et.',
    ],
  },
  {
    slug: 'sancaktepe', ad: 'Sancaktepe', yaka: 'Anadolu',
    ozet: 'Görece uygun fiyatlı konut ve yeni projelerle büyüyen ilçe. Samandıra ve Sarıgazi ilçenin ana yerleşim merkezleri.',
    mahalleler: ['Samandıra', 'Sarıgazi', 'Yenidoğan', 'Eyüp Sultan', 'Atatürk', 'Abdurrahmangazi'],
    ulasim: ['M5 Üsküdar–Samandıra metrosu', 'TEM ve Kuzey Marmara Otoyolu bağlantıları'],
    notlar: [
      'Fiyat seviyesi düşük olduğu için brüt kira getirisi merkez ilçelere göre daha yüksek çıkabilir; boş kalma süresini gerçekçi gir.',
    ],
  },
  {
    slug: 'sultanbeyli', ad: 'Sultanbeyli', yaka: 'Anadolu',
    ozet: 'Anadolu yakasının en uygun fiyatlı ilçelerinden biri. Konut stoku ağırlıkla orta ve küçük ölçekli apartmanlardan oluşuyor.',
    mahalleler: ['Abdurrahmangazi', 'Hasanpaşa', 'Battalgazi', 'Mecidiye', 'Mehmet Akif', 'Fatih'],
    ulasim: ['TEM ve Kuzey Marmara Otoyolu bağlantıları', 'Sabiha Gökçen Havalimanı\'na yakın konum'],
    notlar: [
      'Eski yapı stokunda deprem dayanıklılığı ve iskân durumu en önemli kontrol maddeleri.',
    ],
  },
  {
    slug: 'sile', ad: 'Şile', yaka: 'Anadolu',
    ozet: 'Karadeniz kıyısında, yazlık ve hafta sonu konutlarının ağırlıkta olduğu ilçe. Ağva ve sahil köyleri özellikle yaz aylarında talep görüyor.',
    mahalleler: ['Ağva', 'Çavuş', 'Hacı Kasım', 'Balibey', 'Kumbaba çevresi'],
    ulasim: ['Şile yolu ve Kuzey Marmara Otoyolu bağlantıları', 'Raylı sistem bağlantısı yok'],
    notlar: [
      'Yıllık kiracı bulmak zor olabilir; amortisman hesabında boş kalma süresini birkaç ay olarak gir.',
    ],
  },
  {
    slug: 'tuzla', ad: 'Tuzla', yaka: 'Anadolu',
    ozet: 'Tersaneler, organize sanayi bölgeleri ve üniversitelerle çalışan ve öğrenci kiracı talebi gören sahil ilçesi.',
    mahalleler: ['İçmeler', 'Aydınlı', 'Aydıntepe', 'Postane', 'Şifa', 'Evliya Çelebi', 'Orhanlı'],
    ulasim: ['Marmaray', 'D-100 ve TEM bağlantıları'],
    notlar: [
      'Üniversite çevresindeki küçük dairelerde dönemsel kiracı değişimi olur; eşyalı kiralama getiriyi artırabilir.',
    ],
  },
  {
    slug: 'umraniye', ad: 'Ümraniye', yaka: 'Anadolu',
    ozet: 'İş merkezleri, alışveriş merkezleri ve otoyol bağlantılarıyla Anadolu yakasının iş ve yaşam merkezlerinden biri. Çakmak, Atakent ve Ihlamurkuyu tarafında site yoğunluğu yüksek.',
    mahalleler: ['Atakent', 'Çakmak', 'Ihlamurkuyu', 'Tepeüstü', 'Şerifali', 'Esenşehir', 'Yukarı Dudullu'],
    ulasim: ['M5 Üsküdar–Samandıra metrosu', 'M8 Bostancı–Parseller metrosu (Dudullu)', 'TEM, FSM ve Kuzey Marmara bağlantıları'],
    notlar: [
      'İş merkezlerine yakın mahallelerde beyaz yaka kiracı talebi güçlü; site içi dairelerde aidatı hesaba kat.',
    ],
  },
  {
    slug: 'uskudar', ad: 'Üsküdar', yaka: 'Anadolu',
    ozet: 'Boğaz kıyısındaki tarihi mahalleleri, Altunizade–Acıbadem hattındaki iş merkezleri ve güçlü ulaşım ağıyla Anadolu yakasının merkez ilçelerinden.',
    mahalleler: ['Kuzguncuk', 'Çengelköy', 'Beylerbeyi', 'Acıbadem', 'Altunizade', 'Kısıklı', 'Bulgurlu', 'Ünalan'],
    ulasim: ['Marmaray', 'M5 Üsküdar–Samandıra metrosu', 'Üsküdar vapur iskelesi', 'Boğaz köprülerine yakınlık'],
    notlar: [
      'Boğaz kıyısındaki tarihi yapılarda tescil ve imar kısıtlarını kontrol et.',
      'Marmaray ve M5\'in kesiştiği Üsküdar merkezde kira talebi yıl boyu yüksek.',
    ],
  },
];
