/* Administrace webu Hotel Engadin (engadinhotel.cz). Obsah je v repozitáři (_data/*.json); uložení = jeden commit přes webhunter-admin (id engadin), GitHub Action web přegeneruje (~1 min). Přihlášení jen heslem. Základ: administrace T SERVICE (10. 11. 2026). */
'use strict';
(() => {
const CFG = {
  id: 'engadin', site: '../',
  api: /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.search.includes('local') ? 'http://localhost:8787' : 'https://webhunter-admin.webhunter.workers.dev',
};
const FILES = { texty: '_data/texty.json', cenik: '_data/cenik.json', galerie: '_data/galerie.json', site: '_data/site.json' };
const LABEL = { texty: 'Texty', cenik: 'Ceník', galerie: 'Fotogalerie', site: 'Kontakty' };
const SK = 'engadin_admin';
const S = { sess: null, user: '', D: {}, snap: {}, pending: {}, preview: {}, saving: false, lib: null, forms: null };
/* ---------------------------------------------------------------- ikony */
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  home: I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  users: I('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.3.3 4 2.2 4.5 5.4"/>'),
  text: I('<path d="M5 6h14M5 11h14M5 16h9"/>'),
  phone: I('<path d="M4 6l8 6 8-6"/><rect x="3" y="5" width="18" height="14" rx="2"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-2.8 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.8-1.2 2 2 0 1 1-2.8-2.8A1.7 1.7 0 0 0 3.3 14a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.8 2 2 0 1 1 2.8-2.8A1.7 1.7 0 0 0 10 3.3a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.8 1.2 2 2 0 1 1 2.8 2.8A1.7 1.7 0 0 0 20.7 10a2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.3 1z"/>'),
  help: I('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h0"/>'),
  ext: I('<path d="M14 4h6v6M20 4L10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
  inbox: I('<path d="M3 13h5l1.5 3h5l1.5-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/>'),
  refresh: I('<path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/>'),
  menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  x: I('<path d="M18 6L6 18M6 6l12 12"/>'),
  up: I('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: I('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  left: I('<path d="M15 18l-6-6 6-6"/>'),
  right: I('<path d="M9 18l6-6-6-6"/>'),
  trash: I('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  chev: I('<path d="M6 9l6 6 6-6"/>'),
  eye: I('<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
  upload: I('<path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
  image: I('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'),
  logout: I('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  mic: I('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  bolt: I('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h0"/>'),
};
const LOGO = '<span class="adm-logo">Hotel <b>Engadin</b></span>';
/* ---------------------------------------------------------------- utils */
const $ = (s, c = document) => c.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 8);
const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
/* náhľad fotky: nahrané (img/uploads/…) sú na webe v origináli, pôvodné fotky webu majú zmenšeninu v admin/orig/ */
const imgSrc = (p) => {
  if (!p) return '';
  if (S.preview[p]) return S.preview[p];
  if (/^(https?:|blob:|data:)/.test(p)) return p;
  if (p.startsWith('img/uploads/')) return CFG.site + p;
  return CFG.site + 'admin/orig/' + p.replace(/\.[^.]+$/, '').replace(/\//g, '-') + '.webp';
};
const secret = (user, pw) => pw;

function h(sel, props = {}, ...kids) {
  const [tag, ...cls] = sel.split('.');
  const el = document.createElement(tag || 'div');
  if (cls.length) el.className = cls.join(' ');
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(k));
  return el;
}
function toast(title, sub = '', type = '') {
  const el = h('div.toast' + (type ? '.' + type : ''), {}, h('b', {}, title), sub ? h('small', {}, sub) : null);
  $('#toasts').append(el);
  setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 450); }, type === 'err' ? 7000 : 4000);
}
function modal({ title, body, actions = [] }) {
  return new Promise((resolve) => {
    const close = (v) => { bg.remove(); resolve(v); };
    const box = h('div.modal', { role: 'dialog', 'aria-modal': 'true' }, h('h2', {}, title));
    if (typeof body === 'string') box.append(h('div', { html: body })); else if (body) box.append(body);
    box.append(h('div.modal-actions', {}, actions.map((a) => h('button.btn' + (a.cls ? '.' + a.cls : ''), { type: 'button', onclick: () => close(typeof a.value === 'function' ? a.value(box) : a.value) }, a.label))));
    const bg = h('div.modal-bg', { onclick: (e) => { if (e.target === bg) close(null); } }, box);
    $('#modal-root').append(bg);
    const f = box.querySelector('input,textarea,select,button.btn-primary'); if (f) setTimeout(() => f.focus(), 50);
  });
}
const confirmDlg = (title, text, ok = 'Smazat', cls = 'btn-dark') => modal({ title, body: `<p>${esc(text)}</p>`, actions: [{ label: 'Zrušit', value: false }, { label: ok, cls, value: true }] }).then((v) => v === true);

/* ---------------------------------------------------------------- API */
const b64e = (bytes) => { let s = ''; bytes = new Uint8Array(bytes); for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
const utf8b64 = (str) => b64e(new TextEncoder().encode(str));
function saveSess() { localStorage.setItem(SK, JSON.stringify({ t: S.sess, exp: Date.now() + 11.5 * 3600e3 })); }
/* hlášky backendu */
function csMsg(status, m, path) {
  if (path === '/login' && status === 401) return 'Nesprávné heslo.';
  if (status === 429) return 'Příliš mnoho neúspěšných pokusů. Zkuste to prosím za 15 minut.';
  if (status === 401) return 'Přihlášení vypršelo. Přihlaste se prosím znovu.';
  if (status === 403 && /heslo/i.test(m)) return 'Současné heslo nesouhlasí.';
  if (status === 413) return 'Soubor je příliš velký.';
  if (status >= 500) return 'Server teď neodpovídá. Zkuste to prosím za chvíli.';
  return m;
}
async function api(path, opt = {}, retried = false) {
  const headers = { ...(typeof opt.body === 'string' ? { 'Content-Type': 'application/json' } : {}) };
  if (S.sess) headers.Authorization = 'Bearer ' + S.sess;
  let r;
  try { r = await fetch(`${CFG.api}/api/${CFG.id}${path}`, { ...opt, headers, cache: 'no-store' }); }
  catch { throw new Error('Nelze se spojit se serverem. Zkontrolujte připojení k internetu.'); }
  if (r.status === 401 && path !== '/login' && path !== '/password' && !retried && S.D.site) { if (await reauth()) return api(path, opt, true); }
  if (!r.ok) { let m = r.statusText; try { m = (await r.json()).error || m; } catch {} const e = new Error(csMsg(r.status, m, path)); e.status = r.status; throw e; }
  return opt.raw ? r.text() : r.json();
}
const readFile = (p) => api('/file?path=' + encodeURIComponent(p) + '&t=' + Date.now(), { raw: true });
async function commit(files, message) {
  const out = []; const queue = [...files];
  const worker = async () => { while (queue.length) { const f = queue.shift(); const { sha } = await api('/blob', { method: 'POST', body: JSON.stringify({ content: f.b64 ?? utf8b64(f.content), encoding: 'base64' }) }); out.push({ path: f.path, sha }); } };
  await Promise.all([worker(), worker(), worker()]);
  return (await api('/commit', { method: 'POST', body: JSON.stringify({ files: out, message }) })).sha;
}
async function reauth() {
  const inp = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Heslo' });
  const pw = await modal({ title: 'Přihlášení vypršelo', body: h('div', {}, h('p', {}, 'Zadejte prosím znovu heslo. Rozpracované změny zůstanou zachované.'), inp), actions: [{ label: 'Zrušit', value: null }, { label: 'Přihlásit', cls: 'btn-primary', value: () => inp.value }] });
  if (!pw) return false;
  try { const r = await api('/login', { method: 'POST', body: JSON.stringify({ password: pw }) }); S.sess = r.token; saveSess(); return true; }
  catch (e) { toast('Přihlášení se nepodařilo', e.message, 'err'); return false; }
}

/* ---------------------------------------------------------------- data */
async function loadAll() {
  const keys = Object.keys(FILES);
  const res = await Promise.all(keys.map((k) => readFile(FILES[k]).then(JSON.parse)));
  keys.forEach((k, i) => { S.D[k] = res[i]; });
  snapshot();
}
function snapshot(keys = Object.keys(FILES)) { keys.forEach((k) => { S.snap[k] = JSON.stringify(S.D[k]); }); }
const dirtyKeys = () => Object.keys(FILES).filter((k) => S.D[k] && JSON.stringify(S.D[k]) !== S.snap[k]);
const changed = debounce(() => updateSavebar(), 100);
window.addEventListener('beforeunload', (e) => { if (dirtyKeys().length) { e.preventDefault(); e.returnValue = ''; } });

function validate() {
  const T = S.D.texty;
  if (!String(T.hero.nadpis || '').trim()) return 'Hlavní nadpis na úvodní stránce nesmí být prázdný.';
  for (const g of S.D.galerie) if (!g.foto) return 'Ve fotogalerii je položka bez fotky.';
  const k = S.D.site.kontakt || {};
  if (k.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(k.email)) return 'E-mail v Kontaktech nevypadá správně.';
  return null;
}
async function saveAll() {
  const keys = dirtyKeys();
  if (!keys.length || S.saving) return;
  const err = validate(); if (err) return toast('Nejde uložit', err, 'err');
  S.saving = true; updateSavebar();
  const bar = h('div.progress-line'); document.body.append(bar);
  try {
    const keys2 = dirtyKeys();
    if (keys2.includes('site')) {   // technická pole (adresa, doména, formulář) nastavujeme my – vzít aktuální z repozitáře
      const cur = JSON.parse(await readFile(FILES.site));
      ['slug', 'url', 'base', 'domena', 'navrh', 'formular', 'nav', 'lang', 'typ', 'og_image', 'theme_color', 'logo'].forEach((k) => { if (k in cur) S.D.site[k] = cur[k]; });
    }
    const files = keys2.map((k) => ({ path: FILES[k], content: JSON.stringify(S.D[k], null, k === 'site' ? 2 : 1) + '\n' }));
    const used = JSON.stringify(S.D);
    const imgs = Object.keys(S.pending).filter((p) => used.includes(p));
    imgs.forEach((p) => files.push({ path: p, b64: S.pending[p] }));
    const sha = await commit(files, keys2.map((k) => LABEL[k]).join(', ') + (imgs.length ? ` (+${imgs.length} foto)` : ''));
    imgs.forEach((p) => delete S.pending[p]);
    snapshot(keys2);
    toast('Uloženo', 'Změny se na webu objeví přibližně za minutu.', 'ok');
    watchPublish(sha);
  } catch (e) { toast('Uložení se nepodařilo', e.message, 'err'); }
  finally { S.saving = false; bar.remove(); updateSavebar(); }
}
function discard() { dirtyKeys().forEach((k) => { S.D[k] = JSON.parse(S.snap[k]); }); updateSavebar(); route(); toast('Změny zahozeny'); }

/* zverejnenie — čaká, kým version.json na webe obsahuje nový commit */
let pubTimer = null;
function setPub(state, text) { const el = $('.pub'); if (el) { el.className = 'pub ' + state; el.innerHTML = `<i></i><span>${esc(text)}</span>`; } }
function watchPublish(sha) {
  localStorage.setItem(SK + '_pub', JSON.stringify({ sha, t: Date.now() }));
  clearInterval(pubTimer); setPub('busy', 'Zveřejňuji změny…');
  const t0 = Date.now();
  pubTimer = setInterval(async () => {
    try {
      const v = await fetch(CFG.site + 'version.json?t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json());
      if (v.sha === sha) { clearInterval(pubTimer); localStorage.removeItem(SK + '_pub'); setPub('', 'Web je aktuální'); toast('Změny jsou na webu', 'Web byl právě aktualizován.', 'ok'); S.lib = null; return; }
    } catch {}
    if (Date.now() - t0 > 8 * 60000) { clearInterval(pubTimer); setPub('warn', 'Zveřejnění trvá déle'); }
  }, 6000);
}
function initPub() { const p = JSON.parse(localStorage.getItem(SK + '_pub') || 'null'); if (p && Date.now() - p.t < 10 * 60000) watchPublish(p.sha); else setPub('', 'Web je aktuální'); }

/* ---------------------------------------------------------------- fotky */
async function compress(file, max = 1920) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { throw new Error(`Soubor „${file.name}“ nelze načíst. Použijte fotku JPG, PNG nebo WebP (fotky z iPhonu ve formátu HEIC nejdřív uložte jako JPG).`); }
  const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.84));
  if (!blob || blob.type !== 'image/webp') throw new Error('Tento prohlížeč neumí fotku převést. Zkuste prosím Chrome, Safari nebo Edge.');
  return { blob, w: c.width, h: c.height };
}
async function upload(file, hint, max) {
  const { blob } = await compress(file, max);
  const d = new Date();
  const name = (slugify(hint) || slugify(file.name.replace(/\.[^.]+$/, '')) || 'foto').slice(0, 40);
  const path = `img/uploads/${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}/${name}-${uid()}.webp`;
  S.pending[path] = b64e(await blob.arrayBuffer());
  S.preview[path] = URL.createObjectURL(blob);
  return path;
}
async function library() {
  if (!S.lib) { try { S.lib = await fetch(CFG.site + 'admin/images.json?t=' + Date.now()).then((r) => r.json()); } catch { S.lib = []; } }
  return [...Object.keys(S.pending), ...S.lib.filter((p) => !/^(logo|prijimac|og)\./.test(p))];
}
async function pickFromLibrary(title = 'Vybrat fotku z webu') {
  const list = await library();
  return new Promise((resolve) => {
    let done = false;
    const grid = h('div.lib', {}, list.map((p) => h('button', { type: 'button', onclick: () => { done = true; resolve(p); document.querySelector('.modal-bg')?.remove(); } }, h('img', { src: imgSrc(p), loading: 'lazy', alt: '' }))));
    modal({ title, body: grid, actions: [{ label: 'Zavřít', value: null }] }).then(() => { if (!done) resolve(null); });
  });
}
function pickFile(multiple) {
  return new Promise((resolve) => {
    const inp = h('input', { type: 'file', accept: 'image/*', multiple: multiple || null, hidden: true, onchange: () => { resolve([...inp.files]); inp.remove(); } });
    document.body.append(inp); inp.click();
    setTimeout(() => inp.remove(), 120000);
  });
}

/* ---------------------------------------------------------------- polia formulárov */
const bump = () => changed();
function fText(obj, key, label, o = {}) {
  const inp = o.multi
    ? h('textarea', { rows: o.rows || 4, placeholder: o.ph || '', oninput: (e) => { obj[key] = e.target.value; bump(); o.on?.(); } })
    : h('input', { type: o.type || 'text', placeholder: o.ph || '', inputmode: o.inputmode, autocomplete: 'off', oninput: (e) => { obj[key] = e.target.value; bump(); o.on?.(); } });
  inp.value = obj[key] ?? '';
  return h('label.field', {}, h('span', {}, label), inp, o.hint ? h('small', {}, o.hint) : null);
}
/** jedna fotka: obj[key] */
function fImage(obj, key, label, hint = '', o = {}) {
  const prev = h('img.prev', { src: imgSrc(obj[key]), alt: '' });
  const set = (p) => { obj[key] = p; prev.src = imgSrc(p); bump(); o.on?.(); };
  return h('div.field', {}, h('span', {}, label),
    h('div.img-field', {}, prev, h('div.acts', {},
      h('button.btn.btn-sm', { type: 'button', onclick: async () => {
        const [f] = await pickFile(false); if (!f) return;
        try { set(await upload(f, hint)); toast('Fotka připravena', 'Na web se nahraje po uložení.'); } catch (er) { toast('Fotku se nepodařilo načíst', er.message, 'err'); }
      }, html: IC.upload + 'Nahrát novou' }),
      h('button.btn.btn-sm.btn-ghost', { type: 'button', onclick: async () => { const p = await pickFromLibrary(); if (p) set(p); }, html: IC.image + 'Vybrat z webu' }),
      o.removable && obj[key] ? h('button.btn.btn-sm.btn-ghost', { type: 'button', onclick: () => { set(''); o.rerender?.(); }, html: IC.trash + 'Bez fotky' }) : null)),
    o.hint ? h('small', {}, o.hint) : null);
}
/** zoznam položiek s rozbaľovaním, radením a mazaním; o.sync() po pridaní/zmazaní/presune */
function fList(arr, o) {
  const wrap = h('div');
  const mut = (fn) => { fn(); o.sync?.(); bump(); };
  const render = (openIdx = -1) => {
    wrap.replaceChildren();
    const items = h('div.items');
    if (!arr.length) items.append(h('p.empty', {}, o.empty || 'Zatím tu nic není.'));
    arr.forEach((it, i) => {
      const title = h('b'), sub = h('small'), thumb = o.thumb ? h('img.thumb.cover', { alt: '' }) : null;
      const refresh = () => { title.textContent = o.title(it) || '(bez názvu)'; sub.textContent = o.sub ? o.sub(it) : ''; if (thumb) thumb.src = imgSrc(o.thumb(it)); };
      const body = h('div.item-body');
      let built = false;
      const el = h('div.item');
      const toggle = () => { if (!built) { o.body(it, body, refresh); built = true; } el.classList.toggle('open'); };
      const head = h('div.item-head', {},
        thumb, h('div.t', { onclick: toggle }, title, sub),
        h('div.item-tools', {},
          h('button.btn.btn-icon.btn-ghost', { type: 'button', title: 'Posunout výš', 'aria-label': 'Posunout výš', disabled: i === 0, onclick: () => { mut(() => arr.splice(i - 1, 0, arr.splice(i, 1)[0])); render(); }, html: IC.up }),
          h('button.btn.btn-icon.btn-ghost', { type: 'button', title: 'Posunout níž', 'aria-label': 'Posunout níž', disabled: i === arr.length - 1, onclick: () => { mut(() => arr.splice(i + 1, 0, arr.splice(i, 1)[0])); render(); }, html: IC.down }),
          h('button.btn.btn-icon.btn-ghost', { type: 'button', title: 'Smazat', 'aria-label': 'Smazat', onclick: async () => { if (await confirmDlg('Smazat položku?', `„${o.title(it) || 'bez názvu'}“ bude odstraněna (po uložení).`)) { mut(() => arr.splice(i, 1)); render(); } }, html: IC.trash }),
          h('button.btn.btn-icon.btn-ghost.chev', { type: 'button', 'aria-label': 'Rozbalit', onclick: toggle, html: IC.chev })));
      el.append(head, body); items.append(el); refresh();
      if (i === openIdx) toggle();
    });
    wrap.append(...[items, o.make ? h('button.btn.add', { type: 'button', onclick: () => { mut(() => arr.push(o.make())); render(arr.length - 1); }, html: IC.plus + (o.addLabel || 'Přidat') }) : null].filter(Boolean));
  };
  render(o.open ?? -1);
  return wrap;
}
/** zoznam textov (odstavce, parametre) */
function fStrList(arr, label, o = {}) {
  const box = h('div.field', {}, h('span', {}, label));
  const list = h('div');
  const render = () => {
    list.replaceChildren(...arr.map((v, i) => {
      const inp = o.multi ? h('textarea', { rows: o.rows || 3 }) : h('input', { type: 'text', placeholder: o.ph || '' });
      inp.value = v; inp.addEventListener('input', (e) => { arr[i] = e.target.value; bump(); o.on?.(); });
      return h('div', { style: 'display:flex;gap:.4rem;align-items:flex-start;margin-bottom:.45rem' }, inp,
        h('button.btn.btn-icon.btn-ghost', { type: 'button', 'aria-label': 'Posunout výš', disabled: i === 0, onclick: () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); bump(); o.on?.(); render(); }, html: IC.up }),
        h('button.btn.btn-icon.btn-ghost', { type: 'button', 'aria-label': 'Smazat', onclick: () => { arr.splice(i, 1); bump(); o.on?.(); render(); }, html: IC.trash }));
    }), h('button.btn.btn-sm', { type: 'button', onclick: () => { arr.push(''); bump(); render(); }, html: IC.plus + (o.add || 'Přidat') }));
  };
  render(); box.append(...[list, o.hint ? h('small', {}, o.hint) : null].filter(Boolean));
  return box;
}

