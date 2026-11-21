/* ClientHub demo — landing, agency admin and client portal */
(function () {
  'use strict';
  const KEY = 'clienthub_demo_v1', UKEY = 'clienthub_user', PKEY = 'clienthub_prefs';
  const FORM_URL = 'https://formsubmit.co/ajax/moinseoagency@gmail.com', WA_AGENCY = '966546904384';
  const t = (k, v) => I18N.t(k, v), $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const H = 3600000, DAY = 86400000;

  /* ---------- state ---------- */
  function ls(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  let D = ls(KEY, null);
  if (!D || D.v !== 1 || Date.now() - D.seededAt > 12 * H) { D = SEED.seed(); lsSet(KEY, D); }
  let USER = ls(UKEY, null);
  const PREFS = Object.assign({ lang: null, theme: 'light' }, ls(PKEY, {}));
  const UI = { pf: '', inv: '', tab: 'active', chat: null, sidebar: false, menus: null, who: '', pnav: false };
  const save = () => lsSet(KEY, D), savePrefs = () => lsSet(PKEY, PREFS);
  (function () { let l = PREFS.lang; if (!l) { const n = (navigator.language || 'en').slice(0, 2); l = n === 'ar' ? 'ar' : n === 'ur' ? 'ur' : 'en'; } I18N.set(l); document.documentElement.dataset.theme = PREFS.theme; })();

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const L = () => I18N.lang;
  const nm = o => !o ? '' : typeof o === 'string' ? o : (o[L()] || o.en);
  const bdi = s => '<bdi>' + esc(s) + '</bdi>';
  const numF = new Intl.NumberFormat('en-US');
  const sar = n => L() === 'en' ? 'SAR ' + numF.format(Math.round(n)) : numF.format(Math.round(n)) + ' ' + t('c.sar');
  const sarH = n => bdi(sar(n));
  const dateF = (ts, o) => new Intl.DateTimeFormat(I18N.locale(), o || { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts));
  const dShort = ts => dateF(ts, { day: 'numeric', month: 'short' });
  const timeF = ts => new Intl.DateTimeFormat(L() === 'en' ? 'en-US' : I18N.locale(), { hour: 'numeric', minute: '2-digit' }).format(new Date(ts));
  function rel(ts) { const rtf = new Intl.RelativeTimeFormat(L() === 'ar' ? 'ar-u-nu-latn' : L() === 'ur' ? 'ur-u-nu-latn' : 'en', { numeric: 'auto' }); const d = (ts - Date.now()) / 1000, a = Math.abs(d); return a < 3600 ? rtf.format(Math.round(d / 60), 'minute') : a < 86400 ? rtf.format(Math.round(d / 3600), 'hour') : rtf.format(Math.round(d / 86400), 'day'); }
  const uid = p => p + Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5);
  const cli = id => D.clients.find(c => c.id === id) || { id, name: { en: '—' }, contact: { en: '—' }, color: '#999', city: 'riyadh' };
  const prj = id => D.projects.find(p => p.id === id);
  const mem = id => D.team.find(m => m.id === id) || { name: { en: '—' }, role: 'pm' };
  const pname = p => p ? t('svc.' + p.svc) : '—';
  const first = o => nm(o).replace(/^(Dr\.|د\.|ڈاکٹر)\s*/, '').split(' ')[0];
  const firstT = o => { const n = nm(o); const m = n.match(/^(Dr\.|د\.|ڈاکٹر)\s*(\S+)/); return m ? m[1] + ' ' + m[2] : n.split(' ')[0]; };
  const userName = () => (USER && USER.name) || 'Guest';
  const agency = () => (USER && USER.company) || 'ClientHub Studio';
  function avatar(name, color, size) { const n = nm(name) || '?'; const p = n.replace(/^(Dr\.|د\.|ڈاکٹر)\s*/, '').trim().split(/\s+/); const ini = (p[0][0] || '') + (p.length > 1 ? p[p.length - 1][0] : ''); let c = color; if (!c) { let h = 0; for (const ch of (name && name.en) || n) h = (h * 31 + ch.charCodeAt(0)) >>> 0; c = ['#7c3aed', '#2563eb', '#16a34a', '#f59e0b', '#ec4899', '#0ea5e9', '#ef4444', '#14b8a6'][h % 8]; } return `<span class="av ${size || ''}" style="--c:${c}">${esc(ini.toUpperCase())}</span>`; }
  const cav = (c, size) => avatar(c.name, c.color, size);
  const stTag = s => `<span class="pill st-${s}">${esc(t('st.' + s))}</span>`;
  const invTag = s => `<span class="pill iv-${s}">${esc(t('iv.' + s))}</span>`;
  const bar = (v, cls) => `<span class="pbar ${cls || ''}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></span>`;
  function toast(msg, kind) { const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.innerHTML = icon(kind === 'err' ? 'x' : 'check') + '<span>' + esc(msg) + '</span>'; $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3000); }
  function sendForm(p) { try { fetch(FORM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ _captcha: 'false', _template: 'table' }, p)) }).catch(() => {}); } catch (e) {} }
  function modal(title, body, cls) { const m = $('#modal'); m.innerHTML = `<div class="mback" data-act="closeModal"></div><div class="mbox ${cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="mhead"><h3>${esc(title)}</h3><button class="ibtn" data-act="closeModal" aria-label="${t('c.close')}">${icon('x')}</button></div><div class="mbody">${body}</div></div>`; m.classList.add('open'); document.body.classList.add('noscroll'); const f = m.querySelector('input:not([type=radio]):not([type=range]),select,textarea'); if (f && matchMedia('(pointer:fine)').matches) f.focus(); }
  function closeModal() { const m = $('#modal'); m.classList.remove('open'); m.innerHTML = ''; if (!$('#drawer.open')) document.body.classList.remove('noscroll'); }
  function drawer(html) { const d = $('#drawer'); d.innerHTML = `<div class="mback" data-act="closeDrawer"></div><aside class="dpanel">${html}</aside>`; d.classList.add('open'); document.body.classList.add('noscroll'); }
  function closeDrawer() { const d = $('#drawer'); d.classList.remove('open'); d.innerHTML = ''; document.body.classList.remove('noscroll'); }
  function log(k, v, ic) { D.activity.unshift({ k, v, at: Date.now(), ic }); D.activity = D.activity.slice(0, 40); D.notifs.unshift({ k, v, at: Date.now(), read: false }); D.notifs = D.notifs.slice(0, 30); }
  const actText = a => t(a.k, { c: a.v.c ? nm(cli(a.v.c).name) : '', amt: a.v.amt ? sar(a.v.amt) : '', p: a.v.p || '', f: a.v.f || '' });
  const logo = (txt) => `<a class="logo" href="#/" aria-label="ClientHub"><span class="lmark"><svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lgm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs><path d="M30 11.5A12 12 0 1 0 30 28.5" fill="none" stroke="url(#lgm)" stroke-width="7" stroke-linecap="round"/><circle cx="20" cy="20" r="4.5" fill="url(#lgm)"/></svg></span><b>${txt || 'ClientHub'}</b></a>`;
  function langMenu(id) { const names = { en: 'English', ar: 'العربية', ur: 'اردو' }; const open = UI.menus === id; return `<div class="dd ${open ? 'open' : ''}"><button class="langbtn" data-act="menu" data-id="${id}" aria-haspopup="true" aria-expanded="${open}">${icon('globe')}<span>${L().toUpperCase()}</span></button><div class="ddm">${['en', 'ar', 'ur'].map(l => `<button data-act="lang" data-l="${l}" class="${l === L() ? 'on' : ''}">${names[l]}</button>`).join('')}</div></div>`; }
  const paidIn = (from, to) => D.invoices.filter(i => i.status === 'paid' && i.paidAt >= from && i.paidAt < (to || Infinity)).reduce((a, i) => a + i.amount, 0);
  const openTasks = () => D.tasks.filter(k => k.status !== 'done');

  /* ================= LANDING ================= */
  function landing() {
    const feats = [['portal', 'f1', '#3b82f6'], ['message', 'f2', '#7c3aed'], ['file', 'f3', '#16a34a'], ['receipt', 'f4', '#f59e0b'], ['robot', 'f5', '#ec4899'], ['kanban', 'f6', '#0ea5e9'], ['pen', 'f7', '#8b5cf6'], ['chart', 'f8', '#14b8a6']];
    return `<header class="lhead"><div class="wrap lhead-in">${logo()}<nav class="lnav" aria-label="main">${[['home', '#top'], ['features', '#features'], ['solutions', '#how'], ['tour', '#tour'], ['pricing', '#pricing'], ['contact', '#contact']].map(([k, h]) => `<a href="${h}" data-act="scroll">${t('n.' + k)}</a>`).join('')}</nav>
      <div class="lacts">${langMenu('lang-l')}<button class="btn grad hide-sm" data-act="start">${t('n.start')} ${icon('arrowRight', 'flip sm')}</button><button class="ibtn plain show-md" data-act="lnav" aria-label="${t('c.menu')}">${icon('menu')}</button></div></div></header>
    <main id="top">
    <section class="hero"><div class="wrap hero-in"><div class="hero-txt">
      <span class="badge">${icon('sparkles', 'sm')} ${t('h.badge')}</span>
      <h1>${t('h.t1')}<br><span class="grad-t">${t('h.t2')}</span></h1>
      <p class="lead">${t('h.sub')}</p>
      <div class="hctas"><button class="btn grad lg" data-act="start">${t('h.cta')} ${icon('arrowRight', 'flip')}</button><button class="btn ghost lg" data-act="startPortal" data-id="c1">${icon('play')} ${t('h.portal')}</button></div>
      <ul class="hchecks">${[1, 2, 3].map(i => `<li>${icon('check')}${t('h.c' + i)}</li>`).join('')}</ul></div>
      <div class="hero-vis" aria-hidden="true"><div class="laptop"><div class="lscreen">${miniDash()}</div><div class="lbase"></div></div>
        <div class="ncards">${[['check', 'n1', '#16a34a'], ['file', 'n2', '#3b82f6'], ['receipt', 'n3', '#7c3aed']].map(([ic, k, c], i) => `<div class="ncard" style="--d:${i * .25}s"><span class="nic" style="--c:${c}">${icon(ic)}</span><div><b>${t('h.' + k)}</b><small>${t('h.' + k + 's')}</small></div></div>`).join('')}</div></div></div></section>
    <section class="wrap stats">${[['layers', '2', 's1'], ['globe', '3', 's2'], ['robot', '4', 's3'], ['clock', '24/7', 's4']].map(([ic, v, k]) => `<div><span class="sic">${icon(ic)}</span><div><b>${bdi(v)}</b><small>${t('st.' + k)}</small></div></div>`).join('')}</section>
    <section class="wrap sec" id="features"><div class="sec-h c"><span class="kick">${t('f.kick')}</span><h2>${t('f.t')}</h2><p class="muted">${t('f.s')}</p></div>
      <div class="fgrid">${feats.map(([ic, k, c]) => `<article class="fcard"><span class="fic" style="--c:${c}">${icon(ic)}</span><h3>${t('f.' + k)}</h3><p>${t('f.' + k + 's')}</p></article>`).join('')}</div></section>
    <section class="wrap"><div class="premium"><div class="pm-txt"><h2>${t('pm.t')}</h2><p>${t('pm.s')}</p><button class="btn grad lg" data-act="start">${t('pm.cta')} ${icon('arrowRight', 'flip')}</button></div>
      <div class="devices" aria-hidden="true"><div class="dv-lap">${miniDash(true)}</div><div class="dv-phone">${miniPhone()}</div></div></div></section>
    <section class="wrap sec" id="how"><div class="sec-h c"><span class="kick">${t('w.kick')}</span><h2>${t('w.t')}</h2></div><div class="steps3">${[1, 2, 3].map(i => `<div class="step"><em>${bdi(i)}</em><h3>${t('w.' + i)}</h3><p>${t('w.' + i + 's')}</p></div>`).join('')}</div></section>
    <section class="wrap sec" id="tour"><div class="sec-h c"><span class="kick">${t('tr.kick')}</span><h2>${t('tr.t')}</h2><p class="muted">${t('tr.s')}</p></div>
      <div class="tour"><article class="tcard"><span class="fic" style="--c:#7c3aed">${icon('chart')}</span><h3>${t('tr.a')}</h3><p>${t('tr.as')}</p><button class="btn grad" data-act="start">${t('tr.ab')} ${icon('arrowRight', 'flip sm')}</button></article>
      <article class="tcard"><span class="fic" style="--c:#3b82f6">${icon('portal')}</span><h3>${t('tr.b')}</h3><p>${t('tr.bs')}</p><button class="btn ghost" data-act="startPortal" data-id="c1">${t('tr.bb')} ${icon('arrowRight', 'flip sm')}</button></article></div></section>
    <section class="wrap sec" id="pricing"><div class="sec-h c"><span class="kick">${t('pr.kick')}</span><h2>${t('pr.t')}</h2><p class="muted">${t('pr.s')}</p></div>
      <div class="plans">${[['p1', 299, 0], ['p2', 699, 1], ['p3', 1499, 0]].map(([k, price, hot]) => `<article class="plan ${hot ? 'hot' : ''}">${hot ? `<span class="ptag">${t('pr.pop')}</span>` : ''}<h3>${t('pr.' + k)}</h3><p class="muted sm">${t('pr.' + k + 's')}</p><p class="price">${sarH(price)}<small>/${t('pr.mo')}</small></p><ul>${[1, 2, 3, 4].map(i => `<li>${icon('check', 'sm')}${t('pr.' + k + 'f' + i)}</li>`).join('')}</ul><button class="btn ${hot ? 'grad' : 'ghost'} block" data-act="start">${t('pr.cta')}</button></article>`).join('')}</div></section>
    <section class="wrap sec" id="contact"><div class="contact"><div><span class="kick">${t('n.contact')}</span><h2>${t('ct.t')}</h2><p class="muted">${t('ct.s')}</p><a class="btn wa" href="https://wa.me/${WA_AGENCY}?text=${encodeURIComponent('Hi, I saw the ClientHub demo and want a client portal like this.')}" target="_blank" rel="noopener">${icon('whatsapp')} ${t('ct.wa')}</a></div>
      <form class="card form" data-form="contact" novalidate><div class="row2"><label>${t('ct.name')} *<input name="name" required maxlength="60" autocomplete="name"></label><label>${t('ct.wa2')} *<input name="whatsapp" required maxlength="25" inputmode="tel" autocomplete="tel"></label></div><label>${t('ct.biz')}<input name="business" maxlength="80"></label><label>${t('ct.msg')}<textarea name="message" rows="3" maxlength="600"></textarea></label><p class="err" hidden>${t('c.required')}</p><button class="btn grad" type="submit">${icon('send', 'flip sm')} ${t('ct.send')}</button></form></div></section>
    </main><footer class="lfoot"><div class="wrap lfoot-in">${logo()}<p>${t('ft.by')}<br><small>${t('ft.note')}</small></p><small>© <bdi>2026</bdi> AI Digital Marketing</small></div></footer>`;
  }
  function miniDash(dark) {
    return `<div class="md ${dark ? 'dark' : ''}"><div class="md-side">${logo()}${['dashboard', 'clients', 'projects', 'tasks', 'messages', 'files'].map((k, i) => `<span class="${i ? '' : 'on'}">${t('sd.' + k)}</span>`).join('')}</div><div class="md-main"><div class="md-top"><span class="md-s">${icon('search', 'sm')}</span><span class="md-u">${avatar({ en: 'Demo' }, '#7c3aed', 'xs')}</span></div><b class="md-h">${t('md.welcome')}</b><small>${t('md.sub')}</small>
      <div class="md-card"><b>${t('d.overview')}</b>${[['svc.web', 73], ['svc.app', 45], ['svc.seo', 60], ['svc.brand', 20]].map(([k, v]) => `<div class="md-row"><span>${t(k)}</span><bdi>${v}%</bdi></div>${bar(v)}`).join('')}</div></div></div>`;
  }
  function miniPhone() { return `<div class="mp"><b>${logo()}</b><p>${t('cp.hello', { n: 'Ahmed' })}</p><div class="mp-g">${[['folder', 3], ['message', 5], ['receipt', 2], ['file', 12]].map(([ic, v]) => `<span>${icon(ic, 'sm')}<b>${v}</b></span>`).join('')}</div><span class="mp-btn">${t('cp.viewAll')}</span></div>`; }

  /* ================= ADMIN ================= */
  const NAV = [['dashboard', 'home'], ['clients', 'users'], ['projects', 'folder'], ['tasks', 'kanban'], ['messages', 'message'], ['files', 'file'], ['invoices', 'receipt'], ['proposals', 'pen'], ['tickets', 'ticket'], ['team', 'team'], ['reports', 'chart'], ['settings', 'settings']];
  function shell(page, content) {
    const unread = D.notifs.filter(n => !n.read).length, msgs = D.threads.reduce((a, c) => a + (c.unread || 0), 0), tk = openTasks().length;
    return `<div class="app ${UI.sidebar ? 'sb-open' : ''}"><aside class="side">${logo()}<nav>${NAV.map(([p, ic]) => `<a href="#/app/${p}" class="${p === page ? 'on' : ''}" data-act="nav">${icon(ic)}<span>${t('sd.' + p)}</span>${p === 'tasks' && tk ? `<em>${bdi(tk)}</em>` : p === 'messages' && msgs ? `<em>${bdi(msgs)}</em>` : ''}</a>`).join('')}</nav>
      <div class="side-foot"><a class="btn ghost block sm" href="#/portal/c1/overview">${icon('eye', 'sm')} ${t('sd.viewClient')}</a><span class="demo-tag"><i class="live"></i>${t('c.demo')}</span></div></aside><div class="sb-back" data-act="sidebar"></div>
      <div class="main"><header class="top"><button class="ibtn show-md" data-act="sidebar" aria-label="${t('c.menu')}">${icon('menu')}</button>
        <div class="search" id="gsearch">${icon('search')}<input type="search" placeholder="${t('top.search')}" data-act="gsearch" aria-label="${t('c.search')}" autocomplete="off"><div class="sres" id="sres"></div></div>
        <div class="tacts">${langMenu('lang-a')}<button class="ibtn" data-act="theme" aria-label="${t('c.theme')}">${icon(PREFS.theme === 'dark' ? 'sun' : 'moon')}</button>
          <div class="dd ${UI.menus === 'notif' ? 'open' : ''}"><button class="ibtn" data-act="menu" data-id="notif" aria-label="${t('top.notif')}">${icon('bell')}${unread ? `<em class="dot">${unread}</em>` : ''}</button><div class="ddm wide"><div class="ddh"><b>${t('top.notif')}</b><button class="link" data-act="markRead">${t('top.markread')}</button></div>${D.notifs.slice(0, 8).map(n => `<div class="nitem ${n.read ? '' : 'unread'}">${icon('bell')}<div><p>${esc(actText(n))}</p><small>${rel(n.at)}</small></div></div>`).join('')}</div></div>
          <div class="dd ${UI.menus === 'user' ? 'open' : ''}"><button class="ubtn" data-act="menu" data-id="user">${avatar({ en: userName() }, '#7c3aed')}<span class="hide-sm"><b>${bdi(userName())}</b><small>${t('top.role')}</small></span>${icon('chevDown', 'sm')}</button><div class="ddm"><a href="#/app/settings" data-act="nav">${icon('settings')}${t('sd.settings')}</a><a href="#/">${icon('home')}${t('top.site')}</a><button data-act="reset">${icon('refresh')}${t('top.reset')}</button><button data-act="logout">${icon('logout')}${t('top.logout')}</button></div></div></div></header>
        <main class="content" id="content">${content}</main></div></div>`;
  }
  const head = (title, sub, acts) => `<div class="phead"><div><h1>${title}</h1><p class="muted">${sub}</p></div><div class="pacts">${acts || ''}</div></div>`;
  const kpi = (k, v, d, c, ic) => `<div class="kpi card"><small>${t(k)}</small><div class="kt"><span class="kic" style="--c:${c}">${icon(ic)}</span><b>${v}</b></div><span class="dl ${d < 0 ? 'neg' : ''}">${icon('arrowUp', 'sm')}${bdi((d > 0 ? '+' : '') + d + '%')}</span></div>`;
  function overviewSeries() {
    const pts = 6, labels = [], a = [], c = [], h = [];
    for (let i = pts - 1; i >= 0; i--) {
      const d = Date.now() - i * 6 * DAY; labels.push(dShort(d));
      a.push(D.projects.filter(p => p.start <= d && !(p.done && p.done <= d) && p.status !== 'hold').length + (i % 2));
      c.push(D.projects.filter(p => p.done && p.done <= d).length + Math.max(0, 3 - i));
      h.push(D.projects.filter(p => p.status === 'hold' && p.start <= d).length);
    }
    return { labels, a, c, h };
  }
  function pgDashboard() {
    const rev = paidIn(Date.now() - 30 * DAY), prev = paidIn(Date.now() - 60 * DAY, Date.now() - 30 * DAY), dRev = prev ? Math.round((rev - prev) / prev * 100) : 0;
    const st = ['done', 'progress', 'hold', 'notstarted'].map(s => ({ s, n: D.projects.filter(p => p.status === s).length })), tot = D.projects.length;
    const COL = { done: '#16a34a', progress: '#3b82f6', hold: '#f59e0b', notstarted: '#a1a1aa' };
    const S = overviewSeries();
    return head(t('d.t'), t('d.s'), `<button class="btn grad" data-act="addProject">${icon('plus')} ${t('pj.new')}</button>`)
      + `<div class="kpis">${kpi('d.k1', bdi(D.clients.length), 12, '#3b82f6', 'users')}${kpi('d.k2', bdi(D.projects.filter(p => p.status === 'progress').length), 18, '#2563eb', 'folder')}${kpi('d.k3', bdi(openTasks().length), 24, '#f97316', 'checkSq')}${kpi('d.k4', sarH(rev), dRev || 32, '#f59e0b', 'dollar')}</div>
      <div class="grid3"><div class="card"><div class="ch"><h4>${t('d.overview')}</h4><span class="chip">${t('d.last30')}</span></div>${Charts.lines([{ vals: S.a, color: '#3b82f6', name: t('lg.active') }, { vals: S.c, color: '#8b5cf6', name: t('lg.done') }, { vals: S.h, color: '#ef4444', name: t('lg.hold') }], S.labels)}<div class="legend"><span><i style="--c:#3b82f6"></i>${t('lg.active')}</span><span><i style="--c:#8b5cf6"></i>${t('lg.done')}</span><span><i style="--c:#ef4444"></i>${t('lg.hold')}</span></div><div class="stats3 mt">${[['lg.active', D.projects.filter(p => p.status === 'progress').length], ['lg.done', D.projects.filter(p => p.status === 'done').length], ['d.dueWeek', D.projects.filter(p => p.status !== 'done' && p.due > Date.now() && p.due < Date.now() + 7 * DAY).length]].map(([k, v]) => `<div><b>${bdi(v)}</b><small>${t(k)}</small></div>`).join('')}</div></div>
        <div class="card"><div class="ch"><h4>${t('d.status')}</h4></div><div class="donutw">${Charts.donut(st.map(x => ({ value: x.n, color: COL[x.s], label: t('st.' + x.s) })), tot, t('d.projects'))}</div><ul class="dleg">${st.map(x => `<li><i style="--c:${COL[x.s]}"></i>${t('st.' + x.s)}<b>${bdi(x.n + ' (' + Math.round(x.n / tot * 100) + '%)')}</b></li>`).join('')}</ul></div>
        <div class="card"><div class="ch"><h4>${t('d.activity')}</h4></div><ul class="alist">${D.activity.slice(0, 5).map(a => `<li><span class="aic ${a.ic}">${icon(a.ic || 'bell')}</span><div><p>${esc(actText(a))}</p><small>${rel(a.at)}</small></div></li>`).join('')}</ul></div></div>
      <div class="card"><div class="ch tabsrow"><div class="tabs">${['active', 'deadlines', 'clients', 'payments'].map(k => `<button class="${UI.tab === k ? 'on' : ''}" data-act="dtab" data-v="${k}">${t('d.tab.' + k)}</button>`).join('')}</div><a class="link" href="#/app/${UI.tab === 'clients' ? 'clients' : UI.tab === 'payments' ? 'invoices' : 'projects'}" data-act="nav">${t('c.viewAll')} ${icon('arrowRight', 'flip sm')}</a></div>${dashTable()}</div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${t('d.msgs')}</h4><a class="link" href="#/app/messages" data-act="nav">${t('c.viewAll')} ${icon('arrowRight', 'flip sm')}</a></div><ul class="mlist">${D.threads.slice().sort((a, b) => b.msgs[b.msgs.length - 1].at - a.msgs[a.msgs.length - 1].at).slice(0, 4).map(th => { const c = cli(th.cid), lm = th.msgs.filter(m => m.from === 'client').pop() || th.msgs[th.msgs.length - 1]; return `<li data-act="openThread" data-id="${th.cid}">${avatar(c.contact, c.color)}<div><b>${esc(nm(c.contact))}</b><p>${esc(msgText(lm))}</p></div><div class="r"><small>${bdi(timeF(lm.at))}</small>${th.unread ? `<em>${bdi(th.unread)}</em>` : ''}</div></li>`; }).join('')}</ul></div>
        <div class="card"><div class="ch"><h4>${t('d.payments')}</h4><span class="chip">${t('d.last30')}</span></div><div class="pay-t"><b>${sarH(rev)}</b><span class="dlp">${icon('trend', 'sm')} ${bdi('+' + (dRev || 32) + '%')}</span></div><small class="muted">${t('d.collected')}</small>${Charts.grouped(paySeries(), v => (v / 1000) + 'K')}<div class="legend"><span><i style="--c:#c4b5fd"></i>${t('lg.invoiced')}</span><span><i style="--c:#7c3aed"></i>${t('lg.paid')}</span></div></div></div>`;
  }
  function paySeries() { const out = []; for (let i = 4; i >= 0; i--) { const s = Date.now() - (i + 1) * 6 * DAY, e = Date.now() - i * 6 * DAY; out.push({ label: dShort(e), a: D.invoices.filter(x => x.issued >= s && x.issued < e).reduce((a, x) => a + x.amount, 0), b: paidIn(s, e) }); } return out; }
  function dashTable() {
    if (UI.tab === 'clients') return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('col.client')}</th><th class="hide-sm">${t('col.contact')}</th><th>${t('col.city')}</th><th>${t('col.projects')}</th><th class="hide-sm">${t('col.since')}</th></tr></thead><tbody>${D.clients.slice().sort((a, b) => b.since - a.since).slice(0, 5).map(c => `<tr data-act="client" data-id="${c.id}"><td><span class="who">${cav(c, 'sm')}<span>${esc(nm(c.name))}</span></span></td><td class="hide-sm">${esc(nm(c.contact))}</td><td>${t('city.' + c.city)}</td><td>${bdi(D.projects.filter(p => p.cid === c.id).length)}</td><td class="hide-sm nowrap">${dateF(c.since)}</td></tr>`).join('')}</tbody></table></div>`;
    if (UI.tab === 'payments') return invTable(D.invoices.filter(i => i.status !== 'paid').slice(0, 5));
    const list = UI.tab === 'deadlines' ? D.projects.filter(p => p.status !== 'done' && p.due > Date.now()).sort((a, b) => a.due - b.due).slice(0, 5) : D.projects.filter(p => p.status !== 'done').slice(0, 5);
    return projTable(list, true);
  }
  function projTable(list, num) {
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${num ? '<th class="hide-sm">#</th>' : ''}<th>${t('col.project')}</th><th>${t('col.client')}</th><th class="hide-sm">${t('col.progress')}</th><th class="hide-md">${t('col.due')}</th><th>${t('col.status')}</th><th class="hide-md">${t('col.action')}</th></tr></thead><tbody>
      ${list.map((p, i) => { const c = cli(p.cid); return `<tr data-act="project" data-id="${p.id}">${num ? `<td class="hide-sm">${bdi(i + 1)}</td>` : ''}<td><b class="pn">${esc(pname(p))}</b></td><td><span class="who">${cav(c, 'sm')}<span>${esc(nm(c.name))}</span></span></td><td class="hide-sm"><span class="prog">${bar(p.progress)}<bdi>${p.progress}%</bdi></span></td><td class="hide-md nowrap">${dateF(p.due)}</td><td>${stTag(p.status)}</td><td class="hide-md"><button class="ibtn sm" data-act="project" data-id="${p.id}" aria-label="${t('c.open')}">${icon('dots')}</button></td></tr>`; }).join('')}</tbody></table>${list.length ? '' : `<p class="empty">${t('c.empty')}</p>`}</div>`;
  }
  /* clients */
  function pgClients() {
    return head(t('sd.clients'), t('cl.s'), `<button class="btn grad" data-act="addClient">${icon('plus')} ${t('cl.add')}</button>`) + `<div class="cgrid">${D.clients.map(c => { const ps = D.projects.filter(p => p.cid === c.id), act = ps.filter(p => p.status !== 'done'); const paid = D.invoices.filter(i => i.cid === c.id && i.status === 'paid').reduce((a, i) => a + i.amount, 0);
      return `<article class="card ccard"><div class="cc-h" data-act="client" data-id="${c.id}">${cav(c, 'lg')}<div><b>${esc(nm(c.name))}</b><small>${esc(nm(c.contact))} · ${t('ind.' + c.industry)}</small></div></div><div class="cc-s"><div><b>${bdi(act.length)}</b><small>${t('cl.active')}</small></div><div><b>${sarH(paid)}</b><small>${t('cl.paid')}</small></div><div><b>${t('city.' + c.city)}</b><small>${t('col.city')}</small></div></div>${act.slice(0, 2).map(p => `<div class="cc-p"><span>${esc(pname(p))}</span>${bar(p.progress)}<bdi>${p.progress}%</bdi></div>`).join('')}<div class="row-btns"><a class="btn ghost sm" href="#/portal/${c.id}/overview">${icon('eye', 'sm')} ${t('cl.portal')}</a><button class="btn grn sm" data-act="weekly" data-id="${c.id}">${icon('sparkles', 'sm')} ${t('cl.weekly')}</button></div></article>`; }).join('')}</div>`;
  }
  function clientDrawer(id) {
    const c = cli(id), ps = D.projects.filter(p => p.cid === id), inv = D.invoices.filter(i => i.cid === id);
    drawer(`<div class="dh">${cav(c, 'lg')}<div><h3>${esc(nm(c.name))}</h3><p class="muted sm">${esc(nm(c.contact))} · ${t('ind.' + c.industry)} · ${t('city.' + c.city)}</p></div><button class="ibtn" data-act="closeDrawer" aria-label="${t('c.close')}">${icon('x')}</button></div>
      <div class="dbody"><div class="cbox">${icon('phone', 'sm')}<bdi>${esc(c.phone)}</bdi> · ${icon('mail', 'sm')}<bdi>${esc(c.email)}</bdi></div>
      <h4>${t('col.projects')}</h4>${ps.map(p => `<div class="dp" data-act="project" data-id="${p.id}"><div><b>${esc(pname(p))}</b>${stTag(p.status)}</div>${bar(p.progress)}<small>${bdi(p.progress + '%')} · ${t('col.due')} ${dateF(p.due)}</small></div>`).join('')}
      <h4>${t('sd.invoices')}</h4>${invTable(inv)}
      <div class="dacts"><a class="btn grad" href="#/portal/${c.id}/overview">${icon('eye')} ${t('cl.portal')}</a><button class="btn grn" data-act="weekly" data-id="${c.id}">${icon('sparkles')} ${t('cl.weekly')}</button><button class="btn ghost" data-act="openThread" data-id="${c.id}">${icon('message')} ${t('sd.messages')}</button><button class="btn danger" data-act="delClient" data-id="${c.id}" aria-label="${t('c.delete')}">${icon('trash')}</button></div><div id="wk-${c.id}"></div></div>`);
  }
  function clientInfo(c) {
    const ps = D.projects.filter(p => p.cid === c.id);
    return { client: nm(c.name), contact: nm(c.contact), language: L(),
      projects: ps.map(p => ({ name: t('svc.' + p.svc), status: I18N.dicts.en['st.' + p.status], progress: p.progress + '%', due: new Date(p.due).toISOString().slice(0, 10), manager: nm(mem(p.lead).name), open_tasks: D.tasks.filter(k => k.pid === p.id && k.status !== 'done').map(k => t(k.k)), done_tasks: D.tasks.filter(k => k.pid === p.id && k.status === 'done').map(k => t(k.k)) })),
      invoices: D.invoices.filter(i => i.cid === c.id).map(i => ({ id: i.id, amount_sar: i.amount, status: i.status, due: new Date(i.due).toISOString().slice(0, 10) })),
      files: D.files.filter(f => f.cid === c.id).map(f => ({ name: f.name, approved: f.approved, uploaded: new Date(f.at).toISOString().slice(0, 10) })), today: new Date().toISOString().slice(0, 10) };
  }
  function weeklyFallback(c) {
    const ps = D.projects.filter(p => p.cid === c.id && p.status !== 'done'), due = D.invoices.filter(i => i.cid === c.id && i.status !== 'paid')[0];
    return t('wk.fb', { n: firstT(c.contact), list: ps.map(p => `• ${pname(p)}: ${p.progress}%`).join('\n'), inv: due ? t('wk.inv', { id: due.id, amt: sar(due.amount), d: dateF(due.due) }) : '', a: agency() });
  }
  function draftBox(id, text, live, extra) { return `<div class="draft">${live ? `<span class="livebadge">${t('c.live')}</span>` : ''}<textarea rows="7" id="${id}" aria-label="draft">${esc(text)}</textarea><div class="row-btns"><button class="btn ghost sm" data-act="copy" data-id="${id}">${icon('copy', 'sm')} ${t('c.copy')}</button><a class="btn wa sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text)}">${icon('whatsapp', 'sm')} WhatsApp</a>${extra || ''}</div></div>`; }
  /* projects */
  function pgProjects() {
    const list = D.projects.filter(p => !UI.pf || p.status === UI.pf);
    return head(t('sd.projects'), t('pj.s'), `<button class="btn grad" data-act="addProject">${icon('plus')} ${t('pj.new')}</button>`)
      + `<div class="tabs">${['', 'progress', 'hold', 'notstarted', 'done'].map(s => `<button class="${UI.pf === s ? 'on' : ''}" data-act="pf" data-v="${s}">${s ? t('st.' + s) : t('c.all')} <em>${bdi(s ? D.projects.filter(p => p.status === s).length : D.projects.length)}</em></button>`).join('')}</div><div class="card">${projTable(list)}</div>`;
  }
  function projectDrawer(id) {
    const p = prj(id); if (!p) return; const c = cli(p.cid), tasks = D.tasks.filter(k => k.pid === id), files = D.files.filter(f => f.pid === id);
    drawer(`<div class="dh"><div><h3>${esc(pname(p))}</h3><p>${stTag(p.status)} <span class="muted sm">${esc(nm(c.name))}</span></p></div><button class="ibtn" data-act="closeDrawer" aria-label="${t('c.close')}">${icon('x')}</button></div>
      <div class="dbody"><div class="stats3"><div><b>${bdi(p.progress + '%')}</b><small>${t('col.progress')}</small></div><div><b>${dShort(p.due)}</b><small>${t('col.due')}</small></div><div><b>${sarH(p.budget)}</b><small>${t('pj.budget')}</small></div></div>
      <label>${t('pj.progress')} <bdi id="pv">${p.progress}%</bdi><input type="range" min="0" max="100" step="5" value="${p.progress}" data-act="progress" data-id="${p.id}"></label>
      <label>${t('col.status')}<select data-act="pstatus" data-id="${p.id}">${['notstarted', 'progress', 'hold', 'done'].map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${t('st.' + s)}</option>`).join('')}</select></label>
      <div class="cbox">${avatar(mem(p.lead).name)}<div><b>${esc(nm(mem(p.lead).name))}</b><small>${t('role.' + mem(p.lead).role)} · ${t('pj.lead')}</small></div></div>
      <h4>${t('sd.tasks')} <span class="muted">${bdi(tasks.filter(k => k.status === 'done').length + '/' + tasks.length)}</span></h4><ul class="tlist">${tasks.map(k => `<li class="${k.status === 'done' ? 'done' : ''}"><button class="chk" data-act="toggleTask" data-id="${k.id}" aria-label="done">${k.status === 'done' ? icon('check', 'sm') : ''}</button><span>${esc(t(k.k))}</span><small>${esc(t('ks.' + k.status))}</small></li>`).join('') || `<li class="muted">${t('c.empty')}</li>`}</ul>
      <h4>${t('sd.files')}</h4><ul class="flist">${files.map(f => fileRow(f)).join('') || `<li class="muted">${t('c.empty')}</li>`}</ul>
      <div class="dacts"><a class="btn ghost" href="#/portal/${c.id}/projects">${icon('eye')} ${t('cl.portal')}</a><button class="btn ghost" data-act="editProject" data-id="${p.id}">${icon('edit')} ${t('c.edit')}</button><button class="btn danger" data-act="delProject" data-id="${p.id}" aria-label="${t('c.delete')}">${icon('trash')}</button></div></div>`);
  }
  function projectForm(p) {
    p = p || { cid: 'c1', svc: 'webdev', budget: 10000, status: 'notstarted', progress: 0, due: Date.now() + 30 * DAY, lead: 't1' };
    return `<form class="form" data-form="project" data-id="${p.id || ''}" novalidate><div class="row2"><label>${t('col.client')}<select name="cid">${D.clients.map(c => `<option value="${c.id}" ${p.cid === c.id ? 'selected' : ''}>${esc(nm(c.name))}</option>`).join('')}</select></label><label>${t('pj.service')}<select name="svc">${SEED.SERVICES.map(s => `<option value="${s}" ${p.svc === s ? 'selected' : ''}>${t('svc.' + s)}</option>`).join('')}</select></label></div>
      <div class="row3"><label>${t('pj.budget')} (SAR) *<input name="budget" type="number" min="1" required value="${p.budget}"></label><label>${t('col.due')} *<input name="due" type="date" required value="${new Date(p.due).toISOString().slice(0, 10)}"></label><label>${t('pj.lead')}<select name="lead">${D.team.map(m => `<option value="${m.id}" ${p.lead === m.id ? 'selected' : ''}>${esc(nm(m.name))}</option>`).join('')}</select></label></div>
      <label>${t('col.status')}<select name="status">${['notstarted', 'progress', 'hold', 'done'].map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${t('st.' + s)}</option>`).join('')}</select></label>
      <div class="mfoot"><button type="button" class="btn ghost" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`;
  }
  /* tasks kanban */
  const KCOL = ['todo', 'doing', 'review', 'done'];
  function pgTasks() {
    const list = D.tasks.filter(k => !UI.who || k.who === UI.who);
    return head(t('sd.tasks'), t('tk.s'), `<select class="chip" data-act="who" aria-label="${t('tk.who')}"><option value="">${t('tk.everyone')}</option>${D.team.map(m => `<option value="${m.id}" ${UI.who === m.id ? 'selected' : ''}>${esc(nm(m.name))}</option>`).join('')}</select><button class="btn grad" data-act="addTask">${icon('plus')} ${t('tk.add')}</button>`)
      + `<p class="muted sm hint">${icon('grip', 'sm')} ${t('tk.drag')}</p><div class="kanban">${KCOL.map(s => { const ks = list.filter(k => k.status === s); return `<section class="kcol" data-col="${s}"><header><b>${t('ks.' + s)}</b><em>${bdi(ks.length)}</em></header><div class="kbody">${ks.map(k => { const p = prj(k.pid), c = p ? cli(p.cid) : null, late = k.status !== 'done' && k.due < Date.now(); return `<article class="kcard" data-id="${k.id}"><div class="kc-t"><span class="grip" aria-hidden="true">${icon('grip', 'sm')}</span><b>${esc(t(k.k))}</b><span class="pri pri-${k.pri}">${t('pri.' + k.pri)}</span></div><small>${esc(pname(p))} · ${c ? esc(nm(c.name)) : ''}</small><div class="kc-f">${avatar(mem(k.who).name, null, 'xs')}<span class="${late ? 'late' : ''}">${icon('calendar', 'sm')} ${dShort(k.due)}</span><select data-act="kmove" data-id="${k.id}" aria-label="${t('col.status')}">${KCOL.map(x => `<option value="${x}" ${x === k.status ? 'selected' : ''}>${t('ks.' + x)}</option>`).join('')}</select></div></article>`; }).join('')}</div></section>`; }).join('')}</div>`;
  }
  function moveTask(id, s) { const k = D.tasks.find(x => x.id === id); if (!k || k.status === s) return; k.status = s; if (s === 'done') { const p = prj(k.pid); if (p) log('act.taskDone', { c: p.cid, p: t(k.k) }, 'check'); } save(); render(); toast(t('tk.moved', { s: t('ks.' + s) })); }
  /* messages */
  const msgText = m => m.text != null ? m.text : nm(m.t);
  function pgMessages() {
    const sel = D.threads.find(x => x.cid === UI.chat);
    const list = D.threads.slice().sort((a, b) => b.msgs[b.msgs.length - 1].at - a.msgs[a.msgs.length - 1].at);
    return head(t('sd.messages'), t('ms.s'), '') + `<div class="inbox card ${sel ? 'has-sel' : ''}"><div class="ilist">${list.map(th => { const c = cli(th.cid), last = th.msgs[th.msgs.length - 1]; return `<button class="ichat ${th.cid === UI.chat ? 'on' : ''}" data-act="openThread" data-id="${th.cid}">${avatar(c.contact, c.color)}<div><b>${esc(nm(c.contact))}</b><span>${esc(nm(c.name))}</span><p>${esc(msgText(last))}</p></div><small>${rel(last.at)}</small>${th.unread ? `<em>${bdi(th.unread)}</em>` : ''}</button>`; }).join('')}</div>
      <div class="ithread">${sel ? (() => { const c = cli(sel.cid); return `<div class="ith-h"><button class="ibtn show-sm" data-act="closeThread" aria-label="back">${icon('chevLeft', 'flip')}</button>${avatar(c.contact, c.color)}<div><b>${esc(nm(c.contact))}</b><small>${esc(nm(c.name))}</small></div><a class="btn ghost sm" href="#/portal/${c.id}/messages">${icon('eye', 'sm')} <span class="hide-sm">${t('cl.portal')}</span></a></div>
        <div class="msgs" id="msgs">${sel.msgs.map(m => `<div class="msg ${m.from === 'me' ? 'me' : ''}">${m.ai ? `<span class="aitag">${icon('sparkles', 'sm')} AI</span>` : ''}<p>${esc(msgText(m))}</p><small>${bdi(timeF(m.at))}</small></div>`).join('')}</div>
        <form class="mcomp" data-form="msg"><button type="button" class="ibtn" data-act="aiReply" title="${t('ms.ai')}" aria-label="${t('ms.ai')}">${icon('sparkles')}</button><input name="text" maxlength="600" autocomplete="off" placeholder="${t('ms.type')}" aria-label="${t('ms.type')}"><button class="sendb" type="submit" aria-label="${t('c.send')}">${icon('send', 'flip')}</button></form>`; })() : `<p class="empty big">${icon('message')}<br>${t('ms.select')}</p>`}</div></div>`;
  }
  /* files */
  const ext = n => (n.split('.').pop() || '').toLowerCase();
  const fIcon = n => { const e = ext(n); return `<span class="fi fi-${['pdf'].includes(e) ? 'pdf' : ['doc', 'docx'].includes(e) ? 'doc' : ['xls', 'xlsx', 'csv'].includes(e) ? 'xls' : ['png', 'jpg', 'jpeg', 'fig', 'svg'].includes(e) ? 'img' : 'zip'}">${icon('file')}<i>${esc(e.slice(0, 4).toUpperCase())}</i></span>`; };
  const fileRow = (f, portal) => `<li>${fIcon(f.name)}<div><b>${bdi(f.name)}</b><small>${bdi(f.size.toFixed(1) + ' MB')} · ${dateF(f.at)}</small></div>${f.approved ? `<span class="pill iv-paid">${t('fl.approved')}</span>` : portal ? `<button class="btn grad sm" data-act="approveFile" data-id="${f.id}">${t('fl.approve')}</button>` : `<span class="pill iv-pending">${t('fl.waiting')}</span>`}<button class="ibtn sm" data-act="dl" data-id="${f.id}" aria-label="${t('fl.download')}">${icon('download')}</button></li>`;
  function pgFiles() {
    return head(t('sd.files'), t('fl.s'), `<label class="btn grad upl">${icon('upload')} ${t('fl.upload')}<input type="file" data-act="upload" multiple hidden></label>`)
      + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('fl.name')}</th><th class="hide-sm">${t('col.project')}</th><th>${t('col.client')}</th><th class="hide-md">${t('fl.by')}</th><th class="hide-sm">${t('fl.size')}</th><th>${t('col.status')}</th><th></th></tr></thead><tbody>
      ${D.files.slice().sort((a, b) => b.at - a.at).map(f => { const p = prj(f.pid), c = cli(f.cid); return `<tr><td><span class="who">${fIcon(f.name)}<span><b>${bdi(f.name)}</b><small class="muted"> ${dShort(f.at)}</small></span></span></td><td class="hide-sm">${esc(pname(p))}</td><td>${esc(nm(c.name))}</td><td class="hide-md">${f.by === 'client' ? esc(nm(c.contact)) : esc(nm(mem(f.by).name))}</td><td class="hide-sm nowrap">${bdi(f.size.toFixed(1) + ' MB')}</td><td>${f.approved ? `<span class="pill iv-paid">${t('fl.approved')}</span>` : `<span class="pill iv-pending">${t('fl.waiting')}</span>`}</td><td class="nowrap"><button class="ibtn sm" data-act="dl" data-id="${f.id}" aria-label="${t('fl.download')}">${icon('download')}</button> <button class="ibtn sm" data-act="delFile" data-id="${f.id}" aria-label="${t('c.delete')}">${icon('trash')}</button></td></tr>`; }).join('')}</tbody></table></div><p class="muted sm">${icon('shield', 'sm')} ${t('fl.note')}</p></div>`;
  }
  /* invoices */
  function invTable(list, portal) {
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t('iv.no')}</th>${portal ? '' : `<th>${t('col.client')}</th>`}<th class="hide-sm">${t('col.project')}</th><th>${t('iv.amount')}</th><th class="hide-sm">${t('col.due')}</th><th>${t('col.status')}</th><th></th></tr></thead><tbody>
      ${list.map(i => { const c = cli(i.cid); return `<tr><td><b><bdi>${i.id}</bdi></b></td>${portal ? '' : `<td><span class="who">${cav(c, 'sm')}<span>${esc(nm(c.name))}</span></span></td>`}<td class="hide-sm">${esc(pname(prj(i.pid)))}</td><td class="nowrap"><b>${sarH(i.amount)}</b></td><td class="hide-sm nowrap">${dateF(i.due)}</td><td>${invTag(i.status)}</td><td class="nowrap">${i.status !== 'paid' ? (portal ? `<button class="btn grad sm" data-act="pay" data-id="${i.id}">${icon('card', 'sm')} ${t('iv.pay')}</button>` : `<button class="btn ghost sm" data-act="markPaid" data-id="${i.id}">${icon('check', 'sm')} <span class="hide-sm">${t('iv.markPaid')}</span></button>`) : ''} <button class="ibtn sm" data-act="invView" data-id="${i.id}" aria-label="${t('iv.view')}">${icon('eye')}</button></td></tr>`; }).join('')}</tbody></table>${list.length ? '' : `<p class="empty">${t('c.empty')}</p>`}</div>`;
  }
  function pgInvoices() {
    const list = D.invoices.filter(i => !UI.inv || i.status === UI.inv).sort((a, b) => b.issued - a.issued), sum = s => D.invoices.filter(i => i.status === s).reduce((a, i) => a + i.amount, 0);
    return head(t('sd.invoices'), t('iv.s'), `<button class="btn grad" data-act="addInvoice">${icon('plus')} ${t('iv.new')}</button>`)
      + `<div class="kpis three">${kpi('iv.k1', sarH(paidIn(Date.now() - 30 * DAY)), 32, '#16a34a', 'check')}${kpi('iv.k2', sarH(sum('pending')), 8, '#f59e0b', 'clock')}${kpi('iv.k3', sarH(sum('overdue')), -12, '#ef4444', 'alarm')}</div>
      <div class="tabs">${['', 'pending', 'overdue', 'paid'].map(s => `<button class="${UI.inv === s ? 'on' : ''}" data-act="inv" data-v="${s}">${s ? t('iv.' + s) : t('c.all')} <em>${bdi(s ? D.invoices.filter(i => i.status === s).length : D.invoices.length)}</em></button>`).join('')}</div><div class="card">${invTable(list)}</div>`;
  }
  function invView(id) {
    const i = D.invoices.find(x => x.id === id), c = cli(i.cid), p = prj(i.pid), vat = Math.round(i.amount / 1.15 * 0.15);
    modal(t('iv.view') + ' ' + i.id, `<div class="inv"><div class="invh">${logo(esc(agency()))}<div><b><bdi>${i.id}</bdi></b><small>${dateF(i.issued)}</small></div></div><p><b>${esc(nm(c.name))}</b><br><small>${esc(nm(c.contact))} · ${t('city.' + c.city)}</small></p><table class="tbl"><tbody><tr><td>${esc(pname(p))}</td><td class="nowrap">${sarH(i.amount - vat)}</td></tr><tr><td>${t('iv.vat')}</td><td>${sarH(vat)}</td></tr><tr><td><b>${t('iv.total')}</b></td><td><b>${sarH(i.amount)}</b></td></tr></tbody></table><p>${invTag(i.status)} <span class="muted sm">${t('col.due')} ${dateF(i.due)}</span></p><p class="muted sm">${t('ft.note')}</p><div class="row-btns"><button class="btn grad" data-act="print">${icon('printer')} ${t('iv.print')}</button>${i.status !== 'paid' ? `<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(`Hi ${first(c.contact)}, a friendly reminder: invoice ${i.id} (${sar(i.amount)}) is due on ${new Date(i.due).toDateString()}. You can pay it from your client portal. Thank you!`)}">${icon('whatsapp')} ${t('iv.remind')}</a>` : ''}</div></div>`, 'narrow');
  }
  /* proposals */
  function pgProposals() {
    return head(t('sd.proposals'), t('po.s'), `<button class="btn grad" data-act="addProposal">${icon('sparkles')} ${t('po.new')}</button>`) + `<div class="cgrid">${D.proposals.map(p => { const c = cli(p.cid); return `<article class="card pcard"><div class="cc-h">${cav(c)}<div><b>${esc(t('svc.' + p.svc))}</b><small>${esc(nm(c.name))} · <bdi>${p.id}</bdi></small></div><span class="pill po-${p.status}">${t('po.' + p.status)}</span></div><p class="pamt">${sarH(p.amount)}</p>${p.text ? `<p class="ptext">${esc(p.text).slice(0, 220)}…</p>` : ''}<small class="muted">${rel(p.at)}</small><div class="row-btns">${p.text ? `<button class="btn ghost sm" data-act="viewProposal" data-id="${p.id}">${icon('eye', 'sm')} ${t('c.open')}</button>` : ''}${p.status === 'draft' ? `<button class="btn ghost sm" data-act="poStatus" data-id="${p.id}" data-v="sent">${icon('send', 'flip sm')} ${t('po.markSent')}</button>` : ''}${p.status === 'sent' ? `<button class="btn grn sm" data-act="poStatus" data-id="${p.id}" data-v="accepted">${icon('check', 'sm')} ${t('po.markAcc')}</button>` : ''}${p.status === 'accepted' && !p.project ? `<button class="btn grad sm" data-act="poProject" data-id="${p.id}">${icon('folder', 'sm')} ${t('po.toProject')}</button>` : ''}</div></article>`; }).join('')}</div>`;
  }
  function proposalModal() {
    modal(t('po.new'), `<form class="form" data-form="proposal" novalidate><div class="row2"><label>${t('col.client')}<select name="cid">${D.clients.map(c => `<option value="${c.id}">${esc(nm(c.name))}</option>`).join('')}</select></label><label>${t('pj.service')}<select name="svc">${SEED.SERVICES.map(s => `<option value="${s}">${t('svc.' + s)}</option>`).join('')}</select></label></div>
      <div class="row2"><label>${t('pj.budget')} (SAR) *<input name="amount" type="number" min="1" required value="12000"></label><label>${t('po.weeks')} *<input name="weeks" type="number" min="1" max="52" required value="6"></label></div><label>${t('po.notes')}<input name="notes" maxlength="200" placeholder="${t('po.notesPh')}"></label>
      <button class="btn grad block" type="submit">${icon('sparkles')} ${t('po.write')}</button><div id="po-out"></div></form>`, 'wide');
  }
  function proposalFallback(c, svc, amount, weeks, notes) { return t('po.fb', { n: firstT(c.contact), c: nm(c.name), s: t('svc.' + svc), w: weeks, amt: sar(amount), notes: notes ? notes + '. ' : '', a: agency() }); }
  /* tickets */
  function pgTickets() {
    return head(t('sd.tickets'), t('tc.s'), `<button class="btn grad" data-act="addTicket">${icon('plus')} ${t('tc.new')}</button>`) + `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>${t('tc.subject')}</th><th class="hide-sm">${t('col.client')}</th><th>${t('tc.pri')}</th><th class="hide-md">${t('tc.who')}</th><th>${t('col.status')}</th></tr></thead><tbody>
      ${D.tickets.map(k => { const c = cli(k.cid); return `<tr><td><b><bdi>${k.id}</bdi></b><br><small class="muted">${rel(k.at)}</small></td><td>${esc(k.text || t(k.subj))}</td><td class="hide-sm">${esc(nm(c.name))}</td><td><span class="pri pri-${k.pri}">${t('pri.' + k.pri)}</span></td><td class="hide-md">${esc(nm(mem(k.who).name))}</td><td>${k.status === 'open' ? `<button class="btn ghost sm" data-act="resolve" data-id="${k.id}">${icon('check', 'sm')} ${t('tc.resolve')}</button>` : `<span class="pill iv-paid">${t('tc.resolved')}</span>`}</td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  /* team */
  function pgTeam() {
    return head(t('sd.team'), t('tm.s'), `<button class="btn grad" data-act="addMember">${icon('userPlus')} ${t('tm.add')}</button>`) + `<div class="cgrid">${D.team.map(m => { const open = D.tasks.filter(k => k.who === m.id && k.status !== 'done').length, lead = D.projects.filter(p => p.lead === m.id && p.status !== 'done').length, load = Math.min(100, open * 18 + lead * 8);
      return `<article class="card tmc">${avatar(m.name, null, 'lg')}<b>${esc(nm(m.name))}</b><small class="muted">${t('role.' + m.role)}</small><div class="cc-s"><div><b>${bdi(open)}</b><small>${t('tm.tasks')}</small></div><div><b>${bdi(lead)}</b><small>${t('tm.leads')}</small></div></div><div class="wl"><span>${t('tm.load')}</span>${bar(load, load > 75 ? 'hot' : '')}<bdi>${load}%</bdi></div><a class="link" href="#/app/tasks" data-act="whoTasks" data-id="${m.id}">${t('tm.view')} ${icon('arrowRight', 'flip sm')}</a></article>`; }).join('')}</div>`;
  }
  /* reports */
  function pgReports() {
    const months = []; const n = new Date();
    for (let i = 3; i >= 0; i--) { const s = new Date(n.getFullYear(), n.getMonth() - i, 1).getTime(), e = new Date(n.getFullYear(), n.getMonth() - i + 1, 1).getTime(); months.push({ label: new Intl.DateTimeFormat(I18N.locale(), { month: 'short' }).format(s), value: paidIn(s, e) }); }
    const bySvc = {}; D.projects.forEach(p => bySvc[p.svc] = (bySvc[p.svc] || 0) + p.budget);
    const top = Object.entries(bySvc).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const done = D.projects.filter(p => p.status === 'done'), inv = D.invoices.reduce((a, i) => a + i.amount, 0), paid = D.invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0);
    return head(t('sd.reports'), t('rp.s'), `<button class="btn ghost" data-act="export" data-v="projects">${icon('download')} ${t('rp.expP')}</button><button class="btn grad" data-act="export" data-v="invoices">${icon('download')} ${t('rp.expI')}</button>`)
      + `<div class="kpis">${kpi('rp.k1', sarH(paidIn(Date.now() - 90 * DAY)), 21, '#7c3aed', 'dollar')}${kpi('rp.k2', sarH(D.projects.reduce((a, p) => a + p.budget, 0) / D.projects.length), 6, '#3b82f6', 'folder')}${kpi('rp.k3', bdi(done.length), 15, '#16a34a', 'check')}${kpi('rp.k4', bdi(Math.round(paid / inv * 100) + '%'), 4, '#f59e0b', 'card')}</div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${t('rp.rev')}</h4></div>${Charts.bars(months, { fmt: v => (v / 1000) + 'K' })}</div><div class="card"><div class="ch"><h4>${t('rp.svc')}</h4></div><div class="hbars">${top.map(([s, v]) => `<div><span>${t('svc.' + s)}</span>${bar(v / top[0][1] * 100)}<b>${sarH(v)}</b></div>`).join('')}</div></div></div><p class="muted sm">${t('ft.note')}</p>`;
  }
  function pgSettings() {
    return head(t('sd.settings'), t('se.s'), '') + `<div class="grid2 set"><form class="card form" data-form="profile"><h4>${t('se.profile')}</h4><label>${t('start.name')}<input name="name" maxlength="60" value="${esc(USER.name)}" required></label><label>${t('se.agency')}<input name="company" maxlength="80" value="${esc(USER.company || '')}" placeholder="ClientHub Studio"></label><button class="btn grad" type="submit">${t('c.save')}</button></form>
      <div class="card"><h4>${t('se.look')}</h4><div class="seg"><button class="${PREFS.theme === 'light' ? 'on' : ''}" data-act="setTheme" data-v="light">${icon('sun')} ${t('se.light')}</button><button class="${PREFS.theme === 'dark' ? 'on' : ''}" data-act="setTheme" data-v="dark">${icon('moon')} ${t('se.dark')}</button></div>
        <h4>${t('se.lang')}</h4><div class="seg">${[['en', 'English'], ['ar', 'العربية'], ['ur', 'اردو']].map(l => `<button class="${L() === l[0] ? 'on' : ''}" data-act="lang" data-l="${l[0]}">${l[1]}</button>`).join('')}</div>
        <h4>${t('se.ai')}</h4><p class="aistat ${AI.live ? 'on' : ''}"><i></i>${AI.live ? t('se.aiOn') : t('se.aiOff')}</p><h4>${t('se.data')}</h4><p class="muted">${t('se.dataS')}</p><button class="btn danger" data-act="reset">${icon('refresh')} ${t('top.reset')}</button></div></div>`;
  }

  /* ================= CLIENT PORTAL ================= */
  const PT = [['overview', 'home'], ['projects', 'folder'], ['files', 'file'], ['invoices', 'receipt'], ['messages', 'message']];
  function portal(cid, tab) {
    const c = cli(cid), th = D.threads.find(x => x.cid === cid);
    const body = { overview: ptOverview, projects: ptProjects, files: ptFiles, invoices: ptInvoices, messages: ptMessages }[tab] || ptOverview;
    return `<div class="portal"><header class="ptop"><div class="wrap ptop-in">${logo(t('cp.portal'))}<label class="csel"><span class="sr">${t('cp.switch')}</span>${cav(c, 'sm')}<select data-act="pclient" aria-label="${t('cp.switch')}">${D.clients.map(x => `<option value="${x.id}" ${x.id === cid ? 'selected' : ''}>${esc(nm(x.name))}</option>`).join('')}</select></label>
      <div class="tacts">${langMenu('lang-p')}<a class="btn ghost sm" href="#/app/dashboard">${icon('chevLeft', 'flip sm')} <span class="hide-sm">${t('cp.back')}</span></a></div></div>
      <nav class="wrap ptabs" aria-label="portal">${PT.map(([k]) => `<a href="#/portal/${cid}/${k}" class="${tab === k ? 'on' : ''}">${t('cp.' + k)}${k === 'messages' && th && th.agentUnread ? `<em>${bdi(th.agentUnread)}</em>` : ''}</a>`).join('')}</nav></header>
      <main class="wrap pmain">${body(c)}</main>
      <nav class="pbot" aria-label="portal mobile">${[['overview', 'home'], ['projects', 'folder'], ['messages', 'message'], ['files', 'file'], ['invoices', 'receipt']].map(([k, ic]) => `<a href="#/portal/${cid}/${k}" class="${tab === k ? 'on' : ''}">${icon(ic)}<span>${t('cp.m.' + k)}</span></a>`).join('')}</nav></div>`;
  }
  function ptOverview(c) {
    const ps = D.projects.filter(p => p.cid === c.id && p.status !== 'done'), th = D.threads.find(x => x.cid === c.id), inv = D.invoices.filter(i => i.cid === c.id && i.status !== 'paid'), fs = D.files.filter(f => f.cid === c.id);
    const tiles = [['folder', ps.length, 'cp.t1', 'projects', '#3b82f6'], ['message', th ? th.msgs.filter(m => m.from === 'me').length : 0, 'cp.t2', 'messages', '#16a34a'], ['receipt', inv.length, 'cp.t3', 'invoices', '#f97316'], ['file', fs.length, 'cp.t4', 'files', '#2563eb']];
    return `<section class="welcome"><div><h1>${t('cp.welcome', { n: esc(firstT(c.contact)) })}</h1><p>${t('cp.latest')}</p></div><span class="wav2">${cav(c, 'xl')}</span></section>
      <div class="ptiles">${tiles.map(([ic, n, k, tab, col]) => `<a class="ptile" href="#/portal/${c.id}/${tab}"><span class="tic" style="--c:${col}">${icon(ic)}</span><b>${bdi(n)}</b><small>${t(k)}</small>${icon('chevRight', 'flip sm')}</a>`).join('')}</div>
      <div class="grid2"><div class="card"><div class="ch"><h4>${t('cp.yourProjects')}</h4><a class="link" href="#/portal/${c.id}/projects">${t('c.viewAll')} ${icon('arrowRight', 'flip sm')}</a></div><ul class="pplist">${ps.map((p, i) => `<li><a href="#/portal/${c.id}/projects"><span class="tic" style="--c:${['#3b82f6', '#f97316', '#f59e0b', '#16a34a'][i % 4]}">${icon('folder')}</span><div><b>${esc(pname(p))}</b>${bar(p.progress)}</div><bdi>${p.progress}%</bdi>${icon('chevRight', 'flip sm')}</a></li>`).join('') || `<li class="muted">${t('c.empty')}</li>`}</ul></div>
      <div class="card"><div class="ch"><h4>${t('cp.recentFiles')}</h4><a class="link" href="#/portal/${c.id}/files">${t('c.viewAll')} ${icon('arrowRight', 'flip sm')}</a></div><ul class="flist">${fs.slice().sort((a, b) => b.at - a.at).slice(0, 3).map(f => fileRow(f, true)).join('') || `<li class="muted">${t('c.empty')}</li>`}</ul></div></div>
      ${inv[0] ? `<div class="card duebox"><span class="tic" style="--c:#f97316">${icon('receipt')}</span><div><b>${t('cp.nextInv', { id: inv[0].id })}</b><small>${sarH(inv[0].amount)} · ${t('col.due')} ${dateF(inv[0].due)}</small></div><button class="btn grad" data-act="pay" data-id="${inv[0].id}">${icon('card', 'sm')} ${t('iv.pay')}</button></div>` : ''}
      ${aiWidget(c)}`;
  }
  function ptProjects(c) {
    const ps = D.projects.filter(p => p.cid === c.id);
    return `<h1 class="ph">${t('cp.projects')}</h1><div class="cgrid">${ps.map(p => { const tasks = D.tasks.filter(k => k.pid === p.id); const m = mem(p.lead); return `<article class="card pjc"><div class="cc-h"><span class="tic" style="--c:#7c3aed">${icon('folder')}</span><div><b>${esc(pname(p))}</b><small>${t('col.due')} ${dateF(p.due)}</small></div>${stTag(p.status)}</div><div class="prog big">${bar(p.progress)}<bdi>${p.progress}%</bdi></div><ul class="tlist">${tasks.map(k => `<li class="${k.status === 'done' ? 'done' : ''}"><span class="chk ro">${k.status === 'done' ? icon('check', 'sm') : ''}</span><span>${esc(t(k.k))}</span><small>${t('ks.' + k.status)}</small></li>`).join('')}</ul><div class="cbox">${avatar(m.name, null, 'sm')}<div><b>${esc(nm(m.name))}</b><small>${t('pj.lead')}</small></div><a class="btn ghost sm" href="#/portal/${c.id}/messages">${icon('message', 'sm')}</a></div></article>`; }).join('')}</div>${aiWidget(c)}`;
  }
  function ptFiles(c) {
    const fs = D.files.filter(f => f.cid === c.id).sort((a, b) => b.at - a.at);
    return `<div class="phrow"><h1 class="ph">${t('cp.files')}</h1><label class="btn grad upl sm">${icon('upload', 'sm')} ${t('fl.upload')}<input type="file" data-act="pupload" data-id="${c.id}" multiple hidden></label></div><div class="card"><ul class="flist">${fs.map(f => fileRow(f, true)).join('') || `<li class="muted">${t('c.empty')}</li>`}</ul><p class="muted sm">${icon('shield', 'sm')} ${t('fl.note')}</p></div>${aiWidget(c)}`;
  }
  function ptInvoices(c) {
    const inv = D.invoices.filter(i => i.cid === c.id).sort((a, b) => b.issued - a.issued), due = inv.filter(i => i.status !== 'paid').reduce((a, i) => a + i.amount, 0);
    return `<h1 class="ph">${t('cp.invoices')}</h1><div class="kpis three">${kpi('cp.k1', sarH(due), 0, '#f97316', 'clock').replace(/<span class="dl[^]*?<\/span><\/div>$/, '</div>')}${kpi('cp.k2', sarH(inv.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0)), 0, '#16a34a', 'check').replace(/<span class="dl[^]*?<\/span><\/div>$/, '</div>')}${kpi('cp.k3', bdi(inv.length), 0, '#7c3aed', 'receipt').replace(/<span class="dl[^]*?<\/span><\/div>$/, '</div>')}</div><div class="card">${invTable(inv, true)}</div>${aiWidget(c)}`;
  }
  function ptMessages(c) {
    let th = D.threads.find(x => x.cid === c.id);
    if (th && th.agentUnread) { th.agentUnread = 0; save(); }
    const pm = mem((D.projects.find(p => p.cid === c.id) || {}).lead || 't1');
    return `<h1 class="ph">${t('cp.messages')}</h1><div class="card pthread"><div class="ith-h">${avatar(pm.name)}<div><b>${esc(nm(pm.name))}</b><small>${t('role.' + pm.role)} · ${esc(agency())}</small></div></div><div class="msgs" id="msgs">${(th ? th.msgs : []).map(m => `<div class="msg ${m.from === 'client' ? 'me' : ''}"><p>${esc(msgText(m))}</p><small>${bdi(timeF(m.at))}</small></div>`).join('') || `<p class="empty">${t('cp.noMsgs')}</p>`}</div>
      <form class="mcomp" data-form="pmsg" data-id="${c.id}"><input name="text" maxlength="600" autocomplete="off" placeholder="${t('ms.type')}" aria-label="${t('ms.type')}"><button class="sendb" type="submit" aria-label="${t('c.send')}">${icon('send', 'flip')}</button></form></div>${aiWidget(c)}`;
  }
  /* portal AI assistant */
  const PCHAT = { cid: null, open: false, items: [], hist: [], busy: false };
  function pchatInit(c) { if (PCHAT.cid !== c.id) Object.assign(PCHAT, { cid: c.id, items: [{ who: 'bot', text: t('ai.hello', { n: firstT(c.contact) }), at: Date.now(), chips: true }], hist: [] }); }
  function aiWidget(c) {
    pchatInit(c);
    return `<button class="aifab ${PCHAT.open ? 'hide' : ''}" data-act="paiOpen">${icon('sparkles')}<span>${t('ai.fab')}</span></button>
    <section class="wpanel ${PCHAT.open ? 'open' : ''}" aria-label="AI"><header><span class="wav">${icon('robot')}</span><div><b>${t('ai.title')}</b><small>${t('ai.sub')}</small></div><button class="ibtn ghost-w" data-act="paiClose" aria-label="${t('c.close')}">${icon('x')}</button></header>
      <div class="wbody" id="wbody">${pchatMsgs()}</div><form class="wcomp" data-form="pai"><input name="q" maxlength="400" autocomplete="off" placeholder="${t('ai.ph')}" aria-label="${t('ai.ph')}"><button class="sendb" type="submit" aria-label="${t('c.send')}" ${PCHAT.busy ? 'disabled' : ''}>${icon('send', 'flip')}</button></form></section>`;
  }
  function pchatMsgs() {
    const last = PCHAT.items.length - 1;
    return PCHAT.items.map((m, i) => `<div class="wm ${m.who}">${m.live ? `<span class="livebadge">${t('c.live')}</span>` : ''}<p>${esc(m.text)}</p>${m.link ? `<a class="btn ghost sm" href="#/portal/${PCHAT.cid}/${m.link}">${t('cp.' + m.link)} ${icon('arrowRight', 'flip sm')}</a>` : ''}<small class="wt">${bdi(timeF(m.at))}</small></div>${i === last && m.chips ? `<div class="wchips">${[1, 2, 3, 4].map(k => `<button data-act="paiChip" data-txt="${esc(t('ai.q' + k))}">${t('ai.q' + k)}</button>`).join('')}</div>` : ''}`).join('') + (PCHAT.busy ? '<div class="wm bot typing"><i></i><i></i><i></i></div>' : '');
  }
  function renderPchat() { const b = $('#wbody'); if (!b) return; b.innerHTML = pchatMsgs(); b.scrollTop = b.scrollHeight; const s = $('.wcomp .sendb'); if (s) s.disabled = PCHAT.busy; }
  function ruleAnswer(c, q) {
    const s = AI.toLatin(q).toLowerCase();
    const ps = D.projects.filter(p => p.cid === c.id && p.status !== 'done'), inv = D.invoices.filter(i => i.cid === c.id && i.status !== 'paid'), fs = D.files.filter(f => f.cid === c.id).sort((a, b) => b.at - a.at);
    if (/invoice|pay|due|bill|amount|فاتور|دفع|مستحق|مبلغ|انوائس|ادائیگی|بل|رقم/.test(s)) return inv.length ? { text: t('ai.inv', { list: inv.map(i => `${i.id}: ${sar(i.amount)} — ${t('col.due')} ${dateF(i.due)}`).join('\n') }), link: 'invoices' } : { text: t('ai.invNone') };
    if (/file|design|document|pdf|ملف|تصميم|مستند|فائل|ڈیزائن/.test(s)) return fs.length ? { text: t('ai.files', { list: fs.slice(0, 3).map(f => `${f.name} (${f.approved ? t('fl.approved') : t('fl.waiting')})`).join('\n') }), link: 'files' } : { text: t('c.empty') };
    if (/manager|talk|call|human|team|message|مدير|فريق|تواصل|رسالة|مینیجر|ٹیم|بات|پیغام/.test(s)) { const p = ps[0] || D.projects.find(x => x.cid === c.id); return { text: t('ai.mgr', { m: nm(mem(p ? p.lead : 't1').name) }), link: 'messages' }; }
    if (/status|progress|update|project|when|ready|حالة|تقدم|مشروع|متى|جاهز|اسٹیٹس|پراجیکٹ|کب|تیار|کہاں/.test(s)) return { text: t('ai.status', { list: ps.map(p => { const nx = D.tasks.find(k => k.pid === p.id && k.status !== 'done'); return `• ${pname(p)}: ${p.progress}% — ${t('col.due')} ${dateF(p.due)}${nx ? ' · ' + t('ai.next') + ': ' + t(nx.k) : ''}`; }).join('\n') }), link: 'projects' };
    return null;
  }
  async function pask(text) {
    const c = cli(PCHAT.cid); if (PCHAT.busy || !text.trim()) return;
    PCHAT.items.push({ who: 'me', text: text.trim(), at: Date.now() }); PCHAT.hist.push({ role: 'user', text: text.trim() });
    const rule = ruleAnswer(c, text);
    PCHAT.busy = true; renderPchat();
    const r = await AI.portal(PCHAT.hist, clientInfo(c), L(), agency());
    PCHAT.busy = false;
    const map = { open_invoices: 'invoices', open_files: 'files', open_projects: 'projects', message_team: 'messages' };
    if (r) { PCHAT.items.push({ who: 'bot', text: r.reply, live: true, at: Date.now(), link: map[r.action] }); PCHAT.hist.push({ role: 'model', text: r.reply }); }
    else if (rule) PCHAT.items.push(Object.assign({ who: 'bot', at: Date.now() }, rule));
    else PCHAT.items.push({ who: 'bot', text: t('ai.generic'), at: Date.now(), chips: true });
    D.aiLog.unshift({ at: Date.now(), cid: c.id, q: text.slice(0, 120) }); D.aiLog = D.aiLog.slice(0, 30); save();
    renderPchat();
  }

  /* ================= ROUTER ================= */
  const PAGES = { dashboard: pgDashboard, clients: pgClients, projects: pgProjects, tasks: pgTasks, messages: pgMessages, files: pgFiles, invoices: pgInvoices, proposals: pgProposals, tickets: pgTickets, team: pgTeam, reports: pgReports, settings: pgSettings };
  function route() { const h = location.hash || '#/'; let m = h.match(/^#\/app\/?([a-z]*)/); if (m) return { kind: 'app', page: m[1] || 'dashboard' }; m = h.match(/^#\/portal\/(c[\w]+)\/?([a-z]*)/); if (m) return { kind: 'portal', cid: m[1], tab: m[2] || 'overview' }; return { kind: 'home' }; }
  function render() {
    const r = route(), root = $('#root'); const key = r.kind + (r.page || r.tab || '') + (r.cid || '');
    if (r.kind !== 'home' && !USER) { root.innerHTML = landing(); document.body.className = 'in-land'; setTimeout(() => startModal(r.kind === 'portal' ? r.cid : null), 30); }
    else if (r.kind === 'app') { const pg = PAGES[r.page] ? r.page : 'dashboard'; root.innerHTML = shell(pg, PAGES[pg]()); document.body.className = 'in-app'; }
    else if (r.kind === 'portal') { if (!D.clients.some(c => c.id === r.cid)) { location.hash = '#/portal/c1/overview'; return; } root.innerHTML = portal(r.cid, r.tab); document.body.className = 'in-portal'; }
    else { root.innerHTML = landing(); document.body.className = 'in-land'; }
    const ms = $('#msgs'); if (ms) ms.scrollTop = ms.scrollHeight; const wb = $('#wbody'); if (wb) wb.scrollTop = wb.scrollHeight;
    if (render._k !== key) window.scrollTo(0, 0); render._k = key;
  }
  window.addEventListener('hashchange', () => { UI.sidebar = false; UI.menus = null; closeDrawer(); closeModal(); render(); });
  function startModal(portalCid) {
    modal(t('start.t'), `<p class="muted">${t('start.s')}</p><form class="form" data-form="start" data-portal="${portalCid || ''}" novalidate><label>${t('start.name')} *<input name="name" required maxlength="60" autocomplete="name"></label><label>${t('start.email')} *<input name="email" type="email" required maxlength="120" autocomplete="email"></label>
      <div class="row2"><label>${t('se.agency')}<input name="company" maxlength="80"></label><label>${t('start.wa')}<input name="whatsapp" type="tel" maxlength="25"></label></div><p class="err" hidden>${t('start.req')}</p>
      <button class="btn grad block lg" type="submit">${t('start.go')} ${icon('arrowRight', 'flip')}</button><p class="muted sm c">${icon('shield', 'sm')} ${t('start.privacy')}</p></form>`, 'narrow');
  }

  /* ================= EVENTS ================= */
  function globalSearch(q) {
    const box = $('#sres'); if (!box) return; q = q.trim().toLowerCase(); if (q.length < 2) { box.classList.remove('open'); return; }
    const cs = D.clients.filter(c => [c.name.en, c.name.ar, c.name.ur, c.contact.en, c.contact.ar].join(' ').toLowerCase().includes(q)).slice(0, 4);
    const ps = D.projects.filter(p => [I18N.dicts.en['svc.' + p.svc], t('svc.' + p.svc)].join(' ').toLowerCase().includes(q)).slice(0, 4);
    const fs = D.files.filter(f => f.name.toLowerCase().includes(q)).slice(0, 3), iv = D.invoices.filter(i => i.id.toLowerCase().includes(q)).slice(0, 3);
    box.innerHTML = (cs.map(c => `<button data-act="client" data-id="${c.id}">${cav(c, 'sm')}<span>${esc(nm(c.name))}</span><small>${t('col.client')}</small></button>`).join('') + ps.map(p => `<button data-act="project" data-id="${p.id}">${icon('folder')}<span>${esc(pname(p))} · ${esc(nm(cli(p.cid).name))}</span><small>${bdi(p.progress + '%')}</small></button>`).join('') + fs.map(f => `<button data-act="nav2" data-h="#/app/files">${icon('file')}<span>${bdi(f.name)}</span><small>${t('sd.files')}</small></button>`).join('') + iv.map(i => `<button data-act="invView" data-id="${i.id}">${icon('receipt')}<span><bdi>${i.id}</bdi></span><small>${sar(i.amount)}</small></button>`).join('')) || `<p class="empty">${t('c.empty')}</p>`;
    box.classList.add('open');
  }
  const closeMenus = () => { UI.menus = null; $$('.dd.open').forEach(d => d.classList.remove('open')); };
  document.addEventListener('click', async ev => {
    const a = ev.target.closest('[data-act]');
    if (!a || a.tagName === 'SELECT' || (a.tagName === 'INPUT' && a.type !== 'checkbox')) { if (UI.menus && !ev.target.closest('.dd')) closeMenus(); if (!ev.target.closest('#gsearch')) { const b = $('#sres'); if (b) b.classList.remove('open'); } return; }
    const act = a.dataset.act, id = a.dataset.id;
    if (!['menu', 'lang'].includes(act) && UI.menus) closeMenus();
    const sres = $('#sres'); if (sres) sres.classList.remove('open');
    switch (act) {
      case 'menu': ev.preventDefault(); UI.menus = UI.menus === id ? null : id; $$('.dd').forEach(d => d.classList.toggle('open', d.contains(a) && !!UI.menus)); break;
      case 'lang': PREFS.lang = a.dataset.l; savePrefs(); I18N.set(a.dataset.l); UI.menus = null; PCHAT.cid = null; render(); break;
      case 'theme': PREFS.theme = PREFS.theme === 'dark' ? 'light' : 'dark'; savePrefs(); document.documentElement.dataset.theme = PREFS.theme; render(); break;
      case 'setTheme': PREFS.theme = a.dataset.v; savePrefs(); document.documentElement.dataset.theme = PREFS.theme; render(); break;
      case 'start': ev.preventDefault(); closeModal(); if (USER) location.hash = '#/app/dashboard'; else startModal(); break;
      case 'startPortal': ev.preventDefault(); closeModal(); if (USER) location.hash = '#/portal/' + id + '/overview'; else startModal(id); break;
      case 'scroll': { ev.preventDefault(); const n = $('.lnav'); if (n) n.classList.remove('open'); const el = $(a.getAttribute('href')); if (el) el.scrollIntoView({ behavior: 'smooth' }); break; }
      case 'lnav': $('.lnav').classList.toggle('open'); break;
      case 'closeModal': closeModal(); break;
      case 'closeDrawer': closeDrawer(); break;
      case 'nav': UI.sidebar = false; break;
      case 'nav2': location.hash = a.dataset.h; break;
      case 'sidebar': UI.sidebar = !UI.sidebar; $('.app') && $('.app').classList.toggle('sb-open', UI.sidebar); break;
      case 'logout': USER = null; try { localStorage.removeItem(UKEY); localStorage.removeItem(KEY); } catch (e) {} D = SEED.seed(); save(); PCHAT.cid = null; location.hash = '#/'; render(); break;
      case 'reset': if (confirm(t('top.reset') + '?')) { D = SEED.seed(); save(); UI.chat = null; PCHAT.cid = null; toast(t('se.resetDone')); render(); } break;
      case 'markRead': D.notifs.forEach(n => n.read = true); save(); render(); break;
      case 'dtab': UI.tab = a.dataset.v; render(); break;
      case 'pf': UI.pf = a.dataset.v; render(); break;
      case 'inv': UI.inv = a.dataset.v; render(); break;
      case 'client': clientDrawer(id); break;
      case 'project': ev.stopPropagation(); closeModal(); projectDrawer(id); break;
      case 'addProject': modal(t('pj.new'), projectForm()); break;
      case 'editProject': modal(t('c.edit'), projectForm(prj(id))); break;
      case 'delProject': if (confirm(t('c.confirmDel'))) { D.projects = D.projects.filter(p => p.id !== id); D.tasks = D.tasks.filter(k => k.pid !== id); save(); closeDrawer(); toast(t('c.deleted')); render(); } break;
      case 'addClient': modal(t('cl.add'), `<form class="form" data-form="client" novalidate><div class="row2"><label>${t('cl.company')} *<input name="name" required maxlength="60"></label><label>${t('col.contact')} *<input name="contact" required maxlength="60"></label></div><div class="row3"><label>${t('cl.industry')}<select name="industry">${['health', 'realestate', 'food', 'edu', 'beauty', 'tech', 'trade', 'travel', 'fitness', 'auto', 'legal'].map(i => `<option value="${i}">${t('ind.' + i)}</option>`).join('')}</select></label><label>${t('col.city')}<select name="city">${SEED.CITIES.map(c => `<option value="${c}">${t('city.' + c)}</option>`).join('')}</select></label><label>WhatsApp<input name="phone" maxlength="20" inputmode="tel"></label></div><div class="mfoot"><button type="button" class="btn ghost" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`); break;
      case 'delClient': if (confirm(t('c.confirmDel'))) { D.clients = D.clients.filter(c => c.id !== id); D.projects = D.projects.filter(p => p.cid !== id); D.threads = D.threads.filter(x => x.cid !== id); save(); closeDrawer(); toast(t('c.deleted')); render(); } break;
      case 'weekly': {
        const c = cli(id); let box = $('#wk-' + id); if (!box) { clientDrawer(id); box = $('#wk-' + id); }
        box.innerHTML = `<p class="muted sm"><span class="spin"></span> ${t('c.thinking')}</p>`; box.scrollIntoView({ block: 'nearest' });
        const r = await AI.update(clientInfo(c), L(), agency());
        const txt = r || weeklyFallback(c); box.innerHTML = `<h4>${t('cl.weekly')}</h4>` + draftBox('wkt-' + id, txt, !!r, `<a class="btn ghost sm" href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Weekly project update')}&body=${encodeURIComponent(txt)}">${icon('mail', 'sm')} Email</a>`); break;
      }
      case 'copy': { const v = $('#' + id).value; try { await navigator.clipboard.writeText(v); } catch (e) {} toast(t('c.copied')); break; }
      case 'toggleTask': { const k = D.tasks.find(x => x.id === id); k.status = k.status === 'done' ? 'todo' : 'done'; save(); const p = k.pid; render(); projectDrawer(p); break; }
      case 'addTask': modal(t('tk.add'), `<form class="form" data-form="task" novalidate><label>${t('tk.title')} *<input name="title" required maxlength="80"></label><div class="row3"><label>${t('col.project')}<select name="pid">${D.projects.filter(p => p.status !== 'done').map(p => `<option value="${p.id}">${esc(pname(p))} · ${esc(nm(cli(p.cid).name))}</option>`).join('')}</select></label><label>${t('tk.who')}<select name="who">${D.team.map(m => `<option value="${m.id}">${esc(nm(m.name))}</option>`).join('')}</select></label><label>${t('tc.pri')}<select name="pri">${['high', 'med', 'low'].map(p => `<option value="${p}">${t('pri.' + p)}</option>`).join('')}</select></label></div><label>${t('col.due')}<input name="due" type="date" value="${new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10)}"></label><div class="mfoot"><button type="button" class="btn ghost" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`); break;
      case 'whoTasks': UI.who = id; break;
      case 'openThread': { UI.chat = id; const th = D.threads.find(x => x.cid === id); if (th) th.unread = 0; else D.threads.unshift({ cid: id, unread: 0, msgs: [] }); save(); closeDrawer(); if (route().page !== 'messages') location.hash = '#/app/messages'; else render(); break; }
      case 'closeThread': UI.chat = null; render(); break;
      case 'aiReply': {
        const th = D.threads.find(x => x.cid === UI.chat), c = cli(UI.chat), inp = $('.mcomp input'); inp.value = '…'; a.disabled = true;
        const r = await AI.reply(clientInfo(c), L(), agency(), th.msgs.slice(-6).map(m => ({ role: m.from === 'me' ? 'agent' : 'client', text: msgText(m) })));
        const p = D.projects.find(x => x.cid === c.id && x.status !== 'done');
        inp.value = r || t('ms.fb', { n: firstT(c.contact), p: p ? pname(p) : '', v: p ? p.progress : 0, d: p ? dateF(p.due) : '' }); inp.dataset.ai = '1'; a.disabled = false; inp.focus(); break;
      }
      case 'dl': toast(t('fl.dlDemo')); break;
      case 'delFile': D.files = D.files.filter(f => f.id !== id); save(); toast(t('c.deleted')); render(); break;
      case 'approveFile': { const f = D.files.find(x => x.id === id); f.approved = true; log('act.approved', { c: f.cid, f: f.name }, 'check'); save(); toast(t('fl.approvedT')); render(); break; }
      case 'markPaid': { const i = D.invoices.find(x => x.id === id); i.status = 'paid'; i.paidAt = Date.now(); log('act.paid', { c: i.cid, amt: i.amount }, 'card'); save(); toast(t('iv.paidT')); render(); break; }
      case 'pay': { const i = D.invoices.find(x => x.id === id); modal(t('iv.payT'), `<div class="paybox"><p class="muted">${t('iv.payS')}</p><div class="pb-amt"><small><bdi>${i.id}</bdi></small><b>${sarH(i.amount)}</b></div><div class="seg pm">${['mada', 'apple', 'transfer'].map((m, k) => `<label><input type="radio" name="pm" value="${m}" ${k ? '' : 'checked'}> ${t('iv.m.' + m)}</label>`).join('')}</div><button class="btn grad block lg" data-act="confirmPay" data-id="${i.id}">${icon('lock', 'sm')} ${t('iv.confirm')} · ${sarH(i.amount)}</button><p class="muted sm c">${icon('shield', 'sm')} ${t('iv.noCard')}</p></div>`, 'narrow'); break; }
      case 'confirmPay': { const i = D.invoices.find(x => x.id === id); i.status = 'paid'; i.paidAt = Date.now(); log('act.paid', { c: i.cid, amt: i.amount }, 'card'); save(); modal(t('iv.paidT'), `<div class="okbox">${icon('check')}<p>${t('iv.thanks', { id: '<bdi>' + i.id + '</bdi>' })}</p><button class="btn grad" data-act="closeModal">${t('c.close')}</button></div>`, 'narrow'); render(); break; }
      case 'invView': invView(id); break;
      case 'print': window.print(); break;
      case 'addInvoice': modal(t('iv.new'), `<form class="form" data-form="invoice" novalidate><label>${t('col.project')}<select name="pid">${D.projects.map(p => `<option value="${p.id}">${esc(pname(p))} · ${esc(nm(cli(p.cid).name))}</option>`).join('')}</select></label><div class="row2"><label>${t('iv.amount')} (SAR, ${t('iv.incl')}) *<input name="amount" type="number" min="1" required value="5000"></label><label>${t('col.due')}<input name="due" type="date" value="${new Date(Date.now() + 14 * DAY).toISOString().slice(0, 10)}"></label></div><div class="mfoot"><button type="button" class="btn ghost" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`, 'narrow'); break;
      case 'addProposal': proposalModal(); break;
      case 'viewProposal': { const p = D.proposals.find(x => x.id === id); modal(t('svc.' + p.svc) + ' · ' + nm(cli(p.cid).name), draftBox('pv-' + id, p.text, false), 'wide'); break; }
      case 'poStatus': { const p = D.proposals.find(x => x.id === id); p.status = a.dataset.v; save(); toast(t('po.' + p.status)); render(); break; }
      case 'poProject': { const p = D.proposals.find(x => x.id === id); const np = { id: uid('p'), cid: p.cid, svc: p.svc, progress: 0, status: 'notstarted', due: Date.now() + 42 * DAY, budget: p.amount, lead: 't1', start: Date.now(), done: null }; D.projects.unshift(np); p.project = np.id; log('act.newProject', { c: p.cid }, 'folder'); save(); toast(t('po.created')); render(); break; }
      case 'savePo': { const f = $('[data-form=proposal]'), fd = Object.fromEntries(new FormData(f).entries()); D.proposals.unshift({ id: 'PR-' + (Math.max(...D.proposals.map(p => +p.id.slice(3)), 30) + 1), cid: fd.cid, svc: fd.svc, amount: +fd.amount, status: 'draft', at: Date.now(), text: $('#po-text').value }); save(); closeModal(); toast(t('po.saved')); render(); break; }
      case 'addTicket': modal(t('tc.new'), `<form class="form" data-form="ticket" novalidate><label>${t('tc.subject')} *<input name="text" required maxlength="100"></label><div class="row3"><label>${t('col.client')}<select name="cid">${D.clients.map(c => `<option value="${c.id}">${esc(nm(c.name))}</option>`).join('')}</select></label><label>${t('tc.pri')}<select name="pri">${['high', 'med', 'low'].map(p => `<option value="${p}">${t('pri.' + p)}</option>`).join('')}</select></label><label>${t('tc.who')}<select name="who">${D.team.map(m => `<option value="${m.id}">${esc(nm(m.name))}</option>`).join('')}</select></label></div><div class="mfoot"><button type="button" class="btn ghost" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`, 'narrow'); break;
      case 'resolve': { const k = D.tickets.find(x => x.id === id); k.status = 'resolved'; save(); toast(t('tc.resolved')); render(); break; }
      case 'addMember': modal(t('tm.add'), `<form class="form" data-form="member" novalidate><label>${t('start.name')} *<input name="name" required maxlength="60"></label><label>${t('tm.role')}<select name="role">${['pm', 'design', 'dev', 'mkt', 'support'].map(r => `<option value="${r}">${t('role.' + r)}</option>`).join('')}</select></label><div class="mfoot"><button type="button" class="btn ghost" data-act="closeModal">${t('c.cancel')}</button><button class="btn grad" type="submit">${t('c.save')}</button></div></form>`, 'narrow'); break;
      case 'export': exportCSV(a.dataset.v); break;
      // portal
      case 'paiOpen': PCHAT.open = true; $('.wpanel') && $('.wpanel').classList.add('open'); $('.aifab') && $('.aifab').classList.add('hide'); renderPchat(); break;
      case 'paiClose': PCHAT.open = false; $('.wpanel').classList.remove('open'); $('.aifab').classList.remove('hide'); break;
      case 'paiChip': pask(a.dataset.txt); break;
    }
  });
  document.addEventListener('change', ev => {
    const a = ev.target.closest('[data-act]'); if (!a) return; const act = a.dataset.act;
    if (act === 'pstatus') { const p = prj(a.dataset.id); p.status = a.value; if (a.value === 'done') { p.progress = 100; p.done = Date.now(); log('act.milestone', { c: p.cid }, 'flag'); } save(); toast(t('c.saved')); render(); projectDrawer(p.id); }
    else if (act === 'progress') { const p = prj(a.dataset.id); p.progress = +a.value; if (p.progress > 0 && p.status === 'notstarted') p.status = 'progress'; log('act.progress', { c: p.cid, p: pname(p) + ' ' + p.progress + '%' }, 'trend'); save(); render(); projectDrawer(p.id); toast(t('c.saved')); }
    else if (act === 'kmove') moveTask(a.dataset.id, a.value);
    else if (act === 'who') { UI.who = a.value; render(); }
    else if (act === 'pclient') location.hash = '#/portal/' + a.value + '/' + (route().tab || 'overview');
    else if (act === 'upload' || act === 'pupload') {
      const files = Array.from(a.files || []).slice(0, 5); if (!files.length) return;
      const cid = act === 'pupload' ? a.dataset.id : 'c1'; const p = D.projects.find(x => x.cid === cid && x.status !== 'done') || D.projects.find(x => x.cid === cid);
      files.forEach(f => D.files.unshift({ id: uid('f'), name: f.name.slice(0, 60), pid: p ? p.id : 'p1', cid, size: Math.max(0.1, f.size / 1048576), at: Date.now(), by: act === 'pupload' ? 'client' : 't1', approved: act === 'pupload' }));
      log('act.files', { c: cid }, 'file'); save(); toast(t('fl.uploaded', { n: files.length })); render();
    }
  });
  document.addEventListener('input', ev => { const a = ev.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'gsearch') globalSearch(a.value); if (a.dataset.act === 'progress') { const v = $('#pv'); if (v) v.textContent = a.value + '%'; } });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if ($('#modal.open')) closeModal(); else if ($('#drawer.open')) closeDrawer(); else if (PCHAT.open) { PCHAT.open = false; const w = $('.wpanel'); if (w) { w.classList.remove('open'); $('.aifab').classList.remove('hide'); } } } });
  document.addEventListener('submit', async ev => {
    const f = ev.target.closest('[data-form]'); if (!f) return; ev.preventDefault();
    const fd = Object.fromEntries(new FormData(f).entries()), kind = f.dataset.form;
    const bad = $$('[required]', f).filter(i => !String(i.value).trim() || (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)));
    $$('.invalid', f).forEach(i => i.classList.remove('invalid')); bad.forEach(i => i.classList.add('invalid'));
    if (bad.length) { const er = $('.err', f); if (er) er.hidden = false; else toast(t('c.required'), 'err'); bad[0].focus(); return; }
    switch (kind) {
      case 'start': USER = { name: fd.name.trim(), email: fd.email.trim(), company: (fd.company || '').trim(), whatsapp: (fd.whatsapp || '').trim() }; lsSet(UKEY, USER);
        sendForm({ _subject: 'New ClientHub demo visitor: ' + USER.name, name: USER.name, email: USER.email, company: USER.company, whatsapp: USER.whatsapp, language: L(), demo: 'ClientHub client portal + agency CRM' }); closeModal();
        location.hash = f.dataset.portal ? '#/portal/' + f.dataset.portal + '/overview' : '#/app/dashboard'; render(); break;
      case 'contact': sendForm({ _subject: 'ClientHub demo — contact form: ' + fd.name, name: fd.name, whatsapp: fd.whatsapp, business: fd.business, message: fd.message, language: L() }); f.reset(); toast(t('ct.sent')); break;
      case 'project': { const data = { cid: fd.cid, svc: fd.svc, budget: +fd.budget, due: new Date(fd.due).getTime() + 12 * H, lead: fd.lead, status: fd.status };
        if (f.dataset.id) { const p = prj(f.dataset.id); Object.assign(p, data); if (p.status === 'done') { p.progress = 100; p.done = p.done || Date.now(); } }
        else { D.projects.unshift(Object.assign({ id: uid('p'), progress: data.status === 'done' ? 100 : 0, start: Date.now(), done: data.status === 'done' ? Date.now() : null }, data)); log('act.newProject', { c: fd.cid }, 'folder'); }
        save(); closeModal(); toast(t('c.saved')); render(); break; }
      case 'client': { const c = { id: uid('c'), name: { en: fd.name.trim(), ar: fd.name.trim(), ur: fd.name.trim() }, contact: { en: fd.contact.trim(), ar: fd.contact.trim(), ur: fd.contact.trim() }, industry: fd.industry, city: fd.city, phone: fd.phone || '', email: '', since: Date.now(), color: '#7c3aed' }; D.clients.unshift(c); save(); closeModal(); toast(t('c.saved')); render(); break; }
      case 'task': { D.tasks.unshift({ id: uid('k'), k: fd.title.trim(), pid: fd.pid, who: fd.who, status: 'todo', due: new Date(fd.due).getTime() + 12 * H, pri: fd.pri }); save(); closeModal(); toast(t('c.saved')); render(); break; }
      case 'msg': { const txt = (fd.text || '').trim(); if (!txt) return; const th = D.threads.find(x => x.cid === UI.chat); th.msgs.push({ from: 'me', at: Date.now(), text: txt, ai: f.text.dataset.ai === '1' }); th.agentUnread = (th.agentUnread || 0) + 1; save(); render(); const i = $('.mcomp input'); if (i && matchMedia('(pointer:fine)').matches) i.focus(); break; }
      case 'pmsg': { const txt = (fd.text || '').trim(); if (!txt) return; const cid = f.dataset.id; let th = D.threads.find(x => x.cid === cid); if (!th) { th = { cid, unread: 0, msgs: [] }; D.threads.unshift(th); } th.msgs.push({ from: 'client', at: Date.now(), text: txt }); th.unread = (th.unread || 0) + 1; log('act.msg', { c: cid }, 'message'); save(); render(); toast(t('cp.sent')); break; }
      case 'pai': { const q = f.q.value; f.q.value = ''; pask(q); break; }
      case 'invoice': { const p = prj(fd.pid); const n = Math.max(...D.invoices.map(i => +i.id.slice(4))) + 1; D.invoices.unshift({ id: 'INV-' + n, cid: p.cid, pid: p.id, amount: +fd.amount, issued: Date.now(), due: new Date(fd.due).getTime() + 12 * H, status: 'pending', paidAt: null }); log('act.invoice', { c: p.cid, amt: +fd.amount }, 'receipt'); save(); closeModal(); toast(t('c.saved')); render(); break; }
      case 'proposal': {
        const c = cli(fd.cid), out = $('#po-out'), btn = f.querySelector('button[type=submit]'); btn.disabled = true; out.innerHTML = `<p class="muted sm"><span class="spin"></span> ${t('c.thinking')}</p>`;
        const r = await AI.proposal({ client: nm(c.name), contact: nm(c.contact), industry: I18N.dicts.en['ind.' + c.industry], city: I18N.dicts.en['city.' + c.city], service: t('svc.' + fd.svc), budget_sar: +fd.amount, timeline_weeks: +fd.weeks, notes: fd.notes || '' }, L(), agency());
        btn.disabled = false; const txt = r || proposalFallback(c, fd.svc, +fd.amount, +fd.weeks, fd.notes);
        out.innerHTML = draftBox('po-text', txt, !!r, `<button type="button" class="btn grad sm" data-act="savePo">${icon('check', 'sm')} ${t('po.save')}</button>`); break;
      }
      case 'ticket': D.tickets.unshift({ id: 'TK-' + (Math.max(...D.tickets.map(k => +k.id.slice(3))) + 1), cid: fd.cid, text: fd.text.trim(), pri: fd.pri, status: 'open', at: Date.now(), who: fd.who }); save(); closeModal(); toast(t('c.saved')); render(); break;
      case 'member': D.team.push({ id: uid('t'), name: { en: fd.name.trim(), ar: fd.name.trim(), ur: fd.name.trim() }, role: fd.role }); save(); closeModal(); toast(t('c.saved')); render(); break;
      case 'profile': USER.name = fd.name.trim(); USER.company = (fd.company || '').trim(); lsSet(UKEY, USER); toast(t('c.saved')); render(); break;
    }
  });
  /* kanban drag (mouse anywhere on card, touch via grip) */
  let drag = null;
  document.addEventListener('pointerdown', ev => {
    const card = ev.target.closest('.kcard'); if (!card || ev.target.closest('select,button,a')) return;
    if (ev.pointerType !== 'mouse' && !ev.target.closest('.grip')) return;
    ev.preventDefault(); const r = card.getBoundingClientRect();
    const ghost = card.cloneNode(true); ghost.classList.add('ghost'); ghost.style.width = r.width + 'px'; document.body.appendChild(ghost);
    drag = { id: card.dataset.id, card, ghost, dx: ev.clientX - r.left, dy: ev.clientY - r.top, moved: false }; card.classList.add('dragging');
    const mv = e => { drag.moved = true; ghost.style.transform = `translate(${e.clientX - drag.dx}px,${e.clientY - drag.dy}px)`; $$('.kcol').forEach(c => c.classList.remove('over')); const el = document.elementFromPoint(e.clientX, e.clientY); const col = el && el.closest('.kcol'); if (col) col.classList.add('over'); };
    mv(ev);
    const up = e => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); ghost.remove(); card.classList.remove('dragging'); const el = document.elementFromPoint(e.clientX, e.clientY); const col = el && el.closest('.kcol'); $$('.kcol').forEach(c => c.classList.remove('over')); const d = drag; drag = null; if (col && d.moved) moveTask(d.id, col.dataset.col); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
  function exportCSV(kind) {
    const rows = kind === 'invoices' ? [['Invoice', 'Client', 'Project', 'Amount SAR', 'Issued', 'Due', 'Status']].concat(D.invoices.map(i => [i.id, cli(i.cid).name.en, I18N.dicts.en['svc.' + (prj(i.pid) || {}).svc] || '', i.amount, new Date(i.issued).toISOString().slice(0, 10), new Date(i.due).toISOString().slice(0, 10), i.status]))
      : [['Project', 'Client', 'Progress %', 'Status', 'Due', 'Budget SAR', 'Lead']].concat(D.projects.map(p => [I18N.dicts.en['svc.' + p.svc], cli(p.cid).name.en, p.progress, p.status, new Date(p.due).toISOString().slice(0, 10), p.budget, mem(p.lead).name.en]));
    const csv = '﻿' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'clienthub-' + kind + '-sample.csv'; document.body.appendChild(a); a.click(); a.remove(); toast(t('rp.done'));
  }
  render(); AI.health().then(() => { if (route().page === 'settings') render(); });
  window.__CH = { get D() { return D; }, PCHAT, render };
})();
