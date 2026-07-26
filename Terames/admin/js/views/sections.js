/* Секции — ред и видимост на публичната страница */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  TERA.views.sections = {
    eyebrow: 'Структура',
    title: 'Секции на сайта',
    desc: 'Подреди секциите с влачене или със стрелките и изключи тези, които не искаш да се виждат. Изключената секция изчезва и от менюто на сайта.',

    render: function () {
      var list = store.get('sections') || [];

      var rows = list.map(function (s, i) {
        return '<div class="sec-row' + (s.on === false ? ' is-off' : '') + '" data-sort-item data-i="' + i + '">' +
          '<span class="sec-handle rep-handle" title="Плъзни за подредба" aria-hidden="true">' + icon('grip') + '</span>' +
          '<span class="sec-ico">' + icon(s.icon) + '</span>' +
          '<span class="sec-name">' +
            '<b>' + UI.esc(s.label) + '</b>' +
            '<span>#' + UI.esc(s.id) + '</span>' +
          '</span>' +
          '<a class="abtn abtn-sm abtn-ghost" href="#/' + UI.attr(s.route) + '" aria-label="Редактирай ' + UI.attr(s.label) + '">' +
            icon('edit') + '<span class="hide-sm">Редактирай</span></a>' +
          '<button type="button" class="rep-tool" data-act="rep-up" data-path="sections" data-i="' + i + '" aria-label="Нагоре">' + icon('up') + '</button>' +
          '<button type="button" class="rep-tool" data-act="rep-down" data-path="sections" data-i="' + i + '" aria-label="Надолу">' + icon('down') + '</button>' +
          (s.locked
            ? '<span class="locked">' + icon('lock') + 'Винаги</span>'
            : '<label class="switch" title="Покажи или скрий секцията">' +
                '<input type="checkbox" data-path="sections.' + i + '.on" data-bool' + (s.on !== false ? ' checked' : '') + '>' +
                '<span class="track"></span>' +
                '<span class="sr-only" style="position:absolute;left:-9999px">Видима</span>' +
              '</label>') +
        '</div>';
      }).join('');

      var on = list.filter(function (s) { return s.on !== false; }).length;

      return UI.card({
        title: 'Подредба и видимост',
        desc: on + ' от ' + list.length + ' секции се показват на посетителите.',
        actions: '<a class="abtn abtn-sm" href="../index.html" target="_blank" rel="noopener">' + icon('eye') + 'Виж сайта</a>',
        body: '<div class="sortable-list" data-sort="sections">' + rows + '</div>'
      }) +

      UI.card({
        title: 'Как работи',
        body:
          '<div class="note info">' + icon('info') +
            '<span><b>Начален екран</b> и <b>Контакти</b> не могат да се изключват — те носят името, телефона и адреса на магазина. ' +
            'Всичко останало може да бъде скрито временно, без да изтриваш съдържанието му.</span>' +
          '</div>' +
          '<div class="sep"></div>' +
          '<p style="font-size:.88rem;color:var(--ink-2);line-height:1.65">' +
            'Подредбата тук определя реда на секциите отгоре надолу в публичната страница. ' +
            'На телефон използвай стрелките — работят по-точно от влаченето.' +
          '</p>'
      });
    }
  };
})();
