/* lib/journal.js — self-journaling: entries, auto-check vs archive, RM prize math, ledger.
 * Storage: data/journal.json (local, yours).
 */
'use strict';

const fs = require('fs');
const path = require('path');
const PM = require('./predict-methods.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'journal.json');
const HIST = path.join(DATA_DIR, 'history');

const OPS = ['magnum', 'toto', 'damacai', 'sandakan', 'sabah88', 'cashsweep', 'sgpools', 'dragon'];
const OP_PATH = { magnum: ['west', 'magnum'], toto: ['west', 'toto'], damacai: ['west', 'damacai'], sandakan: ['east', 'sandakan'], sabah88: ['east', 'sabah88'], cashsweep: ['east', 'cashsweep'], sgpools: ['sg', 'sgpools'], dragon: ['west', 'dragon'] };
const OP_NAMES = { magnum: 'Magnum 4D', toto: 'SportsToto 4D', damacai: 'DaMaCai 1+3D', sandakan: 'Sandakan 4D', sabah88: 'Sabah 88 4D', cashsweep: 'Sarawak CashSweep', sgpools: 'Singapore 4D', dragon: 'Grand Dragon 4D' };

/* Real prize structure per RM1 (Malaysian 4D, generic Big/Small) */
const PRIZES = {
  big: { '1st': 2500, '2nd': 1000, '3rd': 500, special: 180, consolation: 60 },
  small: { '1st': 3500, '2nd': 2000, '3rd': 1000 },
};
const OMENS = { dream: '😴 Dream', carplate: '🚗 Car plate', birthday: '🎂 Birthday', oracle: '🔮 Oracle', stats: '🧠 Stats lab', hz432: '🎵 432Hz', black: '⛧ Ritual', conspiracy: '🕶 Conspiracy', omen: '👁 Omen', random: '🎲 Random', other: '✍️ Other' };

/* ---------- storage ---------- */
function readJournal() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return { entries: [] }; }
}
function writeJournal(j) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(j, null, 2));
}
function genId() { return 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/* ---------- archive lookup ---------- */
function findDraw(op, dateISO) {
  const [a, b] = OP_PATH[op];
  const f = path.join(HIST, dateISO + '.json');
  if (!fs.existsSync(f)) return null;
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (j.empty) return null;
    const g = j[a] && j[a][b];
    if (!g || !g.top || !g.top.some((v) => /^\d{4}$/.test(v))) return null;
    return {
      top: g.top.filter((v) => /^\d{4}$/.test(v)),
      special: (g.special || []).filter((v) => /^\d{4}$/.test(v)),
      consolation: (g.consolation || []).filter((v) => /^\d{4}$/.test(v)),
      drawNo: g.drawNo || '',
    };
  } catch { return null; }
}
/* find the first draw for op on/after a date (entries written before the draw resolve later) */
function findDrawOnOrAfter(op, dateISO) {
  if (!fs.existsSync(HIST)) return null;
  const [a, b] = OP_PATH[op];
  for (const f of fs.readdirSync(HIST).filter((x) => x.endsWith('.json')).sort()) {
    if (f.replace('.json', '') < dateISO) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(HIST, f), 'utf8'));
      if (j.empty) continue;
      const g = j[a] && j[a][b];
      if (g && g.top && g.top.some((v) => /^\d{4}$/.test(v))) {
        return { ...findDraw(op, j.date || f.replace('.json', '')), date: j.date || f.replace('.json', '') };
      }
    } catch { /* skip */ }
  }
  return null;
}

