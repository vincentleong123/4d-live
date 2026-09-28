/* 4D LIVE — all-games dashboard (4d88.asia + 4dmoon.com merged)
 * Pixel-faithful to 4dmoon.com table style, colors and logos.
 * Zero dependencies. Start: node server.js  (port 7011, PORT env override)
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 7011);
const CACHE_TTL = 25_000;
const UPSTREAM_TIMEOUT = 10_000;

const FEEDS = {
  m4d88: 'https://ajax01.4d88.asia/ajax/G1.json',
  moonWest: 'https://www.4dmoon.com/feedwest.json',
  moonEast: 'https://www.4dmoon.com/feedeast.json',
  moonSg: 'https://www.4dmoon.com/feedsg.json',
};

/* Provider order = 4dmoon West page order. cls = exact 4dmoon header classes. */
const PROVIDERS = {
  P15: { id: 'dragon', name: 'Grand Dragon 4D', region: 'west', cls: 'g4dl', logo: 'logo_gdlotto.jpg' },
  P3: { id: 'damacai', name: 'Damacai 1+3D', region: 'west', cls: 'dmcl', logo: 'logo_damacai.gif', jt: '1+3D Jackpot Estimated Amount' },
  P1: { id: 'magnum', name: 'Magnum 4D', region: 'west', cls: 'm4dl', logo: 'logo_magnum.gif', jt: '4D Jackpot Estimated Amount' },
  P2: { id: 'toto', name: 'SportsToto 4D', region: 'west', cls: 'sttl', logo: 'logo_toto4d.gif', jt: '4D Jackpot Estimated Amount' },
  P5: { id: 'sandakan', name: 'Sandakan 4D', region: 'east', cls: 'stcl', logo: 'logo_stc4d.gif' },
  P6: { id: 'sabah88', name: 'Sabah 4D', region: 'east', cls: 's88l', logo: 'logo_sabah88.gif' },
  P7: { id: 'cashsweep', name: 'Sarawak CashSweep', region: 'east', cls: 'stecl', logo: 'logo_cashsweep.gif' },
  P4: { id: 'sgpools', name: 'Singapore 4D', region: 'sg', cls: 'sgpl', logo: 'logo_sg4d.gif' },
};

const MOON_KEYS = { M: 'magnum', D: 'damacai', G: 'dragon', T: 'toto', K: 'sandakan', B: 'sabah88', W: 'cashsweep', S: 'sgpools' };

/* ---------------- helpers ---------------- */

async function fetchJSON(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
    headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) 4d-live/2.0' },
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

function seq(obj, prefix, n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push(clean(obj ? obj[prefix + i] : null));
  }
  return out;
}

/* per-slot merge: prefer 4d88, fill gaps from the other feed */
function mergeSeq(a, b, prefix, n) {
  const av = seq(a, prefix, n);
  if (!b) return av;
  const bv = seq(b, prefix, n);
  return av.map((v, i) => (v != null ? v : bv[i]));
}

function clean(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === '-' || /^-{2,}(\s+-{2,})*$/.test(s) || s === '--') return null;
  return s;
}

function pickJP(...vals) {
  for (const v of vals) {
    let s = clean(v);
    if (!s) continue;
    s = s.replace(/^RM\s*/i, '');
    if (/^\d{4,}(\.\d+)?$/.test(s)) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return s;
  }
  return null;
}

const MONTHS = { jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec' };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* Normalise any date into 4dmoon display "(Wed) 23-Sep-2026" */
function dateLabel(s) {
  const raw = clean(s);
  if (!raw) return '';
  let m = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return `(${DAYS[d.getDay()]}) ${m[1].padStart(2, '0')}-${MONTHS[Object.keys(MONTHS)[Number(m[2]) - 1]]}-${m[3]}`;
  }
  m = raw.match(/^(\d{1,2})[-\/]([A-Za-z]{3})[-\/](\d{4})$/);
  if (m) {
    const mo = Object.keys(MONTHS).indexOf(m[2].slice(0, 3).toLowerCase());
    const d = new Date(Number(m[3]), mo, Number(m[1]));
    return `(${DAYS[d.getDay()]}) ${m[1].padStart(2, '0')}-${MONTHS[Object.keys(MONTHS)[mo]]}-${m[3]}`;
  }
  return raw;
}

