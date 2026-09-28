/* build-analytics.js — data/history/*.json → data/stats.json + data/facts.json + data/backtest.json
 * Usage: node scripts/build-analytics.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HIST_DIR = path.join(ROOT, 'data', 'history');
const { METHODS, METHOD_ORDER } = require('../lib/predict-methods');

const OPERATORS = ['magnum', 'toto', 'damacai', 'sandakan', 'sabah88', 'cashsweep', 'sgpools', 'dragon'];
const OP_PATH = { magnum: ['west', 'magnum'], toto: ['west', 'toto'], damacai: ['west', 'damacai'], sandakan: ['east', 'sandakan'], sabah88: ['east', 'sabah88'], cashsweep: ['east', 'cashsweep'], sgpools: ['sg', 'sgpools'], dragon: ['west', 'dragon'] };
const OP_NAMES = { magnum: 'Magnum 4D', toto: 'SportsToto 4D', damacai: 'DaMaCai 1+3D', sandakan: 'Sandakan 4D', sabah88: 'Sabah 88 4D', cashsweep: 'Sarawak CashSweep', sgpools: 'Singapore 4D', dragon: 'Grand Dragon 4D' };

const is4 = (v) => typeof v === 'string' && /^\d{4}$/.test(v);

/* ---------- load history ---------- */
function loadDraws() {
  const files = fs.readdirSync(HIST_DIR).filter((f) => f.endsWith('.json')).sort();
  const byOp = {};
  for (const op of OPERATORS) byOp[op] = [];
  for (const f of files) {
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(HIST_DIR, f), 'utf8')); } catch { continue; }
    if (j.empty) continue;
    const date = j.date || f.replace('.json', '');
    for (const op of OPERATORS) {
      const [a, b] = OP_PATH[op];
      const g = j[a] && j[a][b];
      if (!g || !g.top || !g.top.some(is4)) continue;
      byOp[op].push({
        date,
        drawNo: g.drawNo || '',
        top: (g.top || []).filter(is4),
        special: (g.special || []).filter(is4),
        consolation: (g.consolation || []).filter(is4),
        zodiac: g.zodiac || null,
      });
    }
  }
  return byOp;
}
const winnersOf = (d) => [...d.top, ...d.special, ...d.consolation];

/* ---------- stats ---------- */
function buildStats(byOp) {
  const ops = {};
  for (const op of OPERATORS) {
    const draws = byOp[op];
    const freq = {}, lastSeen = {};
    const digitPos = [0, 1, 2, 3].map(() => Array(10).fill(0));
    const sumDist = Array(37).fill(0);
    const oddEven = [0, 0, 0, 0, 0];
    const weekday = [0, 0, 0, 0, 0, 0, 0];
    const zodiacCounts = {};
    let repeats = 0;
    let prev = new Set();
    for (const d of draws) {
      const w = winnersOf(d);
      for (const n of w) {
        freq[n] = (freq[n] || 0) + 1;
        lastSeen[n] = d.date;
        const dg = n.split('').map(Number);
        dg.forEach((g, i) => digitPos[i][g]++);
        sumDist[dg.reduce((a, x) => a + x, 0)]++;
        oddEven[dg.filter((g) => g % 2 === 1).length]++;
      }
      if (d.zodiac) zodiacCounts[d.zodiac] = (zodiacCounts[d.zodiac] || 0) + 1;
      weekday[new Date(d.date + 'T12:00:00Z').getUTCDay()]++;
      if (w.some((n) => prev.has(n))) repeats++;
      prev = new Set(w);
    }
    const latest = draws.length ? draws[draws.length - 1].date : null;
    const dayN = (s) => Date.parse(s) / 86400000;
    const hot = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([n, count]) => ({ n, count, last: lastSeen[n] }));
    const cold = Object.entries(lastSeen)
      .map(([n, last]) => ({ n, last, gap: latest ? Math.round(dayN(latest) - dayN(last)) : 0 }))
      .sort((a, b) => b.gap - a.gap).slice(0, 30);
    ops[op] = {
      draws: draws.length,
      from: draws.length ? draws[0].date : null,
      to: latest,
      hot, cold,
      digitPos, sumDist, oddEven, weekday,
      zodiacCounts,
      repeatDraws: repeats,
      repeatRate: draws.length > 1 ? +(repeats / (draws.length - 1) * 100).toFixed(1) : 0,
      coverage: draws.length ? Math.round(Object.keys(freq).length / 100) / 100 : 0,
    };
    ops[op].uniqueNumbers = Object.keys(freq).length;
  }
  return { generatedAt: new Date().toISOString(), operators: ops };
}

/* ---------- Ripley's fact miner ---------- */
const dsum = (n) => n.split('').reduce((a, c) => a + +c, 0);
const LEET = ['1337', '7331', '8008', '0007', '0070', '0700', '7000', '1313', '3113', '1717', '7171', '2026', '0909', '9090', '2323', '2332'];
const ASC = ['0123', '1234', '2345', '3456', '4567', '5678', '6789', '7890', '0987', '9876', '8765', '7654', '6543', '5432', '4321', '3210', '2109'];

