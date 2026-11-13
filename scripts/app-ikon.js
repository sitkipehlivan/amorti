// Uygulama ve PWA simgelerini üretir (bir kez çalıştırılır, çıktılar depoya girer).
//   node scripts/app-ikon.js
// Çıktılar: src/assets/app/*.png (site/PWA), app/resources/*.png (Capacitor: npx capacitor-assets generate)
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ORANGE = '#E85D04', INK = '#111318', WHITE = '#FFFFFF';
const ROOT = path.join(__dirname, '..');
const FONTS = ['LeagueSpartan-Bold.ttf'].map((f) => path.join(ROOT, 'fonts', f));

// Logo işareti 30x30 birimlik ızgarada: 6 dolu kare + 3 çerçeveli kare
const mark = (c) => `<g fill="${c}"><rect x="1" y="1" width="8" height="8" rx="1"/><rect x="11" y="1" width="8" height="8" rx="1"/><rect x="21" y="1" width="8" height="8" rx="1"/><rect x="1" y="11" width="8" height="8" rx="1"/><rect x="11" y="11" width="8" height="8" rx="1"/><rect x="1" y="21" width="8" height="8" rx="1"/></g><g fill="none" stroke="${c}" stroke-width="1.6"><rect x="21.8" y="11.8" width="6.4" height="6.4" rx="0.8"/><rect x="11.8" y="21.8" width="6.4" height="6.4" rx="0.8"/><rect x="21.8" y="21.8" width="6.4" height="6.4" rx="0.8"/></g>`;
const placed = (size, frac, c) => { const s = (size * frac) / 30, o = (size - size * frac) / 2; return `<g transform="translate(${o} ${o}) scale(${s})">${mark(c)}</g>`; };
const svg = (w, h, inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}${inner}</svg>`;
const png = (s, file) => {
  const out = new Resvg(s, { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'League Spartan' } }).render().asPng();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out);
  console.log(path.relative(ROOT, file), out.length);
};

// Uygulama simgesi: turuncu zemin, beyaz işaret
const ikon = (n) => svg(n, n, placed(n, 0.56, WHITE), ORANGE);
const maskable = (n) => svg(n, n, placed(n, 0.44, WHITE), ORANGE);
const A = path.join(ROOT, 'src/assets/app');
png(ikon(192), path.join(A, 'icon-192.png'));
png(ikon(512), path.join(A, 'icon-512.png'));
png(maskable(512), path.join(A, 'maskable-512.png'));
png(ikon(180), path.join(A, 'apple-touch-icon.png'));

// Capacitor kaynakları
const R = path.join(ROOT, 'app/resources');
png(ikon(1024), path.join(R, 'icon.png'));
png(svg(1024, 1024, placed(1024, 0.40, WHITE)), path.join(R, 'icon-foreground.png'));
png(svg(1024, 1024, '', ORANGE), path.join(R, 'icon-background.png'));
// Açılış ekranı: ortada işaret + "amorti"
const splash = (bg, fg) => {
  const S = 2732, m = 300, gap = 70, fs_ = 300;
  const textW = 853; // "amorti" genişliği (League Spartan Bold, 300px)
  const total = m + gap + textW, x0 = (S - total) / 2, y0 = (S - m) / 2;
  return svg(S, S, `<g transform="translate(${x0} ${y0}) scale(${m / 30})">${mark(ORANGE)}</g><text x="${x0 + m + gap}" y="${y0 + m * 0.84}" font-family="League Spartan" font-weight="700" font-size="${fs_}" fill="${fg}">amorti</text>`, bg);
};
png(splash(WHITE, INK), path.join(R, 'splash.png'));
png(splash('#0F1115', '#F3F4F6'), path.join(R, 'splash-dark.png'));