/* ---------------------------------------------------------------- pohľady */
const NAV = [
  ['', 'Přehled', 'home'], ['poptavky', 'Poptávky', 'inbox'], ['-'],
  ['uvod', 'Úvodní stránka', 'text', 'texty'], ['cenik', 'Ceník skupin', 'bolt', 'cenik'], ['individualni', 'Ceník individuální', 'users', 'cenik'],
  ['silvestr', 'Silvestr', 'info', 'texty'], ['galerie', 'Fotogalerie', 'image', 'galerie'],
  ['kontakty', 'Kontakty', 'phone', 'site'], ['-'],
  ['navod', 'Návod', 'help'], ['nastaveni', 'Heslo a odhlášení', 'gear'],
];
const view = (title, lead, ...kids) => { const m = $('main.view'); m.replaceChildren(h('div.view-head', {}, h('h1', {}, title), lead ? h('p', {}, lead) : null), ...kids); window.scrollTo(0, 0); };
const card = (title, hint, ...kids) => h('section.card', {}, title ? h('h2', {}, title) : null, hint ? h('p.hint', {}, hint) : null, ...kids);
const row2 = (...kids) => h('div.row2', {}, ...kids);
const H3 = (t) => h('h3', { style: 'margin:1.2rem 0 .4rem;font-weight:700;font-size:1.1rem' }, t);

