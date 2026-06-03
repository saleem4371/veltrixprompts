'use strict';

// ── STATE ──────────────────────────────────────────────
let C = {};           // full content object from server
let testimonials = []; // live copy
let carouselIdx = 0;
let carouselTimer = null;
const CAROUSEL_THRESHOLD = 3;
const PROD_KEYS = ['hr','legal','finance','re'];
let currentProd = 'hr';

// ── BOOT ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await loadContent();
  renderAll();
  checkSession();
  initAdminBtn();
  initBurger();
});
window.addEventListener('resize', () => {
  if (document.querySelector('.testi-outer.carousel-mode')) positionCarousel(false);
});

// ── CONTENT LOAD ───────────────────────────────────────
async function loadContent() {
  const res = await fetch('/api/content');
  C = await res.json();
  testimonials = [...(C.testimonials || [])];
}

// ── RENDER ALL ─────────────────────────────────────────
function renderAll() {
  renderHero();
  renderProducts();
  renderHow();
  renderTestimonials();
  renderFaq();
  renderSite();
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined) el.textContent = val;
}
function setH(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined) el.innerHTML = val;
}

function renderHero() {
  const h = C.hero || {};
  set('el-eyebrow', h.eyebrow);
  setH('el-h1', (h.h1 || '').replace(/\[em\](.*?)\[\/em\]/g, '<em>$1</em>'));
  set('el-sub', h.sub);
  const cta = document.getElementById('el-hero-cta');
  if (cta) cta.textContent = h.cta || 'Explore the packs →';
  set('el-nav-cta', h.navCta); set('el-mob-cta', h.navCta);
  set('el-stat1-num', h.stat1Num); set('el-stat1-lbl', h.stat1Lbl);
  set('el-stat2-num', h.stat2Num); set('el-stat2-lbl', h.stat2Lbl);
  set('el-stat3-num', h.stat3Num); set('el-stat3-lbl', h.stat3Lbl);
  set('el-prod-label', h.prodLabel);
  set('el-prod-title', h.prodTitle);
  set('el-prod-intro', h.prodIntro);
}

function renderProducts() {
  const grid = document.getElementById('cards-grid');
  if (!grid) return;
  const prods = C.products || {};
  const order = ['hr','legal','finance','re'];
  grid.innerHTML = order.map(id => {
    const p = prods[id];
    if (!p) return '';
    const featsHtml = (p.feats || []).map(f => `<li>${f}</li>`).join('');
    const btnHtml = p.live
      ? `<a href="${p.url || '#'}" class="btn-buy" id="btn-${id}">Buy now →</a>`
      : `<button class="btn-notify" id="btn-${id}">Notify me</button>`;
    return `
    <div class="card${p.live?' live':' soon'}" id="card-${id}">
      <span class="c-badge ${p.live?'b-live':'b-soon'}" id="badge-${id}">${p.live?'Live now':'Coming soon'}</span>
      <div class="c-icon">${p.icon||''}</div>
      <div class="c-name" id="cd-${id}-name">${p.name}</div>
      <div class="c-tag" id="cd-${id}-tagline">${p.tagline}</div>
      <div class="c-desc" id="cd-${id}-desc">${p.desc}</div>
      <ul class="c-feats" id="cd-${id}-feats">${featsHtml}</ul>
      <div class="c-count" id="cd-${id}-count">${p.count}</div>
      <div class="c-foot">
        <div class="c-price"><span id="card-price-${id}">$${p.price||79}</span> <small>one-time</small></div>
        ${btnHtml}
      </div>
    </div>`;
  }).join('');
}

function renderHow() {
  const h = C.how || {};
  set('el-how-label', h.label); set('el-how-title', h.title);
  set('el-how1-title', h.step1Title); set('el-how1-body', h.step1Body);
  set('el-how2-title', h.step2Title); set('el-how2-body', h.step2Body);
  set('el-how3-title', h.step3Title); set('el-how3-body', h.step3Body);
}

