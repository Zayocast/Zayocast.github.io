/* Табло — какво се случва в магазина днес */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  var DAYS = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
  var MONTHS = ['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];

  function todayRow() {
    var d = new Date(), day = d.getDay();
    var rows = store.get('hours.rows') || [];
    return rows.filter(function (r) {
      if (r.spec === '1-5') return day >= 1 && day <= 5;
      return +r.spec === day;
    })[0];
  }

  function openNow() {
    var r = todayRow();
    if (!r || r.closed || !r.open) return { on: false, text: 'Днес е почивен ден' };
    var d = new Date(), m = d.getHours() * 60 + d.getMinutes();
    var a = r.open.split(':'), b = r.close.split(':');
    var from = +a[0] * 60 + +a[1], to = +b[0] * 60 + +b[1];
    if (m < from) return { on: false, text: 'Отваря в ' + r.open };
    if (m >= to)  return { on: false, text: 'Затворено · утре от ' + r.open };
    return { on: true, text: 'Отворено до ' + r.close };
  }

  function tile(o) {
    return '<div class="tile' + (o.tone ? ' t-' + o.tone : '') + '">' +
      '<span class="ico">' + icon(o.icon) + '</span>' +
      '<span class="k">' + o.k + '</span>' +
      '<span class="v">' + o.v + '</span>' +
      '<span class="s">' + o.s + '</span>' +
    '</div>';
  }

  function quick(id, ic, title, sub) {
    return '<a href="#/' + id + '"><span class="qi">' + icon(ic) + '</span>' +
      '<span><b>' + title + '</b><span>' + sub + '</span></span></a>';
  }

  function plural(n, one, few, many) {
    return n === 1 ? one : (n < 5 ? few : many);
  }

  /* Първото нещо на екрана: чакат ли поръчки обаждане.
     Показва целите данни, за да не се налага второ кликване. */
  function alarm(fresh) {
    if (!fresh.length) {
      return '<section class="alarm calm">' +
        '<span class="alarm-ico">' + icon('check') + '</span>' +
        '<div class="alarm-txt">' +
          '<h2>Няма чакащи поръчки</h2>' +
          '<p>Всичко от формата е обработено. Новите заявки ще се появят тук.</p>' +
        '</div>' +
        '<a class="abtn abtn-sm" href="#/inbox">Виж всички' + icon('right') + '</a>' +
      '</section>';
    }

    var rows = fresh.map(function (o) {
      var tel = o.phone.replace(/\s/g, '');
      return '<article class="alarm-row">' +
        '<span class="alarm-who">' +
          '<b>' + UI.esc(o.name) + '</b>' +
          '<a href="tel:' + UI.attr(tel) + '">' + UI.esc(o.phone) + '</a>' +
        '</span>' +
        '<span class="alarm-what">' + UI.esc(o.msg) +
          '<em>За: ' + UI.esc(o.time) + ' · приета ' + UI.esc(o.at) + '</em>' +
        '</span>' +
        '<a class="abtn abtn-sm abtn-primary" href="tel:' + UI.attr(tel) + '">' +
          icon('phone') + 'Обади се</a>' +
      '</article>';
    }).join('');

    return '<section class="alarm">' +
      '<div class="alarm-head">' +
        '<span class="alarm-ico">' + icon('inbox') + '<b>' + fresh.length + '</b></span>' +
        '<div class="alarm-txt">' +
          '<h2>' + fresh.length + ' ' + plural(fresh.length, 'нова поръчка чака', 'нови поръчки чакат', 'нови поръчки чакат') + '</h2>' +
          '<p>Обади се, за да потвърдиш, и отбележи поръчката като готова.</p>' +
        '</div>' +
        '<a class="abtn abtn-sm" href="#/inbox">Отвори поръчките' + icon('right') + '</a>' +
      '</div>' +
      '<div class="alarm-list">' + rows + '</div>' +
    '</section>';
  }

  TERA.views.dashboard = {
    eyebrow: 'Преглед',
    title: 'Табло',
    desc: 'Бърз поглед към витрината, поръчките и това, което е публикувано в момента.',

    render: function () {
      var d = store.data;
      var now = new Date();
      var status = openNow();
      var secOn = d.sections.filter(function (s) { return s.on !== false; }).length;
      var prodOn = d.products.items.filter(function (p) { return p.on !== false; }).length;
      var promoOn = d.promo.items.filter(function (p) { return p.on !== false; }).length;
      var kitchenOn = d.kitchen.items.filter(function (p) { return p.on !== false; }).length;
      var fresh = d.inbox.filter(function (o) { return o.status === 'new'; });

      var head = UI.card({
        title: DAYS[now.getDay()] + ', ' + now.getDate() + ' ' + MONTHS[now.getMonth()],
        desc: d.contact.city + ' · ' + d.contact.street,
        actions: '<span class="pill ' + (status.on ? 'pill-on' : 'pill-off') + '">' + status.text + '</span>',
        body:
          '<div class="tiles" style="margin-bottom:0">' +
            tile({ k:'Продукти в ценоразписа', v:prodOn,    s:'от ' + d.products.items.length + ' общо', icon:'tag' }) +
            tile({ k:'Топла кухня днес',       v:kitchenOn, s:'ястия във витрината',                    icon:'flame', tone:'amber' }) +
            tile({ k:'Активни промоции',       v:promoOn,   s:'на началната страница',                  icon:'percent' }) +
            tile({ k:'Включени секции',        v:secOn,     s:'от ' + d.sections.length + ' в сайта',    icon:'layers', tone:'herb' }) +
          '</div>'
      });

      var links = UI.card({
        title: 'Какво искаш да смениш',
        desc: 'Най-честите промени — на един клик.',
        body: '<div class="quick">' +
          quick('products', 'tag',     'Цени',        'Ценоразписът на витрината') +
          quick('kitchen',  'flame',   'Топла кухня', 'Ястията за днес') +
          quick('promo',    'percent', 'Промоции',    'Офертата на седмицата') +
          quick('gallery',  'image',   'Снимки',      'Галерията на сайта') +
          quick('hero',     'home',    'Начален екран', 'Заглавие и избор на месаря') +
          quick('settings', 'clock',   'Работно време', 'Часове и почивни дни') +
        '</div>'
      });

      var orders = d.inbox.slice(0, 5).map(function (o) {
        var cls = o.status === 'new' ? 'pill-new' : o.status === 'wait' ? 'pill-wait' : 'pill-off';
        var lab = o.status === 'new' ? 'Нова' : o.status === 'wait' ? 'Чака' : 'Готова';
        return '<div class="tl-row' + (o.status === 'done' ? ' past' : '') + '">' +
          '<span class="tl-dot"></span>' +
          '<span class="tl-txt"><b>' + UI.esc(o.name) + ' · ' + UI.esc(o.phone) + '</b>' +
            '<span>' + UI.esc(o.msg) + '</span></span>' +
          '<span class="pill ' + cls + '">' + lab + '</span>' +
        '</div>';
      }).join('');

      var inbox = UI.card({
        title: 'Последни поръчки',
        desc: 'От формата на сайта.',
        actions: '<a class="abtn abtn-sm" href="#/inbox">Виж всички' + icon('right') + '</a>',
        body: '<div class="timeline">' + orders + '</div>'
      });

      var offSecs = d.sections.filter(function (s) { return s.on === false; });
      var state = UI.card({
        title: 'Състояние на сайта',
        desc: secOn + ' от ' + d.sections.length + ' секции са включени.',
        body:
          (offSecs.length
            ? '<div class="note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>' +
              '<span>Скрити от посетителите: <b>' + offSecs.map(function (s) { return UI.esc(s.label); }).join(', ') + '</b>. Включи ги отново от „Секции“.</span></div>'
            : '<div class="note info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
              '<span>Всички секции са включени и се виждат от посетителите.</span></div>') +
          '<div class="sep"></div>' +
          '<div class="row-flex">' +
            '<a class="abtn abtn-sm" href="#/sections">' + icon('layers') + 'Подреди секциите</a>' +
            '<a class="abtn abtn-sm" href="../index.html" target="_blank" rel="noopener">' + icon('external') + 'Отвори сайта</a>' +
          '</div>'
      });

      return alarm(fresh) + head + links + '<div class="grid">' +
        '<div>' + inbox + '</div>' +
        '<div>' + state + '</div>' +
      '</div>';
    }
  };
})();
