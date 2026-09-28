/* fetch-history.js — curate 4D draw history into data/history/{date}.json
 * Sources: 4dmoon.com per-date archive pages (past + rolling), 4d88 G1.json (today capture)
 * Usage:
 *   node scripts/fetch-history.js --days 365     (backfill last N days)
 *   node scripts/fetch-history.js --today        (capture live feeds as today's entry)
 * Resumable: skips dates already stored. Polite: 250ms delay, retry w/ backoff.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HIST_DIR = path.join(ROOT, 'data', 'history');
const FEEDS = {
  g1: 'https://ajax01.4d88.asia/ajax/G1.json',
  moonWest: 'https://www.4dmoon.com/feedwest.json',
  moonEast: 'https://www.4dmoon.com/feedeast.json',
  moonSg: 'https://www.4dmoon.com/feedsg.json',
};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) 4d-live-history/2.0';

/* ---------- io helpers ---------- */
function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function exists(date) { return fs.existsSync(path.join(HIST_DIR, date + '.json')); }
function save(date, obj) {
  ensureDir(HIST_DIR);
  fs.writeFileSync(path.join(HIST_DIR, date + '.json'), JSON.stringify(obj));
}

async function get(url, as = 'text') {
  const res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return as === 'json' ? res.json() : res.text();
}

/* ---------- 4dmoon past-page parser ---------- */
const HEADER_TO_FAMILY = { m4dl: 'magnum', sttl: 'toto', dmcl: 'damacai', stcl: 'sandakan', s88l: 'sabah', stecl: 'cashsweep', sgpl: 'sg' };

function cells(block, cls) {
  const re = new RegExp(`class="${cls}"[^>]*>(?:<div[^>]*>)?([^<]*)<`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(block))) out.push(m[1].trim());
  return out;
}