function renderTestimonials() {
  const outer = document.getElementById('testi-outer');
  const track = document.getElementById('testi-track');
  const nav   = document.getElementById('testi-nav');
  if (!outer || !track || !nav) return;
  stopCarouselAuto();
  const isCarousel = testimonials.length > CAROUSEL_THRESHOLD;
  track.innerHTML = testimonials.map(t => `
    <div class="tc">
      <div class="tc-stars">★★★★★</div>
      <div class="tc-q">${t.q}</div>
      <div class="tc-name">${t.n}</div>
      <div class="tc-role">${t.r}</div>
      ${t.p ? `<span class="tc-pack">${t.p}</span>` : ''}
    </div>`).join('');
  if (isCarousel) {
    outer.classList.add('carousel-mode');
    carouselIdx = 0;
    let navHtml = `<button class="testi-arrow" onclick="carouselMove(-1)">&#8592;</button>`;
    testimonials.forEach((_, i) => navHtml += `<button class="testi-dot${i===0?' on':''}" onclick="carouselGo(${i})"></button>`);
    navHtml += `<button class="testi-arrow" onclick="carouselMove(1)">&#8594;</button>`;
    nav.innerHTML = navHtml;
    positionCarousel(false);
    startCarouselAuto();
  } else {
    outer.classList.remove('carousel-mode');
    track.style.transform = '';
    nav.innerHTML = '';
  }
}

function positionCarousel(animate) {
  const track = document.getElementById('testi-track');
  if (!track) return;
  const card = track.querySelector('.tc');
  if (!card) return;
  const cardW = card.offsetWidth + 18;
  if (!animate) track.style.transition = 'none';
  track.style.transform = `translateX(-${carouselIdx * cardW}px)`;
  if (!animate) requestAnimationFrame(() => track.style.transition = '');
  document.querySelectorAll('.testi-dot').forEach((d, i) => d.classList.toggle('on', i === carouselIdx));
}
function carouselMove(dir) { carouselIdx = (carouselIdx + dir + testimonials.length) % testimonials.length; positionCarousel(true); restartCarouselAuto(); }
function carouselGo(i) { carouselIdx = i; positionCarousel(true); restartCarouselAuto(); }
function startCarouselAuto() { stopCarouselAuto(); carouselTimer = setInterval(() => carouselMove(1), 4500); }
function stopCarouselAuto() { if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; } }
function restartCarouselAuto() { stopCarouselAuto(); startCarouselAuto(); }

function renderFaq() {
  const f = C.faq || {};
  set('el-faq-label', f.label); set('el-faq-title', f.title);
  const wrap = document.getElementById('faq-wrap');
  if (!wrap) return;
  wrap.innerHTML = (f.items || []).map(item => `
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        <span>${item.q}</span><span class="faq-ico">+</span>
      </div>
      <div class="faq-a">${item.a}</div>
    </div>`).join('');
}

function renderSite() {
  const s = C.site || {};
  set('el-testi-label', s.testiLabel); set('el-testi-title', s.testiTitle);
  set('el-footer-desc', s.footerDesc);
  set('el-footer-copy', s.footerCopy); set('el-footer-domain', s.footerDomain);
  const em = document.getElementById('el-footer-email');
  if (em && s.email) em.href = 'mailto:' + s.email;
}

function toggleFaq(el) { el.closest('.faq-item').classList.toggle('open'); }

// ── MOBILE MENU ────────────────────────────────────────
function initBurger() {
  const burger = document.getElementById('nav-burger');
  const menu   = document.getElementById('mobile-menu');
  if (!burger || !menu) return;
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });
}
function closeMobileMenu() {
  document.getElementById('mobile-menu')?.classList.remove('open');
  document.getElementById('nav-burger')?.classList.remove('open');
}

// ── ADMIN BUTTON ───────────────────────────────────────
function initAdminBtn() {
  const btn = document.getElementById('adm-btn');
  if (!btn) return;
  btn.addEventListener('click', toggleAdm);
  const params = new URLSearchParams(location.search);
  if (params.get('admin') === 'false') btn.style.display = 'none';
  if (params.get('admin') === 'true')  btn.style.display = 'flex';
  document.addEventListener('click', e => {
    const panel = document.getElementById('adm');
    if (panel?.classList.contains('open') && !panel.contains(e.target) && !btn.contains(e.target)) closeAdm();
  });
}
function toggleAdm() {
  document.getElementById('adm')?.classList.toggle('open');
  document.getElementById('adm-btn')?.classList.toggle('on');
}
function closeAdm() {
  document.getElementById('adm')?.classList.remove('open');
  document.getElementById('adm-btn')?.classList.remove('on');
}

// ── SESSION CHECK ──────────────────────────────────────
async function checkSession() {
  try {
    const res = await fetch('/api/admin/session');
    if (res.ok) {
      const data = await res.json();
      if (data.ok) showEditor(data.username);
    }
  } catch (_) {}
}

