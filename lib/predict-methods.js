/* lib/predict-methods.js — the prediction brain shared by backtest + live server.
 * Every method is DETERMINISTIC: (operator, dateISO, snap) → 5 four-digit picks.
 * snap = { freq: {num: count}, lastSeen: {num: isoDate}, draws: [iso...] } — data BEFORE target date.
 * Entertainment first, honesty always: no method beats a fair draw. The AI Overwatch tracks that.
 */
'use strict';

/* ---------- deterministic rng ---------- */
function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pad4 = (n) => String(((Number(String(n).replace(/\D/g, '')) % 10000) + 10000) % 10000).padStart(4, '0');

/* ---------- moon phase (synodic) ---------- */
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14) / 86400000; // days
const SYNODIC = 29.530588853;
function moonInfo(dateISO) {
  const days = Date.parse(dateISO + 'T12:00:00Z') / 86400000;
  const age = ((days - NEW_MOON_EPOCH) % SYNODIC + SYNODIC) % SYNODIC;
  const idx = Math.floor((age / SYNODIC) * 8 + 0.5) % 8;
  const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
  return { age: +age.toFixed(2), phase: names[idx], emoji: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][idx] };
}

/* ---------- zodiac (tropical, approx) ---------- */
const ZODIAC = [['Capricorn', '♑'], ['Aquarius', '♒'], ['Pisces', '♓'], ['Aries', '♈'], ['Taurus', '♉'], ['Gemini', '♊'], ['Cancer', '♋'], ['Leo', '♌'], ['Virgo', '♍'], ['Libra', '♎'], ['Scorpio', '♏'], ['Sagittarius', '♐'], ['Capricorn', '♑']];
function zodiacInfo(dateISO) {
  const d = new Date(dateISO + 'T12:00:00Z');
  const md = (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  const edges = [120, 219, 320, 420, 520, 621, 722, 823, 923, 1023, 1122, 1222, 1232];
  let i = 0;
  while (i < edges.length && md > edges[i]) i++;
  return { name: ZODIAC[i][0], emoji: ZODIAC[i][1] };
}

/* ---------- planet day (Chaldean order) ---------- */
const PLANET_DAYS = [['Sun', 'Sun', '☉'], ['Moon', 'Moon', '☾'], ['Mars', 'Mars', '♂'], ['Mercury', 'Mercury', '☿'], ['Jupiter', 'Jupiter', '♃'], ['Venus', 'Venus', '♀'], ['Saturn', 'Saturn', '♄']];
function planetDay(dateISO) {
  const dow = new Date(dateISO + 'T12:00:00Z').getUTCDay();
  return PLANET_DAYS[dow];
}

const numRoot = (n) => { while (n > 9) n = String(n).split('').reduce((a, d) => a + +d, 0); return n; };
function dayOfYear(dateISO) {
  const d = new Date(dateISO + 'T12:00:00Z');
  return Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
}

/* ---------- THE METHODS ----------
 * Each: fn(op, dateISO, snap) → { picks: [5 strings], why: string, confidence: 0..100, flavor: {...} }
 */

const METHODS = {};

/* 1. Statistics — hot frequency */
METHODS.hot = (op, dateISO, snap) => {
  const entries = Object.entries(snap.freq).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const picks = entries.slice(0, 5).map(([n]) => n);
  while (picks.length < 5) picks.push(pad4(hash32(op + dateISO + picks.length)));
  const top = entries[0];
  const OP_NAMES = { magnum: 'Magnum 4D', toto: 'SportsToto 4D', damacai: 'DaMaCai 1+3D', sandakan: 'Sandakan 4D', sabah88: 'Sabah 88 4D', cashsweep: 'Sarawak CashSweep', sgpools: 'Singapore 4D', dragon: 'Grand Dragon 4D' };
  const opName = OP_NAMES[op] || op;
  return {
    picks,
    why: `Most-drawn numbers in ${opName}'s recorded history${top ? ` — ${top[0]} appeared ${top[1]}× (odds said it shouldn't)` : ''}.`,
    confidence: 12 + (top ? Math.min(15, top[1] * 2) : 0),
    flavor: { top: top ? `${top[0]} ×${top[1]}` : null },
  };
};

/* 2. Statistics — cold / "due" */
METHODS.cold = (op, dateISO, snap) => {
  const now = Date.parse(dateISO) / 86400000;
  const entries = Object.entries(snap.lastSeen)
    .map(([n, last]) => [n, last ? now - Date.parse(last) / 86400000 : 9999])
    .sort((a, b) => b[1] - a[1]);
  const picks = entries.slice(0, 5).map(([n]) => n);
  while (picks.length < 5) picks.push(pad4(hash32('cold' + op + dateISO + picks.length)));
  return {
    picks,
    why: 'Longest "vacations" — numbers that have been silent the longest. (The math says coins have no memory. The heart says everything does.)',
    confidence: 8,
    flavor: { longest: entries[0] ? `${entries[0][0]} silent for ${Math.round(entries[0][1])} days` : null },
  };
};

/* 3. Numerology */
METHODS.numerology = (op, dateISO) => {
  const [y, m, d] = dateISO.split('-');
  const digitsum = (s) => String(s).split('').reduce((a, c) => a + +c, 0);
  const root = numRoot(digitsum(y) + digitsum(m) + digitsum(d));
  const dd = d.padStart(2, '0'), mm = m.padStart(2, '0'), yy = y.slice(-2);
  const picks = [...new Set([dd + mm, mm + dd, dd + yy, yy + dd, String(root).repeat(2) + dd, mm + String(root).repeat(2), pad4(digitsum(dateISO.replace(/-/g, ''))), root + '' + digitsum(m) + '' + digitsum(d) + '' + root])]
    .map((s) => pad4(s));
  while (picks.length < 5) picks.push(pad4(hash32('num' + dateISO + picks.length)));
  return {
    picks: picks.slice(0, 5),
    why: `Date ${dd}-${mm}-${y} vibrates to root number ${root} (digit sum ${digitsum(y) + digitsum(m) + digitsum(d)} → ${numRoot(digitsum(y) + digitsum(m) + digitsum(d))}). Numbers built from the day's own digits.`,
    confidence: 10 + root,
    flavor: { root, lifePath: root },
  };
};

/* 4. Cosmic universe — moon + zodiac + planet day */
METHODS.cosmic = (op, dateISO) => {
  const moon = moonInfo(dateISO);
  const zod = zodiacInfo(dateISO);
  const pd = planetDay(dateISO);
  const moonDigit = Math.floor(moon.age); // 0..29
  const doy = dayOfYear(dateISO);
  const zseed = hash32(op + dateISO + zod.name);
  const raw = [
    pad4(moonDigit * 111),
    pad4(moonDigit * 137 + doy),
    pad4(hash32('zodiac' + zod.name) % 10000),
    pad4(hash32('planet' + pd[0] + dateISO) % 10000),
    pad4(Math.round(moon.age * 100) % 10000),
  ];
  const picks = [...new Set(raw)];
  while (picks.length < 5) picks.push(pad4(zseed + picks.length * 77));
  return {
    picks: picks.slice(0, 5),
    why: `${moon.emoji} ${moon.phase} (moon age ${moon.age}d) over ${zod.emoji} ${zod.name}, planetary ruler ${pd[2]} ${pd[0]}. The sky literally dictated these digits.`,
    confidence: 10 + Math.round(moon.age / 3),
    flavor: { moon, zodiac: zod, planet: pd[0] },
  };
};

/* 5. 432Hz resonance */
METHODS.hz432 = (op, dateISO) => {
  const doy = dayOfYear(dateISO);
  const phi = 1.6180339887;
  const picks = [
    pad4(432 * doy),
    pad4(432 + 108 * (doy % 40)),
    pad4(Math.floor(phi * doy * doy)),
    pad4(Math.floor(432 * phi) + doy),
    pad4((4 + 3 + 2) * 1000 + (432 % 1000) - doy),
  ];
  return {
    picks: picks.slice(0, 5),
    why: `Tuned to A=432Hz: 4+3+2 = 9, the universal root. 108 = 432÷4 (sacred count). Golden ratio φ = ${phi} woven through day ${doy} of the year.`,
    confidence: 9 + (doy % 9),
    flavor: { hz: 432, doy, mantra: '108' },
  };
};

/* 6. Conspiracy */
METHODS.conspiracy = (op, dateISO) => {
  const elite = ['0013', '0023', '0033', '0042', '0133', '1337', '0911', '0088', '0444', '4444', '0666', '1666', '6660', '2310', '1212', '1313', '1717', '2020', '2025', '2026', '2332', '3300', '0909', '0303', '1408'];
  const [y, m, d] = dateISO.split('-');
  const dateElite = [pad4(d + m), pad4(m + d), pad4(d + y.slice(-2)), pad4(y.slice(-2) + m)];
  const pool = [...new Set([...elite, ...dateElite])];
  const rng = mulberry32(hash32('wakeup' + op + dateISO));
  const picks = [];
  while (picks.length < 5) {
    const c = pool[Math.floor(rng() * pool.length)];
    if (!picks.includes(c)) picks.push(c);
  }
  return {
    picks,
    why: `Elite signature numbers (13, 23, 33, 42, 1337, 666…) cross-referenced with the date, drawn from the classified pool. They don't want you to have these. Now you do.`,
    confidence: 23,
    flavor: { classified: true, poolSize: pool.length },
  };
};

/* 7. Black magic */
METHODS.black = (op, dateISO) => {
  const moon = moonInfo(dateISO);
  const rng = mulberry32(hash32('hexhex ' + op + ' ' + dateISO + ' ' + moon.age));
  const cursed = [];
  while (cursed.length < 5) {
    let n = Math.floor(rng() * 10000);
    if (String(n).includes('6') || String(n).includes('0')) { cursed.push(pad4(n)); }
  }
  const sigils = ['⛧', '👁', '🕯', '🜏', '🝮'];
  return {
    picks: cursed,
    why: `Ritual performed under ${moon.emoji} ${moon.phase}. Digits summoned from the other side of the RNG — blessed by sigils ${sigils.slice(0, 3).join(' ')}. Do not fear the 6s.`,
    confidence: 66,
    flavor: { sigils, moonPhase: moon.phase },
  };
};

/* 8. Crystal ball */
METHODS.crystal = (op, dateISO, snap) => {
  const hot = Object.entries(snap.freq).sort((a, b) => b[1] - a[1]).slice(0, 100);
  const rng = mulberry32(hash32('myst ' + op + ' ' + dateISO));
  const picks = [];
  while (picks.length < 5) {
    if (hot.length && rng() < 0.75) {
      const [n] = hot[Math.floor(rng() * hot.length)];
      if (!picks.includes(n)) picks.push(n);
    } else {
      const n = pad4(Math.floor(rng() * 10000));
      if (!picks.includes(n)) picks.push(n);
    }
  }
  return {
    picks,
    why: 'The mist cleared for exactly 4.32 seconds. These numbers fell out of the aether, gently weighted toward the recently hot. The ball never lies; it also never promises.',
    confidence: 33,
    flavor: { vision: true },
  };
};

const METHOD_ORDER = ['hot', 'cold', 'numerology', 'cosmic', 'hz432', 'conspiracy', 'black', 'crystal'];
const METHOD_META = {
  hot: { name: 'Stat Lab — HOT', icon: '🔥', desc: 'Raw frequency king. The numbers that just keep showing up.' },
  cold: { name: 'Stat Lab — COLD', icon: '🧊', desc: 'Longest absent. Due? No. Dramatic? Absolutely.' },
  numerology: { name: 'Numerology', icon: '🔢', desc: 'The draw date itself, distilled into root vibrations.' },
  cosmic: { name: 'Cosmic Universe', icon: '🌌', desc: 'Moon phase, zodiac and planetary rulership — the sky picks.' },
  hz432: { name: '432Hz Resonance', icon: '🎵', desc: 'A=432Hz sacred math. 108. φ. 9. Feel the frequency.' },
  conspiracy: { name: 'Conspiracy Desk', icon: '🕶', desc: 'Elite signature numbers. Wake up, punters.' },
  black: { name: 'Black Magic', icon: '⛧', desc: 'Seeded ritual RNG under the current moon. Dark mode.' },
  crystal: { name: 'Crystal Ball', icon: '🔮', desc: 'A 4.32-second vision, weighted toward the hot.' },
};

module.exports = { METHODS, METHOD_ORDER, METHOD_META, moonInfo, zodiacInfo, planetDay, mulberry32, hash32, pad4, numRoot, dayOfYear };
