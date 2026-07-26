/* За нас — съдържанието на отделната страница /za-nas/ */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['about.story']    = function () { return { h:'Ново заглавие', p:'' }; };
  UI.blanks['about.values']   = function () { return { h:'Ново правило', p:'' }; };
  UI.blanks['about.timeline'] = function () { return { year:String(new Date().getFullYear()), h:'Ново събитие', p:'' }; };
  UI.blanks['about.farms']    = function () { return { name:'Нова ферма', kind:'Свинско', p:'' }; };

  TERA.views.aboutPage = {
    eyebrow: 'Страници',
    title: 'За нас (страница)',
    url: 'za-nas/',
    desc: 'Дългият разказ на /za-nas/. Кратката версия на началната страница се пипа от „Съдържание → За нас“.',

    render: function () {
      var story = store.get('about.story') || [];
      var line  = store.get('about.timeline') || [];
      var vals  = store.get('about.values') || [];
      var farms = store.get('about.farms') || [];

      return UI.card({
        title: 'Начало на страницата',
        desc: 'Първото, което посетителят вижда.',
        body: UI.fields([
          { k:'kicker', label:'Малък надпис', type:'text', ph:'Историята зад тезгяха' },
          { k:'title',  label:'Заглавие', type:'text', ph:'Занаят, а не търговия' },
          { k:'lead',   label:'Един абзац под заглавието', type:'textarea', w:'full', rows:3 },
          { k:'image',  label:'Голяма снимка', type:'image', w:'full' },
          { k:'alt',    label:'Описание на снимката', type:'text', w:'full',
            hint:'За хора, които не виждат снимката, и за търсачките.' }
        ], 'about.page')
      }) +

      UI.card({
        title: 'Разказът',
        desc: story.length + ' блока. Показват се до голямата снимка.',
        body: UI.rep({
          path: 'about.story',
          addLabel: 'Добави блок',
          title: function (it) { return it.h; },
          specs: [
            { k:'h', label:'Заглавие', type:'text', w:'full', ph:'Защо отворихме' },
            { k:'p', label:'Текст', type:'textarea', w:'full', rows:4 }
          ]
        })
      }) +

      UI.card({
        title: 'Как стигнахме дотук',
        desc: line.length + ' стъпки на тъмната лента. Подреждай ги от най-старата към най-новата.',
        body: UI.rep({
          path: 'about.timeline',
          addLabel: 'Добави стъпка',
          title: function (it) { return it.h; },
          val: function (it) { return it.year; },
          specs: [
            { k:'year', label:'Година', type:'text', mono:true, ph:'2024' },
            { k:'h',    label:'Какво стана', type:'text', ph:'Собствена транжорна' },
            { k:'p',    label:'Обяснение', type:'textarea', w:'full', rows:2 }
          ]
        })
      }) +

      UI.card({
        title: 'Правилата, които не нарушаваме',
        desc: vals.length + ' правила. Изглеждат най-добре на три или на шест.',
        body:
          (vals.length && vals.length % 3 !== 0
            ? '<div class="note">' + icon('alert') +
              '<span>' + vals.length + ' правила ще оставят дупка в последния ред. Три, шест или девет се подреждат най-чисто.</span></div><div style="height:1rem"></div>'
            : '') +
          UI.rep({
            path: 'about.values',
            addLabel: 'Добави правило',
            title: function (it) { return it.h; },
            specs: [
              { k:'h', label:'Правило', type:'text', w:'full', ph:'Произход с име' },
              { k:'p', label:'Обяснение в едно изречение', type:'textarea', w:'full', rows:2 }
            ]
          })
      }) +

      UI.card({
        title: 'Фермите',
        desc: farms.length + ' доставчика.',
        body:
          '<div class="note info">' + icon('info') +
            '<span>Не пиши имена на ферми, за които нямаш съгласие да ги споменаваш публично. ' +
            'Бележката отдолу е точно за това — казваш ги на място.</span></div>' +
          '<div style="height:1rem"></div>' +
          UI.rep({
            path: 'about.farms',
            addLabel: 'Добави ферма',
            title: function (it) { return it.name; },
            val: function (it) { return it.kind; },
            specs: [
              { k:'name', label:'Как я наричаш', type:'text', ph:'Ферма край Пазарджик' },
              { k:'kind', label:'Какво доставя', type:'text', ph:'Свинско' },
              { k:'p',    label:'Едно изречение за нея', type:'textarea', w:'full', rows:2 }
            ]
          }) +
          '<div class="sep"></div>' +
          UI.fields([
            { k:'farmsNote', label:'Бележка под фермите', type:'textarea', w:'full', rows:2 }
          ], 'about')
      }) +

      UI.card({
        title: 'Цитатът',
        desc: 'Голямата реплика на розовия фон, преди числата.',
        body: UI.fields([
          { k:'quote',   label:'Какво се казва', type:'textarea', w:'full', rows:3 },
          { k:'quoteBy', label:'Кой го казва', type:'text', w:'full', ph:'Майсторът зад тезгяха' }
        ], 'about.page') +
        '<div class="sep"></div>' +
        '<div class="note info">' + icon('info') +
          '<span>Числата под цитата са същите като на началната страница — редактират се от ' +
          '<a href="#/about" style="color:var(--blood);text-decoration:underline">Съдържание → За нас</a>.</span></div>'
      });
    }
  };
})();
