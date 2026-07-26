/* Менюта — горна лента и мобилно меню */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['nav.header'] = function () { return { label:'Нова връзка', href:'#' }; };
  UI.blanks['nav.mobile'] = UI.blanks['nav.header'];

  function anchors() {
    return (store.get('sections') || []).map(function (s) {
      return { v: '#' + s.id, l: s.label + '  (#' + s.id + ')' };
    });
  }

  var specs = [
    { k:'label', label:'Надпис', type:'text', ph:'За нас' },
    { k:'href',  label:'Води към секция', type:'select', opts: [] }
  ];

  function linkSpecs() {
    return [
      { k:'label', label:'Надпис', type:'text', ph:'За нас' },
      { k:'href',  label:'Води към секция', type:'select', opts: anchors(),
        hint:'Ако секцията е изключена от „Секции“, връзката води доникъде.' }
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
        title: 'Бутон с телефона',
        body: '<div class="note info">' + icon('info') +
          '<span>Червеният бутон с номера горе вдясно и плаващите икони отдолу вземат телефона от ' +
          '<a href="#/contacts" style="color:var(--blood);text-decoration:underline">Контакти</a> — не се настройват отделно.</span></div>'
      });
    }
  };
})();
