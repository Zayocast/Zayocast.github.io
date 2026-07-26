/* Instagram — витрината на живо */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['insta.tiles'] = function () {
    return { image:'', alt:'', url:'' };
  };

  function tile(it, i) {
    var p = 'insta.tiles.' + i;
    return '<figure class="gal-edit" data-sort-item data-i="' + i + '">' +
      '<span class="gal-pic">' +
        (it.image ? '<img src="' + UI.attr(it.image) + '" alt="" loading="lazy">' : icon('imageOff')) +
        '<span class="gal-no">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="gal-tools">' +
          '<span class="rep-tool rep-handle" title="Плъзни за подредба" aria-hidden="true">' + icon('grip') + '</span>' +
          '<button type="button" class="rep-tool" data-act="rep-up" data-path="insta.tiles" data-i="' + i + '" aria-label="Премести назад">' + icon('up') + '</button>' +
          '<button type="button" class="rep-tool" data-act="rep-down" data-path="insta.tiles" data-i="' + i + '" aria-label="Премести напред">' + icon('down') + '</button>' +
          '<button type="button" class="rep-tool del" data-act="rep-del" data-path="insta.tiles" data-i="' + i + '" aria-label="Изтрий">' + icon('trash') + '</button>' +
        '</span>' +
        '<button type="button" class="gal-swap" data-act="img-pick" data-path="' + p + '.image">' +
          icon('image') + 'Смени снимката</button>' +
      '</span>' +
      '<figcaption>' +
        '<div class="field"><label>Описание на снимката</label>' +
          '<input class="inp" data-path="' + p + '.alt" value="' + UI.attr(it.alt) + '" placeholder="Прясно телешко месо"></div>' +
        '<div class="field"><label>Връзка към публикацията</label>' +
          '<input class="inp mono-inp" data-path="' + p + '.url" value="' + UI.attr(it.url) + '" placeholder="Празно = към профила"></div>' +
      '</figcaption>' +
    '</figure>';
  }

  TERA.views.insta = {
    eyebrow: 'Секция',
    title: 'Instagram',
    anchor: 'insta',
    desc: 'Мрежата със снимки към профила. Снимките се качват ръчно — сайтът не тегли автоматично от Instagram.',

    render: function () {
      var tiles = store.get('insta.tiles') || [];

      return UI.card({
        title: 'Профил и текстове',
        body: UI.fields([
          { k:'eyebrow',   label:'Малък надпис', type:'text', ph:'Следвай ни' },
          { k:'title',     label:'Заглавие', type:'text', ph:'Витрината, на живо' },
          { k:'handle',    label:'Име на профила', type:'text', mono:true, ph:'@tera.mes' },
          { k:'subtitle',  label:'Ред под името', type:'text', ph:'Tera.MES · Месарски магазин' },
          { k:'note',      label:'Бележка над снимките', type:'text', w:'full' },
          { k:'moreLabel', label:'Текст на долната връзка', type:'text', w:'full', ph:'Виж всички публикации' }
        ], 'insta') +
        '<div class="sep"></div>' +
        '<div class="note info">' + icon('info') +
          '<span>Адресът на профила се взима от <a href="#/settings" style="color:var(--blood);text-decoration:underline">Настройки → Контакти</a>, за да е един и същ навсякъде в сайта.</span></div>'
      }) +

      UI.card({
        title: 'Снимки',
        desc: tiles.length + ' плочки. Шест изглеждат най-добре — правят два спретнати реда.',
        actions: '<button type="button" class="abtn abtn-sm abtn-primary" data-act="rep-add" data-path="insta.tiles">' +
                 icon('plus') + 'Добави плочка</button>',
        body: tiles.length
          ? '<div class="gal-grid-edit" data-sort="insta.tiles">' + tiles.map(tile).join('') + '</div>'
          : '<div class="empty">' + icon('instagram') +
            '<b>Няма плочки</b><p>Добави снимки от профила, за да покажеш какво е заредено днес.</p></div>'
      });
    }
  };
})();
