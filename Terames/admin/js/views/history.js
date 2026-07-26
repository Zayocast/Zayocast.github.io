/* История на промените — връщане към предишно състояние.
   Пази се от слоя за данните при всеки запис. */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  var cache = null;

  function size(entry) {
    var kb = JSON.stringify(entry.data).length / 1024;
    return kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.round(kb) + ' KB';
  }

  /** Груба разлика спрямо текущото състояние — само за ориентир. */
  function diff(entry) {
    var now = store.data, old = entry.data, hits = [];
    var where = {
      products: 'ценоразпис', kitchen: 'топла кухня', promo: 'промоции',
      hero: 'начален екран', gallery: 'галерия', faq: 'въпроси',
      contact: 'контакти', sections: 'секции', recipes: 'рецепти',
      holidays: 'празници', calc: 'калкулатор'
    };
    Object.keys(where).forEach(function (k) {
      if (JSON.stringify(now[k]) !== JSON.stringify(old[k])) hits.push(where[k]);
    });
    return hits;
  }

  TERA.views.history = {
    eyebrow: 'Управление',
    title: 'История на промените',
    desc: 'При всеки запис предишното състояние се запазва тук. Ако нещо се обърка, връщаш се назад.',

    actions: function () {
      return '<button type="button" class="abtn abtn-sm abtn-danger" data-hist-clear>' +
        icon('trash') + 'Изчисти историята</button>';
    },

    render: function () {
      if (cache === null) {
        TERA.api.loadHistory().then(function (list) {
          cache = list;
          UI.rerender();
        });
        return UI.card({ body: '<div class="empty">' + icon('undo') + '<b>Зареждам…</b></div>' });
      }

      if (!cache.length) {
        return UI.card({
          body: '<div class="empty">' + icon('undo') +
            '<b>Още няма история</b>' +
            '<p>Първият запис ще създаде точка за връщане. Оттам нататък пазим последните дванайсет.</p></div>'
        });
      }

      var rows = cache.map(function (h, i) {
        var changed = diff(h);
        return '<tr>' +
          '<td class="num" style="text-align:left"><b>' + UI.esc(h.at) + '</b>' +
            (h.label ? '<br><span class="muted" style="font-size:.74rem">от „' + UI.esc(h.label) + '“</span>' : '') +
          '</td>' +
          '<td>' + (changed.length
            ? 'Оттогава са пипани: <b>' + changed.join(', ') + '</b>'
            : '<span class="muted">Няма разлика с текущото</span>') + '</td>' +
          '<td class="num muted">' + size(h) + '</td>' +
          '<td><button type="button" class="abtn abtn-sm" data-hist-back="' + UI.attr(h.id) + '">' +
            icon('undo') + 'Върни</button></td>' +
        '</tr>';
      }).join('');

      return UI.card({
        title: cache.length + ' точки за връщане',
        desc: 'Най-новата е най-горе. Пазят се последните дванайсет записа.',
        body: '<div class="tbl-wrap"><table class="tbl">' +
          '<thead><tr><th>Кога</th><th>Какво се е променило оттогава</th><th>Размер</th><th></th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table></div>'
      }) +

      UI.card({
        title: 'Важно',
        body: '<div class="note">' + icon('alert') +
          '<span>Връщането зарежда старото съдържание в панела, но <b>не го записва само</b> — ' +
          'преглеждаш и натискаш „Запази“. Така, ако си сбъркал точката, просто отказваш.</span></div>'
      });
    }
  };

  /* --- връщане назад --- */
  document.addEventListener('click', function (e) {
    var back = e.target.closest('[data-hist-back]');
    if (back) {
      var id = back.dataset.histBack;
      var entry = (cache || []).filter(function (h) { return h.id === id; })[0];
      UI.confirm({
        title: 'Връщане назад',
        text: 'Съдържанието от ' + (entry ? entry.at : 'избраната точка') +
              ' ще се зареди в панела. Прегледай го и натисни „Запази“, за да го публикуваш.',
        ok: 'Зареди го'
      }).then(function (ok) {
        if (!ok) return;
        return TERA.api.restoreHistory(id).then(function (data) {
          store.hydrate(data);
          UI.rerender();
          UI.toast('Заредено — прегледай и запази');
        });
      }).catch(function () {
        UI.toast('Точката не се зареди', 'err');
      });
      return;
    }

    if (e.target.closest('[data-hist-clear]')) {
      UI.confirm({
        title: 'Изчистване на историята',
        text: 'Всички точки за връщане ще бъдат изтрити. Текущото съдържание не се променя.',
        ok: 'Изчисти'
      }).then(function (ok) {
        if (!ok) return;
        return TERA.api.clearHistory().then(function () {
          cache = [];
          UI.rerender();
          UI.toast('Историята е изчистена');
        });
      });
    }
  });

  /* при нов запис списъкът се презарежда */
  store.onChange(function (dirty) { if (!dirty) cache = null; });
})();