/** tabulka: sloupce (záhlaví) + řádky (pole textů); přidat / smazat / přesunout řádek */
function fTable(t, label) {
  const wrap = h('div.field');
  const render = () => {
    const cols = t.sloupce.length;
    const head = h('tr', {}, ...t.sloupce.map((c, i) => h('th', {}, h('input', { type: 'text', value: c, 'aria-label': 'Záhlaví sloupce', oninput: (e) => { t.sloupce[i] = e.target.value; bump(); } }))), h('th.tools'));
    const body = t.radky.map((r, ri) => h('tr', {}, ...Array.from({ length: cols }, (_, ci) => h('td', {}, h('input', { type: 'text', value: r[ci] ?? '', 'aria-label': t.sloupce[ci] || 'Buňka', oninput: (e) => { r[ci] = e.target.value; bump(); } }))),
      h('td.tools', {},
        h('button.btn.btn-icon.btn-ghost', { type: 'button', 'aria-label': 'Posunout výš', disabled: ri === 0, onclick: () => { t.radky.splice(ri - 1, 0, t.radky.splice(ri, 1)[0]); bump(); render(); }, html: IC.up }),
        h('button.btn.btn-icon.btn-ghost', { type: 'button', 'aria-label': 'Smazat řádek', onclick: () => { t.radky.splice(ri, 1); bump(); render(); }, html: IC.trash }))));
    wrap.replaceChildren(label ? h('span', {}, label) : null, h('div.tbl-wrap', {}, h('table.tbl', {}, h('thead', {}, head), h('tbody', {}, ...body))),
      h('button.btn.btn-sm', { type: 'button', onclick: () => { t.radky.push(Array(cols).fill('')); bump(); render(); }, html: IC.plus + 'Přidat řádek' }));
  };
  render();
  return wrap;
}

