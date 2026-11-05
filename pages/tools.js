// Araç sayfalarının içerikleri. build.js bunları sayfaya dönüştürür.
const cfg = require('../site.config');
const oranlar = require('../data/kira-oranlari');
const enf = require('../data/enflasyon');
const faiz = require('../data/faizler');
const virg = (n) => String(n).replace('.', ',');
const tr1 = (n) => n.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const tr2 = (n) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function field(name, label, o = {}) {
  const unit = o.unit ? `<span class="unit">${o.unit}</span>` : '';
  const money = o.money ? ' data-money' : '';
  return `<div class="field${o.full ? ' full' : ''}">
  <label for="${o.id || name}">${label}</label>
  <div class="input"><input id="${o.id || name}" name="${name}" type="text" inputmode="decimal" autocomplete="off"${money} value="${o.value ?? ''}" placeholder="${o.placeholder ?? ''}"${o.unit ? ' class="has-unit"' : ''}>${unit}</div>
  ${o.hint ? `<span class="hint">${o.hint}</span>` : ''}
</div>`;
}

// Banka oranı düğmeleri: tıklayınca faiz alanını doldurur ve hesabı yeniler (app.js).
function bankaSec({ hedef = '', limit = 0, etiket = 'Bankanın oranıyla hesapla' } = {}) {
  const list = limit ? faiz.olan.slice(0, limit) : faiz.olan;
  const h = hedef ? ` data-hedef="${hedef}"` : '';
  return `<div class="bank-pick"><span class="bank-pick-label">${etiket}</span><div class="bank-chips">${list.map((b) => `<button type="button" class="bank-chip" data-oran="${b.oran}" data-banka="${b.banka}"${h}><span>${b.banka}</span><b>%${tr2(b.oran)}</b></button>`).join('')}</div></div>`;
}

const stat = (key, label) => `<div class="stat"><b data-out="${key}">–</b><span>${label}</span></div>`;

// ---------- Amortisman formu (anasayfa ve ilçe sayfalarında da kullanılır) ----------
function amortismanForm({ fiyat = '6.500.000', kira = '30.000', heading = true, idPrefix = 'a' } = {}) {
  const id = (n) => `${idPrefix}-${n}`;
  return `<form class="calc" data-tool="amortisman" novalidate>
  ${heading ? '<h2>Kaç yılda amorti eder?</h2><p class="muted small">Satış fiyatını ve alabileceğin kirayı yaz, sonuç anında hesaplansın.</p>' : ''}
  <div class="fields">
    ${field('fiyat', 'Satış fiyatı', { id: id('fiyat'), unit: 'TL', money: true, value: fiyat })}
    ${field('kira', 'Aylık kira', { id: id('kira'), unit: 'TL', money: true, value: kira, hint: 'Aynı bölgede benzer dairelerin kira ilanlarına bak.' })}
  </div>
  <details class="more-opts">
    <summary>Giderleri ve senaryoyu ayarla</summary>
    <div class="fields">
      ${field('masraf', 'Alım masrafları', { id: id('masraf'), unit: '%', value: '4,4', hint: 'Tapu harcı %2 + emlakçı komisyonu %2 + KDV' })}
      ${field('bos', 'Yılda boş kalma', { id: id('bos'), unit: 'ay', value: '0,5', hint: 'Kiracı değişiminde boş geçen süre' })}
      ${field('bakim', 'Bakım ve onarım', { id: id('bakim'), unit: '%', value: '5', hint: 'Yıllık kiranın yüzdesi' })}
      ${field('gider', 'Ev sahibinin aylık gideri', { id: id('gider'), unit: 'TL', money: true, value: '0', hint: 'Aidatı sen ödüyorsan buraya yaz' })}
      ${field('fark', 'Kira enflasyonun ne kadar üstünde artar?', { id: id('fark'), unit: 'puan', value: '0', full: true, hint: `0 = kira, beklenen enflasyonla aynı hızda artar (önümüzdeki 12 ay %${tr1(enf.yol[0])}, sonra kademeli olarak %${tr1(enf.medyan)}). Eksi değer de girilebilir.` })}
    </div>
  </details>
  <div class="result" aria-live="polite" hidden>
    <div class="result-head"><div class="big" data-out="yil">–</div><span data-out="verdict" class="verdict"></span></div>
    <div class="years" aria-hidden="true"></div>
    <div class="years-caption" data-out="yilcap"></div>
    <div class="stats">
      ${stat('brut', 'Brüt amortisman (masrafsız)')}
      ${stat('getiri', 'Brüt yıllık kira getirisi')}
      ${stat('yillik', 'Yıllık net kira')}
      ${stat('nomyil', 'Beklenen enflasyonla TL bazında geri dönüş')}
    </div>
    <p class="note">Net süre; alım masrafları, boş kalma ve bakım giderleri düşülerek hesaplanır. Kira geliri vergisi ve evin değer değişimi dahil değildir. Ana sonuç bugünün parasıyladır. TL bazındaki süre, kiranın TCMB ve piyasa beklentilerine göre artacağını varsayar; o yıllarda paranın alım gücü daha düşük olacağı için kısa görünür.</p>
  </div>
</form>`;
}

