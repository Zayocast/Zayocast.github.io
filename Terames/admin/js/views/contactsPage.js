/* Контакти — съдържанието на отделната страница /kontakti/ */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['contacts.directions'] = function () { return { h:'Нов маршрут', p:'' }; };
  UI.blanks['contacts.bestTime']   = function () { return { h:'00:00 – 00:00', p:'' }; };

  TERA.views.contactsPage = {
    eyebrow: 'Страници',
    title: 'Контакти (страница)',
    url: 'kontakti/',
    desc: 'Допълненията, които ги има само на /kontakti/. Телефонът, адресът и работното време идват от „Съдържание → Контакти“.',

    render: function () {
      var dir  = store.get('contacts.directions') || [];
      var best = store.get('contacts.bestTime') || [];

      return UI.card({
        title: 'Начало на страницата',
        body: UI.fields([
          { k:'pageLead', label:'Изречение под заглавието', type:'textarea', w:'full', rows:2,
            ph:'Най-бързо се разбираме по телефона…' }
        ], 'contacts') +
        '<div class="sep"></div>' +
        '<div class="note info">' + icon('info') +
          '<span>Телефонът, Viber, адресът, Instagram и работното време се вземат от ' +
          '<a href="#/contacts" style="color:var(--blood);text-decoration:underline">Съдържание → Контакти</a> и ' +
          '<a href="#/settings" style="color:var(--blood);text-decoration:underline">Настройки</a>. ' +
          'Сменяш ги веднъж и се обновяват на целия сайт.</span></div>'
      }) +

      UI.card({
        title: 'Как да стигнеш',
        desc: dir.length + ' карти. Изглеждат най-добре на четири.',
        body: UI.fields([
          { k:'directionsTitle', label:'Заглавие на секцията', type:'text', w:'full', ph:'Как да стигнеш' }
        ], 'contacts') +
        '<div class="sep"></div>' +
        UI.rep({
          path: 'contacts.directions',
          addLabel: 'Добави маршрут',
          title: function (it) { return it.h; },
          specs: [
            { k:'h', label:'Откъде идва човекът', type:'text', w:'full', ph:'От Пазарджик' },
            { k:'p', label:'Обяснение', type:'textarea', w:'full', rows:2,
              hint:'Кажи посока и колко време отнема — не адрес, той вече е на картата.' }
          ]
        })
      }) +

      UI.card({
        title: 'Кога да дойдеш',
        desc: best.length + ' часови ленти. Това е най-полезната секция за клиента — пиши истината за натовареността.',
        body: UI.fields([
          { k:'bestTimeTitle', label:'Заглавие на секцията', type:'text', w:'full', ph:'Кога да дойдеш' }
        ], 'contacts') +
        '<div class="sep"></div>' +
        UI.rep({
          path: 'contacts.bestTime',
          addLabel: 'Добави час',
          title: function (it) { return it.h; },
          specs: [
            { k:'h', label:'Часове или ден', type:'text', mono:true, ph:'08:00 – 10:00' },
            { k:'p', label:'Какво да очаква', type:'textarea', w:'full', rows:2,
              ph:'Витрината е най-заредена. Пристига прясното месо.' }
          ]
        })
      }) +

      UI.card({
        title: 'Бележка за празниците',
        body: UI.fields([
          { k:'holidayNote', label:'Текст в червената рамка', type:'textarea', w:'full', rows:2,
            hint:'Показва се под работното време. Тук пиши променено време за официални празници.' }
        ], 'contacts')
      });
    }
  };
})();