function vDash() {
  const newBox = h('div');
  const tiles = [['poptavky', 'Poptávky', 'inbox', 'Poptávky odeslané z webu'], ['uvod', 'Úvodní stránka', 'text', 'Nadpis, text, ceny pro skupiny'], ['cenik', 'Ceník skupin', 'bolt', 'Školy, výcviky, soustředění, domovy'], ['individualni', 'Ceník individuální', 'users', 'Ceny, slevy, storno'],
    ['silvestr', 'Silvestr', 'info', 'Nabídka silvestrovského pobytu'], ['galerie', 'Fotogalerie', 'image', 'Fotky hotelu'], ['kontakty', 'Kontakty', 'phone', 'Telefon, e-mail, adresa']]
    .map(([id, label, ic, sub]) => h('a.tile', { href: '#/' + id }, h('span', { html: IC[ic] }), h('b', {}, label), h('small', {}, sub)));
  view('Dobrý den 👋', 'Tady upravujete texty, ceníky, fotogalerii a kontakty webu. Změny uložíte tlačítkem „Uložit změny“ dole, na webu se objeví zhruba za minutu.',
    newBox, h('div.tiles', {}, tiles),
    card('Jak to funguje', null, h('div.help', { html: '<ol><li>Vlevo (na mobilu v menu ☰) vyberte, co chcete upravit.</li><li>Přepište text, upravte cenu nebo nahrajte fotky.</li><li>Dole se objeví lišta – klikněte na <b>Uložit změny</b>.</li><li>Nahoře uvidíte „Zveřejňuji změny…“ a za chvíli „Web je aktuální“.</li></ol>' })),
    card('Co zde upravit nejde', null, h('p', {}, 'Stránky Pobyty, Ubytování, Okolí a Poptávka a dlaždice na úvodní stránce mají zatím text napevno. Jejich změnu nám stačí napsat e-mailem.')),
    h('a.btn.btn-dark', { href: CFG.site, target: '_blank', rel: 'noopener', style: 'margin-top:.5rem', html: IC.ext + 'Otevřít web' }));
  loadForms().then((d) => { const n = d.forms.filter((f) => f.s === 'nova').length; if (n) newBox.replaceChildren(h('a.alert', { href: '#/poptavky' }, h('span', { html: IC.inbox }), h('b', {}, `${n} ${plural(n, 'nová poptávka', 'nové poptávky', 'nových poptávek')}`), h('small', {}, 'Zobrazit →'))); }).catch(() => {});
}

