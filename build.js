// Statik site üretici: node build.js  ->  dist/
// Bağımlılık yok. Netlify build komutu da budur.
const fs = require('fs');
const path = require('path');
const cfg = require('./site.config');
const ilceler = require('./data/ilceler');
const haberler = require('./data/haberler');
const oranlar = require('./data/kira-oranlari');
const enf = require('./data/enflasyon');
const faiz = require('./data/faizler');
const { kapakYaz } = require('./lib/kapak');
const { tools, amortismanForm, icons } = require('./pages/tools');

const OUT = path.join(__dirname, 'dist');
// Önbellek kırıcı: dosya içeriği değişince adres değişir
const ver = (f) => require('crypto').createHash('md5').update(fs.readFileSync(path.join(__dirname, 'src/assets', f))).digest('hex').slice(0, 8);
const V = { css: ver('style.css'), js: ver('app.js') };
const urls = [];

// ---------- yardımcılar ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (p) => cfg.domain.replace(/\/$/, '') + p;
const tr2 = (n) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function write(urlPath, html) {
  const file = urlPath.endsWith('/') ? path.join(OUT, urlPath, 'index.html') : path.join(OUT, urlPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function ad(kind) {
  if (!cfg.showAdPlaceholders) return '';
  const labels = { masthead: 'Reklam alanı · 970×250', mrec: 'Reklam alanı · 300×250', mobile: 'Reklam alanı · 320×100' };
  return `<div class="ad ad-${kind}" data-ad-slot="${kind}" aria-hidden="true">${labels[kind]}</div>`;
}
const adTop = () => (cfg.showAdPlaceholders ? `<div class="wrap">${ad('masthead')}${ad('mobile')}</div>` : '');

const logoMark = `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><g fill="var(--accent)"><rect x="1" y="1" width="8" height="8" rx="1"/><rect x="11" y="1" width="8" height="8" rx="1"/><rect x="21" y="1" width="8" height="8" rx="1"/><rect x="1" y="11" width="8" height="8" rx="1"/><rect x="11" y="11" width="8" height="8" rx="1"/><rect x="1" y="21" width="8" height="8" rx="1"/></g><g fill="none" stroke="var(--accent)" stroke-width="1.6"><rect x="21.8" y="11.8" width="6.4" height="6.4" rx="0.8"/><rect x="11.8" y="21.8" width="6.4" height="6.4" rx="0.8"/><rect x="21.8" y="21.8" width="6.4" height="6.4" rx="0.8"/></g></svg>`;

const KATEGORILER = [
  ['kira', 'Kira'], ['konut-fiyatlari', 'Konut fiyatları'], ['kredi', 'Kredi'], ['piyasa', 'Piyasa'], ['ulasim', 'Ulaşım'],
];
const katSlug = (ad) => (KATEGORILER.find(([, a]) => a === ad) || [ad.toLowerCase()])[0];
const navItems = [
  ['/', 'Gündem'],
  ...KATEGORILER.map(([s, a]) => [`/haberler/kategori/${s}/`, a]),
  'sep',
  ['/konut-kredisi-faiz-oranlari/', 'Kredi faizleri'],
  ['/araclar/', 'Hesaplama araçları'],
  ['/istanbul/', 'İlçeler'],
];
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const AYLAR_ = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const bugun = (() => { const d = new Date(Date.now() + 3 * 3600e3); return `${d.getUTCDate()} ${AYLAR_[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${GUNLER[d.getUTCDay()]}`; })();

function layout({ title, description, path: p, body, jsonld = [], active = '', noindex = false, image = '', ogType = 'website' }) {
  urls.push(p);
  const fullTitle = title.includes(cfg.name) ? title : `${title} | ${cfg.name}`;
  const ga = cfg.ga4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${cfg.ga4}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${cfg.ga4}');</script>` : '';
  return `<!doctype html>
<html lang="${cfg.lang}" data-palette="${cfg.palette || 'elektrik'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${abs(p)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="${ogType}">
${image ? `<meta property="og:image" content="${abs(image)}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${abs(image)}">` : ''}
<meta property="og:site_name" content="${cfg.name}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(p)}">
<meta property="og:locale" content="tr_TR">
<meta name="theme-color" content="#E85D04">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/league-spartan-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/questrial-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css?v=${V.css}">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
${ga}
</head>
<body>
<header class="masthead">
  <div class="wrap mast-top">
    <div class="mast-date">${bugun}</div>
    <a class="logo" href="/" aria-label="${cfg.name} anasayfa"><span class="logo-row">${logoMark.replace('width="30" height="30"', 'width="36" height="36"')}<span class="logo-name">${cfg.name.toLowerCase()}</span></span><span class="logo-tag">Emlak haberleri ve hesaplama araçları</span></a>
    <div class="mast-side"><a href="/kira-paylas/">Kiranı paylaş</a></div>
  </div>
  <nav class="catnav" aria-label="Kategoriler"><div class="wrap">
    ${navItems.map((n) => (n === 'sep' ? '<span class="sep" aria-hidden="true"></span>' : `<a href="${n[0]}"${active === n[0] ? ' aria-current="page"' : ''}>${n[1]}</a>`)).join('')}
  </div></nav>
  ${ticker()}
</header>
<main>
${body}
</main>
<footer class="site-foot">
  <div class="wrap foot-grid">
    <div>
      <a class="foot-name" href="/">${cfg.name.toLowerCase()}</a>
      <p style="margin-top:8px">${cfg.tagline}. Hesaplamalar bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</p>
    </div>
    <div>
      <h4>Araçlar</h4>
      <ul>${tools.map((t) => `<li><a href="/araclar/${t.slug}/">${t.menu}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h4>Site</h4>
      <ul>
        <li><a href="/istanbul/">İstanbul ilçeleri</a></li>
        <li><a href="/haberler/">Emlak haberleri</a></li>
        <li><a href="/kira-paylas/">Kiranı paylaş</a></li>
        <li><a href="/kunye/">Künye</a></li>
        <li><a href="/gizlilik/">Gizlilik ve KVKK</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap"><p class="small" style="margin:24px 0 0">© 2026 ${cfg.name}. Yayıncı: ${cfg.publisher}</p></div>
</footer>
<script>window.AMORTI_ENF=${JSON.stringify(enf.yol)};</script>
<script src="/assets/app.js?v=${V.js}" defer></script>
</body>
</html>`;
}

const ticker = () => {
  const items = haberler.slice(0, 10).map((h) => `<a href="/haberler/${h.slug}/"><b>${h.kategori}</b>${esc(h.baslik)}</a>`).join('');
  return `<div class="ticker" aria-label="En yeni haberler"><div class="wrap"><span class="ticker-label">En yeni</span><div class="ticker-view"><div class="ticker-track">${items}<span aria-hidden="true" style="display:contents">${items.replace(/<a /g, '<a tabindex="-1" ')}</span></div></div></div></div>`;
};
const crumbs = (items) => `<nav class="crumbs" aria-label="Konum">${items.map(([href, label], i) => (i < items.length - 1 ? `<a href="${href}">${label}</a> / ` : `<span>${label}</span>`)).join('')}</nav>`;
const crumbLd = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([href, label], i) => ({ '@type': 'ListItem', position: i + 1, name: label, item: abs(href) })),
});
const faqLd = (faq) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

const catLink = (h) => `<a class="cat" data-k="${h.kategori}" href="/haberler/kategori/${katSlug(h.kategori)}/">${h.kategori}</a>`;
const meta = (h) => `<div class="meta">${catLink(h)}<span>${h.tarihMetin}</span></div>`;
const newsItem = (h) => `<li class="with-thumb"><a class="thumb" href="/haberler/${h.slug}/" tabindex="-1" aria-hidden="true">${img(h)}</a><div>${meta(h)}<h3><a href="/haberler/${h.slug}/">${esc(h.baslik)}</a></h3><p>${esc(h.ozet)}</p></div></li>`;
const toolList = (list = tools) => `<ul class="tool-list">${list.map((t) => `<li><a href="/araclar/${t.slug}/"><span class="tool-icon">${t.icon}</span><span><h3>${t.menu}</h3><p>${t.kisa}</p></span></a></li>`).join('')}</ul>`;
const ilceGrid = (except) => `<div class="ilce-grid">${ilceler.filter((i) => i.slug !== except).map((i) => `<a href="/istanbul/${i.slug}/">${i.ad}</a>`).join('')}</div>`;
const sidebar = () => `<aside>${ad('mrec')}<div class="box"><h3>Diğer araçlar</h3>${toolList()}</div></aside>`;

// ---------- temizle ve varlıkları kopyala ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.cpSync(path.join(__dirname, 'src/assets'), path.join(OUT, 'assets'), { recursive: true });
for (const h of haberler) h.kapak = `/haberler/${h.slug}/` + kapakYaz(h, path.join(OUT, 'haberler', h.slug));
const img = (h, cls = '', lazy = true) => `<img class="${cls}" src="${h.kapak}" alt="${esc((h.gorsel && h.gorsel.etiket) || h.baslik)}" width="1200" height="630"${lazy ? ' loading="lazy"' : ''}>`;
fs.writeFileSync(path.join(OUT, 'favicon.svg'), logoMark.replace('aria-hidden="true"', 'xmlns="http://www.w3.org/2000/svg"').replace(/var\(--tapu\)/g, '#234A8C'));

// ---------- Anasayfa: solda haberler, sağda alt alta hesaplama araçları ----------
const tr1 = (n) => n.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const hidden = (o) => Object.entries(o).map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`).join('');
const miniField = (name, label, o = {}) => `<div class="field"><label for="${o.id}">${label}</label><div class="input"><input id="${o.id}" name="${name}" type="text" inputmode="decimal" autocomplete="off"${o.money ? ' data-money' : ''} value="${o.value ?? ''}" class="has-unit"><span class="unit">${o.unit}</span></div></div>`;
const wHead = (href, icon, title) => `<div class="w-head"><span class="tool-icon">${icon}</span><h3><a href="${href}">${title}</a></h3></div>`;

const widgets = `
<form class="calc mini" data-tool="kira-artis" novalidate>
  ${wHead('/araclar/kira-artis-hesaplama/', icons.up, 'Kiran ne kadar artacak?')}
  ${miniField('kira', 'Şu anki kiran', { id: 'w-kira', unit: 'TL', money: true, value: '25.000' })}
  <div class="field"><label for="w-ay">Sözleşme yenileme ayı</label><div class="input"><select id="w-ay" name="ay">${oranlar.slice(0, 6).map((o, i) => `<option value="${o.oran}"${i === 0 ? ' selected' : ''}>${o.ay} (%${tr2(o.oran)})</option>`).join('')}</select></div></div>
  <div class="result" aria-live="polite" hidden><span class="small">Yeni kiran en fazla</span><div class="mid" data-out="yeni">–</div><span class="small">Aylık artış: <span data-out="artis"></span></span></div>
</form>
<form class="calc mini" data-tool="amortisman" novalidate>
  ${wHead('/araclar/amortisman-hesaplama/', icons.hourglass, 'Ev kaç yılda kendini öder?')}
  ${miniField('fiyat', 'Satış fiyatı', { id: 'w-fiyat', unit: 'TL', money: true, value: '6.500.000' })}
  ${miniField('kira', 'Alınabilecek aylık kira', { id: 'w-akira', unit: 'TL', money: true, value: '30.000' })}
  ${hidden({ masraf: '4,4', bos: '0,5', bakim: '5', gider: '0', fark: '0' })}
  <div class="result" aria-live="polite" hidden><div class="mid" data-out="yil">–</div><span data-out="verdict" class="verdict"></span> <a class="small" href="/araclar/amortisman-hesaplama/">Detaylı hesapla</a></div>
</form>
${ad('mrec')}
<form class="calc mini" data-tool="kredi" novalidate>
  ${wHead('/araclar/konut-kredisi-hesaplama/', icons.bank, 'Kredi taksitin ne olur?')}
  ${miniField('tutar', 'Kredi tutarı', { id: 'w-tutar', unit: 'TL', money: true, value: '2.000.000' })}
  <div class="pair">
    ${miniField('vade', 'Vade', { id: 'w-vade', unit: 'ay', value: '120' })}
    ${miniField('faiz', 'Aylık faiz', { id: 'w-faiz', unit: '%', value: String(faiz.tipik).replace('.', ',') })}
  </div>
  <div class="result" aria-live="polite" hidden><span class="small">Aylık taksit</span><div class="mid" data-out="taksit">–</div><span class="small">Toplam geri ödeme: <span data-out="toplam"></span></span></div>
</form>
<div class="side-links">
  <a class="side-link" href="/araclar/ilan-firsat-mi/"><span class="tool-icon">${icons.search}</span><span><b>Bu ilan fırsat mı?</b><span class="small">Benzer ilanlarla karşılaştır</span></span><span class="go" aria-hidden="true">›</span></a>
  <a class="side-link" href="/araclar/kredi-mi-kira-mi/"><span class="tool-icon">${icons.scale}</span><span><b>Kredi mi, kira mı?</b><span class="small">Yıllar içinde karşılaştır</span></span><span class="go" aria-hidden="true">›</span></a>
</div>
<div class="side-box faizler">
  <h3><a href="/konut-kredisi-faiz-oranlari/" style="color:inherit;text-decoration:none">Konut kredisi faizleri</a></h3>
  <ol>${faiz.olan.slice(0, 5).map((b) => `<li><span>${b.banka}</span><b>%${tr2(b.oran)}</b></li>`).join('')}</ol>
  <p class="small muted" style="margin:8px 0 0">Aylık oran, bankaların sitelerinden. ${faiz.sonKontrolMetin}. <a href="/konut-kredisi-faiz-oranlari/">Tümü</a></p>
</div>
<div class="side-box facts">
  <h3>Güncel veriler</h3>
  <dl>
    <div><dt>Kira artış tavanı, ${oranlar[0].ay}</dt><dd>%${tr2(oranlar[0].oran)}</dd></div>
    <div><dt>12 ay sonrası enflasyon beklentisi</dt><dd>%${tr2(enf.beklenti.ay12)}</dd></div>
  </dl>
</div>`;

const [lead, ...rest] = haberler;
const kartlar = rest.slice(0, 4);
const dahaFazla = rest.slice(4, 16);
write('/', layout({
  title: `${cfg.name}: Emlak haberleri, kira artışı ve konut kredisi faizleri`,
  description: 'İstanbul ve Türkiye emlak haberleri, güncel kira artış oranı, bankaların konut kredisi faizleri ve konut fiyatları. Amortisman, kira artışı ve kredi hesaplama araçları.',
  path: '/', active: '/', image: lead ? lead.kapak : '',
  jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: cfg.name, url: abs('/'), inLanguage: 'tr' }],
  body: `<h1 class="visually-hidden">${cfg.name}: emlak haberleri ve hesaplama araçları</h1>
<div class="wrap home-grid">
  <div class="home-main">
    ${lead ? `<article class="lead">
      <a class="lead-img" href="/haberler/${lead.slug}/" tabindex="-1" aria-hidden="true">${img(lead, '', false)}</a>
      ${meta(lead)}
      <h2><a href="/haberler/${lead.slug}/">${esc(lead.baslik)}</a></h2>
      <p>${esc(lead.ozet)}</p>
    </article>` : ''}
    <section class="cards" aria-label="Öne çıkanlar">
      ${kartlar.map((h) => `<article class="card"><a class="thumb" href="/haberler/${h.slug}/" tabindex="-1" aria-hidden="true">${img(h)}</a><div>${meta(h)}<h3><a href="/haberler/${h.slug}/">${esc(h.baslik)}</a></h3><p>${esc(h.ozet)}</p></div></article>`).join('')}
    </section>
    ${ad('mobile')}
    <section class="more" aria-label="Diğer haberler">
      <div>
        <div class="section-head" style="margin-top:20px"><h2>Daha fazla haber</h2><a href="/haberler/">Tüm haberler</a></div>
        <ul class="more-list">${dahaFazla.map((h) => `<li>${meta(h)}<a href="/haberler/${h.slug}/">${esc(h.baslik)}</a></li>`).join('')}</ul>
      </div>
    </section>
  </div>
  <aside class="home-side" aria-label="Hesaplama araçları">
    <div class="side-title"><h2>Hesaplama araçları</h2><a href="/araclar/">Tümü</a></div>
    ${widgets}
  </aside>
</div>
${adTop()}
<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>İstanbul Anadolu yakası ilçe rehberleri</h2><a href="/istanbul/">Tüm ilçeler</a></div>
    ${ilceGrid()}
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="empty">
      <h2>Mahallendeki gerçek kiraları birlikte çıkaralım</h2>
      <p>Ödediğin veya aldığın kirayı isimsiz paylaş. Paylaşımlar ilçe sayfalarında ortalama kira olarak gösterilecek ve amortisman hesaplarını daha doğru yapacak.</p>
      <p><a class="btn" href="/kira-paylas/">Kiranı paylaş</a></p>
    </div>
  </div>
</section>`,
}));

