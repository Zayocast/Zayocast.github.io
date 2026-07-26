/* ============================================================
   TERA.MES — слой за данните
   ЕДИНСТВЕНОТО място, което знае къде живеят данните.
   Сайтът и панелът викат само тези функции и нищо повече.

   Днес: браузърът (localStorage + Canvas за снимките).
   Утре: сменяш MODE на 'server', попълваш BASE и пипаш само
   вътрешностите тук — нито един друг файл не се променя.

   Всичко връща Promise нарочно: заявките към сървър са
   асинхронни и така после няма какво да се пренаписва.
   ============================================================ */
window.TERA = window.TERA || {};

(function () {
  'use strict';

  var KEY_CONTENT = 'tera_admin';
  var KEY_HISTORY = 'tera_admin_history';
  var KEY_ORDERS  = 'tera_orders';
  var KEY_CART    = 'tera_cart';
  var HISTORY_MAX = 12;

  var api = {
    /* 'local' — всичко в браузъра · 'server' — през PHP */
    MODE: 'local',
    BASE: '',            // напр. '/terames/v2/api'
    IMG_MAX: 1600,       // до колко пиксела се свиват снимките
    IMG_QUALITY: 0.82,

    /* ---------- съдържание ---------- */

    /**
     * Готовото съдържание за показване: началното от content.js,
     * покрито с това, което е записано от панела.
     * Това вика сайтът — панелът си има свое хранилище.
     */
    content: function () {
      return api.loadContent().then(function (saved) {
        var base = JSON.parse(JSON.stringify(TERA.SEED));
        return saved ? merge(base, saved) : base;
      });
    },

    /**
     * Същото като content(), но веднага — без Promise.
     * Нужно е на шапката и футъра: те се рисуват при първия кадър и
     * не бива да чакат мрежа. При MODE 'server' връща началното
     * съдържание, а страницата се обновява после през content().
     */
    contentSync: function () {
      var base = JSON.parse(JSON.stringify(TERA.SEED));
      if (api.MODE === 'server') return base;
      var saved = readJSON(KEY_CONTENT);
      return saved ? merge(base, saved) : base;
    },

    /** Записаното съдържание или null, ако още няма нищо. */
    loadContent: function () {
      if (api.MODE === 'server') {
        return fetch(api.BASE + '/content.php')
          .then(function (r) { return r.ok ? r.json() : null; })
          .catch(function () { return null; });
      }
      return Promise.resolve(readJSON(KEY_CONTENT));
    },

    /** Записва и пази предишното състояние в историята. */
    saveContent: function (data, label) {
      if (api.MODE === 'server') {
        return fetch(api.BASE + '/content.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (r) {
          if (!r.ok) throw new Error('Сървърът отказа записа');
          return { ok: true, at: new Date().toISOString() };
        });
      }

      return new Promise(function (resolve, reject) {
        var previous = readJSON(KEY_CONTENT);
        try {
          localStorage.setItem(KEY_CONTENT, JSON.stringify(data));
        } catch (e) {
          reject(new Error('Няма място в браузъра за записа'));
          return;
        }
        if (previous) pushHistory(previous, label);
        resolve({ ok: true, at: new Date().toISOString() });
      });
    },

    /** Изтрива записаното — съдържанието се връща към TERA.SEED. */
    resetContent: function () {
      if (api.MODE === 'server') {
        return fetch(api.BASE + '/content.php?reset=1', { method: 'POST' })
          .then(function () { return { ok: true }; });
      }
      var previous = readJSON(KEY_CONTENT);
      if (previous) pushHistory(previous, 'преди връщане към началото');
      localStorage.removeItem(KEY_CONTENT);
      return Promise.resolve({ ok: true });
    },

    /* ---------- история ---------- */

    /** Последните състояния, най-новото първо. */
    loadHistory: function () {
      return Promise.resolve(readJSON(KEY_HISTORY) || []);
    },

    /** Съдържанието от даден запис в историята. */
    restoreHistory: function (id) {
      var list = readJSON(KEY_HISTORY) || [];
      var hit = list.filter(function (h) { return h.id === id; })[0];
      return hit ? Promise.resolve(hit.data) : Promise.reject(new Error('Записът го няма'));
    },

    clearHistory: function () {
      localStorage.removeItem(KEY_HISTORY);
      return Promise.resolve({ ok: true });
    },

    /* ---------- снимки ---------- */

    /**
     * Свива снимката в браузъра и я връща готова за употреба.
     * Свиването остава и при сървър — така до него стигат малки файлове.
     */
    uploadImage: function (file) {
      if (!file || !/^image\//.test(file.type)) {
        return Promise.reject(new Error('Файлът не е снимка'));
      }
      return shrink(file).then(function (small) {
        if (api.MODE === 'server') {
          var fd = new FormData();
          fd.append('image', small.blob, file.name);
          return fetch(api.BASE + '/upload.php', { method: 'POST', body: fd })
            .then(function (r) { return r.json(); });
        }
        return { name: file.name, url: small.dataUrl, w: small.w, h: small.h };
      });
    },

    /* ---------- поръчки ---------- */

    loadOrders: function () {
      if (api.MODE === 'server') {
        return fetch(api.BASE + '/orders.php').then(function (r) { return r.json(); });
      }
      return Promise.resolve(readJSON(KEY_ORDERS));
    },

    saveOrders: function (list) {
      if (api.MODE === 'server') {
        return fetch(api.BASE + '/orders.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(list)
        }).then(function () { return { ok: true }; });
      }
      writeJSON(KEY_ORDERS, list);
      return Promise.resolve({ ok: true });
    },

    /**
     * Поръчка от формата на сайта.
     * Засега само я запомня в браузъра и връща номер — истинското
     * изпращане (имейл, база) идва със сървърната част.
     */
    sendOrder: function (order) {
      if (api.MODE === 'server') {
        return fetch(api.BASE + '/order.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        }).then(function (r) { return r.json(); });
      }
      var list = readJSON(KEY_ORDERS) || [];
      var rec = {
        id: 'P-' + String(1000 + list.length + 49).slice(1),
        name: order.name, phone: order.phone, msg: order.msg,
        time: order.time || '', at: stamp(new Date()), status: 'new'
      };
      list.unshift(rec);
      writeJSON(KEY_ORDERS, list);
      return Promise.resolve({ ok: true, id: rec.id });
    },

    /* ---------- кошница на посетителя ---------- */

    loadCart: function () { return readJSON(KEY_CART) || []; },
    saveCart: function (items) { writeJSON(KEY_CART, items); }
  };

  /* ============================================================
     вътрешни помощници
     ============================================================ */

  /** Записаното покрива началното; масивите се заменят изцяло. */
  function merge(base, over) {
    Object.keys(over).forEach(function (k) {
      var v = over[k];
      if (v && typeof v === 'object' && !Array.isArray(v) &&
          base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        merge(base[k], v);
      } else {
        base[k] = v;
      }
    });
    return base;
  }

  function readJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function stamp(d) {
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function pushHistory(data, label) {
    var list = readJSON(KEY_HISTORY) || [];
    list.unshift({
      id: 'h' + Date.now().toString(36),
      at: stamp(new Date()),
      label: label || '',
      data: data
    });
    /* историята пази снимки и расте бързо — държим само последните */
    while (list.length > HISTORY_MAX) list.pop();
    /* ако мястото свърши, изхвърляме най-старите, вместо да чупим записа */
    while (list.length && !writeJSON(KEY_HISTORY, list)) list.pop();
  }

  /** Смалява снимка през Canvas — връща dataURL и blob. */
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Файлът не се прочете')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Снимката не се отвори')); };
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          var scale = Math.min(1, api.IMG_MAX / Math.max(w, h));
          w = Math.round(w * scale); h = Math.round(h * scale);

          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);

          var type = 'image/webp';
          var dataUrl = c.toDataURL(type, api.IMG_QUALITY);
          /* по-старите браузъри не дават webp — падаме на jpeg */
          if (dataUrl.indexOf('data:image/webp') !== 0) {
            type = 'image/jpeg';
            dataUrl = c.toDataURL(type, api.IMG_QUALITY);
          }

          if (c.toBlob) {
            c.toBlob(function (blob) {
              resolve({ dataUrl: dataUrl, blob: blob, w: w, h: h });
            }, type, api.IMG_QUALITY);
          } else {
            resolve({ dataUrl: dataUrl, blob: null, w: w, h: h });
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  TERA.api = api;
})();