// ── LOGIN / LOGOUT ─────────────────────────────────────
async function doLogin() {
  const username = document.getElementById('ap-user').value.trim();
  const password = document.getElementById('ap-pass').value;
  const errEl    = document.getElementById('adm-err');
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      const data = await res.json();
      errEl.style.display = 'none';
      document.getElementById('ap-pass').value = '';
      showEditor(data.username);
    } else {
      errEl.style.display = 'block';
      document.getElementById('ap-pass').value = '';
    }
  } catch (_) { errEl.style.display = 'block'; }
}

function showEditor(username) {
  document.getElementById('adm-login').style.display = 'none';
  document.getElementById('adm-editor').classList.add('show');
  document.getElementById('adm-dot').classList.add('on');
  document.getElementById('adm-sub').textContent = 'Authenticated';
  document.getElementById('adm-uname').textContent = username || 'Admin';
  populateAdminFields();
  buildProductEditors();
  buildFaqAdmin();
  renderTestiAdmin();
}

async function doLogout() {
  await fetch('/api/admin/logout', { method: 'POST' });
  document.getElementById('adm-login').style.display = 'flex';
  document.getElementById('adm-login').style.flexDirection = 'column';
  document.getElementById('adm-editor').classList.remove('show');
  document.getElementById('adm-dot').classList.remove('on');
  document.getElementById('adm-sub').textContent = 'Authentication required';
  document.getElementById('ap-user').value = '';
}

// ── TABS ───────────────────────────────────────────────
function swTab(name, btn) {
  document.querySelectorAll('.atab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.apanel').forEach(p => p.classList.remove('show'));
  btn.classList.add('on');
  document.getElementById('ap-' + name)?.classList.add('show');
  if (name === 'reviews') renderTestiAdmin();
}

// ── POPULATE ADMIN FIELDS ──────────────────────────────
function populateAdminFields() {
  const h = C.hero || {};
  const sf = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  sf('a-eyebrow', h.eyebrow); sf('a-h1', h.h1); sf('a-sub', h.sub);
  sf('a-hcta', h.cta); sf('a-nav-cta', h.navCta);
  sf('a-s1n', h.stat1Num); sf('a-s1l', h.stat1Lbl);
  sf('a-s2n', h.stat2Num); sf('a-s2l', h.stat2Lbl);
  sf('a-s3n', h.stat3Num); sf('a-s3l', h.stat3Lbl);
  sf('a-prod-label', h.prodLabel); sf('a-prod-title', h.prodTitle); sf('a-prod-intro', h.prodIntro);
  const how = C.how || {};
  sf('a-how-label', how.label); sf('a-how-title', how.title);
  sf('a-how1-t', how.step1Title); sf('a-how1-b', how.step1Body);
  sf('a-how2-t', how.step2Title); sf('a-how2-b', how.step2Body);
  sf('a-how3-t', how.step3Title); sf('a-how3-b', how.step3Body);
  const site = C.site || {};
  sf('a-testi-label', site.testiLabel); sf('a-testi-title', site.testiTitle);
  sf('a-footer-desc', site.footerDesc); sf('a-email', site.email);
  sf('a-footer-copy', site.footerCopy); sf('a-footer-domain', site.footerDomain);
}

// ── PRODUCT EDITORS ────────────────────────────────────
function buildProductEditors() {
  const container = document.getElementById('prod-editors');
  if (!container) return;
  container.innerHTML = PROD_KEYS.map(id => {
    const p = (C.products || {})[id] || {};
    const featsVal = (p.feats || []).join('\n');
    const icons = { hr:'👥', legal:'⚖️', finance:'📊', re:'🏡' };
    return `
    <div class="peditor${id===currentProd?' show':''}" id="pe-${id}">
      <div class="acard">
        <div class="acard-t">Card content — ${p.name || id}</div>
        <div class="ag"><label class="al">Name</label><input class="af" id="pe-${id}-name" value="${p.name||''}"></div>
        <div class="ag"><label class="al">Tagline</label><input class="af" id="pe-${id}-tagline" value="${p.tagline||''}"></div>
        <div class="ag"><label class="al">Description</label><textarea class="af-area" id="pe-${id}-desc">${p.desc||''}</textarea></div>
        <div class="ag"><label class="al">Count / delivery line</label><input class="af" id="pe-${id}-count" value="${p.count||''}"></div>
        <div class="ag"><label class="al">Features (one per line)</label><textarea class="af-area" id="pe-${id}-feats" style="min-height:110px">${featsVal}</textarea></div>
      </div>
      <div class="acard">
        <div class="acard-t">Price &amp; Gumroad link</div>
        <div class="ag">
          <label class="al">Price (number only)</label>
          <div class="num-row"><span class="af-sym">$</span><input class="af" id="pe-${id}-price" type="number" min="1" value="${p.price||79}"><small>USD</small></div>
        </div>
        <div class="ag"><label class="al">Gumroad URL</label><input class="af" id="pe-${id}-url" value="${p.url||''}"></div>
      </div>
      <div class="acard">
        <div class="acard-t">Visibility</div>
        <div class="atog-row">
          <button class="atog${p.live?' on':''}" id="tog-${id}" onclick="togProd('${id}',this)"></button>
          <span class="atog-lbl" id="tog-${id}-lbl">${p.live?'Live — showing buy button':'Coming soon'}</span>
        </div>
      </div>
      <div class="save-bar"><button class="asave" onclick="saveProd('${id}')">Save ${p.name||id}</button><span class="asaved" id="sv-${id}">✓ Saved</span></div>
    </div>`;
  }).join('');
}