function ilanForm() {
  const satisRows = [1, 2, 3, 4, 5].map((i) => `<tr data-comp="satis"><td><div class="input"><input name="s${i}fiyat" aria-label="${i}. ilan fiyatı" inputmode="decimal" data-money placeholder="${i <= 3 ? 'ör. 6.200.000' : ''}"></div></td><td><div class="input"><input name="s${i}m2" aria-label="${i}. ilan m²" inputmode="decimal" placeholder="${i <= 3 ? 'ör. 105' : ''}"></div></td></tr>`).join('');
  const kiraRows = [1, 2, 3].map((i) => `<tr data-comp="kira"><td><div class="input"><input name="k${i}kira" aria-label="${i}. kira ilanı" inputmode="decimal" data-money placeholder="${i === 1 ? 'ör. 28.000' : ''}"></div></td><td><div class="input"><input name="k${i}m2" aria-label="${i}. kira ilanı m²" inputmode="decimal" placeholder="${i === 1 ? 'ör. 100' : ''}"></div></td></tr>`).join('');
  return `<form class="calc" data-tool="ilan" novalidate>
  <h2>Baktığın ilan</h2>
  <div class="fields">
    ${field('fiyat', 'İlan fiyatı', { id: 'i-fiyat', unit: 'TL', money: true, placeholder: 'ör. 5.400.000' })}
    ${field('m2', 'Net m²', { id: 'i-m2', unit: 'm²', placeholder: 'ör. 100' })}
  </div>
  <h3 style="margin-top:20px">Aynı bölgedeki benzer satılık ilanlar</h3>
  <p class="muted small">Aynı mahallede, benzer yaş ve büyüklükteki en az 3 ilanı yaz.</p>
  <table class="comps"><thead><tr><th>Fiyat (TL)</th><th>Net m²</th></tr></thead><tbody>${satisRows}</tbody></table>
  <details class="more-opts">
    <summary>Kira ilanlarıyla amortismanı da hesapla</summary>
    <table class="comps"><thead><tr><th>Aylık kira (TL)</th><th>Net m²</th></tr></thead><tbody>${kiraRows}</tbody></table>
  </details>
  <div class="result" aria-live="polite" hidden>
    <div class="result-head"><div class="big" data-out="fark">–</div><span data-out="verdict" class="verdict"></span></div>
    <p class="muted small">Benzer ilanların ortalama m² fiyatına göre fark</p>
    <p data-out="aciklama"></p>
    <div class="stats">
      ${stat('ilanm2', 'Bu ilanın m² fiyatı')}
      ${stat('medm2', 'Benzerlerin ortanca m² fiyatı')}
      ${stat('kira', 'Tahmini aylık kira')}
      ${stat('amorti', 'Brüt amortisman')}
    </div>
  </div>
</form>`;
}

