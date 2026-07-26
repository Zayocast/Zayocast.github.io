/* Калкулатор за количества — нормите, по които сайтът смята */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['calc.occasions'] = function () {
    return { key:'nov-' + Date.now().toString(36), label:'Нов повод', on:true,
             lines:[{ name:'Продукт', kg:0.2, eur:'' }] };
  };
  UI.blanks['calc.occasions.#.lines'] = { name:'Нов продукт', kg:0.2, eur:'' };

  /** Общо килограми и сметка за един човек. */
  function perPerson(oc) {
    var kg = 0, eur = 0;
    (oc.lines || []).forEach(function (l) {
      var k = +l.kg || 0;
      kg += k;
      eur += k * TERA.toNum(l.eur);
    });
    return { kg: kg, eur: eur };
  }

  TERA.views.calc = {
    eyebrow: 'Секция',
    title: 'Калкулатор за количества',
    anchor: 'calc',
    desc: 'Посетителят казва колко души са и за какъв повод — сайтът смята килограмите и сметката. Тук се задават нормите, по които се смята.',

    render: function () {
      var occ = store.get('calc.occasions') || [];

      var table = occ.filter(function (o) { return o.on !== false; }).map(function (o) {
        var p = perPerson(o);
        return '<tr><td><b>' + UI.esc(o.label) + '</b></td>' +
          '<td class="num">' + p.kg.toFixed(2).replace('.', ',') + ' кг</td>' +
          '<td class="num">' + TERA.fmt(p.eur) + ' €</td>' +
          '<td class="num muted">' + TERA.fmt(p.eur * 8) + ' € за 8 души</td></tr>';
      }).join('');

      return UI.card({
        title: 'Заглавия и текстове',
        body: UI.fields([
          { k:'eyebrow',       label:'Малък надпис', type:'text' },
          { k:'title',         label:'Заглавие', type:'text' },
          { k:'sub',           label:'Текст под заглавието', type:'textarea', w:'full', rows:2 },
          { k:'guestsLabel',   label:'Надпис на полето за гости', type:'text' },
          { k:'occasionLabel', label:'Надпис на избора за повод', type:'text' },
          { k:'resultLabel',   label:'Надпис над резултата', type:'text' },
          { k:'addLabel',      label:'Бутон към поръчката', type:'text' },
          { k:'note',          label:'Дребен шрифт под формата', type:'textarea', w:'full', rows:2 }
        ], 'calc')
      }) +

      UI.card({
        title: 'Бърз избор и надписи на сметката',
        desc: 'Копчетата с готов брой гости и трите числа над таблицата.',
        body: UI.fields([
          { k:'presets',      label:'Готови бройки гости', type:'tags', w:'full',
            hint:'Само числа: 2, 4, 6, 8, 12, 20. Enter добавя ново.' },
          { k:'totalKgLabel', label:'Надпис под общото количество', type:'text', ph:'общо количество' },
          { k:'perHeadLabel', label:'Надпис под количеството на човек', type:'text', ph:'на човек' },
          { k:'totalLabel',   label:'Надпис под сметката', type:'text', ph:'Приблизителна сметка' }
        ], 'calc')
      }) +

      UI.card({
        title: 'Проверка на нормите',
        desc: 'Така излиза сметката за един човек при всеки повод.',
        body: table
          ? '<div class="tbl-wrap"><table class="tbl">' +
            '<thead><tr><th>Повод</th><th style="text-align:right">На човек</th>' +
            '<th style="text-align:right">Цена/човек</th><th style="text-align:right">Пример</th></tr></thead>' +
            '<tbody>' + table + '</tbody></table></div>'
          : '<div class="empty">' + icon('calc') + '<b>Няма включени поводи</b></div>'
      }) +

      UI.card({
        title: 'Поводи и норми',
        desc: occ.length + ' повода. Килограмите са <b>на един човек</b> — сайтът ги умножава по броя гости.',
        body:
          '<div class="note info">' + icon('info') +
            '<span>За скара 0,45 кг месо на човек е добра норма, за печено — около 0,35 кг. ' +
            'Цената тук е ориентировъчна; ако я оставиш празна, продуктът влиза в количеството, но не и в сметката.</span></div>' +
          '<div style="height:1rem"></div>' +
          UI.rep({
            path: 'calc.occasions',
            addLabel: 'Добави повод',
            title: function (it) { return it.label; },
            val: function (it) {
              var p = perPerson(it);
              return p.kg.toFixed(2).replace('.', ',') + ' кг · ' + TERA.fmt(p.eur) + ' € на човек';
            },
            toggleKey: 'on',
            specs: [
              { k:'label', label:'Как се казва поводът', type:'text', ph:'Скара' },
              { k:'key',   label:'Код', type:'text', mono:true,
                hint:'Само латиница без интервали.' },
              { k:'on',    label:'Показвай в избора', type:'switch', w:'full' }
            ],
            extra: function (it, i, base) {
              return '<div class="sep"></div>' +
                '<p class="mono" style="margin-bottom:.6rem">Какво влиза и по колко на човек</p>' +
                UI.rep({
                  path: base + '.lines',
                  addLabel: 'Добави продукт',
                  title: function (l) { return l.name; },
                  val: function (l) {
                    return String(l.kg).replace('.', ',') + ' кг' + (l.eur ? ' · ' + l.eur + ' €/кг' : '');
                  },
                  specs: [
                    { k:'name', label:'Продукт', type:'text', w:'full', ph:'Свински врат' },
                    { k:'kg',   label:'Килограми на човек', type:'number', min:0, max:5, step:0.01,
                      hint:'0,20 значи 200 грама на гост.' },
                    { k:'eur',  label:'Цена за килограм', type:'price' }
                  ]
                });
            }
          })
      });
    }
  };
})();
