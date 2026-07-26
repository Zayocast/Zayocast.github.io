(function(){
"use strict";

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&#]noanim/.test(location.href);
// dev: #noanim-<id> скролва до секция при зареждане (за тестове/скрийншоти)
const jump = location.hash.match(/^#noanim-(.+)$/);
if (jump){
  window.addEventListener('load', () => {
    const t = document.getElementById(jump[1]);
    if (t) t.scrollIntoView({behavior:'instant', block:'start'});
  });
}
const hasGsap = typeof gsap !== 'undefined';

/* Шапката, менюто и летящите бутони живеят в js/layout.js — оттам
   идват и слушателите за скрол и за бургера. Тук остава само това,
   което е специфично за началната страница. */

/* ---------- scrollspy ---------- */
const spyLinks = new Map();
$$('.nav-links a[href^="#"]').forEach(a => spyLinks.set(a.getAttribute('href').slice(1), a));
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    spyLinks.forEach(l => l.classList.remove('active'));
    const link = spyLinks.get(en.target.id);
    if (link) link.classList.add('active');
  });
}, {rootMargin:'-35% 0px -55% 0px'});
spyLinks.forEach((link, id) => {
  const sec = document.getElementById(id);
  if (sec) spy.observe(sec);
});

/* ---------- GSAP: hero + scroll reveals ---------- */
if (hasGsap && !reduced){
  gsap.registerPlugin(ScrollTrigger);

  // hero intro
  const tl = gsap.timeline({defaults:{ease:'power3.out'}});
  tl.from('.nav-in', {y:-40, opacity:0, duration:.5})
    .from('.hero-kicker', {y:14, opacity:0, duration:.45}, '-=.15')
    .from('.h-line > span', {yPercent:115, duration:.85, stagger:.14, ease:'power4.out'}, '-=.25')
    .from('.hero-lead', {y:16, opacity:0, duration:.5}, '-=.45')
    .from('.hero-tags li', {y:14, opacity:0, stagger:.07, duration:.45}, '-=.3')
    .from('.hero-cta-row .btn', {y:20, opacity:0, stagger:.09, duration:.45}, '-=.25')
    .from('.hero-card', {y:46, opacity:0, rotate:5, duration:.8, ease:'power3.out'}, .5)
    .from('.spin-badge', {scale:0, opacity:0, duration:.5, ease:'back.out(2.2)'}, '-=.35')
    .from('.st-fresh', {scale:0, opacity:0, duration:.45, ease:'back.out(2.2)'}, '-=.3')
    .from('.hero-meta span', {y:12, opacity:0, stagger:.07, duration:.45}, '-=.35')
    .from('.trust-item', {y:16, opacity:0, stagger:.06, duration:.45}, '-=.25')
    // фонът тръгва паралелно от 0 — добавен последен, за да не размества горните
    .from('.hero-bg img', {scale:1.18, opacity:0, duration:1.5, ease:'power2.out'}, 0);

  // лек float на стикера (само rotation — x/y остават за parallax-а)
  gsap.to('.st-fresh', {rotate:-6, duration:3.2, yoyo:true, repeat:-1, ease:'sine.inOut', delay:2.5});

  // mouse-parallax в hero (само за устройства с мишка)
  if (matchMedia('(pointer:fine)').matches){
    const heroEl = $('.hero');
    const cx = gsap.quickTo('.hero-card', 'x', {duration:.7, ease:'power3'});
    const cy = gsap.quickTo('.hero-card', 'y', {duration:.7, ease:'power3'});
    const gx = gsap.quickTo('.hero-bg img', 'x', {duration:1.1, ease:'power3'});
    const gy = gsap.quickTo('.hero-bg img', 'y', {duration:1.1, ease:'power3'});
    heroEl.addEventListener('mousemove', e => {
      const r = heroEl.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - .5;
      const ny = (e.clientY - r.top) / r.height - .5;
      cx(nx * 14); cy(ny * 11);
      gx(nx * -22); gy(ny * -16);
    });
    heroEl.addEventListener('mouseleave', () => { cx(0); cy(0); gx(0); gy(0); });
  }

  // scroll reveals
  $$('[data-rv]').forEach(el => {
    const d = +(el.dataset.d || 0);
    gsap.set(el, {y:38, opacity:0});
    ScrollTrigger.create({
      trigger: el, start:'top 88%', once:true,
      onEnter: () => gsap.to(el, {y:0, opacity:1, duration:.75, delay:d*.12, ease:'power3.out'})
    });
  });

  // counters
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    ScrollTrigger.create({
      trigger: el, start:'top 85%', once:true,
      onEnter: () => {
        const obj = {v:0};
        gsap.to(obj, {v:target, duration:1.5, ease:'power2.out',
          onUpdate: () => el.textContent = Math.round(obj.v),
          onComplete: () => el.textContent = target + '+'
        });
      }
    });
  });
} else {
  // reduced motion or no GSAP: everything visible immediately
  $$('[data-count]').forEach(el => el.textContent = el.dataset.count + '+');
}

