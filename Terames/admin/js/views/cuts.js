/* Карта на разфасовките — двете диаграми и текстовете към частите */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  var cutSpecs = [
    { k:'name', label:'Име на разфасовката', type:'text', ph:'Свински врат' },
    { k:'eur',  label:'Ориентировъчна цена', type:'price',
      hint:'Остави празно за „по договаряне“.' },
    { k:'tags', label:'За какво става', type:'tags', w:'full',
      hint:'Кратки думи: Скара, Печене, Кайма… Enter добавя нова.' },
    { k:'desc', label:'Описание', type:'textarea', w:'full', rows:3,
      hint:'Показва се вдясно, когато посетителят посочи частта от диаграмата.' },
    { k:'key',  label:'Код на частта в диаграмата', type:'text', mono:true, w:'full',
      hint:'Свързва текста с точната зона от рисунката. Не го променяй, освен ако не знаеш какво правиш.' }
  ];

  TERA.views.cuts = {
    eyebrow: 'Секция',
    title: 'Карта на разфасовките',
    anchor: 'cuts',
    desc: 'Интерактивните диаграми на прасето и телето. Тук се пишат цените и обясненията за всяка част.',

    render: function () {
      var tab = TERA.router.tab || 'pork';
      var list = store.get('cuts.' + tab) || [];

      var head = UI.card({
        title: 'Заглавия на секцията',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text' },
          { k:'title',   label:'Заглавие', type:'text' },
          { k:'hint',    label:'Подсказка под диаграмата', type:'text', w:'full',
            ph:'Посочи или докосни част от диаграмата' },
          { k:'emptyTitle', label:'Заглавие, преди да се избере част', type:'text' },
          { k:'emptyText',  label:'Текст, преди да се избере част', type:'textarea', rows:3 }
        ], 'cuts')
      });

      var body = UI.card({
        title: (tab === 'pork' ? 'Свински' : 'Телешки') + ' разфасовки',
        desc: list.length + ' части · цените са ориентировъчни, на килограм.',
        body:
          UI.tabs([
            { id:'pork', label:'Свинско' },
            { id:'beef', label:'Телешко' }
          ], tab) +
          '<div class="note info" style="margin-bottom:1rem">' + icon('info') +
            '<span>Самите рисунки на прасето и телето са вградени в сайта и не се сменят оттук. ' +
            'Тук управляваш имената, цените и текстовете, които се показват при посочване.</span></div>' +
          UI.rep({
            path: 'cuts.' + tab,
            addLabel: 'Добави разфасовка',
            specs: cutSpecs,
            title: function (it) { return it.name; },
            val: function (it) { return it.eur ? it.eur + ' €' : 'по договаряне'; }
          })
      });

      return head + body;
    }
  };

  UI.blanks['cuts.pork'] = function () { return { key:'', name:'Нова разфасовка', tags:[], desc:'', eur:'' }; };
  UI.blanks['cuts.beef'] = UI.blanks['cuts.pork'];
})();