function parseMoonPage(html) {
  const out = { west: {}, east: {}, sg: {}, side: {} };
  const blocks = html.split('<div class="mbx">').slice(1).map((b) => b.slice(0, b.indexOf('</table></div>') + 1 || 5000));
  for (const raw of blocks) {
    const b = raw;
    // header cell class
    const hm = b.match(/class="(m4dl|sttl|dmcl|stcl|s88l|stecl|sgpl)"/);
    if (!hm) continue;
    const family = HEADER_TO_FAMILY[hm[1]];
    // card name (text in the second header cell, before <br>)
    const nm = b.match(/class="(?:m4dl|sttl|dmcl|stcl|s88l|stecl|sgpl)" style="width:75%">\s*([A-Za-z0-9 +]+?)</);
    const name = nm ? nm[1].replace(/\s+/g, ' ').trim() : '';
    // rdd date + drawNo
    const rd = b.match(/class="rdd">([^<]+)</);
    let date = '', drawNo = '';
    if (rd) {
      const s = rd[1].trim();
      const dm = s.match(/^(\(?\w+\)?\s*)?(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
      if (dm) {
        const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
        date = `${dm[4]}-${months[dm[3].toLowerCase()]}-${dm[2].padStart(2, '0')}`;
      }
      const dn = s.match(/#\s*([\w\/-]+)/);
      drawNo = dn ? '#' + dn[1] : '';
    }
    const rtn = cells(b, 'rtn').filter((v) => /^\d+$/.test(v));
    const rbn = cells(b, 'rbn').filter((v) => /^[\w\d]+$/.test(v) && v !== '&nbsp;');
    const rmg = cells(b, 'rmg').filter((v) => /^[\w\d]+$/.test(v));
    const rto2 = cells(b, 'rto2').filter((v) => /^[\d]+$/.test(v));
    const rto = cells(b, 'rto').filter((v) => /^[\d]+$/.test(v));
    const jpv = cells(b, 'rjpv');
    // split special/consolation via rpl markers inside block
    const spIdx = b.indexOf('>Special<');
    const coIdx = b.indexOf('>Consolation<');
    const rbnIdxs = [...b.matchAll(/class="rbn"[^>]*>([^<]*)</g)].map((m) => ({ v: m[1].trim(), i: m.index }));
    const nums4 = (arr) => arr.filter((v) => /^\d{4}$/.test(v));

    const finish = (o) => { o.date = date; o.drawNo = drawNo; return o; };

    if (/1\+3D/i.test(name)) {
      const sp = nums4(rbnIdxs.filter((c) => spIdx > -1 && c.i > spIdx && (coIdx === -1 || c.i < coIdx)).map((c) => c.v));
      const co = nums4(rbnIdxs.filter((c) => coIdx > -1 && c.i > coIdx).map((c) => c.v));
      out.west.damacai = finish({ top: rtn.filter((v) => v.length === 4), special: sp, consolation: co });
    } else if (/^Magnum 4D$/i.test(name) || /^Magnum 4D\b(?!.*Jackpot)/.test(name)) {
      const sp = nums4(rbnIdxs.filter((c) => spIdx > -1 && c.i > spIdx && (coIdx === -1 || c.i < coIdx)).map((c) => c.v));
      const co = nums4(rbnIdxs.filter((c) => coIdx > -1 && c.i > coIdx).map((c) => c.v));
      out.west.magnum = finish({ top: rtn.filter((v) => v.length === 4), special: sp, consolation: co });
    } else if (/^SportsToto 4D$/i.test(name)) {
      const sp = nums4(rbnIdxs.filter((c) => spIdx > -1 && c.i > spIdx && (coIdx === -1 || c.i < coIdx)).map((c) => c.v));
      const co = nums4(rbnIdxs.filter((c) => coIdx > -1 && c.i > coIdx).map((c) => c.v));
      const zd = b.match(/class="rmgo"[^>]*>([^<]+)</);
      out.west.toto = finish({ top: rtn.filter((v) => v.length === 4), special: sp, consolation: co, zodiac: zd ? zd[1].trim() : null });
    } else if (/3\+3D/i.test(name)) {
      out.side.dmc33 = finish({
        top: rbn.filter((v) => /^\d{6}$/.test(v)).slice(0, 3),
        zodiac: rbn.filter((v) => /^[A-Z]+$/.test(v)).slice(0, 3),
        special: rmg.filter((v) => /^\d{6}$/.test(v)).slice(0, 10),
      });
    } else if (/^SportsToto 5D$/i.test(name)) {
      out.side.toto5d = finish({ prizes: rbn.filter((v) => /^\d{1,5}$/.test(v)).slice(0, 6) });
    } else if (/^SportsToto 6D$/i.test(name)) {
      out.side.toto6d = finish({ prizes: rbn.filter((v) => /^\d{2,6}$/.test(v)).slice(0, 9) });
    } else if (/Lotto$/i.test(name)) {
      out.side.lottos = finish({ balls: rto2.concat(rto).slice(0, 30) });
    } else if (/Jackpot Gold/i.test(name)) {
      out.side.mgold = finish({ digits: rmg.filter((v) => /^\d$/.test(v)).slice(0, 8) });
    } else if (/Magnum Life/i.test(name)) {
      out.side.life = finish({ balls: rto2.slice(0, 8), bonus: rto2.slice(8, 10) });
    } else if (/^Sabah 3D$/i.test(name)) {
      out.east.sabah3d = finish({ top: rtn.filter((v) => v.length === 3) });
    } else if (/^Sabah 4D$/i.test(name)) {
      const sp = nums4(rbnIdxs.filter((c) => spIdx > -1 && c.i > spIdx && (coIdx === -1 || c.i < coIdx)).map((c) => c.v));
      const co = nums4(rbnIdxs.filter((c) => coIdx > -1 && c.i > coIdx).map((c) => c.v));
      out.east.sabah88 = finish({ top: rtn.filter((v) => v.length === 4), special: sp, consolation: co });
    } else if (/Sabah Lotto/i.test(name)) {
      out.side.sabahLotto = finish({ balls: rto2.slice(0, 8) });
    } else if (/CashSweep/i.test(name)) {
      const sp = nums4(rbnIdxs.filter((c) => spIdx > -1 && c.i > spIdx && (coIdx === -1 || c.i < coIdx)).map((c) => c.v));
      const co = nums4(rbnIdxs.filter((c) => coIdx > -1 && c.i > coIdx).map((c) => c.v));
      out.east.cashsweep = finish({ top: rtn.filter((v) => v.length === 4), special: sp, consolation: co });
    } else if (/Sandakan/i.test(name)) {
      const sp = nums4(rbnIdxs.filter((c) => spIdx > -1 && c.i > spIdx && (coIdx === -1 || c.i < coIdx)).map((c) => c.v));
      const co = nums4(rbnIdxs.filter((c) => coIdx > -1 && c.i > coIdx).map((c) => c.v));
      out.east.sandakan = finish({ top: rtn.filter((v) => v.length === 4), special: sp, consolation: co });
    } else if (/Singapore 4D/i.test(name)) {
      const sp = nums4(rbnIdxs.filter((c) => spIdx > -1 && c.i > spIdx && (coIdx === -1 || c.i < coIdx)).map((c) => c.v));
      const co = nums4(rbnIdxs.filter((c) => coIdx > -1 && c.i > coIdx).map((c) => c.v));
      out.sg.sgpools = finish({ top: rtn.filter((v) => v.length === 4), special: sp, consolation: co });
    }
  }
  return out;
}

function isEmpty(day) {
  const has = (o) => o && (o.top || []).some((v) => v);
  return !has(day.west.damacai) && !has(day.west.magnum) && !has(day.west.toto) && !has(day.east.sandakan) && !has(day.east.sabah88) && !has(day.east.cashsweep) && !has(day.sg.sgpools);
}

/* ---------- moon backfill ---------- */
async function backfill(days) {
  ensureDir(HIST_DIR);
  const today = new Date();
  let ok = 0, skip = 0, empty = 0, fail = 0;
  for (let i = 1; i <= days; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    const date = d.toISOString().slice(0, 10);
    if (exists(date)) { skip++; continue; }
    const url = `https://www.4dmoon.com/past-results/${date}`;
    try {
      const html = await get(url);
      const day = parseMoonPage(html);
      if (isEmpty(day)) { empty++; saveEmpty(date); }
      else { save(date, day); ok++; }
      process.stdout.write(`\r[${i}/${days}] ok=${ok} empty=${empty} skip=${skip} fail=${fail}  `);
    } catch (e) {
      fail++;
      process.stdout.write(`\r[${i}/${days}] ok=${ok} empty=${empty} skip=${skip} fail=${fail} (${e.message.slice(0, 40)})      `);
      await new Promise((r) => setTimeout(r, 3000));
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`\nbackfill done: ok=${ok} empty=${empty} skip=${skip} fail=${fail}`);
}

function saveEmpty(date) { save(date, { date, empty: true }); }

/* ---------- today capture (4d88 + moon live feeds) ---------- */
const clean = (v) => { const s = v == null ? '' : String(v).trim(); return (!s || /^-{2,}/.test(s) || s === '-') ? null : s; };
const seq = (o, p, n) => Array.from({ length: n }, (_, i) => clean(o ? o[p + (i + 1)] : null));
const toISO = (dd) => { const m = clean(dd) && clean(dd).match(/^(\d{2})-(\d{2})-(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : new Date().toISOString().slice(0, 10); };
const normDN = (v) => (clean(v) ? (String(clean(v)).startsWith('#') ? clean(v) : '#' + clean(v)) : null);

function mergeSlot(oldArr, newArr) {
  const n = Math.max((oldArr || []).length, (newArr || []).length);
  const out = [];
  for (let i = 0; i < n; i++) out.push(oldArr && oldArr[i] != null ? oldArr[i] : newArr && newArr[i] != null ? newArr[i] : null);
  return out;
}
function mergeGame(oldG, newG) {
  if (!oldG) return newG;
  if (!newG) return oldG;
  return {
    date: oldG.date || newG.date, drawNo: oldG.drawNo || newG.drawNo,
    top: mergeSlot(oldG.top, newG.top),
    special: mergeSlot(oldG.special, newG.special),
    consolation: mergeSlot(oldG.consolation, newG.consolation),
    zodiac: oldG.zodiac || newG.zodiac || null,
  };
}

async function captureToday() {
  const [g1, mw, me, ms] = await Promise.all([
    get(FEEDS.g1, 'json').catch(() => null),
    get(FEEDS.moonWest, 'json').catch(() => null),
    get(FEEDS.moonEast, 'json').catch(() => null),
    get(FEEDS.moonSg, 'json').catch(() => null),
  ]);
  if (!g1 && !mw) throw new Error('no feeds reachable');
  const P = g1 || {};
  const grab = (o) => ({ top: seq(o, 'P', 3), special: seq(o, 'S', 13), consolation: seq(o, 'C', 10) });

  // bucket by each operator's own draw date
  const buckets = {};
  const add = (dateISO, section, key, game) => {
    const b = (buckets[dateISO] = buckets[dateISO] || { date: dateISO, west: {}, east: {}, sg: {}, side: {}, specials: {} });
    b[section][key] = game;
  };
  const put4d = (o, section, key) => {
    if (!o) return;
    const g = grab(o);
    g.date = clean(o.DD);
    g.drawNo = normDN(o.DN);
    if (g.top.some(Boolean)) add(toISO(o.DD), section, key, g);
  };
  put4d(P.P1 && P.P1['4D'], 'west', 'magnum');
  put4d(P.P2 && P.P2['4D'], 'west', 'toto');
  put4d(P.P3 && P.P3['4D'], 'west', 'damacai');
  put4d(P.P15 && P.P15['4D'], 'west', 'dragon');
  put4d(P.P5 && P.P5['4D'], 'east', 'sandakan');
  put4d(P.P6 && P.P6['4D'], 'east', 'sabah88');
  put4d(P.P7 && P.P7['4D'], 'east', 'cashsweep');
  put4d(P.P4 && P.P4['4D'], 'sg', 'sgpools');
  for (const k of ['P16', 'P17']) {
    const o = P[k] && P[k]['4D'];
    if (o && o.DONE === 1) {
      const g = grab(o); g.drawNo = clean(P[k].DN);
      add(toISO(o.DD), 'specials', k.toLowerCase(), g);
    }
  }
  if (P.P2 && P.P2['4D']) {
    const d = toISO(P.P2['4D'].DD);
    const b = buckets[d] = buckets[d] || { date: d, west: {}, east: {}, sg: {}, side: {}, specials: {} };
    if (b.west.toto) b.west.toto.zodiac = clean(P.P2.ZD && P.P2.ZD.ZD1) || clean(mw && mw.T && mw.T.ZODIAC);
    if (P.P1 && P.P1.GLD) b.side.mgold = { digits: seq(P.P1.GLD, 'P', 6), golden: (clean(P.P1.GLD.PB1) || '') + (clean(P.P1.GLD.PB2) || '') };
    if (P.P1 && P.P1.LF) b.side.life = { balls: seq(P.P1.LF, 'P', 8), bonus: [clean(P.P1.LF.B1), clean(P.P1.LF.B2)] };
    if (P.P2['5D']) b.side.toto5d = { prizes: seq(P.P2['5D'], 'P', 6) };
    if (P.P2['6D']) b.side.toto6d = { prizes: seq(P.P2['6D'], 'P', 9) };
    if (mw && mw.T && mw.T.FB != null) b.side.fireball = {
      digit: clean(mw.T.FB),
      first: [...String(mw.T.FB1 || '').matchAll(/>(\d{4})</g)].map((m) => m[1]),
      second: [...String(mw.T.FB2 || '').matchAll(/>(\d{4})</g)].map((m) => m[1]),
      third: [...String(mw.T.FB3 || '').matchAll(/>(\d{4})</g)].map((m) => m[1]),
    };
  }

  // merge into files (never clobber scraped data — fill gaps only)
  ensureDir(HIST_DIR);
  const saved = [];
  for (const [dateISO, bucket] of Object.entries(buckets)) {
    const f = path.join(HIST_DIR, dateISO + '.json');
    let ex = null;
    if (fs.existsSync(f)) { try { ex = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { ex = null; } }
    if (ex && !ex.empty) {
      for (const sec of ['west', 'east', 'sg', 'specials']) {
        for (const k of Object.keys(bucket[sec])) {
          ex[sec] = ex[sec] || {};
          ex[sec][k] = mergeGame(ex[sec][k], bucket[sec][k]);
        }
      }
      for (const k of Object.keys(bucket.side)) { ex.side = ex.side || {}; ex.side[k] = ex.side[k] || bucket.side[k]; }
      save(dateISO, ex);
    } else {
      save(dateISO, bucket);
    }
    saved.push(dateISO);
  }
  console.log('captured live feeds →', saved.join(', ') || 'nothing new');
}

/* ---------- main ---------- */
module.exports = { parseMoonPage, captureToday, backfill, HIST_DIR };

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    if (args.includes('--today')) {
      await captureToday();
      return;
    }
    const di = args.indexOf('--days');
    const days = di > -1 ? Number(args[di + 1]) || 365 : 365;
    await backfill(days);
  })().catch((e) => { console.error(e); process.exit(1); });
}
