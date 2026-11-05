(function () {
  'use strict';

  // ---------- yardımcılar ----------
  var nf0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function parse(v) {
    if (v == null) return NaN;
    v = String(v).trim().replace(/\s|TL|₺|%/gi, '');
    if (!v) return NaN;
    // "3.000.000" -> 3000000 ; "2,89" -> 2.89 ; "3.000.000,5" -> 3000000.5
    if (v.indexOf(',') > -1) v = v.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, '');
    var n = parseFloat(v);
    return isFinite(n) ? n : NaN;
  }
  function tl(n) { return isFinite(n) ? nf0.format(Math.round(n)) + ' TL' : '–'; }
  function val(form, name) { var el = form.elements[name]; return el ? parse(el.value) : NaN; }
  function $(root, sel) { return root.querySelector(sel); }
  function set(root, key, html) { var el = root.querySelector('[data-out="' + key + '"]'); if (el) el.innerHTML = html; }
  function show(root, on) { var r = root.querySelector('.result'); if (r) r.hidden = !on; }

  function yearsGrid(container, years, markYear) {
    if (!container) return;
    container.innerHTML = '';
    if (!isFinite(years) || years <= 0) return;
    var capped = Math.min(years, 60);
    var full = Math.floor(capped);
    var frac = capped - full;
    var count = full + (frac > 0.05 ? 1 : 0);
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.style.setProperty('--i', i);
      if (i === full && frac > 0.05) { s.className = 'part'; s.style.setProperty('--p', Math.round(frac * 100) + '%'); }
      if (markYear && i + 1 === markYear) s.classList.add('mark');
      container.appendChild(s);
    }
  }

  function verdict(el, cls, text) {
    if (!el) return;
    el.className = 'verdict ' + cls;
    el.textContent = text;
  }

  // Para alanlarını odaktan çıkınca biçimlendir
  document.addEventListener('focusout', function (e) {
    var t = e.target;
    if (t && t.matches && t.matches('input[data-money]')) {
      var n = parse(t.value);
      if (isFinite(n)) t.value = nf0.format(n);
    }
  });

  // ---------- 1. Amortisman ----------
  function amortisman(form) {
    var fiyat = val(form, 'fiyat'), kira = val(form, 'kira');
    var gider = val(form, 'gider') || 0, bos = val(form, 'bos') || 0;
    var bakim = val(form, 'bakim') || 0, masraf = val(form, 'masraf') || 0;
    var artis = val(form, 'artis'); if (!isFinite(artis)) artis = 0;
    if (!(fiyat > 0 && kira > 0)) { show(form, false); return; }
    show(form, true);

    var maliyet = fiyat * (1 + masraf / 100);
    var yillikBrut = kira * 12;
    var yillikNet = kira * Math.max(0, 12 - bos) - gider * 12 - yillikBrut * bakim / 100;
    var brutYil = fiyat / yillikBrut;
    var netYil = yillikNet > 0 ? maliyet / yillikNet : Infinity;
    var getiri = yillikBrut / fiyat * 100;

    // Kira her yıl artarsa (nominal) toplam net kira maliyeti kaçıncı yılda geçer
    var artisYil = NaN;
    if (artis !== 0 && yillikNet > 0) {
      var top = 0, net = yillikNet;
      for (var y = 1; y <= 100; y++) {
        if (top + net >= maliyet) { artisYil = y - 1 + (maliyet - top) / net; break; }
        top += net; net *= 1 + artis / 100;
      }
    }

    set(form, 'yil', isFinite(netYil) ? nf1.format(netYil) + '<small>yıl</small>' : '—');
    yearsGrid($(form, '.years'), netYil);
    set(form, 'yilcap', isFinite(netYil)
      ? 'Her kare bir yıllık net kira. ' + Math.ceil(Math.min(netYil, 60)) + ' kare dolunca ev kendini ödemiş olur.'
      : 'Giderler kira gelirini aşıyor; bu senaryoda ev kendini amorti etmiyor.');
    var v = $(form, '[data-out="verdict"]');
    if (!isFinite(netYil)) verdict(v, 'v-bad', 'Kira giderleri karşılamıyor');
    else if (netYil <= 16) verdict(v, 'v-good', 'Hızlı amorti ediyor');
    else if (netYil <= 24) verdict(v, 'v-mid', 'Ortalama süre');
    else verdict(v, 'v-bad', 'Uzun süre');

    set(form, 'brut', nf1.format(brutYil) + ' yıl');
    set(form, 'getiri', '%' + nf2.format(getiri));
    set(form, 'yillik', tl(yillikNet));
    set(form, 'maliyet', tl(maliyet));
    set(form, 'artisyil', isFinite(artisYil) ? nf1.format(artisYil) + ' yıl' : '–');
    set(form, 'artisoran', '%' + nf1.format(artis));
  }

  // ---------- 2. İlan fırsat mı ----------
  function median(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
  function ilan(form) {
    var m2 = val(form, 'm2'), fiyat = val(form, 'fiyat');
    var satis = [], kiralar = [];
    form.querySelectorAll('[data-comp="satis"]').forEach(function (row) {
      var f = parse(row.querySelector('[name$="fiyat"]').value), a = parse(row.querySelector('[name$="m2"]').value);
      if (f > 0 && a > 0) satis.push(f / a);
    });
    form.querySelectorAll('[data-comp="kira"]').forEach(function (row) {
      var f = parse(row.querySelector('[name$="kira"]').value), a = parse(row.querySelector('[name$="m2"]').value);
      if (f > 0 && a > 0) kiralar.push(f / a);
    });
    if (!(m2 > 0 && fiyat > 0)) { show(form, false); return; }
    show(form, true);
    var v = $(form, '[data-out="verdict"]');
    var ilanM2 = fiyat / m2;
    set(form, 'ilanm2', tl(ilanM2));

    if (satis.length < 3) {
      set(form, 'fark', '—');
      verdict(v, 'v-info', 'Karşılaştırma için en az 3 benzer ilan gir');
      set(form, 'medm2', satis.length ? tl(median(satis)) : '–');
      set(form, 'aciklama', 'Aynı mahallede, benzer büyüklük ve yaştaki satılık ilanlardan en az üçünün fiyatını ve m²\'sini yaz. Değerlendirme bu ilanların ortalamasına göre yapılır.');
    } else {
      var med = median(satis);
      var fark = (ilanM2 - med) / med * 100;
      set(form, 'medm2', tl(med));
      set(form, 'fark', (fark > 0 ? '+' : fark < 0 ? '−' : '') + '%' + nf1.format(Math.abs(fark)));
      var aciklama;
      if (fark <= -20) {
        verdict(v, 'v-mid', 'Çok düşük, önce kontrol et');
        aciklama = 'Fiyat benzerlerinin belirgin şekilde altında. Gerçek bir fırsat olabilir ama hisseli tapu, kat irtifakı, iskânsız yapı, kiracılı satış veya hatalı girilmiş fiyat gibi nedenler de olabilir. Aşağıdaki kontrol listesini mutlaka gözden geçir.';
      } else if (fark <= -7) {
        verdict(v, 'v-good', 'Piyasanın altında, fırsat olabilir');
        aciklama = 'Bu ilan benzerlerinden daha uygun fiyatlı görünüyor. Tapu ve yapı durumu temizse pazarlık payıyla birlikte değerlendirmeye değer.';
      } else if (fark < 7) {
        verdict(v, 'v-info', 'Piyasa fiyatında');
        aciklama = 'Fiyat, girdiğin benzer ilanlarla uyumlu. Pazarlıkla birkaç puan aşağı çekilebilir.';
      } else {
        verdict(v, 'v-bad', 'Piyasanın üstünde');
        aciklama = 'Bu ilan benzerlerinden pahalı. Fiyatı haklı çıkaracak bir fark (manzara, yeni bina, otopark, site olanakları) yoksa pazarlık alanı geniş.';
      }
      set(form, 'aciklama', aciklama);
    }

    if (kiralar.length) {
      var tahminiKira = median(kiralar) * m2;
      var yil = fiyat / (tahminiKira * 12);
      set(form, 'kira', tl(tahminiKira));
      set(form, 'amorti', nf1.format(yil) + ' yıl');
    } else {
      set(form, 'kira', '–');
      set(form, 'amorti', 'Kira ilanı gir');
    }
  }

  // ---------- 3. Kira artış ----------
  function kiraArtis(form) {
    var kira = val(form, 'kira');
    var sel = form.elements['ay'];
    var oran = sel ? parseFloat(sel.value) : NaN;
    if (!(kira > 0 && oran > 0)) { show(form, false); return; }
    show(form, true);
    var artis = kira * oran / 100;
    set(form, 'yeni', tl(kira + artis));
    set(form, 'artis', tl(artis));
    set(form, 'oran', '%' + nf2.format(oran));
    set(form, 'yillik', tl(artis * 12));
    set(form, 'ay', sel.options[sel.selectedIndex].text.split(' (')[0]);
  }

  // ---------- 4. Konut kredisi ----------
  function taksitHesapla(P, r, n) { return r > 0 ? P * r / (1 - Math.pow(1 + r, -n)) : P / n; }
  function kredi(form) {
    var P = val(form, 'tutar'), n = val(form, 'vade'), r = val(form, 'faiz') / 100;
    if (!(P > 0 && n > 0 && r >= 0)) { show(form, false); return; }
    show(form, true);
    var t = taksitHesapla(P, r, n);
    set(form, 'taksit', nf0.format(Math.round(t)) + '<small>TL / ay</small>');
    set(form, 'toplam', tl(t * n));
    set(form, 'faizTop', tl(t * n - P));
    set(form, 'oranx', nf2.format(t * n / P) + ' kat');
    var gelir = t / 0.5; // bankalar genelde taksitin gelirin yarısını aşmamasını ister (yaklaşık)
    set(form, 'gelir', tl(gelir));
  }

  // ---------- 5. Kredi mi kira mı ----------
  function krediKira(form) {
    var fiyat = val(form, 'fiyat'), pesin = val(form, 'pesinat') || 0;
    var r = val(form, 'faiz') / 100, n = val(form, 'vade');
    var kira = val(form, 'kira'), artis = (val(form, 'artis') || 0) / 100;
    var P = fiyat - pesin;
    if (!(fiyat > 0 && P > 0 && n > 0 && kira > 0)) { show(form, false); return; }
    show(form, true);
    var t = taksitHesapla(P, r, n);
    var yilSay = Math.ceil(n / 12);
    var topKira = 0, k = kira, kesisme = 0;
    for (var y = 1; y <= yilSay; y++) {
      var aySay = (y === yilSay && n % 12) ? n % 12 : 12;
      if (!kesisme && k >= t) kesisme = y;
      topKira += k * aySay;
      k *= 1 + artis;
    }
    var topKredi = t * n + pesin;
    set(form, 'taksit', tl(t));
    set(form, 'fark', tl(t - kira));
    set(form, 'kesisme', kesisme ? kesisme + '. yıl' : 'Vade içinde geçmiyor');
    set(form, 'topkira', tl(topKira));
    set(form, 'topkredi', tl(topKredi));
    yearsGrid($(form, '.years'), Math.min(yilSay, 60), kesisme || null);
    var v = $(form, '[data-out="verdict"]');
    if (kesisme && kesisme <= 3) verdict(v, 'v-good', 'Kira kısa sürede taksite yetişiyor');
    else if (kesisme) verdict(v, 'v-mid', 'Kira ' + kesisme + '. yılda taksiti geçiyor');
    else verdict(v, 'v-bad', 'Kira vade boyunca taksitin altında kalıyor');
    set(form, 'yilcap', 'Her kare kredinin bir yılı. Çerçeveli kare, kiranın taksiti geçtiği yıl.');
  }

  var tools = { amortisman: amortisman, ilan: ilan, 'kira-artis': kiraArtis, kredi: kredi, 'kredi-kira': krediKira };

  document.querySelectorAll('form[data-tool]').forEach(function (form) {
    var fn = tools[form.getAttribute('data-tool')];
    if (!fn) return;
    var run = function () { try { fn(form); } catch (e) { /* sessiz */ } };
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    run();
  });

  // Mobil menü
  var toggle = document.querySelector('.nav-toggle'), nav = document.querySelector('.nav');
  if (toggle && nav) toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();
