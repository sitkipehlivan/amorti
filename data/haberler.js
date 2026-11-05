// Haberler content/haberler/*.md dosyalarından okunur (yeni haber = yeni dosya).
// Dosya adı: YYYY-MM-DD-<slug>.md  ->  /haberler/<slug>/
// Biçim kuralları: docs/haber-botu.md
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'content', 'haberler');
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
      const ext = /^https?:\/\//.test(u);
      return `<a href="${u}"${ext ? ' rel="noopener" target="_blank"' : ''}>${t}</a>`;
    });
}

// Basit markdown: paragraf, ## / ### başlık, "- " liste, **kalın**, [link](url)
function md(src) {
  const out = [];
  let list = null, para = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`); list = null; } };
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    let m;
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) { flushPara(); flushList(); out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); continue; }
    if ((m = line.match(/^[-*]\s+(.*)$/))) { flushPara(); (list = list || []).push(m[1]); continue; }
    flushList(); para.push(line);
  }
  flushPara(); flushList();
  return out.join('\n');
}

function parse(file) {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`Ön bilgi (---) eksik: ${file}`);
  const fm = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const fn = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!fn) throw new Error(`Dosya adı YYYY-MM-DD-slug.md olmalı: ${file}`);
  for (const k of ['baslik', 'ozet', 'kategori']) if (!fm[k]) throw new Error(`${file}: "${k}" alanı eksik`);
  const tarih = fm.tarih || fn[1];
  const [y, mo, d] = tarih.split('-').map(Number);
  const kaynak = fm.kaynak ? `<p class="kaynak">Kaynak: ${inline(fm.kaynak)}</p>` : '';
  return {
    slug: fn[2],
    baslik: fm.baslik,
    ozet: fm.ozet,
    tarih,
    tarihMetin: `${d} ${AYLAR[mo - 1]} ${y}`,
    kategori: fm.kategori,
    ilceler: (fm.ilceler || 'istanbul').split(',').map((s) => s.trim()).filter(Boolean),
    body: md(m[2]) + '\n' + kaynak,
  };
}

const haberler = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).map(parse)
  : [];
haberler.sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : a.slug.localeCompare(b.slug)));

const slugs = new Set();
for (const h of haberler) { if (slugs.has(h.slug)) throw new Error(`Aynı slug iki kez: ${h.slug}`); slugs.add(h.slug); }

module.exports = haberler;
