/* Контакти и карта */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  TERA.views.contacts = {
    eyebrow: 'Секция',
    title: 'Контакти и карта',
    anchor: 'contacts',
    desc: 'Телефонът, адресът и картата се използват на повече от десет места в сайта — сменяш ги веднъж тук.',

    render: function () {
      var c = store.get('contact') || {};
      var map = 'https://www.google.com/maps?q=' + encodeURIComponent(c.mapQuery || '');

      return UI.card({
        title: 'Има и цяла страница',
        body: '<div class="note info">' + icon('info') +
          '<span>Данните отдолу важат за целия сайт. Допълненията само за <b>/kontakti/</b> — как да стигнеш, ' +
          'кога да дойдеш и бележката за празниците — са в ' +
          '<a href="#/contactsPage" style="color:var(--blood);text-decoration:underline">Страници → Контакти</a>.</span></div>'
      }) +

      UI.card({
        title: 'Данни за връзка',
        desc: 'Влизат в менюто, бутоните, футъра и плаващите икони на всяка страница.',
        body: UI.fields([
          { k:'phone',      label:'Телефон за набиране', type:'tel', mono:true, ph:'+359000000000',
            hint:'Без интервали — това е номерът, който се набира при натискане.' },
          { k:'phoneLabel', label:'Телефон, както се изписва', type:'text', ph:'+359 000 000 000' },
          { k:'viber',      label:'Viber номер', type:'tel', mono:true, ph:'+359000000000' },
          { k:'email',      label:'Имейл', type:'email', ph:'info@tera-mes.bg' },
          { k:'street',     label:'Улица', type:'text', ph:'ул. Седма' },
          { k:'city',       label:'Населено място', type:'text', ph:'с. Мало Конаре' },
          { k:'instagram',  label:'Instagram потребител', type:'text', mono:true, ph:'tera.mes' },
          { k:'instagramUrl', label:'Адрес на Instagram профила', type:'url', mono:true }
        ], 'contact')
      }) +

      UI.card({
        title: 'Карта',
        desc: 'Търсенето, което отваря Google Maps.',
        actions: '<a class="abtn abtn-sm" href="' + UI.attr(map) + '" target="_blank" rel="noopener">' +
                 icon('external') + 'Провери адреса</a>',
        body: UI.fields([
          { k:'mapQuery', label:'Какво да търси картата', type:'text', w:'full', ph:'Мало Конаре, ул. Седма',
            hint:'Отвори проверката вдясно — ако картата показва точното място, адресът е правилен.' }
        ], 'contact') +
        '<div class="sep"></div>' +
        UI.fields([
          { k:'showMap',  label:'Показвай картата', type:'switch', sub:'Изключи, ако не искаш вградена карта' },
          { k:'mapLabel', label:'Текст под картата', type:'text', ph:'Виж маршрут в Google Maps' }
        ], 'contacts')
      }) +

      UI.card({
        title: 'Заглавия и бутони на секцията',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'Ела на витрината' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Контакти' },
          { k:'cta1',    label:'Първи бутон', type:'text', ph:'Обади се сега' },
          { k:'cta2',    label:'Втори бутон', type:'text', ph:'Поръчай онлайн' }
        ], 'contacts')
      }) +

      UI.card({
        title: 'Работно време',
        desc: 'Определя и надписа „Отворено сега“ до заглавието на секцията.',
        actions: '<a class="abtn abtn-sm" href="#/settings">' + icon('clock') + 'Редактирай часовете</a>',
        body: '<div class="tbl-wrap"><table class="tbl">' +
          '<thead><tr><th>Ден</th><th>Отваря</th><th>Затваря</th><th></th></tr></thead><tbody>' +
          (store.get('hours.rows') || []).map(function (r) {
            return '<tr><td><b>' + UI.esc(r.label) + '</b></td>' +
              '<td class="num">' + (r.closed ? '—' : UI.esc(r.open)) + '</td>' +
              '<td class="num">' + (r.closed ? '—' : UI.esc(r.close)) + '</td>' +
              '<td><span class="pill ' + (r.closed ? 'pill-off' : 'pill-on') + '">' +
                (r.closed ? 'Почивен' : 'Работен') + '</span></td></tr>';
          }).join('') +
          '</tbody></table></div>'
      });
    }
  };
})();
