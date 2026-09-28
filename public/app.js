/* 4D LIVE — renders 4dmoon-faithful tables from /api/results */
'use strict';

const $ = (sel, root) => (root || document).querySelector(sel);
const IMG = (n) => `/images/${n}`;

/* ---------- tiny DOM builder ---------- */
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function val(v) { return v != null && v !== '' ? v : '&nbsp;'; }

/* number cell with checker/glow hooks */
function numCell(cls, cardId, slot, v, extraAttrs) {
  const td = el('td', cls);
  const div = el('div', null, val(v));
  if (v != null && v !== '') {
    div.dataset.num = String(v);
    div.dataset.key = cardId + '-' + slot;
    if (extraAttrs) for (const k in extraAttrs) div.dataset[k] = extraAttrs[k];
  }
  td.appendChild(div);
  return td;
}

/* ---------- 4dmoon card blocks ---------- */

function headerBlock(c, cardId) {
  const t = el('table', 'rtb');
  const tr = el('tr');
  const logoTd = el('td', c.cls);
  logoTd.style.width = '25%';
  if (c.logo) {
    const img = el('span');
    img.innerHTML = `<img class="logo" src="${IMG(c.logo)}" alt="">`;
    logoTd.appendChild(img);
  } else {
    logoTd.innerHTML = '<b style="font-size:26px">SP</b>';
  }
  const nameTd = el('td', c.cls);
  nameTd.style.width = '75%';
  const liveSpan = el('span', 'lsspan');
  liveSpan.id = cardId + '-live';
  liveSpan.innerHTML = '<img src="/images/live.gif" style="float:right">';
  nameTd.appendChild(el('span', 'hdr-name', c.name));
  nameTd.appendChild(liveSpan);
  nameTd.appendChild(el('br'));
  const rdd = el('span', 'rdd');
  const dd = el('div', 'rsdiv', c.date || '&nbsp;');
  const dn = el('div', 'rsdiv', c.drawNo || '&nbsp;');
  rdd.appendChild(dd);
  rdd.appendChild(document.createTextNode(' '));
  rdd.appendChild(dn);
  nameTd.appendChild(rdd);
  tr.appendChild(logoTd); tr.appendChild(nameTd);
  t.appendChild(tr);
  return t;
}

function prizes3(cardId, top, zodiac) {
  const t = el('table', 'rtb2');
  const hr = el('tr');
  hr.appendChild(el('td', 'rpl', '1st Prize'));
  hr.appendChild(el('td', 'rpl', '2nd Prize'));
  hr.appendChild(el('td', 'rpl', '3rd Prize'));
  t.appendChild(hr);
  const r = el('tr');
  ['1st', '2nd', '3rd'].forEach((lb, i) => {
    r.appendChild(numCell('rtn', cardId, 'P' + (i + 1), top ? top[i] : null, { src: lb }));
  });
  t.appendChild(r);
  if (zodiac) {
    const zr = el('tr');
    zr.appendChild(el('td', 'rpl', 'Zodiac'));
    const zc = el('td', 'rmgo');
    zc.colSpan = 2;
    zc.innerHTML = `<div style="font-weight:700">${zodiac}</div>`;
    zr.appendChild(zc);
    t.appendChild(zr);
  }
  return t;
}

