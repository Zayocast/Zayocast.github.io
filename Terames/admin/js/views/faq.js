/* Чести въпроси */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['faq.items'] = function () {
    return { q:'Нов въпрос', a:'', group:'', on:true };
  };

  TERA.views.faq = {
    eyebrow: 'Секция',
    title: 'Чести въпроси',
    anchor: 'faq',
    desc: 'Въпросите се номерират автоматично по реда тук. Отговорите се четат и от Google — пиши ги пълно, с цели изречения.',

    render: function () {
      var items = store.get('faq.items') || [];
      var live = items.filter(function (i) { return i.on !== false; }).length;

      var groups = [];
      items.forEach(function (i) { if (i.group && groups.indexOf(i.group) < 0) groups.push(i.group); });

      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'Питаш — отговаряме' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Чести въпроси' },
          { k:'lead',    label:'Текст под заглавието', type:'textarea', w:'full', rows:3 }
        ], 'faq')
      }) +

      UI.card({
        title: 'Търсене във въпросите',
        desc: 'Полето над списъка. Филтрира на място, докато посетителят пише.',
        body: UI.fields([
          { k:'searchPlaceholder', label:'Текст в празното поле', type:'text', ph:'Търси във въпросите…' },
          { k:'noResults',         label:'Когато няма съвпадение', type:'text',
            ph:'Няма въпрос с тази дума. Обади се — отговаряме на всичко.' }
        ], 'faq')
      }) +

      UI.card({
        title: 'Лента „Не намери отговор?“',
        desc: 'Широката тъмна лента под въпросите.',
        body: UI.fields([
          { k:'helpTitle', label:'Заглавие', type:'text', ph:'Не намери отговор?' },
          { k:'helpHours', label:'Работно време', type:'text', ph:'Пон – Съб · 08:00 – 19:00' },
          { k:'helpBtn',   label:'Първи бутон', type:'text', ph:'Обади се' },
          { k:'helpBtn2',  label:'Втори бутон', type:'text', ph:'Пиши във Viber' }
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
            val: function (it) { return it.group || ''; },
            toggleKey: 'on',
            specs: [
              { k:'q',     label:'Въпрос', type:'text', w:'full', ph:'Мога ли да поръчам предварително?' },
              { k:'a',     label:'Отговор', type:'textarea', w:'full', rows:4 },
              { k:'group', label:'Тема', type:'text', ph:'Поръчки',
                hint:'Малкият етикет вдясно на въпроса. Ползвай няколко повтарящи се думи' +
                     (groups.length ? ' — засега: ' + groups.join(', ') + '.' : '. Остави празно, ако не ти трябва.') },
              { k:'on',    label:'Показвай въпроса', type:'switch' }
            ]
          })
      });
    }
  };
})();
