/* Настройки — общи данни, SEO, работно време, цветове, достъп */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  UI.blanks['hours.rows'] = function () {
    return { label:'Нов ред', open:'08:00', close:'18:00', closed:false, spec:'0' };
  };
  UI.blanks['users'] = function () {
    return { name:'Нов потребител', email:'', role:'Редактор', on:true };
  };

  var DAY_OPTS = [
    { v:'1-5', l:'Понеделник – Петък' },
    { v:'1', l:'Понеделник' }, { v:'2', l:'Вторник' }, { v:'3', l:'Сряда' },
    { v:'4', l:'Четвъртък' },  { v:'5', l:'Петък' },   { v:'6', l:'Събота' },
    { v:'0', l:'Неделя' }
  ];

  function general() {
    return UI.card({
      title: 'Магазинът',
      body: UI.fields([
        { k:'siteName', label:'Име', type:'text', ph:'Tera.MES' },
        { k:'founded',  label:'Година на основаване', type:'text', ph:'2024' },
        { k:'logo',     label:'Лого', type:'image', w:'full',
          hint:'Показва се в менюто, футъра и Instagram картата. Квадратна снимка с прозрачен фон работи най-добре.' }
      ], 'meta')
    }) +

    UI.card({
      title: 'Как изглежда в Google и социалните мрежи',
      desc: 'Това са текстовете, които хората виждат, преди да отворят сайта.',
      body:
        UI.fields([
          { k:'title',       label:'Заглавие на страницата', type:'text', w:'full',
            hint:'До 60 знака се показват изцяло в Google.' },
          { k:'description', label:'Описание за Google', type:'textarea', w:'full', rows:3,
            hint:'До 155 знака. Кажи какво предлагаш и къде се намираш.' },
          { k:'ogTitle',       label:'Заглавие при споделяне', type:'text' },
          { k:'ogDescription', label:'Описание при споделяне', type:'text' },
          { k:'ogImage',   label:'Снимка при споделяне', type:'image', w:'full',
            hint:'Показва се, когато някой пусне връзка към сайта във Facebook или Viber.' },
          { k:'canonical', label:'Адрес на сайта', type:'url', mono:true, ph:'https://tera-mes.bg/' }
        ], 'meta') +
        '<div class="sep"></div>' +
        preview()
    });
  }

  function preview() {
    var m = store.get('meta') || {};
    return '<p class="mono" style="margin-bottom:.5rem">Така изглежда в Google</p>' +
      '<div style="border:1px solid var(--line);border-radius:var(--r-sm);padding:.9rem 1rem;background:var(--surface-2)">' +
        '<div style="font-family:var(--f-mono);font-size:.7rem;color:var(--ink-3)">' + UI.esc(m.canonical || 'https://tera-mes.bg/') + '</div>' +
        '<div style="color:#1a56db;font-size:1.05rem;font-weight:600;margin:.15rem 0 .2rem">' + UI.esc(m.title || '') + '</div>' +
        '<div style="font-size:.84rem;color:var(--ink-2);line-height:1.5">' + UI.esc(m.description || '') + '</div>' +
      '</div>';
  }

  function hours() {
    return UI.card({
      title: 'Работно време',
      desc: 'Определя надписа „Отворено сега“ на сайта и подчертания ред в таблицата.',
      body: UI.rep({
        path: 'hours.rows',
        addLabel: 'Добави ред',
        title: function (r) { return r.label; },
        val: function (r) { return r.closed ? 'Почивен' : r.open + ' – ' + r.close; },
        specs: [
          { k:'label',  label:'Как се изписва', type:'text', ph:'Понеделник – Петък' },
          { k:'spec',   label:'За кой ден важи', type:'select', opts: DAY_OPTS },
          { k:'open',   label:'Отваря в', type:'time' },
          { k:'close',  label:'Затваря в', type:'time' },
          { k:'closed', label:'Почивен ден', type:'switch', w:'full', sub:'Часовете се пренебрегват' }
        ]
      })
    }) +
    UI.card({
      title: 'Валута',
      body:
        '<div class="note info">' + icon('info') +
          '<span>Всички цени се въвеждат в <b>евро</b>. Равностойността в лева се смята автоматично по фиксирания курс ' +
          '<b>1 € = 1,95583 лв.</b> и се показва под всяка цена в сайта. Няма нужда да въвеждаш левове ръчно.</span></div>'
    });
  }

  function design() {
    return UI.card({
      title: 'Цветове',
      desc: 'Смени ги само ако знаеш какво правиш — палитрата е подбрана да остане четлива върху всички фонове.',
      body: UI.fields([
        { k:'blood', label:'Червено (акцент)', type:'color' },
        { k:'paper', label:'Хартия (фон)', type:'color' },
        { k:'pink',  label:'Розово (светли секции)', type:'color' },
        { k:'smoke', label:'Опушено (текст)', type:'color' }
      ], 'design') +
      '<div class="sep"></div>' +
      '<div class="row-flex">' +
        ['blood','paper','pink','smoke'].map(function (k) {
          var v = store.get('design.' + k);
          return '<span style="display:inline-flex;align-items:center;gap:.45rem;font-family:var(--f-mono);font-size:.7rem">' +
            '<span style="width:28px;height:28px;border-radius:7px;border:1.5px solid var(--line);background:' + UI.attr(v) + '"></span>' +
            UI.esc(v) + '</span>';
        }).join('') +
      '</div>'
    }) +

    UI.card({
      title: 'Ефекти',
      body: UI.fields([
        { k:'showGrain',   label:'Зърнеста текстура', type:'switch', w:'full',
          sub:'Финият шум върху целия сайт, който му дава вид на печатан плакат' },
        { k:'showMarquee', label:'Бягащ надпис', type:'switch', w:'full',
          sub:'Червената лента с превъртащ се текст между секциите' },
        { k:'marqueeText', label:'Текст на бягащия надпис', type:'text', w:'full',
          hint:'Разделяй с ✦ — знакът се повтаря между думите.' }
      ], 'design')
    });
  }

  function users() {
    return UI.card({
      title: 'Достъп до панела',
      desc: 'Кой може да влиза и да променя сайта.',
      body: UI.rep({
        path: 'users',
        addLabel: 'Добави потребител',
        title: function (u) { return u.name; },
        val: function (u) { return u.role; },
        toggleKey: 'on',
        specs: [
          { k:'name',  label:'Име', type:'text' },
          { k:'email', label:'Имейл', type:'email', mono:true },
          { k:'role',  label:'Роля', type:'select', opts:['Администратор','Редактор','Разработчик'] },
          { k:'on',    label:'Активен достъп', type:'switch', sub:'Изключеният не може да влиза' }
        ]
      })
    }) +
    UI.card({
      title: 'Парола',
      body: '<div class="note">' + icon('lock') +
        '<span>Смяната на парола ще заработи заедно със сървърната част. Дотогава входът е само за показ — ' +
        'панелът не е защитен и не бива да се качва на публичен адрес.</span></div>'
    });
  }

  function dataTab() {
    return UI.card({
      title: 'Резервно копие',
      desc: 'Свали всичко като файл, преди да правиш големи промени.',
      body:
        '<div class="row-flex">' +
          '<button type="button" class="abtn" data-export>' + icon('download') + 'Свали копие</button>' +
          '<button type="button" class="abtn" data-import>' + icon('upload') + 'Възстанови от файл</button>' +
          '<input type="file" accept="application/json" hidden data-import-file>' +
        '</div>' +
        '<div class="sep"></div>' +
        '<div class="note info">' + icon('info') +
          '<span>Копието съдържа всички текстове, цени и настройки. Качените снимки също влизат в него, ' +
          'затова файлът може да е голям.</span></div>'
    }) +

    UI.card({
      title: 'Връщане към началното съдържание',
      desc: 'Всичко се връща към съдържанието, с което сайтът е пуснат.',
      body:
        '<div class="note">' + icon('alert') +
          '<span>Това изтрива всички твои промени безвъзвратно. Свали резервно копие първо.</span></div>' +
        '<div style="height:1rem"></div>' +
        '<button type="button" class="abtn abtn-danger" data-reset>' + icon('refresh') + 'Върни началното съдържание</button>'
    });
  }

  TERA.views.settings = {
    eyebrow: 'Управление',
    title: 'Настройки',
    desc: 'Име, лого, текстове за Google, работно време, цветове и достъп до панела.',

    render: function () {
      var tab = TERA.router.tab || 'general';
      var body =
        tab === 'hours'  ? hours()  :
        tab === 'design' ? design() :
        tab === 'users'  ? users()  :
        tab === 'data'   ? dataTab(): general();

      return UI.tabs([
        { id:'general', label:'Общи и SEO' },
        { id:'hours',   label:'Работно време' },
        { id:'design',  label:'Външен вид' },
        { id:'users',   label:'Достъп' },
        { id:'data',    label:'Данни' }
      ], tab) + body;
    }
  };

  /* ---------- копие / възстановяване / нулиране ---------- */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-export]')) {
      var blob = new Blob([JSON.stringify(store.data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tera-mes-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      UI.toast('Копието е свалено');
      return;
    }

    if (e.target.closest('[data-import]')) {
      var f = document.querySelector('[data-import-file]');
      if (f) f.click();
      return;
    }

    if (e.target.closest('[data-reset]')) {
      UI.confirm({
        title: 'Връщане към началото',
        text: 'Всички промени по сайта ще бъдат изтрити и съдържанието ще се върне към първоначалното. Това не може да се отмени.',
        ok: 'Да, върни всичко'
      }).then(function (ok) {
        if (!ok) return;
        return store.resetAll().then(function () {
          UI.rerender();
          UI.toast('Върнато е началното съдържание');
        });
      });
    }
  });

  document.addEventListener('change', function (e) {
    if (!e.target.matches('[data-import-file]')) return;
    var file = e.target.files[0];
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var parsed = JSON.parse(r.result);
        if (!parsed || !parsed.meta) throw new Error('bad');
        store.hydrate(parsed);
        UI.rerender();
        UI.toast('Копието е заредено — прегледай и запази');
      } catch (err) {
        UI.toast('Файлът не е валидно копие', 'err');
      }
    };
    r.readAsText(file);
  });
})();
