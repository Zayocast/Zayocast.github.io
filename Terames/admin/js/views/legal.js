/* Правни текстове — общи условия, поверителност, бисквитки */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  var blank = function () { return { h:'Нов раздел', p:[''] }; };
  UI.blanks['legal.terms.blocks']   = blank;
  UI.blanks['legal.privacy.blocks'] = blank;
  UI.blanks['legal.cookies.blocks'] = blank;

  var DOCS = [
    { id:'terms',   label:'Общи условия',  url:'usloviya/'      },
    { id:'privacy', label:'Поверителност', url:'poveritelnost/' },
    { id:'cookies', label:'Бисквитки',     url:'biskvitki/'     }
  ];

  /** Полетата, които още не са попълнени в реквизитите. */
  function missing() {
    var c = store.get('legal.company') || {};
    var out = [];
    if (!c.legalName || /_{3,}/.test(c.legalName)) out.push('фирма');
    if (!c.eik || /_{3,}/.test(c.eik)) out.push('ЕИК');
    if (!c.responsible || /_{3,}/.test(c.responsible)) out.push('отговорно лице');
    return out;
  }

  TERA.views.legal = {
    eyebrow: 'Страници',
    title: 'Правни текстове',
    desc: 'Трите задължителни страници. Реквизитите на фирмата се вписват на едно място и се появяват във всички текстове.',

    actions: function () {
      var doc = DOCS.filter(function (d) { return d.id === (TERA.router.tab || 'terms'); })[0];
      return '<a class="abtn abtn-sm" href="../' + doc.url + '" target="_blank" rel="noopener">' +
             icon('eye') + 'Виж страницата</a>';
    },

    render: function () {
      var tab = TERA.router.tab || 'terms';
      var doc = DOCS.filter(function (d) { return d.id === tab; })[0];
      var miss = missing();
      var blocks = store.get('legal.' + tab + '.blocks') || [];

      var warn = miss.length
        ? '<div class="note">' + icon('alert') +
          '<span><b>Не е попълнено: ' + miss.join(', ') + '.</b> Докато тези полета са празни, страниците изглеждат готови, ' +
          'но не са валидни. Попълни ги и дай текстовете за преглед на юрист, преди сайтът да тръгне на живо.</span></div>'
        : '<div class="note info">' + icon('check') +
          '<span>Реквизитите са попълнени. Препоръчваме текстовете да минат през юрист поне веднъж.</span></div>';

      return UI.card({
        title: 'Реквизити на фирмата',
        desc: 'Влизат автоматично в трите текста навсякъде, където се споменава фирмата.',
        body: warn + '<div style="height:1rem"></div>' +
          UI.fields([
            { k:'legalName',   label:'Фирма по регистрация', type:'text', ph:'„Тера Мес“ ЕООД' },
            { k:'eik',         label:'ЕИК / БУЛСТАТ', type:'text', mono:true, ph:'123456789' },
            { k:'seat',        label:'Седалище и адрес', type:'text', w:'full', ph:'с. Мало Конаре, ул. Седма' },
            { k:'responsible', label:'Отговорно лице', type:'text', ph:'Име Фамилия' },
            { k:'email',       label:'Имейл за правни въпроси', type:'email', ph:'info@tera-mes.bg' }
          ], 'legal.company') +
          '<div class="sep"></div>' +
          UI.fields([
            { k:'updated',      label:'Дата на последна редакция', type:'text', mono:true, ph:'26.07.2026',
              hint:'Показва се на трите страници. Сменяй я при всяка смислена промяна в текста.' },
            { k:'updatedLabel', label:'Надпис пред датата', type:'text', ph:'Последна редакция' },
            { k:'disclaimer',   label:'Бележка под текста', type:'textarea', w:'full', rows:2,
              hint:'Показва се в розовата кутия най-долу на трите страници.' }
          ], 'legal')
      }) +

      UI.card({
        title: doc.label,
        desc: blocks.length + ' раздела. Съдържанието горе се номерира само по реда тук.',
        body:
          UI.tabs(DOCS.map(function (d) { return { id:d.id, label:d.label }; }), tab) +
          UI.fields([
            { k:'title', label:'Заглавие на страницата', type:'text' },
            { k:'lead',  label:'Едно изречение под заглавието', type:'textarea', w:'full', rows:2 }
          ], 'legal.' + tab) +
          (tab === 'cookies'
            ? UI.fields([{ k:'resetLabel', label:'Бутон за смяна на избора', type:'text', w:'full',
                ph:'Промени избора си за бисквитките' }], 'legal.cookies')
            : '') +
          '<div class="sep"></div>' +
          '<div class="note info">' + icon('info') +
            '<span>В текста можеш да ползваш <code class="mono">{legalName}</code>, <code class="mono">{eik}</code>, ' +
            '<code class="mono">{seat}</code> и <code class="mono">{phone}</code> — сайтът ги заменя сам с ' +
            'реквизитите отгоре и с телефона от „Контакти“.</span></div>' +
          '<div style="height:1rem"></div>' +
          UI.rep({
            path: 'legal.' + tab + '.blocks',
            addLabel: 'Добави раздел',
            title: function (it) { return it.h; },
            val: function (it) { return (it.p || []).length + ' абзаца'; },
            specs: [
              { k:'h', label:'Заглавие на раздела', type:'text', w:'full', ph:'1. Кои сме ние' },
              { k:'p', label:'Абзаци', type:'lines', w:'full', rows:6,
                hint:'По един абзац на ред. Празните редове се пропускат.' }
            ]
          })
      }) +

      UI.card({
        title: 'Лента за бисквитките',
        desc: 'Показва се веднъж на нов посетител. Картата на Google се зарежда само след „Приемам“.',
        body: UI.fields([
          { k:'title',   label:'Заглавие', type:'text', ph:'Бисквитки и картата' },
          { k:'text',    label:'Обяснение', type:'textarea', w:'full', rows:3 },
          { k:'accept',  label:'Бутон „приемам“', type:'text', ph:'Приемам' },
          { k:'decline', label:'Бутон „отказ“', type:'text', ph:'Само необходимите' },
          { k:'more',    label:'Връзка към повече', type:'text', ph:'Прочети повече' }
        ], 'cookie') +
        '<div class="sep"></div>' +
        '<p class="mono" style="margin-bottom:.6rem">Когато посетителят откаже картата</p>' +
        UI.fields([
          { k:'mapBlocked', label:'Текст на мястото на картата', type:'text', w:'full',
            ph:'Картата е спряна, докато не приемеш бисквитките на Google.' },
          { k:'mapEnable',  label:'Бутон за включване', type:'text', ph:'Покажи картата' },
          { k:'mapOpen',    label:'Връзка към Google Maps', type:'text', ph:'Отвори в Google Maps' }
        ], 'cookie')
      }) +

      UI.card({
        title: 'Важно',
        body: '<div class="note">' + icon('lock') +
          '<span>Тези текстове са работен образец, не правен съвет. Отговорността за съдържанието им е на собственика на сайта. ' +
          'Ако започнеш да събираш имейли, да пускаш реклами или да добавиш аналитика, текстовете трябва да се допълнят.</span></div>'
      });
    }
  };
})();
