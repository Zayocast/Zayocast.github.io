/* Празници — обратно броене и срок за заявка */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['holidays.items'] = function () {
    return { name:'Нов празник', kind:'fixed', date:'', offset:0, lead:7, note:'', on:true };
  };

  var MONTHS = ['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];

  /** Православна Великден по Мееус (юлиански) + 13 дни за григорианския календар. */
  function easter(year) {
    var a = year % 4, b = year % 7, c = year % 19;
    var d = (19 * c + 15) % 30;
    var e = (2 * a + 4 * b - d + 34) % 7;
    var month = Math.floor((d + e + 114) / 31);
    var day = ((d + e + 114) % 31) + 1;
    var jul = new Date(Date.UTC(year, month - 1, day));
    jul.setUTCDate(jul.getUTCDate() + 13);
    return jul;
  }

  /** Следващата дата на празника — тази или следващата година. */
  function nextDate(it) {
    var now = new Date();
    var today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    for (var y = today.getUTCFullYear(); y <= today.getUTCFullYear() + 1; y++) {
      var d;
      if (it.kind === 'easter') {
        d = easter(y);
        d.setUTCDate(d.getUTCDate() + (+it.offset || 0));
      } else {
        var parts = String(it.date || '').split('-');
        if (parts.length !== 2) return null;
        d = new Date(Date.UTC(y, +parts[0] - 1, +parts[1]));
      }
      if (d >= today) return d;
    }
    return null;
  }

  function human(d) {
    return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }

  function daysTo(d) {
    var now = new Date();
    var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((d.getTime() - today) / 86400000);
  }

  TERA.views.holidays = {
    eyebrow: 'Секция',
    title: 'Наближаващи празници',
    anchor: 'holidays',
    desc: 'Лентата с обратно броене. Сайтът сам смята кой празник идва и колко дни остават до срока за заявка.',

    render: function () {
      var items = store.get('holidays.items') || [];

      var upcoming = items
        .filter(function (i) { return i.on !== false; })
        .map(function (i) { var d = nextDate(i); return d ? { it: i, d: d, in: daysTo(d) } : null; })
        .filter(Boolean)
        .sort(function (a, b) { return a.in - b.in; });

      var next = upcoming[0];
      var preview = next
        ? '<div class="note info">' + icon('gift') +
            '<span>Следващият е <b>' + UI.esc(next.it.name) + '</b> на ' + human(next.d) +
            ' — след ' + next.in + ' дни. Срокът за заявка е ' + (+next.it.lead || 0) +
            ' дни по-рано, тоест ' +
            (next.in - (+next.it.lead || 0) > 0
              ? 'остават още ' + (next.in - (+next.it.lead || 0)) + ' дни за заявки.'
              : '<b>срокът вече е минал</b> и сайтът го показва като изтекъл.') +
            '</span></div>'
        : '<div class="note">' + icon('alert') +
            '<span>Нито един празник не се изчислява — провери датите. Форматът е <b>ММ-ДД</b>, например <b>05-06</b> за 6 май.</span></div>';

      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow',  label:'Малък надпис', type:'text', ph:'Заяви навреме' },
          { k:'title',    label:'Заглавие', type:'text', ph:'Наближава' },
          { k:'sub',      label:'Текст под заглавието', type:'textarea', w:'full', rows:2 },
          { k:'orderBy',  label:'Надпис пред срока', type:'text', ph:'Заяви до' },
          { k:'daysLeft', label:'Надпис пред дните', type:'text', ph:'остават' },
          { k:'passed',   label:'Когато срокът е минал', type:'text', w:'full', ph:'срокът за заявка изтече' }
        ], 'holidays')
      }) +

      UI.card({
        title: 'Празници',
        desc: upcoming.length + ' от ' + items.length + ' се изчисляват правилно.',
        body: preview + '<div style="height:1rem"></div>' +
          UI.rep({
            path: 'holidays.items',
            addLabel: 'Добави празник',
            title: function (it) { return it.name; },
            val: function (it) {
              var d = nextDate(it);
              if (!d) return 'датата не е разбрана';
              return human(d) + ' · след ' + daysTo(d) + ' дни';
            },
            toggleKey: 'on',
            specs: [
              { k:'name',   label:'Име', type:'text', ph:'Гергьовден' },
              { k:'kind',   label:'Как се определя датата', type:'select', opts:[
                { v:'fixed',  l:'Фиксирана дата всяка година' },
                { v:'easter', l:'Спрямо Великден' }
              ]},
              { k:'date',   label:'Дата (ММ-ДД)', type:'text', mono:true, ph:'05-06',
                hint:'Само за фиксирана дата. 6 май се пише 05-06.' },
              { k:'offset', label:'Дни от Великден', type:'number', min:-100, max:100, step:1,
                hint:'Само при „спрямо Великден“. 0 = самият Великден, -48 = Сирни заговезни.' },
              { k:'lead',   label:'Заявки се приемат до … дни преди', type:'number', min:0, max:60, step:1 },
              { k:'note',   label:'Какво пише на картичката', type:'textarea', w:'full', rows:2 },
              { k:'on',     label:'Показвай празника', type:'switch', w:'full' }
            ]
          })
      }) +

      UI.card({
        title: 'Как се смята Великден',
        body: '<div class="note info">' + icon('info') +
          '<span>Православният Великден се мести всяка година и сайтът го изчислява сам — не трябва да го въвеждаш ръчно. ' +
          'Избери „Спрямо Великден“ и остави дните на 0. Празници като Курбан Байрам се движат по лунен календар — ' +
          'за тях слагай фиксирана дата и я обновявай веднъж годишно.</span></div>'
      });
    }
  };
})();