/* ---------- съдържание ---------- */
/* Всичко под тази черта се рисува от общия модел (js/content.js,
   покрит с промените от панела). Статичните секции в HTML остават
   както са — те ще минат насам, когато дойде сървърната част. */
let C = null;

/* ---------- cuts diagram ---------- */
let cutData = {};
const info = $('#cutInfo');
const tip = $('#cutTip');

function showCut(zone){
  const d = cutData[zone.dataset.cut];
  if (!d) return;
  $$('.cuts-svg .zone.active').forEach(z => z.classList.remove('active'));
  $$('.cuts-svg [data-cut="'+zone.dataset.cut+'"]').forEach(z => z.classList.add('active'));
  const price = d.eur
    ? '<span class="price">≈ '+d.eur+' € / кг<small>'+TERA.toLv(d.eur)+' лв.</small></span>'
    : '<span class="price">по договаряне</span>';
  info.innerHTML = '<h3>'+d.name+'</h3>'
    + (d.tags||[]).map(t => '<span class="tag">'+t+'</span>').join('')
    + '<p>'+d.desc+'</p>' + price
    + '<button class="btn btn-red cut-add" type="button" data-add data-name="'+d.name+'" data-eur="'+(d.eur||'')+'" data-unit="/ кг">Добави в поръчката</button>';
  placeTip(zone, d);
  if (hasGsap && !reduced){
    gsap.fromTo(info, {scale:.97, opacity:.6}, {scale:1, opacity:1, duration:.3, ease:'power2.out'});
  }
}

/* Цената застава върху самата разфасовка — картата става четима без да
   местиш очи настрани. */
function placeTip(zone, d){
  if (!tip) return;
  const board = zone.closest('.cuts-board');
  if (!board) return;
  const zr = zone.getBoundingClientRect();
  const br = board.getBoundingClientRect();
  tip.innerHTML = '<b>'+d.name+'</b>' +
    (d.eur ? '<span>'+d.eur+' € / кг</span>' : '<span>по договаряне</span>');
  tip.style.left = ((zr.left + zr.width/2 - br.left) / br.width * 100) + '%';
  tip.style.top  = ((zr.top  + zr.height/2 - br.top) / br.height * 100) + '%';
  tip.classList.add('show');
}
function hideTip(){ if (tip) tip.classList.remove('show'); }

$$('.cuts-svg .zone').forEach(z => {
  z.addEventListener('pointerenter', () => showCut(z));
  z.addEventListener('click', () => showCut(z));
  z.addEventListener('focus', () => showCut(z));
  z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); showCut(z); } });
});
$$('.cuts-board').forEach(b => b.addEventListener('pointerleave', hideTip));

const btnPork = $('#btnPork'), btnBeef = $('#btnBeef');
const svgPork = $('#svgPork'), svgBeef = $('#svgBeef');
function switchAnimal(pork){
  // SVG елементите нямат .hidden property — задължително през атрибута
  svgPork.toggleAttribute('hidden', !pork);
  svgBeef.toggleAttribute('hidden', pork);
  btnPork.classList.toggle('active', pork); btnBeef.classList.toggle('active', !pork);
  btnPork.setAttribute('aria-pressed', pork); btnBeef.setAttribute('aria-pressed', !pork);
  hideTip();
  info.innerHTML = '<h3>'+(C ? C.cuts.emptyTitle : 'Избери разфасовка')+'</h3><p>'+(C ? C.cuts.emptyText : '')+'</p>';
  if (hasGsap && !reduced){
    gsap.fromTo(pork ? svgPork : svgBeef, {opacity:0, scale:.97}, {opacity:1, scale:1, duration:.4, ease:'power2.out'});
  }
}
btnPork.addEventListener('click', () => switchAnimal(true));
btnBeef.addEventListener('click', () => switchAnimal(false));

