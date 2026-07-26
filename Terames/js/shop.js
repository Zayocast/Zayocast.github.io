/* ============================================================
   TERA.MES — кошница, калкулатор, печат и QR
   Кошницата не е онлайн магазин: тя сглобява списък, който
   клиентът праща по Viber или чете по телефона.
   ============================================================ */
window.TERA = window.TERA || {};

(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var C = null;         // съдържанието на сайта
  var cart = [];        // [{name, eur, unit, qty}]

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

  /* ============================================================
     Кошница
     ============================================================ */

  function total() {
    return cart.reduce(function (s, it) {
      return s + TERA.toNum(it.eur) * it.qty;
    }, 0);
  }

  function count() {
    return cart.reduce(function (s, it) { return s + it.qty; }, 0);
  }

  function add(item) {
    var hit = cart.filter(function (i) { return i.name === item.name; })[0];
    if (hit) hit.qty += item.qty || 1;
    else cart.push({ name: item.name, eur: item.eur || '', unit: item.unit || '', qty: item.qty || 1 });
    persist();
    bump();
  }

  function persist() {
    TERA.api.saveCart(cart);
    paintCart();
    paintCount();
  }

  /** Броячът стои на две места: летящия бутон и този в шапката. */
  function paintCount() {
    var n = count();
    [['#cartFab', '.fab-count'], ['#navCart', '.nav-cart-count']].forEach(function (pair) {
      var el = $(pair[0]);
      if (!el) return;
      el.classList.toggle('has', n > 0);
      var b = $(pair[1], el);
      if (b) { b.textContent = n; b.hidden = !n; }
    });
    paintFormCart();
  }

  /** Подсказката във формата се показва само когато има какво да се прикачи. */
  function paintFormCart() {
    var box = $('#formCart');
    if (!box) return;
    box.hidden = !cart.length;
  }

  /** Кратко подскачане на бутона, за да се види, че нещо е добавено. */
  function bump() {
    ['#cartFab', '#navCart'].forEach(function (sel) {
      var el = $(sel);
      if (!el) return;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    });
  }

  function paintCart() {
    var box = $('#cartBody');
    if (!box) return;
    var t = C.cart;

    if (!cart.length) {
      box.innerHTML = '<div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.2"/><circle cx="19" cy="21" r="1.2"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        '<b>' + esc(t.empty) + '</b><p>' + esc(t.emptyHint) + '</p></div>';
      $('#cartFoot').hidden = true;
      return;
    }

    box.innerHTML = '<ul class="cart-list">' + cart.map(function (it, i) {
      var line = TERA.toNum(it.eur) * it.qty;
      return '<li class="cart-item">' +
        '<div class="ci-txt"><b>' + esc(it.name) + '</b>' +
          (it.eur ? '<span>' + esc(it.eur) + ' € ' + esc(it.unit) + '</span>' : '<span>по договаряне</span>') +
        '</div>' +
        '<div class="ci-qty">' +
          '<button type="button" data-qty="-1" data-i="' + i + '" aria-label="По-малко">−</button>' +
          '<b>' + it.qty + '</b>' +
          '<button type="button" data-qty="1" data-i="' + i + '" aria-label="Повече">+</button>' +
        '</div>' +
        '<div class="ci-sum">' + (it.eur ? TERA.fmt(line) + ' €' : '—') + '</div>' +
        '<button class="ci-del" type="button" data-del="' + i + '" aria-label="Премахни ' + attr(it.name) + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>' +
        '</button>' +
      '</li>';
    }).join('') + '</ul>';

    var sum = total();
    $('#cartTotalEur').textContent = TERA.fmt(sum) + ' €';
    $('#cartTotalLv').textContent = TERA.toLv(sum) + ' лв.';
    $('#cartFoot').hidden = false;
  }

  /** Текстът, който тръгва по Viber или влиза във формата. */
  function orderText() {
    var lines = cart.map(function (it) {
      return '• ' + it.name + ' — ' + it.qty + (it.unit ? ' ' + it.unit.replace('/', '').trim() : ' бр') +
             (it.eur ? ' (' + it.eur + ' €)' : '');
    });
    return C.cart.intro + '\n' + lines.join('\n') +
           '\n\nОбщо: ' + TERA.fmt(total()) + ' € (' + TERA.toLv(total()) + ' лв.)';
  }

  function openCart(open) {
    var el = $('#cart');
    if (!el) return;
    el.classList.toggle('open', open);
    $('#cartScrim').classList.toggle('on', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('#cartClose').focus();
  }

  /* ============================================================
     Калкулатор
     ============================================================ */

  var calcKey = '';                     // избраният повод

  function calcGuests() {
    var el = $('#calcGuests');
    return Math.max(1, Math.min(500, parseInt(el ? el.value : 8, 10) || 1));
  }

  function kgLabel(kg) {
    return kg < 1
      ? Math.round(kg * 1000) + ' г'
      : kg.toFixed(2).replace('.', ',') + ' кг';
  }

  /** Поводите са бутони, а не падащо меню — по-лесно се уцелват с пръст. */
  function buildOccasions() {
    var box = $('#calcOccasion');
    if (!box) return;
    var list = (C.calc.occasions || []).filter(function (o) { return o.on !== false; });
    if (!list.length) return;
    if (!calcKey || !list.filter(function (o) { return o.key === calcKey; }).length) {
      calcKey = list[0].key;
    }
    box.innerHTML = list.map(function (o) {
      return '<button class="calc-occ" type="button" role="radio" data-key="' + attr(o.key) + '" ' +
             'aria-checked="' + (o.key === calcKey) + '">' + esc(o.label) + '</button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.calc-occ');
      if (!b) return;
      calcKey = b.dataset.key;
      $$('.calc-occ', box).forEach(function (x) {
        x.setAttribute('aria-checked', x === b);
      });
      calcRun();
    });
  }

  function buildPresets() {
    var box = $('#calcPresets');
    if (!box) return;
    var list = C.calc.presets || [2, 4, 6, 8, 12, 20];
    box.innerHTML = list.map(function (n) {
      return '<button class="calc-preset" type="button" data-n="' + n + '">' + n + ' души</button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.calc-preset');
      if (!b) return;
      $('#calcGuests').value = b.dataset.n;
      calcRun();
    });
  }

  function paintPresets(guests) {
    $$('#calcPresets .calc-preset').forEach(function (b) {
      b.classList.toggle('active', +b.dataset.n === guests);
    });
  }

  function calcRun() {
    var out = $('#calcOut');
    if (!out) return;
    var guests = calcGuests();
    var oc = (C.calc.occasions || []).filter(function (o) { return o.key === calcKey; })[0];
    if (!oc) { out.innerHTML = ''; return; }

    paintPresets(guests);

    var sum = 0, totalKg = 0;
    var lines = (oc.lines || []).map(function (l) {
      var kg = (+l.kg || 0) * guests;
      var price = kg * TERA.toNum(l.eur);
      sum += price; totalKg += kg;
      return { name: l.name, eur: l.eur, kg: kg, price: price };
    });

    var rows = lines.map(function (l) {
      return '<tr>' +
        '<td>' + esc(l.name) + '</td>' +
        '<td class="num">' + kgLabel(l.kg) + '</td>' +
        '<td class="num">' + (l.eur ? TERA.fmt(l.price) + ' €' : '—') + '</td>' +
      '</tr>';
    }).join('');

    /* на телефон таблицата се сменя със списък — колоните не се събират */
    var cards = lines.map(function (l) {
      return '<li><span class="cr-n">' + esc(l.name) + '</span>' +
        '<span class="cr-v"><b>' + kgLabel(l.kg) + '</b>' +
        '<span>' + (l.eur ? TERA.fmt(l.price) + ' €' : '—') + '</span></span></li>';
    }).join('');

    out.innerHTML =
      '<p class="calc-lead">' + esc(C.calc.resultLabel) + ' за <b>' + guests + '</b> ' +
        (guests === 1 ? 'човек' : 'души') + '</p>' +
      '<div class="calc-sum">' +
        '<div class="calc-stat"><b>' + kgLabel(totalKg) + '</b>' +
          '<span>' + esc(C.calc.totalKgLabel || 'общо количество') + '</span></div>' +
        '<div class="calc-stat"><b>' + kgLabel(totalKg / guests) + '</b>' +
          '<span>' + esc(C.calc.perHeadLabel || 'на човек') + '</span></div>' +
        '<div class="calc-stat hi"><b>' + TERA.fmt(sum) + ' €</b>' +
          '<span>' + esc(C.calc.totalLabel || 'сметка') + '</span>' +
          '<small>' + TERA.toLv(sum) + ' лв.</small></div>' +
      '</div>' +
      '<div class="calc-tbl-wrap"><table class="calc-tbl">' +
        '<thead><tr><th>Продукт</th><th class="num">Количество</th><th class="num">Цена</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div>' +
      '<ul class="calc-rows">' + cards + '</ul>' +
      '<button class="btn btn-red calc-add" type="button" id="calcAdd">' + esc(C.calc.addLabel) + '</button>';

    $('#calcAdd').addEventListener('click', function () {
      lines.forEach(function (l) {
        if (l.kg > 0) add({ name: l.name, eur: l.eur, unit: '/ кг', qty: Math.round(l.kg * 10) / 10 });
      });
      openCart(true);
    });
  }

  /* ============================================================
     Печат и QR
     ============================================================ */

  /**
   * Сглобява листа за печат: чист текст, без бутони и без сенки.
   * Печата се само този елемент — останалата част от страницата се
   * маха с display:none, за да няма празни листове.
   */
  function buildPrintSheet() {
    var sheet = $('#printSheet');
    if (!sheet) return;

    var list = (typeof TERA.visibleProducts === 'function' ? TERA.visibleProducts() : [])
               .filter(function (p) { return p && p.on !== false; });
    if (!list.length) list = (C.products.items || []).filter(function (p) { return p.on !== false; });

    var cats = C.products.categories || [];
    var label = {};
    cats.forEach(function (c) { label[c.key] = c.label; });

    /* групиране по категория, в реда от панела */
    var order = cats.map(function (c) { return c.key; });
    var groups = [];
    list.forEach(function (p) {
      var g = groups.filter(function (x) { return x.key === p.cat; })[0];
      if (!g) { g = { key: p.cat, items: [] }; groups.push(g); }
      g.items.push(p);
    });
    groups.sort(function (a, b) {
      var ia = order.indexOf(a.key), ib = order.indexOf(b.key);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    var d = new Date();
    var meta = [
      C.contact.city + ' · ' + C.contact.street,
      C.contact.phoneLabel,
      'Цени към ' + d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear(),
      '1 € = ' + String(TERA.EUR_RATE).replace('.', ',') + ' лв.'
    ].join('  ·  ');

    var body = groups.map(function (g) {
      return '<p class="ps-cat">' + esc(label[g.key] || g.key || '') + '</p>' +
        g.items.map(function (p) {
          return '<div class="ps-row' + (p.out ? ' out' : '') + '">' +
            '<span class="n"><b>' + esc(p.name) + '</b>' +
              (p.desc ? '<i>' + esc(p.desc) + '</i>' : '') + '</span>' +
            '<span class="p"><b>' + esc(p.eur) + ' €</b>' +
              '<span>' + TERA.toLv(p.eur) + ' лв. / кг</span></span>' +
          '</div>';
        }).join('');
    }).join('');

    sheet.innerHTML =
      '<div class="ps-head">' +
        '<div class="ps-brand">' + esc(C.meta.siteName || 'Tera.MES') +
          '<span>' + esc(meta) + '</span></div>' +
        '<div class="ps-title">' + esc(C.products.boardTitle || 'Ценоразпис') +
          '<span>' + esc(C.products.boardSub || '') + '</span></div>' +
      '</div>' +
      '<div class="ps-list">' + body + '</div>' +
      '<p class="ps-note">' + esc(C.products.note || '') + '</p>';
  }

  function printPrices() {
    buildPrintSheet();
    document.body.classList.add('printing');
    var done = function () {
      document.body.classList.remove('printing');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);   // за браузъри без afterprint
  }

  function printQr() {
    document.body.classList.add('printing-qr');
    var done = function () {
      document.body.classList.remove('printing-qr');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  }

  function showQr() {
    var url = C.meta.canonical || location.origin + location.pathname;
    if (url.slice(-1) !== '/' && url.indexOf('#') < 0) url += '/';
    /* всяка страница може да каже накъде да сочи кодът */
    var target = url + (document.body.dataset.qrTarget || '#products');

    var svg;
    try {
      svg = TERA.qr.svg(target, { size: 260, dark: '#221B16', light: '#FFFFFF' });
    } catch (e) {
      svg = '<p class="qr-err">' + esc(e.message) + '</p>';
    }

    var box = $('#qrModal');
    $('#qrCode').innerHTML = svg;
    $('#qrUrl').textContent = target;
    box.classList.add('open');
    $('#qrClose').focus();
  }

  /* ============================================================
     Свързване
     ============================================================ */

  function bind() {
    /* добавяне в кошницата — работи за всеки бутон с data-add */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]');
      if (b) {
        e.preventDefault();
        add({ name: b.dataset.name, eur: b.dataset.eur, unit: b.dataset.unit || '', qty: 1 });
        b.classList.add('added');
        setTimeout(function () { b.classList.remove('added'); }, 900);
        return;
      }

      var q = e.target.closest('[data-qty]');
      if (q) {
        var i = +q.dataset.i;
        cart[i].qty = Math.max(0, Math.round((cart[i].qty + (+q.dataset.qty)) * 10) / 10);
        if (!cart[i].qty) cart.splice(i, 1);
        persist();
        return;
      }

      var d = e.target.closest('[data-del]');
      if (d) { cart.splice(+d.dataset.del, 1); persist(); return; }

      if (e.target.closest('#cartFab') ||
          e.target.closest('#navCart'))   { openCart(true); return; }
      if (e.target.closest('#cartClose') ||
          e.target.closest('#cartScrim')) { openCart(false); return; }

      if (e.target.closest('#cartClear')) {
        cart = []; persist(); return;
      }

      if (e.target.closest('#printPrices')) { printPrices(); return; }
      if (e.target.closest('#showQr'))      { showQr(); return; }
      if (e.target.closest('#qrClose') ||
          e.target === $('#qrModal'))       { $('#qrModal').classList.remove('open'); return; }
      if (e.target.closest('#qrPrint'))     { printQr(); return; }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if ($('#cart') && $('#cart').classList.contains('open')) openCart(false);
      if ($('#qrModal') && $('#qrModal').classList.contains('open')) $('#qrModal').classList.remove('open');
    });

    /* изпращане на списъка */
    var viber = $('#cartViber');
    if (viber) viber.addEventListener('click', function (e) {
      if (!cart.length) { e.preventDefault(); return; }
      var num = (C.contact.viber || C.contact.phone || '').replace(/\s/g, '');
      this.href = 'viber://chat?number=' + encodeURIComponent(num) + '&text=' + encodeURIComponent(orderText());
    });

    var toForm = $('#cartToForm');
    if (toForm) toForm.addEventListener('click', function (e) {
      e.preventDefault();
      var msg = document.getElementById('fMsg');
      if (msg) {
        msg.value = orderText();
        msg.dispatchEvent(new Event('input'));
      }
      openCart(false);
      var order = document.getElementById('order');
      if (order) order.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () { var n = document.getElementById('fName'); if (n) n.focus(); }, 600);
    });

    /* прикачане на списъка към формата за поръчка */
    var formCartBtn = $('#formCartBtn');
    if (formCartBtn) formCartBtn.addEventListener('click', function () {
      if (!cart.length) return;
      var msg = document.getElementById('fMsg');
      if (!msg) return;
      msg.value = orderText();
      msg.dispatchEvent(new Event('input'));
      var field = msg.closest('.field');
      if (field) field.classList.remove('invalid');
      msg.focus();
    });

    /* калкулатор */
    var g = $('#calcGuests');
    if (g) {
      g.addEventListener('input', calcRun);
      $$('.calc-step').forEach(function (btn) {
        btn.addEventListener('click', function () {
          g.value = Math.max(1, Math.min(500, (parseInt(g.value, 10) || 1) + (+btn.dataset.step)));
          calcRun();
        });
      });
    }
  }

  /* ============================================================
     Старт — вика се от main.js със заредено съдържание
     ============================================================ */
  TERA.shop = {
    init: function (content) {
      C = content;
      cart = TERA.api.loadCart() || [];

      buildPresets();
      buildOccasions();

      var hint = $('#calcHint');
      if (hint) hint.textContent = C.calc.note || '';

      bind();
      paintCount();
      paintCart();
      if (calcKey) calcRun();
    },
    add: add,
    open: function () { openCart(true); }
  };
})();
