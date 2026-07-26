/* ============================================================
   TERA.MES — обща рамка на всички страници
   Шапката, мобилното меню, футърът, кошницата, летящите бутони
   и лентата за бисквитките се рисуват оттук, от едно място.
   Всяка страница съдържа само своя <main>.

   Как се закача една страница:
     <body data-base="../" data-page="recepti" data-nav="pages">
   · data-base   — пътят до корена ('' за началната, '../' за папка)
   · data-page   — коя страница е (за активния линк и за js/pages.js)
   · data-nav    — 'sections' (котви към началната) или 'pages'
   · data-tools  — 'yes' добавя модала с QR кода и листа за печат
   ============================================================ */
window.TERA = window.TERA || {};

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function attr(s) { return esc(s).replace(/"/g, '&quot;'); }

  var C = null;
  var base = '';
  var page = '';

  /* ---------- пътища ----------
     Котвите (#products) сочат към началната страница, затова на
     подстраница се превръщат в '../#products'. */
  function url(href) {
    if (!href) return base || './';
    if (/^(https?:|tel:|mailto:|viber:|data:)/.test(href)) return href;
    if (href.charAt(0) === '#') return base ? base + href : href;
    return base + href;
  }

  function tel()   { return 'tel:' + (C.contact.phone || '').replace(/\s/g, ''); }
  function viber() {
    var n = (C.contact.viber || C.contact.phone || '').replace(/\s/g, '');
    return 'viber://chat?number=' + encodeURIComponent(n);
  }
  function mapUrl() {
    return 'https://www.google.com/maps?q=' + encodeURIComponent(C.contact.mapQuery || '');
  }

  /* ---------- иконки ---------- */
  var ICO = {
    phone: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1.2"/><circle cx="19" cy="21" r="1.2"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    viber: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.5 2 2 5.6 2 10.2c0 2.6 1.4 4.9 3.6 6.4v3.9c0 .4.5.7.8.4l2.6-2c1 .2 2 .3 3 .3 5.5 0 10-3.6 10-8.2S17.5 2 12 2zm4.9 11.6c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7 0-1.3.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.3.6-.7.9-.5 1.2.7 1.2 1.6 2 2.8 2.6.3.2.5.1.7-.1.2-.2.5-.6.7-.8.2-.3.4-.2.6-.1.3.1 1.6.8 1.9.9.3.2.5.2.5.4.1.1.1.7-.1 1.3z"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4A5.8 5.8 0 0 1 16.2 22H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.4-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>'
  };

  /* ---------- шапка ---------- */
  function header() {
    /* по подразбиране шапката е една и съща навсякъде; 'pages' е
       алтернатива, ако някога потрябва меню само от страници */
    var mode = document.body.dataset.nav || 'sections';
    var links = mode === 'pages'
      ? [{ label: C.nav.homeLabel || 'Начало', href: '' }].concat(C.nav.pages || [])
      : (C.nav.header || []);

    var items = links.map(function (l) {
      var active = isActive(l.href);
      return '<li><a href="' + attr(url(l.href)) + '"' + (active ? ' class="active"' : '') +
             (active ? ' aria-current="page"' : '') + '>' + esc(l.label) + '</a></li>';
    }).join('');

    return '<a class="skip" href="#main">Към съдържанието</a>' +
      '<header class="nav" id="nav">' +
        '<div class="nav-in">' +
          '<a class="logo" href="' + attr(base || '#top') + '" aria-label="' + attr(C.meta.siteName) + ' — начало">' +
            '<img src="' + attr(base + 'teralogo.png') + '" alt="' + attr(C.meta.siteName) + '" width="52" height="52">' +
            '<span>Tera.<em>MES</em></span>' +
          '</a>' +
          '<nav aria-label="Основна навигация"><ul class="nav-links">' + items + '</ul></nav>' +
          '<div class="nav-side">' +
            '<button class="nav-cart" id="navCart" type="button" aria-label="Моята поръчка">' +
              ICO.cart + '<span class="nav-cart-label">Поръчка</span>' +
              '<em class="nav-cart-count" hidden>0</em>' +
            '</button>' +
            '<a class="nav-cta" href="' + attr(tel()) + '">' + ICO.phone + esc(C.contact.phoneLabel) + '</a>' +
            '<button class="burger" id="burger" aria-label="Отвори менюто" aria-expanded="false" aria-controls="mmenu">' +
              '<span></span><span></span><span></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</header>' + mmenu();
  }

  function isActive(href) {
    if (!page) return false;
    if (!href) return page === 'home';
    return href.replace(/\/$/, '') === page;
  }

  /* ---------- мобилно меню ---------- */
  function mmenu() {
    var pages = (C.nav.pages || []).map(function (l) {
      return '<a href="' + attr(url(l.href)) + '"' + (isActive(l.href) ? ' class="active"' : '') + '>' +
             esc(l.label) + '</a>';
    }).join('');
    var sections = (C.nav.mobile || []).map(function (l) {
      return '<a href="' + attr(url(l.href)) + '">' + esc(l.label) + '</a>';
    }).join('');

    return '<nav class="m-menu" id="mmenu" aria-label="Мобилно меню">' +
      '<div class="m-menu-in">' +
        '<a class="m-home" href="' + attr(base || '#top') + '">' + esc(C.nav.homeLabel || 'Начало') + '</a>' +
        '<p class="m-group">' + esc(C.nav.groupPages || 'Страници') + '</p>' + pages +
        '<p class="m-group">' + esc(C.nav.groupSections || 'На началната') + '</p>' + sections +
        '<a class="m-phone" href="' + attr(tel()) + '">☏ ' + esc(C.contact.phoneLabel) + '</a>' +
      '</div>' +
    '</nav>';
  }

  /* ---------- футър ---------- */
  function footer() {
    var navLinks = (C.footer.links || []).map(function (l) {
      return '<li><a href="' + attr(url(l.href)) + '">' + esc(l.label) + '</a></li>';
    }).join('');
    var pageLinks = (C.nav.pages || []).map(function (l) {
      return '<li><a href="' + attr(url(l.href)) + '">' + esc(l.label) + '</a></li>';
    }).join('');
    var legalLinks = (C.nav.legal || []).map(function (l) {
      return '<a href="' + attr(url(l.href)) + '">' + esc(l.label) + '</a>';
    }).join('<span aria-hidden="true">·</span>');

    var hours = (C.hours.rows || []).map(function (r) {
      return '<li' + (r.closed ? ' class="closed"' : '') + '>' + esc(r.label) + ': ' +
             (r.closed ? 'почивен' : esc(r.open) + ' – ' + esc(r.close)) + '</li>';
    }).join('');

    return '<footer class="footer">' +
      '<div class="foot-cta"><div class="wrap foot-cta-in">' +
        '<h3>' + esc(C.footer.ctaTitle) + '</h3>' +
        '<div class="foot-cta-btns">' +
          '<a class="btn btn-paper" href="' + attr(tel()) + '">' + ICO.phone + 'Обади се сега</a>' +
          '<a class="btn btn-viber" href="' + attr(viber()) + '">Пиши във Viber</a>' +
        '</div>' +
      '</div></div>' +
      '<div class="wrap foot-main">' +
        '<div class="foot-grid">' +
          '<div>' +
            '<a class="logo foot-logo" href="' + attr(base || '#top') + '">' +
              '<img src="' + attr(base + 'teralogo.png') + '" alt="' + attr(C.meta.siteName) + '" width="52" height="52">' +
              '<span>Tera.<em>MES</em></span></a>' +
            '<p>' + esc(C.footer.about) + '</p>' +
            '<a class="foot-insta" href="' + attr(C.contact.instagramUrl) + '" target="_blank" rel="noopener">' +
              ICO.insta + '@' + esc(C.contact.instagram) + '</a>' +
          '</div>' +
          '<div><h4>Страници</h4><ul class="foot-mono">' + pageLinks + '</ul></div>' +
          '<div><h4>На началната</h4><ul class="foot-nav">' + navLinks + '</ul></div>' +
          '<div>' +
            '<h4>Работно време</h4><ul class="foot-mono">' + hours + '</ul>' +
            '<h4 style="margin-top:1.2rem">Контакти</h4><ul class="foot-mono">' +
              '<li><a href="' + attr(tel()) + '">' + esc(C.contact.phoneLabel) + '</a></li>' +
              '<li>' + esc(C.contact.city) + ', ' + esc(C.contact.street) + '</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="foot-legal">' + legalLinks + '</div>' +
        '<div class="foot-bottom">' +
          '<span>' + esc(C.footer.copyright) + '</span>' +
          '<span>Изработка: <a href="' + attr(C.footer.creditUrl || '#') + '">' + esc(C.footer.creditLabel) + '</a></span>' +
        '</div>' +
      '</div>' +
    '</footer>';
  }

  /* ---------- кошница ---------- */
  function cart() {
    return '<div class="cart-scrim" id="cartScrim"></div>' +
      '<aside class="cart" id="cart" aria-label="Моята поръчка">' +
        '<header class="cart-head"><h3>' + esc(C.cart.title) + '</h3>' +
          '<button class="cart-x" type="button" id="cartClose" aria-label="Затвори">' + ICO.x + '</button>' +
        '</header>' +
        '<div class="cart-body" id="cartBody"></div>' +
        '<footer class="cart-foot" id="cartFoot" hidden>' +
          '<div class="cart-total"><span>' + esc(C.cart.totalLabel) + '</span>' +
            '<div><b id="cartTotalEur">0,00 €</b><small id="cartTotalLv">0,00 лв.</small></div></div>' +
          '<p class="cart-note">' + esc(C.cart.note) + '</p>' +
          '<a class="btn btn-viber btn-full" id="cartViber" href="' + attr(viber()) + '">' + esc(C.cart.viberLabel) + '</a>' +
          '<div class="cart-btns">' +
            '<a class="btn btn-red" id="cartToForm" href="' + attr(base + '#order') + '">' + esc(C.cart.formLabel) + '</a>' +
            '<a class="btn btn-ghost" href="' + attr(tel()) + '">' + esc(C.cart.callLabel) + '</a>' +
          '</div>' +
          '<button class="cart-clear" type="button" id="cartClear">' + esc(C.cart.clearLabel) + '</button>' +
        '</footer>' +
      '</aside>';
  }

  /* ---------- летящи бутони ---------- */
  function fabs() {
    return '<div class="fabs">' +
      '<button class="fab fab-cart" id="cartFab" type="button" aria-label="Моята поръчка">' +
        ICO.cart + '<span class="fab-count" hidden>0</span></button>' +
      '<a class="fab fab-up" href="' + attr(base || '#top') + '#top" aria-label="Нагоре">' + ICO.up + '</a>' +
      '<a class="fab fab-viber" href="' + attr(viber()) + '" aria-label="Пиши във Viber">' + ICO.viber + '</a>' +
      '<a class="fab fab-tel" href="' + attr(tel()) + '" aria-label="Обади се">' + ICO.phone + '</a>' +
    '</div>';
  }

  /* ---------- QR модал и лист за печат ---------- */
  function tools() {
    return '<div class="qr-modal" id="qrModal" role="dialog" aria-modal="true" aria-label="QR код към ценоразписа">' +
        '<div class="qr-box">' +
          '<button class="cart-x qr-x" type="button" id="qrClose" aria-label="Затвори">' + ICO.x + '</button>' +
          '<p class="eyebrow">За витрината</p><h3>Сканирай за цените</h3>' +
          '<div class="qr-code" id="qrCode"></div><p class="qr-url" id="qrUrl"></p>' +
          '<p class="qr-hint">Разпечатай го и го залепи на витрината — клиентът сканира и вижда актуалния ценоразпис на телефона си.</p>' +
          '<button class="btn btn-red" type="button" id="qrPrint">Разпечатай кода</button>' +
        '</div>' +
      '</div>' +
      '<div id="printSheet" aria-hidden="true"></div>';
  }

  /* ============================================================
     Съгласие за бисквитките
     Външното съдържание (картата на Google) се зарежда само след
     изрично „приемам“ — дотогава на негово място стои бутон.
     ============================================================ */
  var KEY = 'tera_cookie';

  var consent = {
    get: function () {
      try { return localStorage.getItem(KEY); } catch (e) { return null; }
    },
    set: function (v) {
      try { localStorage.setItem(KEY, v); } catch (e) {}
      apply();
      var bar = $('#cookieBar');
      if (bar) bar.classList.remove('show');
    },
    ok: function () { return consent.get() === 'all'; },
    ask: function () {
      var bar = $('#cookieBar');
      if (bar) bar.classList.add('show');
    }
  };

  /** Пълни всички [data-consent-src] елементи, ако има съгласие. */
  function apply() {
    var ok = consent.ok();
    Array.prototype.forEach.call(document.querySelectorAll('[data-consent-src]'), function (el) {
      var box = el.closest('.map') || el.parentNode;
      var block = box ? box.querySelector('.map-block') : null;
      if (ok) {
        if (!el.getAttribute('src')) el.setAttribute('src', el.dataset.consentSrc);
        el.hidden = false;
        if (block) block.remove();
      } else {
        el.removeAttribute('src');
        el.hidden = true;
        if (box && !block) box.insertAdjacentHTML('beforeend', mapBlock());
      }
    });
  }

  function mapBlock() {
    return '<div class="map-block">' +
      '<p>' + esc(C.cookie.mapBlocked) + '</p>' +
      '<button class="btn btn-red" type="button" data-cookie="all">' + esc(C.cookie.mapEnable) + '</button>' +
      '<a class="map-block-link" href="' + attr(mapUrl()) + '" target="_blank" rel="noopener">' +
        esc(C.cookie.mapOpen) + ' →</a>' +
    '</div>';
  }

  function cookieBar() {
    var more = (C.nav.legal || []).filter(function (l) { return /biskvitki/.test(l.href); })[0];
    return '<div class="cookie-bar" id="cookieBar" role="dialog" aria-label="' + attr(C.cookie.title) + '">' +
      '<div class="cookie-in">' +
        '<div class="cookie-txt"><b>' + esc(C.cookie.title) + '</b><p>' + esc(C.cookie.text) + '</p>' +
          (more ? '<a href="' + attr(url(more.href)) + '">' + esc(C.cookie.more) + ' →</a>' : '') +
        '</div>' +
        '<div class="cookie-btns">' +
          '<button class="btn btn-ghost" type="button" data-cookie="min">' + esc(C.cookie.decline) + '</button>' +
          '<button class="btn btn-red" type="button" data-cookie="all">' + esc(C.cookie.accept) + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------- поведение на менюто и бутоните ---------- */
  function bind() {
    var burger = $('#burger'), menu = $('#mmenu');
    if (burger && menu) {
      var toggle = function (force) {
        var open = force !== undefined ? force : !menu.classList.contains('open');
        menu.classList.toggle('open', open);
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open);
        burger.setAttribute('aria-label', open ? 'Затвори менюто' : 'Отвори менюто');
        document.body.style.overflow = open ? 'hidden' : '';
      };
      burger.addEventListener('click', function () { toggle(); });
      menu.addEventListener('click', function (e) {
        if (e.target.tagName === 'A' || e.target === menu) toggle(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('open')) toggle(false);
      });
      TERA.layout.closeMenu = function () { toggle(false); };
    }

    var nav = $('#nav'), up = $('.fab-up');
    var onScroll = function () {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
      if (up) up.classList.toggle('show', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cookie]');
      if (b) { e.preventDefault(); consent.set(b.dataset.cookie); }
    });
  }

  /* ============================================================
     Пускане
     ============================================================ */
  function mount() {
    C = TERA.api.contentSync();
    base = document.body.dataset.base || '';
    page = document.body.dataset.page || '';

    document.body.insertAdjacentHTML('afterbegin', header());

    var tail = footer() + cart() + fabs() + cookieBar();
    if (document.body.dataset.tools === 'yes') tail += tools();
    document.body.insertAdjacentHTML('beforeend', tail);

    bind();
    apply();
    if (!consent.get()) setTimeout(consent.ask, 900);
  }

  TERA.layout = {
    mount: mount,
    consent: consent,
    applyConsent: apply,
    url: url,
    tel: tel,
    viber: viber,
    mapUrl: mapUrl,
    icons: ICO,
    /** Съдържанието, с което е нарисувана рамката. */
    content: function () { return C; }
  };

  mount();
})();
