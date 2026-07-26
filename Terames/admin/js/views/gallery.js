/* Галерия — снимките от витрината */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['gallery.items'] = function () {
    return { image:'', caption:'Нова снимка', alt:'' };
  };

  function tile(it, i) {
    var p = 'gallery.items.' + i;
    return '<figure class="gal-edit" data-sort-item data-i="' + i + '">' +
      '<span class="gal-pic">' +
        (it.image ? '<img src="' + UI.attr(it.image) + '" alt="" loading="lazy">' : icon('imageOff')) +
        '<span class="gal-no">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="gal-tools">' +
          '<span class="rep-tool rep-handle" title="Плъзни за подредба" aria-hidden="true">' + icon('grip') + '</span>' +
          '<button type="button" class="rep-tool" data-act="rep-up" data-path="gallery.items" data-i="' + i + '" aria-label="Премести наляво">' + icon('up') + '</button>' +
          '<button type="button" class="rep-tool" data-act="rep-down" data-path="gallery.items" data-i="' + i + '" aria-label="Премести надясно">' + icon('down') + '</button>' +
          '<button type="button" class="rep-tool del" data-act="rep-del" data-path="gallery.items" data-i="' + i + '" aria-label="Изтрий снимката">' + icon('trash') + '</button>' +
        '</span>' +
        '<button type="button" class="gal-swap" data-act="img-pick" data-path="' + p + '.image">' +
          icon('image') + 'Смени снимката</button>' +
      '</span>' +
      '<figcaption>' +
        '<div class="field"><label>Надпис в галерията</label>' +
          '<input class="inp" data-path="' + p + '.caption" value="' + UI.attr(it.caption) + '" placeholder="Витрината сутрин"></div>' +
        '<div class="field"><label>Описание за търсачки</label>' +
          '<input class="inp" data-path="' + p + '.alt" value="' + UI.attr(it.alt) + '" placeholder="Прясно телешко месо"></div>' +
      '</figcaption>' +
    '</figure>';
  }

  TERA.views.gallery = {
    eyebrow: 'Секция',
    title: 'Галерия',
    anchor: 'gallery',
    desc: 'Снимките, които се отварят на цял екран при натискане. Първата снимка задава тона — сложи най-силната отпред.',

    render: function () {
      var items = store.get('gallery.items') || [];

      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'От витрината' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Прясно е, вижда се' }
        ], 'gallery')
      }) +

      UI.card({
        title: 'Снимки',
        desc: items.length + ' снимки. Подреди ги със стрелките или с влачене.',
        actions: '<button type="button" class="abtn abtn-sm abtn-primary" data-act="rep-add" data-path="gallery.items">' +
                 icon('plus') + 'Добави снимка</button>',
        body: items.length
          ? '<div class="gal-grid-edit" data-sort="gallery.items">' + items.map(tile).join('') + '</div>'
          : '<div class="empty">' + icon('image') +
            '<b>Галерията е празна</b><p>Добави първата снимка — най-добре работят светли кадри от витрината и от работата в транжорната.</p></div>'
      });
    }
  };
})();