function buildFaqAdmin() {
  const container = document.getElementById('faq-admin-items');
  if (!container) return;
  container.innerHTML = (C.faq?.items || []).map((item, i) => `
    <div class="faq-admin-item">
      <div class="faq-admin-num">FAQ ${i + 1}</div>
      <div class="ag"><label class="al">Question</label><input class="af" id="a-faq${i}-q" value="${item.q.replace(/"/g,'&quot;')}"></div>
      <div class="ag"><label class="al">Answer</label><textarea class="af-area" id="a-faq${i}-a">${item.a}</textarea></div>
    </div>`).join('');
}

function selProd(name, btn) {
  currentProd = name;
  document.querySelectorAll('.psel').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.peditor').forEach(e => e.classList.remove('show'));
  btn.classList.add('on');
  document.getElementById('pe-' + name)?.classList.add('show');
}

function togProd(name, btn) {
  const isOn = btn.classList.toggle('on');
  const lbl = document.getElementById('tog-' + name + '-lbl');
  if (lbl) lbl.textContent = isOn ? 'Live — showing buy button' : 'Coming soon';
}

// ── TESTIMONIAL MANAGER ────────────────────────────────
function renderTestiAdmin() {
  const list = document.getElementById('tr-list');
  if (!list) return;
  if (testimonials.length === 0) {
    list.innerHTML = '<p style="font-size:12px;color:var(--muted);margin-bottom:12px">No testimonials yet.</p>';
    return;
  }
  list.innerHTML = testimonials.map((t, i) => `
    <div class="tr-item" id="tr-item-${i}">
      <div class="tr-item-head" onclick="trToggle(${i})">
        <span class="tr-item-label">
          <span class="tr-chev">▶</span>
          <span class="tr-item-label-text">${t.n}</span>
          <span class="tr-item-meta">— ${t.r}</span>
        </span>
        <span class="tr-actions" onclick="event.stopPropagation()">
          <button class="tr-del-btn" onclick="trDelete(${i})">Delete</button>
        </span>
      </div>
      <div class="tr-body" id="tr-body-${i}">
        <div class="ag"><label class="al">Quote</label><textarea class="af-area" id="tr-q-${i}">${t.q}</textarea></div>
        <div class="a2">
          <div class="ag"><label class="al">Name</label><input class="af" id="tr-n-${i}" value="${t.n}"></div>
          <div class="ag"><label class="al">Role</label><input class="af" id="tr-r-${i}" value="${t.r}"></div>
        </div>
        <div class="ag"><label class="al">Pack tag</label><input class="af" id="tr-p-${i}" value="${t.p||''}"></div>
        <div class="save-bar"><button class="asave" onclick="trSave(${i})">Save changes</button><span class="asaved" id="sv-tr-${i}">✓ Saved</span></div>
      </div>
    </div>`).join('');
}

function trToggle(i) {
  document.getElementById('tr-item-' + i)?.classList.toggle('expanded');
  document.getElementById('tr-body-' + i)?.classList.toggle('open');
}

async function trSave(i) {
  const updated = {
    q: document.getElementById('tr-q-' + i).value,
    n: document.getElementById('tr-n-' + i).value,
    r: document.getElementById('tr-r-' + i).value,
    p: document.getElementById('tr-p-' + i).value
  };
  const res = await apiPost('/api/admin/testimonials/' + i, updated);
  if (res.ok) { testimonials = res.testimonials; renderTestimonials(); renderTestiAdmin(); flash('sv-tr-' + i); }
}

async function trDelete(i) {
  if (!confirm(`Delete testimonial from "${testimonials[i].n}"?`)) return;
  const res = await fetch('/api/admin/testimonials/' + i, { method: 'DELETE' });
  const data = await res.json();
  if (data.ok) { testimonials = data.testimonials; renderTestimonials(); renderTestiAdmin(); }
}