/* ---------- ценоразпис ---------- */
let prodSort = 'default', prodCat = 'all', prodQ = '';

function visibleProducts(){
  let list = C.products.items.filter(p => p.on !== false);
  if (prodCat !== 'all') list = list.filter(p => p.cat === prodCat);
  if (prodQ) list = list.filter(p => (p.name+' '+(p.desc||'')).toLowerCase().includes(prodQ));
  if (prodSort === 'cheap') list = list.slice().sort((a,b) => TERA.toNum(a.eur) - TERA.toNum(b.eur));
  if (prodSort === 'pricey') list = list.slice().sort((a,b) => TERA.toNum(b.eur) - TERA.toNum(a.eur));
  if (prodSort === 'name') list = list.slice().sort((a,b) => a.name.localeCompare(b.name, 'bg'));
  return list;
}

function renderProducts(){
  const list = $('#prodList');
  const rows = visibleProducts();

  if (!rows.length){
    list.innerHTML = '<p class="mrow-empty">'+C.products.noResults+'</p>';
    return;
  }

  list.innerHTML = rows.map(p =>
    '<div class="mrow'+(p.out ? ' out' : '')+'" data-cat="'+p.cat+'">'
    + '<div class="mname"><h3>'+p.name
      + (p.out ? '<i class="out-tag">'+C.products.outLabel+'</i>' : '')
      + '</h3><p>'+(p.desc||'')+'</p></div>'
    + '<span class="dots" aria-hidden="true"></span>'
    + '<div class="mprice"><b>'+p.eur+' €</b><span>'+TERA.toLv(p.eur)+' лв. / кг</span></div>'
    + (p.out ? '' : '<button class="mrow-add" type="button" data-add data-name="'+p.name+'" data-eur="'+p.eur+'" data-unit="/ кг" aria-label="Добави '+p.name+' в поръчката">+</button>')
    + '</div>'
  ).join('');

  if (hasGsap && !reduced){
    gsap.fromTo($$('.mrow'), {opacity:0, y:10}, {opacity:1, y:0, duration:.35, stagger:.02, ease:'power2.out'});
  }
}

function buildChips(){
  const box = $('#chips');
  box.innerHTML = '<button class="chip active" data-cat="all">Всички</button>'
    + C.products.categories.map(c =>
        '<button class="chip" data-cat="'+c.key+'">'+c.label+'</button>').join('');
  box.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    prodCat = chip.dataset.cat;
    renderProducts();
  });
}

function bindProdTools(){
  const q = $('#prodSearch'), s = $('#prodSort');
  if (q) q.addEventListener('input', () => { prodQ = q.value.trim().toLowerCase(); renderProducts(); });
  if (s) s.addEventListener('change', () => { prodSort = s.value; renderProducts(); });
}

/* ---------- топла кухня ---------- */
function renderKitchen(){
  const grid = $('#dishGrid');
  if (!grid) return;
  const items = C.kitchen.items.filter(d => d.on !== false);
  grid.innerHTML = items.map((d, i) =>
    '<article class="dish'+(d.out ? ' out' : '')+'" data-rv'+(i%3 ? ' data-d="'+(i%3)+'"' : '')+'>'
    + '<h3>'+d.name+(d.out ? '<i class="out-tag">'+C.products.outLabel+'</i>' : '')+'</h3>'
    + '<p>'+(d.desc||'')+'</p>'
    /* цената и „+“ седят в един ред — така бутонът не увисва върху картата */
    + '<div class="dish-foot">'
      + '<span class="dprice">'+d.eur+' € <em>'+d.unit+'</em><small>'+TERA.toLv(d.eur)+' лв.</small></span>'
      + (d.out ? '' : '<button class="dish-add" type="button" data-add data-name="'+d.name+'" data-eur="'+d.eur+'" data-unit="'+d.unit+'" aria-label="Добави '+d.name+' в поръчката">+</button>')
    + '</div>'
    + '</article>'
  ).join('');
}

