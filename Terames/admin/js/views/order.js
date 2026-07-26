/* Форма за поръчка — трите стъпки и текстовете на формата */
(function () {
  'use strict';
  var UI = TERA.UI, icon = TERA.icon;

  UI.blanks['order.steps'] = function () {
    return { name:'Нова стъпка', text:'' };
  };

  TERA.views.order = {
    eyebrow: 'Секция',
    title: 'Форма за поръчка',
    anchor: 'order',
    desc: 'Стъпките „как става“ и текстовете на самата форма — включително съобщението след изпращане.',

    render: function () {
      return UI.card({
        title: 'Заглавия',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'Поръчай предварително' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Вземи без чакане' }
        ], 'order')
      }) +

      UI.card({
        title: 'Стъпки',
        desc: 'Номерата 1, 2, 3 се слагат автоматично по реда тук — затова редът има значение.',
        body: UI.rep({
          path: 'order.steps',
          addLabel: 'Добави стъпка',
          title: function (it) { return it.name; },
          val: function (it, i) { return 'Стъпка ' + (i + 1); },
          specs: [
            { k:'name', label:'Заглавие на стъпката', type:'text', w:'full', ph:'Обади се или пиши' },
            { k:'text', label:'Обяснение', type:'textarea', w:'full', rows:2 }
          ]
        })
      }) +

      UI.card({
        title: 'Текстове на формата',
        body: UI.fields([
          { k:'formTitle',       label:'Заглавие на формата', type:'text', ph:'Форма за поръчка' },
          { k:'submitLabel',     label:'Текст на бутона', type:'text', ph:'Изпрати поръчката' },
          { k:'formPlaceholder', label:'Пример в полето за поръчка', type:'text', w:'full',
            ph:'Напр.: 1 кг свински врат на пържоли, 500 г кайма смес…' }
        ], 'order')
      }) +

      UI.card({
        title: 'След изпращане',
        desc: 'Какво вижда клиентът, щом натисне бутона.',
        body: UI.fields([
          { k:'okTitle', label:'Заглавие', type:'text', w:'full', ph:'Поръчката е приета!' },
          { k:'okText',  label:'Текст', type:'textarea', w:'full', rows:3 }
        ], 'order')
      }) +

      UI.card({
        title: 'Известия',
        body:
          UI.fields([
            { k:'notifyEmail', label:'Имейл за нови поръчки', type:'email', w:'full',
              ph:'poruchki@tera-mes.bg',
              hint:'Ще заработи, когато свържем формата със сървъра.' }
          ], 'order') +
          '<div class="sep"></div>' +
          '<div class="note">' + icon('alert') +
            '<span>В момента формата на сайта само показва съобщението за успех — поръчките не се записват никъде. ' +
            'Изпращането по имейл и списъкът в „Поръчки“ се включват заедно с бекенда.</span></div>'
      });
    }
  };
})();
