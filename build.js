// Statik site üretici: node build.js  ->  dist/
// Bağımlılık yok. Netlify build komutu da budur.
const fs = require('fs');
const path = require('path');
const cfg = require('./site.config');
const ilceler = require('./data/ilceler');
const haberler = require('./data/haberler');
const oranlar = require('./data/kira-oranlari');
const { tools, amortismanForm, icons } = require('./pages/tools');

const OUT = path.join(__dirname, 'dist');
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

const logoMark = `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><g fill="var(--tapu)"><rect x="1" y="1" width="8" height="8" rx="2"/><rect x="11" y="1" width="8" height="8" rx="2"/><rect x="21" y="1" width="8" height="8" rx="2"/><rect x="1" y="11" width="8" height="8" rx="2"/><rect x="11" y="11" width="8" height="8" rx="2"/><rect x="1" y="21" width="8" height="8" rx="2"/></g><g fill="none" stroke="var(--tapu)" stroke-width="1.6"><rect x="21.8" y="11.8" width="6.4" height="6.4" rx="1.6"/><rect x="11.8" y="21.8" width="6.4" height="6.4" rx="1.6"/><rect x="21.8" y="21.8" width="6.4" height="6.4" rx="1.6"/></g></svg>`;

const navItems = [
  ['/araclar/', 'Araçlar'],
  ['/istanbul/', 'İlçeler'],
  ['/haberler/', 'Haberler'],
  ['/kira-paylas/', 'Kiranı paylaş'],
];

function layout({ title, description, path: p, body, jsonld = [], active = '', noindex = false }) {
  urls.push(p);
  const fullTitle = title.includes(cfg.name) ? title : `${title} | ${cfg.name}`;
  const ga = cfg.ga4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${cfg.ga4}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${cfg.ga4}');</script>` : '';
  return `<!doctype html>
<html lang="${cfg.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${abs(p)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${cfg.name}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(p)}">
<meta property="og:locale" content="tr_TR">
<meta name="theme-color" content="#234A8C">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
${ga}
</head>
<body>
<header class="site-head">
  <div class="wrap">
    <a class="logo" href="/">${logoMark}<span>${cfg.name.toLowerCase()}</span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav">Menü</button>
    <nav class="nav" id="nav" aria-label="Ana menü">
      ${navItems.map(([href, label]) => `<a href="${href}"${active === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
    </nav>
  </div>
</header>
<main>
${body}
</main>
<footer class="site-foot">
  <div class="wrap foot-grid">
    <div>
      <a class="logo" href="/">${logoMark}<span>${cfg.name.toLowerCase()}</span></a>
      <p style="margin-top:10px">${cfg.tagline}. Hesaplamalar bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</p>
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
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

const crumbs = (items) => `<nav class="crumbs" aria-label="Konum">${items.map(([href, label], i) => (i < items.length - 1 ? `<a href="${href}">${label}</a> / ` : `<span>${label}</span>`)).join('')}</nav>`;
const crumbLd = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([href, label], i) => ({ '@type': 'ListItem', position: i + 1, name: label, item: abs(href) })),
});
const faqLd = (faq) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

const newsItem = (h) => `<li><div class="meta">${h.kategori}, ${h.tarihMetin}</div><h3><a href="/haberler/${h.slug}/">${esc(h.baslik)}</a></h3><p>${esc(h.ozet)}</p></li>`;
const toolList = (list = tools) => `<ul class="tool-list">${list.map((t) => `<li><a href="/araclar/${t.slug}/"><span class="tool-icon">${t.icon}</span><span><h3>${t.menu}</h3><p>${t.kisa}</p></span></a></li>`).join('')}</ul>`;
const ilceGrid = (except) => `<div class="ilce-grid">${ilceler.filter((i) => i.slug !== except).map((i) => `<a href="/istanbul/${i.slug}/">${i.ad}</a>`).join('')}</div>`;
const sidebar = () => `<aside>${ad('mrec')}<div class="box"><h3>Diğer araçlar</h3>${toolList()}</div></aside>`;

// ---------- temizle ve varlıkları kopyala ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const f of fs.readdirSync(path.join(__dirname, 'src/assets'))) fs.copyFileSync(path.join(__dirname, 'src/assets', f), path.join(OUT, 'assets', f));
fs.writeFileSync(path.join(OUT, 'favicon.svg'), logoMark.replace('aria-hidden="true"', 'xmlns="http://www.w3.org/2000/svg"').replace(/var\(--tapu\)/g, '#234A8C'));

// ---------- Anasayfa ----------
write('/', layout({
  title: `${cfg.name}: Ev amortisman, kira artışı ve konut kredisi hesaplama`,
  description: 'Bir evin kaç yılda kendini ödediğini, baktığın ilanın fırsat olup olmadığını, yeni kiranı ve kredi taksitini hesapla. İstanbul ilçe rehberleri ve emlak haberleri.',
  path: '/',
  jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: cfg.name, url: abs('/'), inLanguage: 'tr' }],
  body: `<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-intro">
      <h1>Ev alırken kafandaki tek soru: kaç yılda kendini öder?</h1>
      <p>Fiyatı ve kirayı yaz, amortisman süresini masraflarıyla birlikte gör. Baktığın ilanı bölgedeki benzerleriyle karşılaştır, yeni kiranı ve kredi taksitini hesapla.</p>
      <p class="small muted">Güncel kira artış tavanı: <strong>%${tr2(oranlar[0].oran)}</strong> (${oranlar[0].ay}). <a href="/araclar/kira-artis-hesaplama/">Yeni kiranı hesapla</a></p>
    </div>
    ${amortismanForm({ idPrefix: 'home' })}
  </div>
</section>
${adTop()}
<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>Hesaplama araçları</h2></div>
    ${toolList(tools.filter((t) => t.slug !== 'amortisman-hesaplama'))}
  </div>
</section>
<section class="section">
  <div class="wrap layout">
    <div>
      <div class="section-head"><h2>Emlak haberleri</h2><a href="/haberler/">Tüm haberler</a></div>
      <ul class="news-list">${haberler.slice(0, 4).map(newsItem).join('')}</ul>
    </div>
    <aside>${ad('mrec')}</aside>
  </div>
</section>
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
    title: h.baslik, description: h.ozet, path: p, active: '/haberler/',
    jsonld: [crumbLd(c), {
      '@context': 'https://schema.org', '@type': 'NewsArticle', headline: h.baslik, description: h.ozet,
      datePublished: h.tarih, dateModified: h.tarih, inLanguage: 'tr', mainEntityOfPage: abs(p),
      author: { '@type': 'Organization', name: cfg.name }, publisher: { '@type': 'Organization', name: cfg.publisher },
    }],
    body: `${adTop()}<div class="wrap page">${crumbs(c)}
<div class="layout"><article class="prose">
<p class="muted small">${h.kategori}, ${h.tarihMetin}</p>
<h1>${esc(h.baslik)}</h1>
<p class="lede">${esc(h.ozet)}</p>
${h.body}
${ad('mobile')}
</article>${sidebar()}</div>
<section class="section"><h2>Diğer haberler</h2><ul class="news-list">${haberler.filter((x) => x.slug !== h.slug).slice(0, 3).map(newsItem).join('')}</ul></section>
</div>`,
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
