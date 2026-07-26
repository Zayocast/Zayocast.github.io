/* Днес — сутрешният екран: какво го има, какво свърши, коя цена се смени.
   Направен за телефон, с една ръка, между двама клиенти. */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  /** Компактен ред: име, цена и превключвател „свърши“. */
  function row(path, i, it, unit) {
    var p = path + '.' + i;
    var out = !!it.out;
    return '<div class="qrow' + (out ? ' is-out' : '') + '">' +
      '<span class="qrow-name">' + UI.esc(it.name) +
        (it.desc ? '<em>' + UI.esc(it.desc) + '</em>' : '') +
      '</span>' +
      '<span class="qrow-price">' +
        '<input class="inp mono-inp" data-path="' + p + '.eur" data-price value="' + UI.attr(it.eur) + '" inputmode="decimal" aria-label="Цена на ' + UI.attr(it.name) + '">' +
        '<b>€' + (unit ? ' ' + UI.esc(unit) : '') + '</b>' +
      '</span>' +
      '<label class="qrow-out" title="Отбележи като изчерпано">' +
        '<input type="checkbox" data-path="' + p + '.out" data-bool' + (out ? ' checked' : '') + '>' +
        '<span class="track"></span>' +
        '<span class="qrow-out-lbl">свърши</span>' +
      '</label>' +
    '</div>';
  }

  function todayName() {
    var D = ['неделя','понеделник','вторник','сряда','четвъртък','петък','събота'];
    var M = ['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];
    var d = new Date();
    return D[d.getDay()] + ', ' + d.getDate() + ' ' + M[d.getMonth()];
  }

  TERA.views.today = {
    eyebrow: 'Всяка сутрин',
    title: 'Днес',
    desc: 'Всичко, което се сменя всеки ден, на един екран — без да обикаляш секциите.',

    actions: function () {
      return '<button type="button" class="abtn abtn-sm" data-today-reset>' +
        icon('refresh') + 'Върни всичко в наличност</button>';
    },

    render: function () {
      var kitchen = store.get('kitchen.items') || [];
      var products = store.get('products.items') || [];
      var cats = store.get('products.categories') || [];

      var outK = kitchen.filter(function (i) { return i.out; }).length;
      var outP = products.filter(function (i) { return i.out; }).length;

      /* --- топла кухня --- */
      var kitchenCard = UI.card({
        title: 'Топла кухня',
        desc: outK ? outK + ' от ' + kitchen.length + ' са свършили' : 'Всичко е налично',
        body: kitchen.length
          ? '<div class="qlist">' + kitchen.map(function (it, i) {
              return row('kitchen.items', i, it, it.unit);
            }).join('') + '</div>'
          : '<div class="empty">' + icon('flame') + '<b>Няма ястия</b><p>Добави ги от „Топла кухня“.</p></div>'
      });

      /* --- ценоразпис по категории --- */
      var byCat = cats.map(function (c) {
        var rows = [];
        products.forEach(function (p, i) {
          if (p.cat === c.key && p.on !== false) rows.push(row('products.items', i, p, '/ кг'));
        });
        if (!rows.length) return '';
        return '<details class="qgroup"' + '>' +
          '<summary><b>' + UI.esc(c.label) + '</b><span>' + rows.length + '</span>' +
            icon('chevron') + '</summary>' +
          '<div class="qlist">' + rows.join('') + '</div>' +
        '</details>';
      }).join('');

      var pricesCard = UI.card({
        title: 'Цени на витрината',
        desc: outP ? outP + ' продукта са отбелязани като изчерпани' : products.length + ' продукта, всичко в наличност',
        body: byCat || '<div class="empty">' + icon('tag') + '<b>Няма продукти</b></div>'
      });

      /* --- избор на месаря --- */
      var pick = store.get('hero.card') || {};
      var pickCard = UI.card({
        title: 'Избор на месаря',
        desc: 'Продуктът, който стои най-отгоре на сайта.',
        body: UI.fields([
          { k:'name', label:'Какво е днес', type:'text' },
          { k:'eur',  label:'Цена', type:'price' },
          { k:'desc', label:'Кратък ред под името', type:'text', w:'full' },
          { k:'stamp',label:'Стикер', type:'text', w:'full' }
        ], 'hero.card')
      });

      return UI.card({
        title: todayName(),
        desc: 'Отбележи какво е свършило и оправи цените, които са мръднали. Не забравяй да запазиш.',
        body: '<div class="note info">' + icon('info') +
          '<span>„Свърши“ оставя продукта в сайта, но зачертан и сив — утре го връщаш с един клик. ' +
          'За да махнеш нещо съвсем, използвай съответната секция.</span></div>'
      }) + kitchenCard + pricesCard + pickCard;
    }
  };

  /* --- връщане на всичко в наличност --- */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-today-reset]')) return;

    var lists = ['kitchen.items', 'products.items'];
    var n = 0;
    lists.forEach(function (p) {
      (store.get(p) || []).forEach(function (it) { if (it.out) n++; });
    });
    if (!n) { UI.toast('Нищо не е отбелязано като изчерпано'); return; }

    UI.confirm({
      title: 'Ново зареждане',
      text: n + ' продукта ще се върнат в наличност. Използва се сутрин, след като витрината е заредена.',
      ok: 'Върни всичко'
    }).then(function (ok) {
      if (!ok) return;
      lists.forEach(function (p) {
        (store.get(p) || []).forEach(function (it, i) {
          if (it.out) store.set(p + '.' + i + '.out', false);
        });
      });
      store.touch();
      UI.rerender();
      UI.toast(n + ' продукта са върнати в наличност');
    });
  });
})();