/* Special/Consolation grids — fixed 4dmoon slot layouts (rows of 5, centered last row) */
function numberGrid(cardId, label, nums, opts) {
  opts = opts || {};
  const row = opts.row || 5;
  const cls = opts.cls || 'rbn';
  const list = (nums || []).filter((v) => v != null && v !== '');
  const slots = opts.slots != null ? opts.slots : list.length;
  const t = el('table', 'rtb2');
  const hr = el('tr');
  const h = el('td', 'rpl', label);
  h.colSpan = row;
  hr.appendChild(h);
  t.appendChild(hr);
  for (let i = 0; i < slots; i += row) {
    const r = el('tr');
    const inRow = Math.min(row, slots - i);
    const padLeft = inRow < row ? Math.floor((row - inRow) / 2) : 0;
    for (let p = 0; p < padLeft; p++) r.appendChild(el('td', null, '&nbsp;')).style.width = 100 / row + '%';
    for (let j = 0; j < inRow; j++) {
      const v = i + j < list.length ? list[i + j] : null;
      const cell = numCell(cls, cardId, label + (i + j + 1), v, { src: label });
      if (row === 4) cell.style.width = '25%';
      r.appendChild(cell);
    }
    while (r.children.length < row) r.appendChild(el('td', null, '&nbsp;')).style.width = 100 / row + '%';
    t.appendChild(r);
  }
  return t;
}

function jackpotBlock(cardId, title, jps) {
  if (!jps || !jps.length) return null;
  const t = el('table', 'rtb2');
  const hr = el('tr');
  const h = el('td', 'rpl', title || 'Jackpot Estimated Amount');
  h.colSpan = 5;
  hr.appendChild(h);
  t.appendChild(hr);
  for (const jp of jps) {
    const r = el('tr');
    const lb = el('td', 'rjpl', jp.label);
    lb.colSpan = 2;
    const v = el('td', 'rjpv');
    v.colSpan = 3;
    v.innerHTML = `RM ${jp.value}` + (jp.winners != null ? `<span class="winners">winners: ${jp.winners}</span>` : '');
    r.appendChild(lb); r.appendChild(v);
    t.appendChild(r);
  }
  return t;
}

/* balls row (rto2 cells + red "+" separator + extra) */
function ballsRow(balls, extra, extraLabel, gold) {
  const t = el('table', 'rtb2');
  const r = el('tr');
  (balls || []).forEach((b) => r.appendChild(el('td', 'rto2', val(b))));
  if (extra != null) {
    r.appendChild(el('td', 'plus-sep', '+'));
    const e = el('td', 'rto2' + (gold ? ' ball-gold' : ''), val(extra));
    r.appendChild(e);
  }
  t.appendChild(r);
  return t;
}

/* the classic full 4D card */
const SP_SLOTS = { magnum: 13, toto: 13, dragon: 13, sandakan: 13, sabah88: 13, damacai: 10, cashsweep: 10, sgpools: 10 };
function card4d(c) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr');
  const innerTd = el('td');
  innerTd.appendChild(headerBlock(c, c.id));
  innerTd.appendChild(prizes3(c.id, c.top, c.zodiac));
  const slots = SP_SLOTS[c.id] || 13;
  innerTd.appendChild(numberGrid(c.id, 'Special', c.special, { slots }));
  innerTd.appendChild(numberGrid(c.id, 'Consolation', c.consolation, { slots: 10 }));
  const jb = jackpotBlock(c.id, c.jackpotTitle, c.jackpots);
  if (jb) innerTd.appendChild(jb);
  outer.appendChild(innerTd);
  t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

/* card wrapper in grid */
function col(...cards) {
  const d = el('div', 'stack');
  cards.forEach((c) => c && d.appendChild(c));
  return d;
}

/* ---------- side game cards ---------- */

