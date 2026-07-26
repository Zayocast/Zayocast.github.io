/* ============================================================
   TERA.MES admin (хоризонтален вариант) — обвивка и навигация
   Две нива: горе разделите, под тях страниците в избрания раздел.
   ============================================================ */
window.TERA = window.TERA || {};
TERA.views = TERA.views || {};

(function () {
  'use strict';

  var store = TERA.store;
  var icon = TERA.icon;

  /* ---------- страници ---------- */
  var PAGE = {
    dashboard:{ label:'Табло',            icon:'dashboard' },
    today:    { label:'Днес',             icon:'today' },
    inbox:    { label:'Поръчки',          icon:'inbox' },
    hero:     { label:'Начален екран',    icon:'home',      sec:'hero' },
    about:    { label:'За нас',           icon:'info',      sec:'about' },
    cuts:     { label:'Разфасовки',       icon:'map',       sec:'cuts' },
    products: { label:'Витрина и цени',   icon:'tag',       sec:'products' },
    kitchen:  { label:'Топла кухня',      icon:'flame',     sec:'kitchen' },
    promo:    { label:'Промоции',         icon:'percent',   sec:'promo' },
    sets:     { label:'Сетове',           icon:'box',       sec:'sets' },
    calc:     { label:'Калкулатор',       icon:'calc',      sec:'calc' },
    tips:     { label:'Съвети',           icon:'bulb',      sec:'tips' },
    recipes:  { label:'Рецепти',          icon:'book',      sec:'recipes' },
    holidays: { label:'Празници',         icon:'gift',      sec:'holidays' },
    kurban:   { label:'Заявки и курбан',  icon:'calendar',  sec:'kurban' },
    order:    { label:'Форма за поръчка', icon:'clipboard', sec:'order' },
    gallery:  { label:'Галерия',          icon:'image',     sec:'gallery' },
    reviews:  { label:'Отзиви',           icon:'star',      sec:'reviews' },
    insta:    { label:'Instagram',        icon:'instagram', sec:'insta' },
    faq:      { label:'Чести въпроси',    icon:'help',      sec:'faq' },
    contacts: { label:'Контакти',         icon:'pin',       sec:'contacts' },
    sections: { label:'Секции',           icon:'layers' },
    nav:      { label:'Менюта',           icon:'list' },
    footer:   { label:'Долен колонтитул', icon:'panel' },
    media:    { label:'Снимки',           icon:'folder' },
    settings: { label:'Настройки',        icon:'cog' },
    history:  { label:'История',          icon:'undo' }
  };

  /* ---------- раздели ---------- */
  /* Поръчките са собствен раздел веднага след Таблото — не се крият
     в подменю, защото са единственото, което не търпи отлагане. */
  var GROUPS = [
    { id:'dashboard', label:'Табло',      icon:'dashboard', pages:['dashboard'] },
    { id:'today',     label:'Днес',       icon:'today',     pages:['today'] },
    { id:'orders',    label:'Поръчки',    icon:'inbox',     pages:['inbox'], counter:true },
    { id:'content',   label:'Съдържание', icon:'layers',    pages:[
        'hero','about','cuts','products','kitchen','promo','sets','calc',
        'tips','recipes','holidays','kurban','order','gallery','reviews','insta','faq','contacts'] },
    { id:'structure', label:'Структура',  icon:'panel',     pages:['sections','nav','footer'] },
    { id:'media',     label:'Снимки',     icon:'folder',    pages:['media'] },
    { id:'settings',  label:'Настройки',  icon:'cog',       pages:['settings','history'] }
  ];

  function newOrders() {
    return (store.get('inbox') || []).filter(function (o) { return o.status === 'new'; }).length;
  }

  function groupOf(route) {
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].pages.indexOf(route) > -1) return GROUPS[i];
    }
    return GROUPS[0];
  }

  function isOff(route) {
    var sid = (PAGE[route] || {}).sec;
    if (!sid) return false;
    var s = (store.get('sections') || []).filter(function (x) { return x.id === sid; })[0];
    return !!s && s.on === false;
  }

  /* ---------- рутер ---------- */
  var router = {
    route: 'dashboard',
    tab: null,

    resolve: function () {
      var id = (location.hash || '').replace(/^#\//, '') || 'dashboard';
      if (!TERA.views[id]) id = 'dashboard';
      if (id !== router.route) router.tab = null;
      router.route = id;
      router.render();
      paintNav();
      window.scrollTo(0, 0);
    },

    render: function () {
      var view = TERA.views[router.route];
      var host = document.getElementById('view');
      if (!view || !host) return;

      var actions = typeof view.actions === 'function' ? view.actions() : (view.actions || '');
      if (view.anchor) {
        actions = '<a class="abtn abtn-sm" href="../index.html#' + view.anchor + '" target="_blank" rel="noopener">' +
          icon('eye') + 'Виж в сайта</a>' + actions;
      }

      host.innerHTML = TERA.UI.page({
        eyebrow: view.eyebrow,
        title: view.title,
        desc: view.desc,
        actions: actions
      }) + view.render();

      paintCrumbs(view);
      paintSaveBar();
    }
  };
  TERA.router = router;

  /* ---------- рисуване на менютата ---------- */
  function buildGroups() {
    document.getElementById('groups').innerHTML = GROUPS.map(function (g) {
      return '<a class="group-btn" href="#/' + g.pages[0] + '" data-group="' + g.id + '">' +
        icon(g.icon) + '<span>' + g.label + '</span>' +
        (g.counter ? '<span class="badge" data-count-new hidden></span>' : '') +
      '</a>';
    }).join('');
  }

  function buildContext() {
    var g = groupOf(router.route);
    var strip = document.getElementById('context');
    var host = document.getElementById('contextIn');

    /* раздел с една страница няма нужда от втора лента */
    if (g.pages.length < 2) { strip.hidden = true; host.innerHTML = ''; return; }
    strip.hidden = false;

    host.innerHTML = g.pages.map(function (p) {
      var page = PAGE[p];
      return '<a class="ctx-link' + (p === router.route ? ' on' : '') + (isOff(p) ? ' off-flag' : '') +
        '" href="#/' + p + '" data-ctx="' + p + '"' + (isOff(p) ? ' title="Секцията е скрита от сайта"' : '') + '>' +
        icon(page.icon) + '<span>' + page.label + '</span></a>';
    }).join('');

    var on = host.querySelector('.ctx-link.on');
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });

    /* избледняване вдясно само когато наистина има какво още да се види */
    strip.classList.toggle('more', host.scrollWidth > host.clientWidth + 4);
  }

  function buildMobile() {
    document.getElementById('mobNav').innerHTML = GROUPS.map(function (g) {
      if (g.pages.length < 2) {
        return '<a href="#/' + g.pages[0] + '" data-nav="' + g.pages[0] + '">' +
          icon(g.icon) + '<span>' + g.label + '</span>' +
          (g.counter ? '<span class="badge" data-count-new hidden></span>' : '') + '</a>';
      }
      return '<h3>' + g.label + '</h3>' + g.pages.map(function (p) {
        return '<a href="#/' + p + '" data-nav="' + p + '"' + (isOff(p) ? ' class="off-flag"' : '') + '>' +
          icon(PAGE[p].icon) + '<span>' + PAGE[p].label + '</span></a>';
      }).join('');
    }).join('');
  }

  function paintNav() {
    var g = groupOf(router.route);
    document.querySelectorAll('[data-group]').forEach(function (a) {
      a.classList.toggle('on', a.dataset.group === g.id);
    });
    buildContext();
    document.querySelectorAll('#mobNav [data-nav]').forEach(function (a) {
      a.classList.toggle('on', a.dataset.nav === router.route);
    });
    paintCounts();
  }

  function paintCrumbs(view) {
    var g = groupOf(router.route);
    var same = g.label.toLowerCase() === String(view.title).toLowerCase();
    document.getElementById('crumbs').innerHTML = same
      ? '<b>' + TERA.UI.esc(view.title) + '</b>'
      : '<span>' + g.label + '</span>' + icon('right') + '<b>' + TERA.UI.esc(view.title) + '</b>';
  }

  /* Броячът на нови поръчки — в двете менюта, в лентата и в заглавието. */
  function paintCounts() {
    var n = newOrders();

    document.querySelectorAll('[data-count-new]').forEach(function (b) {
      b.textContent = n;
      b.hidden = !n;
    });

    var btn = document.getElementById('ordersBtn');
    if (btn) {
      btn.classList.toggle('has-new', !!n);
      btn.setAttribute('aria-label', n ? n + ' нови поръчки' : 'Поръчки');
      btn.setAttribute('title', n ? n + ' нови поръчки' : 'Поръчки — няма нови');
    }

    document.title = (n ? '(' + n + ') ' : '') + 'Панел · Tera.MES';
  }

  /* ---------- лента за запис ---------- */
  function paintSaveBar() {
    document.getElementById('savebar').classList.toggle('up', store.dirty);
  }
  store.onChange(function () { paintSaveBar(); paintCounts(); });

  function doSave() {
    if (!store.dirty) { TERA.UI.toast('Няма нови промени'); return; }
    var btn = document.getElementById('saveBtn');
    btn.disabled = true;
    store.save(PAGE[router.route] ? PAGE[router.route].label : '')
      .then(function () {
        TERA.UI.toast('Промените са записани');
        paintNav();
      })
      .catch(function (err) {
        TERA.UI.toast(err.message || 'Записът не мина', 'err');
      })
      .then(function () { btn.disabled = false; });
  }

  function doRevert() {
    TERA.UI.confirm({
      title: 'Отказ от промените',
      text: 'Всички незаписани промени ще бъдат върнати към последния запис.',
      ok: 'Върни'
    }).then(function (ok) {
      if (!ok) return;
      return store.revert().then(function () {
        TERA.UI.rerender();
        TERA.UI.toast('Промените са отменени');
      });
    });
  }

  /* ---------- тема ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('tera_admin_theme', t);
    var b = document.getElementById('themeBtn');
    if (b) {
      b.innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
      b.setAttribute('aria-label', t === 'dark' ? 'Светла тема' : 'Тъмна тема');
    }
  }

  /* ---------- меню на телефон ---------- */
  function mob(open) {
    document.getElementById('mobmenu').classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  /* ---------- старт ---------- */
  function init() {
    applyTheme(localStorage.getItem('tera_admin_theme') || 'light');
    /* съдържанието идва асинхронно, за да не се пренаписва нищо,
       когато мине през сървър — панелът се рисува чак след него */
    store.load().then(boot).catch(function (err) {
      document.getElementById('view').innerHTML =
        '<div class="empty"><b>Съдържанието не се зареди</b><p>' +
        TERA.UI.esc(err.message || 'Неизвестна грешка') + '</p></div>';
    });
  }

  function boot() {
    buildGroups();
    buildMobile();

    var u = (store.get('users') || [])[0] || { name: 'Собственик', role: 'Администратор' };
    document.getElementById('barUser').innerHTML =
      '<span class="av">' + TERA.UI.esc(u.name.charAt(0)) + '</span>' +
      '<span>' + TERA.UI.esc(u.name) + '</span>';

    window.addEventListener('hashchange', function () { mob(false); router.resolve(); });
    router.resolve();

    document.getElementById('saveBtn').addEventListener('click', doSave);
    document.getElementById('revertBtn').addEventListener('click', doRevert);
    document.getElementById('themeBtn').addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('burger').addEventListener('click', function () { mob(true); });
    document.getElementById('mobClose').addEventListener('click', function () { mob(false); });
    document.getElementById('barUser').addEventListener('click', function () {
      TERA.UI.confirm({ title: 'Изход', text: 'Ще излезеш от панела. Незаписаните промени се губят.', ok: 'Излез' })
        .then(function (ok) { if (ok) location.href = 'login.html'; });
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); doSave(); }
      if (e.key === 'Escape') mob(false);
    });

    window.addEventListener('beforeunload', function (e) {
      if (!store.dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  TERA.save = doSave;
  document.addEventListener('DOMContentLoaded', init);
})();
