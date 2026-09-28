/* public/journal.js */
'use strict';
const $ = (s) => document.querySelector(s);
const OPS = [['magnum', 'Magnum 4D'], ['toto', 'SportsToto 4D'], ['damacai', 'DaMaCai 1+3D'], ['dragon', 'Grand Dragon 4D'], ['sandakan', 'Sandakan 4D'], ['sabah88', 'Sabah 88 4D'], ['cashsweep', 'Sarawak CashSweep'], ['sgpools', 'Singapore 4D']];
const state = { data: null, picks: [] };
const rm = (n) => (n < 0 ? '-RM' : 'RM') + Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const tierLabel = { '1st': '1st', '2nd': '2nd', '3rd': '3rd', special: 'Special', consolation: 'Consolation' };

function todayISO() { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); }

async function load() {
  const r = await fetch('/api/journal', { cache: 'no-store' });
  state.data = await r.json();
  render();
}

function render() {
  const d = state.data;
  const s = d.summary;
  $('#netVal').textContent = rm(s.net);
  $('#netVal').className = 'hero-net ' + (s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : '');
  $('#netSub').textContent = s.count ? `${s.count} entries · ${s.pending} pending · RM${s.spent.toFixed(2)} in` : 'no entries yet';

  $('#ledger').innerHTML = [
    ['📓 Entries', s.count, s.pending ? s.pending + ' pending' : 'all checked', ''],
    ['💸 Spent', 'RM' + s.spent.toFixed(2), 'total staked', ''],
    ['🎉 Won', 'RM' + s.won.toFixed(2), s.numbers ? s.hits + '/' + s.numbers + ' numbers hit' : '—', s.won > 0 ? 'pos' : ''],
    ['📊 Net', rm(s.net), s.net >= 0 ? 'in the green' : 'down', s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : ''],
    ['🎯 Hit rate', s.hitRate + '%', 'random baseline ≈ 3%', ''],
    ['👑 Best', s.best ? s.best.num : '—', s.best ? `${tierLabel[s.best.tier]} · ${rm(s.best.won)} · ${s.best.date}` : 'no wins yet', s.best ? 'pos' : ''],
  ].map(([l, v, sub, cls]) => `<div class="card"><div class="c-l">${l}</div><div class="c-v ${cls}">${v}</div><div class="c-s">${sub}</div></div>`).join('');

  renderOmens(s.omens);
  renderSpark(d.entries.slice().reverse());
  renderTimeline(d.entries);
  buildOmens(d.omenCatalog);
}

function renderOmens(omens) {
  const keys = Object.keys(omens || {});
  if (!keys.length) { $('#omensPanel').hidden = true; return; }
  $('#omensPanel').hidden = false;
  const L = state.data.omenCatalog;
  const rows = keys.map((k) => {
    const o = omens[k];
    const net = o.won - o.spent;
    return `<tr><td>${L[k] || k}</td><td class="num">${o.entries}</td><td class="num">${o.hits}</td><td class="num">RM${o.spent.toFixed(2)}</td><td class="num">RM${o.won.toFixed(2)}</td><td class="num ${net > 0 ? 'pos' : net < 0 ? 'neg' : ''}">${rm(net)}</td><td class="num">${o.spent ? ((o.won - o.spent) / o.spent * 100).toFixed(0) + '%' : '—'}</td></tr>`;
  }).join('');
  $('#omensTable').innerHTML = `<thead><tr><th>Omen</th><th class="num">Entries</th><th class="num">Hits</th><th class="num">Staked</th><th class="num">Won</th><th class="num">Net</th><th class="num">ROI</th></tr></thead><tbody>${rows}</tbody>`;
}

