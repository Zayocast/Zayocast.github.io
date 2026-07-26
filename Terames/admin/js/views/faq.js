/* Чести въпроси */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['faq.items'] = function () {
    return { q:'Нов въпрос', a:'', on:true };
  };

  TERA.views.faq = {
    eyebrow: 'Секция',
    title: 'Чести въпроси',
    anchor: 'faq',
    desc: 'Въпросите се номерират автоматично по реда тук. Отговорите се четат и от Google — пиши ги пълно, с цели изречения.',

    render: function () {
      var items = store.get('faq.items') || [];
      var live = items.filter(function (i) { return i.on !== false; }).length;

      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'Питаш — отговаряме' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Чести въпроси' },
          { k:'lead',    label:'Текст под заглавието', type:'textarea', w:'full', rows:3 }
        ], 'faq')
      }) +

      UI.card({
        title: 'Кутия „Не намери отговор?“',
        desc: 'Малката карта с телефона отстрани.',
        body: UI.fields([
          { k:'helpTitle', label:'Заглавие', type:'text', ph:'Не намери отговор?' },
          { k:'helpHours', label:'Работно време', type:'text', ph:'Пон – Съб · 08:00 – 19:00' },
          { k:'helpBtn',   label:'Текст на бутона', type:'text', w:'full', ph:'Обади се' }
        ], 'faq')
      }) +

      UI.card({
        title: 'Въпроси и отговори',
        desc: live + ' от ' + items.length + ' се показват.',
        body:
          '<div class="note info">' + icon('info') +
            '<span>Първо сложи въпросите, които ти задават най-често на тезгяха — те носят най-много полза и на посетителя, и на класирането в Google.</span></div>' +
          '<div style="height:1rem"></div>' +
          UI.rep({
            path: 'faq.items',
            addLabel: 'Добави въпрос',
            title: function (it) { return it.q; },
            val: function (it, i) { return String(i + 1).padStart(2, '0'); },
            toggleKey: 'on',
            specs: [
              { k:'q',  label:'Въпрос', type:'text', w:'full', ph:'Мога ли да поръчам предварително?' },
              { k:'a',  label:'Отговор', type:'textarea', w:'full', rows:4 },
              { k:'on', label:'Показвай въпроса', type:'switch', w:'full' }
            ]
          })
      });
    }
  };
})();
