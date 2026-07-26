/* Рецепти — какво да сготви клиентът с това, което купува */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['recipes.items'] = function () {
    return {
      name:'Нова рецепта', cut:'', time:'', level:'Лесно', portions:'4 порции',
      image:'', text:'', ingredients:[], steps:[], on:true
    };
  };

  /** Имената на разфасовките и продуктите — за да се вържат рецептите с тях. */
  function cutOpts() {
    var out = [{ v:'', l:'— без връзка —' }];
    ['cuts.pork', 'cuts.beef'].forEach(function (p) {
      (store.get(p) || []).forEach(function (c) { out.push({ v:c.name, l:c.name }); });
    });
    (store.get('products.items') || []).forEach(function (p) {
      if (!out.some(function (o) { return o.v === p.name; })) out.push({ v:p.name, l:p.name });
    });
    return out;
  }

  TERA.views.recipes = {
    eyebrow: 'Секция',
    title: 'Рецепти',
    anchor: 'recipes',
    desc: 'Рецептите, които месарят дава на тезгяха. Всяка сочи към разфасовката, която ѝ трябва — така клиентът знае какво да поиска.',

    render: function () {
      var items = store.get('recipes.items') || [];
      var live = items.filter(function (i) { return i.on !== false; }).length;

      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'От тезгяха до тигана' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Какво да сготвиш' },
          { k:'sub',     label:'Текст под заглавието', type:'textarea', w:'full', rows:2 }
        ], 'recipes')
      }) +

      UI.card({
        title: 'Рецепти',
        desc: live + ' от ' + items.length + ' се показват.',
        body:
          '<div class="note info">' + icon('info') +
            '<span>Пиши стъпките кратко и в повелително наклонение — „Намажи“, „Печи“, „Остави“. ' +
            'Клиентът чете това с телефон в едната ръка и месо в другата.</span></div>' +
          '<div style="height:1rem"></div>' +
          UI.rep({
            path: 'recipes.items',
            addLabel: 'Добави рецепта',
            title: function (it) { return it.name; },
            val: function (it) { return it.time || it.level || ''; },
            toggleKey: 'on',
            specs: [
              { k:'name',     label:'Име на рецептата', type:'text', ph:'Вратни пържоли на скара' },
              { k:'cut',      label:'С коя разфасовка', type:'select', opts: cutOpts(),
                hint:'Показва се като етикет и води клиента към точния продукт.' },
              { k:'text',     label:'Един ред за какво става дума', type:'textarea', w:'full', rows:2 },
              { k:'time',     label:'Време', type:'text', ph:'20 мин + 2 часа марината' },
              { k:'level',    label:'Трудност', type:'select', opts:['Лесно','Средно','За търпеливи'] },
              { k:'portions', label:'За колко души', type:'text', ph:'4 порции' },
              { k:'image',    label:'Снимка', type:'image', w:'full' },
              { k:'ingredients', label:'Продукти', type:'lines', w:'full', rows:5,
                hint:'По един на ред, с количеството отпред.' },
              { k:'steps',    label:'Стъпки', type:'lines', w:'full', rows:6,
                hint:'По една на ред. Номерата се слагат сами.' },
              { k:'on',       label:'Показвай рецептата', type:'switch', w:'full' }
            ]
          })
      });
    }
  };
})();
