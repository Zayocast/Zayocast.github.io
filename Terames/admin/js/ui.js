/* ============================================================
   TERA.MES admin — компоненти
   Всяко поле носи data-path; един делегиран слушател записва
   стойността в TERA.store. Изгледите само описват полетата.
   ============================================================ */
window.TERA = window.TERA || {};

(function () {
  'use strict';

  var store = TERA.store;
  var icon = TERA.icon;
  var UI = {};

  /* ---------- екраниране ---------- */
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function attr(s) { return esc(s).replace(/"/g, '&quot;'); }
  UI.esc = esc;
  UI.attr = attr;

  /* ---------- отворени елементи в повторителите ---------- */
  var openState = {};
  function openSet(path) {
    if (!openState[path]) openState[path] = {};
    return openState[path];
  }

  /* ============================================================
     Заглавие на страница
     ============================================================ */
  UI.page = function (o) {
    return '<div class="phead">' +
      '<div class="phead-txt">' +
        (o.eyebrow ? '<p class="eyebrow">' + esc(o.eyebrow) + '</p>' : '') +
        '<h1>' + esc(o.title) + '</h1>' +
        (o.desc ? '<p>' + esc(o.desc) + '</p>' : '') +
      '</div>' +
      (o.actions ? '<div class="phead-actions">' + o.actions + '</div>' : '') +
    '</div>';
  };

  /* ============================================================
     Карта
     ============================================================ */
  UI.card = function (o) {
    var head = '';
    if (o.title || o.actions) {
      head = '<div class="card-head">' +
        '<div class="card-head-txt">' +
          (o.title ? '<h2>' + esc(o.title) + '</h2>' : '') +
          (o.desc ? '<p>' + esc(o.desc) + '</p>' : '') +
        '</div>' +
        (o.actions ? '<div class="card-head-act">' + o.actions + '</div>' : '') +
      '</div>';
    }
    return '<section class="card">' + head +
      '<div class="card-body' + (o.tight ? ' tight' : '') + '">' + (o.body || '') + '</div>' +
      (o.foot ? '<div class="card-foot">' + o.foot + '</div>' : '') +
    '</section>';
  };

  /* ============================================================
     Поле
     spec: { k, label, type, hint, ph, opts, w, rows, sub }
     ============================================================ */
  UI.field = function (spec, base) {
    var path = base ? base + '.' + spec.k : spec.k;
    var v = store.get(path);
    var t = spec.type || 'text';
    var cls = spec.w === 'full' ? ' class="full"' : '';
    var lbl = spec.label ? '<label for="f_' + attr(path) + '">' + esc(spec.label) +
      (spec.req ? ' <span class="req">*</span>' : '') + '</label>' : '';
    var hint = spec.hint ? '<span class="hint">' + esc(spec.hint) + '</span>' : '';
    var id = ' id="f_' + attr(path) + '"';
    var dp = ' data-path="' + attr(path) + '"';
    var body;

    switch (t) {

      case 'textarea':
        body = '<textarea class="inp"' + id + dp +
          ' rows="' + (spec.rows || 4) + '"' +
          ' placeholder="' + attr(spec.ph || '') + '">' + esc(v) + '</textarea>';
        break;

      case 'lines':
        body = '<textarea class="inp mono-inp"' + id + ' data-lines="' + attr(path) + '"' +
          ' rows="' + (spec.rows || 4) + '"' +
          ' placeholder="' + attr(spec.ph || 'По един ред за всеки запис') + '">' +
          esc((v || []).join('\n')) + '</textarea>';
        break;

      case 'select':
        var opts = (spec.opts || []).map(function (o) {
          var val = (typeof o === 'string') ? o : o.v;
          var lab = (typeof o === 'string') ? o : o.l;
          return '<option value="' + attr(val) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(lab) + '</option>';
        }).join('');
        body = '<select class="inp"' + id + dp + '>' + opts + '</select>';
        break;

      case 'switch':
        return '<div class="field"' + (spec.w === 'full' ? ' style="grid-column:1/-1"' : '') + '>' +
          '<label class="switch">' +
            '<input type="checkbox"' + id + dp + ' data-bool' + (v ? ' checked' : '') + '>' +
            '<span class="track"></span>' +
            '<span class="lbl">' + esc(spec.label) +
              (spec.sub ? '<small>' + esc(spec.sub) + '</small>' : '') +
            '</span>' +
          '</label>' + hint + '</div>';

      case 'price':
        body = '<div class="price-field">' +
            '<input class="inp"' + id + dp + ' data-price inputmode="decimal" autocomplete="off"' +
            ' placeholder="' + attr(spec.ph || '0,00') + '" value="' + attr(v) + '">' +
            '<span class="cur">' + (spec.cur || '€') + '</span>' +
          '</div>' +
          '<span class="lv-echo">' + lvEcho(v) + '</span>';
        break;

      case 'image':
        body = imgField(path, v);
        break;

      case 'tags':
        body = tagField(path, v || []);
        break;

      case 'color':
        body = '<div class="color-field">' +
            '<input type="color"' + dp + ' data-sync="' + attr(path) + '" value="' + attr(v || '#000000') + '">' +
            '<input class="inp mono-inp"' + id + dp + ' data-sync="' + attr(path) + '" value="' + attr(v) + '">' +
          '</div>';
        break;

      case 'number':
        body = '<input type="number" class="inp"' + id + dp +
          ' value="' + attr(v) + '" min="' + (spec.min !== undefined ? spec.min : 0) + '"' +
          (spec.max !== undefined ? ' max="' + spec.max + '"' : '') +
          (spec.step ? ' step="' + spec.step + '"' : '') + '>';
        break;

      default:
        body = '<input type="' + (t === 'text' ? 'text' : t) + '" class="inp' +
          (spec.mono ? ' mono-inp' : '') + '"' + id + dp +
          ' value="' + attr(v) + '" placeholder="' + attr(spec.ph || '') + '"' +
          (spec.auto ? ' autocomplete="' + spec.auto + '"' : ' autocomplete="off"') + '>';
    }

    return '<div class="field"' + cls + '>' + lbl + body + hint + '</div>';
  };

  function lvEcho(v) {
    var n = TERA.toNum(v);
    if (!n) return 'Въведи цена в евро';
    return '≈ <b>' + TERA.toLv(v) + '</b> лв. · курс 1 € = 1,95583 лв.';
  }

  function imgField(path, v) {
    return '<div class="img-field" data-img="' + attr(path) + '">' +
      '<span class="img-thumb">' +
        (v ? '<img src="' + attr(v) + '" alt="" loading="lazy">' : icon('imageOff')) +
      '</span>' +
      '<span class="stack">' +
        '<input class="inp mono-inp" data-path="' + attr(path) + '" data-img-url value="' + attr(v) + '" placeholder="Адрес на снимката">' +
        '<span class="row">' +
          '<button type="button" class="abtn abtn-sm" data-act="img-pick" data-path="' + attr(path) + '">' + icon('folder') + 'Избери</button>' +
          (v ? '<button type="button" class="abtn abtn-sm abtn-danger" data-act="img-clear" data-path="' + attr(path) + '">' + icon('x') + 'Премахни</button>' : '') +
        '</span>' +
      '</span>' +
    '</div>';
  }

  function tagField(path, list) {
    return '<div class="tagbox" data-tags="' + attr(path) + '">' +
      list.map(function (t, i) {
        return '<span class="tag-chip">' + esc(t) +
          '<button type="button" data-act="tag-del" data-path="' + attr(path) + '" data-i="' + i + '" aria-label="Премахни ' + attr(t) + '">' + icon('x') + '</button>' +
        '</span>';
      }).join('') +
      '<input type="text" data-tag-add="' + attr(path) + '" placeholder="Добави и Enter" aria-label="Нов етикет">' +
    '</div>';
  }

  /* ============================================================
     Група полета
     ============================================================ */
  UI.fields = function (specs, base, cols) {
    var cls = cols === 3 ? 'grid-3' : cols === 1 ? 'stack' : 'grid';
    return '<div class="' + cls + '">' + specs.map(function (s) { return UI.field(s, base); }).join('') + '</div>';
  };

  /* ============================================================
     Повторител
     o: { path, specs, title, val, addLabel, newItem, cols, toggleKey, noSort }
     ============================================================ */
  UI.rep = function (o) {
    var list = store.get(o.path) || [];
    var open = openSet(o.path);

    var items = list.map(function (it, i) {
      var isOpen = !!open[i];
      var title = o.title ? o.title(it, i) : (it.name || it.label || it.q || ('Елемент ' + (i + 1)));
      var val = o.val ? o.val(it, i) : '';
      var off = o.toggleKey && it[o.toggleKey] === false;

      return '<div class="rep-item' + (isOpen ? ' open' : '') + '" data-sort-item data-i="' + i + '"' +
        (o.attrs ? ' ' + o.attrs(it, i) : '') + '>' +
        '<div class="rep-bar" data-act="rep-open" data-path="' + attr(o.path) + '" data-i="' + i + '">' +
          (o.noSort ? '' : '<span class="rep-handle" title="Плъзни за подредба" aria-hidden="true">' + icon('grip') + '</span>') +
          '<span class="rep-no">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="rep-title">' +
            '<b' + (off ? ' style="opacity:.45;text-decoration:line-through"' : '') + '>' + esc(title) + '</b>' +
            '<i class="leader"></i>' +
            (val ? '<span class="val">' + esc(val) + '</span>' : '') +
          '</span>' +
          '<span class="rep-tools">' +
            '<button type="button" class="rep-tool" data-act="rep-up" data-path="' + attr(o.path) + '" data-i="' + i + '" aria-label="Премести нагоре">' + icon('up') + '</button>' +
            '<button type="button" class="rep-tool" data-act="rep-down" data-path="' + attr(o.path) + '" data-i="' + i + '" aria-label="Премести надолу">' + icon('down') + '</button>' +
            '<button type="button" class="rep-tool" data-act="rep-dup" data-path="' + attr(o.path) + '" data-i="' + i + '" aria-label="Дублирай">' + icon('copy') + '</button>' +
            '<button type="button" class="rep-tool del" data-act="rep-del" data-path="' + attr(o.path) + '" data-i="' + i + '" aria-label="Изтрий">' + icon('trash') + '</button>' +
            '<span class="rep-tool rep-chev" aria-hidden="true">' + icon('chevron') + '</span>' +
          '</span>' +
        '</div>' +
        '<div class="rep-body">' +
          (isOpen ? UI.fields(o.specs, o.path + '.' + i, o.cols) : '') +
          (isOpen && o.extra ? o.extra(it, i, o.path + '.' + i) : '') +
        '</div>' +
      '</div>';
    }).join('');

    var empty = '<div class="empty">' + icon('inbox') +
      '<b>Още няма нищо тук</b><p>Добави първия запис с бутона отдолу — ще се появи на сайта веднага след запис.</p></div>';

    return '<div class="rep" data-sort="' + attr(o.path) + '">' + (list.length ? items : empty) + '</div>' +
      '<button type="button" class="rep-add" style="margin-top:.7rem" data-act="rep-add" data-path="' + attr(o.path) + '">' +
        icon('plus') + esc(o.addLabel || 'Добави') +
      '</button>';
  };

  /** Регистър със заготовки за нови елементи по път.
      Вложените списъци се записват с # вместо номер:
      'sets.items.#.rows' важи за всеки сет. */
  UI.blanks = {};
  UI.blankFor = function (path) {
    var b = UI.blanks[path];
    if (b === undefined) b = UI.blanks[path.replace(/\.\d+(?=\.)/g, '.#')];
    return b;
  };

  /* ============================================================
     Известия
     ============================================================ */
  UI.toast = function (msg, kind) {
    var box = document.getElementById('toasts');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || 'ok');
    t.innerHTML = icon(kind === 'err' ? 'alert' : 'check') + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { t.remove(); }, 220);
    }, 2600);
  };

  /* ============================================================
     Модал
     ============================================================ */
  var modal = null, modalResolve = null;

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal';
    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) UI.closeModal(null);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) UI.closeModal(null);
    });
    return modal;
  }

  UI.openModal = function (o) {
    var m = ensureModal();
    m.innerHTML = '<div class="modal-box' + (o.small ? ' sm' : '') + '" role="dialog" aria-modal="true" aria-label="' + attr(o.title) + '">' +
      '<div class="modal-head"><h3>' + esc(o.title) + '</h3>' +
        '<button type="button" class="icon-btn" data-act="modal-x" aria-label="Затвори">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' + o.body + '</div>' +
      (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '') +
    '</div>';
    requestAnimationFrame(function () { m.classList.add('open'); });
    var first = m.querySelector('input,button.abtn-primary,button');
    if (first) setTimeout(function () { first.focus(); }, 60);
    return new Promise(function (res) { modalResolve = res; });
  };

  UI.closeModal = function (value) {
    if (!modal) return;
    modal.classList.remove('open');
    if (modalResolve) { modalResolve(value); modalResolve = null; }
  };

  UI.confirm = function (o) {
    return UI.openModal({
      title: o.title || 'Сигурен ли си?',
      small: true,
      body: '<p style="font-size:.93rem;color:var(--ink-2);line-height:1.6">' + esc(o.text) + '</p>',
      foot: '<button type="button" class="abtn" data-act="modal-x">Откажи</button>' +
            '<button type="button" class="abtn ' + (o.danger ? 'abtn-primary' : 'abtn-primary') + '" data-act="modal-ok">' +
            esc(o.ok || 'Да, продължи') + '</button>'
    });
  };

  /* ---------- избор на снимка ---------- */
  UI.pickImage = function (current) {
    var media = store.get('media') || [];
    var grid = media.map(function (m, i) {
      return '<button type="button" class="media-tile' + (m.url === current ? ' sel' : '') + '" data-pick="' + attr(m.url) + '">' +
        '<img src="' + attr(m.url) + '" alt="' + attr(m.name) + '" loading="lazy">' +
        '<span class="mark">' + icon('check') + '</span>' +
        '<span class="cap">' + esc(m.name) + '</span>' +
      '</button>';
    }).join('');

    return UI.openModal({
      title: 'Избери снимка',
      body:
        '<div class="dropzone" data-drop style="margin-bottom:1rem">' + icon('upload') +
          '<b>Пусни снимка тук</b><span>или натисни, за да избереш файл · JPG, PNG, WebP</span>' +
          '<input type="file" accept="image/*" hidden data-file multiple>' +
        '</div>' +
        '<div class="media-grid">' + grid + '</div>' +
        '<div class="sep"></div>' +
        '<div class="field"><label>Или постави адрес на снимка</label>' +
          '<input class="inp mono-inp" data-url-in placeholder="https://..." value="' + attr(current) + '"></div>',
      foot: '<button type="button" class="abtn" data-act="modal-x">Откажи</button>' +
            '<button type="button" class="abtn abtn-primary" data-act="url-ok">Използвай адреса</button>'
    });
  };

  /* ============================================================
     Табове
     ============================================================ */
  UI.tabs = function (list, active) {
    return '<div class="tabs" role="tablist">' + list.map(function (t) {
      return '<button type="button" class="tab' + (t.id === active ? ' on' : '') + '" role="tab" ' +
        'aria-selected="' + (t.id === active) + '" data-tab="' + attr(t.id) + '">' + esc(t.label) + '</button>';
    }).join('') + '</div>';
  };

  /* ============================================================
     Пренарисуване
     ============================================================ */
  UI.rerender = function () {
    var y = window.scrollY;
    TERA.router.render();
    window.scrollTo(0, y);
  };

  /* ============================================================
     Делегирани събития
     ============================================================ */

  /* --- писане в модела --- */
  document.addEventListener('input', function (e) {
    var el = e.target;

    if (el.matches('[data-lines]')) {
      var lines = el.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      store.set(el.dataset.lines, lines);
      return;
    }
    if (el.matches('[data-sync]')) {
      var p = el.dataset.sync;
      store.set(p, el.value);
      document.querySelectorAll('[data-sync="' + p + '"]').forEach(function (o) {
        if (o !== el) o.value = el.value;
      });
      return;
    }
    if (!el.matches('[data-path]')) return;

    if (el.hasAttribute('data-bool')) { store.set(el.dataset.path, el.checked); return; }
    store.set(el.dataset.path, el.value);

    if (el.hasAttribute('data-price')) {
      var echo = el.closest('.field').querySelector('.lv-echo');
      if (echo) echo.innerHTML = lvEcho(el.value);
    }
    if (el.hasAttribute('data-img-url')) {
      var thumb = el.closest('.img-field').querySelector('.img-thumb');
      thumb.innerHTML = el.value ? '<img src="' + attr(el.value) + '" alt="">' : icon('imageOff');
    }
    /* живо обновяване на заглавието в реда на повторителя */
    var bar = el.closest('.rep-item');
    if (bar && (el.dataset.path || '').match(/\.(name|label|title|q)$/)) {
      var b = bar.querySelector('.rep-title > b');
      if (b) b.textContent = el.value || '(без име)';
    }
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.matches('[data-bool]')) {
      store.set(el.dataset.path, el.checked);
      var row = el.closest('.rep-item');
      if (row) {
        var b = row.querySelector('.rep-title > b');
        if (b) b.style.cssText = el.checked ? '' : 'opacity:.45;text-decoration:line-through';
      }
    }
    /* нормализиране на цената при напускане на полето */
    if (el.matches('[data-price]') && el.value.trim()) {
      el.value = TERA.fmt(TERA.toNum(el.value));
      store.set(el.dataset.path, el.value);
      var echo = el.closest('.field').querySelector('.lv-echo');
      if (echo) echo.innerHTML = lvEcho(el.value);
    }
  });

  /* --- етикети --- */
  document.addEventListener('keydown', function (e) {
    var el = e.target;
    if (!el.matches('[data-tag-add]')) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      var v = el.value.trim();
      if (!v) return;
      var p = el.dataset.tagAdd;
      var arr = store.get(p) || [];
      arr.push(v);
      store.set(p, arr);
      store.touch();
      var box = el.closest('.tagbox');
      box.outerHTML = tagField(p, arr);
      var again = document.querySelector('[data-tag-add="' + p.replace(/"/g, '\\"') + '"]');
      if (again) again.focus();
    } else if (e.key === 'Backspace' && !el.value) {
      var pp = el.dataset.tagAdd;
      var a2 = store.get(pp) || [];
      if (!a2.length) return;
      a2.pop();
      store.set(pp, a2);
      store.touch();
      el.closest('.tagbox').outerHTML = tagField(pp, a2);
      var f = document.querySelector('[data-tag-add="' + pp.replace(/"/g, '\\"') + '"]');
      if (f) f.focus();
    }
  });

  /* --- действия --- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.dataset.act;
    var path = btn.dataset.path;
    var i = +btn.dataset.i;

    switch (act) {

      case 'rep-open': {
        if (e.target.closest('.rep-tool') || e.target.closest('.rep-handle')) return;
        var st = openSet(path);
        st[i] = !st[i];
        UI.rerender();
        break;
      }

      case 'rep-add': {
        e.preventDefault();
        var blank = UI.blankFor(path);
        var item = blank ? store.clone(typeof blank === 'function' ? blank() : blank) : { name: '' };
        var idx = store.push(path, item);
        openSet(path)[idx] = true;
        UI.rerender();
        UI.toast('Добавен нов запис — попълни го и запази');
        break;
      }

      case 'rep-del': {
        e.preventDefault();
        e.stopPropagation();
        var arr = store.get(path);
        var nm = arr[i].name || arr[i].label || arr[i].q || 'записа';
        UI.confirm({
          title: 'Изтриване',
          text: 'Сигурен ли си, че искаш да изтриеш „' + nm + '“? Действието се прилага след запис на промените.',
          ok: 'Изтрий'
        }).then(function (ok) {
          if (!ok) return;
          store.remove(path, i);
          shiftOpen(path, i, -1);
          UI.rerender();
          UI.toast('Записът е изтрит');
        });
        break;
      }

      case 'rep-dup': {
        e.preventDefault(); e.stopPropagation();
        store.duplicate(path, i);
        shiftOpen(path, i + 1, 1);
        openSet(path)[i + 1] = true;
        UI.rerender();
        UI.toast('Записът е дублиран');
        break;
      }

      case 'rep-up':
      case 'rep-down': {
        e.preventDefault(); e.stopPropagation();
        var to = act === 'rep-up' ? i - 1 : i + 1;
        if (store.move(path, i, to)) {
          var s = openSet(path), tmp = s[i];
          s[i] = s[to]; s[to] = tmp;
          UI.rerender();
        }
        break;
      }

      case 'img-pick': {
        e.preventDefault();
        UI.pickImage(store.get(path)).then(function (url) {
          if (!url) return;
          store.set(path, url);
          UI.rerender();
          UI.toast('Снимката е сменена');
        });
        break;
      }

      case 'img-clear': {
        e.preventDefault();
        store.set(path, '');
        UI.rerender();
        break;
      }

      case 'tag-del': {
        e.preventDefault();
        var t = store.get(path) || [];
        t.splice(i, 1);
        store.set(path, t);
        store.touch();
        btn.closest('.tagbox').outerHTML = tagField(path, t);
        break;
      }

      case 'modal-x': UI.closeModal(null); break;
      case 'modal-ok': UI.closeModal(true); break;

      case 'url-ok': {
        var inp = document.querySelector('[data-url-in]');
        UI.closeModal(inp ? inp.value.trim() : null);
        break;
      }
    }
  });

  function shiftOpen(path, from, dir) {
    var s = openSet(path), next = {};
    Object.keys(s).forEach(function (k) {
      var n = +k;
      if (dir < 0 && n === from) return;
      next[n >= from ? n + dir : n] = s[k];
    });
    openState[path] = next;
  }

  /* --- избор от медийната решетка --- */
  document.addEventListener('click', function (e) {
    var tile = e.target.closest('[data-pick]');
    if (tile) { UI.closeModal(tile.dataset.pick); return; }

    var dz = e.target.closest('[data-drop]');
    if (dz) { dz.querySelector('[data-file]').click(); }
  });

  document.addEventListener('change', function (e) {
    if (!e.target.matches('[data-file]')) return;
    readFiles(e.target.files);
  });

  ['dragenter', 'dragover'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var dz = e.target.closest && e.target.closest('[data-drop]');
      if (!dz) return;
      e.preventDefault();
      dz.classList.add('over');
    });
  });
  document.addEventListener('dragleave', function (e) {
    var dz = e.target.closest && e.target.closest('[data-drop]');
    if (dz) dz.classList.remove('over');
  });
  document.addEventListener('drop', function (e) {
    var dz = e.target.closest && e.target.closest('[data-drop]');
    if (!dz) return;
    e.preventDefault();
    dz.classList.remove('over');
    readFiles(e.dataTransfer.files);
  });

  /* Качването минава през слоя за данните — той свива снимката
     в браузъра и утре ще я праща на сървъра, без тук да се пипа. */
  function readFiles(files) {
    if (!files || !files.length) return;
    var imgs = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type); });
    if (!imgs.length) { UI.toast('Това не са снимки', 'err'); return; }

    UI.toast(imgs.length > 1 ? 'Обработвам ' + imgs.length + ' снимки…' : 'Обработвам снимката…');

    Promise.all(imgs.map(function (f) { return TERA.api.uploadImage(f); }))
      .then(function (saved) {
        saved.forEach(function (s) {
          store.get('media').unshift({ name: s.name, url: s.url });
        });
        store.touch();
        UI.toast(saved.length > 1 ? saved.length + ' снимки са в библиотеката' : 'Снимката е в библиотеката');
        var last = saved[saved.length - 1].url;
        if (document.querySelector('.modal.open')) UI.closeModal(last);
        else UI.rerender();
      })
      .catch(function (err) {
        UI.toast(err.message || 'Снимката не се качи', 'err');
      });
  }

  /* ============================================================
     Подредба с влачене
     ============================================================ */
  var dragEl = null, dragList = null;

  document.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('.rep-handle, .sec-handle');
    if (!h) return;
    var item = h.closest('[data-sort-item]');
    if (item) item.draggable = true;
  });

  document.addEventListener('dragstart', function (e) {
    var item = e.target.closest && e.target.closest('[data-sort-item]');
    if (!item) return;
    dragEl = item;
    dragList = item.closest('[data-sort]');
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', item.dataset.i); } catch (err) {}
  });

  document.addEventListener('dragover', function (e) {
    if (!dragEl) return;
    var over = e.target.closest && e.target.closest('[data-sort-item]');
    if (!over || over === dragEl || over.closest('[data-sort]') !== dragList) return;
    e.preventDefault();
    document.querySelectorAll('.drop-to').forEach(function (n) { n.classList.remove('drop-to'); });
    over.classList.add('drop-to');
  });

  document.addEventListener('drop', function (e) {
    if (!dragEl || !dragList) return;
    var over = e.target.closest && e.target.closest('[data-sort-item]');
    if (over && over !== dragEl && over.closest('[data-sort]') === dragList) {
      e.preventDefault();
      var from = +dragEl.dataset.i, to = +over.dataset.i;
      var path = dragList.dataset.sort;
      store.move(path, from, to);
      var s = openSet(path), moved = s[from];
      delete s[from];
      var next = {};
      Object.keys(s).forEach(function (k) {
        var n = +k;
        if (from < to) next[n > from && n <= to ? n - 1 : n] = s[k];
        else next[n >= to && n < from ? n + 1 : n] = s[k];
      });
      next[to] = moved;
      openState[path] = next;
      UI.rerender();
      UI.toast('Подредбата е сменена');
    }
    cleanupDrag();
  });

  document.addEventListener('dragend', cleanupDrag);

  function cleanupDrag() {
    if (dragEl) { dragEl.classList.remove('dragging'); dragEl.draggable = false; }
    document.querySelectorAll('.drop-to').forEach(function (n) { n.classList.remove('drop-to'); });
    dragEl = null; dragList = null;
  }

  /* --- табове --- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]');
    if (!t) return;
    TERA.router.tab = t.dataset.tab;
    UI.rerender();
  });

  TERA.UI = UI;
})();
