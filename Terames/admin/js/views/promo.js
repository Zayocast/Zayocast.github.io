/* Промоции — офертата на седмицата */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['promo.items'] = function () {
    return { badge:'Промо', name:'Нова оферта', desc:'', old:'', eur:'', unit:'/ кг',
             from:'', to:'', on:true };
  };

  /** Активна ли е офертата днес според датите ѝ. */
  function state(it) {
    if (it.on === false) return { key:'off',  label:'изключена' };
    var today = new Date().toISOString().slice(0, 10);
    if (it.from && today < it.from) return { key:'soon',  label:'от ' + it.from };
    if (it.to   && today > it.to)   return { key:'past',  label:'изтекла' };
    return { key:'live', label: it.to ? 'до ' + it.to : 'активна' };
  }

  TERA.views.promo = {
    eyebrow: 'Секция',
    title: 'Промоции',
    anchor: 'promo',
    desc: 'Старата цена се показва зачертана до новата. Ако оставиш старата цена празна, се вижда само новата.',

    render: function () {
      var items = store.get('promo.items') || [];
      var live = items.filter(function (i) { return state(i).key === 'live'; }).length;
      var past = items.filter(function (i) { return state(i).key === 'past'; }).length;

      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'Само тази седмица' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Оферта на седмицата' }
        ], 'promo')
      }) +

      UI.card({
        title: 'Оферти',
        desc: live + ' от ' + items.length + ' се показват на сайта днес.',
        body:
          (live === 0
            ? '<div class="note">' + icon('alert') +
              '<span>Днес не се показва нито една оферта — секцията ще изглежда празна. Провери датите или включи някоя.</span></div><div style="height:1rem"></div>'
            : '') +
          (past
            ? '<div class="note">' + icon('clock') +
              '<span>' + past + ' ' + (past === 1 ? 'оферта е изтекла' : 'оферти са изтекли') +
              ' по дата и вече не се виждат. Можеш да ги оставиш за догодина или да ги изтриеш.</span></div><div style="height:1rem"></div>'
            : '') +
          UI.rep({
            path: 'promo.items',
            addLabel: 'Добави оферта',
            title: function (it) { return it.name; },
            val: function (it) {
              var s = state(it);
              var price = it.eur ? (it.old ? it.old + ' € → ' : '') + it.eur + ' €' : '';
              return price ? price + ' · ' + s.label : s.label;
            },
            toggleKey: 'on',
            specs: [
              { k:'name',  label:'Име на продукта', type:'text' },
              { k:'badge', label:'Етикет', type:'text', ph:'Промо' },
              { k:'desc',  label:'Описание', type:'textarea', w:'full', rows:2 },
              { k:'old',   label:'Стара цена (зачертана)', type:'price' },
              { k:'eur',   label:'Промо цена', type:'price' },
              { k:'unit',  label:'За колко', type:'select', opts:['/ кг','/ бр','/ порция'] },
              { k:'from',  label:'Започва на', type:'date',
                hint:'Празно = веднага. Преди тази дата офертата не се вижда.' },
              { k:'to',    label:'Свършва на', type:'date',
                hint:'Празно = докато я изключиш. След тази дата изчезва сама.' },
              { k:'on',    label:'Включена', type:'switch', w:'full',
                sub:'Изключената оферта не се показва, независимо от датите' }
            ]
          })
      }) +

      UI.card({
        title: 'Как работят датите',
        body: '<div class="note info">' + icon('info') +
          '<span>Оставиш ли и двете дати празни, офертата виси, докато не я изключиш ръчно. ' +
          'Попълниш ли ги, сайтът сам я пуска и сам я маха — например „от понеделник до неделя“ ' +
          'и вече няма нужда да се сещаш да я сваляш.</span></div>'
      });
    }
  };
})();
