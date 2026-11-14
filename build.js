// Statik site üretici: node build.js  ->  dist/
// Bağımlılık yok. Netlify build komutu da budur.
const fs = require('fs');
const path = require('path');
const cfg = require('./site.config');
const { iller, rehberler, ilBul, bulunma } = require('./data/sehirler');
const ilanAra = require('./data/ilan-ara');
const haberler = require('./data/haberler');
const oranlar = require('./data/kira-oranlari');
const enf = require('./data/enflasyon');
const faiz = require('./data/faizler');
const { kapakYaz } = require('./lib/kapak');
const { tools, amortismanForm, icons, bankaSec, field } = require('./pages/tools');

const OUT = path.join(__dirname, 'dist');
// Önbellek kırıcı: dosya içeriği değişince adres değişir
const ver = (f) => require('crypto').createHash('md5').update(fs.readFileSync(path.join(__dirname, 'src/assets', f))).digest('hex').slice(0, 8);
const V = { css: ver('style.css'), js: ver('app.js'), gz: ver('gazeta.css'), qz: ver('qurno.css') };
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

const bankLogo = (b) => (b.logo ? `<span class="bank-logo"><img src="${b.logo}" alt="" width="72" height="20" loading="lazy" decoding="async"></span>` : '');

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
const { slug: trSlug } = require('./data/sehirler');
const katSlug = (ad) => (KATEGORILER.find(([, a]) => a === ad) || [trSlug(ad)])[0];
const navItems = [
  ['/', 'Gündem'],
  ...KATEGORILER.map(([s, a]) => [`/haberler/kategori/${s}/`, a]),
  'sep',
  ['/konut-kredisi-faiz-oranlari/', 'Kredi faizleri'],
  ['/ilan-ara/', 'İlan ara'],
  ['/araclar/', 'Hesaplama araçları'],
  ['/sehirler/', 'Şehirler'],
];
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const AYLAR_ = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const bugun = (() => { const d = new Date(Date.now() + 3 * 3600e3); return `${d.getUTCDate()} ${AYLAR_[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${GUNLER[d.getUTCDay()]}`; })();

