/* За нас — секцията на началната страница */
(function () {
  'use strict';
  var UI = TERA.UI, icon = TERA.icon;

  UI.blanks['about.counters'] = { value: '0', label: 'Ново число' };

  TERA.views.about = {
    eyebrow: 'Секция',
    title: 'За нас',
    anchor: 'about',
    desc: 'Разказът за магазина, снимката на майстора и числата, които се броят при превъртане.',

    render: function () {
      return UI.card({
        title: 'Има и цяла страница',
        body: '<div class="note info">' + icon('info') +
          '<span>Тук е кратката версия на началната страница. Дългият разказ, времевата линия, правилата и фермите ' +
          'от <b>/za-nas/</b> се пипат в <a href="#/aboutPage" style="color:var(--blood);text-decoration:underline">Страници → За нас</a>. ' +
          'Числата отдолу се показват и на двете места.</span></div>'
      }) +

      UI.card({
        title: 'Текст',
        body: UI.fields([
          { k:'eyebrow', label:'Малък надпис', type:'text', ph:'За нас' },
          { k:'title',   label:'Заглавие', type:'text', ph:'Занаят, който се вижда на витрината' },
          { k:'p1', label:'Първи абзац', type:'textarea', w:'full', rows:4 },
          { k:'p2', label:'Втори абзац', type:'textarea', w:'full', rows:4 }
        ], 'about')
      }) +

      UI.card({
        title: 'Снимка',
        desc: 'Показва се като полароид със залепено тиксо — най-добре работи вертикална снимка.',
        body: UI.fields([
          { k:'image',   label:'Снимка', type:'image', w:'full' },
          { k:'alt',     label:'Описание на снимката', type:'text', w:'full',
            hint:'За хора, които не виждат снимката, и за търсачките.' },
          { k:'caption', label:'Надпис под снимката', type:'text', ph:'Майсторът зад витрината' },
          { k:'stamp',   label:'Печат в ъгъла', type:'text', ph:'ЕСТ. 2024' }
        ], 'about')
      }) +

      UI.card({
        title: 'Числа',
        desc: 'Броят се от нула нагоре, когато посетителят стигне до тях. Пиши само цифри — знакът „+“ се добавя автоматично.',
        body: UI.rep({
          path: 'about.counters',
          addLabel: 'Добави число',
          title: function (it) { return it.label; },
          val: function (it) { return it.value + '+'; },
          specs: [
            { k:'value', label:'Число', type:'number', min:0, step:1 },
            { k:'label', label:'Какво означава', type:'text', ph:'Години занаят' }
          ]
        })
      });
    }
  };
})();