function vUvod() {
  const T = S.D.texty; const H = T.hero, SK_ = T.skupiny, D = T.domu_ceny;
  view('Úvodní stránka', 'Texty na hlavní stránce webu.',
    card('Úvodní obrazovka', null, fText(H, 'stitek', 'Řádek nad nadpisem'), fText(H, 'nadpis', 'Hlavní nadpis'), fText(H, 'text', 'Text pod nadpisem', { multi: true, rows: 4 }),
      fStrList(H.pata, 'Krátké údaje pod textem', { add: 'Přidat údaj', ph: 'např. 140 lůžek' })),
    card('Hotel pro skupiny', null, fText(SK_, 'nadpis', 'Nadpis'), fText(SK_, 'text', 'Text', { multi: true, rows: 5 })),
    card('Ceny pro skupiny', 'Tři karty s cenami na úvodní stránce.', fText(D, 'nadpis', 'Nadpis'), fText(D, 'perex', 'Úvodní věta', { multi: true, rows: 2 }),
      ...D.karty.map((k, i) => h('div.sub', {}, H3('Karta ' + (i + 1)), row2(fText(k, 'stitek', 'Štítek'), fText(k, 'nadpis', 'Nadpis')), row2(fText(k, 'cena', 'Cena'), fText(k, 'cena_popis', 'Popis ceny')), fText(k, 'text', 'Text', { multi: true, rows: 3 }))),
      fText(D, 'poznamka', 'Poznámka pod kartami', { multi: true, rows: 2 })),
    card('Check-in a check-out', null, h('div', {}, fText(T, 'checkin', 'Text', { multi: true, rows: 2 }))));
}

function vCenik() {
  const C = S.D.cenik;
  view('Ceník skupin', 'Ceny pro školy, výcviky, soustředění a domovy. Záhlaví sloupců i řádky můžete měnit.',
    card('Úvod', null, fText(C, 'uvod', 'Text nad ceníkem', { multi: true, rows: 3 })),
    ...C.tabulky.map((t) => card(t.nadpis || t.stitek, null, row2(fText(t, 'stitek', 'Štítek'), fText(t, 'nadpis', 'Nadpis')), fTable(t), fText(t, 'poznamka', 'Poznámka pod tabulkou', { multi: true, rows: 2 }))),
    card('Program a storno podmínky', null, fText(C.storno, 'nadpis', 'Nadpis'), fStrList(C.storno.texty, 'Odstavce', { multi: true, rows: 4, add: 'Přidat odstavec' }), fTable(C.storno)));
}

function vIndiv() {
  const I_ = S.D.cenik.individualni;
  view('Ceník individuální', 'Ceník pro jednotlivce a rodiny.',
    card('Úvod', null, fText(I_, 'uvod', 'Text nad ceníkem', { multi: true, rows: 3 })),
    card('Ceny', null, fTable(I_.ceny)),
    card('Slevy', null, fStrList(I_.slevy, 'Slevy', { multi: true, rows: 2, add: 'Přidat slevu' }), fText(I_, 'slevy_poznamka', 'Poznámka ke slevám', { multi: true, rows: 2 })),
    card('Storno podmínky', null, fTable(I_.storno), fText(I_.storno, 'text', 'Text pod tabulkou', { multi: true, rows: 3 })),
    card('Check-in', null, fText(I_, 'checkin', 'Text', { multi: true, rows: 2 })));
}

function vSilvestr() {
  const V = S.D.texty.silvestr;
  view('Silvestr', 'Stránka se silvestrovským pobytem.',
    card('Úvod', null, fText(V, 'stitek', 'Termín nad nadpisem'), fText(V, 'nadpis', 'Nadpis'), fText(V, 'uvod', 'Úvodní věta', { multi: true, rows: 2 }), fStrList(V.odstavce, 'Odstavce', { multi: true, rows: 4, add: 'Přidat odstavec' }), fStrList(V.body, 'Odrážky', { add: 'Přidat odrážku' })),
    card('Cena', null, row2(fText(V, 'cena_nadpis', 'Cena (velký nadpis)'), fText(V, 'cena_popis', 'Popis ceny')), fTable({ sloupce: ['Položka', 'Cena'].slice(0, (V.cena_radky[0] || []).length || 2), radky: V.cena_radky }, 'Další ceny'), fText(V, 'cena_text', 'Text pod cenami', { multi: true, rows: 3 })));
}

