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
    var fark = val(form, 'fark'); if (!isFinite(fark)) fark = 0;
    if (!(fiyat > 0 && kira > 0)) { show(form, false); return; }
    show(form, true);

    var maliyet = fiyat * (1 + masraf / 100);
    var yillikBrut = kira * 12;
    var yillikNet = kira * Math.max(0, 12 - bos) - gider * 12 - yillikBrut * bakim / 100;
    var brutYil = fiyat / yillikBrut;
    var getiri = yillikBrut / fiyat * 100;

    // Bugünün parasıyla (reel): kira enflasyonu yılda "fark" puan geçerse
    var netYil = geriDonus(maliyet, yillikNet, function () { return fark; });
    // TL bazında (nominal): kira beklenen enflasyon + fark kadar artarsa
    var nomYil = geriDonus(maliyet, yillikNet, function (y) { return enf(y) + fark; });

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
    set(form, 'nomyil', isFinite(nomYil) ? nf1.format(nomYil) + ' yıl' : '–');
  }

  // Beklenen enflasyon yolu (build sırasında sayfaya eklenir): y. yıl için %
  function enf(y) {
    var yol = window.AMORTI_ENF || [];
    return yol.length ? yol[Math.min(y, yol.length) - 1] : 0;
  }
  // Yıllık net kira her yıl "artis(y)" % büyürken toplam kiranın maliyeti geçtiği süre (yıl, ondalıklı)
  function geriDonus(maliyet, ilkYil, artis) {
    if (!(ilkYil > 0)) return Infinity;
    var top = 0, net = ilkYil;
    for (var y = 1; y <= 150; y++) {
      if (top + net >= maliyet) return y - 1 + (maliyet - top) / net;
      top += net; net *= 1 + artis(y) / 100;
      if (net <= 0) return Infinity;
    }
    return Infinity;
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
    if (form.elements.bsmv && form.elements.bsmv.checked) r *= 1.15; // konutu olanlarda faize %15 BSMV
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
    var py = form.querySelector('input[name="pesinYuzde"]:checked');
    if (py && fiyat > 0) pesin = fiyat * (+py.value) / 100;
    var r = val(form, 'faiz') / 100, n = val(form, 'vade');
    var kira = val(form, 'kira'), reel = val(form, 'fark'); if (!isFinite(reel)) reel = 0;
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
      k *= 1 + (enf(y) + reel) / 100;
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

  // ---------- 6. Hazır ilan araması ----------
  var IA = window.AMORTI_ILAN || { odalar: [], yaslar: [], iller: {} };
  function bulunma(ad) { // Kadıköy'de, Beşiktaş'ta
    var k = ad.toLocaleLowerCase('tr'), v = 'e';
    for (var i = k.length - 1; i >= 0; i--) if ('aeıioöuü'.indexOf(k[i]) > -1) { v = 'aıou'.indexOf(k[i]) > -1 ? 'a' : 'e'; break; }
    return ad + '’' + ('fstkçşhp'.indexOf(k[k.length - 1]) > -1 ? 't' : 'd') + v;
  }
  function ilceAdi(il, ilce) {
    var L = (IA.iller[il] || { i: [] }).i;
    for (var i = 0; i < L.length; i++) if (L[i][0] === ilce) return L[i][1];
    return '';
  }
  // Şehir değişince ilçe listesini yenile (ilan araması ve kira paylaşımı)
  function ilceDoldur(ilSel, ilceSel, secili) {
    var il = IA.iller[ilSel.value]; if (!il || !ilceSel) return;
    var ilk = ilceSel.options[0] && ilceSel.options[0].value === '' ? ilceSel.options[0].text : '';
    var html = ilk ? '<option value="">' + ilk + '</option>' : '', grup = null;
    il.i.forEach(function (x) {
      if (x[2] !== grup) { html += (grup !== null ? '</optgroup>' : '') + '<optgroup label="' + x[2] + '">'; grup = x[2]; }
      html += '<option value="' + x[0] + '"' + (x[0] === secili ? ' selected' : '') + '>' + x[1] + '</option>';
    });
    ilceSel.innerHTML = html + (grup !== null ? '</optgroup>' : '');
  }
  document.querySelectorAll('select[name="il"]').forEach(function (sel) {
    var f = sel.form; var ilce = f && f.elements.ilce;
    sel.addEventListener('change', function () { ilceDoldur(sel, ilce, ''); if (ilce) ilce.dispatchEvent(new Event('input', { bubbles: true })); });
    var on = window.AMORTI_ONSECIM;
    if (on && f && f.getAttribute('name') === 'kira-paylas') {
      if (on.il && IA.iller[on.il]) { sel.value = on.il; ilceDoldur(sel, ilce, on.ilce || ''); }
    }
  });
  function iaSecim(form) {
    var islem = (form.querySelector('input[name="islem"]:checked') || {}).value || 'satilik';
    var odalar = [].map.call(form.querySelectorAll('input[name="oda"]:checked'), function (i) { return i.value; });
    var yas = (form.querySelector('input[name="yas"]:checked') || {}).value || '';
    var min = val(form, 'min'), max = val(form, 'max');
    return { islem: islem, il: (form.elements.il && form.elements.il.value) || 'istanbul', ilce: form.elements.ilce.value, min: min > 0 ? Math.round(min) : 0, max: max > 0 ? Math.round(max) : 0, odalar: odalar, yas: yas };
  }
  function iaBul(list, k) { for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i]; return null; }
  // Hepsiemlak adreste yalnızca ilçe adını kullanır; Türkiye'de başka ilde aynı adlı ilçesi olanlar için il-ilçe yazılır.
  var HP_IKIZ = { kemer: 1, aksu: 1, yenisehir: 1, golbasi: 1, kemalpasa: 1, edremit: 1, yenipazar: 1, bayindir: 0 };
  function hpYer(s) { return !s.ilce ? s.il : (HP_IKIZ[s.ilce] ? s.il + '-' + s.ilce : s.ilce); }
  var iaSiteler = [
    { ad: 'sahibinden.com', url: function (s) {
      var q = [], eksik = false;
      var y = iaBul(IA.yaslar, s.yas);
      if (y && y.k) { if (y.sb && y.sb.length) y.sb.forEach(function (c) { q.push('a812=' + c); }); else eksik = true; }
      if (s.min) q.push('price_min=' + s.min);
      if (s.max) q.push('price_max=' + s.max);
      s.odalar.forEach(function (k) { var o = iaBul(IA.odalar, k); if (o && o.sb && o.sb.length) o.sb.forEach(function (c) { q.push('a20=' + c); }); else eksik = true; });
      return { url: 'https://www.sahibinden.com/' + s.islem + '-daire/' + s.il + (s.ilce ? '-' + s.ilce : '') + (q.length ? '?' + q.join('&') : ''), eksik: eksik ? 'Oda ve bina yaşını sitede seç' : '' };
    } },
    { ad: 'Hepsiemlak', url: function (s) {
      var q = [], eksik = false;
      var y = iaBul(IA.yaslar, s.yas);
      if (y && y.k) { if (y.hp && y.hp.length) q.push('buildingAges=' + y.hp.join(',')); else eksik = true; }
      var od = [];
      s.odalar.forEach(function (k) { var o = iaBul(IA.odalar, k); if (o && o.hp && o.hp.length) od = od.concat(o.hp); else eksik = true; });
      if (od.length) q.push('p63=' + od.join('-'));
      if (s.min) q.push('p31=' + s.min);
      if (s.max) q.push('p32=' + s.max);
      if (s.min || s.max) q.push('p33=1');
      return { url: 'https://www.hepsiemlak.com/' + hpYer(s) + '-' + s.islem + '/daire' + (q.length ? '?' + q.join('&') : ''), eksik: eksik ? 'Oda sayısını sitede seç' : (y && y.hpNot) || '' };
    } },
    { ad: 'Emlakjet', url: function (s) {
      var f = [];
      var y = iaBul(IA.yaslar, s.yas);
      if (y && y.ej.length) f.push('binanin-yasi=' + y.ej.join(','));
      if (s.max) f.push('max-fiyat=' + s.max);
      if (s.min) f.push('min-fiyat=' + s.min);
      var od = [];
      s.odalar.forEach(function (k) { var o = iaBul(IA.odalar, k); if (o) od = od.concat(o.ej); });
      if (od.length) f.push('oda-sayisi=' + od.join(','));
      return { url: 'https://www.emlakjet.com/' + s.islem + '-daire/' + s.il + (s.ilce ? '-' + s.ilce : '') + (f.length ? '?filtreler=' + f.join('&') : ''), eksik: '' };
    } },
  ];
  function iaPara(n, kira) {
    if (n >= 1e6) return nf1.format(n / 1e6).replace(/,0$/, '') + ' milyon';
    if (n >= 1e3 && kira) return nf0.format(n / 1e3) + ' bin';
    return nf0.format(n);
  }
  function ilanAra(form) {
    var s = iaSecim(form);
    var kira = s.islem === 'kiralik';
    form.querySelectorAll('[data-tur]').forEach(function (b) {
      b.hidden = b.getAttribute('data-tur') !== s.islem;
      var r = b.getAttribute('data-fiyat').split('-');
      var on = +r[0] === s.min && +r[1] === s.max;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    // Paylaşılabilir adres (yalnızca İlan ara sayfasında)
    if (!form.classList.contains('ia-mini')) try {
      var q = new URLSearchParams();
      if (s.islem !== 'satilik') q.set('islem', s.islem);
      if (s.il !== 'istanbul') q.set('il', s.il);
      if (s.ilce) q.set('ilce', s.ilce);
      if (s.min) q.set('min', s.min);
      if (s.max) q.set('max', s.max);
      if (s.odalar.length) q.set('oda', s.odalar.join(','));
      if (s.yas) q.set('yas', s.yas);
      var qs = q.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    } catch (e) {}
    var out = form.querySelector('[data-out="siteler"]');
    var yerAd = s.ilce ? ilceAdi(s.il, s.ilce) : (IA.iller[s.il] || {}).ad || '';
    var parca = [];
    if (s.min && s.max) parca.push(iaPara(s.min, kira) + '–' + iaPara(s.max, kira) + ' TL arası');
    else if (s.max) parca.push(iaPara(s.max, kira) + ' TL’ye kadar');
    else if (s.min) parca.push(iaPara(s.min, kira) + ' TL üstü');
    if (s.odalar.length) parca.push(s.odalar.join(' veya '));
    var y = iaBul(IA.yaslar, s.yas);
    if (y && y.k) parca.push(y.k === '31+' ? '31 yaş ve üzeri binalarda' : y.ad.replace(' yaş', ' yaşındaki binalarda'));
    set(form, 'ozet', '<b>' + bulunma(yerAd) + '</b> ' + (parca.length ? parca.join(', ') + ' ' : '') + (kira ? 'kiralık' : 'satılık') + ' daireler');
    out.innerHTML = iaSiteler.map(function (site) {
      var r = site.url(s);
      return '<a class="site-btn" href="' + r.url.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener nofollow">' +
        '<span class="site-ad">' + site.ad + '</span>' +
        '<span class="site-git">Aramayı aç <span aria-hidden="true">↗</span></span>' +
        (r.eksik ? '<span class="site-not">' + r.eksik + '</span>' : '<span class="site-not">Tüm filtreler hazır</span>') + '</a>';
    }).join('');
  }
  // Fiyat kısayolları ve işlem değişimi
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fiyat]');
    if (!b) return;
    var form = b.closest('form');
    var r = b.getAttribute('data-fiyat').split('-');
    form.elements.min.value = +r[0] ? nf0.format(+r[0]) : '';
    form.elements.max.value = +r[1] ? nf0.format(+r[1]) : '';
    form.dispatchEvent(new Event('input', { bubbles: true }));
  });
  document.querySelectorAll('form[data-tool="ilan-ara"]:not(.ia-mini)').forEach(function (form) {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get('islem') === 'kiralik') form.querySelector('input[name="islem"][value="kiralik"]').checked = true;
      var qil = q.get('il') || 'istanbul';
      if (IA.iller[qil] && form.elements.il) { form.elements.il.value = qil; ilceDoldur(form.elements.il, form.elements.ilce, q.get('ilce') || ''); }
      else if (q.get('ilce')) form.elements.ilce.value = q.get('ilce');
      if (+q.get('min')) form.elements.min.value = nf0.format(+q.get('min'));
      if (+q.get('max')) form.elements.max.value = nf0.format(+q.get('max'));
      (q.get('oda') || '').split(',').forEach(function (k) { var i = form.querySelector('input[name="oda"][value="' + k + '"]'); if (i) i.checked = true; });
      var yi = form.querySelector('input[name="yas"][value="' + (q.get('yas') || '') + '"]'); if (yi) yi.checked = true;
    } catch (e) {}
    form.querySelectorAll('input[name="islem"]').forEach(function (r) {
      r.addEventListener('change', function () { if (form.elements.min) form.elements.min.value = ''; if (form.elements.max) form.elements.max.value = ''; });
    });
  });

  function ilanMini(form) {
    var fiyat = val(form, 'fiyat');
    var m = form.querySelector('input[name="m2"]:checked');
    var m2 = m ? +m.value : NaN;
    if (!(fiyat > 0 && m2 > 0)) { show(form, false); return; }
    show(form, true);
    set(form, 'm2fiyat', tl(fiyat / m2) + '<span class="unit-s"> / m²</span>');
    var a = form.querySelector('[data-out-href="detay"]');
    if (a) a.href = '/araclar/ilan-firsat-mi/?fiyat=' + Math.round(fiyat) + '&m2=' + m2;
  }

  var tools = { 'ilan-mini': ilanMini, 'ilan-ara': ilanAra, amortisman: amortisman, ilan: ilan, 'kira-artis': kiraArtis, kredi: kredi, 'kredi-kira': krediKira };

  try {
    var onq = new URLSearchParams(location.search);
    document.querySelectorAll('form[data-tool]:not(.mini)').forEach(function (form) {
      onq.forEach(function (v, k) {
        var el = form.elements[k];
        if (el && el.tagName === 'INPUT' && el.type !== 'hidden' && el.type !== 'radio' && el.type !== 'checkbox' && isFinite(+v) && +v > 0) el.value = el.hasAttribute('data-money') ? nf0.format(+v) : String(v).replace('.', ',');
      });
    });
  } catch (e) {}

  document.querySelectorAll('form[data-tool]').forEach(function (form) {
    var fn = tools[form.getAttribute('data-tool')];
    if (!fn) return;
    var run = function () { try { fn(form); } catch (e) { /* sessiz */ } };
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    run();
  });

  // Banka oranı düğmeleri: faiz alanını doldur, hesabı yenile
  function faizAlani(btn) {
    var h = btn.getAttribute('data-hedef');
    if (h) return document.querySelector(h);
    var f = btn.closest('form');
    return f ? f.querySelector('[name="faiz"]') : null;
  }
  function isaretle(input, banka) {
    document.querySelectorAll('[data-oran]').forEach(function (b) {
      if (faizAlani(b) !== input) return;
      var on = !!banka && b.getAttribute('data-banka') === banka;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-oran]');
    if (!btn) return;
    var input = faizAlani(btn);
    if (!input) return;
    input.value = parseFloat(btn.getAttribute('data-oran')).toFixed(2).replace('.', ',');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    isaretle(input, btn.getAttribute('data-banka'));
    if (btn.hasAttribute('data-hedef')) {
      var form = input.closest('form');
      var r = form.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.classList.remove('flash'); void form.offsetWidth; form.classList.add('flash');
    }
  });
  document.querySelectorAll('input[name="faiz"]').forEach(function (i) {
    i.addEventListener('input', function (e) { if (e.isTrusted) isaretle(i, null); });
  });

  // ---------- Uygulama (PWA ve mağaza uygulaması) ----------
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
  // Mağaza uygulamasında (Capacitor) dış siteler (sahibinden, banka sayfaları vb.) uygulama içi tarayıcıda açılır.
  var CAP = window.Capacitor;
  if (/AmortiApp\//.test(navigator.userAgent)) document.documentElement.classList.add('in-app');
  if (CAP && CAP.isNativePlatform && CAP.isNativePlatform()) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.origin === location.origin || !/^https?:/.test(a.href)) return;
      var B = CAP.Plugins && CAP.Plugins.Browser;
      if (!B) return;
      e.preventDefault();
      B.open({ url: a.href, toolbarColor: '#E85D04' });
    }, true);
  }

  // Koyu / açık mod
  var themeBtn = document.querySelector('.theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var root = document.documentElement;
    var cur = root.getAttribute('data-theme') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('amorti-tema', next); } catch (e) {}
  });

  // Mobil menü
  var toggle = document.querySelector('.nav-toggle'), nav = document.querySelector('.nav');
  if (toggle && nav) toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();
