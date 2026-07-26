/* ============================================================
   TERA.MES — рисувачите на отделните страници
   Всяка функция получава готовото съдържание и попълва своята
   страница. Коя се вика се решава от <body data-page="…">.
   ============================================================ */
window.TERA = window.TERA || {};

(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function attr(s) { return esc(s).replace(/"/g, '&quot;'); }
  function set(sel, txt) { var el = $(sel); if (el && txt) el.textContent = txt; }

  /* ============================================================
     1 · Ценоразпис — /tsenorazpis/
     ============================================================ */
  function prices(C) {
    var sort = 'default', cat = 'all', q = '';

    function visible() {
      var list = C.products.items.filter(function (p) { return p.on !== false; });
      if (cat !== 'all') list = list.filter(function (p) { return p.cat === cat; });
      if (q) list = list.filter(function (p) {
        return (p.name + ' ' + (p.desc || '')).toLowerCase().indexOf(q) >= 0;
      });
      if (sort === 'cheap')  list = list.slice().sort(function (a, b) { return TERA.toNum(a.eur) - TERA.toNum(b.eur); });
      if (sort === 'pricey') list = list.slice().sort(function (a, b) { return TERA.toNum(b.eur) - TERA.toNum(a.eur); });
      if (sort === 'name')   list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'bg'); });
      return list;
    }
    /* листът за печат чете същия филтриран списък */
    TERA.visibleProducts = visible;

    function render() {
      var box = $('#prodList');
      var rows = visible();
      set('#prodCount', rows.length + ' от ' + C.products.items.length + ' продукта');

      if (!rows.length) {
        box.innerHTML = '<p class="mrow-empty">' + esc(C.products.noResults) + '</p>';
        return;
      }
      box.innerHTML = rows.map(function (p) {
        return '<div class="mrow' + (p.out ? ' out' : '') + '" data-cat="' + attr(p.cat) + '">' +
          '<div class="mname"><h3>' + esc(p.name) +
            (p.out ? '<i class="out-tag">' + esc(C.products.outLabel) + '</i>' : '') +
          '</h3><p>' + esc(p.desc || '') + '</p></div>' +
          '<span class="dots" aria-hidden="true"></span>' +
          '<div class="mprice"><b>' + esc(p.eur) + ' €</b><span>' + TERA.toLv(p.eur) + ' лв. / кг</span></div>' +
          (p.out ? '' : '<button class="mrow-add" type="button" data-add data-name="' + attr(p.name) +
            '" data-eur="' + attr(p.eur) + '" data-unit="/ кг" aria-label="Добави ' + attr(p.name) + ' в поръчката">+</button>') +
        '</div>';
      }).join('');
    }

    var chips = $('#chips');
    if (chips) {
      chips.innerHTML = '<button class="chip active" data-cat="all">Всички</button>' +
        C.products.categories.map(function (c) {
          return '<button class="chip" data-cat="' + attr(c.key) + '">' + esc(c.label) + '</button>';
        }).join('');
      chips.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        $$('.chip', chips).forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        cat = chip.dataset.cat;
        render();
      });
    }

    var search = $('#prodSearch');
    if (search) {
      search.placeholder = C.products.searchPlaceholder || search.placeholder;
      search.addEventListener('input', function () {
        q = search.value.trim().toLowerCase();
        render();
      });
    }
    var sel = $('#prodSort');
    if (sel) sel.addEventListener('change', function () { sort = sel.value; render(); });

    set('#pricesTitle', C.products.boardTitle);
    set('#pricesSub', C.products.boardSub);
    set('#pricesNote', C.products.note);
    set('#pricesStamp', C.products.stamp);
    render();
  }

  /* ============================================================
     2 · Рецепти — /recepti/
     ============================================================ */
  function recipeCard(r, base) {
    var link = r.slug ? base + r.slug + '/' : '';
    var meta = ['time', 'level', 'portions'].map(function (k) {
      return r[k] ? '<li>' + esc(r[k]) + '</li>' : '';
    }).join('');

    return '<article class="rc-card" data-rv data-q="' +
        attr(((r.name || '') + ' ' + (r.cut || '') + ' ' + (r.text || '')).toLowerCase()) + '">' +
      (r.image ? '<figure class="rc-img"><img src="' + attr(r.image) + '" alt="' + attr(r.name) +
        '" width="800" height="600" loading="lazy" decoding="async"></figure>' : '') +
      '<div class="rc-body">' +
        (r.cut ? '<span class="recipe-cut">' + esc(r.cut) + '</span>' : '') +
        '<h3>' + (link ? '<a href="' + attr(link) + '">' + esc(r.name) + '</a>' : esc(r.name)) + '</h3>' +
        '<p class="recipe-lead">' + esc(r.text || '') + '</p>' +
        '<ul class="recipe-meta">' + meta + '</ul>' +
        '<div class="rc-acts">' +
          (link
            ? '<a class="btn btn-red" href="' + attr(link) + '">Виж рецептата</a>'
            : '<button class="btn btn-red rc-open" type="button">Виж рецептата</button>') +
          (r.cut ? '<button class="btn btn-ghost" type="button" data-add data-name="' + attr(r.cut) +
            '" data-unit="/ кг">Добави ' + esc(r.cut) + '</button>' : '') +
        '</div>' +
        (link ? '' : recipeInline(r)) +
      '</div>' +
    '</article>';
  }

  /** Пълната рецепта, когато няма отделна страница за нея. */
  function recipeInline(r) {
    return '<div class="rc-inline" hidden>' + recipeBody(r) +
      '<button class="recipe-close" type="button">Скрий рецептата</button></div>';
  }

  function recipeBody(r) {
    return '<div class="recipe-cols">' +
        '<div><h4>Продукти</h4><ul class="recipe-ing">' +
          (r.ingredients || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') +
        '</ul></div>' +
        '<div><h4>Стъпки</h4><ol class="recipe-steps">' +
          (r.steps || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') +
        '</ol></div>' +
      '</div>';
  }

  function recepti(C) {
    var box = $('#recipeList');
    if (!box) return;
    var items = (C.recipes.items || []).filter(function (r) { return r.on !== false; });

    set('#recipesLead', C.recipes.sub);

    /* филтър по разфасовка */
    var cuts = [];
    items.forEach(function (r) { if (r.cut && cuts.indexOf(r.cut) < 0) cuts.push(r.cut); });
    var chips = $('#recipeChips');
    if (chips) {
      chips.innerHTML = '<button class="chip active" data-cut="all">Всички</button>' +
        cuts.map(function (c) { return '<button class="chip" data-cut="' + attr(c) + '">' + esc(c) + '</button>'; }).join('');
    }

    box.innerHTML = items.map(function (r) { return recipeCard(r, ''); }).join('');
    set('#recipeCount', items.length + ' рецепти');

    function filter() {
      var active = $('#recipeChips .chip.active');
      var cut = active ? active.dataset.cut : 'all';
      var q = ($('#recipeSearch') ? $('#recipeSearch').value : '').trim().toLowerCase();
      var shown = 0;
      $$('#recipeList .rc-card').forEach(function (card, i) {
        var r = items[i];
        var hit = (cut === 'all' || r.cut === cut) && (!q || card.dataset.q.indexOf(q) >= 0);
        card.hidden = !hit;
        if (hit) shown++;
      });
      var empty = $('#recipeEmpty');
      if (empty) empty.hidden = shown > 0;
      set('#recipeCount', shown + ' от ' + items.length + ' рецепти');
    }

    if (chips) chips.addEventListener('click', function (e) {
      var c = e.target.closest('.chip');
      if (!c) return;
      $$('.chip', chips).forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active');
      filter();
    });
    var s = $('#recipeSearch');
    if (s) s.addEventListener('input', filter);

    box.addEventListener('click', function (e) {
      var open = e.target.closest('.rc-open');
      if (open) {
        var panel = open.closest('.rc-body').querySelector('.rc-inline');
        var show = panel.hidden;
        panel.hidden = !show;
        open.textContent = show ? 'Скрий рецептата' : 'Виж рецептата';
        return;
      }
      var close = e.target.closest('.recipe-close');
      if (close) {
        var box2 = close.closest('.rc-inline');
        box2.hidden = true;
        var btn = box2.closest('.rc-body').querySelector('.rc-open');
        if (btn) { btn.textContent = 'Виж рецептата'; btn.focus(); }
      }
    });
  }

  /* ============================================================
     3 · Една рецепта — /recepti/<slug>/
     ============================================================ */
  function recipe(C) {
    var slug = document.body.dataset.slug || '';
    var items = (C.recipes.items || []).filter(function (r) { return r.on !== false; });
    var r = items.filter(function (x) { return x.slug === slug; })[0];
    var root = $('#recipeRoot');
    if (!root) return;

    if (!r) {
      root.innerHTML = '<p class="rc-missing">Тази рецепта вече я няма. ' +
        '<a href="../">Виж всички рецепти →</a></p>';
      return;
    }

    var meta = ['time', 'level', 'portions'].map(function (k) {
      return r[k] ? '<li>' + esc(r[k]) + '</li>' : '';
    }).join('');

    root.innerHTML =
      '<div class="rp-head">' +
        '<a class="rp-back" href="../">← Всички рецепти</a>' +
        (r.cut ? '<span class="recipe-cut">' + esc(r.cut) + '</span>' : '') +
        '<h1>' + esc(r.name) + '</h1>' +
        '<p class="rp-lead">' + esc(r.text || '') + '</p>' +
        '<ul class="recipe-meta">' + meta + '</ul>' +
      '</div>' +
      (r.image ? '<figure class="rp-img"><img src="' + attr(r.image) + '" alt="' + attr(r.name) +
        '" width="1200" height="800" fetchpriority="high" decoding="async"></figure>' : '') +
      '<div class="rp-body">' + recipeBody(r) + '</div>' +
      (r.cut ? '<div class="rp-cta">' +
        '<div><b>Трябва ти ' + esc(r.cut) + '</b><span>Режем го както кажеш и те чака готово.</span></div>' +
        '<div class="rp-cta-btns">' +
          '<button class="btn btn-red" type="button" data-add data-name="' + attr(r.cut) +
            '" data-unit="/ кг">Добави в поръчката</button>' +
          '<a class="btn btn-ghost" href="' + attr(TERA.layout.tel()) + '">Обади се</a>' +
        '</div></div>' : '');

    /* други рецепти */
    var more = items.filter(function (x) { return x.slug !== slug; }).slice(0, 3);
    var moreBox = $('#recipeMore');
    if (moreBox && more.length) {
      moreBox.innerHTML = more.map(function (x) {
        return '<a class="rp-more-card" href="' + attr(x.slug ? '../' + x.slug + '/' : '../') + '">' +
          (x.image ? '<img src="' + attr(x.image) + '" alt="" width="400" height="300" loading="lazy" decoding="async">' : '') +
          '<span><b>' + esc(x.name) + '</b><em>' + esc(x.time || '') + '</em></span>' +
        '</a>';
      }).join('');
    } else if (moreBox) {
      moreBox.closest('section').hidden = true;
    }
  }

  /* ============================================================
     4 · Разфасовки — /razfasovki/
     ============================================================ */
  function razfasovki(C) {
    var root = $('#cutsRoot');
    if (!root) return;

    var groups = (C.cuts.groups || []).filter(function (g) {
      return (C.cuts[g.key] || []).length;
    });

    /* бърза навигация между животните */
    var tabs = $('#cutsTabs');
    if (tabs) tabs.innerHTML = groups.map(function (g, i) {
      return '<a class="chip' + (i === 0 ? ' active' : '') + '" href="#cut-' + attr(g.key) + '">' +
             esc(g.label) + '</a>';
    }).join('');

    root.innerHTML = groups.map(function (g) {
      var list = (C.cuts[g.key] || []).map(function (c) {
        return '<article class="cutc" data-rv>' +
          '<div class="cutc-top">' +
            '<h3>' + esc(c.name) + '</h3>' +
            (c.eur
              ? '<span class="cutc-price"><b>' + esc(c.eur) + ' €</b><small>' + TERA.toLv(c.eur) + ' лв. / кг</small></span>'
              : '<span class="cutc-price"><b>по договаряне</b></span>') +
          '</div>' +
          '<div class="cutc-tags">' +
            (c.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') +
          '</div>' +
          '<p>' + esc(c.desc || '') + '</p>' +
          '<button class="cutc-add" type="button" data-add data-name="' + attr(c.name) +
            '" data-eur="' + attr(c.eur || '') + '" data-unit="/ кг">Добави в поръчката</button>' +
        '</article>';
      }).join('');

      return '<section class="cutg" id="cut-' + attr(g.key) + '">' +
        '<div class="cutg-head" data-rv>' +
          '<h2>' + esc(g.label) + '</h2>' +
          '<p>' + esc(g.note || '') + '</p>' +
        '</div>' +
        '<div class="cutg-grid">' + list + '</div>' +
      '</section>';
    }).join('');

    /* активният таб следва скрола */
    if (tabs && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          $$('.chip', tabs).forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
          });
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      $$('.cutg', root).forEach(function (s) { io.observe(s); });
    }
  }

  /* ============================================================
     5 · За нас — /za-nas/
     ============================================================ */
  function about(C) {
    var A = C.about || {};
    var P = A.page || {};

    set('#abKicker', P.kicker);
    set('#abTitle', P.title);
    set('#abLead', P.lead);

    var img = $('#abImg');
    if (img && P.image) { img.src = P.image; img.alt = P.alt || ''; }

    set('#abQuote', P.quote);
    set('#abQuoteBy', P.quoteBy);

    var story = $('#abStory');
    if (story) story.innerHTML = (A.story || []).map(function (s, i) {
      return '<article class="ab-block" data-rv data-d="' + (i % 3) + '">' +
        '<h3>' + esc(s.h) + '</h3><p>' + esc(s.p) + '</p></article>';
    }).join('');

    var tl = $('#abTimeline');
    if (tl) tl.innerHTML = (A.timeline || []).map(function (t, i) {
      return '<li class="ab-step" data-rv data-d="' + (i % 3) + '">' +
        '<span class="ab-year">' + esc(t.year) + '</span>' +
        '<div><h3>' + esc(t.h) + '</h3><p>' + esc(t.p) + '</p></div></li>';
    }).join('');

    var vals = $('#abValues');
    if (vals) vals.innerHTML = (A.values || []).map(function (v, i) {
      return '<article class="ab-value" data-rv data-d="' + (i % 3) + '">' +
        '<h3>' + esc(v.h) + '</h3><p>' + esc(v.p) + '</p></article>';
    }).join('');

    var farms = $('#abFarms');
    if (farms) farms.innerHTML = (A.farms || []).map(function (f, i) {
      return '<article class="ab-farm" data-rv data-d="' + (i % 3) + '">' +
        '<span class="ab-farm-kind">' + esc(f.kind) + '</span>' +
        '<h3>' + esc(f.name) + '</h3><p>' + esc(f.p) + '</p></article>';
    }).join('');
    set('#abFarmsNote', A.farmsNote);

    var counters = $('#abCounters');
    if (counters) counters.innerHTML = (A.counters || []).map(function (c) {
      return '<div class="counter"><b>' + esc(c.value) + '+</b><span>' + esc(c.label) + '</span></div>';
    }).join('');
  }

  /* ============================================================
     6 · Контакти — /kontakti/
     ============================================================ */
  function kontakti(C) {
    var K = C.contacts || {};
    set('#koLead', K.pageLead);

    var list = $('#koList');
    if (list) {
      var I = TERA.layout.icons;
      var rows = [
        { ico: I.phone, k: 'Телефон',   v: C.contact.phoneLabel, href: TERA.layout.tel() },
        { ico: I.viber, k: 'Viber',     v: 'Пиши ни за поръчка', href: TERA.layout.viber() },
        { ico: I.insta, k: 'Instagram', v: '@' + C.contact.instagram, href: C.contact.instagramUrl, blank: true },
        { ico: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
          k: 'Адрес', v: C.contact.city + ', ' + C.contact.street, href: TERA.layout.mapUrl(), blank: true }
      ];
      list.innerHTML = rows.map(function (r) {
        return '<a class="con-item" href="' + attr(r.href) + '"' +
          (r.blank ? ' target="_blank" rel="noopener"' : '') + '>' +
          '<span class="con-ico">' + r.ico + '</span>' +
          '<span class="con-body"><b>' + esc(r.k) + '</b><em>' + esc(r.v) + '</em></span>' +
          '<span class="con-go" aria-hidden="true">→</span></a>';
      }).join('');
    }

    var hours = $('#koHours');
    if (hours) hours.innerHTML =
      '<div class="hours-head"><span>Работно време</span><span>' + esc(C.contact.city) + '</span></div>' +
      (C.hours.rows || []).map(function (r) {
        return '<div data-day="' + attr(r.spec) + '"><span>' + esc(r.label) + '</span>' +
          (r.closed ? '<span class="closed">Почивен ден</span>'
                    : '<span>' + esc(r.open) + ' – ' + esc(r.close) + '</span>') + '</div>';
      }).join('');
    set('#koHolidayNote', K.holidayNote);

    var dir = $('#koDirections');
    if (dir) dir.innerHTML = (K.directions || []).map(function (d, i) {
      return '<article class="ko-card" data-rv data-d="' + (i % 3) + '">' +
        '<h3>' + esc(d.h) + '</h3><p>' + esc(d.p) + '</p></article>';
    }).join('');
    set('#koDirectionsTitle', K.directionsTitle);

    var best = $('#koBest');
    if (best) best.innerHTML = (K.bestTime || []).map(function (b, i) {
      return '<li class="ko-time" data-rv data-d="' + (i % 3) + '">' +
        '<b>' + esc(b.h) + '</b><span>' + esc(b.p) + '</span></li>';
    }).join('');
    set('#koBestTitle', K.bestTimeTitle);

    var frame = $('#koMap');
    if (frame) frame.dataset.consentSrc =
      'https://www.google.com/maps?q=' + encodeURIComponent(C.contact.mapQuery || '') + '&output=embed';
    var mapLink = $('#koMapLink');
    if (mapLink) mapLink.href = TERA.layout.mapUrl();
  }

  /* ============================================================
     7 · Правни страници — /usloviya/, /poveritelnost/, /biskvitki/
     ============================================================ */
  function legal(C) {
    var doc = document.body.dataset.doc || 'terms';
    var L = C.legal || {};
    var D = L[doc];
    var root = $('#legalRoot');
    if (!D || !root) return;

    var co = L.company || {};
    var fill = function (s) {
      return String(s)
        .replace(/\{legalName\}/g, co.legalName || C.meta.siteName)
        .replace(/\{eik\}/g, co.eik || '—')
        .replace(/\{seat\}/g, co.seat || (C.contact.city + ', ' + C.contact.street))
        .replace(/\{phone\}/g, C.contact.phoneLabel || '');
    };

    set('#legalTitle', D.title);
    set('#legalLead', D.lead);
    set('#legalUpdated', (L.updatedLabel || 'Последна редакция') + ': ' + (L.updated || ''));

    root.innerHTML = (D.blocks || []).map(function (b, i) {
      return '<section class="lg-block" data-rv data-d="' + (i % 3) + '">' +
        '<h2>' + esc(b.h) + '</h2>' +
        (b.p || []).map(function (p) { return '<p>' + esc(fill(p)) + '</p>'; }).join('') +
      '</section>';
    }).join('');

    /* съдържание отстрани */
    var toc = $('#legalToc');
    if (toc) toc.innerHTML = (D.blocks || []).map(function (b, i) {
      return '<li><a href="#lg-' + i + '">' + esc(b.h) + '</a></li>';
    }).join('');
    $$('.lg-block', root).forEach(function (s, i) { s.id = 'lg-' + i; });

    if (L.disclaimer) set('#legalNote', L.disclaimer);

    /* бутонът за смяна на избора за бисквитки */
    var reset = $('#cookieReset');
    if (reset) {
      if (doc === 'cookies' && L.cookies.resetLabel) reset.textContent = L.cookies.resetLabel;
      reset.hidden = doc !== 'cookies';
      reset.addEventListener('click', function () {
        try { localStorage.removeItem('tera_cookie'); } catch (e) {}
        TERA.layout.applyConsent();
        var bar = $('#cookieBar');
        if (bar) bar.classList.add('show');
      });
    }
  }

  TERA.pages = {
    /* ключът е data-page на <body> — за страниците съвпада с папката */
    tsenorazpis: prices,
    recepti: recepti,
    recipe: recipe,
    razfasovki: razfasovki,
    'za-nas': about,
    kontakti: kontakti,
    legal: legal
  };
})();