function fireballCard(fb) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(fb, 'fireball'));
  const fRow = el('table', 'rtb2');
  const r = el('tr');
  r.appendChild(el('td', 'rpl', 'Fireball'));
  const fcell = el('td', 'rtn');
  fcell.innerHTML = `<div style="color:#AD0006;font-weight:700">${fb.digit || '&nbsp;'}</div>`;
  r.appendChild(fcell);
  fRow.appendChild(r);
  td.appendChild(fRow);
  td.appendChild(numberGrid('fireball', `First Prize ( RM 500 )`, fb.first));
  td.appendChild(numberGrid('fireball', `Second Prize ( RM 200 )`, fb.second));
  td.appendChild(numberGrid('fireball', `Third Prize ( RM 100 )`, fb.third));
  td.appendChild(numberGrid('fireball', 'Special ( RM 30 )', fb.special));
  td.appendChild(numberGrid('fireball', 'Consolation ( RM 10 )', fb.consolation));
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function toto5dCard(g) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, 'toto5d'));
  const rows = el('table', 'rtb2');
  for (let i = 0; i < g.rows.length; i += 2) {
    const r = el('tr');
    for (let j = i; j < Math.min(i + 2, g.rows.length); j++) {
      const row = g.rows[j];
      r.appendChild(el('td', 'r5l', row.label));
      const c = numCell('rbn', 'toto5d', row.label, row.value);
      c.style.width = '38%';
      r.appendChild(c);
    }
    rows.appendChild(r);
  }
  td.appendChild(rows);
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function toto6dCard(g) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, 'toto6d'));
  const rows = el('table', 'rtb2');
  for (const row of g.rows) {
    const r = el('tr');
    r.appendChild(el('td', 'r5l', row.label));
    const c1 = numCell('rbn', 'toto6d', row.label + 'a', row.value);
    r.appendChild(c1);
    if (row.or) {
      r.appendChild(el('td', 'r5l', 'or'));
      r.appendChild(numCell('rbn', 'toto6d', row.label + 'b', row.value2));
    } else {
      const sp = el('td', 'rbn', '&nbsp;');
      sp.colSpan = 3;
      r.appendChild(sp);
    }
    rows.appendChild(r);
  }
  td.appendChild(rows);
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function dmc33Card(g) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, 'dmc33'));
  const p = el('table', 'rtb2');
  const hr = el('tr');
  ['1st Prize', '2nd Prize', '3rd Prize'].forEach((x) => hr.appendChild(el('td', 'rpl', x)));
  p.appendChild(hr);
  const r = el('tr');
  for (let i = 0; i < 3; i++) {
    const c = numCell('rbn', 'dmc33', 'P' + (i + 1), g.top ? g.top[i] : null);
    c.style.width = '33.3%';
    r.appendChild(c);
  }
  p.appendChild(r);
  const zr = el('tr');
  const zh = el('td', 'rpl', 'Bonus');
  zh.colSpan = 3;
  zr.appendChild(zh); p.appendChild(zr);
  const zrow = el('tr');
  for (let i = 0; i < 3; i++) {
    const c = el('td', 'rmg', val(g.zodiac ? g.zodiac[i] : null));
    c.style.width = '33.3%';
    zrow.appendChild(c);
  }
  p.appendChild(zrow);
  td.appendChild(p);
  td.appendChild(numberGrid('dmc33', 'Special', g.special, { slots: 10, row: 4, cls: 'rmg' }));
  td.appendChild(numberGrid('dmc33', 'Consolation', g.consolation, { slots: 10, row: 4, cls: 'rmg' }));
  const jb = jackpotBlock('dmc33', '3+3D Jackpot Estimated Amount', [1, 2, 3].map((i) => ({
    label: `${i}${['st', 'nd', 'rd'][i - 1]} Prize Bonus`,
    value: g.bonusAmt ? g.bonusAmt[i - 1] : null,
    winners: g.bonusWin ? g.bonusWin[i - 1] : null,
  })).filter((x) => x.value));
  if (jb) td.appendChild(jb);
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function mgoldCard(g) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, 'mgold'));
  const w = el('table', 'rtb2');
  const wh = el('tr');
  const whc = el('td', 'rpl', g.golden != null ? 'WINNING NUMBERS' : 'JACKPOT GOLD NUMBERS');
  whc.colSpan = 8;
  wh.appendChild(whc); w.appendChild(wh);
  td.appendChild(w);
  td.appendChild(ballsRow(g.balls, null, null));
  if (g.golden != null) {
    const gh = el('table', 'rtb2');
    const ghr = el('tr');
    const gc = el('td', 'rpl', 'GOLDEN NUMBER');
    gc.colSpan = 8;
    ghr.appendChild(gc); gh.appendChild(ghr);
    td.appendChild(gh);
    const gr = el('table', 'rtb2');
    const row = el('tr');
    const cell = el('td', 'rto2 ball-gold');
    cell.colSpan = 4;
    cell.style.fontSize = '26px';
    cell.innerHTML = `<b>${g.golden}</b>`;
    row.appendChild(cell);
    gr.appendChild(row);
    td.appendChild(gr);
  }
  const jb = jackpotBlock('mgold', 'Jackpot Gold Estimated Amount', g.jackpots);
  if (jb) td.appendChild(jb);
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function lifeCard(g) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, 'life'));
  const w = el('table', 'rtb2');
  const wh = el('tr');
  const whc = el('td', 'rpl', 'WINNING NUMBERS');
  whc.colSpan = 8;
  wh.appendChild(whc); w.appendChild(wh);
  td.appendChild(w);
  td.appendChild(ballsRow(g.balls));
  if (g.bonus && g.bonus.length) {
    const b = el('table', 'rtb2');
    const bh = el('tr');
    const bc = el('td', 'rpl', 'BONUS NUMBERS');
    bc.colSpan = 8;
    bh.appendChild(bc); b.appendChild(bh);
    td.appendChild(b);
    td.appendChild(ballsRow(g.bonus));
  }
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function simple3Card(g, cardId) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, cardId));
  const p = el('table', 'rtb2');
  const hr = el('tr');
  ['1st Prize', '2nd Prize', '3rd Prize'].forEach((x) => hr.appendChild(el('td', 'rpl', x)));
  p.appendChild(hr);
  const r = el('tr');
  (g.rows || []).forEach((v, i) => r.appendChild(numCell('rtn', cardId, 'P' + (i + 1), v)));
  p.appendChild(r);
  td.appendChild(p);
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function sabahLottoCard(g) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, 'sabahLotto'));
  const w = el('table', 'rtb2');
  const wh = el('tr');
  const whc = el('td', 'rpl', 'Lotto 6/45');
  whc.colSpan = 8;
  wh.appendChild(whc); w.appendChild(wh);
  td.appendChild(w);
  td.appendChild(ballsRow(g.balls, g.extra));
  const jb = jackpotBlock('sabahLotto', null, g.jackpots);
  if (jb) td.appendChild(jb);
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function seriesCard(g, series, cardId) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, cardId));
  for (const s of series) {
    const head = el('table', 'rtb2');
    const hr = el('tr');
    const h = el('td', 'rpl', `Series ${s.label} — Jackpot`);
    h.colSpan = 8;
    hr.appendChild(h); head.appendChild(hr);
    td.appendChild(head);
    td.appendChild(ballsRow(s.balls, s.extra));
    if (s.jackpot) {
      const j = el('table', 'rtb2');
      const r = el('tr');
      const l = el('td', 'rjpl', 'Jackpot');
      const v = el('td', 'rjpv', `RM ${s.jackpot}`);
      v.colSpan = 5;
      r.appendChild(l); r.appendChild(v);
      j.appendChild(r);
      td.appendChild(j);
    }
  }
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function threeColTable(title3, rows, cardId) {
  const t = el('table', 'rtb2');
  const hr = el('tr');
  title3.forEach((x) => {
    const c = el('td', 'rjpl', x);
    c.style.cssText = 'color:#fff;background-color:#55472d;width:33.3%';
    hr.appendChild(c);
  });
  t.appendChild(hr);
  for (const r of rows) {
    const tr = el('tr');
    tr.appendChild(el('td', 'rjpl', r.label));
    const a = el('td', 'rjpv', r.amount);
    const w = el('td', 'rjpv', r.winners);
    tr.appendChild(a); tr.appendChild(w);
    t.appendChild(tr);
  }
  return t;
}

