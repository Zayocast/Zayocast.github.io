/* ============================================================
   TERA.MES — обща логика на подстраниците
   Зарежда съдържанието, пуска кошницата, рисува работното време
   и извиква рисувача на конкретната страница от js/pages.js.
   ============================================================ */
window.TERA = window.TERA || {};

(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Класът се слага веднага: CSS крие [data-rv] само когато го има,
     за да не изчезне съдържанието, ако JS не се зареди. */
  document.documentElement.classList.add('rv-ready');

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Плавно показване при скрол — без GSAP, с IntersectionObserver. */
  function reveal(root) {
    var els = $$('[data-rv]', root || document).filter(function (el) {
      return !el.classList.contains('rv-in');
    });
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('rv-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var d = +(en.target.dataset.d || 0);
        en.target.style.transitionDelay = (d * 0.09) + 's';
        en.target.classList.add('rv-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- работно време ---------- */
  function paintHours(C) {
    var box = $('#conStatus');
    var rows = C.hours.rows || [];
    var now = new Date(), day = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();

    var today = rows.filter(function (r) {
      return r.spec === '1-5' ? (day >= 1 && day <= 5) : +r.spec === day;
    })[0];

    var toMin = function (s) {
      var p = String(s || '').split(':');
      return (+p[0] || 0) * 60 + (+p[1] || 0);
    };
    var open = !!today && !today.closed && mins >= toMin(today.open) && mins < toMin(today.close);

    $$('.hours div[data-day]').forEach(function (row) {
      var spec = row.dataset.day;
      var match = spec === '1-5' ? (day >= 1 && day <= 5) : +spec === day;
      row.classList.toggle('today', match);
    });

    if (!box) return;
    box.classList.toggle('open', open);
    box.classList.toggle('shut', !open);
    var label = open
      ? 'Отворено сега · до ' + today.close
      : (today && !today.closed && mins < toMin(today.open)
          ? 'Затворено · отваряме в ' + today.open
          : 'Затворено в момента');
    var b = box.querySelector('b');
    if (b) b.textContent = label;
  }

  /* ---------- пускане ---------- */
  TERA.api.content().then(function (C) {
    var name = document.body.dataset.page || '';

    if (TERA.shop && TERA.shop.init) TERA.shop.init(C);

    if (TERA.pages && typeof TERA.pages[name] === 'function') {
      try { TERA.pages[name](C); }
      catch (e) { console.error('Страницата „' + name + '“ не се нарисува:', e); }
    }

    paintHours(C);
    setInterval(function () { paintHours(C); }, 60000);

    if (TERA.layout && TERA.layout.applyConsent) TERA.layout.applyConsent();

    reveal();
    /* съдържание, дорисувано след това (напр. отворена рецепта) */
    TERA.revealAgain = reveal;
  }).catch(function (err) {
    console.error('Съдържанието не се зареди:', err);
    $$('[data-rv]').forEach(function (el) { el.classList.add('rv-in'); });
  });
})();
