/* ============================================================
   TERA.MES — QR код
   Малък генератор: байтов режим, ниво на корекция M, версии 1–10.
   Стига за адрес на сайт (до ~180 знака).

   TERA.qr.matrix('https://…') → масив от редове с true/false
   TERA.qr.svg('https://…', { size, quiet, dark, light })
   ============================================================ */
window.TERA = window.TERA || {};

(function () {
  'use strict';

  /* ---------- таблици за ниво M, версии 1–10 ---------- */
  /* [брой байтове за корекция на блок, блокове1, данни1, блокове2, данни2] */
  var RS = {
    1:  [10, 1, 16, 0, 0],
    2:  [16, 1, 28, 0, 0],
    3:  [26, 1, 44, 0, 0],
    4:  [18, 2, 32, 0, 0],
    5:  [24, 2, 43, 0, 0],
    6:  [16, 4, 27, 0, 0],
    7:  [18, 4, 31, 0, 0],
    8:  [22, 2, 38, 2, 39],
    9:  [22, 3, 36, 2, 37],
    10: [26, 4, 43, 1, 44]
  };

  /* центрове на изравняващите квадратчета */
  var ALIGN = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };

  /* ---------- аритметика в GF(256), полином 0x11D ---------- */
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function mul(a, b) {
    if (!a || !b) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  /** Генераторен полином за n байта корекция: ∏(x − α^i).
      Коефициентите са от най-висока степен надолу, g[0] е винаги 1. */
  function genPoly(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(g.length + 1).fill(0);
      for (var j = 0; j < g.length; j++) {
        next[j] ^= g[j];                      // умножение по x
        next[j + 1] ^= mul(g[j], EXP[i]);     // умножение по α^i
      }
      g = next;
    }
    return g;
  }

  /** Байтовете за корекция на един блок. */
  function ecc(data, n) {
    var g = genPoly(n);
    var rem = data.concat(new Array(n).fill(0));
    for (var i = 0; i < data.length; i++) {
      var lead = rem[i];
      if (!lead) continue;
      for (var j = 0; j < g.length; j++) rem[i + j] ^= mul(g[j], lead);
    }
    return rem.slice(data.length);
  }

  /* ---------- кодиране на данните ---------- */
  function utf8(str) {
    var out = [];
    var enc = unescape(encodeURIComponent(str));
    for (var i = 0; i < enc.length; i++) out.push(enc.charCodeAt(i) & 0xFF);
    return out;
  }

  function dataCapacity(v) {
    var r = RS[v];
    return r[1] * r[2] + r[3] * r[4];
  }

  function pickVersion(len) {
    for (var v = 1; v <= 10; v++) {
      var countBits = v < 10 ? 8 : 16;
      var need = 4 + countBits + len * 8;
      if (need <= dataCapacity(v) * 8) return v;
    }
    return 0;
  }

  function encode(bytes, v) {
    var bits = [];
    var push = function (val, n) {
      for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1);
    };

    push(4, 4);                                  // байтов режим
    push(bytes.length, v < 10 ? 8 : 16);         // брой байтове
    bytes.forEach(function (b) { push(b, 8); });

    var cap = dataCapacity(v) * 8;
    push(0, Math.min(4, cap - bits.length));     // край
    while (bits.length % 8) bits.push(0);        // до цял байт

    var words = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      words.push(b);
    }
    var pad = [0xEC, 0x11], k = 0;
    while (words.length < dataCapacity(v)) words.push(pad[k++ % 2]);
    return words;
  }

  /** Разделя на блокове, смята корекцията и ги преплита. */
  function interleave(words, v) {
    var r = RS[v], ecLen = r[0];
    var blocks = [], pos = 0, i, j;

    for (i = 0; i < r[1]; i++) { blocks.push(words.slice(pos, pos + r[2])); pos += r[2]; }
    for (i = 0; i < r[3]; i++) { blocks.push(words.slice(pos, pos + r[4])); pos += r[4]; }

    var eccs = blocks.map(function (b) { return ecc(b, ecLen); });

    var out = [];
    var maxData = Math.max.apply(null, blocks.map(function (b) { return b.length; }));
    for (i = 0; i < maxData; i++) {
      for (j = 0; j < blocks.length; j++) if (i < blocks[j].length) out.push(blocks[j][i]);
    }
    for (i = 0; i < ecLen; i++) {
      for (j = 0; j < eccs.length; j++) out.push(eccs[j][i]);
    }
    return out;
  }

  /* ---------- строеж на матрицата ---------- */
  function build(v, words, mask) {
    var n = v * 4 + 17;
    var m = [], reserved = [];
    for (var i = 0; i < n; i++) {
      m.push(new Array(n).fill(false));
      reserved.push(new Array(n).fill(false));
    }

    function set(r, c, val) { m[r][c] = val; reserved[r][c] = true; }

    /* търсачки и разделители */
    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(function (p) {
      for (var r = -1; r <= 7; r++) {
        for (var c = -1; c <= 7; c++) {
          var rr = p[0] + r, cc = p[1] + c;
          if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
          var on = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                   (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                   (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          set(rr, cc, on);
        }
      }
    });

    /* изравняващи квадратчета */
    var al = ALIGN[v];
    al.forEach(function (ar) {
      al.forEach(function (ac) {
        if (reserved[ar][ac]) return;
        for (var r = -2; r <= 2; r++) {
          for (var c = -2; c <= 2; c++) {
            set(ar + r, ac + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
          }
        }
      });
    });

    /* тактови линии */
    for (var t = 8; t < n - 8; t++) {
      if (!reserved[6][t]) set(6, t, t % 2 === 0);
      if (!reserved[t][6]) set(t, 6, t % 2 === 0);
    }

    /* тъмният модул и запазените места за форматната информация */
    set(n - 8, 8, true);
    for (var f = 0; f < 9; f++) {
      if (!reserved[8][f]) reserved[8][f] = true;
      if (!reserved[f][8]) reserved[f][8] = true;
    }
    for (var g = 0; g < 8; g++) {
      reserved[8][n - 1 - g] = true;
      reserved[n - 1 - g][8] = true;
    }

    /* информация за версията (от 7 нагоре) */
    if (v >= 7) {
      var vinfo = versionBits(v);
      for (var b = 0; b < 18; b++) {
        var bit = ((vinfo >> b) & 1) === 1;
        var rr2 = Math.floor(b / 3), cc2 = b % 3;
        set(rr2, n - 11 + cc2, bit);
        set(n - 11 + cc2, rr2, bit);
      }
    }

    /* данните — на зиг-заг отдясно наляво */
    var bitIndex = 0;
    var total = words.length * 8;
    var up = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;                       // колоната с тактовата линия се прескача
      for (var step = 0; step < n; step++) {
        var row = up ? n - 1 - step : step;
        for (var s = 0; s < 2; s++) {
          var cx = col - s;
          if (reserved[row][cx]) continue;
          var val = false;
          if (bitIndex < total) {
            val = ((words[bitIndex >> 3] >> (7 - (bitIndex & 7))) & 1) === 1;
            bitIndex++;
          }
          if (maskAt(mask, row, cx)) val = !val;
          m[row][cx] = val;
        }
      }
      up = !up;
    }

    writeFormat(m, n, mask);
    return m;
  }

  function maskAt(k, i, j) {
    switch (k) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      default: return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0;
    }
  }

  /** 15-битова форматна информация: ниво M (00) + маска, с BCH и маскиране. */
  function formatBits(mask) {
    var data = (0 << 3) | mask;           // 00 = ниво M
    var rem = data << 10;
    for (var i = 14; i >= 10; i--) {
      if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
    }
    return ((data << 10) | rem) ^ 0x5412;
  }

  function versionBits(v) {
    var rem = v << 12;
    for (var i = 17; i >= 12; i--) {
      if ((rem >> i) & 1) rem ^= 0x1F25 << (i - 12);
    }
    return (v << 12) | rem;
  }

  function writeFormat(m, n, mask) {
    var f = formatBits(mask);
    for (var i = 0; i < 15; i++) {
      var bit = ((f >> i) & 1) === 1;
      /* около горната лява търсачка */
      if (i < 6)       m[8][i] = bit;
      else if (i < 8)  m[8][i + 1] = bit;
      else if (i === 8) m[7][8] = bit;
      else             m[14 - i][8] = bit;
      /* дублирано около другите две */
      if (i < 8) m[n - 1 - i][8] = bit;
      else       m[8][n - 15 + i] = bit;
    }
    m[n - 8][8] = true;
  }

  /* ---------- избор на маска ---------- */
  function penalty(m) {
    var n = m.length, score = 0, i, j, run, last;

    /* правило 1 — пет и повече еднакви подред */
    for (i = 0; i < n; i++) {
      run = 1; last = m[i][0];
      for (j = 1; j < n; j++) {
        if (m[i][j] === last) { run++; }
        else { if (run >= 5) score += 3 + (run - 5); run = 1; last = m[i][j]; }
      }
      if (run >= 5) score += 3 + (run - 5);

      run = 1; last = m[0][i];
      for (j = 1; j < n; j++) {
        if (m[j][i] === last) { run++; }
        else { if (run >= 5) score += 3 + (run - 5); run = 1; last = m[j][i]; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }

    /* правило 2 — блокчета 2×2 */
    for (i = 0; i < n - 1; i++) {
      for (j = 0; j < n - 1; j++) {
        var a = m[i][j];
        if (a === m[i][j + 1] && a === m[i + 1][j] && a === m[i + 1][j + 1]) score += 3;
      }
    }

    /* правило 3 — шарката, която прилича на търсачка */
    var p1 = [true, false, true, true, true, false, true, false, false, false, false];
    var p2 = [false, false, false, false, true, false, true, true, true, false, true];
    function has(arr, pat) {
      for (var k = 0; k + 11 <= arr.length; k++) {
        var ok = true;
        for (var q = 0; q < 11; q++) if (arr[k + q] !== pat[q]) { ok = false; break; }
        if (ok) return true;
      }
      return false;
    }
    for (i = 0; i < n; i++) {
      var row = m[i], col = [];
      for (j = 0; j < n; j++) col.push(m[j][i]);
      if (has(row, p1)) score += 40;
      if (has(row, p2)) score += 40;
      if (has(col, p1)) score += 40;
      if (has(col, p2)) score += 40;
    }

    /* правило 4 — съотношение тъмно/светло */
    var dark = 0;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) if (m[i][j]) dark++;
    var pct = dark * 100 / (n * n);
    score += Math.floor(Math.abs(pct - 50) / 5) * 10;

    return score;
  }

  /* ---------- публично ---------- */
  var qr = {
    /** Матрица от true/false, готова за рисуване. */
    matrix: function (text) {
      var bytes = utf8(String(text || ''));
      var v = pickVersion(bytes.length);
      if (!v) throw new Error('Текстът е твърде дълъг за този QR код');

      var words = interleave(encode(bytes, v), v);

      var best = null, bestScore = Infinity;
      for (var mask = 0; mask < 8; mask++) {
        var m = build(v, words, mask);
        var s = penalty(m);
        if (s < bestScore) { bestScore = s; best = m; }
      }
      return best;
    },

    /** Готов SVG низ. */
    svg: function (text, opt) {
      opt = opt || {};
      var m = qr.matrix(text);
      var n = m.length;
      var quiet = opt.quiet === undefined ? 4 : opt.quiet;
      var total = n + quiet * 2;
      var dark = opt.dark || '#221B16';
      var light = opt.light || '#FFFFFF';

      var path = '';
      for (var r = 0; r < n; r++) {
        var c = 0;
        while (c < n) {
          if (!m[r][c]) { c++; continue; }
          var start = c;
          while (c < n && m[r][c]) c++;
          path += 'M' + (start + quiet) + ' ' + (r + quiet) + 'h' + (c - start) + 'v1h-' + (c - start) + 'z';
        }
      }

      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '"' +
        (opt.size ? ' width="' + opt.size + '" height="' + opt.size + '"' : '') +
        ' shape-rendering="crispEdges" role="img" aria-label="QR код">' +
        '<rect width="' + total + '" height="' + total + '" fill="' + light + '"/>' +
        '<path d="' + path + '" fill="' + dark + '"/></svg>';
    }
  };

  TERA.qr = qr;
})();
