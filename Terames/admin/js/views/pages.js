/* Страници — какви отделни адреси има сайтът и къде се пипа всяка */
(function () {
  'use strict';
  var UI = TERA.UI, store = TERA.store, icon = TERA.icon;

  /* Всяка страница има собствен адрес (папка с index.html). Тук се
     описва само откъде се редактира съдържанието ѝ. */
  var SITE = [
    { url:'',                 name:'Начална',       where:'#/hero',         edit:'Начален екран и всички секции' },
    { url:'tsenorazpis/',     name:'Ценоразпис',    where:'#/products',     edit:'Витрина и цени' },
    { url:'razfasovki/',      name:'Разфасовки',    where:'#/cuts',         edit:'Карта на разфасовките' },
    { url:'recepti/',         name:'Рецепти',       where:'#/recipes',      edit:'Рецепти' },
    { url:'za-nas/',          name:'За нас',        where:'#/aboutPage',    edit:'За нас (страница)' },
    { url:'kontakti/',        name:'Контакти',      where:'#/contactsPage', edit:'Контакти (страница)' },
    { url:'usloviya/',        name:'Общи условия',  where:'#/legal',        edit:'Правни текстове' },
    { url:'poveritelnost/',   name:'Поверителност', where:'#/legal',        edit:'Правни текстове' },
    { url:'biskvitki/',       name:'Бисквитки',     where:'#/legal',        edit:'Правни текстове' }
  ];

  /** Рецептите с адрес имат собствена страница; останалите се разгъват в списъка. */
  function recipeState() {
    var items = (store.get('recipes.items') || []).filter(function (r) { return r.on !== false; });
    var withPage = items.filter(function (r) { return r.slug; });
    return { all: items.length, own: withPage.length, list: withPage };
  }

  TERA.views.pages = {
    eyebrow: 'Страници',
    title: 'Преглед на страниците',
    desc: 'Сайтът вече не е една страница. Тук виждаш всички адреси и откъде се редактира всеки.',

    render: function () {
      var r = recipeState();

      var rows = SITE.map(function (p) {
        return '<tr>' +
          '<td><b>' + UI.esc(p.name) + '</b></td>' +
          '<td><code class="mono">/' + UI.esc(p.url) + '</code></td>' +
          '<td><a href="' + UI.attr(p.where) + '">' + UI.esc(p.edit) + '</a></td>' +
          '<td class="num"><a class="abtn abtn-sm" href="../' + UI.attr(p.url) + '" target="_blank" rel="noopener">' +
            icon('external') + 'Отвори</a></td>' +
        '</tr>';
      }).join('');

      var recipeRows = r.list.map(function (x) {
        return '<tr><td><b>' + UI.esc(x.name) + '</b></td>' +
          '<td><code class="mono">/recepti/' + UI.esc(x.slug) + '/</code></td>' +
          '<td class="num"><a class="abtn abtn-sm" href="../recepti/' + UI.attr(x.slug) + '/" target="_blank" rel="noopener">' +
            icon('external') + 'Отвори</a></td></tr>';
      }).join('');

      return UI.card({
        title: 'Адресите на сайта',
        desc: SITE.length + ' страници. Редактирането става от посочения екран — съдържанието е общо.',
        body: '<div class="tbl-wrap"><table class="tbl">' +
          '<thead><tr><th>Страница</th><th>Адрес</th><th>Редактира се от</th><th></th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table></div>'
      }) +

      UI.card({
        title: 'Рецепти със собствен адрес',
        desc: r.own + ' от ' + r.all + ' рецепти имат собствена страница.',
        body:
          (r.own < r.all
            ? '<div class="note">' + icon('alert') +
              '<span>' + (r.all - r.own) + ' рецепти нямат собствен адрес. Те се показват в списъка на ' +
              '<a href="#/recipes" style="color:var(--blood);text-decoration:underline">/recepti/</a> и се разгъват на място — ' +
              'работят напълно, просто нямат отделна страница за Google. За да получат такава, трябва да им се направи папка. ' +
              'Кажи на разработчика и ще я създаде за минута.</span></div><div style="height:1rem"></div>'
            : '') +
          (recipeRows
            ? '<div class="tbl-wrap"><table class="tbl">' +
              '<thead><tr><th>Рецепта</th><th>Адрес</th><th></th></tr></thead>' +
              '<tbody>' + recipeRows + '</tbody></table></div>'
            : '<div class="empty">' + icon('book') + '<b>Още няма рецепти със собствен адрес</b></div>')
      }) +

      UI.card({
        title: 'Как работи',
        body: '<div class="note info">' + icon('info') +
          '<span>Менюто, футърът и кошницата са едни и същи на всички страници и се рисуват от един файл. ' +
          'Каквото смениш в <a href="#/nav" style="color:var(--blood);text-decoration:underline">Менюта</a> или в ' +
          '<a href="#/contacts" style="color:var(--blood);text-decoration:underline">Контакти</a>, се сменя навсякъде наведнъж — ' +
          'няма нужда да пипаш всяка страница поотделно.</span></div>'
      });
    }
  };
})();
