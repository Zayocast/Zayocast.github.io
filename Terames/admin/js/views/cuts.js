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

  /* Свинското и телешкото имат интерактивни диаграми на началната
     страница; агнешкото и пилешкото се показват само като карти на
     /razfasovki/ — затова при тях кодът на зоната не е нужен. */
  var ANIMALS = [
    { id:'pork',    label:'Свинско',  diagram:true  },
    { id:'beef',    label:'Телешко',  diagram:true  },
    { id:'lamb',    label:'Агнешко',  diagram:false },
    { id:'chicken', label:'Пилешко',  diagram:false }
  ];

  TERA.views.cuts = {
    eyebrow: 'Секция',
    title: 'Карта на разфасовките',
    anchor: 'cuts',
    desc: 'Диаграмите на началната страница и справочникът на /razfasovki/ четат от едни и същи данни.',

    actions: '<a class="abtn abtn-sm" href="../razfasovki/" target="_blank" rel="noopener">Виж /razfasovki/</a>',

    render: function () {
      var tab = TERA.router.tab || 'pork';
      var animal = ANIMALS.filter(function (a) { return a.id === tab; })[0] || ANIMALS[0];
      var list = store.get('cuts.' + tab) || [];

      var specs = animal.diagram
        ? cutSpecs
        : cutSpecs.filter(function (s) { return s.k !== 'key'; });

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
        title: animal.label + ' разфасовки',
        desc: list.length + ' части · цените са ориентировъчни, на килограм.',
        body:
          UI.tabs(ANIMALS.map(function (a) { return { id:a.id, label:a.label }; }), tab) +
          '<div class="note info" style="margin-bottom:1rem">' + icon('info') +
            (animal.diagram
              ? '<span>Рисунката на ' + (tab === 'pork' ? 'прасето' : 'телето') + ' е вградена в сайта и не се сменя оттук. ' +
                'Тук управляваш имената, цените и текстовете, които изскачат при посочване — и същите се показват на /razfasovki/.</span>'
              : '<span>' + animal.label + 'то няма интерактивна диаграма — показва се като карти на страницата ' +
                '<b>/razfasovki/</b>. Затова тук няма поле за код на зона.</span>') +
          '</div>' +
          UI.rep({
            path: 'cuts.' + tab,
            addLabel: 'Добави разфасовка',
            specs: specs,
            title: function (it) { return it.name; },
            val: function (it) { return it.eur ? it.eur + ' €' : 'по договаряне'; }
          })
      });

      var groups = UI.card({
        title: 'Групи на страницата /razfasovki/',
        desc: 'Заглавието и изречението над всяка група карти.',
        body: UI.rep({
          path: 'cuts.groups',
          addLabel: 'Добави група',
          noSort: false,
          title: function (it) { return it.label; },
          val: function (it) { return (store.get('cuts.' + it.key) || []).length + ' части'; },
          specs: [
            { k:'label', label:'Заглавие на групата', type:'text', ph:'Агнешко' },
            { k:'key',   label:'Кои разфасовки показва', type:'select',
              opts: ANIMALS.map(function (a) { return { v:a.id, l:a.label }; }) },
            { k:'note',  label:'Изречение под заглавието', type:'textarea', w:'full', rows:2 }
          ]
        })
      });

      return head + body + groups;
    }
  };

  UI.blanks['cuts.pork'] = function () { return { key:'', name:'Нова разфасовка', tags:[], desc:'', eur:'' }; };
  UI.blanks['cuts.beef']    = UI.blanks['cuts.pork'];
  UI.blanks['cuts.lamb']    = UI.blanks['cuts.pork'];
  UI.blanks['cuts.chicken'] = UI.blanks['cuts.pork'];
  UI.blanks['cuts.groups']  = function () { return { key:'pork', label:'Нова група', note:'' }; };
})();
