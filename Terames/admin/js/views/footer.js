/* Долен колонтитул */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store;

  UI.blanks['footer.links'] = function () { return { label:'Нова връзка', href:'#' }; };

  TERA.views.footer = {
    eyebrow: 'Структура',
    title: 'Долен колонтитул',
    desc: 'Последното, което вижда посетителят — призивът за поръчка, връзките и правата.',

    render: function () {
      return UI.card({
        title: 'Призив за поръчка',
        desc: 'Червената лента над футъра.',
        body: UI.fields([
          { k:'ctaTitle', label:'Заглавие', type:'text', w:'full', ph:'Огладня ли? Поръчай за утре.' }
        ], 'footer')
      }) +

      UI.card({
        title: 'Текст за магазина',
        body: UI.fields([
          { k:'about', label:'Кратко описание', type:'textarea', w:'full', rows:3,
            hint:'Показва се под логото в първата колона.' },
          { k:'giant', label:'Огромният надпис', type:'text', ph:'TERA.MES',
            hint:'Изписва се през цялата ширина в дъното. Кратко име работи най-добре.' }
        ], 'footer')
      }) +

      UI.card({
        title: 'Връзки във футъра',
        desc: (store.get('footer.links') || []).length + ' връзки в колоната „Навигация“.',
        body: UI.rep({
          path: 'footer.links',
          addLabel: 'Добави връзка',
          title: function (it) { return it.label; },
          val: function (it) { return it.href; },
          specs: [
            { k:'label', label:'Надпис', type:'text' },
            { k:'href',  label:'Води към', type:'select',
              opts: (store.get('sections') || []).map(function (s) {
                return { v:'#' + s.id, l: s.label + '  (#' + s.id + ')' };
              })
            }
          ]
        })
      }) +

      UI.card({
        title: 'Права и изработка',
        body: UI.fields([
          { k:'copyright',   label:'Ред с правата', type:'text', w:'full', ph:'© 2026 Tera.MES — Всички права запазени' },
          { k:'creditLabel', label:'Изработка — име', type:'text' },
          { k:'creditUrl',   label:'Изработка — връзка', type:'url', mono:true, ph:'https://' }
        ], 'footer')
      });
    }
  };
})();