function mineFacts(byOp, stats) {
  const facts = [];
  const push = (f) => facts.push(f);

  for (const op of OPERATORS) {
    const draws = byOp[op];
    // consecutive repeats
    for (let i = 1; i < draws.length; i++) {
      const cur = new Set(winnersOf(draws[i]));
      const hit = winnersOf(draws[i - 1]).filter((n) => cur.has(n));
      const uniq = [...new Set(hit)];
      if (uniq.length) {
        push({ type: 'repeat', icon: '🔁', wow: 5, op, date: draws[i].date, title: `REPEAT OFFENDER: ${uniq.slice(0, 3).join(', ')} struck TWO draws in a row`, detail: `${OP_NAMES[op]} drew ${uniq.slice(0, 3).join(' + ')} on ${draws[i - 1].date} — then AGAIN on ${draws[i].date}. Same operator. Back-to-back. The universe has a favorite.` });
        break; // one headline per op
      }
    }
    // double agent: same number in 2 tiers same draw
    outer: for (const d of draws) {
      const tiers = [['1st/2nd/3rd', d.top], ['Special', d.special], ['Consolation', d.consolation]];
      for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) {
        const dup = d[Object.keys({ a, b })[0]]; // noop guard
        const hit = tiers[a][1].filter((n) => tiers[b][1].includes(n));
        if (hit.length) {
          push({ type: 'double', icon: '🕵', wow: 4, op, date: d.date, title: `DOUBLE AGENT: ${hit[0]} appeared in TWO prize tiers at once`, detail: `${OP_NAMES[op]} ${d.date}: the number ${hit[0]} won as ${tiers[a][0]} AND ${tiers[b][0]} in the same draw. One ticket. Two paydays.` });
          break outer;
        }
      }
    }
    // date echo
    for (let i = draws.length - 1; i >= 0; i--) {
      const d = draws[i];
      const echo = d.date.slice(8, 10) + d.date.slice(5, 7);
      if (winnersOf(d).includes(echo)) {
        const tier = d.top.includes(echo) ? 'TOP 3' : d.special.includes(echo) ? 'Special' : 'Consolation';
        push({ type: 'echo', icon: '📅', wow: 5, op, date: d.date, title: `DATE ECHO: the calendar number ${echo} won on ${d.date}`, detail: `Draw date ${d.date.slice(8, 10)}-${d.date.slice(5, 7)} → number ${echo} landed in ${tier} at ${OP_NAMES[op]}. The date was the prediction all along.` });
        break;
      }
    }
    // quads + palindromes + ascensions + leet
    const scan = (pred) => { for (let i = draws.length - 1; i >= 0; i--) { const d = draws[i]; const w = winnersOf(d); const hit = w.find(pred); if (hit) return { d, hit }; } return null; };
    const quad = scan((n) => /^(\d)\1\1\1$/.test(n));
    if (quad) push({ type: 'quad', icon: '💥', wow: 5, op, date: quad.d.date, title: `QUAD SIGHTING: ${quad.hit} — all four digits identical`, detail: `${OP_NAMES[op]} ${quad.d.date}: ${quad.hit.split('').join('-')} paraded in ${quad.d.top.includes(quad.hit) ? 'the TOP 3' : 'the prizes'}. A 1-in-1000 shape. It happened.` });
    const pal = scan((n) => n[0] === n[3] && n[1] === n[2] && n[0] !== n[1]);
    if (pal) push({ type: 'pal', icon: '🪞', wow: 3, op, date: pal.d.date, title: `MIRROR NUMBER: ${pal.hit} reads the same backwards`, detail: `${OP_NAMES[op]} ${pal.d.date}. Palindromes in the wild.` });
    const asc = scan((n) => ASC.includes(n));
    if (asc) push({ type: 'asc', icon: '🪜', wow: 3, op, date: asc.d.date, title: `THE ASCENSION: ${asc.hit} — digits in perfect order`, detail: `${OP_NAMES[op]} ${asc.d.date}: ${asc.hit.split('').join(' → ')}. Ordered. Inevitable-looking. Still 1 in 10,000.` });
    const leet = scan((n) => LEET.includes(n));
    if (leet) push({ type: 'leet', icon: '💻', wow: 3, op, date: leet.d.date, title: `LEET SPEAK: ${leet.hit} is internet-famous`, detail: `${OP_NAMES[op]} ${leet.d.date}: the number ${leet.hit} — a meme number — actually won real money.` });
  }

  // cosmic sync: same 1st-prize number, 2+ operators, same date
  const firstByDate = {};
  for (const op of OPERATORS) for (const d of byOp[op]) {
    for (const n of d.top) {
      firstByDate[d.date] = firstByDate[d.date] || {};
      firstByDate[d.date][n] = firstByDate[d.date][n] || [];
      if (!firstByDate[d.date][n].includes(op)) firstByDate[d.date][n].push(op);
    }
  }
  let syncs = 0;
  for (const date of Object.keys(firstByDate).sort().reverse()) {
    for (const [n, ops] of Object.entries(firstByDate[date])) {
      if (ops.length >= 2 && syncs < 4) {
        push({ type: 'sync', icon: '🌌', wow: 5, op: ops[0], date, title: `COSMIC SYNC: ${n} won TOP 3 at ${ops.length} operators on the SAME day`, detail: `${date}: ${n} hit the top 3 at ${ops.map((o) => OP_NAMES[o]).join(' AND ')}. Different companies. Same numbers. Coincidence? (Yes. But WOW.)` });
        syncs++;
      }
    }
  }

  // mirror pairs across window
  const seen = {};
  for (const op of OPERATORS) for (const d of byOp[op]) for (const n of winnersOf(d)) seen[n] = seen[n] || { op, date: d.date };
  for (const n of Object.keys(seen)) {
    const rev = n.split('').reverse().join('');
    if (rev !== n && seen[rev]) {
      push({ type: 'mirror', icon: '🔮', wow: 3, op: seen[n].op, date: seen[n].date, title: `MIRROR DIMENSION: ${n} and ${rev} BOTH won this year`, detail: `${n} won at ${OP_NAMES[seen[n].op]} (${seen[n].date}); its mirror ${rev} won at ${OP_NAMES[seen[rev].op]} (${seen[rev].date}). Flip your ticket, flip your luck?` });
      break;
    }
  }

  // stat superlatives
  for (const op of OPERATORS) {
    const st = stats.operators[op];
    if (!st || !st.hot.length) continue;
    push({ type: 'hot', icon: '🔥', wow: 2, op, date: st.to, title: `${st.hot[0].n} is ${OP_NAMES[op]}'s most-haunted number (${st.hot[0].count}× this year)`, detail: `Across ${st.draws} recorded draws, ${st.hot[0].n} appeared ${st.hot[0].count} times — most recently ${st.hot[0].last}. The ball machine loves it.` });
    if (st.cold.length) push({ type: 'vacation', icon: '🏝', wow: 2, op, date: st.to, title: `${st.cold[0].n} has been on vacation for ${st.cold[0].gap} days`, detail: `Last seen at ${OP_NAMES[op]} on ${st.cold[0].last}. ${st.cold[0].gap} days of silence. Due? Mathematically no. Spiritually? Absolutely.` });
  }

  facts.sort((a, b) => b.wow - a.wow || b.date.localeCompare(a.date));
  return facts.slice(0, 80);
}

