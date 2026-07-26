/* Съвети от месаря */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store;

  UI.blanks['tips.items'] = function () {
    return { title:'Нов съвет', text:'', foot:'', on:true };
  };

  TERA.views.tips = {
    eyebrow: 'Секция',
    title: 'Съвети от месаря',
    anchor: 'tips',
    desc: 'Кратките полезни карти. Номерата „Съвет 01, 02, 03“ се слагат автоматично по реда тук.',

    render: function () {
      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'Съвети от месаря' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Малки тайни, голяма разлика' }
        ], 'tips')
      }) +

      UI.card({
        title: 'Съвети',
        desc: (store.get('tips.items') || []).length + ' карти.',
        body: UI.rep({
          path: 'tips.items',
          addLabel: 'Добави съвет',
          title: function (it) { return it.title; },
          val: function (it, i) { return 'Съвет ' + String(i + 1).padStart(2, '0'); },
          toggleKey: 'on',
          specs: [
            { k:'title', label:'Заглавие на съвета', type:'text', w:'full', ph:'Как да избереш стек' },
            { k:'text',  label:'Обяснение', type:'textarea', w:'full', rows:4 },
            { k:'foot',  label:'Ред в дъното', type:'text', w:'full',
              ph:'Извади го 30 мин преди готвене',
              hint:'Показва се с моноширинен шрифт — кратко правило за запомняне.' },
            { k:'on',    label:'Показвай съвета', type:'switch', w:'full' }
          ]
        })
      });
    }
  };
})();
