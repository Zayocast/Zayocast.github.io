/* Снимки — общата библиотека */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  var WHERE = {
    hero: 'Начален екран', about: 'За нас', products: 'Витрина',
    gallery: 'Галерия', insta: 'Instagram', meta: 'Настройки'
  };

  /** Съдържа ли клонът точно този адрес. */
  function has(node, url) {
    if (typeof node === 'string') return node === url;
    if (!node || typeof node !== 'object') return false;
    return Object.keys(node).some(function (k) { return has(node[k], url); });
  }

  /** Къде из сайта се използва дадена снимка. */
  function usedIn(url) {
    if (!url) return [];
    return Object.keys(WHERE).filter(function (k) {
      return has(store.data[k], url);
    }).map(function (k) { return WHERE[k]; });
  }

  TERA.views.media = {
    eyebrow: 'Файлове',
    title: 'Снимки',
    desc: 'Всички снимки на едно място. Оттук ги избираш, когато сменяш изображение в някоя секция.',

    actions: function () {
      return '<button type="button" class="abtn abtn-sm abtn-primary" data-media-add>' +
        icon('upload') + 'Качи снимки</button>';
    },

    render: function () {
      var media = store.get('media') || [];

      var grid = media.map(function (m, i) {
        var used = usedIn(m.url);
        return '<figure class="gal-edit">' +
          '<span class="gal-pic">' +
            '<img src="' + UI.attr(m.url) + '" alt="' + UI.attr(m.name) + '" loading="lazy">' +
            '<span class="gal-tools">' +
              '<button type="button" class="rep-tool" data-copy="' + UI.attr(m.url) + '" aria-label="Копирай адреса">' + icon('copy') + '</button>' +
              '<button type="button" class="rep-tool del" data-act="rep-del" data-path="media" data-i="' + i + '" aria-label="Изтрий от библиотеката">' + icon('trash') + '</button>' +
            '</span>' +
          '</span>' +
          '<figcaption>' +
            '<div class="field"><label>Име</label>' +
              '<input class="inp" data-path="media.' + i + '.name" value="' + UI.attr(m.name) + '"></div>' +
            '<p class="mono" style="font-size:.6rem">' +
              (used.length ? 'Използва се: ' + used.join(', ') : 'Не се използва никъде') + '</p>' +
          '</figcaption>' +
        '</figure>';
      }).join('');

      return UI.card({
        title: 'Качване',
        body:
          '<div class="dropzone" data-drop>' + icon('upload') +
            '<b>Пусни снимки тук</b>' +
            '<span>или натисни, за да избереш от устройството · JPG, PNG, WebP</span>' +
            '<input type="file" accept="image/*" hidden data-file multiple>' +
          '</div>' +
          '<div class="sep"></div>' +
          '<div class="note">' + icon('alert') +
            '<span>Засега качените снимки се пазят само в този браузър. Когато свържем сървъра, ' +
            'те ще се записват в папка на сайта и ще се виждат от всяко устройство. ' +
            'Смалявай снимките до около 1600 пиксела ширина — сайтът се отваря по-бързо.</span></div>'
      }) +

      UI.card({
        title: 'Библиотека',
        desc: media.length + ' снимки.',
        body: media.length
          ? '<div class="gal-grid-edit">' + grid + '</div>'
          : '<div class="empty">' + icon('folder') +
            '<b>Библиотеката е празна</b><p>Качи първите снимки, за да ги използваш в секциите на сайта.</p></div>'
      });
    }
  };

  /* --- копиране на адрес --- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var url = b.dataset.copy;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        UI.toast('Адресът е копиран');
      }, function () { UI.toast('Копирането не мина', 'err'); });
    } else {
      UI.toast('Браузърът не поддържа копиране', 'err');
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-media-add]')) return;
    var f = document.querySelector('[data-file]');
    if (f) f.click();
  });
})();
