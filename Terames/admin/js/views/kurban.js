/* Заявки за цяло животно и курбан */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store;

  UI.blanks['kurban.items'] = function () {
    return { name:'Нова заявка', text:'', tag:'Заявка 3 дни', on:true, list:['Първо условие'] };
  };

  TERA.views.kurban = {
    eyebrow: 'Секция',
    title: 'Заявки и курбан',
    anchor: 'kurban',
    desc: 'Големите поръчки — цяло прасе, агне, курбан пакет. Тук се пише какво включва всяка и колко дни предизвестие иска.',

    render: function () {
      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'По заявка' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Цяло животно и курбан' },
          { k:'sub',     label:'Текст под заглавието', type:'textarea', w:'full', rows:2 }
        ], 'kurban')
      }) +

      UI.card({
        title: 'Видове заявки',
        desc: (store.get('kurban.items') || []).length + ' карти. Номерата 01, 02, 03 се слагат по реда тук.',
        body: UI.rep({
          path: 'kurban.items',
          addLabel: 'Добави заявка',
          title: function (it) { return it.name; },
          val: function (it) { return it.tag; },
          toggleKey: 'on',
          specs: [
            { k:'name', label:'Име', type:'text', ph:'Цяло агне' },
            { k:'tag',  label:'Етикет за срока', type:'text', ph:'Заявка 5–7 дни' },
            { k:'text', label:'Описание', type:'textarea', w:'full', rows:3 },
            { k:'list', label:'Какво включва', type:'lines', w:'full', rows:4,
              hint:'По един ред за всяко условие. Показват се като списък с отметки.' },
            { k:'on',   label:'Показвай заявката', type:'switch', w:'full' }
          ]
        })
      }) +

      UI.card({
        title: 'Лента за връзка',
        desc: 'Тъмната лента в дъното на секцията с двата бутона.',
        body: UI.fields([
          { k:'barTitle', label:'Заглавие', type:'text', ph:'Готов за заявка?' },
          { k:'barText',  label:'Текст', type:'text', ph:'Обади се и ще уговорим количество…' },
          { k:'barBtn1',  label:'Първи бутон (телефон)', type:'text', ph:'Обади се' },
          { k:'barBtn2',  label:'Втори бутон (Viber)', type:'text', ph:'Пиши във Viber' }
        ], 'kurban')
      });
    }
  };
})();