function kiraArtisForm() {
  const opts = oranlar.map((o, i) => `<option value="${o.oran}"${i === 0 ? ' selected' : ''}>${o.ay} (%${tr2(o.oran)})</option>`).join('');
  return `<form class="calc" data-tool="kira-artis" novalidate>
  <div class="fields">
    ${field('kira', 'Mevcut aylık kira', { id: 'ka-kira', unit: 'TL', money: true, value: '25.000' })}
    <div class="field"><label for="ka-ay">Sözleşmenin yenilendiği ay</label><div class="input"><select id="ka-ay" name="ay">${opts}</select></div></div>
  </div>
  <div class="result" aria-live="polite" hidden>
    <p class="muted small" style="margin:0 0 4px"><span data-out="ay"></span> için en fazla</p>
    <div class="result-head"><div class="big" data-out="yeni">–</div></div>
    <div class="stats">
      ${stat('artis', 'Aylık artış tutarı')}
      ${stat('oran', 'Yasal üst sınır')}
      ${stat('yillik', 'Yıllık ek ödeme')}
    </div>
    <p class="note">Taraflar bu oranın altında bir artışta anlaşabilir. Beş yılı dolduran sözleşmelerde kira bedeli hâkim tarafından emsal kiralara göre yeniden belirlenebilir.</p>
  </div>
</form>`;
}

function krediForm() {
  return `<form class="calc" data-tool="kredi" novalidate>
  <div class="fields">
    ${field('tutar', 'Kredi tutarı', { id: 'k-tutar', unit: 'TL', money: true, value: '2.000.000', full: true })}
    ${field('vade', 'Vade', { id: 'k-vade', unit: 'ay', value: '120' })}
    ${field('faiz', 'Aylık faiz oranı', { id: 'k-faiz', unit: '%', value: virg(faiz.tipik), hint: 'Varsayılan: bankaların ortanca oranı. Aşağıdan bir banka seç ya da kendi teklifini yaz.' })}
    <div class="field full">${bankaSec()}</div>
    <div class="field full"><label style="font-weight:400"><input type="checkbox" name="bsmv"> Üzerime kayıtlı başka bir konut var (faize %15 BSMV eklenir)</label></div>
  </div>
  <div class="result" aria-live="polite" hidden>
    <div class="result-head"><div class="big" data-out="taksit">–</div></div>
    <div class="stats">
      ${stat('toplam', 'Toplam geri ödeme')}
      ${stat('faizTop', 'Toplam faiz')}
      ${stat('oranx', 'Çekilen tutarın katı')}
      ${stat('gelir', 'Önerilen en az aylık gelir')}
    </div>
    <p class="note">İlk konutunu alanlar için konut kredisinde BSMV ve KKDF uygulanmaz; halihazırda konutu olanlarda faize %15 BSMV eklenir. Dosya masrafı, ekspertiz ve sigorta ücretleri dahil değildir. Gelir tahmini, taksitin net gelirin yarısını aşmaması varsayımıyla yaklaşık hesaplanır; her bankanın kendi kriteri vardır.</p>
  </div>
</form>`;
}

function krediKiraForm() {
  return `<form class="calc" data-tool="kredi-kira" novalidate>
  <div class="fields">
    ${field('fiyat', 'Ev fiyatı', { id: 'kk-fiyat', unit: 'TL', money: true, value: '5.000.000' })}
    ${field('pesinat', 'Peşinat', { id: 'kk-pesinat', unit: 'TL', money: true, value: '2.000.000' })}
    ${field('vade', 'Vade', { id: 'kk-vade', unit: 'ay', value: '120' })}
    ${field('faiz', 'Aylık faiz', { id: 'kk-faiz', unit: '%', value: virg(faiz.tipik), hint: 'Varsayılan: bankaların ortanca oranı.' })}
    <div class="field full">${bankaSec()}</div>
    ${field('kira', 'Aynı ev için aylık kira', { id: 'kk-kira', unit: 'TL', money: true, value: '27.000' })}
    ${field('fark', 'Kira enflasyonun ne kadar üstünde artar?', { id: 'kk-fark', unit: 'puan', value: '0', hint: 'Kira, beklenen enflasyonla artar. 0 = aynı hız.' })}
  </div>
  <div class="result" aria-live="polite" hidden>
    <div class="result-head"><div class="big" data-out="kesisme">–</div><span data-out="verdict" class="verdict"></span></div>
    <p class="muted small">Kiranın kredi taksitini geçtiği yıl</p>
    <div class="years" aria-hidden="true"></div>
    <div class="years-caption" data-out="yilcap"></div>
    <div class="stats">
      ${stat('taksit', 'Aylık kredi taksiti (sabit)')}
      ${stat('fark', 'İlk ay taksit ile kira farkı')}
      ${stat('topkira', 'Vade boyunca ödenecek toplam kira')}
      ${stat('topkredi', 'Toplam kredi ödemesi + peşinat')}
    </div>
    <p class="note">Taksit sabit kalırken kira her yıl artar. Hesaba peşinatın faize yatırılması halinde getireceği kazanç ve evin değer artışı dahil değildir; karar vermeden önce bu ikisini de düşün.</p>
  </div>
</form>`;
}