/* ---------- промоции с дати ---------- */
function promoLive(p){
  if (p.on === false) return false;
  const today = new Date().toISOString().slice(0,10);
  if (p.from && today < p.from) return false;
  if (p.to && today > p.to) return false;
  return true;
}

function renderPromo(){
  const grid = $('#promoGrid');
  if (!grid) return;
  const items = C.promo.items.filter(promoLive);
  const sec = document.getElementById('promo');
  if (!items.length){ if (sec) sec.hidden = true; return; }
  if (sec) sec.hidden = false;

  grid.innerHTML = items.map((p, i) =>
    '<article class="promo-card" data-rv'+(i ? ' data-d="'+i+'"' : '')+'>'
    + '<span class="promo-badge">'+p.badge+'</span>'
    + '<h3>'+p.name+'</h3><p>'+(p.desc||'')+'</p>'
    + '<p class="promo-price">'+(p.old ? '<s>'+p.old+' €</s>' : '')
      + '<b>'+p.eur+' €</b><span>'+p.unit+'</span>'
      + '<small>≈ '+TERA.toLv(p.eur)+' лв. '+p.unit+'</small></p>'
    + '<button class="btn btn-red promo-add" type="button" data-add data-name="'+p.name+'" data-eur="'+p.eur+'" data-unit="'+p.unit+'">Добави в поръчката</button>'
    + '</article>'
  ).join('');
}

/* ---------- рецепти ---------- */
function renderRecipes(){
  const grid = $('#recipeGrid');
  if (!grid) return;
  const items = C.recipes.items.filter(r => r.on !== false);
  const sec = document.getElementById('recipes');
  if (!items.length){ if (sec) sec.hidden = true; return; }

  $('#recipesEyebrow').textContent = C.recipes.eyebrow;
  $('#recipesTitle').textContent = C.recipes.title;
  $('#recipesSub').textContent = C.recipes.sub;

  grid.innerHTML = items.map((r, i) =>
    '<article class="recipe" data-rv'+(i%3 ? ' data-d="'+(i%3)+'"' : '')+'>'
    + (r.image ? '<figure class="recipe-img"><img src="'+r.image+'" alt="'+r.name+'" width="800" height="600" loading="lazy" decoding="async"></figure>' : '')
    + '<div class="recipe-body">'
      + (r.cut ? '<span class="recipe-cut">'+r.cut+'</span>' : '')
      + '<h3>'+r.name+'</h3>'
      + '<p class="recipe-lead">'+(r.text||'')+'</p>'
      + '<ul class="recipe-meta">'
        + (r.time ? '<li>'+r.time+'</li>' : '')
        + (r.level ? '<li>'+r.level+'</li>' : '')
        + (r.portions ? '<li>'+r.portions+'</li>' : '')
      + '</ul>'
      + '<details class="recipe-more"><summary>'
          + '<span class="s-show">Виж рецептата</span><span class="s-hide">Скрий рецептата</span>'
        + '</summary>'
        + '<div class="recipe-panel">'
          + '<div class="recipe-cols">'
            + '<div><h4>Продукти</h4><ul class="recipe-ing">'
              + (r.ingredients||[]).map(x => '<li>'+x+'</li>').join('')
            + '</ul></div>'
            + '<div><h4>Стъпки</h4><ol class="recipe-steps">'
              + (r.steps||[]).map(x => '<li>'+x+'</li>').join('')
            + '</ol></div>'
          + '</div>'
          + '<div class="recipe-acts">'
            + (r.cut ? '<button class="btn btn-red" type="button" data-add data-name="'+r.cut+'" data-unit="/ кг">Добави '+r.cut+'</button>' : '')
            + '<button class="recipe-close" type="button">Скрий рецептата</button>'
          + '</div>'
        + '</div>'
      + '</details>'
    + '</div></article>'
  ).join('');
}

/* Отворената рецепта се затваря и от долния бутон — иначе трябва
   да скролнеш чак до заглавието ѝ. */
document.addEventListener('click', e => {
  const btn = e.target.closest('.recipe-close');
  if (!btn) return;
  const box = btn.closest('details');
  if (!box) return;
  box.open = false;
  const card = box.closest('.recipe');
  if (card) card.scrollIntoView({behavior: reduced ? 'instant' : 'smooth', block:'nearest'});
});

