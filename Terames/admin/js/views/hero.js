/* Начален екран — първото, което вижда посетителят */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store;

  UI.blanks['trust.items'] = { text: 'Нова гаранция' };

  TERA.views.hero = {
    eyebrow: 'Секция',
    title: 'Начален екран',
    anchor: 'top',
    desc: 'Голямото заглавие, снимката на фона и картичката „Избор на месаря“ — това, което посетителят вижда преди да превърти.',

    render: function () {
      return UI.card({
        title: 'Заглавие и текст',
        desc: 'Заглавието е на два реда — вторият е в червено.',
        body: UI.fields([
          { k:'kicker', label:'Малък надпис отгоре', type:'text', w:'full', ph:'Месарски магазин · с. Мало Конаре' },
          { k:'line1',  label:'Заглавие, първи ред', type:'text', ph:'Прясно месо.' },
          { k:'line2',  label:'Заглавие, втори ред (червен)', type:'text', ph:'Всеки ден.' },
          { k:'lead',   label:'Подзаглавие', type:'textarea', w:'full', rows:3,
            hint:'Две изречения са достатъчни — тук се решава дали посетителят ще продължи надолу.' },
          { k:'tags',   label:'Етикети под текста', type:'tags', w:'full',
            hint:'Кратки думи по 2–4 на брой. Enter добавя нов.' }
        ], 'hero')
      }) +

      UI.card({
        title: 'Снимка на фона',
        desc: 'Широка, тъмна снимка работи най-добре — текстът върху нея е светъл.',
        body: UI.fields([
          { k:'bg', label:'Снимка', type:'image', w:'full' }
        ], 'hero')
      }) +

      UI.card({
        title: 'Бутони и ред с информация',
        body: UI.fields([
          { k:'btn1.label', label:'Основен бутон — текст', type:'text', ph:'Виж витрината' },
          { k:'btn1.href',  label:'Основен бутон — накъде води', type:'text', mono:true, ph:'#products' },
          { k:'btn2.label', label:'Втори бутон — текст', type:'text', ph:'Обади се' },
          { k:'btn2.href',  label:'Втори бутон — накъде води', type:'text', mono:true, ph:'tel:',
            hint:'Остави „tel:“, за да използва телефона от Контакти.' },
          { k:'meta', label:'Ред с кратка информация', type:'lines', w:'full', rows:3,
            hint:'По един запис на ред. Показват се разделени под бутоните.' }
        ], 'hero')
      }) +

      UI.card({
        title: 'Картичка „Избор на месаря“',
        desc: 'Продуктът, който изпъква вдясно на началния екран.',
        body: UI.fields([
          { k:'kicker', label:'Надпис на картичката', type:'text', ph:'Избор на месаря' },
          { k:'name',   label:'Име на продукта', type:'text', ph:'Рибай стек' },
          { k:'desc',   label:'Кратко описание', type:'text', w:'full', ph:'Отлежал · режем пред теб' },
          { k:'eur',    label:'Цена', type:'price' },
          { k:'unit',   label:'Мерна единица', type:'select', opts:['/ кг','/ бр','/ порция','/ 100 г'] },
          { k:'image',  label:'Снимка на продукта', type:'image', w:'full' },
          { k:'alt',    label:'Описание на снимката', type:'text', w:'full',
            hint:'Кратко изречение за хора, които не виждат снимката, и за Google.' },
          { k:'stamp',  label:'Стикер върху картичката', type:'text', w:'full', ph:'Заредено тази сутрин' }
        ], 'hero.card')
      }) +

      UI.card({
        title: 'Кръглият печат',
        desc: 'Въртящият се надпис около картичката.',
        body: UI.fields([
          { k:'badgeText',   label:'Надпис в кръга', type:'text', w:'full',
            hint:'Разделяй думите с • за да изглежда добре при въртене.' },
          { k:'badgeCenter', label:'Текст в средата', type:'text', ph:'100%' }
        ], 'hero')
      }) +

      UI.card({
        title: 'Лента с гаранции',
        desc: 'Четирите кратки твърдения точно под началния екран.',
        body: UI.rep({
          path: 'trust.items',
          addLabel: 'Добави гаранция',
          title: function (it) { return it.text; },
          specs: [{ k:'text', label:'Текст', type:'text', w:'full', ph:'100% българско месо' }]
        })
      });
    }
  };
})();
