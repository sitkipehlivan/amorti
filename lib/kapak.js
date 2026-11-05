// Haber kapak görseli (1200x630) üretici: haberin ön bilgisindeki "gorsel" alanlarından infografik çizer.
// Şablonlar: rakam, karsilastirma, seri, hat (gorsel alanı yoksa: baslik)
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const RENK = {
  'Kira': '#E85D04',
  'Konut fiyatları': '#0E8C7C',
  'Kredi': '#1F5FD6',
  'Piyasa': '#6A3DE8',
  'Ulaşım': '#D62F2F',
  'Mevzuat': '#111318',
  'Kentsel dönüşüm': '#8C5A23',
  'Projeler': '#0E8C7C',
};
const INK = '#111318', MUTED = '#5E6573', PAPER = '#F3F4F6', LINE = '#D9DCE1';
const DISPLAY = 'League Spartan', BODY = 'Questrial';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (s) => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));

// Kaba kelime kaydırma: karakter genişliğini fontSize*oran ile tahmin eder
function wrap(text, maxWidth, size, ratio = 0.53, maxLines = 3) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (next.length * size * ratio > maxWidth && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
  return lines;
}
const textLines = (lines, x, y, size, lh, attrs) =>
  `<text x="${x}" y="${y}" ${attrs}>${lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : size * lh}">${esc(l)}</tspan>`).join('')}</text>`;

function parseVeri(s) {
  return String(s || '').split(';').map((p) => p.trim()).filter(Boolean).map((p) => {
    const [k, v] = p.split('=').map((x) => x.trim());
    return { k, v, n: num(v) };
  });
}

// Sitenin imzası: "her kare bir yıl" ızgarası
function grid(x, y, cols, rows, size, gap, color, filled) {
  let out = '';
  let i = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) {
    const px = x + c * (size + gap), py = y + r * (size + gap);
    out += i < filled
      ? `<rect x="${px}" y="${py}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${color}"/>`
      : `<rect x="${px + 1.5}" y="${py + 1.5}" width="${size - 3}" height="${size - 3}" rx="${size * 0.2}" fill="none" stroke="${color}" stroke-opacity=".35" stroke-width="3"/>`;
  }
  return out;
}

function frame(h, color, inner) {
  const pillW = h.kategori.length * 15 + 44;
  const logo = `<g transform="translate(64,${H - 76}) scale(1.2)">${[[1, 1], [11, 1], [21, 1], [1, 11], [11, 11], [1, 21]].map(([x, y]) => `<rect x="${x}" y="${y}" width="8" height="8" rx="2" fill="${INK}"/>`).join('')}${[[21, 11], [11, 21], [21, 21]].map(([x, y]) => `<rect x="${x + 0.8}" y="${y + 0.8}" width="6.4" height="6.4" rx="1.6" fill="none" stroke="${INK}" stroke-width="1.6"/>`).join('')}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${PAPER}"/>
<rect x="0" y="0" width="${W}" height="12" fill="${color}"/>
<rect x="64" y="60" width="${pillW}" height="48" rx="4" fill="${color}"/>
<text x="${64 + pillW / 2}" y="92" text-anchor="middle" font-family="${DISPLAY}" font-size="25" font-weight="700" fill="#fff">${esc(h.kategori)}</text>
<text x="${64 + pillW + 20}" y="92" font-family="${BODY}" font-size="25" fill="${MUTED}">${esc(h.tarihMetin)}</text>
${inner}
<line x1="64" y1="${H - 100}" x2="${W - 64}" y2="${H - 100}" stroke="${LINE}" stroke-width="2"/>
${logo}
<text x="112" y="${H - 52}" font-family="${DISPLAY}" font-size="32" font-weight="700" fill="${INK}">amorti</text>
${h.kaynakDuz ? `<text x="${W - 64}" y="${H - 52}" text-anchor="end" font-family="${BODY}" font-size="22" fill="${MUTED}">Kaynak: ${esc(h.kaynakDuz.length > 60 ? h.kaynakDuz.slice(0, 58) + '…' : h.kaynakDuz)}</text>` : ''}
</svg>`;
}

const tpl = {
  rakam(h, g, color) {
    const big = g.rakam || '';
    const size = big.length > 8 ? 150 : 190;
    const etiket = wrap(g.etiket || h.baslik, 640, 42, 0.52, 2);
    const alt = g.alt ? wrap(g.alt, 640, 28, 0.52, 2) : [];
    return `<text x="60" y="${170 + size * 0.78}" font-family="${DISPLAY}" font-size="${size}" font-weight="700" fill="${color}" letter-spacing="-2">${esc(big)}</text>
${textLines(etiket, 64, 170 + size * 0.78 + 70, 42, 1.2, `font-family="${DISPLAY}" font-size="42" font-weight="700" fill="${INK}"`)}
${alt.length ? textLines(alt, 64, 170 + size * 0.78 + 70 + etiket.length * 50 + 18, 28, 1.3, `font-family="${BODY}" font-size="28" fill="${MUTED}"`) : ''}
${grid(840, 150, 5, 5, 52, 12, color, 17)}`;
  },

  karsilastirma(h, g, color) {
    const items = parseVeri(g.veri).slice(0, 5);
    const max = Math.max(...items.map((i) => i.n), 1);
    const title = wrap(g.etiket || h.baslik, 1072, 40, 0.52, 2);
    const top = 160 + title.length * 48 + 20;
    const rowH = Math.min(70, (H - 130 - top) / items.length);
    const barX = 300, barMax = 700;
    return `${textLines(title, 64, 170, 40, 1.2, `font-family="${DISPLAY}" font-size="40" font-weight="700" fill="${INK}"`)}
