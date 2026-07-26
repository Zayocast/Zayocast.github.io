/* ============================================================
   TERA.MES admin — хранилище
   Държи модела в паметта и следи кое е променено.
   Съдържанието идва от ../js/content.js (TERA.SEED),
   а четенето и записът минават през ../js/api.js.
   ============================================================ */
window.TERA = window.TERA || {};

(function () {
  'use strict';

  var data = null;
  var dirty = false;
  var listeners = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /** Допълва липсващите ключове от SEED, за да не се чупи при нови полета. */
  function fill(target, seed) {
    Object.keys(seed).forEach(function (k) {
      if (target[k] === undefined) {
        target[k] = clone(seed[k]);
      } else if (seed[k] && typeof seed[k] === 'object' && !Array.isArray(seed[k])) {
        fill(target[k], seed[k]);
      }
    });
    return target;
  }

  var store = {
    /** Целият модел. */
    get data() { return data; },
    get dirty() { return dirty; },

    /** Зарежда през слоя за данните. Връща Promise. */
    load: function () {
      return TERA.api.loadContent().then(function (saved) {
        data = saved ? fill(saved, TERA.SEED) : clone(TERA.SEED);
        dirty = false;
        emit();
        return data;
      });
    },

    /** Записва през слоя за данните. Връща Promise. */
    save: function (label) {
      return TERA.api.saveContent(data, label).then(function (res) {
        dirty = false;
        emit();
        return res;
      });
    },

    /** Връща записаното състояние — отменя незаписаните промени. */
    revert: function () { return store.load(); },

    resetAll: function () {
      return TERA.api.resetContent().then(function () {
        data = clone(TERA.SEED);
        dirty = false;
        emit();
      });
    },

    /** Слага наготово съдържание (напр. от резервно копие или историята). */
    hydrate: function (next) {
      data = fill(clone(next), TERA.SEED);
      dirty = true;
      emit();
      return data;
    },

    /** store.get('products.items.3.name') */
    get: function (path) {
      return path.split('.').reduce(function (o, k) {
        return (o === undefined || o === null) ? undefined : o[k];
      }, data);
    },

    /** store.set('products.items.3.name', 'Свински врат') */
    set: function (path, value) {
      var keys = path.split('.');
      var last = keys.pop();
      var node = keys.reduce(function (o, k) {
        if (o[k] === undefined || o[k] === null) o[k] = {};
        return o[k];
      }, data);
      if (node[last] === value) return false;
      node[last] = value;
      store.touch();
      return true;
    },

    touch: function () { dirty = true; emit(); },

    /** Операции върху списък по път. */
    push: function (path, item) { var a = store.get(path); a.push(item); store.touch(); return a.length - 1; },
    remove: function (path, i)  { var a = store.get(path); a.splice(i, 1); store.touch(); },
    move: function (path, from, to) {
      var a = store.get(path);
      if (to < 0 || to >= a.length) return false;
      a.splice(to, 0, a.splice(from, 1)[0]);
      store.touch();
      return true;
    },
    duplicate: function (path, i) {
      var a = store.get(path);
      a.splice(i + 1, 0, clone(a[i]));
      store.touch();
    },

    onChange: function (fn) { listeners.push(fn); },
    clone: clone
  };

  function emit() { listeners.forEach(function (fn) { fn(dirty); }); }

  TERA.store = store;
})();
