/* Менюта — горна лента и мобилно меню */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['nav.header'] = function () { return { label:'Нова връзка', href:'#top' }; };
  UI.blanks['nav.mobile'] = UI.blanks['nav.header'];
  UI.blanks['nav.pages']  = function () { return { label:'Нова страница', href:'' }; };
  UI.blanks['nav.legal']  = function () { return { label:'Нова връзка', href:'' }; };

  /* Връзка може да води към отделна страница (папка) или към секция
     на началната (котва). Затова изборът предлага и двете. */
  function pageOpts() {
    return (store.get('nav.pages') || []).map(function (p) {
      return { v: p.href, l: '📄 ' + p.label + '  (/' + p.href + ')' };
    });
  }

  function anchorOpts() {
    return (store.get('sections') || []).map(function (s) {
      return { v: '#' + s.id, l: '⌄ ' + s.label + '  (#' + s.id + ')' };
    });
  }

  function linkOpts() {
    return [{ v:'', l:'🏠 Начална страница' }].concat(pageOpts(), anchorOpts());
  }

  function linkSpecs() {
    return [
      { k:'label', label:'Надпис', type:'text', ph:'За нас' },
      { k:'href',  label:'Води към', type:'select', opts: linkOpts(),
        hint:'📄 е отделна страница, ⌄ е секция на началната. Изключена секция води доникъде.' }
    ];
  }

  TERA.views.nav = {
    eyebrow: 'Структура',
    title: 'Менюта',
    desc: 'Връзките в горната лента и в мобилното меню. Кратките менюта се четат по-лесно — до седем връзки горе.',

    render: function () {
      var h = store.get('nav.header') || [];
      var m = store.get('nav.mobile') || [];

      return UI.card({
        title: 'Горно меню',
        desc: h.length + ' връзки. Виждат се само на голям екран.',
        body:
          (h.length > 7
            ? '<div class="note">' + icon('alert') +
              '<span>' + h.length + ' връзки са много за горната лента — на по-тесни екрани ще се струпат. Премести част от тях само в мобилното меню или във футъра.</span></div><div style="height:1rem"></div>'
            : '') +
          UI.rep({
            path: 'nav.header',
            addLabel: 'Добави връзка',
            title: function (it) { return it.label; },
            val: function (it) { return it.href; },
            specs: linkSpecs()
          })
      }) +

      UI.card({
        title: 'Мобилно меню',
        desc: m.length + ' връзки. Отваря се от бутона с трите чертички на телефон.',
        body: UI.rep({
          path: 'nav.mobile',
          addLabel: 'Добави връзка',
          title: function (it) { return it.label; },
          val: function (it) { return it.href; },
          specs: linkSpecs()
        })
      }) +

      UI.card({
        title: 'Страници на сайта',
        desc: (store.get('nav.pages') || []).length + ' страници. Влизат в мобилното меню и във футъра, ' +
              'и стават възможен избор при връзките горе.',
        body:
          '<div class="note info">' + icon('alert') +
            '<span>Адресът е името на папката, завършващо с наклонена черта — например <code class="mono">recepti/</code>. ' +
            'Ако смениш адрес тук, без папката да е преименувана, връзката ще води до празна страница. ' +
            'Виж кои адреси съществуват в <a href="#/pages" style="color:var(--blood);text-decoration:underline">Страници → Преглед</a>.</span></div>' +
          '<div style="height:1rem"></div>' +
          UI.rep({
            path: 'nav.pages',
            addLabel: 'Добави страница',
            title: function (it) { return it.label; },
            val: function (it) { return '/' + it.href; },
            specs: [
              { k:'label', label:'Надпис', type:'text', ph:'Рецепти' },
              { k:'href',  label:'Папка', type:'text', mono:true, ph:'recepti/' }
            ]
          })
      }) +

      UI.card({
        title: 'Правни връзки',
        desc: 'Реда най-долу във футъра. Показва се на всяка страница.',
        body: UI.rep({
          path: 'nav.legal',
          addLabel: 'Добави връзка',
          title: function (it) { return it.label; },
          val: function (it) { return '/' + it.href; },
          specs: [
            { k:'label', label:'Надпис', type:'text', ph:'Общи условия' },
            { k:'href',  label:'Папка', type:'text', mono:true, ph:'usloviya/' }
          ]
        })
      }) +

      UI.card({
        title: 'Надписи в мобилното меню',
        body: UI.fields([
          { k:'homeLabel',     label:'Връзка към началната', type:'text', ph:'Начало' },
          { k:'groupPages',    label:'Заглавие над страниците', type:'text', ph:'Страници' },
          { k:'groupSections', label:'Заглавие над секциите', type:'text', ph:'На началната' }
        ], 'nav')
      }) +

      UI.card({
        title: 'Бутон с телефона',
        body: '<div class="note info">' + icon('info') +
          '<span>Червеният бутон с номера горе вдясно и плаващите икони отдолу вземат телефона от ' +
          '<a href="#/contacts" style="color:var(--blood);text-decoration:underline">Контакти</a> — не се настройват отделно. ' +
          'Кошницата в шапката се показва от 769 пиксела нагоре; на телефон остава летящият бутон.</span></div>'
      });
    }
  };
})();
