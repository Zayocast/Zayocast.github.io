/* Отзиви — какво казват клиентите */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['reviews.items'] = function () {
    return { name:'Ново име', role:'', stars:5, big:false, on:true, text:'' };
  };

  TERA.views.reviews = {
    eyebrow: 'Секция',
    title: 'Отзиви',
    anchor: 'reviews',
    desc: 'Мненията на клиентите. Един отзив може да е „голям“ — заема двойно място и се чете първи.',

    render: function () {
      var items = store.get('reviews.items') || [];
      var big = items.filter(function (r) { return r.big; }).length;

      var visible = Math.max(1, +store.get('reviews.visible') || 5);

      return UI.card({
        title: 'Заглавия и оценка',
        body: UI.fields([
          { k:'eyebrow',    label:'Малък надпис', type:'text', ph:'Казано на тезгяха' },
          { k:'title',      label:'Заглавие', type:'text', ph:'Клиентите за нас' },
          { k:'score',      label:'Средна оценка', type:'text', ph:'5,0' },
          { k:'scoreText',  label:'Текст до оценката', type:'text', ph:'Средна оценка от клиентите ни' },
          { k:'countLabel', label:'Дума след броя отзиви', type:'text', ph:'отзива от клиенти',
            hint:'Излиза като „Средна оценка · 12 отзива от клиенти“.' }
        ], 'reviews')
      }) +

      UI.card({
        title: 'Разгъване',
        desc: 'Дългият списък се свива, за да не заема половин екран.',
        body:
          UI.fields([
            { k:'visible',   label:'Колко се виждат отначало', type:'number', min:1, max:30, step:1,
              hint:'На телефон винаги са 3 — там картите са една под друга.' },
            { k:'moreLabel', label:'Бутон за разгъване', type:'text', ph:'Виж всички отзиви',
              hint:'Броят се добавя автоматично в скоби.' },
            { k:'lessLabel', label:'Бутон за свиване', type:'text', ph:'Скрий отзивите' }
          ], 'reviews') +
          (items.length > visible
            ? '<div class="note info" style="margin-top:.8rem">' + icon('check') +
              '<span>Показват се ' + visible + ', а бутонът разгъва останалите ' + (items.length - visible) + '.</span></div>'
            : '<div class="note" style="margin-top:.8rem">' + icon('alert') +
              '<span>Имаш ' + items.length + ' отзива, а се показват ' + visible +
              ' — бутонът за разгъване няма да се появи, защото няма какво да крие.</span></div>')
      }) +

      UI.card({
        title: 'Отзиви',
        desc: items.length + ' мнения' + (big > 1 ? ' · повече от един е отбелязан като голям' : ''),
        body:
          (big > 1
            ? '<div class="note">' + icon('alert') +
              '<span>Отбелязал си ' + big + ' отзива като големи. Подредбата изглежда най-добре с точно един голям отзив.</span></div><div style="height:1rem"></div>'
            : '') +
          UI.rep({
            path: 'reviews.items',
            addLabel: 'Добави отзив',
            title: function (it) { return it.name; },
            val: function (it) { return '★'.repeat(Math.max(0, Math.min(5, +it.stars || 0))); },
            toggleKey: 'on',
            specs: [
              { k:'name',  label:'Име на клиента', type:'text', ph:'Мария Д.' },
              { k:'role',  label:'Какъв клиент е', type:'text', ph:'Редовен клиент' },
              { k:'text',  label:'Отзив', type:'textarea', w:'full', rows:4 },
              { k:'stars', label:'Звезди', type:'select', opts:[
                { v:'5', l:'5 звезди' }, { v:'4', l:'4 звезди' }, { v:'3', l:'3 звезди' },
                { v:'2', l:'2 звезди' }, { v:'1', l:'1 звезда' }
              ]},
              { k:'big',   label:'Голям отзив', type:'switch', sub:'Заема двойно място в мрежата' },
              { k:'on',    label:'Показвай отзива', type:'switch', w:'full' }
            ]
          })
      }) +

      UI.card({
        title: 'Бележка',
        body: '<div class="note info">' + icon('info') +
          '<span>Първата буква от името се показва в кръгче до отзива — сменя се сама, щом смениш името. ' +
          'Публикувай само мнения, които клиентите наистина са дали.</span></div>'
      });
    }
  };
})();