function layout({ title, description, path: p, body, jsonld = [], active = '', noindex = false, image = '', ogType = 'website', tasarim = '' }) {
  urls.push(p);
  const fullTitle = title.includes(cfg.name) ? title : `${title} | ${cfg.name}`;
  // KVKK: Google Analytics Consent Mode ile; izin verilmeden analiz çerezi yazılmaz. Çerez bandı aşağıda (cerezBandi).
  const ga = cfg.ga4 ? `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}(function(){var c=null;try{c=localStorage.getItem('am-cerez')}catch(e){}var a=c==='evet'?'granted':'denied';gtag('consent','default',{analytics_storage:a,ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500})})();gtag('js',new Date());gtag('config','${cfg.ga4}');</script><script async src="https://www.googletagmanager.com/gtag/js?id=${cfg.ga4}"></script>` : '';
  const cerezBandi = cfg.ga4 ? `<div id="cerez" role="dialog" aria-label="Çerez tercihi" hidden style="position:fixed;z-index:99;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;background:#141414;color:#f5f5f5;border-radius:14px;padding:14px 16px;box-shadow:0 14px 40px rgba(0,0,0,.3);font-size:14px;line-height:1.45"><p style="margin:0 0 10px">Sitenin nasıl kullanıldığını ölçmek için <b>Google Analytics</b> istatistik çerezlerini kullanmak istiyoruz. İzin vermezsen istatistik çerezi yazılmaz. <a href="/gizlilik/" style="color:#ffb27a">Gizlilik ve çerezler</a></p><div style="display:flex;gap:8px"><button type="button" data-v="evet" style="flex:1;height:38px;border-radius:999px;border:1px solid #fff;background:#fff;color:#141414;font-weight:700;cursor:pointer">Kabul et</button><button type="button" data-v="hayir" style="flex:1;height:38px;border-radius:999px;border:1px solid #fff;background:#fff;color:#141414;font-weight:700;cursor:pointer">Reddet</button></div></div><script>(function(){var b=document.getElementById('cerez'),K='am-cerez';function al(){try{return localStorage.getItem(K)}catch(e){return null}}if(!al())b.hidden=false;b.querySelectorAll('button').forEach(function(x){x.addEventListener('click',function(){var v=x.getAttribute('data-v');try{localStorage.setItem(K,v)}catch(e){}b.hidden=true;if(window.gtag)gtag('consent','update',{analytics_storage:v==='evet'?'granted':'denied'})})});document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-cerez-ac]')){e.preventDefault();b.hidden=false}})})();</script>` : '';
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
<link rel="manifest" href="/site.webmanifest">
<link rel="apple-touch-icon" href="/assets/app/apple-touch-icon.png">
<meta name="apple-mobile-web-app-title" content="${cfg.name}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preload" href="/assets/fonts/league-spartan-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/questrial-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<script>try{var t=localStorage.getItem('amorti-tema');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
<link rel="stylesheet" href="/assets/style.css?v=${V.css}">${tasarim === 'gazeta' ? `\n<link rel="stylesheet" href="/assets/gazeta.css?v=${V.gz}">` : ''}${tasarim === 'qurno' ? `\n<link rel="stylesheet" href="/assets/qurno.css?v=${V.qz}">` : ''}
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
${ga}
</head>
<body${tasarim === 'gazeta' ? ' class="gz"' : tasarim === 'qurno' ? ' class="qz"' : ''}>
${tasarim === 'gazeta' ? gzHeader(active) : tasarim === 'qurno' ? qzHeader(active) : `<header class="masthead">
  <div class="wrap mast-top">
    <div class="mast-date">${bugun}</div>
    <a class="logo" href="/" aria-label="${cfg.name} anasayfa"><span class="logo-row">${logoMark.replace('width="30" height="30"', 'width="36" height="36"')}<span class="logo-name">${cfg.name.toLowerCase()}</span></span><span class="logo-tag">Emlak haberleri ve hesaplama araçları</span></a>
    <div class="mast-side"><a href="/kira-paylas/">Kiranı paylaş</a><button type="button" class="theme-btn" aria-label="Koyu ve açık mod arasında geç" title="Koyu / açık mod"><svg class="i-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="i-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button></div>
  </div>
  <nav class="catnav" aria-label="Kategoriler"><div class="wrap">
    ${navItems.map((n) => (n === 'sep' ? '<span class="sep" aria-hidden="true"></span>' : `<a href="${n[0]}"${active === n[0] ? ' aria-current="page"' : ''}>${n[1]}</a>`)).join('')}
  </div></nav>
  ${ticker()}
</header>`}
<main>
${body}
</main>
${tasarim === 'gazeta' ? gzFooter() : tasarim === 'qurno' ? qzFooter() : `<footer class="site-foot">
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
        <li><a href="/sehirler/">Şehir ve bölge rehberleri</a></li>
        <li><a href="/haberler/">Emlak haberleri</a></li>
        <li><a href="/kira-paylas/">Kiranı paylaş</a></li>
        <li><a href="/kunye/">Künye</a></li>${cfg.ga4 ? '<li><a href="#" data-cerez-ac>Çerez tercihleri</a></li>' : ''}
        <li><a href="/gizlilik/">Gizlilik ve KVKK</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap"><p class="small" style="margin:24px 0 0">© 2026 ${cfg.name}. Yayıncı: ${cfg.publisher}</p></div>
</footer>`}
<script>window.AMORTI_ENF=${JSON.stringify(enf.yol)};window.AMORTI_ILAN=${ILAN_CFG};</script>
<script src="/assets/app.js?v=${V.js}" defer></script>
${cerezBandi}
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
const meta = (h) => `<div class="meta">${catLink(h)}${h.sehirler.filter((x) => ilBul(x)).map((x) => `<a class="sehir-etiket" href="/${x}/">${ilBul(x).ad}</a>`).join('')}<span>${h.tarihMetin}</span></div>`;
const newsItem = (h) => `<li class="with-thumb"><a class="thumb" href="/haberler/${h.slug}/" tabindex="-1" aria-hidden="true">${img(h)}</a><div>${meta(h)}<h3><a href="/haberler/${h.slug}/">${esc(h.baslik)}</a></h3><p>${esc(h.ozet)}</p></div></li>`;
const toolList = (list = tools) => `<ul class="tool-list">${list.map((t) => `<li><a href="/araclar/${t.slug}/"><span class="tool-icon">${t.icon}</span><span><h3>${t.menu}</h3><p>${t.kisa}</p></span></a></li>`).join('')}</ul>`;
const ILAN_CFG = JSON.stringify({ odalar: ilanAra.odalar, yaslar: ilanAra.yaslar, tipler: ilanAra.tipler, semtler: ilanAra.semtler, iller: Object.fromEntries(iller.map((il) => [il.slug, { ad: il.ad, b: il.bulunma, i: il.ilceler.map((x) => [x.slug, x.ad, x.grup]) }])) });
const rehberUrl = (r) => `/${r.il}/${r.slug}/`;
const ilceGrid = (il, except, filtre = () => true) => `<div class="ilce-grid">${rehberler.filter((r) => r.il === il && r.slug !== except && filtre(r)).map((r) => `<a href="${rehberUrl(r)}">${r.ad}</a>`).join('')}</div>`;
// İl ve ilçe seçimi (ilan araması ve kira paylaşımı)
const ilSecenek = (sec = 'istanbul') => iller.map((il) => `<option value="${il.slug}"${il.slug === sec ? ' selected' : ''}>${il.ad}</option>`).join('');
const ilceSecenek = (ilSlug = 'istanbul', sec = '') => { const il = ilBul(ilSlug); const gr = [...new Set(il.ilceler.map((x) => x.grup))]; return gr.map((g) => `<optgroup label="${g}">${il.ilceler.filter((x) => x.grup === g).map((x) => `<option value="${x.slug}"${x.slug === sec ? ' selected' : ''}>${x.ad}</option>`).join('')}</optgroup>`).join(''); };
const tipChips = (sec = 'daire') => `<div class="chips" role="radiogroup" aria-label="Konut tipi">${ilanAra.tipler.map((t) => `<label class="chip"><input type="radio" name="tip" value="${t.k}"${t.k === sec ? ' checked' : ''}><span>${t.ad}</span></label>`).join('')}</div>`;
const sehirKartlari = () => `<div class="sehir-grid">${iller.filter((il) => il.tur === 'buyuk').map((il) => `<a class="sehir-kart" href="/${il.slug}/"><b>${il.ad}</b><span>${rehberler.filter((r) => r.il === il.slug).length} ilçe rehberi</span></a>`).join('')}</div>
<h3 class="yazlik-baslik">Yazlık bölgeler</h3>
<div class="ilce-grid">${rehberler.filter((r) => r.yazlik).map((r) => `<a href="${rehberUrl(r)}">${r.ad}<small>${ilBul(r.il).ad}</small></a>`).join('')}</div>`;
const sidebar = () => `<aside>${ad('mrec')}<div class="box"><h3>Diğer araçlar</h3>${toolList()}</div></aside>`;

// ---------- temizle ve varlıkları kopyala ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.cpSync(path.join(__dirname, 'src/assets'), path.join(OUT, 'assets'), { recursive: true });
for (const h of haberler) h.kapak = `/haberler/${h.slug}/` + kapakYaz(h, path.join(OUT, 'haberler', h.slug));
const img = (h, cls = '', lazy = true) => `<img class="${cls}" src="${h.kapak}" alt="${esc((h.gorsel && h.gorsel.etiket) || h.baslik)}" width="1200" height="630"${lazy ? ' loading="lazy"' : ''}>`;
fs.writeFileSync(path.join(OUT, 'favicon.svg'), logoMark.replace('aria-hidden="true"', 'xmlns="http://www.w3.org/2000/svg"').replace(/var\(--accent\)/g, '#E85D04'));

// ---------- Uygulama (PWA): manifest, service worker, çevrimdışı sayfası ----------
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({
  id: '/', name: `${cfg.name}: Emlak haberleri ve hesaplama araçları`, short_name: cfg.name,
  description: 'Emlak haberleri, kira artış ve amortisman hesaplama, konut kredisi faizleri ve ilan sitelerinde hazır arama.',
  lang: 'tr', dir: 'ltr', start_url: '/?kaynak=uygulama', scope: '/', display: 'standalone', orientation: 'portrait',
  background_color: '#ffffff', theme_color: '#E85D04', categories: ['finance', 'news', 'lifestyle', 'utilities'],
  icons: [
    { src: '/assets/app/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/assets/app/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/assets/app/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'İlan ara', url: '/ilan-ara/', icons: [{ src: '/assets/app/icon-192.png', sizes: '192x192' }] },
    { name: 'Kira artışı hesapla', url: '/araclar/kira-artis-hesaplama/', icons: [{ src: '/assets/app/icon-192.png', sizes: '192x192' }] },
    { name: 'Kredi faizleri', url: '/konut-kredisi-faiz-oranlari/', icons: [{ src: '/assets/app/icon-192.png', sizes: '192x192' }] },
    { name: 'Amortisman hesapla', url: '/araclar/amortisman-hesaplama/', icons: [{ src: '/assets/app/icon-192.png', sizes: '192x192' }] },
  ],
}, null, 2));
fs.writeFileSync(path.join(OUT, 'sw.js'), fs.readFileSync(path.join(__dirname, 'src/sw.js'), 'utf8').replace('__SURUM__', `${V.css}-${V.js}`));

// ---------- Anasayfa: solda haberler, sağda alt alta hesaplama araçları ----------
const tr1 = (n) => n.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const hidden = (o) => Object.entries(o).map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`).join('');
const miniField = (name, label, o = {}) => `<div class="field"><label for="${o.id}">${label}</label><div class="input"><input id="${o.id}" name="${name}" type="text" inputmode="decimal" autocomplete="off"${o.money ? ' data-money' : ''} value="${o.value ?? ''}" class="has-unit"><span class="unit">${o.unit}</span></div></div>`;
const wHead = (href, icon, title) => `<div class="w-head"><span class="tool-icon">${icon}</span><h3><a href="${href}">${title}</a></h3></div>`;

const widgets = `
<form class="calc mini" data-tool="kira-artis" novalidate>
  ${wHead('/araclar/kira-artis-hesaplama/', icons.up, 'Kiran ne kadar artacak?')}
  ${miniField('kira', 'Şu anki kiran', { id: 'w-kira', unit: 'TL', money: true, value: '30.000' })}
  <div class="field"><label for="w-ay">Sözleşme yenileme ayı</label><div class="input"><select id="w-ay" name="ay">${oranlar.slice(0, 6).map((o, i) => `<option value="${o.oran}"${i === 0 ? ' selected' : ''}>${o.ay} (%${tr2(o.oran)})</option>`).join('')}</select></div></div>
  <div class="result" aria-live="polite" hidden><span class="small">Yeni kiran en fazla</span><div class="mid" data-out="yeni">–</div><span class="small">Aylık artış: <span data-out="artis"></span></span></div>
</form>
<form class="calc mini" data-tool="amortisman" novalidate>
  ${wHead('/araclar/amortisman-hesaplama/', icons.hourglass, 'Ev kaç yılda kendini öder?')}
  ${miniField('fiyat', 'Satış fiyatı', { id: 'w-fiyat', unit: 'TL', money: true, value: '6.500.000' })}
  ${miniField('kira', 'Alınabilecek aylık kira', { id: 'w-akira', unit: 'TL', money: true, value: '38.000' })}
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
  ${bankaSec({ limit: 4, etiket: 'Banka oranıyla hesapla' })}
  <div class="result" aria-live="polite" hidden><span class="small">Aylık taksit</span><div class="mid" data-out="taksit">–</div><span class="small">Toplam geri ödeme: <span data-out="toplam"></span></span></div>
</form>
<form class="calc mini ilan-ara ia-mini" data-tool="ilan-ara" novalidate>
  ${wHead('/ilan-ara/', icons.search, 'Ev mi arıyorsun?')}
  <div class="seg seg-full" role="radiogroup" aria-label="Satılık veya kiralık">
    <label><input type="radio" name="islem" value="satilik" checked><span>Satılık</span></label>
    <label><input type="radio" name="islem" value="kiralik"><span>Kiralık</span></label>
  </div>
  <div class="fields">
    <div class="field"><label for="w-ia-il">Şehir</label><div class="input"><select id="w-ia-il" name="il">${ilSecenek()}</select></div></div>
    <div class="field"><label for="w-ia-ilce">İlçe</label><div class="input"><select id="w-ia-ilce" name="ilce"><option value="">Tüm ilçeler</option>${ilceSecenek()}</select></div></div>
  </div>
  <span class="mini-label">Konut tipi</span>
  ${tipChips()}
  <span class="mini-label">Oda sayısı</span>
  <div class="chips">${ilanAra.odalar.slice(0, 4).map((o) => `<label class="chip"><input type="checkbox" name="oda" value="${o.k}"><span>${o.k}</span></label>`).join('')}</div>
  <div class="ia-sonuc" aria-live="polite">
    <p class="ia-ozet" data-out="ozet">Bir ilçe seç, üç sitede hazır arama çıksın.</p>
    <div class="ia-siteler" data-out="siteler"></div>
    <a class="small mini-more" href="/ilan-ara/">Fiyat ve bina yaşıyla detaylı ara</a>
  </div>
</form>
<form class="calc mini" data-tool="ilan-mini" novalidate>
  ${wHead('/araclar/ilan-firsat-mi/', icons.search, 'Bu ilan fırsat mı?')}
  ${miniField('fiyat', 'İlan fiyatı', { id: 'w-ilan-fiyat', unit: 'TL', money: true, value: '7.500.000' })}
  <span class="mini-label">Net m²</span>
  <div class="chips">${[75, 90, 110, 130, 160].map((m) => `<label class="chip"><input type="radio" name="m2" value="${m}"${m === 110 ? ' checked' : ''}><span>${m} m²</span></label>`).join('')}</div>
  <div class="result" aria-live="polite" hidden><span class="small">m² fiyatı</span><div class="mid" data-out="m2fiyat">–</div><span class="small">Bölgedeki benzer ilanlarla karşılaştırıp fırsat mı, pahalı mı gör.</span> <a class="small" data-out-href="detay" href="/araclar/ilan-firsat-mi/">Benzer ilanlarla karşılaştır</a></div>
</form>
<form class="calc mini" data-tool="kredi-kira" novalidate>
  ${wHead('/araclar/kredi-mi-kira-mi/', icons.scale, 'Kredi mi, kira mı?')}
  ${miniField('fiyat', 'Ev fiyatı', { id: 'w-kk-fiyat', unit: 'TL', money: true, value: '4.500.000' })}
  ${miniField('kira', 'Ödediğin aylık kira', { id: 'w-kk-kira', unit: 'TL', money: true, value: '45.000' })}
  <span class="mini-label">Peşinat</span>
  <div class="chips">${[10, 20, 30, 50].map((y) => `<label class="chip"><input type="radio" name="pesinYuzde" value="${y}"${y === 50 ? ' checked' : ''}><span>%${y}</span></label>`).join('')}</div>
  ${hidden({ faiz: String(faiz.tipik).replace('.', ','), vade: '120', fark: '0' })}
  <div class="result" aria-live="polite" hidden><span class="small">Aylık kredi taksiti</span><div class="mid" data-out="taksit">–</div><span data-out="verdict" class="verdict"></span> <a class="small" href="/araclar/kredi-mi-kira-mi/">Detaylı karşılaştır</a></div>
</form>
<div class="side-box faizler">
  <h3><a href="/konut-kredisi-faiz-oranlari/" style="color:inherit;text-decoration:none">Konut kredisi faizleri</a></h3>
  <ol>${faiz.olan.map((b) => `<li><button type="button" class="faiz-row" data-oran="${b.oran}" data-banka="${b.banka}" data-hedef="#w-faiz" title="${b.banka} oranıyla taksiti hesapla"><span class="bank-name">${bankLogo(b)}${b.banka}</span><b>%${tr2(b.oran)}</b></button></li>`).join('')}</ol>
  <p class="small muted" style="margin:8px 0 0">Bir bankaya dokun, taksitin yukarıda hesaplansın. Aylık oran, bankaların sitelerinden, ${faiz.sonKontrolMetin}. <a href="/konut-kredisi-faiz-oranlari/">Karşılaştırma tablosu</a></p>
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
    <div class="section-head"><h2>Şehir ve bölge rehberleri</h2><a href="/sehirler/">Tümü</a></div>
    ${sehirKartlari()}
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

// ---------- Tasarım önizlemesi (Gazeta düzeni): /onizleme/ ----------
const temaBtn = '<button type="button" class="theme-btn" aria-label="Koyu ve açık mod arasında geç" title="Koyu / açık mod"><svg class="i-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="i-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>';
function gzHeader(active) {
  return `<header class="gz-head">
  <div class="gz-top"><div class="wrap"><span class="gz-date">${bugun}</span><span class="gz-top-r"><a href="/kira-paylas/">Kiranı paylaş</a><a href="/ilan-ara/">İlan ara</a>${temaBtn}</span></div></div>
  <div class="wrap gz-brand">
    <a class="logo" href="/" aria-label="${cfg.name} anasayfa"><span class="logo-row">${logoMark.replace('width="30" height="30"', 'width="44" height="44"')}<span class="logo-name">${cfg.name.toLowerCase()}</span></span><span class="logo-tag">Emlak haberleri ve hesaplama araçları</span></a>
    <div class="gz-adslot" aria-hidden="true"><span>Reklam alanı · 728×90</span></div>
  </div>
  <nav class="gz-nav" aria-label="Kategoriler"><div class="wrap">
    ${navItems.filter((n) => n !== 'sep').map((n) => `<a href="${n[0]}"${active === n[0] ? ' aria-current="page"' : ''}>${n[1]}</a>`).join('')}
  </div></nav>
  ${ticker()}
</header>`;
}
function gzFooter() {
  return `<footer class="gz-foot">
  <div class="wrap gz-foot-grid">
    <div><div class="gz-foot-title">Hesaplama araçları</div><ul>${tools.map((t) => `<li><a href="/araclar/${t.slug}/">${t.menu}</a></li>`).join('')}<li><a href="/ilan-ara/">İlan sitelerinde hazır arama</a></li></ul></div>
    <div><div class="gz-foot-title">Şehirler</div><ul>${iller.filter((i) => i.tur === 'buyuk').map((i) => `<li><a href="/${i.slug}/">${i.ad}</a></li>`).join('')}<li><a href="/sehirler/">Yazlık bölgeler</a></li></ul></div>
    <div><div class="gz-foot-title">Kategoriler</div><div class="gz-tags">${KATEGORILER.map(([sl, a]) => `<a href="/haberler/kategori/${sl}/">${a}</a>`).join('')}<a href="/konut-kredisi-faiz-oranlari/">Kredi faizleri</a></div></div>
    <div><div class="gz-foot-title">${cfg.name}</div><p>${cfg.tagline}. Hesaplamalar bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</p><ul><li><a href="/kunye/">Künye</a></li><li><a href="/gizlilik/">Gizlilik ve KVKK</a></li></ul></div>
  </div>
  <div class="gz-foot-bottom"><div class="wrap"><span class="gz-foot-logo">${logoMark}<b>${cfg.name.toLowerCase()}</b></span><p>© 2026 ${cfg.name}. Yayıncı: ${cfg.publisher}</p></div></div>
</footer>`;
}
{
  const kutuBaslik = (t, href) => `<div class="gz-boxtitle"><h2>${href ? `<a href="${href}">${t}</a>` : t}</h2></div>`;
  const rozet = (h) => `<span class="gz-badge">${h.kategori}</span>`;
  const sol = haberler.slice(5, 13);
  const kat = (ad) => haberler.filter((h) => h.kategori === ad);
  const blok = (ad, sl) => { const l = kat(ad); if (l.length < 2) return ''; const [b, ...d] = l; return `${kutuBaslik(ad, `/haberler/kategori/${sl}/`)}
    <div class="gz-blok"><a class="gz-blok-big" href="/haberler/${b.slug}/">${img(b)}<span class="gz-blok-cap">${esc(b.baslik)}</span></a>
    <div class="gz-blok-list"><article><div class="gz-date-s">${b.tarihMetin}</div><p>${esc(b.ozet)}</p></article>${d.slice(0, 3).map((h) => `<a href="/haberler/${h.slug}/">${esc(h.baslik)}</a>`).join('')}</div></div>`; };
  write('/onizleme/', layout({
    title: 'Tasarım önizlemesi', description: 'Yeni tasarım önizlemesi', path: '/onizleme/', active: '/', noindex: true, tasarim: 'gazeta',
    body: `<div class="wrap gz-home">
  <aside class="gz-left" aria-label="Son haberler">
    ${kutuBaslik('Son haberler')}
    <ul class="gz-latest">${sol.map((h) => `<li><a class="gz-cat" href="/haberler/kategori/${katSlug(h.kategori)}/">${h.kategori}</a><span class="gz-date-s">${h.tarihMetin}</span><a class="gz-t" href="/haberler/${h.slug}/">${esc(h.baslik)}</a></li>`).join('')}</ul>
    <a class="gz-btn" href="/haberler/">Tüm haberler</a>
    <div class="gz-side-ad" aria-hidden="true"><span>Reklam alanı<br>160×600</span></div>
  </aside>
  <div class="gz-center">
    ${lead ? `<article class="gz-lead"><a href="/haberler/${lead.slug}/">${img(lead, '', false)}<span class="gz-lead-cap">${rozet(lead)}<span class="gz-date-s">${lead.tarihMetin}</span><span class="gz-lead-t">${esc(lead.baslik)}</span></span></a></article>` : ''}
    ${kutuBaslik('Öne çıkan haberler', '/haberler/')}
    <div class="gz-cards">${rest.slice(0, 4).map((h) => `<article class="gz-card"><a class="gz-card-img" href="/haberler/${h.slug}/" tabindex="-1" aria-hidden="true">${img(h)}${rozet(h)}</a><h3><a href="/haberler/${h.slug}/">${esc(h.baslik)}</a></h3><div class="gz-date-s">${h.tarihMetin}</div><p>${esc(h.ozet)}</p></article>`).join('')}</div>
    ${blok('Kira', 'kira')}
    ${blok('Konut fiyatları', 'konut-fiyatlari')}
    ${kutuBaslik('Şehir ve bölge rehberleri', '/sehirler/')}
    ${sehirKartlari()}
  </div>
  <aside class="gz-right" aria-label="Hesaplama araçları">
    ${kutuBaslik('Hesaplama araçları', '/araclar/')}
    ${widgets}
  </aside>
</div>`,
  }));
}

// ---------- Tasarım önizlemesi 2 (Qurno düzeni, sade): /onizleme-2/ ----------
function qzHeader(active) {
  const menu = [['/', 'Gündem'], ['/haberler/kategori/kira/', 'Kira'], ['/haberler/kategori/konut-fiyatlari/', 'Konut fiyatları'], ['/haberler/kategori/kredi/', 'Kredi'], ['/konut-kredisi-faiz-oranlari/', 'Faizler'], ['/araclar/', 'Araçlar'], ['/sehirler/', 'Şehirler']];
  return `<header class="qz-head"><div class="wrap qz-head-in">
  <a class="logo" href="/" aria-label="${cfg.name} anasayfa"><span class="logo-row">${logoMark.replace('width="30" height="30"', 'width="28" height="28"')}<span class="logo-name">${cfg.name.toLowerCase()}</span></span></a>
  <nav class="qz-nav" aria-label="Menü">${menu.map((n) => `<a href="${n[0]}"${active === n[0] ? ' aria-current="page"' : ''}>${n[1]}</a>`).join('')}</nav>
  <div class="qz-head-r"><a class="qz-ara" href="/ilan-ara/"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>Ev ara</a>${temaBtn}</div>
</div></header>`;
}
function qzFooter() {
  return `<footer class="qz-foot"><div class="wrap qz-foot-in">
  <span>© 2026 ${cfg.name}. Yayıncı: ${cfg.publisher}</span>
  <nav><a href="/kunye/">Künye</a><span>|</span><a href="/gizlilik/">Gizlilik ve KVKK</a><span>|</span><a href="/kira-paylas/">Kiranı paylaş</a></nav>
</div></footer>`;
}
{
  const takvim = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/></svg>';
  const baslik = (t) => `<h2 class="qz-title"><span>${t}</span></h2>`;
  const kart = (h) => `<article class="qz-card">
    <a class="qz-card-img" href="/haberler/${h.slug}/" tabindex="-1" aria-hidden="true">${img(h)}</a>
    <div class="qz-meta">${takvim}<span>${h.tarihMetin}</span></div>
    <h3><a href="/haberler/${h.slug}/">${esc(h.baslik)}</a></h3>
    <p>${esc(h.ozet)}</p>
    <div class="qz-tags"><a href="/haberler/kategori/${katSlug(h.kategori)}/">${h.kategori}</a>${h.sehirler.filter((x) => ilBul(x)).map((x) => `<a href="/${x}/">${ilBul(x).ad}</a>`).join('')}</div>
  </article>`;
  write('/onizleme-2/', layout({
    title: 'Tasarım önizlemesi 2', description: 'Sade tasarım önizlemesi', path: '/onizleme-2/', active: '/', noindex: true, tasarim: 'qurno',
    body: `<section class="qz-hero"><div class="wrap">
  <p class="qz-hero-t">Ev alırken ve kiralarken <span>hesabı netleştir.</span></p>
  <p class="qz-hero-s">Güncel emlak haberleri, bankaların konut kredisi faizleri ve tek tıkla hesaplama araçları.</p>
  <div class="qz-hero-btns"><a class="qz-btn" href="/araclar/kira-artis-hesaplama/">Kira artışını hesapla</a><a class="qz-btn qz-btn-o" href="/ilan-ara/">İlan sitelerinde ara</a></div>
</div></section>
<div class="wrap qz-home">
  <div class="qz-main">
    ${baslik('Son haberler')}
    <div class="qz-grid">${haberler.slice(0, 8).map(kart).join('')}</div>
    <p style="text-align:center;margin:10px 0 0"><a class="qz-btn" href="/haberler/">Tüm haberler</a></p>
  </div>
  <aside class="qz-side" aria-label="Hesaplama araçları">
    <div class="qz-side-title">Hesaplama araçları</div>
    ${widgets}
  </aside>
</div>
<section class="qz-sehir"><div class="wrap">
  ${baslik('Şehir ve bölge rehberleri')}
  ${sehirKartlari()}
</div></section>`,
  }));
}

// ---------- Hazır ilan araması ----------
function ilanAraForm({ il = 'istanbul', ilce = '' } = {}) {
  const fiyatChips = (tur) => ilanAra.fiyatlar[tur].map(([a, b, ad]) => `<button type="button" class="chip" data-fiyat="${a}-${b}" data-tur="${tur}"${tur === 'kiralik' ? ' hidden' : ''}>${ad}</button>`).join('');
  return `<form class="calc ilan-ara" data-tool="ilan-ara" novalidate>
  <input type="hidden" name="semt" value="">
  <div class="ia-row">
    <span class="ia-label" id="ia-islem">Ne arıyorsun?</span>
    <div class="seg" role="radiogroup" aria-labelledby="ia-islem">
      <label><input type="radio" name="islem" value="satilik" checked><span>Satılık</span></label>
      <label><input type="radio" name="islem" value="kiralik"><span>Kiralık</span></label>
    </div>
  </div>
  <div class="fields">
    <div class="field"><label for="ia-il">Şehir</label><div class="input"><select id="ia-il" name="il">${ilSecenek(il)}</select></div></div>
    <div class="field"><label for="ia-ilce">İlçe</label><div class="input"><select id="ia-ilce" name="ilce"><option value="">Tüm ilçeler</option>${ilceSecenek(il, ilce)}</select></div></div>
  </div>
  <div class="ia-row">
    <span class="ia-label">Konut tipi</span>
    ${tipChips()}
  </div>
  <div class="ia-row">
    <span class="ia-label">Fiyat aralığı</span>
    <div class="chips">${fiyatChips('satilik')}${fiyatChips('kiralik')}</div>
    <div class="fields ia-fiyat">
      ${field('min', 'En az', { id: 'ia-min', unit: 'TL', money: true, placeholder: 'Alt sınır yok' })}
      ${field('max', 'En fazla', { id: 'ia-max', unit: 'TL', money: true, placeholder: 'Üst sınır yok' })}
    </div>
  </div>
  <div class="ia-row">
    <span class="ia-label" id="ia-oda">Oda sayısı <span class="muted small">(birden fazla seçebilirsin)</span></span>
    <div class="chips" role="group" aria-labelledby="ia-oda">${ilanAra.odalar.map((o) => `<label class="chip"><input type="checkbox" name="oda" value="${o.k}"><span>${o.k}</span></label>`).join('')}</div>
  </div>
  <div class="ia-row">
    <span class="ia-label" id="ia-yas">Bina yaşı</span>
    <div class="chips" role="radiogroup" aria-labelledby="ia-yas">${ilanAra.yaslar.map((y, i) => `<label class="chip"><input type="radio" name="yas" value="${y.k}"${i === 0 ? ' checked' : ''}><span>${y.ad}</span></label>`).join('')}</div>
  </div>
  <div class="ia-sonuc" aria-live="polite">
    <p class="ia-ozet" data-out="ozet">Aramaya başlamak için bir ilçe seç.</p>
    <div class="ia-siteler" data-out="siteler"></div>
    <p class="note">Linkler seçtiğin filtrelerle ilgili sitenin arama sayfasını yeni sekmede açar. ${cfg.name}'nin bu sitelerle ticari bir ilişkisi yoktur; ilanlar ve fiyatlar o sitelere aittir.</p>
  </div>
</form>`;
}

{
  const P = '/ilan-ara/';
  const c = [['/', 'Anasayfa'], [P, 'İlan ara']];
  write(P, layout({
    title: 'Satılık ve kiralık ev ara: sahibinden, Hepsiemlak ve Emlakjet için hazır arama',
    description: 'İstanbul, İzmir, Ankara, Bursa, Antalya ve yazlık bölgelerde daire, rezidans, villa, müstakil ev ve yazlık için şehir, ilçe, fiyat, oda sayısı ve bina yaşını seç; sahibinden, Hepsiemlak ve Emlakjet\'te hazır aramaya tek tıkla git.',
    path: P, active: P,
    jsonld: [crumbLd(c), { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Hazır ilan araması', url: abs(P), applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }, inLanguage: 'tr' }],
    body: `<div class="wrap page">
${crumbs(c)}
<div class="layout">
  <div>
    <h1>İlan sitelerinde hazır arama</h1>
    <p class="lede">Ne aradığını bir kez seç; sahibinden, Hepsiemlak ve Emlakjet'te aynı filtrelerle açılan aramalara tek tıkla git. Her sitede filtreleri baştan girmekle uğraşma.</p>
    ${ilanAraForm()}
    <div class="prose" style="margin-top:32px">
      <h2>İlanı bulduktan sonra</h2>
      <p>Beğendiğin bir ilanın fiyatı bölgeye göre makul mü, ${''}<a href="/araclar/ilan-firsat-mi/">ilan fırsat mı</a> aracıyla benzer ilanlarla karşılaştır. Yatırım için bakıyorsan <a href="/araclar/amortisman-hesaplama/">amortisman hesabı</a>, krediyle alacaksan <a href="/araclar/konut-kredisi-hesaplama/">konut kredisi hesaplama</a> işine yarar.</p>
    </div>
  </div>
  <aside><div class="box"><h3>Hesaplama araçları</h3>${toolList()}</div></aside>
</div></div>
`,
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
<thead><tr><th>Banka</th><th>Aylık faiz</th><th>2 milyon TL, 120 ay taksit</th><th>Koşul</th><th>Son kontrol</th><th></th></tr></thead>
<tbody>
${faiz.olan.map((b, i) => `<tr${i === 0 ? ' class="current"' : ''}><td class="c-banka"><div class="bank-cell">${bankLogo(b)}<span><a href="${b.url}" rel="nofollow noopener" target="_blank">${b.banka}</a><span class="small muted">${b.urun}</span></span></div></td><td class="num c-oran" data-label="Aylık faiz"><b>%${tr2(b.oran)}</b></td><td class="num c-taksit" data-label="2 milyon TL, 120 ay">${tl0(taksit(b.oran))}</td><td class="small c-kosul">${b.kosul}</td><td class="small muted c-kontrol">${b.kontrolMetin}</td><td class="c-btn"><button type="button" class="btn-hesapla" data-oran="${b.oran}" data-banka="${b.banka}" data-hedef="#k-faiz">Hesapla</button></td></tr>`).join('\n')}
${faiz.bekleyen.map((b) => `<tr><td><a href="${b.url}" rel="nofollow noopener" target="_blank">${b.banka}</a><span class="small muted">${b.urun}</span></td><td colspan="5" class="small muted">Oran henüz alınamadı. Güncel oran için bankanın sayfasına bak.</td></tr>`).join('\n')}
</tbody></table></div>
<p class="small muted">Banka logoları ilgili bankaların tescilli markalarıdır; ${cfg.name}'nin bankalarla ticari ilişkisi yoktur. Taksit, ilk konutunu alanlar için (BSMV'siz) eşit taksitli formülle hesaplanmıştır; dosya masrafı, ekspertiz ve sigorta dahil değildir. Oranlar bankaların ilan ettiği oranlardır, sana özel teklif farklı olabilir.</p>
${ad('mobile')}
<h2 style="margin-top:32px" id="hesapla">Taksitini hesapla</h2>
${kf.form()}
<div class="prose faq" style="margin-top:32px"><h2>Sık sorulanlar</h2>${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
</div>${sidebar()}</div></div>`,
  }));
}

// ---------- Şehirler ve ilçe rehberleri ----------
// Şehrin kendi haberleri önce; az ise Türkiye geneli haberlerle tamamlanır.
const sehirHaberleri = (ilSlug, ilceSlug, n = 6) => {
  const kendi = haberler.filter((h) => h.sehirler.includes(ilSlug));
  if (ilceSlug) kendi.sort((x, y) => (y.ilceler.includes(ilceSlug) ? 1 : 0) - (x.ilceler.includes(ilceSlug) ? 1 : 0));
  return [...kendi, ...haberler.filter((h) => h.sehirler.includes('turkiye'))].slice(0, n);
};
const ilanButonlari = (il, ilce, ad, tip = '', semt = '') => `<div class="ilce-ilan">
      <span><b>${bulunma(ad)} ev mi arıyorsun?</b> Konut tipi, fiyat, oda ve bina yaşını seç; üç ilan sitesinde hazır aramaya git.</span>
      <span class="ilce-ilan-btns"><a class="btn" href="/ilan-ara/?il=${il}${ilce ? `&amp;ilce=${ilce}` : ''}${tip ? `&amp;tip=${tip}` : ''}${semt ? `&amp;semt=${semt}` : ''}">Satılık ara</a><a class="btn btn-ghost" href="/ilan-ara/?il=${il}${ilce ? `&amp;ilce=${ilce}` : ''}${tip ? `&amp;tip=${tip}` : ''}${semt ? `&amp;semt=${semt}` : ''}&amp;islem=kiralik">Kiralık ara</a></span>
    </div>`;

write('/sehirler/', layout({
  title: 'Şehir ve yazlık bölge rehberleri: İstanbul, İzmir, Ankara, Bursa, Antalya',
  description: 'İstanbul, İzmir, Ankara, Bursa ve Antalya ilçeleri ile Bodrum, Çeşme, Alaçatı, Fethiye, Alanya gibi yazlık bölgelerde ev alırken ve kiralarken bilmen gerekenler.',
  path: '/sehirler/', active: '/sehirler/',
  jsonld: [crumbLd([['/', 'Anasayfa'], ['/sehirler/', 'Şehirler']])],
  body: `${adTop()}<div class="wrap page">${crumbs([['/', 'Anasayfa'], ['/sehirler/', 'Şehirler']])}
<h1>Şehir ve bölge rehberleri</h1>
<p class="lede">Büyük şehirlerin ilçelerinde ve sahildeki yazlık bölgelerde öne çıkan mahalleler, ulaşım, yatırım yaparken dikkat edilecekler, amortisman hesabı ve ilan sitelerinde hazır arama.</p>
${sehirKartlari()}
</div>`,
}));

for (const il of iller) {
  const P = `/${il.slug}/`;
  const c = [['/', 'Anasayfa'], ['/sehirler/', 'Şehirler'], [P, il.ad]];
  const reh = rehberler.filter((r) => r.il === il.slug);
  const gruplar = [...new Set(reh.map((r) => (r.yazlik ? 'Yazlık bölgeler' : r.grup || 'İlçe rehberleri')))];
  const hab = sehirHaberleri(il.slug);
  write(P, layout({
    title: `${il.ad} emlak rehberi: ilçeler, kiralar, amortisman ve haberler`,
    description: `${bulunma(il.ad)} ev alırken ve kiralarken: ilçe rehberleri, ${il.ad} emlak haberleri, kira artışı ve amortisman hesaplama, ilan sitelerinde hazır arama.`,
    path: P, active: '/sehirler/',
    jsonld: [crumbLd(c)],
    body: `${adTop()}<div class="wrap page">${crumbs(c)}
<div class="layout"><div>
<h1>${il.ad} emlak rehberi</h1>
<p class="lede">${il.ozet}</p>
${ilanButonlari(il.slug, '', il.ad)}
${gruplar.map((g) => `<h2 style="margin-top:28px">${g}</h2>${ilceGrid(il.slug, null, (r) => (r.yazlik ? 'Yazlık bölgeler' : r.grup || 'İlçe rehberleri') === g)}`).join('')}
${hab.length ? `<h2 style="margin-top:32px">${haberler.some((h) => h.sehirler.includes(il.slug)) ? `${il.ad} emlak haberleri` : 'Güncel emlak haberleri'}</h2><ul class="news-list">${hab.map(newsItem).join('')}</ul>` : ''}
<h2 style="margin-top:32px">${il.ad} ilçelerinde ilan ara</h2>
<p class="small muted">Rehberi olmayan ilçeler için de üç ilan sitesinde hazır aramaya gidebilirsin.</p>
<div class="ilce-grid ilce-grid-sm">${il.ilceler.map((x) => `<a href="/ilan-ara/?il=${il.slug}&amp;ilce=${x.slug}">${x.ad}</a>`).join('')}</div>
</div>${sidebar()}</div></div>`,
  }));

  for (const i of reh) {
    const p = rehberUrl(i);
    const cc = [['/', 'Anasayfa'], ['/sehirler/', 'Şehirler'], [P, il.ad], [p, i.ad]];
    const aramaIlce = i.bolge ? ilBul(il.slug).ilceler.find((x) => x.ad === i.bolge).slug : i.slug;
    const ilgili = sehirHaberleri(il.slug, i.slug, 3);
    const kardes = reh.filter((r) => r.slug !== i.slug && (r.yazlik ? 'y' : r.grup || '') === (i.yazlik ? 'y' : i.grup || ''));
    write(p, layout({
      title: `${i.ad} ${i.yazlik ? 'yazlık ' : ''}ev ve kira rehberi: mahalleler, ulaşım, amortisman`,
      description: `${bulunma(i.ad)} ev alırken ve kiralarken bilmen gerekenler: öne çıkan mahalleler, ulaşım, yatırımcı notları ve ${i.ad} için amortisman hesaplama.`,
      path: p, active: '/sehirler/',
      jsonld: [crumbLd(cc)],
      body: `${adTop()}<div class="wrap page">
${crumbs(cc)}
<div class="layout">
  <div>
    <h1>${i.ad} ${i.yazlik ? 'yazlık ' : ''}ev ve kira rehberi</h1>
    <p class="lede">${i.ozet}</p>
    ${ilanButonlari(il.slug, aramaIlce, i.ad, i.yazlik ? 'tum' : '', i.bolge && ilanAra.semtler.some((x) => x.k === i.slug) ? i.slug : '')}
    <h2 style="margin-top:28px">${bulunma(i.ad)} bir evin amortisman süresini hesapla</h2>
    ${amortismanForm({ heading: false, fiyat: '', kira: '', idPrefix: `${il.slug}-${i.slug}` })}

    <div class="box">
      <h3>${i.ad} ortalama kiraları</h3>
      <div class="empty">
        <p>Bu bölge için henüz yeterli kira paylaşımı yok. ${bulunma(i.ad)} kiracı veya ev sahibiysen, kirayı isimsiz paylaşarak ortalamanın oluşmasına katkı verebilirsin.</p>
        <p><a class="btn" href="/kira-paylas/?il=${il.slug}&amp;ilce=${aramaIlce}">${i.ad} için kira paylaş</a></p>
      </div>
    </div>
    ${ad('mobile')}

    <div class="prose">
      <h2>Öne çıkan ${i.yazlik ? 'bölgeler ve mahalleler' : 'mahalleler'}</h2>
      <ul class="pill-list">${i.mahalleler.map((m) => `<li>${m}</li>`).join('')}</ul>
      <h2>Ulaşım</h2>
      <ul>${i.ulasim.map((u) => `<li>${u}</li>`).join('')}</ul>
      <h2>Yatırım yaparken dikkat</h2>
      <ul>${i.notlar.map((n) => `<li>${n}</li>`).join('')}</ul>
      <p>Bir ilana bakıyorsan, aynı mahalledeki benzer ilanlarla karşılaştırmak için <a href="/araclar/ilan-firsat-mi/">bu ilan fırsat mı</a> aracını kullan.</p>
    </div>

    ${ilgili.length ? `<h2 style="margin-top:32px">İlgili haberler</h2><ul class="news-list">${ilgili.map(newsItem).join('')}</ul>` : ''}

    ${kardes.length ? `<h2 style="margin-top:32px">${il.ad} – ${i.yazlik ? 'diğer yazlık bölgeler' : i.grup ? `diğer ${i.grup.toLocaleLowerCase('tr')} ilçeleri` : 'diğer ilçeler'}</h2><div class="ilce-grid">${kardes.map((r) => `<a href="${rehberUrl(r)}">${r.ad}</a>`).join('')}</div>` : ''}
    <p style="margin-top:16px"><a href="${P}">${il.ad} emlak rehberine dön</a></p>
  </div>
  ${sidebar()}
</div></div>`,
    }));
  }
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
const tumKategoriler = [...KATEGORILER, ...[...new Set(haberler.map((h) => h.kategori))].filter((k) => !KATEGORILER.some(([, a]) => a === k)).map((k) => [katSlug(k), k])];
for (const [slug, ad] of tumKategoriler) {
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
    <div class="field"><label for="f-il">Şehir</label><div class="input"><select id="f-il" name="il" required data-il-sec="f-ilce">${ilSecenek()}</select></div></div>
    <div class="field"><label for="f-ilce">İlçe</label><div class="input"><select id="f-ilce" name="ilce" required><option value="">Seç</option>${ilceSecenek()}</select></div></div>
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
<script>try{var q=new URLSearchParams(location.search);window.AMORTI_ONSECIM={il:q.get('il'),ilce:q.get('ilce')};}catch(e){}</script>
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
<p><strong>Adres:</strong> ${cfg.address}</p>
<p><strong>MERSİS No:</strong> ${cfg.mersis}</p>
<p><strong>İletişim:</strong> <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a></p>
<p><strong>Yer sağlayıcı:</strong> ${cfg.hosting}</p>
<p>${cfg.name}, ev alma ve kiralama kararlarını kolaylaştırmak için hesaplama araçları, ilçe rehberleri ve emlak haberleri yayınlar. Sitedeki hesaplamalar bilgilendirme amaçlıdır ve yatırım tavsiyesi niteliği taşımaz; yatırım danışmanlığı yalnızca yetkili kuruluşlarca verilir.</p>
<h2>Düzeltme ve cevap hakkı</h2><p>Hakkınızda yer alan bir haber veya yorumla ilgili düzeltme ve cevap talebinizi, ilgili sayfanın adresini belirterek <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a> adresine gönderebilirsiniz. 5187 sayılı Basın Kanunu'na uygun talepler gecikmeksizin yayımlanır. Haberlerin yayın tarihleri her haberde gösterilir.</p>
<h2>Telif hakkı ve içerik bildirimi</h2><p>Hakkınızı ihlal ettiğini düşündüğünüz bir içerik varsa, sayfanın adresini ve hak sahipliğinizi gösteren bilgiyle <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a> adresine yazın. 5651 sayılı Kanun ve 5846 sayılı FSEK kapsamındaki bildirimleri inceler, haklı bulunan içeriği en geç 24 saat içinde yayından kaldırırız.</p></div>`,
}));

write('/gizlilik/', layout({
  title: 'Gizlilik ve KVKK aydınlatma metni', description: `${cfg.name} gizlilik politikası ve KVKK aydınlatma metni.`, path: '/gizlilik/',
  body: `<div class="wrap page prose"><h1>Gizlilik ve KVKK</h1>
<p>Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) 10. maddesi uyarınca, veri sorumlusu sıfatıyla ${cfg.publisher} ("Şirket"; adres: ${cfg.address}; MERSİS: ${cfg.mersis}) tarafından işletilen ${cfg.name} sitesinde kişisel verilerin nasıl işlendiğini açıklar.</p>
<h2>Hesaplama araçları</h2><p>Araçlara girdiğin rakamlar yalnızca tarayıcında işlenir, sunucularımıza gönderilmez ve saklanmaz.</p>
<h2>Kira paylaşım formu</h2><p>Formda ad, telefon veya adres gibi kimlik bilgisi istenmez. Paylaştığın ilçe, mahalle, kira, m² ve bina bilgileri isimsiz olarak saklanır ve yalnızca toplu istatistik (ortalama, ortanca) olarak yayınlanır. Form, barındırma hizmetimiz Netlify üzerinden iletilir ve orada saklanır.</p>
<h2>Teknik kayıtlar</h2><p>Siteyi görüntüleyebilmen için IP adresin ve tarayıcı bilgilerin teknik olarak barındırma hizmeti sağlayıcımıza iletilir; bu kayıtlar sağlayıcı tarafından güvenlik ve hizmetin sunulması amacıyla, kısa süreli tutulur (KVKK m.5/2-f, meşru menfaat). Yazı tipleri kendi sunucumuzdan yüklenir.</p>
<h2>Çerezler</h2><p>Zorunlu olmayan hiçbir çerez izin vermeden kullanılmaz. Ziyaret istatistikleri için Google Analytics kullanılırsa, yalnızca çerez bandında "Kabul et" seçersen analiz çerezi yazılır; izin vermezsen Google'a yalnızca sayfa adresi, zaman ve tarayıcı türü gibi seni tanımlamayan, çerezsiz sinyaller gönderilir. Tercihini sayfanın altındaki <a href="#" data-cerez-ac>Çerez tercihleri</a> bağlantısından değiştirebilirsin.</p>
<h2>Yurt dışına aktarım</h2><p>Site, yurt dışında bulunan hizmet sağlayıcıların altyapısında çalışır: barındırma ve form hizmeti Netlify (ABD), ziyaret istatistiği Google (İrlanda/ABD). Aktarımlar KVKK'nın 9. maddesine uygun olarak, yalnızca belirtilen amaçlarla ve gerektiği kadar yapılır.</p>
<h2>Haklarınız</h2><p>KVKK'nın 11. maddesi kapsamında kişisel verilerinin işlenip işlenmediğini öğrenme, bilgi talep etme, işlenme amacını öğrenme, aktarıldığı kişileri bilme, düzeltilmesini ya da silinmesini isteme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsin. Taleplerini <a href="mailto:${cfg.contactEmail}">${cfg.contactEmail}</a> adresine iletebilirsin; en geç 30 gün içinde yanıtlarız.</p>
<p class="small muted">Son güncelleme: ${cfg.updated}</p></div>`,
}));

write('/404.html', layout({
  title: 'Sayfa bulunamadı', description: 'Aradığın sayfa bulunamadı.', path: '/404.html', noindex: true,
  body: `<div class="wrap page"><div class="empty"><h1>Bu sayfa bulunamadı</h1><p>Adres değişmiş veya kaldırılmış olabilir. Araçlara ya da ilçe rehberlerine buradan ulaşabilirsin.</p><p><a class="btn" href="/araclar/">Araçlara git</a> <a class="btn secondary" href="/sehirler/">Şehir rehberleri</a></p></div></div>`,
}));

write('/offline/', layout({
  title: 'İnternet bağlantısı yok', description: 'Şu an çevrimdışısın.', path: '/offline/', noindex: true,
  body: `<div class="wrap page"><div class="empty"><h1>İnternet bağlantısı yok</h1><p>Bağlantın geri geldiğinde sayfa yenilenir. Daha önce açtığın sayfalar ve hesaplama araçları çevrimdışı da açılabilir.</p><p><button class="btn" type="button" onclick="location.reload()">Tekrar dene</button></p></div></div>`,
}));

// ---------- SEO dosyaları ----------
const indexable = urls.filter((u) => !['/tesekkurler/', '/404.html', '/offline/', '/onizleme/', '/onizleme-2/'].includes(u));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map((u) => `  <url><loc>${abs(u)}</loc></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /tesekkurler/\nDisallow: /onizleme/\nDisallow: /onizleme-2/\n\nSitemap: ${abs('/sitemap.xml')}\n`);
fs.writeFileSync(path.join(OUT, 'llms.txt'), `# ${cfg.name}

> ${cfg.tagline}. Türkiye'de ev alma, kiralama ve konut kredisi kararları için ücretsiz hesaplama araçları, İstanbul, İzmir, Ankara, Bursa, Antalya ve yazlık bölge rehberleri, emlak haberleri.

## Araçlar
${tools.map((t) => `- [${t.menu}](${abs(`/araclar/${t.slug}/`)}): ${t.kisa}`).join('\n')}

## Güncel veriler
- ${oranlar[0].ay} kira artış üst sınırı (TÜFE 12 aylık ortalama): %${tr2(oranlar[0].oran)}

## Şehir ve ilçe rehberleri
${iller.map((il) => `- [${il.ad}](${abs(`/${il.slug}/`)}): ${rehberler.filter((r) => r.il === il.slug).map((r) => `[${r.ad}](${abs(rehberUrl(r))})`).join(', ')}`).join('\n')}

## Haberler
${haberler.map((h) => `- [${h.baslik}](${abs(`/haberler/${h.slug}/`)})`).join('\n')}
`);

console.log(`Tamam: ${urls.length} sayfa -> dist/`);
