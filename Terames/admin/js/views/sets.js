/* Сетове за скарата — пакети с вътрешен списък */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store;

  UI.blanks['sets.items'] = function () {
    return { name:'Нов сет', badge:'За 4 души', eur:'', btn:'Запази сета', on:true,
             rows:[{ label:'Първи продукт', qty:'× 1' }] };
  };

  TERA.views.sets = {
    eyebrow: 'Секция',
    title: 'Сетове за скарата',
    anchor: 'sets',
    desc: 'Готови пакети с точен списък какво влиза в тях и обща цена.',

    render: function () {
      var items = store.get('sets.items') || [];

      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'Взимаш и печеш' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Сетове за скарата' },
          { k:'sub',     label:'Текст под заглавието', type:'textarea', w:'full', rows:2 }
        ], 'sets')
      }) +

      UI.card({
        title: 'Сетове',
        desc: items.length + ' пакета. Общата цена се пише ръчно — тя обикновено е по-изгодна от сбора.',
        body: UI.rep({
          path: 'sets.items',
          addLabel: 'Добави сет',
          title: function (it) { return it.name; },
          val: function (it) { return it.eur ? it.eur + ' €' : ''; },
          toggleKey: 'on',
          specs: [
            { k:'name',  label:'Име на сета', type:'text', ph:'Сет „Класика“' },
            { k:'badge', label:'Етикет', type:'text', ph:'За 4 души' },
            { k:'eur',   label:'Обща цена', type:'price' },
            { k:'btn',   label:'Текст на бутона', type:'text', ph:'Запази сета' },
            { k:'on',    label:'Показвай сета', type:'switch', w:'full' }
          ],
          extra: function (it, i, base) {
            return '<div class="sep"></div>' +
              '<p class="mono" style="margin-bottom:.6rem">Какво влиза в сета</p>' +
              UI.rep({
                path: base + '.rows',
                addLabel: 'Добави ред',
                title: function (r) { return r.label; },
                val: function (r) { return r.qty; },
                specs: [
                  { k:'label', label:'Продукт', type:'text', ph:'Кюфтета от нашата кайма' },
                  { k:'qty',   label:'Количество', type:'text', ph:'× 6', mono:true }
                ]
              });
          }
        })
      });
    }
  };

  /* заготовка за вътрешните редове — важи за всеки сет */
  UI.blanks['sets.items.#.rows'] = { label:'Нов продукт', qty:'× 1' };
})();