/* ---------- празници ---------- */
/* Православният Великден се мести — смята се по Мееус и се превежда
   към григорианския календар. */
function easter(year){
  const a = year % 4, b = year % 7, c = year % 19;
  const d = (19*c + 15) % 30;
  const e = (2*a + 4*b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const jul = new Date(Date.UTC(year, month - 1, day));
  jul.setUTCDate(jul.getUTCDate() + 13);
  return jul;
}

function nextHoliday(it){
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  for (let y = today.getUTCFullYear(); y <= today.getUTCFullYear() + 1; y++){
    let d;
    if (it.kind === 'easter'){
      d = easter(y);
      d.setUTCDate(d.getUTCDate() + (+it.offset || 0));
    } else {
      const p = String(it.date || '').split('-');
      if (p.length !== 2) return null;
      d = new Date(Date.UTC(y, +p[0] - 1, +p[1]));
    }
    if (d >= today) return d;
  }
  return null;
}

function renderHolidays(){
  const grid = $('#holidayGrid');
  if (!grid) return;
  const MONTHS = ['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const list = C.holidays.items
    .filter(h => h.on !== false)
    .map(h => { const d = nextHoliday(h); return d ? {h, d, days: Math.round((d - today)/86400000)} : null; })
    .filter(Boolean)
    .sort((a,b) => a.days - b.days)
    .slice(0, 3);

  const sec = document.getElementById('holidays');
  if (!list.length){ if (sec) sec.hidden = true; return; }

  $('#holidaysEyebrow').textContent = C.holidays.eyebrow;
  $('#holidaysTitle').textContent = C.holidays.title;
  $('#holidaysSub').textContent = C.holidays.sub;

  /* хоризонтът, спрямо който се пълни пръстенът — колкото по-близо е
     празникът, толкова по-запълнен е кръгът */
  const HORIZON = 90;
  const R = 42, CIRC = 2 * Math.PI * R;
  const tel  = 'tel:' + (C.contact.phone || '');
  const vib  = 'viber://chat?number=' + encodeURIComponent(C.contact.viber || C.contact.phone || '');

  grid.innerHTML = list.map(({h, d, days}) => {
    const lead = +h.lead || 0;
    const left = days - lead;
    const deadline = new Date(d.getTime() - lead*86400000);
    const dl = deadline.getUTCDate()+' '+MONTHS[deadline.getUTCMonth()];
    const pct = Math.max(0, Math.min(1, 1 - days / HORIZON));
    const offset = CIRC * (1 - pct);
    /* колко от прозореца за заявка е изтекъл */
    const win = Math.max(1, HORIZON - lead);
    const usedPct = Math.max(0, Math.min(100, Math.round((1 - left / win) * 100)));

    return '<article class="holiday'+(left < 0 ? ' late' : (left <= 3 ? ' soon' : ''))+'" data-rv>'
      + '<span class="hol-strip" aria-hidden="true"></span>'
      + '<div class="hol-row">'
        + '<div class="hol-dial">'
          + '<svg viewBox="0 0 100 100" aria-hidden="true">'
            + '<circle class="hd-bg" cx="50" cy="50" r="'+R+'"/>'
            + '<circle class="hd-fg" cx="50" cy="50" r="'+R+'" stroke-dasharray="'+CIRC.toFixed(1)+'" stroke-dashoffset="'+offset.toFixed(1)+'"/>'
          + '</svg>'
          + '<b>'+days+'<em>'+(days === 1 ? 'ден' : 'дни')+'</em></b>'
        + '</div>'
        + '<div class="hol-head">'
          + '<h3>'+h.name+'</h3>'
          + '<p class="hol-date">'+d.getUTCDate()+' '+MONTHS[d.getUTCMonth()]+' '+d.getUTCFullYear()+'</p>'
        + '</div>'
      + '</div>'
      + '<p>'+(h.note||'')+'</p>'
      + '<div class="hol-meter" aria-hidden="true"><i style="width:'+usedPct+'%"></i></div>'
      + '<span class="hol-tag">'
        + (left < 0 ? C.holidays.passed
           : (left === 0 ? (C.holidays.todayLabel || 'днес е крайният срок')
              : C.holidays.orderBy+' '+dl+' · '+left+' '+C.holidays.daysLeft))
      + '</span>'
      + '<div class="hol-btns">'
        + '<a class="btn btn-red" href="'+tel+'">'+(C.holidays.ctaLabel || 'Заяви')+'</a>'
        + '<a class="btn btn-ghost" href="'+vib+'">Viber</a>'
      + '</div>'
    + '</article>';
  }).join('');

  const bar = $('#holidayBar');
  if (bar){
    bar.hidden = false;
    $('#holBarTitle').textContent = C.holidays.barTitle || '';
    $('#holBarText').textContent  = C.holidays.barText  || '';
    const barBtn = $('#holBarBtn');
    if (barBtn){ barBtn.textContent = C.holidays.barBtn || 'Обади се'; barBtn.href = tel; }
    $$('#holidayBar a[href^="viber"]').forEach(a => a.href = vib);
  }
}

/* ---------- отзиви ---------- */
let revOpen = false;

function renderReviews(){
  const grid = $('#revGrid');
  if (!grid) return;
  const R = C.reviews || {};
  const items = (R.items || []).filter(r => r.on !== false);
  const sec = document.getElementById('reviews');
  if (!items.length){ if (sec) sec.hidden = true; return; }

  const score = $('#revScore'), scoreTxt = $('#revScoreTxt');
  if (score && R.score) score.textContent = R.score;
  if (scoreTxt) scoreTxt.textContent = (R.scoreText || '') +
    (items.length ? ' · ' + items.length + ' ' + (R.countLabel || 'отзива') : '');

  const stars = n => '★★★★★'.slice(0, Math.max(1, Math.min(5, +n || 5)));

  grid.innerHTML = items.map((r, i) =>
    '<article class="rev'+(r.big ? ' rev-big' : '')+'">'
    + (r.big ? '<span class="rev-quote" aria-hidden="true">„</span>' : '')
    + '<div class="stars" aria-label="'+(r.stars||5)+' от 5 звезди">'+stars(r.stars)+'</div>'
    + '<p class="rev-txt">'+(r.text||'')+'</p>'
    + '<div class="rev-who"><i aria-hidden="true">'+(r.name||'?').trim().charAt(0)+'</i>'
      + '<div><b>'+(r.name||'')+'</b><span>'+(r.role||'')+'</span>'
      + (r.date ? '<span class="rev-date">'+r.date+'</span>' : '')
      + '</div></div>'
    + '</article>'
  ).join('');

  applyRevLimit();
}

/** Показва само първите N отзива, докато не натиснеш „виж всички“. */
function applyRevLimit(){
  const R = C.reviews || {};
  /* на телефон картите са една под друга — там показваме по-малко */
  const limit = matchMedia('(max-width:768px)').matches
    ? 3
    : Math.max(1, +R.visible || 5);
  const cards = $$('#revGrid .rev');
  cards.forEach((el, i) => el.classList.toggle('is-hidden', !revOpen && i >= limit));

  const btn = $('#revMore');
  if (!btn) return;
  if (cards.length <= limit){ btn.hidden = true; return; }
  btn.hidden = false;
  btn.classList.toggle('open', revOpen);
  btn.querySelector('.rev-more-txt').textContent = revOpen
    ? (R.lessLabel || 'Скрий отзивите')
    : (R.moreLabel || 'Виж всички отзиви') + ' (' + cards.length + ')';
}

/* ---------- чести въпроси ---------- */
function renderFaq(){
  const list = $('#faqList');
  if (!list) return;
  const F = C.faq || {};
  const items = (F.items || []).filter(q => q.on !== false);
  const sec = document.getElementById('faq');
  if (!items.length){ if (sec) sec.hidden = true; return; }

  list.innerHTML = items.map((q, i) =>
    '<details class="faq-item" name="faq" data-q="'+((q.q||'')+' '+(q.a||'')).toLowerCase().replace(/"/g,'')+'">'
    + '<summary>'
      + '<span class="q-no">'+String(i+1).padStart(2,'0')+'</span>'
      + '<span class="q-txt">'+q.q+'</span>'
      + (q.group ? '<span class="q-group">'+q.group+'</span>' : '')
      + '<i aria-hidden="true"></i>'
    + '</summary>'
    + '<div class="faq-body"><p>'+q.a+'</p></div>'
    + '</details>'
  ).join('') + '<p class="faq-empty" hidden>'+(F.noResults || 'Няма такъв въпрос.')+'</p>';

  const search = $('#faqSearch');
  if (search){
    if (F.searchPlaceholder) search.placeholder = F.searchPlaceholder;
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      $$('#faqList .faq-item').forEach(d => {
        const hit = !q || d.dataset.q.indexOf(q) >= 0;
        d.classList.toggle('hide', !hit);
        if (hit) shown++; else d.open = false;
      });
      const empty = $('#faqList .faq-empty');
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* браузърите без <details name> държат всичко отворено — затваряме ръчно */
  if (!('name' in document.createElement('details'))){
    const all = $$('#faqList .faq-item');
    all.forEach(d => d.addEventListener('toggle', () => {
      if (d.open) all.forEach(o => { if (o !== d) o.open = false; });
    }));
  }
}

/* ---------- поръчки: значки, бързи часове, списък ---------- */
function renderOrderExtras(){
  const O = C.order || {};

  const badges = $('#orderBadges');
  if (badges) badges.innerHTML = (O.badges || []).map(b => '<li>'+b+'</li>').join('');

  const chips = $('#timeChips');
  const time = $('#fTime');
  if (chips && time){
    chips.innerHTML = (O.timeChips || []).map(t =>
      '<button class="time-chip" type="button">'+t+'</button>').join('');
    chips.addEventListener('click', e => {
      const b = e.target.closest('.time-chip');
      if (!b) return;
      const same = b.classList.contains('active');
      $$('#timeChips .time-chip').forEach(c => c.classList.remove('active'));
      if (same){ time.value = ''; return; }
      b.classList.add('active');
      time.value = b.textContent;
    });
  }

  const hint = $('#formCartHint');
  if (hint && O.cartHint) hint.textContent = O.cartHint;
  const cartBtn = $('#formCartBtn');
  if (cartBtn && O.cartBtn) cartBtn.textContent = O.cartBtn;
  if (O.formPlaceholder && $('#fMsg')) $('#fMsg').placeholder = O.formPlaceholder;
}

/* Листът за печат чете същия филтриран списък, който се вижда на екрана. */
TERA.visibleProducts = function(){ return C ? visibleProducts() : []; };

/* ---------- калкулатор: заглавия ---------- */
function paintCalcTexts(){
  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  set('#calcEyebrow', C.calc.eyebrow);
  set('#calcTitle', C.calc.title);
  set('#calcSub', C.calc.sub);
  set('#calcGuestsLabel', C.calc.guestsLabel);
  set('#calcOccasionLabel', C.calc.occasionLabel);
}

/* ---------- пускане ---------- */
TERA.api.content().then(content => {
  C = content;

  cutData = {};
  [...C.cuts.pork, ...C.cuts.beef].forEach(c => { if (c.key) cutData[c.key] = c; });
  info.innerHTML = '<h3>'+C.cuts.emptyTitle+'</h3><p>'+C.cuts.emptyText+'</p>';

  buildChips();
  bindProdTools();
  renderProducts();
  renderKitchen();
  renderPromo();
  renderRecipes();
  renderHolidays();
  renderReviews();
  renderFaq();
  renderOrderExtras();
  paintCalcTexts();

  TERA.shop.init(C);

  /* при завъртане на телефона броят видими отзиви се сменя */
  matchMedia('(max-width:768px)').addEventListener('change', () => { if (!revOpen) applyRevLimit(); });

  const revBtn = $('#revMore');
  if (revBtn) revBtn.addEventListener('click', () => {
    revOpen = !revOpen;
    applyRevLimit();
    if (!revOpen){
      const sec = document.getElementById('reviews');
      if (sec) sec.scrollIntoView({behavior: reduced ? 'instant' : 'smooth', block:'start'});
    }
    if (hasGsap && !reduced && typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  });

  /* новото съдържание сменя височините — иначе разкриването при скрол куца */
  if (hasGsap && !reduced && typeof ScrollTrigger !== 'undefined'){
    $$('#dishGrid [data-rv], #promoGrid [data-rv], #recipeGrid [data-rv], #holidayGrid [data-rv]')
      .forEach(el => {
        const d = +(el.dataset.d || 0);
        gsap.set(el, {y:38, opacity:0});
        ScrollTrigger.create({
          trigger: el, start:'top 88%', once:true,
          onEnter: () => gsap.to(el, {y:0, opacity:1, duration:.75, delay:d*.12, ease:'power3.out'})
        });
      });
    ScrollTrigger.refresh();
  }
}).catch(err => {
  console.error('Съдържанието не се зареди:', err);
});

/* ---------- order form ---------- */
const form = $('#orderForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  let ok = true;
  const check = (id, valid) => {
    const f = document.getElementById(id).closest('.field');
    f.classList.toggle('invalid', !valid);
    if (!valid) ok = false;
  };
  // form.elements, а не form.name — form.name е и собствено свойство на <form>
  const el = form.elements;
  check('fName',  el.name.value.trim().length >= 2);
  check('fPhone', el.phone.value.replace(/\D/g,'').length >= 9);
  check('fMsg',   el.msg.value.trim().length >= 5);
  if (!ok) return;

  /* Записът минава през слоя за данните — днес остава в браузъра,
     утре същият ред ще праща поръчката на сървъра. */
  TERA.api.sendOrder({
    name: el.name.value.trim(),
    phone: el.phone.value.trim(),
    msg: el.msg.value.trim(),
    time: el.time.value.trim()
  }).catch(() => {});

  form.style.display = 'none';
  const okBox = $('#formOk');
  okBox.classList.add('show');
  if (hasGsap && !reduced){
    gsap.from(okBox, {scale:.9, opacity:0, duration:.5, ease:'back.out(1.8)'});
  }
});

/* ---------- работно време: отворено / затворено ---------- */
const HOURS = {1:[8,19], 2:[8,19], 3:[8,19], 4:[8,19], 5:[8,19], 6:[8,15], 0:null};
const statusEl = $('#conStatus');
function paintHours(){
  const now = new Date();
  const day = now.getDay();
  const mins = now.getHours()*60 + now.getMinutes();
  const today = HOURS[day];
  const open = !!today && mins >= today[0]*60 && mins < today[1]*60;

  $$('.hours div[data-day]').forEach(row => {
    const spec = row.dataset.day;
    const match = spec === '1-5' ? (day >= 1 && day <= 5) : +spec === day;
    row.classList.toggle('today', match);
  });

  if (!statusEl) return;
  statusEl.classList.toggle('open', open);
  statusEl.classList.toggle('shut', !open);
  const label = open
    ? 'Отворено сега · до ' + String(today[1]).padStart(2,'0') + ':00'
    : (today && mins < today[0]*60
        ? 'Затворено · отваряме в 08:00'
        : 'Затворено в момента');
  statusEl.querySelector('b').textContent = label;
}
paintHours();
setInterval(paintHours, 60000);

/* ---------- lightbox ---------- */
const items = $$('.gal-item');
const lb = $('#lightbox');
const lbImg = $('#lbImg'), lbCap = $('#lbCap');
let cur = 0, lastFocus = null;
function openLb(i){
  // фокусът се запомня само при първоначалното отваряне,
  // иначе стрелките го подменят с бутона на самия лайтбокс
  if (!lb.classList.contains('open')) lastFocus = document.activeElement;
  cur = i;
  const src = items[i].querySelector('img');
  if (src){ lbImg.src = src.src; lbImg.alt = src.alt; }
  lbCap.textContent = items[i].dataset.cap;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  $('#lbClose').focus();
}
function closeLb(){
  lb.classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
  lastFocus = null;
}
function stepLb(d){ openLb((cur + d + items.length) % items.length); }
items.forEach((it,i) => it.addEventListener('click', () => openLb(i)));
$('#lbClose').addEventListener('click', closeLb);
$('#lbPrev').addEventListener('click', e => { e.stopPropagation(); stepLb(-1); });
$('#lbNext').addEventListener('click', e => { e.stopPropagation(); stepLb(1); });
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') stepLb(-1);
  if (e.key === 'ArrowRight') stepLb(1);
  if (e.key === 'Tab'){
    const f = lb.querySelectorAll('button');
    const first = f[0], last = f[f.length-1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
});
let tx = null;
lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, {passive:true});
lb.addEventListener('touchend', e => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 50) stepLb(dx > 0 ? -1 : 1);
  tx = null;
}, {passive:true});

})();
