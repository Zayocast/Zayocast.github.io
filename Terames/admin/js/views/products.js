/* Витрина и ценоразпис — най-често редактираната част от сайта */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['products.featured'] = function () {
    return { badge:'Избор на месаря', name:'Нов продукт', sub:'', eur:'', image:'', alt:'' };
  };
  UI.blanks['products.items'] = function () {
    var c = (store.get('products.categories') || [{}])[0];
    return { cat: c.key || '', name:'Нов продукт', desc:'', eur:'', on:true };
  };
  UI.blanks['products.categories'] = function () {
    return { key: 'nova-' + Date.now().toString(36), label:'Нова категория' };
  };

  function catOpts() {
    return (store.get('products.categories') || []).map(function (c) {
      return { v: c.key, l: c.label };
    });
  }
  function catLabel(key) {
    var c = (store.get('products.categories') || []).filter(function (x) { return x.key === key; })[0];
    return c ? c.label : '—';
  }

  TERA.views.products = {
    eyebrow: 'Секция',
    title: 'Витрина и ценоразпис',
    anchor: 'products',
    desc: 'Трите изпъкнали продукта и целият ценоразпис. Пишеш цената в евро — левовете се смятат сами по фиксирания курс.',

    render: function () {
      var items = store.get('products.items') || [];
      var cats = store.get('products.categories') || [];
      var tab = TERA.router.tab || 'list';

      var head = UI.card({
        title: 'Заглавия и бележка',
        body: UI.fields([
          { k:'eyebrow',    label:'Малък надпис', type:'text' },
          { k:'title',      label:'Заглавие на секцията', type:'text' },
          { k:'stamp',      label:'Стикер вдясно', type:'text', ph:'Заредено тази сутрин' },
          { k:'boardTitle', label:'Заглавие на ценоразписа', type:'text', ph:'Ценоразпис' },
          { k:'boardSub',   label:'Ред под заглавието', type:'text', ph:'Цени на витрината · € / кг' },
          { k:'note',       label:'Дребен шрифт под цените', type:'textarea', w:'full', rows:3,
            hint:'Тук стои уговорката за евро/лева и че цените са ориентировъчни.' }
        ], 'products')
      });

      var tabs = UI.tabs([
        { id:'list',  label:'Ценоразпис (' + items.length + ')' },
        { id:'feat',  label:'Изпъкващи (' + (store.get('products.featured') || []).length + ')' },
        { id:'cats',  label:'Категории (' + cats.length + ')' }
      ], tab);

      var body;

      if (tab === 'feat') {
        body = UI.card({
          title: 'Изпъкващи продукти',
          desc: 'Големите картички със снимка над ценоразписа. Три работят най-добре.',
          body: tabs + UI.rep({
            path: 'products.featured',
            addLabel: 'Добави изпъкващ продукт',
            title: function (it) { return it.name; },
            val: function (it) { return it.eur ? it.eur + ' €' : ''; },
            specs: [
              { k:'name',  label:'Име', type:'text' },
              { k:'badge', label:'Етикет в ъгъла', type:'text', ph:'Избор на месаря' },
              { k:'sub',   label:'Кратко описание', type:'text', w:'full', ph:'Отлежал, режем пред теб' },
              { k:'eur',   label:'Цена за килограм', type:'price' },
              { k:'image', label:'Снимка', type:'image', w:'full' },
              { k:'alt',   label:'Описание на снимката', type:'text', w:'full' }
            ]
          })
        });

      } else if (tab === 'cats') {
        body = UI.card({
          title: 'Категории',
          desc: 'Бутоните за филтриране над ценоразписа. Редът тук е редът на бутоните.',
          body: tabs +
            '<div class="note">' + icon('alert') +
              '<span>Ако изтриеш категория, продуктите в нея остават, но няма да се показват под нито един бутон. ' +
              'Първо ги премести в друга категория.</span></div>' +
            '<div style="height:1rem"></div>' +
            UI.rep({
              path: 'products.categories',
              addLabel: 'Добави категория',
              title: function (it) { return it.label; },
              val: function (it) {
                var n = (store.get('products.items') || []).filter(function (p) { return p.cat === it.key; }).length;
                return n + ' продукта';
              },
              specs: [
                { k:'label', label:'Име на бутона', type:'text', ph:'Свинско' },
                { k:'key',   label:'Код', type:'text', mono:true, ph:'svinsko',
                  hint:'Само латиница без интервали — свързва продуктите с категорията.' }
              ]
            })
        });

      } else {
        var chips = '<div class="row-flex" style="margin-bottom:.8rem">' +
          '<button type="button" class="abtn abtn-sm abtn-primary" data-pcat="all">Всички</button>' +
          cats.map(function (c) {
            return '<button type="button" class="abtn abtn-sm" data-pcat="' + UI.attr(c.key) + '">' + UI.esc(c.label) + '</button>';
          }).join('') +
        '</div>';

        var search = '<div class="field" style="margin-bottom:1rem">' +
          '<input class="inp" data-psearch placeholder="Търси продукт по име…" aria-label="Търсене в ценоразписа">' +
        '</div>';

        body = UI.card({
          title: 'Ценоразпис',
          desc: items.length + ' продукта. Изключеният продукт остава тук, но изчезва от сайта.',
          actions: '<a class="abtn abtn-sm" href="../index.html#products" target="_blank" rel="noopener">' + icon('eye') + 'Виж витрината</a>',
          body: tabs + chips + search + UI.rep({
            path: 'products.items',
            addLabel: 'Добави продукт',
            attrs: function (it) { return 'data-cat="' + UI.attr(it.cat) + '"'; },
            title: function (it) { return it.name; },
            val: function (it) {
              if (it.out) return 'изчерпано';
              return (it.eur ? it.eur + ' € · ' : '') + catLabel(it.cat);
            },
            toggleKey: 'on',
            specs: [
              { k:'name', label:'Име', type:'text' },
              { k:'cat',  label:'Категория', type:'select', opts: catOpts() },
              { k:'desc', label:'Кратко описание', type:'text', w:'full',
                ph:'За скара и пържоли — режем по желание.' },
              { k:'eur',  label:'Цена за килограм', type:'price' },
              { k:'out',  label:'Изчерпано днес', type:'switch',
                sub:'Остава в ценоразписа, но се показва зачертано' },
              { k:'on',   label:'Показвай в сайта', type:'switch',
                sub:'Изключи съвсем, ако не го предлагаш вече' }
            ]
          })
        });
      }

      return head + (tab === 'list' ? bulk(cats) : '') + body;
    }
  };

  /* ---------- групова промяна на цени ---------- */
  function bulk(cats) {
    return UI.card({
      title: 'Групова промяна на цени',
      desc: 'Когато пазарът мръдне — вдигаш или сваляш цяла категория наведнъж, вместо поле по поле.',
      body:
        '<div class="grid-3">' +
          '<div class="field"><label>Върху кои продукти</label>' +
            '<select class="inp" data-bulk-cat>' +
              '<option value="all">Всички продукти</option>' +
              cats.map(function (c) {
                return '<option value="' + UI.attr(c.key) + '">' + UI.esc(c.label) + '</option>';
              }).join('') +
            '</select></div>' +
          '<div class="field"><label>Как</label>' +
            '<select class="inp" data-bulk-op>' +
              '<option value="pct+">Вдигни с процент</option>' +
              '<option value="pct-">Свали с процент</option>' +
              '<option value="abs+">Добави стотинки</option>' +
              '<option value="abs-">Извади стотинки</option>' +
              '<option value="set">Закръгли до</option>' +
            '</select></div>' +
          '<div class="field"><label>Колко</label>' +
            '<input class="inp mono-inp" data-bulk-val inputmode="decimal" value="5" placeholder="5"></div>' +
        '</div>' +
        '<div class="sep"></div>' +
        '<div class="row-flex">' +
          '<button type="button" class="abtn abtn-primary" data-bulk-go>' + icon('percent') + 'Пресметни</button>' +
          '<span class="muted" style="font-size:.82rem">Ще видиш какво се променя, преди да го приложиш.</span>' +
        '</div>'
    });
  }

  function bulkPreview() {
    var cat = (document.querySelector('[data-bulk-cat]') || {}).value || 'all';
    var op  = (document.querySelector('[data-bulk-op]') || {}).value || 'pct+';
    var raw = (document.querySelector('[data-bulk-val]') || {}).value || '0';
    var amount = TERA.toNum(raw);

    if (!amount) { UI.toast('Въведи с колко да се промени', 'err'); return; }

    var items = store.get('products.items') || [];
    var changes = [];

    items.forEach(function (p, i) {
      if (cat !== 'all' && p.cat !== cat) return;
      var from = TERA.toNum(p.eur);
      if (!from) return;
      var to;
      if (op === 'pct+')      to = from * (1 + amount / 100);
      else if (op === 'pct-') to = from * (1 - amount / 100);
      else if (op === 'abs+') to = from + amount;
      else if (op === 'abs-') to = from - amount;
      else                    to = Math.round(from / amount) * amount;
      to = Math.max(0, Math.round(to * 100) / 100);
      if (TERA.fmt(to) === TERA.fmt(from)) return;
      changes.push({ i: i, name: p.name, from: TERA.fmt(from), to: TERA.fmt(to) });
    });

    if (!changes.length) { UI.toast('Нищо не се променя при тези настройки'); return; }

    var rows = changes.map(function (c) {
      return '<tr><td>' + UI.esc(c.name) + '</td>' +
        '<td class="num muted">' + c.from + ' €</td>' +
        '<td class="num"><b style="color:var(--blood)">' + c.to + ' €</b></td>' +
        '<td class="num muted">' + TERA.toLv(c.to) + ' лв.</td></tr>';
    }).join('');

    UI.openModal({
      title: changes.length + ' цени се променят',
      body: '<div class="tbl-wrap"><table class="tbl">' +
        '<thead><tr><th>Продукт</th><th style="text-align:right">Сега</th>' +
        '<th style="text-align:right">Става</th><th style="text-align:right">В лева</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>',
      foot: '<button type="button" class="abtn" data-act="modal-x">Откажи</button>' +
            '<button type="button" class="abtn abtn-primary" data-act="modal-ok">Приложи промените</button>'
    }).then(function (ok) {
      if (!ok) return;
      changes.forEach(function (c) { store.set('products.items.' + c.i + '.eur', c.to); });
      store.touch();
      UI.rerender();
      UI.toast(changes.length + ' цени са променени — не забравяй да запазиш');
    });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-bulk-go]')) bulkPreview();
  });

  /* ---------- филтър и търсене в ценоразписа ---------- */
  function applyFilter() {
    var wrap = document.querySelector('[data-sort="products.items"]');
    if (!wrap) return;
    var cat = document.querySelector('[data-pcat].abtn-primary');
    cat = cat ? cat.dataset.pcat : 'all';
    var box = document.querySelector('[data-psearch]');
    var q = box ? box.value.trim().toLowerCase() : '';

    wrap.querySelectorAll('.rep-item').forEach(function (row) {
      var okCat = cat === 'all' || row.dataset.cat === cat;
      var name = (row.querySelector('.rep-title > b') || {}).textContent || '';
      var okQ = !q || name.toLowerCase().indexOf(q) > -1;
      row.hidden = !(okCat && okQ);
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pcat]');
    if (!b) return;
    document.querySelectorAll('[data-pcat]').forEach(function (x) { x.classList.remove('abtn-primary'); });
    b.classList.add('abtn-primary');
    applyFilter();
  });

  document.addEventListener('input', function (e) {
    if (e.target.matches('[data-psearch]')) applyFilter();
  });
})();