function renderSpark(chron) {
  let cum = 0;
  const pts = chron.map((e) => { cum += e.net; return cum; });
  const box = $('#spark');
  if (pts.length < 2) { box.innerHTML = '<div class="jnote">Add 2+ checked entries to see your curve. ' + (pts.length === 1 ? 'Current: ' + rm(pts[0]) : '') + '</div>'; $('#sparkNote').textContent = ''; return; }
  const W = 720, H = 180, pad = 24;
  const mn = Math.min(0, ...pts), mx = Math.max(0, ...pts);
  const sx = (i) => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const sy = (v) => H - pad - ((v - mn) / ((mx - mn) || 1)) * (H - pad * 2);
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  const area = `M${pad},${sy(0).toFixed(1)} ` + line.slice(1) + ` L${sx(pts.length - 1).toFixed(1)},${sy(0).toFixed(1)} Z`;
  const zero = sy(0);
  const last = pts[pts.length - 1];
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="spark" preserveAspectRatio="none">
    <path d="${area}" fill="${last >= 0 ? 'rgba(0,200,120,.14)' : 'rgba(255,60,60,.12)'}"/>
    <line x1="${pad}" y1="${zero.toFixed(1)}" x2="${W - pad}" y2="${zero.toFixed(1)}" stroke="rgba(255,255,255,.22)" stroke-dasharray="4 4"/>
    <path d="${line}" fill="none" stroke="${last >= 0 ? '#00c878' : '#ff3c3c'}" stroke-width="2.5"/>
    <circle cx="${sx(pts.length - 1).toFixed(1)}" cy="${sy(last).toFixed(1)}" r="4" fill="${last >= 0 ? '#00c878' : '#ff3c3c'}"/>
  </svg>`;
  $('#sparkNote').textContent = `${pts.length} checked entries · peak ${rm(Math.max(...pts))} · now ${rm(last)}`;
}

function renderTimeline(entries) {
  $('#tlCount').textContent = entries.length ? entries.length + ' entries' : '';
  const box = $('#timeline');
  if (!entries.length) {
    box.innerHTML = `<div class="empty">Nothing here yet. Write your first number above — or steal one from <a href="/predict.html">Predict</a>.<br><span class="hint">Every entry is auto-checked against the real archive and costed in RM.</span></div>`;
    return;
  }
  const OP = Object.fromEntries(OPS);
  box.innerHTML = entries.map((e) => {
    const tiles = e.numbers.map((n) => {
      if (n.status === 'pending') return `<div class="nt pending"><b>${n.num}</b><span>⏳ pending</span></div>`;
      if (n.status === 'hit') return `<div class="nt hit"><b>${n.num}</b><span>✓ ${tierLabel[n.tier]} ${n.bet} · +${rm(n.won)}</span></div>`;
      return `<div class="nt miss"><b>${n.num}</b><span>✕ miss</span></div>`;
    }).join('');
    const netCls = e.net > 0 ? 'pos' : e.net < 0 ? 'neg' : '';
    return `<article class="tl-item ${e.resolved ? '' : 'pending'}">
      <div class="tl-head">
        <img class="logo sm" src="/images/${e.operator}.png" alt="" onerror="this.style.visibility='hidden'">
        <b>${OP[e.operator] || e.operator}</b>
        <span class="dim">${e.drawDate}${e.drawNo ? ' · ' + e.drawNo : ''}</span>
        <span class="tl-omen">${e.omenLabel}</span>
        <span class="tl-net ${netCls}">${rm(e.net)}</span>
        <button class="x" data-id="${e.id}" title="delete">✕</button>
      </div>
      <div class="tl-nums">${tiles}</div>
      ${e.note ? `<div class="tl-note">${escapeHtml(e.note)}</div>` : ''}
      <div class="tl-foot dim">staked RM${e.spent.toFixed(2)}${e.source && e.source !== 'journal' ? ' · via ' + escapeHtml(e.source) : ''} · ${new Date(e.createdAt).toLocaleString('en-GB')}</div>
    </article>`;
  }).join('');
  box.querySelectorAll('.x').forEach((b) => b.onclick = async () => {
    if (!confirm('Delete this entry?')) return;
    await fetch('/api/journal?id=' + encodeURIComponent(b.dataset.id), { method: 'DELETE' });
    load();
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function buildOmens(cat) {
  const sel = $('#fOmen');
  if (sel.options.length) return;
  sel.innerHTML = Object.entries(cat || {}).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
}

/* context strip: today's odds-free "energy" */
async function loadCtx() {
  const op = $('#fOp').value;
  const r = await fetch('/api/predict?operator=' + op + '&method=numerology').catch(() => null);
  if (!r || !r.ok) { $('#ctx').textContent = ''; return; }
  const j = await r.json();
  const p = j.picks || (j.methods && j.methods[0] && j.methods[0].picks) || [];
  state.picks = p.map((x) => (typeof x === 'string' ? x : x.num || x.number)).filter(Boolean);
  const moon = j.moon || (j.methods && j.methods[0] && j.methods[0].moon) || {};
  const bits = [];
  if (moon.moon) bits.push('🌙 ' + moon.moon);
  if (moon.zodiac) bits.push('🐉 ' + moon.zodiac);
  if (moon.planet) bits.push('🪐 ' + moon.planet);
  bits.push('✨ picks: ' + (state.picks.join(' ') || 'n/a'));
  $('#ctx').innerHTML = bits.join(' &nbsp;·&nbsp; ');
}

/* init */
(function init() {
  $('#fOp').innerHTML = OPS.map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('#fDate').value = todayISO();
  $('#fOp').onchange = loadCtx;
  buildOmens(null);
  loadCtx();
  load().then(() => buildOmens(state.data.omenCatalog));

  $('#btnRandom').onclick = () => {
    $('#fNums').value = Array.from({ length: 4 }, () => String(Math.floor(Math.random() * 10000)).padStart(4, '0')).join(', ');
  };
  $('#btnFromCtx').onclick = () => { if (state.picks.length) $('#fNums').value = state.picks.join(', '); };

  $('#btnSave').onclick = async () => {
    const nums = $('#fNums').value.split(/[^0-9]+/).filter(Boolean).map((s) => s.padStart(4, '0').slice(-4));
    if (!nums.length) { msg('Enter at least one 4-digit number.', true); return; }
    const amt = parseFloat($('#fAmt').value) || 1;
    const btn = $('#btnSave'); btn.disabled = true;
    try {
      const body = { drawDate: $('#fDate').value, operator: $('#fOp').value, bet: $('#fBet').value, amount: amt, omen: $('#fOmen').value, note: $('#fNote').value, source: 'journal', numbers: nums.map((n) => ({ num: n })) };
      const res = await fetch('/api/journal', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error(out.error || 'save failed');
      $('#fNums').value = ''; $('#fNote').value = '';
      msg('Saved. ' + (out.entry.resolved ? out.entry.won > 0 ? `Hit ${out.entry.numbers.filter((n) => n.status === 'hit').length} — ${rm(out.entry.net)}` : 'no hit, logged' : 'pending until the draw lands.'), '');
      load();
    } catch (err) { msg(err.message, true); }
    finally { btn.disabled = false; }
  };

  function msg(text, cls) {
    const el = $('#msg');
    el.textContent = text;
    el.className = 'jmsg ' + (cls === 'err' ? 'err' : '');
    clearTimeout(msg._t);
    msg._t = setTimeout(() => { el.textContent = ''; }, 6000);
  }
})();