async function trAdd() {
  const q = document.getElementById('tr-new-q').value.trim();
  const n = document.getElementById('tr-new-n').value.trim();
  const r = document.getElementById('tr-new-r').value.trim();
  const p = document.getElementById('tr-new-p').value.trim();
  if (!q || !n) { alert('Please fill in at least the quote and name.'); return; }
  const res = await apiPost('/api/admin/testimonials/add', { q, n, r, p });
  if (res.ok) {
    testimonials = res.testimonials;
    renderTestimonials(); renderTestiAdmin();
    document.getElementById('tr-new-q').value = '';
    document.getElementById('tr-new-n').value = '';
    document.getElementById('tr-new-r').value = '';
    document.getElementById('tr-new-p').value = '';
    flash('sv-tr-add');
  }
}

// ── SAVE FUNCTIONS ─────────────────────────────────────
async function saveHero() {
  const payload = {
    eyebrow: v('a-eyebrow'), h1: v('a-h1'), sub: v('a-sub'),
    cta: v('a-hcta'), navCta: v('a-nav-cta'),
    stat1Num: v('a-s1n'), stat1Lbl: v('a-s1l'),
    stat2Num: v('a-s2n'), stat2Lbl: v('a-s2l'),
    stat3Num: v('a-s3n'), stat3Lbl: v('a-s3l'),
    prodLabel: v('a-prod-label'), prodTitle: v('a-prod-title'), prodIntro: v('a-prod-intro')
  };
  const res = await apiPost('/api/admin/hero', payload);
  if (res.ok) { C.hero = { ...C.hero, ...payload }; renderHero(); flash('sv-hero'); }
}

async function saveProd(id) {
  const liveTog = document.getElementById('tog-' + id);
  const payload = {
    name:    v('pe-' + id + '-name'),
    tagline: v('pe-' + id + '-tagline'),
    desc:    v('pe-' + id + '-desc'),
    count:   v('pe-' + id + '-count'),
    feats:   v('pe-' + id + '-feats'),
    price:   v('pe-' + id + '-price'),
    url:     v('pe-' + id + '-url'),
    live:    liveTog?.classList.contains('on') ? 'true' : 'false'
  };
  const res = await apiPost('/api/admin/product/' + id, payload);
  if (res.ok) { C.products[id] = res.product; renderProducts(); flash('sv-' + id); }
}

async function saveHow() {
  const payload = {
    label: v('a-how-label'), title: v('a-how-title'),
    step1Title: v('a-how1-t'), step1Body: v('a-how1-b'),
    step2Title: v('a-how2-t'), step2Body: v('a-how2-b'),
    step3Title: v('a-how3-t'), step3Body: v('a-how3-b')
  };
  const res = await apiPost('/api/admin/how', payload);
  if (res.ok) { C.how = { ...C.how, ...payload }; renderHow(); flash('sv-how'); }
}

async function saveFaq() {
  const items = (C.faq?.items || []).map((_, i) => ({
    q: v('a-faq' + i + '-q'),
    a: v('a-faq' + i + '-a')
  }));
  const payload = {
    label: v('a-faq-label'),
    title: v('a-faq-title'),
    items
  };
  const res = await apiPost('/api/admin/faq', payload);
  if (res.ok) { C.faq = { ...C.faq, ...payload }; renderFaq(); flash('sv-faq'); }
}

async function saveSite() {
  const payload = {
    testiLabel:   v('a-testi-label'),
    testiTitle:   v('a-testi-title'),
    footerDesc:   v('a-footer-desc'),
    email:        v('a-email'),
    footerCopy:   v('a-footer-copy'),
    footerDomain: v('a-footer-domain')
  };
  const res = await apiPost('/api/admin/site', payload);
  if (res.ok) { C.site = { ...C.site, ...payload }; renderSite(); flash('sv-site'); }
}

async function saveCreds() {
  const username = v('a-newuser').trim();
  const password = v('a-newpass');
  if (!username && !password) return;
  const payload = {};
  if (username) payload.username = username;
  if (password) payload.password = password;
  const res = await apiPost('/api/admin/credentials', payload);
  if (res.ok) {
    if (username) document.getElementById('adm-uname').textContent = username;
    document.getElementById('a-newuser').value = '';
    document.getElementById('a-newpass').value = '';
    flash('sv-creds');
  }
}

// ── HELPERS ────────────────────────────────────────────
function v(id) {
  return document.getElementById(id)?.value ?? '';
}
async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}
function flash(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'inline';
  setTimeout(() => el.style.display = 'none', 2500);
}