function sgTotoCard(g) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, 'sgToto'));
  td.appendChild(ballsRow(g.balls, null));
  if (g.tiers) {
    td.appendChild(threeColTable(['Prize Division', 'Share Amount (Each)', 'No. of Winning Shares'], g.tiers, 'sgToto'));
  } else {
    td.appendChild(threeColTable(['Prize Group', 'Share Amount (Each)', 'No. of Winning Shares'], g.groups || [], 'sgToto'));
  }
  const sp = el('table', 'rtb2');
  sp.appendChild(el('tr', null, '<td style="height:17px">&nbsp;</td>'));
  td.appendChild(sp);
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

function sgSweepCard(g) {
  const wrap = el('div', 'mbx');
  const t = el('table', 'rtb');
  const outer = el('tr'), td = el('td');
  td.appendChild(headerBlock(g, 'sgSweep'));
  const w = el('table', 'rtb2');
  const wh = el('tr');
  const whc = el('td', 'rpl', 'SWEEP WINNING NUMBERS');
  whc.colSpan = 8;
  wh.appendChild(whc); w.appendChild(wh);
  td.appendChild(w);
  td.appendChild(ballsRow(g.balls));
  td.appendChild(threeColTable(['Prize', 'Share Amount (Each)', 'No. of Winning Shares'], g.tiers, 'sgSweep'));
  outer.appendChild(td); t.appendChild(outer);
  wrap.appendChild(t);
  return wrap;
}