/* ---------- check one entry ---------- */
function checkEntry(e) {
  const draw = findDraw(e.operator, e.drawDate) || findDrawOnOrAfter(e.operator, e.drawDate);
  const numbers = e.numbers.map((n) => {
    const bet = n.bet === 'small' ? 'small' : 'big';
    const amount = Math.max(0.5, Number(n.amount) || 1);
    if (!draw) return { num: n.num, bet, amount, status: 'pending', tier: null, won: 0 };
    let tier = null, idx = -1;
    idx = draw.top.indexOf(n.num);
    if (idx > -1) tier = ['1st', '2nd', '3rd'][idx];
    else if (draw.special.includes(n.num)) tier = 'special';
    else if (draw.consolation.includes(n.num)) tier = 'consolation';
    if (!tier) return { num: n.num, bet, amount, status: 'miss', tier: null, won: 0 };
    const table = PRIZES[bet];
    const won = (table[tier] || 0) * amount;
    return { num: n.num, bet, amount, status: won > 0 ? 'hit' : 'miss', tier, won };
  });
  const spent = numbers.reduce((a, n) => a + n.amount, 0);
  const won = numbers.reduce((a, n) => a + n.won, 0);
  return {
    ...e,
    numbers,
    spent: +spent.toFixed(2),
    won: +won.toFixed(2),
    net: +(won - spent).toFixed(2),
    resolved: !!draw,
    resolvedDate: draw && draw.date ? draw.date : e.drawDate,
    drawNo: draw ? draw.drawNo : null,
    omenLabel: OMENS[e.omen] || OMENS.other,
  };
}

function summarize(entries) {
  const checked = entries.map(checkEntry);
  const resolved = checked.filter((e) => e.resolved);
  const spent = checked.reduce((a, e) => a + e.spent, 0);
  const won = resolved.reduce((a, e) => a + e.won, 0);
  const hits = resolved.reduce((a, e) => a + e.numbers.filter((n) => n.status === 'hit').length, 0);
  const nums = resolved.reduce((a, e) => a + e.numbers.length, 0);
  const best = resolved.reduce((mx, e) => {
    for (const n of e.numbers) if (n.won > ((mx && mx.won) || 0)) mx = { num: n.num, tier: n.tier, won: n.won, date: e.resolvedDate, operator: e.operator };
    return mx;
  }, null);
  // per-omen scoreboard
  const omens = {};
  for (const e of resolved) {
    const o = omens[e.omen] || (omens[e.omen] = { spent: 0, won: 0, hits: 0, entries: 0 });
    o.spent += e.spent; o.won += e.won; o.hits += e.numbers.filter((n) => n.status === 'hit').length; o.entries++;
  }
  return {
    count: checked.length,
    pending: checked.filter((e) => !e.resolved).length,
    spent: +spent.toFixed(2),
    won: +won.toFixed(2),
    net: +(won - spent).toFixed(2),
    hits,
    numbers: nums,
    hitRate: nums ? +(hits / nums * 100).toFixed(1) : 0,
    best,
    omens,
  };
}

/* ---------- public api ---------- */
function getJournal() {
  const j = readJournal();
  const entries = j.entries.map(checkEntry).sort((a, b) => (b.drawDate + b.createdAt).localeCompare(a.drawDate + a.createdAt));
  return { updatedAt: new Date().toISOString(), entries, summary: summarize(j.entries), omenCatalog: OMENS, operatorNames: OP_NAMES };
}

function addEntry(input) {
  const j = readJournal();
  const numbers = [];
  for (const n of input.numbers || []) {
    const num = String(n.num || '').replace(/\D/g, '').padStart(4, '0').slice(-4);
    if (!/^\d{4}$/.test(num)) continue;
    if (!numbers.some((x) => x.num === num)) numbers.push({ num, bet: n.bet === 'small' ? 'small' : 'big', amount: Math.max(0.5, Math.min(500, Number(n.amount) || 1)) });
  }
  if (!numbers.length) throw new Error('need at least one 4-digit number');
  if (!OPS.includes(input.operator)) throw new Error('unknown operator');
  const e = {
    id: genId(),
    createdAt: new Date().toISOString(),
    drawDate: /^\d{4}-\d{2}-\d{2}$/.test(input.drawDate || '') ? input.drawDate : new Date().toISOString().slice(0, 10),
    operator: input.operator,
    numbers,
    omen: OMENS[input.omen] ? input.omen : 'other',
    note: String(input.note || '').slice(0, 500),
    source: String(input.source || 'journal').slice(0, 60),
  };
  j.entries.push(e);
  writeJournal(j);
  return checkEntry(e);
}

function deleteEntry(id) {
  const j = readJournal();
  const before = j.entries.length;
  j.entries = j.entries.filter((e) => e.id !== id);
  writeJournal(j);
  return { deleted: before - j.entries.length };
}

module.exports = { getJournal, addEntry, deleteEntry, PRIZES, OMENS, OP_NAMES, checkEntry };