const icons = {
  hourglass: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12M6 22h12M7 2c0 5 10 7 10 10s-10 5-10 10M17 2c0 5-10 7-10 10s10 5 10 10"/></svg>',
  search: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  up: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
  bank: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/></svg>',
  scale: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8"/></svg>',
};

const tools = [
  {
    slug: 'amortisman-hesaplama',
    icon: icons.hourglass,
    menu: 'Amortisman hesaplama',
    kisa: 'Bir evin kendini kaç yılda ödeyeceğini giderlerle birlikte hesapla.',
    title: 'Amortisman Hesaplama: Ev Kaç Yılda Kendini Öder?',
    h1: 'Amortisman hesaplama',
    lede: 'Satış fiyatını ve alabileceğin kirayı gir. Alım masrafları, boş kalma ve bakım dahil net amortisman süresini gör.',
    form: () => amortismanForm({ heading: false }),
    content: `<h2>Amortisman süresi nedir?</h2>
<p>Konutta amortisman süresi, evin satış fiyatının kira geliriyle kaç yılda geri döneceğini gösterir. En basit hali, fiyatın yıllık kiraya bölünmesidir: 6.000.000 TL'lik bir ev aylık 25.000 TL kira getiriyorsa yıllık kira 300.000 TL, brüt amortisman süresi 20 yıl olur.</p>
<p>Gerçek hayatta bu süre biraz daha uzundur. Ev alırken tapu harcı ve emlakçı komisyonu ödersin, kiracı değişirken ev birkaç hafta boş kalabilir, bakım ve onarım masrafları çıkar. Bu araç bunları da hesaba katarak net süreyi gösterir.</p>
<h2>Kaç yıl iyi sayılır?</h2>
<p>Kesin bir doğru yok ama yatırımcılar genelde süreyi bölgedeki diğer evlerle karşılaştırır. Aynı ilçede benzer bir ev 22 yılda amorti ederken baktığın ev 17 yılda ediyorsa, ya fiyatı uygundur ya da kira potansiyeli yüksektir. Bu yüzden tek bir sayıya değil, karşılaştırmaya bak.</p>
<h2>Kira artışını nasıl tahmin ediyoruz?</h2>
<p>Kiralar yasa gereği TÜFE'nin 12 aylık ortalamasına göre arttığı için, gelecekteki kira artışını enflasyon beklentisine bağladık. Varsayım şöyle kuruluyor:</p>
<ul>
<li><strong>1. yıl: %${tr1(enf.yol[0])}</strong> — ${enf.beklenti.kaynak}, 12 ay sonrası TÜFE beklentisi</li>
<li><strong>2. yıl: %${tr1(enf.yol[1])}</strong> — aynı ankette 24 ay sonrası beklentisi</li>
<li><strong>3–6. yıl:</strong> kademeli olarak uzun vadeli seviyeye iner (${enf.yol.slice(2, 6).map((v) => '%' + tr1(v)).join(', ')})</li>
<li><strong>Sonraki yıllar: %${tr1(enf.medyan)}</strong> — 2000–2025 arasında gerçekleşen yıl sonu enflasyonun medyanı</li>
</ul>
<p>Uzun vadeli seviye için TCMB'nin %5 hedefi yerine Türkiye'nin 2000'den bu yana yaşadığı tipik enflasyonu kullandık; TCMB'nin 2028 tahmini %${enf.beklenti.tcmb[2028]}. Aynı dönemin yıllık bileşik ortalaması ise %${tr1(enf.geoOrt)}; 2001, 2022 ve 2023 gibi yüksek yıllar bu ortalamayı yukarı çekiyor. Beklentiler her ay güncellenir.</p>
<div class="table-wrap"><table class="data"><thead><tr><th>Yıl</th><th>Yıl sonu TÜFE</th><th>Yıl</th><th>Yıl sonu TÜFE</th></tr></thead><tbody>
${(() => { const ys = Object.keys(enf.gecmis); const half = Math.ceil(ys.length / 2); const rows = []; for (let i = 0; i < half; i++) { const a = ys[i], b = ys[i + half]; rows.push(`<tr><td>${a}</td><td>%${tr2(enf.gecmis[a])}</td><td>${b || ''}</td><td>${b ? '%' + tr2(enf.gecmis[b]) : ''}</td></tr>`); } return rows.join(''); })()}
</tbody></table></div>
<p class="muted small">Kaynak: TÜİK yıl sonu TÜFE (2003'e kadar 1994 bazlı TÜFE), ${enf.beklenti.kaynak}, ${enf.beklenti.tcmb.kaynak}.</p>
<p>Ana sonuç <strong>bugünün parasıyla</strong> gösterilir: kira enflasyonla aynı hızda artarsa evin kendini ödeme süresi, enflasyon hiç yokmuş gibi hesaplanan süreyle aynıdır. Kiranın enflasyondan hızlı ya da yavaş artacağını düşünüyorsan farkı puan olarak girebilirsin. <strong>TL bazındaki süre</strong> ise kira gelirlerinin nominal toplamının alış maliyetini kaçıncı yılda geçtiğini gösterir.</p>`,
    faq: [
      ['Amortisman hesabına kira geliri vergisi dahil mi?', 'Hayır. Kira geliri vergisi kişinin toplam gelirine ve istisna tutarına göre değiştiği için hesaba katılmadı.'],
      ['Aidatı kim öder?', 'Kiralık dairelerde aidatı genelde kiracı öder. Sen ödüyorsan veya ev boş kaldığında ödemek zorunda kalacaksan "Ev sahibinin aylık gideri" alanına yaz.'],
      ['Alım masrafları neden %4,4?', 'Alıcı payına düşen tapu harcı satış bedelinin %2\'sidir. Emlakçı komisyonu çoğunlukla %2 + KDV alınır. Komisyonsuz alıyorsan bu oranı %2\'ye düşür.'],
    ],
  },
  {
    slug: 'ilan-firsat-mi',
    icon: icons.search,
    menu: 'Bu ilan fırsat mı?',
    kisa: 'Baktığın ilanı aynı bölgedeki benzerleriyle karşılaştır.',
    title: 'Bu İlan Fırsat mı? Ev İlanı Fiyat Karşılaştırma',
    h1: 'Bu ilan fırsat mı?',
    lede: 'Baktığın ilanın fiyatını ve m²\'sini, aynı bölgedeki birkaç benzer ilanla birlikte gir. İlanın piyasanın neresinde durduğunu ve tahmini amortisman süresini gör.',
    form: ilanForm,
    content: `<h2>Nasıl kullanılır?</h2>
<p>Bir ilanın ucuz mu pahalı mı olduğunu anlamanın en güvenilir yolu, aynı mahalledeki benzer evlerle metrekare fiyatını karşılaştırmaktır. İlan sitelerinde aynı mahalle, benzer bina yaşı ve oda sayısıyla filtreleme yap, bulduğun ilanların fiyatını ve net m²'sini buraya yaz.</p>
<p>Araç, benzer ilanların ortanca m² fiyatını bulur ve baktığın ilanla farkı hesaplar. Ortanca kullanıldığı için tek bir aşırı pahalı veya ucuz ilan sonucu bozmaz.</p>
<h2>Fiyat çok düşükse önce bunları kontrol et</h2>
<ul class="check">
  <li>Tapu kat mülkiyetli mi, yoksa kat irtifaklı veya hisseli mi?</li>
  <li>Binanın iskânı var mı? Krediye uygun mu?</li>
  <li>Ev kiracılı mı satılıyor? Kiracının sözleşme süresi ve kira bedeli ne?</li>
  <li>Bina kentsel dönüşüm kapsamında mı, riskli yapı tespiti yapıldı mı?</li>
  <li>İlandaki m² brüt mü net mi? Karşılaştırmada hep aynı türü kullan.</li>
  <li>Aynı ev başka ilanlarda farklı fiyatla mı yayında?</li>
</ul>`,
    faq: [
      ['Kaç benzer ilan girmeliyim?', 'En az 3, mümkünse 5. Benzerler ne kadar yakın mahalleden ve benzer yaştaysa sonuç o kadar anlamlı olur.'],
      ['Net m² mi brüt m² mi kullanmalıyım?', 'İkisi de olur ama tüm ilanlarda aynısını kullanmalısın. Net m² genelde daha karşılaştırılabilir sonuç verir.'],
      ['Tahmini kira nasıl hesaplanıyor?', 'Girdiğin kiralık ilanların ortanca m² kirası, baktığın evin m²\'siyle çarpılır.'],
    ],
  },
  {
    slug: 'kira-artis-hesaplama',
    icon: icons.up,
    menu: 'Kira artış hesaplama',
    kisa: `Güncel yasal tavan %${tr2(oranlar[0].oran)}. Yeni kiranı hesapla.`,
    title: `Kira Artış Hesaplama ${oranlar[0].ay}: Yasal Tavan %${tr2(oranlar[0].oran)}`,
    h1: 'Kira artış hesaplama',
    lede: `${oranlar[0].ay}'da yenilenen kira sözleşmeleri için yasal üst sınır %${tr2(oranlar[0].oran)}. Mevcut kiranı ve yenileme ayını seç, yeni kiranı gör.`,
    form: kiraArtisForm,
    content: `<h2>Kira artış oranları</h2>
<p>Konut ve çatılı iş yeri kiralarında yenileme döneminde yapılabilecek en yüksek artış, TÜİK'in açıkladığı TÜFE'nin 12 aylık ortalamalara göre değişim oranıdır. Oran her ayın başında, bir önceki ayın enflasyon verisiyle birlikte açıklanır.</p>
<div class="table-wrap"><table class="data"><thead><tr><th>Sözleşmenin yenilendiği ay</th><th>Yasal üst sınır</th></tr></thead><tbody>
${oranlar.map((o, i) => `<tr${i === 0 ? ' class="current"' : ''}><td>${o.ay}</td><td>%${tr2(o.oran)}</td></tr>`).join('')}
</tbody></table></div>
<p class="muted small">Kaynak: TÜİK Tüketici Fiyat Endeksi bültenleri.</p>
<h2>Hesaplama nasıl yapılır?</h2>
<p>Mevcut kira, oranın 100'e bölünüp 1 eklenmesiyle bulunan katsayıyla çarpılır. ${oranlar[0].ay} için 20.000 TL kira en fazla ${Math.round(20000 * (1 + oranlar[0].oran / 100)).toLocaleString('tr-TR')} TL olur.</p>`,
    faq: [
      ['Yıllık enflasyon mu, 12 aylık ortalama mı?', 'Kira artışında yıllık enflasyon değil, TÜFE\'nin 12 aylık ortalamalara göre değişim oranı esas alınır. TÜİK bültenlerinde ayrı bir satır olarak yer alır.'],
      ['%25 sınırı hâlâ geçerli mi?', 'Hayır. Konut kiralarına bir dönem uygulanan geçici %25 sınırı sona erdi; artış tavanı yeniden TÜFE\'nin 12 aylık ortalamasına göre belirleniyor.'],
      ['Ev sahibi daha fazla zam isteyebilir mi?', 'Yenileme döneminde yasal tavanın üzerinde artış yapılamaz. Beş yılı dolduran sözleşmelerde ise kira bedeli dava yoluyla emsal kiralara göre yeniden belirlenebilir.'],
    ],
  },
  {
    slug: 'konut-kredisi-hesaplama',
    icon: icons.bank,
    menu: 'Konut kredisi hesaplama',
    kisa: 'Aylık taksiti, toplam geri ödemeyi ve faiz yükünü gör.',
    title: 'Konut Kredisi Hesaplama: Aylık Taksit ve Toplam Geri Ödeme',
    h1: 'Konut kredisi hesaplama',
    lede: 'Kredi tutarını, vadeyi ve aylık faiz oranını gir. Taksiti, toplam geri ödemeyi ve önerilen gelir seviyesini gör.',
    form: krediForm,
    content: `<h2>Taksit nasıl hesaplanır?</h2>
<p>Konut kredilerinde taksit, eşit taksitli kredi formülüyle hesaplanır ve vade boyunca sabit kalır. İlk yıllarda taksitin büyük bölümü faize, son yıllarda anaparaya gider.</p>
<p>İlk konutunu alanların konut kredisi BSMV ve KKDF'den muaftır; halihazırda üzerine kayıtlı konutu olanların kredisinde ise bankalar faize %15 BSMV ekliyor. Bu durumdaysan hesaplayıcıdaki kutuyu işaretle. Kalan farklar genelde dosya masrafı, ekspertiz ücreti ve zorunlu sigortalardan gelir.</p>
<p>Bankaların güncel oranlarını <a href="/konut-kredisi-faiz-oranlari/">konut kredisi faiz oranları</a> sayfasında karşılaştırabilirsin.</p>
<h2>Faiz oranı nereden bulunur?</h2>
<p>Bankalar konut kredisi faizini aylık oran olarak açıklar. Kampanyalı oranlar genelde maaş müşterisi olma veya ek ürün alma şartına bağlıdır. Başvuru öncesinde bankanın sana özel teklifini al ve buraya gir.</p>`,
    faq: [
      ['Konut kredisinde vergi var mı?', 'İlk konutunu alanların konut kredisinde BSMV ve KKDF uygulanmaz. Halihazırda konutu olanların kullandığı konut kredisinde ise bankalar faize %15 BSMV ekliyor.'],
      ['Vadeyi uzatmak mantıklı mı?', 'Vade uzadıkça taksit düşer ama toplam faiz artar. Enflasyonun yüksek olduğu dönemlerde sabit taksit gelirine göre zamanla hafifler; bu yüzden karar gelir beklentine bağlıdır.'],
    ],
  },
  {
    slug: 'kredi-mi-kira-mi',
    icon: icons.scale,
    menu: 'Kredi mi kira mı?',
    kisa: 'Aynı ev için kredi taksitini ve kirayı yıllar boyunca karşılaştır.',
    title: 'Kredi mi Kira mı? Ev Almak mı Kiralamak mı Hesaplama',
    h1: 'Kredi mi kira mı?',
    lede: 'Aynı ev için kredi taksitini ve ödeyeceğin kirayı karşılaştır. Kira her yıl artarken sabit taksitin kaçıncı yılda kiranın altında kaldığını gör.',
    form: krediKiraForm,
    content: `<h2>Neden bu karşılaştırma önemli?</h2>
<p>Bugün kredi taksiti çoğu zaman aynı evin kirasından yüksek görünür. Ancak taksit vade boyunca sabit kalırken kira her yıl artar. Bu araç, kiranın taksite hangi yılda yetiştiğini ve vade sonuna kadar toplamda ne kadar ödeyeceğini gösterir.</p>
<h2>Hesaba katılmayanlar</h2>
<p>Peşinatı bankada tutsan alacağın faiz geliri, evin yıllar içindeki değer artışı, emlak vergisi ve bakım giderleri bu hesapta yok. Karar vermeden önce özellikle peşinatın alternatif getirisini de düşün.</p>`,
    faq: [
      ['Kira artışı nasıl tahmin ediliyor?', `Kira her yıl beklenen enflasyon kadar artar: önümüzdeki 12 ay için %${tr1(enf.yol[0])}, ardından kademeli düşüşle uzun vadede %${tr1(enf.medyan)} (2000–2025 medyan enflasyonu). Kiranın enflasyondan hızlı artacağını düşünüyorsan farkı puan olarak gir.`],
    ],
  },
];

module.exports = { bankaSec, tools, amortismanForm, icons };