/* ---------- render pipeline ---------- */

let prevVals = {};

function glow(div) {
  const key = div.dataset.key;
  const v = div.dataset.num;
  if (prevVals[key] !== undefined && prevVals[key] !== v) {
    div.classList.add('newrs');
  }
  prevVals[key] = v;
}

function render(data) {
  const cards = {};
  data.cards.forEach((c) => (cards[c.id] = c));
  const S = data.side || {};

  /* West — main Malaysian draw first (newspaper order), Grand Dragon moved to the bottom */
  const west = $('#westGrid');
  west.innerHTML = '';
  ['toto', 'damacai', 'magnum'].forEach((id) => cards[id] && west.appendChild(card4d(cards[id])));
  if (S.fireball) west.appendChild(fireballCard(S.fireball));
  const stack = [];
  if (S.toto5d) stack.push(toto5dCard(S.toto5d));
  if (S.toto6d) stack.push(toto6dCard(S.toto6d));
  if (S.lottos && S.lottos.length) {
    const wrap = el('div', 'mbx');
    const t = el('table', 'rtb');
    const outer = el('tr'), td = el('td');
    td.appendChild(headerBlock({
      name: 'SportsToto Lotto', logo: 'logo_toto.gif', cls: 'sttl',
      date: S.lottos[0].date, drawNo: S.lottos[0].drawNo,
    }, 'lotto'));
    for (const L of S.lottos) {
      const head = el('table', 'rtb2');
      const hr = el('tr');
      const h = el('td', 'rpl', L.name);
      h.colSpan = 8;
      hr.appendChild(h); head.appendChild(hr);
      td.appendChild(head);
      td.appendChild(ballsRow(L.balls, L.extra));
      const jb = jackpotBlock('lotto', null, L.jackpots);
      if (jb) td.appendChild(jb);
    }
    outer.appendChild(td); t.appendChild(outer);
    wrap.appendChild(t);
    stack.push(wrap);
  }
  west.appendChild(col(...stack));
  if (S.dmc33) west.appendChild(dmc33Card(S.dmc33));
  if (S.mgold) west.appendChild(mgoldCard(S.mgold));
  if (S.life) west.appendChild(lifeCard(S.life));

  /* East — 4dmoon east page order */
  const east = $('#eastGrid');
  east.innerHTML = '';
  if (cards.sandakan) east.appendChild(card4d(cards.sandakan));
  const sabahStack = [];
  if (S.sabah3d) sabahStack.push(simple3Card(S.sabah3d, 'sabah3d'));
  if (cards.sabah88) sabahStack.push(card4d(cards.sabah88));
  const sabahDate = (S.sabahLotto && S.sabahLotto.date) || (cards.sabah88 && cards.sabah88.date) || '';
  const sabahDn = (S.sabahLotto && S.sabahLotto.drawNo) || (cards.sabah88 && cards.sabah88.drawNo) || '';
  if (S.sabahLotto) sabahStack.push(sabahLottoCard(S.sabahLotto));
  if (S.sabahL6) sabahStack.push(seriesCard({
    name: 'Sabah Lotto 6', logo: 'logo_sabah88.gif', cls: 's88l', date: sabahDate, drawNo: sabahDn,
  }, S.sabahL6, 'sabahL6'));
  if (S.sabahL5) sabahStack.push(seriesCard({
    name: 'Sabah Lotto 5', logo: 'logo_sabah88.gif', cls: 's88l', date: sabahDate, drawNo: sabahDn,
  }, S.sabahL5, 'sabahL5'));
  east.appendChild(col(...sabahStack));
  const csStack = [];
  if (cards.cashsweep) csStack.push(card4d(cards.cashsweep));
  if (S.cs3d) csStack.push(simple3Card(S.cs3d, 'cs3d'));
  east.appendChild(col(...csStack));

  /* Singapore */
  const sg = $('#sgGrid');
  sg.innerHTML = '';
  if (cards.sgpools) sg.appendChild(card4d(cards.sgpools));
  if (S.sgToto) sg.appendChild(sgTotoCard(S.sgToto));

  /* Special draws */
  const sp = $('#specialGrid');
  sp.innerHTML = '';
  (data.specialDraws || []).forEach((c, i) => {
    sp.appendChild(card4d({ ...c, id: 'sp' + i, cls: 'spl', logo: null, jackpotTitle: null }));
  });
  const ns = data.nextSpecial;
  const banner = $('#nextSpecial');
  if (ns && ns.days <= 14) {
    banner.style.display = 'block';
    banner.innerHTML = `Next Special Draw: <b>${ns.date}</b> — in ${ns.days} day${ns.days === 1 ? '' : 's'}`;
  } else banner.style.display = 'none';

  /* Grand Dragon — daily, so it sits at the very bottom */
  const gd = $('#gdGrid');
  if (gd) {
    gd.innerHTML = '';
    if (cards.dragon) gd.appendChild(card4d(cards.dragon));
  }

  /* live badges */
  data.cards.forEach((c) => {
    const s = document.getElementById(c.id + '-live');
    if (s) s.style.display = c.live ? 'inline' : 'none';
  });
  (data.specialDraws || []).forEach((c, i) => {
    const s = document.getElementById('sp' + i + '-live');
    if (s) s.style.display = c.live ? 'inline' : 'none';
  });

  /* glow + remember */
  document.querySelectorAll('[data-num]').forEach((d) => {
    if (d.dataset.key) glow(d);
    const cell = d.closest('td');
    if (cell) {
      cell.dataset.num = d.dataset.num;
      cell.dataset.where = (d.dataset.src || '') + ' · ' + (d.dataset.key || '').split('-')[0];
    }
  });

  /* status */
  const s88 = $('#src88'), sMoon = $('#srcMoon');
  s88.className = 'src ' + (data.sources && data.sources.m4d88 === 'ok' ? 'ok' : 'err');
  sMoon.className = 'src ' + (data.sources && data.sources.m4dmoon === 'ok' ? 'ok' : 'err');
  const upd = new Date(data.updatedAt);
  $('#upd').textContent = (data.stale ? 'STALE ' : 'Updated ') + upd.toLocaleTimeString();
  $('#srcLine').textContent = `4d88: ${(data.sources || {}).m4d88 || '?'} · 4dmoon: ${(data.sources || {}).m4dmoon || '?'}`;
  document.title = (data.cards || []).some((c) => c.live) ? '🔴 4D LIVE — draw in progress' : '4D LIVE — results';
  applyChecker();
}