// ---------- Araçlar ----------
write('/araclar/', layout({
  title: 'Emlak hesaplama araçları',
  description: 'Amortisman, ilan karşılaştırma, kira artışı, konut kredisi ve kredi mi kira mı hesaplama araçları.',
  path: '/araclar/', active: '/araclar/',
  jsonld: [crumbLd([['/', 'Anasayfa'], ['/araclar/', 'Araçlar']])],
  body: `${adTop()}<div class="wrap page">${crumbs([['/', 'Anasayfa'], ['/araclar/', 'Araçlar']])}<h1>Hesaplama araçları</h1><p class="lede">Ev alma, kiralama ve kredi kararlarını rakamlarla netleştirmek için.</p>${toolList()}</div>`,
}));

for (const t of tools) {
  const p = `/araclar/${t.slug}/`;
  const c = [['/', 'Anasayfa'], ['/araclar/', 'Araçlar'], [p, t.menu]];
  write(p, layout({
    title: t.title, description: t.lede, path: p, active: '/araclar/',
    jsonld: [
      crumbLd(c),
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: t.menu, url: abs(p), applicationCategory: 'FinanceApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }, inLanguage: 'tr' },
      ...(t.faq ? [faqLd(t.faq)] : []),
    ],
    body: `${adTop()}<div class="wrap page">
${crumbs(c)}
<div class="layout">
  <div>
    <h1>${t.h1}</h1>
    <p class="lede">${t.lede}</p>
    ${t.form()}
    ${ad('mobile')}
    <div class="prose" style="margin-top:32px">${t.content}</div>
    ${t.faq ? `<div class="prose faq"><h2>Sık sorulanlar</h2>${t.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>` : ''}
    <p class="small muted" style="margin-top:24px">Son güncelleme: ${cfg.updated}. Hesaplamalar bilgilendirme amaçlıdır.</p>
  </div>
  <aside>${ad('mrec')}<div class="box"><h3>Diğer araçlar</h3>${toolList(tools.filter((x) => x.slug !== t.slug))}</div></aside>
</div></div>`,
  }));
}

// ---------- Konut kredisi faiz oranları ----------
{
  const P = '/konut-kredisi-faiz-oranlari/';
  const ay = faiz.sonKontrolMetin.split(' ').slice(1).join(' ');
  const taksit = (o, P0 = 2000000, n = 120) => { const r = o / 100; return P0 * r / (1 - Math.pow(1 + r, -n)); };
  const tl0 = (n) => Math.round(n).toLocaleString('tr-TR') + ' TL';
  const c = [['/', 'Anasayfa'], [P, 'Konut kredisi faiz oranları']];
  const kf = tools.find((t) => t.slug === 'konut-kredisi-hesaplama');
  const faq = [
    ['En düşük konut kredisi faizi hangi bankada?', faiz.enDusuk ? `${faiz.sonKontrolMetin} itibarıyla bankaların sitelerinde yayınlanan en düşük aylık oran %${tr2(faiz.enDusuk.oran)} ile ${faiz.enDusuk.banka}'da. Oranlar vade, tutar, hayat sigortası ve müşteri durumuna göre değişebilir.` : 'Oranlar güncelleniyor.'],
    ['Tablodaki oranlar bana uygulanacak oran mı?', 'Hayır, bunlar bankaların sitelerinde ilan ettiği oranlar. Banka; kredi notu, gelir, maaş müşterisi olup olmama, hayat sigortası ve konutun enerji sınıfına göre farklı bir teklif yapabilir. Başvuru öncesinde bankadan sana özel teklifi al.'],
    ['Konut kredisinde BSMV var mı?', 'İlk konutunu alanlar için konut kredisinde BSMV ve KKDF uygulanmaz. Halihazırda üzerine kayıtlı konutu olanların kullandığı konut kredisinde ise bankalar faize %15 BSMV ekliyor.'],
    ['Oranlar ne sıklıkla güncelleniyor?', 'Bankaların sayfaları hafta içi her gün kontrol edilir. Her satırda son kontrol tarihi yazar; o gün okunamayan bankada en son doğrulanan oran gösterilir.'],
  ];
  write(P, layout({
    title: `Konut Kredisi Faiz Oranları ${ay}: Banka Banka Güncel Oranlar`,
    description: `Bankaların güncel konut kredisi faiz oranları. En düşük aylık oran %${tr2(faiz.enDusuk ? faiz.enDusuk.oran : faiz.tipik)}${faiz.enDusuk ? ' (' + faiz.enDusuk.banka + ')' : ''}. 2 milyon TL, 120 ay taksit karşılaştırması ve kredi hesaplama.`,
    path: P, active: P,
    jsonld: [crumbLd(c), faqLd(faq)],
    body: `${adTop()}<div class="wrap page">${crumbs(c)}
<div class="layout"><div>
<h1>Konut kredisi faiz oranları</h1>
<p class="lede">Bankaların kendi sitelerinde yayınladığı güncel konut kredisi faiz oranları. ${faiz.enDusuk ? `En düşük aylık oran <strong>%${tr2(faiz.enDusuk.oran)}</strong> (${faiz.enDusuk.banka}), bankaların ortanca oranı <strong>%${tr2(faiz.ortanca)}</strong>.` : ''} Son kontrol: ${faiz.sonKontrolMetin}.</p>
<div class="table-wrap"><table class="data faiz-tablo">
<thead><tr><th>Banka</th><th>Aylık faiz</th><th>2 milyon TL, 120 ay taksit</th><th>Koşul</th><th>Son kontrol</th></tr></thead>
<tbody>
${faiz.olan.map((b, i) => `<tr${i === 0 ? ' class="current"' : ''}><td><a href="${b.url}" rel="nofollow noopener" target="_blank">${b.banka}</a><span class="small muted">${b.urun}</span></td><td class="num"><b>%${tr2(b.oran)}</b></td><td class="num">${tl0(taksit(b.oran))}</td><td class="small">${b.kosul}</td><td class="small muted">${b.kontrolMetin}</td></tr>`).join('\n')}
${faiz.bekleyen.map((b) => `<tr><td><a href="${b.url}" rel="nofollow noopener" target="_blank">${b.banka}</a><span class="small muted">${b.urun}</span></td><td colspan="4" class="small muted">Oran henüz alınamadı. Güncel oran için bankanın sayfasına bak.</td></tr>`).join('\n')}
</tbody></table></div>
<p class="small muted">Taksit, ilk konutunu alanlar için (BSMV'siz) eşit taksitli formülle hesaplanmıştır; dosya masrafı, ekspertiz ve sigorta dahil değildir. Oranlar bankaların ilan ettiği oranlardır, sana özel teklif farklı olabilir.</p>
${ad('mobile')}
<h2 style="margin-top:32px">Taksitini hesapla</h2>
${kf.form()}
<div class="prose faq" style="margin-top:32px"><h2>Sık sorulanlar</h2>${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
</div>${sidebar()}</div></div>`,
  }));
}

// ---------- İlçeler ----------
write('/istanbul/', layout({
  title: 'İstanbul ilçe rehberleri: kira, amortisman ve ulaşım',
  description: 'İstanbul Anadolu yakası ilçelerinde mahalleler, ulaşım, yatırımcı notları ve amortisman hesaplama.',
  path: '/istanbul/', active: '/istanbul/',
  jsonld: [crumbLd([['/', 'Anasayfa'], ['/istanbul/', 'İstanbul']])],
  body: `${adTop()}<div class="wrap page">${crumbs([['/', 'Anasayfa'], ['/istanbul/', 'İstanbul']])}
<h1>İstanbul ilçe rehberleri</h1>
<p class="lede">Anadolu yakasının ${ilceler.length} ilçesinde öne çıkan mahalleler, ulaşım, yatırım yaparken dikkat edilecekler ve ilçeye özel amortisman hesabı. Avrupa yakası ilçeleri yakında ekleniyor.</p>
<h2 style="margin-top:28px">Anadolu yakası</h2>
${ilceGrid()}
</div>`,
}));

for (const i of ilceler) {
  const p = `/istanbul/${i.slug}/`;
  const c = [['/', 'Anasayfa'], ['/istanbul/', 'İstanbul'], [p, i.ad]];
  const ilgili = haberler.filter((h) => h.ilceler.includes(i.slug) || h.ilceler.includes('istanbul')).slice(0, 3);
  write(p, layout({
    title: `${i.ad} kira getirisi ve amortisman süresi: ilçe rehberi`,
    description: `${i.ad}'da ev alırken ve kiralarken bilmen gerekenler: öne çıkan mahalleler, ulaşım, yatırımcı notları ve ${i.ad} için amortisman hesaplama.`,
    path: p, active: '/istanbul/',
    jsonld: [crumbLd(c)],
    body: `${adTop()}<div class="wrap page">
${crumbs(c)}
<div class="layout">
  <div>
    <h1>${i.ad} ev ve kira rehberi</h1>
    <p class="lede">${i.ozet}</p>

    <h2 style="margin-top:28px">${i.ad}'da bir evin amortisman süresini hesapla</h2>
    ${amortismanForm({ heading: false, fiyat: '', kira: '', idPrefix: i.slug })}

    <div class="box">
      <h3>${i.ad} ortalama kiraları</h3>
      <div class="empty">
        <p>Bu ilçe için henüz yeterli kira paylaşımı yok. ${i.ad}'da kiracı veya ev sahibiysen, kirayı isimsiz paylaşarak ortalamanın oluşmasına katkı verebilirsin.</p>
        <p><a class="btn" href="/kira-paylas/?ilce=${i.slug}">${i.ad} için kira paylaş</a></p>
      </div>
    </div>
    ${ad('mobile')}

    <div class="prose">
      <h2>Öne çıkan mahalleler</h2>
      <ul class="pill-list">${i.mahalleler.map((m) => `<li>${m}</li>`).join('')}</ul>
      <h2>Ulaşım</h2>
      <ul>${i.ulasim.map((u) => `<li>${u}</li>`).join('')}</ul>
      <h2>Yatırım yaparken dikkat</h2>
      <ul>${i.notlar.map((n) => `<li>${n}</li>`).join('')}</ul>
      <p>Bir ilana bakıyorsan, aynı mahalledeki benzer ilanlarla karşılaştırmak için <a href="/araclar/ilan-firsat-mi/">bu ilan fırsat mı</a> aracını kullan.</p>
    </div>

    ${ilgili.length ? `<h2 style="margin-top:32px">İlgili haberler</h2><ul class="news-list">${ilgili.map(newsItem).join('')}</ul>` : ''}

    <h2 style="margin-top:32px">Diğer Anadolu yakası ilçeleri</h2>
    ${ilceGrid(i.slug)}
  </div>
  ${sidebar()}
</div></div>`,
  }));
}

// ---------- Haberler ----------
write('/haberler/', layout({
  title: 'Emlak haberleri: kira, konut fiyatları ve kredi',
  description: 'Kira artış oranları, konut fiyat endeksi, konut kredisi faizleri ve İstanbul emlak piyasasından güncel haberler.',
  path: '/haberler/', active: '/haberler/',
  jsonld: [crumbLd([['/', 'Anasayfa'], ['/haberler/', 'Haberler']])],
  body: `${adTop()}<div class="wrap page">${crumbs([['/', 'Anasayfa'], ['/haberler/', 'Haberler']])}
<div class="layout"><div><h1>Emlak haberleri</h1><ul class="news-list" style="margin-top:20px">${haberler.map(newsItem).join('')}</ul></div>${sidebar()}</div></div>`,
}));

for (const h of haberler) {
  const p = `/haberler/${h.slug}/`;
  const c = [['/', 'Anasayfa'], ['/haberler/', 'Haberler'], [p, h.kategori]];
  write(p, layout({
    title: h.baslik, description: h.ozet, path: p, active: `/haberler/kategori/${katSlug(h.kategori)}/`, image: h.kapak, ogType: 'article',
    jsonld: [crumbLd(c), {
      '@context': 'https://schema.org', '@type': 'NewsArticle', headline: h.baslik, description: h.ozet,
      datePublished: h.tarih, dateModified: h.tarih, image: [abs(h.kapak)], inLanguage: 'tr', mainEntityOfPage: abs(p),
      author: { '@type': 'Organization', name: cfg.name }, publisher: { '@type': 'Organization', name: cfg.publisher },
    }],
    body: `${adTop()}<div class="wrap page">${crumbs(c)}
<div class="layout"><article class="prose">
${meta(h)}
<h1>${esc(h.baslik)}</h1>
<p class="lede">${esc(h.ozet)}</p>
<div class="byline">Amorti haber masası, ${h.tarihMetin}</div>
<figure class="kapak">${img(h, '', false)}</figure>
${h.body}
${ad('mobile')}
</article>${sidebar()}</div>
<section class="section"><h2>Diğer haberler</h2><ul class="news-list">${haberler.filter((x) => x.slug !== h.slug).slice(0, 3).map(newsItem).join('')}</ul></section>
</div>`,
  }));
}

// ---------- Haber kategorileri ----------
for (const [slug, ad] of KATEGORILER) {
  const p = `/haberler/kategori/${slug}/`;
  const list = haberler.filter((h) => h.kategori === ad);
  const c = [['/', 'Anasayfa'], ['/haberler/', 'Haberler'], [p, ad]];
  write(p, layout({
    title: `${ad} haberleri`, description: `${ad} kategorisindeki güncel emlak haberleri: ${list.slice(0, 3).map((h) => h.baslik).join('; ')}`.slice(0, 300),
    path: p, active: p, jsonld: [crumbLd(c)],
    body: `${adTop()}<div class="wrap page">${crumbs(c)}
<div class="layout"><div><h1>${ad}</h1>
${list.length ? `<ul class="news-list" style="margin-top:20px">${list.map(newsItem).join('')}</ul>` : '<div class="empty"><p>Bu kategoride henüz haber yok.</p></div>'}
</div>${sidebar()}</div></div>`,
  }));
}

// ---------- Kiranı paylaş (Netlify Forms) ----------
const ilceOptions = ilceler.map((i) => `<option value="${i.slug}">${i.ad}</option>`).join('');
write('/kira-paylas/', layout({
  title: 'Kiranı paylaş: mahallendeki gerçek kiraları birlikte çıkaralım',
  description: 'Ödediğin veya aldığın kirayı isimsiz paylaş. Paylaşımlar ilçe sayfalarında ortalama kira olarak gösterilir.',
  path: '/kira-paylas/', active: '/kira-paylas/',
  body: `<div class="wrap page"><div class="layout"><div>
<h1>Kiranı paylaş</h1>
<p class="lede">İlan fiyatları değil, gerçekten ödenen kiralar. Paylaşımın isimsiz kalır; ilçe ve mahalle bazında ortalamalar yeterli sayıya ulaşınca ilçe sayfalarında yayınlanır.</p>
<form class="calc" name="kira-paylas" method="POST" action="/tesekkurler/" data-netlify="true" netlify-honeypot="adres">
  <input type="hidden" name="form-name" value="kira-paylas">
  <p class="hp"><label>Bu alanı boş bırak <input name="adres"></label></p>
  <div class="form-grid">
    <div class="field"><label for="f-ilce">İlçe</label><div class="input"><select id="f-ilce" name="ilce" required><option value="">Seç</option>${ilceOptions}<option value="diger">Diğer (mahalle alanına yaz)</option></select></div></div>
    <div class="field"><label for="f-mahalle">Mahalle</label><div class="input"><input id="f-mahalle" name="mahalle" required placeholder="ör. Caferağa"></div></div>
    <div class="field"><label for="f-kira">Aylık kira</label><div class="input"><input id="f-kira" name="kira" inputmode="numeric" data-money required class="has-unit" placeholder="ör. 30.000"><span class="unit">TL</span></div></div>
    <div class="field"><label for="f-m2">Net m²</label><div class="input"><input id="f-m2" name="m2" inputmode="numeric" required class="has-unit" placeholder="ör. 95"><span class="unit">m²</span></div></div>
    <div class="field"><label for="f-oda">Oda sayısı</label><div class="input"><select id="f-oda" name="oda"><option>1+0</option><option>1+1</option><option selected>2+1</option><option>3+1</option><option>4+1 ve üzeri</option></select></div></div>
    <div class="field"><label for="f-yas">Bina yaşı</label><div class="input"><select id="f-yas" name="bina_yasi"><option>0–5</option><option>6–10</option><option selected>11–20</option><option>21–30</option><option>30+</option></select></div></div>
    <div class="field"><label for="f-esya">Eşya durumu</label><div class="input"><select id="f-esya" name="esyali"><option>Eşyasız</option><option>Eşyalı</option></select></div></div>
    <div class="field"><label for="f-tarih">Sözleşme ya da son artış</label><div class="input"><input id="f-tarih" name="sozlesme" type="month"></div></div>
  </div>
  <div class="field" style="margin-top:14px"><label style="font-weight:400"><input type="checkbox" name="kvkk" required> Paylaştığım bilgilerin isimsiz olarak istatistik amacıyla kullanılmasını kabul ediyorum. <a href="/gizlilik/">Gizlilik ve KVKK</a></label></div>
  <p style="margin-top:16px"><button class="btn" type="submit">Kiramı paylaş</button></p>
</form>
<script>try{var q=new URLSearchParams(location.search).get('ilce');if(q){var s=document.getElementById('f-ilce');if(s)s.value=q;}}catch(e){}</script>
</div>${sidebar()}</div></div>`,
}));

write('/tesekkurler/', layout({
  title: 'Teşekkürler', description: 'Kira paylaşımın alındı.', path: '/tesekkurler/', noindex: true,
  body: `<div class="wrap page"><div class="empty"><h1>Teşekkürler, paylaşımın alındı</h1><p>Kira bilgin isimsiz olarak ortalamalara eklenecek. Bu arada bir evin amortisman süresini hesaplamak ister misin?</p><p><a class="btn" href="/araclar/amortisman-hesaplama/">Amortisman hesapla</a></p></div></div>`,
}));

// ---------- Kurumsal ----------
write('/kunye/', layout({
  title: 'Künye', description: `${cfg.name} künye bilgileri.`, path: '/kunye/',
  body: `<div class="wrap page prose"><h1>Künye</h1>
<p><strong>Yayıncı:</strong> ${cfg.publisher}</p>
<p><strong>Genel Yayın Yönetmeni:</strong> ${cfg.editor}</p>
<p><strong>İletişim:</strong> <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a></p>
<p>${cfg.name}, ev alma ve kiralama kararlarını kolaylaştırmak için hesaplama araçları, ilçe rehberleri ve emlak haberleri yayınlar. Sitedeki hesaplamalar bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliği taşımaz.</p></div>`,
}));

write('/gizlilik/', layout({
  title: 'Gizlilik ve KVKK aydınlatma metni', description: `${cfg.name} gizlilik politikası ve KVKK aydınlatma metni.`, path: '/gizlilik/',
  body: `<div class="wrap page prose"><h1>Gizlilik ve KVKK</h1>
<p>Bu metin, ${cfg.publisher} ("Şirket") tarafından işletilen ${cfg.name} sitesinde kişisel verilerin nasıl işlendiğini açıklar.</p>
<h2>Hesaplama araçları</h2><p>Araçlara girdiğin rakamlar yalnızca tarayıcında işlenir, sunucularımıza gönderilmez ve saklanmaz.</p>
<h2>Kira paylaşım formu</h2><p>Formda ad, telefon veya adres gibi kimlik bilgisi istenmez. Paylaştığın ilçe, mahalle, kira, m² ve bina bilgileri isimsiz olarak saklanır ve yalnızca toplu istatistik (ortalama, ortanca) olarak yayınlanır.</p>
<h2>Çerezler ve reklam</h2><p>Site, ziyaret istatistikleri ve reklam gösterimi için çerezler kullanabilir. Tarayıcı ayarlarından çerezleri yönetebilirsin.</p>
<h2>Haklarınız</h2><p>6698 sayılı KVKK'nın 11. maddesi kapsamındaki taleplerini <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a> adresine iletebilirsin.</p>
<p class="small muted">Bu metin taslaktır; yayına almadan önce hukuki kontrolden geçirilmelidir.</p></div>`,
}));

write('/404.html', layout({
  title: 'Sayfa bulunamadı', description: 'Aradığın sayfa bulunamadı.', path: '/404.html', noindex: true,
  body: `<div class="wrap page"><div class="empty"><h1>Bu sayfa bulunamadı</h1><p>Adres değişmiş veya kaldırılmış olabilir. Araçlara ya da ilçe rehberlerine buradan ulaşabilirsin.</p><p><a class="btn" href="/araclar/">Araçlara git</a> <a class="btn secondary" href="/istanbul/">İlçe rehberleri</a></p></div></div>`,
}));

// ---------- SEO dosyaları ----------
const indexable = urls.filter((u) => !['/tesekkurler/', '/404.html'].includes(u));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((u) => `  <url><loc>${abs(u)}</loc></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /tesekkurler/\n\nSitemap: ${abs('/sitemap.xml')}\n`);
fs.writeFileSync(path.join(OUT, 'llms.txt'), `# ${cfg.name}

> ${cfg.tagline}. Türkiye'de ev alma, kiralama ve konut kredisi kararları için ücretsiz hesaplama araçları, İstanbul ilçe rehberleri ve emlak haberleri.

## Araçlar
${tools.map((t) => `- [${t.menu}](${abs(`/araclar/${t.slug}/`)}): ${t.kisa}`).join('\n')}

## Güncel veriler
- ${oranlar[0].ay} kira artış üst sınırı (TÜFE 12 aylık ortalama): %${tr2(oranlar[0].oran)}

## İlçe rehberleri
${ilceler.map((i) => `- [${i.ad}](${abs(`/istanbul/${i.slug}/`)})`).join('\n')}

## Haberler
${haberler.map((h) => `- [${h.baslik}](${abs(`/haberler/${h.slug}/`)})`).join('\n')}
`);

console.log(`Tamam: ${urls.length} sayfa -> dist/`);
