/* Поръчки — какво е дошло от формата на сайта */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  var LABEL = { new:'Нова', wait:'Чака', done:'Готова' };
  var PILL  = { new:'pill-new', wait:'pill-wait', done:'pill-off' };

  TERA.views.inbox = {
    eyebrow: 'Магазин',
    title: 'Поръчки',
    desc: 'Заявките от формата на сайта. Маркирай ги като готови, щом клиентът си вземе поръчката.',

    render: function () {
      var all = store.get('inbox') || [];
      var tab = TERA.router.tab || 'all';
      var rows = all.map(function (o, i) { return { o:o, i:i }; })
        .filter(function (r) { return tab === 'all' || r.o.status === tab; });

      var count = function (s) { return all.filter(function (o) { return o.status === s; }).length; };

      var table = rows.map(function (r) {
        var o = r.o;
        return '<tr>' +
          '<td class="num" style="text-align:left"><b>' + UI.esc(o.id) + '</b><br><span class="muted" style="font-size:.72rem">' + UI.esc(o.at) + '</span></td>' +
          '<td><b>' + UI.esc(o.name) + '</b><br><a href="tel:' + UI.attr(o.phone.replace(/\s/g, '')) + '" style="font-family:var(--f-mono);font-size:.76rem;color:var(--blood)">' + UI.esc(o.phone) + '</a></td>' +
          '<td>' + UI.esc(o.msg) + '<br><span class="muted" style="font-size:.76rem">За: ' + UI.esc(o.time) + '</span></td>' +
          '<td><select class="inp" style="padding:.35rem .5rem;font-size:.8rem" data-path="inbox.' + r.i + '.status">' +
            ['new','wait','done'].map(function (s) {
              return '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + LABEL[s] + '</option>';
            }).join('') +
          '</select></td>' +
          '<td><a class="rep-tool" href="tel:' + UI.attr(o.phone.replace(/\s/g, '')) + '" aria-label="Обади се">' + icon('phone') + '</a></td>' +
        '</tr>';
      }).join('');

      return UI.card({
        title: 'Списък',
        desc: all.length + ' поръчки общо · ' + count('new') + ' нови.',
        actions: '<button type="button" class="abtn abtn-sm" data-clear-done>' + icon('trash') + 'Изчисти готовите</button>',
        body:
          UI.tabs([
            { id:'all',  label:'Всички (' + all.length + ')' },
            { id:'new',  label:'Нови (' + count('new') + ')' },
            { id:'wait', label:'Чакащи (' + count('wait') + ')' },
            { id:'done', label:'Готови (' + count('done') + ')' }
          ], tab) +
          (rows.length
            ? '<div class="tbl-wrap"><table class="tbl">' +
                '<thead><tr><th>Номер</th><th>Клиент</th><th>Поръчка</th><th>Състояние</th><th></th></tr></thead>' +
                '<tbody>' + table + '</tbody></table></div>'
            : '<div class="empty">' + icon('inbox') +
              '<b>Няма поръчки тук</b><p>Смени раздела отгоре или изчакай нова заявка от формата на сайта.</p></div>')
      }) +

      UI.card({
        title: 'Как ще работи',
        body: '<div class="note">' + icon('alert') +
          '<span>Показаните поръчки са примерни. Формата на сайта още не изпраща никъде — ' +
          'щом добавим сървърната част, тук ще влизат истинските заявки и ще получаваш известие на имейл.</span></div>'
      });
    }
  };

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-clear-done]')) return;
    var all = store.get('inbox') || [];
    var done = all.filter(function (o) { return o.status === 'done'; }).length;
    if (!done) { UI.toast('Няма готови поръчки за изчистване'); return; }
    UI.confirm({
      title: 'Изчистване',
      text: done + ' готови поръчки ще бъдат премахнати от списъка.',
      ok: 'Изчисти'
    }).then(function (ok) {
      if (!ok) return;
      store.set('inbox', all.filter(function (o) { return o.status !== 'done'; }));
      store.touch();
      UI.rerender();
      UI.toast('Готовите поръчки са премахнати');
    });
  });
})();