/* ---------- number checker ---------- */
function tierName(key, src) {
  const slot = (key.split('-')[1] || '').trim();
  const m = slot.match(/^P([123])$/);
  if (m) return ['1st Prize', '2nd Prize', '3rd Prize'][Number(m[1]) - 1];
  const s = slot.match(/^Special(\d+)$/);
  if (s) return 'Special #' + Number(s[1]);
  const c = slot.match(/^Consolation(\d+)$/);
  if (c) return 'Consolation #' + Number(c[1]);
  const f = slot.match(/^First Prize \( RM 500 \)(\d+)$/);
  if (f) return 'Fireball 1st (RM 500)';
  const f2 = slot.match(/^Second Prize \( RM 200 \)(\d+)$/);
  if (f2) return 'Fireball 2nd (RM 200)';
  const f3 = slot.match(/^Third Prize \( RM 100 \)(\d+)$/);
  if (f3) return 'Fireball 3rd (RM 100)';
  const sp = slot.match(/^Special \( RM 30 \)(\d+)$/);
  if (sp) return 'Fireball Special (RM 30)';
  const co = slot.match(/^Consolation \( RM 10 \)(\d+)$/);
  if (co) return 'Fireball Consolation (RM 10)';
  return src || slot;
}
const CARD_NAMES = {
  dragon: 'Grand Dragon', damacai: 'DaMaCai 1+3D', magnum: 'Magnum', toto: 'SportsToto',
  sandakan: 'Sandakan', sabah88: 'Sabah 88', cashsweep: 'CashSweep', sgpools: 'Singapore 4D',
  fireball: 'Toto Fireball', sp0: 'Special Draw 1', sp1: 'Special Draw 2', dmc33: 'DaMaCai 3+3D',
};
function applyChecker() {
  const v = ($('#chk').value || '').trim();
  document.querySelectorAll('.hit').forEach((n) => n.classList.remove('hit'));
  const out = $('#chkOut');
  if (!/^\d{3,6}$/.test(v)) { out.innerHTML = ''; return; }
  const hits = [];
  document.querySelectorAll('td[data-num]').forEach((td) => {
    if (td.dataset.num === v) {
      td.classList.add('hit');
      const key = td.dataset.key || '';
      const where = key.split('-')[0];
      hits.push(`<b class="win">${CARD_NAMES[where] || where}</b> ${tierName(key, td.dataset.where)}`);
    }
  });
  if (hits.length) out.innerHTML = '✔ ' + [...new Set(hits)].join(' &nbsp;·&nbsp; ');
  else out.innerHTML = `<b class="now">${v}</b> — no match in latest results`;
}

/* ---------- boot ---------- */

let tabState = 'all';

function showTab(name) {
  tabState = name;
  document.querySelectorAll('#tabs li').forEach((li) => li.classList.toggle('active', li.dataset.tab === name));
  document.querySelectorAll('.sec').forEach((sec) => {
    const list = (sec.dataset.sec || '').split(' ');
    sec.classList.toggle('on', name === 'all' || list.includes(name));
  });
}

async function load(spin) {
  const btn = $('#btnRefresh');
  if (spin) btn.classList.add('spin');
  try {
    const res = await fetch('/api/results');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    render(await res.json());
  } catch (e) {
    $('#srcLine').textContent = 'failed: ' + e.message;
  } finally {
    btn.classList.remove('spin');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#tabs li').forEach((li) => li.addEventListener('click', () => showTab(li.dataset.tab)));
  $('#chk').addEventListener('input', applyChecker);
  $('#btnRefresh').addEventListener('click', () => load(true));
  showTab('all');
  load(true);
  setInterval(() => load(false), 30000);
});