function isoOf(s) {
  const raw = clean(s);
  if (!raw) return '';
  const m = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const m2 = raw.match(/^(\d{1,2})[-\/]([A-Za-z]{3})[-\/](\d{4})$/);
  if (m2) {
    const mo = Object.keys(MONTHS).indexOf(m2[2].slice(0, 3).toLowerCase()) + 1;
    return `${m2[3]}-${String(mo).padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  }
  return '';
}

function drawNo(s) {
  const v = clean(s);
  if (!v) return '';
  return v.startsWith('#') ? v : '#' + v;
}

function tds(html) {
  if (!html) return [];
  return [...String(html).matchAll(/>(\d{3,6})</g)].map((m) => m[1]);
}

function pad2(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s.padStart(2, '0');
}

function moonMap(moonFeed, key) {
  if (!moonFeed) return null;
  for (const k of Object.keys(moonFeed)) if (MOON_KEYS[k] === key) return moonFeed[k];
  return null;
}

function jrows(obj, labels, valKeys, winKeys) {
  const rows = [];
  for (let i = 0; i < labels.length; i++) {
    const v = pickJP(obj ? obj[valKeys[i]] : null);
    if (!v) continue;
    rows.push({ label: labels[i], value: v, winners: winKeys && obj ? clean(obj[winKeys[i]]) : null });
  }
  return rows;
}

/* ---------------- main 4D cards ---------------- */

function build4dCard(meta, e88, moon) {
  const a = e88 && e88['4D'] ? e88['4D'] : null;
  const b = moon || null;
  if (!a && !b) return null;
  const primary = a || b;
  const card = {
    id: meta.id, name: meta.name, cls: meta.cls, logo: meta.logo, region: meta.region,
    date: dateLabel(primary.DD || b?.DD || ''),
    drawNo: drawNo(primary.DN || b?.DN || ''),
    live: (b && String(b.LS) === '1') || (a ? a.DONE !== 1 : false),
    done: a ? a.DONE === 1 : true,
    top: mergeSeq(a, b, 'P', 3),
    special: mergeSeq(a, b, 'S', 13),
    consolation: mergeSeq(a, b, 'C', 10),
    zodiac: null,
    jackpots: [],
    jackpotTitle: meta.jt || null,
    from: a && b ? 'both' : a ? '4d88' : '4dmoon',
  };
  if (meta.id === 'toto') {
    card.zodiac = clean(e88?.ZD?.ZD1) || clean(b?.ZODIAC) || null;
  }
  const jp1 = pickJP(a?.JP1, b?.JP1);
  const jp2 = pickJP(a?.JP2, b?.JP2);
  const j = [];
  if (jp1) j.push({ label: 'Jackpot 1', value: jp1, winners: clean(a?.JP1W) });
  if (jp2) j.push({ label: 'Jackpot 2', value: jp2, winners: clean(a?.JP2W) });
  if (j.length) card.jackpots = j;
  return card;
}

/* ---------------- side games ---------------- */

function sideGames(j88, moon) {
  const W = moon.west, E = moon.east, SG = moon.sg;
  const P1 = j88?.P1 || {}, P2 = j88?.P2 || {}, P3 = j88?.P3 || {}, P4 = j88?.P4 || {}, P6 = j88?.P6 || {}, P7 = j88?.P7 || {};
  const out = {};

  /* --- Toto Fireball (4dmoon only) --- */
  const T = W?.T;
  if (T) {
    out.fireball = {
      name: 'SportsToto Fireball', logo: 'logo_toto_fireball.png', cls: 'sttl',
      date: dateLabel(T.DD || ''), drawNo: drawNo(T.DN || ''),
      digit: clean(T.FB),
      first: tds(T.FB1), second: tds(T.FB2), third: tds(T.FB3),
      special: tds(T.FBS), consolation: tds(T.FBC),
    };
  }

  /* --- Toto 5D / 6D (prefer 4d88, fall back to moon fields) --- */
  const g5 = P2['5D'] || (T ? { P1: T.P5D1, P2: T.P5D2, P3: T.P5D3, P4: T.P5D4, P5: T.P5D5, P6: T.P5D6, DONE: 1 } : null);
  if (g5) out.toto5d = {
    name: 'SportsToto 5D', logo: 'logo_toto5d.gif', cls: 'sttl',
    date: dateLabel(P2.DD || T?.DD || ''), drawNo: drawNo(P2.DN || T?.DN || ''),
    rows: [1, 2, 3, 4, 5, 6].map((i, idx) => ({ label: `${idx + 1}${['st', 'nd', 'rd', 'th', 'th', 'th'][idx]}`, value: clean(g5['P' + i]) })),
  };
  const g6 = P2['6D'] || (T ? { P1: T.P6D1, pairs: [[T.P6D2A, T.P6D2B], [T.P6D3A, T.P6D3B], [T.P6D4A, T.P6D4B], [T.P6D5A, T.P6D5B]], DONE: 1 } : null);
  if (g6) out.toto6d = {
    name: 'SportsToto 6D', logo: 'logo_toto6d.gif', cls: 'sttl',
    date: dateLabel(P2.DD || T?.DD || ''), drawNo: drawNo(P2.DN || T?.DN || ''),
    rows: [
      { label: '1st', value: clean(g6.P1), or: false },
      ...((g6.pairs || [[g6.P2, g6.P3], [g6.P4, g6.P5], [g6.P6, g6.P7], [g6.P8, g6.P9]]).map((p, i) => ({
        label: `${i + 2}${['nd', 'rd', 'th', 'th'][i]}`, value: clean(p[0]), value2: clean(p[1]), or: true,
      }))),
    ],
  };

  /* --- Toto Lotto games --- */
  const lottoDefs = [
    ['STR', 'Star Toto 6/50', ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'], 'A1', ['Jackpot 1', 'Jackpot 2'], ['JP1', 'JP2']],
    ['PWR', 'Power Toto 6/55', ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'], null, ['Jackpot'], ['JP1']],
    ['SPM', 'Supreme Toto 6/58', ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'], null, ['Jackpot'], ['JP1']],
  ];
  out.lottos = [];
  for (const [key, name, ballKeys, extraKey, jLabels, jKeys] of lottoDefs) {
    const g = P2[key];
    if (!g) continue;
    out.lottos.push({
      name, logo: 'logo_toto.gif', cls: 'sttl', extraLabel: 'Extra',
      date: dateLabel(P2.DD || ''), drawNo: drawNo(P2.DN || ''),
      balls: ballKeys.map((k) => clean(g[k])),
      extra: extraKey ? clean(g[extraKey]) : null,
      jackpots: jrows(g, jLabels, jKeys),
    });
  }

  /* --- Magnum Life --- */
  const LF = P1.LF || (W?.M ? { P1: W.M.L1, P2: W.M.L2, P3: W.M.L3, P4: W.M.L4, P5: W.M.L5, P6: W.M.L6, P7: W.M.L7, P8: W.M.L8, B1: W.M.LB1, B2: W.M.LB2, DONE: 1 } : null);
  if (LF) out.life = {
    name: 'Magnum Life', logo: 'logo-m4d-life.png', cls: 'm4dl',
    date: dateLabel(P1.DD || W?.M?.DD || ''), drawNo: drawNo(P1.DN || W?.M?.DN || ''),
    balls: seq(LF, 'P', 8).map(pad2),
    bonus: [pad2(LF.B1), pad2(LF.B2)].filter(Boolean),
  };

  /* --- Magnum mGold (Jackpot Gold) --- */
  const GLD = P1.GLD;
  if (GLD) {
    out.mgold = {
      name: 'Magnum 4D Jackpot Gold', logo: 'logo-m4d-jackpot-gold.png', cls: 'm4dl',
      date: dateLabel(P1.DD || ''), drawNo: drawNo(P1.DN || ''),
      balls: seq(GLD, 'P', 6),
      golden: clean(GLD.PB1) != null && clean(GLD.PB2) != null ? String(GLD.PB1) + String(GLD.PB2) : null,
      jackpots: jrows(GLD, ['Jackpot 1', 'Jackpot 2'], ['JP1', 'JP2'], ['JP1W', 'JP2W']),
    };
  } else if (W?.MJG) {
    out.mgold = {
      name: 'Magnum 4D Jackpot Gold', logo: 'logo-m4d-jackpot-gold.png', cls: 'm4dl',
      date: dateLabel(W.MJG.DD || ''), drawNo: drawNo(W.MJG.DN || ''),
      balls: seq(W.MJG, 'P', 8),
      golden: null,
      jackpots: jrows(W.MJG, ['Jackpot 1', 'Jackpot 2'], ['JP1', 'JP2']),
    };
  }

  /* --- DaMaCai 3+3D --- */
  const d88 = P3['3P3D'] || null;
  const dMo = W?.D6 || null;
  const d3 = d88 || dMo;
  if (d3) {
    out.dmc33 = {
      name: 'Damacai 3+3D', logo: 'logo_damacai.gif', cls: 'dmcl',
      date: dateLabel(d3.DD || ''), drawNo: drawNo(d3.DN || ''),
      top: mergeSeq(d88, dMo, 'P', 3),
      zodiac: d88 ? [clean(d88.ZD1), clean(d88.ZD2), clean(d88.ZD3)] : seq(dMo, 'PB', 3),
      bonusAmt: d88 ? [pickJP(d88.B1), pickJP(d88.B2), pickJP(d88.B3)] : [pickJP(dMo.JP1), pickJP(dMo.JP2), pickJP(dMo.JP3)],
      bonusWin: d88 ? [clean(d88.BW1), clean(d88.BW2), clean(d88.BW3)] : null,
      special: mergeSeq(d88, dMo, 'S', 10),
      consolation: mergeSeq(d88, dMo, 'C', 10),
    };
  }

  /* --- Sabah 3D / CashSweep 3D --- */
  if (P6['3D']) out.sabah3d = {
    name: 'Sabah 3D', logo: 'logo_sabah88.gif', cls: 's88l',
    date: dateLabel(P6.DD || ''), drawNo: drawNo(P6.DN || ''),
    rows: seq(P6['3D'], 'P', 3),
  };
  if (P7['3D']) out.cs3d = {
    name: 'CashSweep 3D', logo: 'logo_cashsweep.gif', cls: 'stecl',
    date: dateLabel(P7.DD || ''), drawNo: drawNo(P7.DN || ''),
    rows: seq(P7['3D'], 'P', 3),
  };

  /* --- Sabah Lotto 6/45 --- */
  const JP45 = P6.JP || (E?.B ? { P1: E.B.P6451, P2: E.B.P6452, P3: E.B.P6453, P4: E.B.P6454, P5: E.B.P6455, P6: E.B.P6456, A1: E.B.P645EX, J1: E.B.P645JP1, J2: E.B.P645JP2, DONE: 1 } : null);
  if (JP45) out.sabahLotto = {
    name: 'Sabah Lotto', logo: 'logo_sabah88.gif', cls: 's88l',
    date: dateLabel(JP45.DD || P6.DD || ''), drawNo: drawNo(JP45.DN || ''),
    balls: seq(JP45, 'P', 6),
    extra: clean(JP45.A1),
    jackpots: jrows(JP45, ['Jackpot 1', 'Jackpot 2'], ['J1', 'J2']),
  };

  /* --- Sabah L6 / L5 series --- */
  for (const [key, id, nMain] of [['L6', 'sabahL6', 5], ['L5', 'sabahL5', 4]]) {
    const g = P6[key];
    if (!g) continue;
    const letters = [...new Set(Object.keys(g).map((k) => (k.match(/^P1([A-Z])$/) || [])[1]).filter(Boolean))].sort();
    out[id] = letters.map((L) => ({
      label: L,
      balls: Array.from({ length: nMain }, (_, i) => clean(g[`P${i + 1}${L}`])),
      extra: clean(g[`A1${L}`]),
      jackpot: pickJP(g[`J1${L}`]),
    }));
  }

  /* --- Singapore Toto ---
   * 4d88 P4.JP is the Singapore Toto draw (6/49 + additional, 7 prize divisions with
   * winner counts). 4dmoon's feedsg.json only carries the same Toto game with 6 groups,
   * and neither source publishes Singapore Sweep — so we do not invent one. */
  const TJ = P4.JP;
  const G = SG?.G;
  if (TJ && TJ.DONE === 1) {
    out.sgToto = {
      name: 'Singapore Toto', logo: 'logo_sg4d.gif', cls: 'sgpl',
      date: dateLabel(TJ.DD || ''), drawNo: drawNo(TJ.DN || ''),
      balls: [...seq(TJ, 'P', 6), clean(TJ.A1)].filter(Boolean),
      tiers: [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        label: `Division ${i}`,
        amount: clean(TJ['J' + i]) || '-',
        winners: clean(TJ['X' + i]) || '-',
      })),
      source: '4d88',
    };
  } else if (G) {
    out.sgToto = {
      name: 'Singapore Toto', logo: 'logo_sg4d.gif', cls: 'sgpl',
      date: dateLabel(G.DD || ''), drawNo: drawNo(G.DN || ''),
      balls: seq(G, 'P', 7),
      groups: [1, 2, 3, 4, 5, 6].map((i) => ({
        label: `Group ${i}`, amount: clean(G[`JP${i}`]) || '-', winners: clean(G[`JPW${i}`]) || '-',
      })),
      source: '4dmoon',
    };
  }

  return out;
}

/* ---------------- special draws (P16/P17) + next special ---------------- */

function buildSpecialDraws(j88) {
  const out = [];
  if (!j88) return out;
  for (const key of ['P16', 'P17']) {
    const g = j88[key]?.['4D'];
    if (!g) continue;
    out.push({
      name: `Special Draw ${key === 'P16' ? '1' : '2'}`, cls: 'spl', logo: null,
      date: dateLabel(g.DD || j88[key].DD || ''),
      drawNo: drawNo(g.DN || j88[key].DN || ''),
      live: g.DONE !== 1, done: g.DONE === 1,
      top: seq(g, 'P', 3),
      special: seq(g, 'S', 13),
      consolation: seq(g, 'C', 10),
      jackpots: jrows(g, ['Jackpot 1', 'Jackpot 2'], ['JP1', 'JP2']),
    });
  }
  return out;
}

function buildNextSpecial(j88) {
  const raw = clean(j88?.SP?.MY);
  if (!raw) return null;
  const iso = isoOf(raw);
  if (!iso) return null;
  const days = Math.ceil((new Date(iso + 'T00:00:00') - new Date(new Date().toDateString())) / 86400000);
  if (days <= 0) return null;
  return { date: dateLabel(raw), iso, days };
}

/* ---------------- assemble ---------------- */

function buildResults(j88, moon) {
  const cards = [];
  for (const [pKey, meta] of Object.entries(PROVIDERS)) {
    const e88 = j88?.[pKey] || null;
    const moonFeed = meta.region === 'west' ? moon.west : meta.region === 'east' ? moon.east : moon.sg;
    const b = build4dCard(meta, e88, moonMap(moonFeed, meta.id));
    if (b) cards.push(b);
  }
  return {
    updatedAt: new Date().toISOString(),
    cards,
    specialDraws: buildSpecialDraws(j88),
    nextSpecial: buildNextSpecial(j88),
    side: sideGames(j88, moon),
  };
}

/* ---------------- history / predictions / wow ---------------- */

const DATA_DIR = path.join(__dirname, 'data');
const HIST = path.join(DATA_DIR, 'history');
const PM = require('./lib/predict-methods.js');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

/* keep the archive warm: capture live feeds in the background (max once / 10 min) */
let lastWarm = 0;
function warmHistory() {
  if (Date.now() - lastWarm < 10 * 60 * 1000) return;
  lastWarm = Date.now();
  try {
    require('./scripts/fetch-history.js').captureToday().catch(() => {});
  } catch { /* offline fine */ }
}

const OPS = ['magnum', 'toto', 'damacai', 'sandakan', 'sabah88', 'cashsweep', 'sgpools', 'dragon'];
const OP_PATH = { magnum: ['west', 'magnum'], toto: ['west', 'toto'], damacai: ['west', 'damacai'], sandakan: ['east', 'sandakan'], sabah88: ['east', 'sabah88'], cashsweep: ['east', 'cashsweep'], sgpools: ['sg', 'sgpools'], dragon: ['west', 'dragon'] };

function readJSONFile(f) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8')); } catch { return null; }
}

function loadOpDraws(op, before) {
  if (!OPS.includes(op) || !fs.existsSync(HIST)) return [];
  const [a, b] = OP_PATH[op];
  const out = [];
  for (const f of fs.readdirSync(HIST).filter((x) => x.endsWith('.json')).sort()) {
    const date = f.replace('.json', '');
    if (before && date >= before) continue;
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(HIST, f), 'utf8')); } catch { continue; }
    if (j.empty) continue;
    const g = j[a] && j[a][b];
    if (!g || !g.top || !g.top.some((v) => /^\d{4}$/.test(v))) continue;
    out.push({ date: j.date || date, drawNo: g.drawNo || '', top: g.top.filter((v) => /^\d{4}$/.test(v)), special: (g.special || []).filter((v) => /^\d{4}$/.test(v)), consolation: (g.consolation || []).filter((v) => /^\d{4}$/.test(v)), zodiac: g.zodiac || null });
  }
  return out;
}

function buildSnap(op, targetDate) {
  const draws = loadOpDraws(op, targetDate);
  const freq = {}, lastSeen = {};
  for (const d of draws) for (const n of [...d.top, ...d.special, ...d.consolation]) {
    freq[n] = (freq[n] || 0) + 1;
    lastSeen[n] = d.date;
  }
  return { freq, lastSeen, draws: draws.map((d) => d.date), count: draws.length };
}

function nextDraw(op) {
  const t = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  if (op === 'dragon' || op === 'sabah88') return iso(t);
  const days = op === 'sandakan' ? [1, 3, 5] : [0, 3, 6];
  for (let i = 0; i < 8; i++) {
    const d = new Date(t.getTime() + i * 86400000);
    if (days.includes(d.getUTCDay())) return iso(d);
  }
  return iso(t);
}

function predict(op, dateISO, userWeights) {
  const snap = buildSnap(op, dateISO);
  const bt = readJSONFile('backtest.json');
  const opBt = (bt && bt.operators && bt.operators[op]) || null;
  const moon = PM.moonInfo(dateISO);
  const zodiac = PM.zodiacInfo(dateISO);
  const planet = PM.planetDay(dateISO);
  const methods = PM.METHOD_ORDER.map((id) => {
    let r;
    try { r = PM.METHODS[id](op, dateISO, snap); } catch (e) { r = { picks: [], why: 'summoning failed', confidence: 0, flavor: {} }; }
    const rate = opBt && opBt.methods[id] ? opBt.methods[id].rate : 1.1;
    return { id, ...PM.METHOD_META[id], picks: r.picks, why: r.why, confidence: r.confidence, backtest: rate, flavor: r.flavor || {} };
  });
  // AI Overwatch ensemble: backtest-weighted votes
  const votes = {};
  for (const m of methods) {
    const uw = userWeights && userWeights[m.id] != null ? Number(userWeights[m.id]) : 1;
    const w = Math.max(0.2, (m.backtest || 1.1) / 2) * Math.max(0, uw);
    for (const p of m.picks) {
      votes[p] = votes[p] || { score: 0, methods: [] };
      votes[p].score += w;
      votes[p].methods.push(m.id);
    }
  }
  const ranked = Object.entries(votes).sort((a, b) => b[1].score - a[1].score).slice(0, 5)
    .map(([n, v]) => ({ n, score: +v.score.toFixed(2), methods: v.methods }));
  const avgBt = ranked.length ? ranked.reduce((a, r) => a + r.methods.reduce((x, id) => x + (methods.find((m) => m.id === id).backtest || 1.1), 0) / r.methods.length, 0) / ranked.length : 0;
  const agreement = ranked.length ? ranked.reduce((a, r) => a + r.methods.length, 0) / ranked.length : 0;
  const confidence = Math.max(1, Math.min(97, Math.round(avgBt * 4 + agreement * 6)));
  return {
    operator: op, date: dateISO, historyDraws: snap.count,
    moon, zodiac, planet,
    methods,
    ensemble: { picks: ranked, confidence, avgBacktest: +avgBt.toFixed(1), agreement: +agreement.toFixed(1) },
    backtest: opBt ? { tested: opBt.tested, methods: Object.fromEntries(Object.entries(opBt.methods).map(([k, v]) => [k, v.rate])) } : null,
    randomBaseline: 1.14,
  };
}

/* news: curated file + live Google News RSS (1h cache) */
let newsCache = null;
async function loadNews() {
  if (newsCache && Date.now() - newsCache.at < 3600000) return newsCache.payload;
  const curated = readJSONFile('news.json') || { items: [] };
  let live = [];
  try {
    const res = await fetch('https://news.google.com/rss/search?q=4D%20lottery%20winner%20Malaysia%20OR%20Toto%20OR%20Magnum%20OR%20Damacai&hl=en-MY&gl=MY&ceid=MY%3Aen', {
      headers: { 'user-agent': 'Mozilla/5.0 4d-live/2.0' }, signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 10);
      live = items.map((m) => {
        const t = (m[1].match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
        const l = (m[1].match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
        const p = (m[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
        const cleanS = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
        return { title: cleanS(t).split(' - ')[0], source: (cleanS(t).split(' - ')[1] || 'Google News').trim(), url: cleanS(l), date: p ? new Date(p).toISOString().slice(0, 10) : '', detail: '', wow: 0, live: true };
      }).filter((x) => x.title && x.url);
    }
  } catch { /* offline: curated only */ }
  const payload = { updatedAt: new Date().toISOString(), curated: curated.items || [], live };
  newsCache = { at: Date.now(), payload };
  return payload;
}

/* ---------------- cache / load ---------------- */

let cache = null;
let inflight = null;

async function loadResults() {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.payload;
  if (inflight) return inflight;

  inflight = (async () => {
    const [r88, rw, re, rs] = await Promise.allSettled([
      fetchJSON(FEEDS.m4d88), fetchJSON(FEEDS.moonWest), fetchJSON(FEEDS.moonEast), fetchJSON(FEEDS.moonSg),
    ]);
    const sources = { m4d88: r88.status === 'fulfilled' ? 'ok' : 'error', m4dmoon: 'ok' };
    const moonFail = [rw, re, rs].filter((r) => r.status === 'rejected');
    if (moonFail.length === 3) sources.m4dmoon = 'error';
    else if (moonFail.length) sources.m4dmoon = 'partial';

    const j88 = r88.status === 'fulfilled' ? r88.value : null;
    const moon = {
      west: rw.status === 'fulfilled' ? rw.value : null,
      east: re.status === 'fulfilled' ? re.value : null,
      sg: rs.status === 'fulfilled' ? rs.value : null,
    };

    if (!j88 && !moon.west && !moon.east && !moon.sg) {
      if (cache) return { ...cache.payload, stale: true, sources };
      throw new Error('all upstream feeds failed');
    }
    const payload = { ...buildResults(j88, moon), sources, stale: false };
    cache = { at: Date.now(), payload };
    return payload;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/* ---------------- http ---------------- */

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.gif': 'image/gif',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const PUBLIC = path.join(__dirname, 'public');

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api/results') {
      const payload = await loadResults();
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify(payload));
      return;
    }

    if (url.pathname === '/api/journal') {
      const J = require('./lib/journal.js');
      if (req.method === 'POST') {
        const body = await readBody(req);
        const out = J.addEntry(JSON.parse(body || '{}'));
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
        res.end(JSON.stringify({ ok: true, entry: out }));
        return;
      }
      if (req.method === 'DELETE') {
        const id = url.searchParams.get('id') || '';
        const out = J.deleteEntry(id);
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
        res.end(JSON.stringify({ ok: true, ...out }));
        return;
      }
      const payload = J.getJournal();
      // warm the archive in the background (max once / 10 min)
      warmHistory();
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify(payload));
      return;
    }

    if (url.pathname === '/api/stats' || url.pathname === '/api/facts' || url.pathname === '/api/backtest' || url.pathname === '/api/didyouknow') {
      const file = { '/api/stats': 'stats.json', '/api/facts': 'facts.json', '/api/backtest': 'backtest.json', '/api/didyouknow': 'didyouknow.json' }[url.pathname];
      const payload = readJSONFile(file) || { error: 'not built yet — run scripts/build-analytics.js' };
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify(payload));
      return;
    }

    if (url.pathname === '/api/news') {
      const payload = await loadNews();
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify(payload));
      return;
    }

    if (url.pathname === '/api/history') {
      const op = OPS.includes(url.searchParams.get('operator')) ? url.searchParams.get('operator') : 'magnum';
      const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 30));
      const before = url.searchParams.get('before') || null;
      const num = (url.searchParams.get('number') || '').trim();
      let draws = loadOpDraws(op, before).reverse(); // newest first
      if (/^\d{1,6}$/.test(num)) {
        draws = draws.map((d) => {
          const tiers = [];
          if (d.top.includes(num)) tiers.push('Top 3');
          if (d.special.includes(num)) tiers.push('Special');
          if (d.consolation.includes(num)) tiers.push('Consolation');
          return tiers.length ? { ...d, tiers } : null;
        }).filter(Boolean);
      }
      const total = draws.length;
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ operator: op, total, draws: draws.slice(0, limit), number: num || null }));
      return;
    }

    if (url.pathname === '/api/predict') {
      const op = OPS.includes(url.searchParams.get('operator')) ? url.searchParams.get('operator') : 'magnum';
      const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') || '') ? url.searchParams.get('date') : nextDraw(op);
      let weights = null;
      try { weights = JSON.parse(url.searchParams.get('weights') || 'null'); } catch { weights = null; }
      const payload = predict(op, date, weights);
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify(payload));
      return;
    }
    if (url.pathname === '/robots.txt') {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' });
      res.end(require('./lib/seo.js').robots());
      return;
    }
    if (url.pathname === '/sitemap.xml') {
      res.writeHead(200, { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=86400' });
      res.end(require('./lib/seo.js').sitemap());
      return;
    }
    let file = url.pathname === '/' ? '/index.html' : url.pathname;
    file = path.normalize(file).replace(/^(\.\.[/\\])+/, '');
    const full = path.join(PUBLIC, file);
    if (!full.startsWith(PUBLIC)) { res.writeHead(403).end('Forbidden'); return; }
    fs.readFile(full, async (err, data) => {
      if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found'); return; }
      const ext = path.extname(full).toLowerCase();
      const headers = { 'content-type': MIME[ext] || 'application/octet-stream' };
      if (ext === '.html') {
        const SEO = require('./lib/seo.js');
        const route = file.replace(/\\/g, '/').replace(/^\/index\.html$/, '/');
        let html = data.toString('utf8');
        html = SEO.inject(html, SEO.PAGES[route] ? route : '/');
        /* SSR: put the real winning numbers in the initial HTML (home page) */
        if (route === '/') {
          try {
            const payload = await loadResults();
            html = require('./lib/ssr.js').injectResults(html, payload);
          } catch (e) { /* offline: page still renders client-side */ }
        }
        data = Buffer.from(html, 'utf8');
        headers['content-type'] = 'text/html; charset=utf-8';
        headers['cache-control'] = 'no-cache';
      } else if (ext === '.png' || ext === '.svg' || ext === '.ico') {
        headers['cache-control'] = 'public, max-age=604800';
      }
      res.writeHead(200, headers);
      res.end(data);
    });
  } catch (e) {
    res.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
});

server.listen(PORT, () => console.log(`4D LIVE → http://localhost:${PORT}`));
