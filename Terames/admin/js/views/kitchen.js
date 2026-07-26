/* Топла кухня — ястията, които се сменят най-често */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store;

  UI.blanks['kitchen.items'] = function () {
    return { name:'Ново ястие', desc:'', eur:'', unit:'/ порция', on:true };
  };

  TERA.views.kitchen = {
    eyebrow: 'Секция',
    title: 'Топла кухня',
    anchor: 'kitchen',
    desc: 'Готовата храна за вкъщи. Изключвай ястие, когато свърши — така не обещаваш нещо, което го няма.',

    render: function () {
      var items = store.get('kitchen.items') || [];
      var live = items.filter(function (i) { return i.on !== false; }).length;

      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'Топла кухня' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Готово за вкъщи' },
          { k:'stamp',   label:'Стикер вдясно', type:'text', ph:'Топло от 11:00' },
          { k:'note',    label:'Бележка под ястията', type:'textarea', w:'full', rows:3 }
        ], 'kitchen')
      }) +

      UI.card({
        title: 'Ястия',
        desc: live + ' от ' + items.length + ' се показват в момента.',
        body: UI.rep({
          path: 'kitchen.items',
          addLabel: 'Добави ястие',
          title: function (it) { return it.name; },
          val: function (it) {
            if (it.out) return 'изчерпано';
            return it.eur ? it.eur + ' € ' + it.unit : '';
          },
          toggleKey: 'on',
          specs: [
            { k:'name', label:'Име на ястието', type:'text', w:'full', ph:'Домашна мусака' },
            { k:'desc', label:'Описание', type:'textarea', w:'full', rows:2,
              ph:'С кайма смес 60/40 и запечена заливка — както я прави баба.' },
            { k:'eur',  label:'Цена', type:'price' },
            { k:'unit', label:'За колко', type:'select', opts:['/ порция','/ бр','/ кг','/ 100 г'] },
            { k:'out',  label:'Свърши за днес', type:'switch',
              sub:'Остава на сайта, но зачертано — утре го връщаш с един клик' },
            { k:'on',   label:'Показвай ястието', type:'switch',
              sub:'Изключи съвсем, ако не го правиш вече' }
          ]
        })
      });
    }
  };
})();