function vGalerie() {
  const G = S.D.galerie;
  const wrap = h('div');
  const render = () => {
    const grid = h('div.photos');
    G.forEach((p, i) => {
      const alt = h('textarea', { rows: 2, placeholder: 'Co je na fotce (pro Google a nevidomé)', 'aria-label': 'Popis fotky', oninput: (e) => { p.alt = e.target.value; bump(); } }); alt.value = p.alt || '';
      grid.append(h('div.photo', {}, h('img', { src: imgSrc(p.foto), alt: '', title: 'Vyměnit fotku', onclick: () => replace(i) }),
        h('div.ph-tools', {},
          h('button.btn.btn-icon.btn-ghost', { type: 'button', title: 'Posunout dopředu', 'aria-label': 'Posunout dopředu', disabled: i === 0, onclick: () => { G.splice(i - 1, 0, G.splice(i, 1)[0]); bump(); render(); }, html: IC.left }),
          h('button.btn.btn-icon.btn-ghost', { type: 'button', title: 'Smazat fotku', 'aria-label': 'Smazat fotku', onclick: async () => { if (await confirmDlg('Smazat fotku?', 'Fotka zmizí z galerie (po uložení).')) { G.splice(i, 1); bump(); render(); } }, html: IC.trash }),
          h('button.btn.btn-icon.btn-ghost', { type: 'button', title: 'Posunout dozadu', 'aria-label': 'Posunout dozadu', disabled: i === G.length - 1, onclick: () => { G.splice(i + 1, 0, G.splice(i, 1)[0]); bump(); render(); }, html: IC.right })),
        alt));
    });
    grid.append(h('button.photo-add', { type: 'button', onclick: async () => {
      const fs = await pickFile(true); let n = 0;
      for (const f of fs) { try { G.push({ foto: await upload(f, 'galerie'), alt: '' }); n++; } catch (er) { toast('Fotku se nepodařilo načíst', er.message, 'err'); } }
      if (n) { bump(); render(); toast(n === 1 ? 'Fotka přidána' : `Přidáno fotek: ${n}`, 'Doplňte popis a uložte změny.'); }
    }, html: IC.upload + '<span>Nahrát fotky<br><small>můžete vybrat více najednou</small></span>' }));
    grid.append(h('button.photo-add', { type: 'button', onclick: async () => { const p = await pickFromLibrary(); if (p) { G.push({ foto: p, alt: '' }); bump(); render(); } }, html: IC.image + '<span>Vybrat z fotek na webu</span>' }));
    wrap.replaceChildren(grid);
  };
  const replace = async (i) => {
    const r = await modal({ title: 'Vyměnit fotku', body: '<p>Nahrajte novou fotku, nebo vyberte jednu z fotek, které už na webu jsou. Popis zůstane.</p>', actions: [{ label: 'Zrušit', value: null }, { label: 'Vybrat z webu', value: 'lib' }, { label: 'Nahrát novou', cls: 'btn-primary', value: 'up' }] });
    if (r === 'lib') { const p = await pickFromLibrary(); if (p) { G[i].foto = p; bump(); render(); } }
    if (r === 'up') { const [f] = await pickFile(false); if (!f) return; try { G[i].foto = await upload(f, 'galerie'); bump(); render(); toast('Fotka vyměněna', 'Na web se nahraje po uložení.'); } catch (er) { toast('Fotku se nepodařilo načíst', er.message, 'err'); } }
  };
  render();
  view('Fotogalerie', 'Kliknutím na fotku ji vyměníte, šipkami změníte pořadí. Fotky se při nahrání samy zmenší.', card('Fotky', 'Popis fotky se na webu nezobrazuje, slouží Googlu a nevidomým návštěvníkům.', wrap));
}

function vKontakty() {
  const s = S.D.site; const k = s.kontakt; k.adresa = k.adresa || {};
  view('Kontakty', 'Telefon, e-mail a adresa se zobrazují v hlavičce, patičce a na stránce Poptávka. Poptávky z formuláře se ukládají do administrace (sekce Poptávky)' + (S.forms?.to ? ' a upozornění chodí e-mailem na ' + S.forms.to : '') + '. Kam chodí upozornění, nastavujeme my – stačí nám napsat.',
    card('Hlavní kontakt', null, row2(fText(k, 'telefon', 'Telefon', { type: 'tel' }), fText(k, 'email', 'E-mail', { type: 'email' })),
      fText(k.adresa, 'ulice', 'Adresa (ulice a číslo)'), row2(fText(k.adresa, 'psc', 'PSČ'), fText(k.adresa, 'mesto', 'Obec'))),
    card('Odkazy na navigaci', null, fText(s, 'mapa', 'Odkaz na Google Mapy', { type: 'url' }), fText(s, 'waze', 'Odkaz na Waze', { type: 'url' })),
    card('Web', null, fText(s, 'cenove_rozpeti', 'Cenové rozpětí (pro Google)'), fText(s, 'popis', 'Popis webu (Google, sdílení na sociálních sítích)', { multi: true, rows: 3, hint: 'Ideálně 120–160 znaků.' })));
}