${items.map((it, i) => {
      const y = top + i * rowH;
      const w = Math.max(8, (it.n / max) * barMax);
      return `<text x="64" y="${y + rowH * 0.62}" font-family="${DISPLAY}" font-size="32" font-weight="700" fill="${INK}">${esc(it.k)}</text>
<rect x="${barX}" y="${y + rowH * 0.15}" width="${w}" height="${rowH * 0.6}" rx="3" fill="${color}" fill-opacity="${i === 0 ? 1 : 0.72}"/>
<text x="${barX + w + 16}" y="${y + rowH * 0.62}" font-family="${DISPLAY}" font-size="36" font-weight="700" fill="${INK}">${esc((g.birim === '%' ? '%' : '') + it.v + (g.birim && g.birim !== '%' ? ' ' + g.birim : ''))}</text>`;
    }).join('\n')}`;
  },

  seri(h, g, color) {
    const items = parseVeri(g.veri).slice(-12);
    const vals = items.map((i) => i.n);
    const max = Math.max(...vals), min = Math.min(...vals);
    const lo = min - (max - min) * 0.6 - 0.01;
    const last = items[items.length - 1];
    const title = wrap(g.etiket || h.baslik, 560, 34, 0.52, 3);
    const chartX = 640, chartW = 496, chartTop = 150, chartBottom = H - 160;
    const bw = chartW / items.length;
    return `<text x="60" y="${330}" font-family="${DISPLAY}" font-size="150" font-weight="700" fill="${color}" letter-spacing="-2">${esc(g.rakam || ((g.birim === '%' ? '%' : '') + last.v))}</text>
${textLines(title, 64, 410, 34, 1.25, `font-family="${DISPLAY}" font-size="34" font-weight="700" fill="${INK}"`)}
${items.map((it, i) => {
      const hgt = ((it.n - lo) / (max - lo)) * (chartBottom - chartTop);
      const x = chartX + i * bw + bw * 0.14;
      const isLast = i === items.length - 1;
      return `<rect x="${x}" y="${chartBottom - hgt}" width="${bw * 0.72}" height="${hgt}" rx="2" fill="${color}" fill-opacity="${isLast ? 1 : 0.3}"/>
<text x="${x + bw * 0.36}" y="${chartBottom + 30}" text-anchor="middle" font-size="19" fill="${isLast ? INK : MUTED}" font-family="${isLast ? DISPLAY : BODY}" font-weight="${isLast ? 700 : 400}">${esc(it.k)}</text>`;
    }).join('\n')}`;
  },

  hat(h, g, color) {
    const duraklar = String(g.duraklar || '').split(';').map((s) => s.trim()).filter(Boolean);
    const title = wrap(g.etiket || h.baslik, 1072, 40, 0.52, 2);
    const y = 400, x1 = 120, x2 = W - 120;
    const step = duraklar.length > 1 ? (x2 - x1) / (duraklar.length - 1) : 0;
    return `<text x="60" y="${250}" font-family="${DISPLAY}" font-size="120" font-weight="700" fill="${color}" letter-spacing="-2">${esc(g.rakam || '')}</text>
${textLines(title, 64, 310, 36, 1.2, `font-family="${DISPLAY}" font-size="36" font-weight="700" fill="${INK}"`)}
<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="14" stroke-linecap="round"/>
${duraklar.map((d, i) => {
      const x = x1 + i * step;
      return `<circle cx="${x}" cy="${y}" r="20" fill="#fff" stroke="${color}" stroke-width="8"/>
<text x="${x}" y="${y + 58}" text-anchor="middle" font-family="${DISPLAY}" font-size="28" font-weight="700" fill="${INK}">${esc(d)}</text>`;
    }).join('\n')}
${g.alt ? `<text x="${W / 2}" y="${y + 100}" text-anchor="middle" font-family="${BODY}" font-size="26" fill="${MUTED}">${esc(g.alt)}</text>` : ''}`;
  },

  baslik(h, g, color) {
    const t = wrap(h.baslik, 720, 58, 0.5, 4);
    return `${textLines(t, 64, 220, 58, 1.15, `font-family="${DISPLAY}" font-size="58" font-weight="700" fill="${INK}"`)}
${grid(880, 150, 4, 5, 52, 12, color, 11)}`;
  },
};

let Resvg = null;
try { ({ Resvg } = require('@resvg/resvg-js')); } catch (e) { /* PNG üretimi kapalı, SVG yine üretilir */ }
const FONTS = ['LeagueSpartan-Bold.ttf', 'LeagueSpartan-Medium.ttf', 'Questrial-Regular.ttf'].map((f) => path.join(__dirname, '..', 'fonts', f)).filter((f) => fs.existsSync(f));

function kapakSvg(h) {
  const g = h.gorsel || {};
  const color = RENK[h.kategori] || RENK.Kira;
  const t = tpl[g.tip] ? g.tip : 'baslik';
  return frame(h, color, tpl[t](h, g, color));
}

// dist içine kapak.png (ve yedek kapak.svg) yazar; sayfada kullanılacak yolu döner
function kapakYaz(h, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const svg = kapakSvg(h);
  fs.writeFileSync(path.join(outDir, 'kapak.svg'), svg);
  if (!Resvg) return 'kapak.svg';
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: BODY },
  }).render().asPng();
  fs.writeFileSync(path.join(outDir, 'kapak.png'), png);
  return 'kapak.png';
}

module.exports = { kapakSvg, kapakYaz, RENK };