/* ---------- honest backtest ---------- */
function backtest(byOp) {
  const PER_OP = 60;
  const out = { testedAt: new Date().toISOString(), perDraw: PER_OP, randomBaseline: 1.14, operators: {}, overall: {} };
  const agg = {};
  for (const m of METHOD_ORDER) agg[m] = { tested: 0, hits: 0 };
  for (const op of OPERATORS) {
    const draws = byOp[op];
    const targets = draws.slice(-PER_OP);
    const per = {};
    for (const m of METHOD_ORDER) per[m] = { tested: 0, hits: 0 };
    for (let i = 0; i < targets.length; i++) {
      const idx = draws.indexOf(targets[i]);
      const prior = draws.slice(0, idx);
      if (!prior.length) continue;
      const freq = {}, lastSeen = {};
      for (const p of prior) for (const n of winnersOf(p)) { freq[n] = (freq[n] || 0) + 1; lastSeen[n] = p.date; }
      const snap = { freq, lastSeen, draws: prior.map((p) => p.date) };
      const win = new Set(winnersOf(targets[i]));
      for (const m of METHOD_ORDER) {
        let picks = [];
        try { picks = METHODS[m](op, targets[i].date, snap).picks || []; } catch { picks = []; }
        per[m].tested++; agg[m].tested++;
        if (picks.some((p) => win.has(p))) { per[m].hits++; agg[m].hits++; }
      }
    }
    for (const m of METHOD_ORDER) per[m].rate = per[m].tested ? +(per[m].hits / per[m].tested * 100).toFixed(1) : 0;
    out.operators[op] = { draws: draws.length, tested: targets.length, methods: per };
  }
  for (const m of METHOD_ORDER) out.overall[m] = { tested: agg[m].tested, hits: agg[m].hits, rate: agg[m].tested ? +(agg[m].hits / agg[m].tested * 100).toFixed(1) : 0 };
  return out;
}

/* ---------- main ---------- */
const byOp = loadDraws();
const counts = Object.fromEntries(OPERATORS.map((op) => [op, byOp[op].length]));
console.log('draws per operator:', JSON.stringify(counts));

const stats = buildStats(byOp);
fs.writeFileSync(path.join(ROOT, 'data', 'stats.json'), JSON.stringify(stats));
console.log('wrote data/stats.json');

const facts = mineFacts(byOp, stats);
fs.writeFileSync(path.join(ROOT, 'data', 'facts.json'), JSON.stringify({ generatedAt: new Date().toISOString(), count: facts.length, facts }));
console.log(`wrote data/facts.json (${facts.length} facts)`);

const bt = backtest(byOp);
fs.writeFileSync(path.join(ROOT, 'data', 'backtest.json'), JSON.stringify(bt));
console.log('wrote data/backtest.json');
console.log('overall hit rates:', Object.fromEntries(METHOD_ORDER.map((m) => [m, bt.overall[m].rate + '%'])));