/* ---------------------------------------------------------------- poptávky (backend KV) */
async function loadForms(force) { if (!S.forms || force) S.forms = await api('/forms'); return S.forms; }
const fmtD = (iso) => { try { return new Date(iso).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
async function vPoptavky() {
  const list = h('div', {}, h('p.empty', {}, 'Načítám…'));
  const filt = { s: '' };
  view('Poptávky', 'Všechno, co návštěvníci odešlou z formuláře na webu. Kliknutím otevřete detail, změníte stav nebo připíšete poznámku.',
    h('div', { style: 'display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center' },
      ...[['', 'Vše'], ['nova', 'Nové'], ['potvrzena', 'Potvrzené'], ['vyrizena', 'Vyřízené'], ['zrusena', 'Zrušené']].map(([v, t]) => h('button.btn.btn-sm' + (v === '' ? '.btn-dark' : '.btn-ghost'), { type: 'button', 'data-f': v, onclick: (e) => { filt.s = v; e.target.parentNode.querySelectorAll('[data-f]').forEach((b) => { b.className = 'btn btn-sm ' + (b === e.target ? 'btn-dark' : 'btn-ghost'); }); render(); } }, t)),
      h('button.btn.btn-sm', { type: 'button', style: 'margin-left:auto', onclick: async () => { await loadForms(true).then((x) => { D = x; }).catch((e) => toast('Nepodařilo se načíst', e.message, 'err')); render(); }, html: IC.refresh + 'Obnovit' })),
    card(null, null, list));
  let D;
  const render = () => {
    if (!D) return;
    const STAT = D.statuses || {};
    const rows = D.forms.filter((f) => !filt.s || f.s === filt.s);
    if (!rows.length) return list.replaceChildren(h('p.empty', {}, D.forms.length ? 'V tomto stavu nic není.' : 'Zatím žádné poptávky. Jakmile někdo odešle formulář na webu, objeví se tady.'));
    list.replaceChildren(h('div.forms', {}, rows.map((f) => h('button.frow' + (f.s === 'nova' ? '.new' : ''), { type: 'button', onclick: () => detail(f.key) },
      h('span.fst.st-' + f.s, {}, STAT[f.s] || f.s), h('b', {}, f.n || '(bez jména)'),
      h('span', {}, 'Poptávka'), h('span', {}, f.w ? 'termín ' + f.w : ''), h('small', {}, fmtD(f.d))))));
  };
  const detail = async (key) => {
    let r; try { r = await api('/forms?key=' + encodeURIComponent(key)); } catch (e) { return toast('Nepodařilo se načíst', e.message, 'err'); }
    const st = { status: r.status, note: r.note || '' };
    const body = h('div', {},
      h('table.ftable', {}, h('tbody', {},
        ...r.fields.map(([k, v]) => h('tr', {}, h('th', {}, k), h('td', {}, k === 'E-mail' ? h('a', { href: 'mailto:' + v }, v) : /^Telefon/.test(k) ? h('a', { href: 'tel:' + String(v).replace(/\s/g, '') }, v) : v))),
        h('tr', {}, h('th', {}, 'Odesláno'), h('td', {}, fmtD(r.created))))),
      fSelect(st, 'status', 'Stav', Object.entries(S.forms.statuses)), fText(st, 'note', 'Poznámka (vidíte jen vy)', { multi: true, rows: 3 }));
    const res = await modal({ title: r.typeLabel || 'Poptávka', body, actions: [{ label: 'Smazat', value: 'del', cls: 'btn-ghost' }, { label: 'Zavřít', value: null }, { label: 'Uložit', cls: 'btn-primary', value: 'save' }] });
    try {
      if (res === 'save') { await api('/forms', { method: 'POST', body: JSON.stringify({ key, status: st.status, note: st.note }) }); toast('Uloženo', '', 'ok'); }
      if (res === 'del' && await confirmDlg('Smazat poptávku?', 'Poptávka bude z přehledu trvale odstraněna.')) { await api('/forms', { method: 'POST', body: JSON.stringify({ key, delete: true }) }); toast('Smazáno'); }
      if (res) { D = await loadForms(true); render(); }
    } catch (e) { toast('Nepodařilo se uložit', e.message, 'err'); }
  };
  try { D = await loadForms(true); render(); } catch (e) { list.replaceChildren(h('p.empty', {}, 'Poptávky se nepodařilo načíst: ' + e.message)); }
}

function vNavod() {
  view('Návod', null,
    card('Změnit text nebo cenu', null, h('div.help', { html: '<ol><li>Vyberte část webu v menu vlevo.</li><li>Přepište text nebo cenu v tabulce.</li><li>Dole klikněte na <b>Uložit změny</b>.</li></ol>' })),
    card('Přidat fotky do fotogalerie', null, h('div.help', { html: '<ol><li>Otevřete <b>Fotogalerie</b> a klikněte na <b>Nahrát fotky</b> (můžete vybrat více fotek najednou, i z mobilu).</li><li>Šipkami změníte pořadí, košem fotku smažete, kliknutím na fotku ji vyměníte.</li><li>Dole klikněte na <b>Uložit změny</b>.</li></ol>' })),
    card('Poptávky', null, h('div.help', { html: '<ol><li>Poptávky z webu najdete v sekci <b>Poptávky</b>.</li><li>Kliknutím otevřete detail, nastavíte stav a můžete si připsat poznámku.</li><li>Odpovězte e-mailem nebo telefonem – kontakt je v detailu.</li></ol>' })),
    card('Něco nejde?', null, h('p', {}, 'Napište nám na info.webhunter@email.cz, rádi pomůžeme.')));
}

function vSettings() {
  const f = { old: '', pw: '', pw2: '' };
  const msg = h('p', { style: 'color:var(--err);font-size:.9rem;min-height:1.2rem' });
  const pwInput = (key, label, ac) => h('label.field', {}, h('span', {}, label), h('input', { type: 'password', autocomplete: ac, oninput: (e) => { f[key] = e.target.value; } }));
  view('Heslo a odhlášení', null,
    card('Změnit heslo', 'Po změně hesla se odhlásí všechna ostatní zařízení. Heslo musí mít alespoň 8 znaků.',
      pwInput('old', 'Současné heslo', 'current-password'), pwInput('pw', 'Nové heslo', 'new-password'), pwInput('pw2', 'Nové heslo znovu', 'new-password'), msg,
      h('button.btn.btn-primary', { type: 'button', onclick: async (e) => {
        msg.textContent = '';
        if (f.pw.length < 8) return (msg.textContent = 'Nové heslo musí mít alespoň 8 znaků.');
        if (f.pw !== f.pw2) return (msg.textContent = 'Nová hesla se neshodují.');
        e.target.disabled = true;
        try { const r = await api('/password', { method: 'POST', body: JSON.stringify({ old: f.old, password: f.pw }) }); S.sess = r.token; saveSess(); toast('Heslo změněno', 'Příště se přihlaste novým heslem.', 'ok'); route(); }
        catch (er) { msg.textContent = er.message; } finally { e.target.disabled = false; }
      } }, 'Uložit nové heslo')),
    card('Odhlásit se', null, h('button.btn', { type: 'button', onclick: logout, html: IC.logout + 'Odhlásit' })));
}

/* ---------------------------------------------------------------- rám */
function renderShell() {
  const nav = h('nav.nav', { id: 'nav', 'aria-label': 'Sekce administrace' },
    h('button.btn.btn-icon.btn-ghost.nav-close', { type: 'button', 'aria-label': 'Zavřít menu', onclick: () => nav.classList.remove('open'), html: IC.x }),
    NAV.map(([id, label, ic, key]) => id === '-' ? h('hr') : h('a', { href: '#/' + id, 'data-id': id, 'data-key': key || '', onclick: () => nav.classList.remove('open'), html: IC[ic] + `<span>${esc(label)}</span>` })),
    h('hr'), h('a', { href: CFG.site, target: '_blank', rel: 'noopener', html: IC.ext + '<span>Zobrazit web</span>' }));
  const bar = h('div.savebar', { id: 'savebar' }, h('span', {}, ''),
    h('button.btn.btn-ghost.btn-sm', { type: 'button', onclick: async () => { if (await confirmDlg('Zahodit změny?', 'Neuložené úpravy se ztratí.', 'Zahodit')) discard(); } }, 'Zahodit'),
    h('button.btn.btn-primary', { type: 'button', onclick: saveAll }, 'Uložit změny'));
  $('#app').replaceChildren(h('div.shell', {},
    h('header.top', {},
      h('button.btn.btn-icon.btn-ghost.menu-btn', { type: 'button', 'aria-label': 'Menu', onclick: () => nav.classList.add('open'), html: IC.menu }),
      h('a.top-logo.brand', { href: '#/', html: LOGO + '<span>Administrace</span>' }),
      h('div.pub'), h('a.btn.btn-sm', { href: CFG.site, target: '_blank', rel: 'noopener', html: IC.eye + '<span>Web</span>' })),
    h('div.layout', {}, nav, h('main.view'))), bar);
  initPub();
}
function updateSavebar() {
  const keys = dirtyKeys(); const bar = $('#savebar'); if (!bar) return;
  bar.classList.toggle('on', keys.length > 0 || S.saving);
  bar.querySelector('span').textContent = S.saving ? 'Ukládám…' : `Neuložené změny: ${keys.map((k) => LABEL[k]).join(', ')}`;
  bar.querySelectorAll('button').forEach((b) => { b.disabled = S.saving; });
  document.querySelectorAll('.nav a[data-key]').forEach((a) => { a.querySelector('.dot')?.remove(); if (keys.includes(a.dataset.key)) a.append(h('i.dot')); });
}
const VIEWS = { '': vDash, poptavky: vPoptavky, uvod: vUvod, cenik: vCenik, individualni: vIndiv, silvestr: vSilvestr, galerie: vGalerie, kontakty: vKontakty, navod: vNavod, nastaveni: vSettings };
function route() {
  const [id, arg] = location.hash.replace(/^#\/?/, '').split('/');
  (VIEWS[id] || vDash)(arg);
  document.querySelectorAll('.nav a[data-id]').forEach((a) => a.classList.toggle('on', a.dataset.id === (VIEWS[id] ? id : '')));
  updateSavebar();
}
window.addEventListener('hashchange', route);

/* ---------------------------------------------------------------- přihlášení */
function renderLogin(msg = '') {
  const inp = h('input', { type: 'password', id: 'pw', autocomplete: 'current-password', placeholder: 'Heslo', required: true });
  const err = h('p.login-err', {}, msg);
  const btn = h('button.btn.btn-primary', { type: 'submit' }, 'Přihlásit se');
  const form = h('form.login-card', { onsubmit: async (e) => {
    e.preventDefault(); err.textContent = ''; btn.disabled = true; btn.textContent = 'Přihlašuji…';
    try {
      const r = await api('/login', { method: 'POST', body: JSON.stringify({ password: inp.value }) });
      S.sess = r.token; saveSess(); await start();
    } catch (er) { err.textContent = er.message; btn.disabled = false; btn.textContent = 'Přihlásit se'; inp.select(); }
  } },
  h('div.brand', { html: LOGO }), h('h1', {}, 'Administrace webu'), h('p', {}, 'Přihlaste se heslem.'),
  h('label.field', {}, h('span', {}, 'Heslo'), h('div.pw-wrap', {}, inp, h('button.pw-eye', { type: 'button', 'aria-label': 'Zobrazit heslo', onclick: () => { inp.type = inp.type === 'password' ? 'text' : 'password'; }, html: IC.eye }))),
  btn, err);
  $('#app').replaceChildren(h('div.login', {}, form));
  setTimeout(() => inp.focus(), 50);
}
function logout() {
  if (dirtyKeys().length && !confirm('Máte neuložené změny. Opravdu se odhlásit?')) return;
  localStorage.removeItem(SK); S.sess = null; S.D = {}; renderLogin();
}
async function start() {
  $('#app').innerHTML = `<div class="boot"><div class="brand">${LOGO}</div><span class="spin"></span></div>`;
  try { await loadAll(); } catch (e) {
    if (e.status === 401) { localStorage.removeItem(SK); S.sess = null; return renderLogin('Přihlášení vypršelo, přihlaste se prosím znovu.'); }
    return renderLogin('Obsah webu se nepodařilo načíst: ' + e.message);
  }
  renderShell(); route();
}
function boot() {
  let s = null; try { s = JSON.parse(localStorage.getItem(SK) || 'null'); } catch {}
  if (s && s.exp > Date.now()) { S.sess = s.t; start(); } else renderLogin();
}
boot();
})();
