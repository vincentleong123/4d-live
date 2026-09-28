/* lib/datepage.js — per-date archive pages.
 *
 * One indexable, server-rendered URL per draw date: /results/2026-09-27
 * This is the highest-value SEO surface for this site because it matches the
 * exact-match query people actually type ("4D results 27 September 2026")
 * and it is 100% unique content — unlike the per-number pages, every date has
 * its own set of numbers, so there is no doorway-page duplication risk.
 *
 * Plus a /results/ hub that links every date (internal-linking backbone).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SITE = 'https://4dmalaya.com';
const HIST = path.join(__dirname, '..', 'data', 'history');

const LONG_MONTHS = { ms: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const DAYS = { ms: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };

/* newspaper order, same as the home page */
const OP_ORDER = ['toto', 'damacai', 'magnum', 'sandakan', 'sabah88', 'cashsweep', 'sgpools', 'dragon'];
const OP_LABEL = {
  toto: 'SportsToto 4D', damacai: 'DaMaCai 1+3D', magnum: 'Magnum 4D',
  sandakan: 'Sandakan 4D', sabah88: 'Sabah 88 4D', cashsweep: 'Sarawak CashSweep',
  sgpools: 'Singapore Pools 4D', dragon: 'Grand Dragon 4D',
};
const OP_REGION = {
  toto: 'west', damacai: 'west', magnum: 'west', dragon: 'west',
  sandakan: 'east', sabah88: 'east', cashsweep: 'east', sgpools: 'sg',
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const num4 = (a) => (a || []).filter((v) => /^\d{4}$/.test(String(v == null ? '' : v).trim()));
const chips = (a) => num4(a).map((n) => `<span class="ssr-n">${esc(n)}</span>`).join(' ');

/* side games are NOT 4-digit: mGold is 6 single digits, Magnum Life is 8 two-digit
   balls, Toto 5D is 5 digits and 6D is 6 digits — so they need their own renderer */
const present = (a) => (a || []).filter((v) => v != null && String(v).trim() !== '');
const chipsAny = (a) => present(a).map((n) => `<span class="ssr-n">${esc(n)}</span>`).join(' ');

/* ---------------- date helpers ---------------- */

function parts(iso, locale) { locale = locale || 'ms';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null; // reject 2026-02-31
  return { iso, y: m[1], mo: m[2], d: m[3], dow: DAYS[locale][d.getDay()], long: `${LONG_MONTHS[locale][d.getMonth()]}`, day: Number(m[3]) };
}
const pretty = (iso, locale) => { const p = parts(iso, locale); return p ? `${p.dow} ${p.day} ${p.long} ${p.y}` : iso; };
const short = (iso) => { const p = parts(iso); return p ? `${p.d}-${p.mo}-${p.y}` : iso; };

/* ---------------- archive access ---------------- */

const _cache = new Map(); // iso -> { at, data }
let _list = { at: 0, dates: [] };

function readRaw(iso) {
  try { return JSON.parse(fs.readFileSync(path.join(HIST, iso + '.json'), 'utf8')); } catch { return null; }
}

/** Dates that have at least one real 1st-prize number, oldest first. */
function listDates() {
  if (Date.now() - _list.at < 120000) return _list.dates;
  const out = [];
  let files = [];
  try { files = fs.readdirSync(HIST); } catch { files = []; }
  for (const f of files) {
    if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(f)) continue;
    const iso = f.slice(0, -5);
    if (loadDate(iso)) out.push(iso);
  }
  out.sort();
  _list = { at: Date.now(), dates: out };
  return out;
}

function invalidate() { _cache.clear(); _list = { at: 0, dates: [] }; }

/** Normalised payload for one draw date, or null if nothing real is stored. */
function loadDate(iso) {
  if (!parts(iso)) return null;
  const hit = _cache.get(iso);
  if (hit && Date.now() - hit.at < 60000) return hit.data;
  const j = readRaw(iso);
  let data = null;
  if (j && !j.empty) {
    const ops = [];
    for (const op of OP_ORDER) {
      const g = (j[OP_REGION[op]] || {})[op];
      if (!g) continue;
      const top = num4(g.top);
      if (!top.length) continue;
      ops.push({
        op, name: OP_LABEL[op], drawNo: g.drawNo || '', top,
        special: num4(g.special), consolation: num4(g.consolation),
        zodiac: Array.isArray(g.zodiac) ? g.zodiac.filter(Boolean) : (g.zodiac ? [g.zodiac] : []),
      });
    }
    if (ops.length) {
      data = {
        iso: j.date && parts(j.date) ? j.date : iso,
        ops, side: j.side || null, specials: j.specials || null,
        firsts: ops.map((o) => ({ op: o.op, n: o.top[0] })),
      };
    }
  }
  _cache.set(iso, { at: Date.now(), data });
  return data;
}

function neighbours(iso) {
  const d = listDates();
  const i = d.indexOf(iso);
  return { prev: i > 0 ? d[i - 1] : null, next: i >= 0 && i < d.length - 1 ? d[i + 1] : null, index: i, total: d.length };
}

/* ---------------- metadata ---------------- */

function summary(data) {
  return data.firsts.map((f) => `${OP_LABEL[f.op]} ${f.n}`).join(', ');
}

function meta(iso, data, locale) {
  locale = locale || 'ms';
  const p = parts(iso, locale);
  /* keep the title inside Google's ~60-char display budget: date + 3 operators + "etc" */
  const shortNames = data.ops.slice(0, 3).map((o) => o.name.replace(/ 4D$/, '').replace('DaMaCai 1+3D', 'DaMaCai'));
  const rest = data.ops.length - shortNames.length;
  const ms = locale === 'ms';
  const titleNames = shortNames.join(', ') + (rest > 0 ? (ms ? ' & lagi' : ' & more') : '');
  const firsts = data.firsts.slice(0, 2).map((f) => `${f.n} ${OP_LABEL[f.op].replace(/ 4D$/, '')}`).join(', ');
  const crumbHub = ms ? 'Keputusan Lepas 4D' : '4D Results Archive';
  return {
    title: (ms ? `Keputusan 4D ${p.day} ${p.long} ${p.y} — ${titleNames}` : `4D Results ${p.day} ${p.long} ${p.y} — ${titleNames}`),
    desc: ms
      ? `Keputusan 4D ${p.day} ${p.long} ${p.y}: ${firsts}${rest > 0 ? `, dan ${data.ops.length - 2} operator lagi` : ''}. Hadiah utama/kedua/ketiga, nombor khas & selesa.`
      : `4D results ${p.day} ${p.long} ${p.y}: ${firsts}${rest > 0 ? `, and ${data.ops.length - 2} more operators` : ''}. Full 1st/2nd/3rd, special & consolation numbers.`,
    h1: ms ? `Keputusan 4D ${p.day} ${p.long} ${p.y}` : `4D Results ${p.day} ${p.long} ${p.y}`,
    sub: ms
      ? `Semua ${data.ops.length} operator 4D yang mengundi pada ${p.dow}, ${p.day} ${p.long} ${p.y} — nombor menang hadiah utama, kedua dan ketiga, serta senarai penuh nombor khas dan selesa.`
      : `All ${data.ops.length} 4D operators that drew on ${p.dow}, ${p.day} ${p.long} ${p.y} — 1st, 2nd and 3rd prize winning numbers plus the full special and consolation lists.`,
    lastmod: iso,
    breadcrumbs: [
      { name: '4D Malaysia Live', item: SITE + (ms ? '' : '/en') + '/' },
      { name: crumbHub, item: SITE + (ms ? '' : '/en') + '/results/' },
      { name: `${p.day} ${p.long} ${p.y}`, item: SITE + (ms ? '' : '/en') + '/results/' + iso },
    ],
  };
}

/* ---------------- rendering ---------------- */

function numLink(op, n) {
  return `<a class="ssr-w1" href="/history.html?operator=${op}&number=${n}">${esc(n)}</a>`;
}

function opRows(data, numLinkFn) {
  const L = numLinkFn || numLink;
  return data.ops.map((o) => `<tr>
        <th scope="row">${esc(o.name)}</th>
        <td>${numLink(o.op, o.top[0] || '')}</td>
        <td>${numLink(o.op, o.top[1] || '')}</td>
        <td>${numLink(o.op, o.top[2] || '')}</td>
        <td class="ssr-dn">${esc(o.drawNo || '—')}</td>
        <td class="ssr-x">${o.zodiac.length ? esc(o.zodiac.join(' / ')) : '—'}</td>
      </tr>`).join('\n        ');
}

function opDetails(data) {
  return data.ops.filter((o) => o.special.length || o.consolation.length).map((o) => `<details class="ssr-det">
          <summary>${esc(o.name)} — special (${o.special.length}) &amp; consolation (${o.consolation.length}) numbers</summary>
          <p><b>Special:</b> ${chips(o.special) || '—'}</p>
          <p><b>Consolation:</b> ${chips(o.consolation) || '—'}</p>
        </details>`).join('\n        ');
}

/* side games actually persisted in the archive files */
function sideList(data) {
  const s = data.side;
  if (!s) return [];
  const out = [];
  const add = (label, arr, extra) => { const a = present(arr); if (a.length) out.push({ label, balls: a, extra }); };
  add('Magnum 4D Jackpot Gold (6 digits)', s.mgold && s.mgold.digits, s.mgold && s.mgold.golden ? 'gold ' + s.mgold.golden : '');
  add('Magnum Life', s.life && s.life.balls, s.life && present(s.life.bonus).length ? 'bonus ' + present(s.life.bonus).join('/') : '');
  add('SportsToto 5D (1st-6th)', s.toto5d && s.toto5d.prizes, '');
  add('SportsToto 6D (1st-6th)', s.toto6d && s.toto6d.prizes, '');
  if (s.fireball) {
    add('SportsToto Fireball — 1st', s.fireball.first, 'digit ' + (s.fireball.digit || ''));
    add('SportsToto Fireball — 2nd', s.fireball.second, '');
    add('SportsToto Fireball — 3rd', s.fireball.third, '');
  }
  return out;
}

function specialsList(data) {
  const sp = data.specials;
  if (!sp) return [];
  const out = [];
  for (const [key, label] of [['p17', 'Special Draw 2'], ['p16', 'Special Draw 1']]) {
    const g = sp[key];
    if (!g) continue;
    const top = num4(g.top);
    if (!top.length) continue;
    out.push({ label, top, drawNo: g.drawNo || '', special: num4(g.special), consolation: num4(g.consolation) });
  }
  return out;
}

function block(iso, data, nb, locale) {
  locale = locale || 'ms';
  const p = parts(iso, locale);
  const ms = locale === 'ms';
  const T = (s) => require('./i18n.js').T(s, locale);
  const side = sideList(data);
  const sp = specialsList(data);
  const pr = (en, bm) => (ms ? bm : en);
  const prefix = ms ? '' : '/en';
  const nLink = (op, n) => `<a class="ssr-w1" href="${prefix}/history.html?operator=${op}&number=${n}">${esc(n)}</a>`;
  const slug = (iso) => prefix + '/results/' + iso;
  const opp = (s) => OP_LABEL[s] || s;

  const sideHtml = side.length
    ? `<h3>${pr('Also drawn on', 'Turut diundi pada')} ${p.day} ${p.long}</h3>
      <ul class="ssr-side">
        ${side.map((s) => `<li><b>${esc(s.label)}</b> — ${chipsAny(s.balls)}${s.extra ? ` <span class="ssr-x">(${esc(s.extra)})</span>` : ''}</li>`).join('\n        ')}
      </ul>`
    : '';

  const spHtml = sp.length
    ? `<h3>${T('Special draws')}</h3>
      <ul class="ssr-side">
        ${sp.map((s) => `<li><b>${esc(s.label)}</b> — ${chips(s.top)}${s.drawNo ? ` <span class="ssr-x">(${esc(s.drawNo)})</span>` : ''}${s.special.length ? `<br><span class="ssr-x">${T('Special')}:</span> ${chips(s.special)}` : ''}</li>`).join('\n        ')}
      </ul>`
    : '';

  const pager = (nb.prev || nb.next)
    ? `<nav class="dp-pager">
        ${nb.prev ? `<a class="dp-prev" rel="prev" href="${slug(nb.prev)}">← ${esc(pretty(nb.prev, locale))}</a>` : '<span></span>'}
        ${nb.next ? `<a class="dp-next" rel="next" href="${slug(nb.next)}">${esc(pretty(nb.next, locale))} →</a>` : '<span></span>'}
      </nav>`
    : '';

  return `<section class="ssr datepage" aria-labelledby="dp-h">
      <h2 id="dp-h">${pr('4D results for', 'Keputusan 4D untuk')} <time datetime="${iso}">${esc(pretty(iso, locale))}</time></h2>
      <p class="dp-lead"><b>${pr('1st prize', 'Hadiah utama')}:</b> ${data.firsts.map((f) => `${esc(opp(f.op))} <b>${esc(f.n)}</b>`).join(' · ')}</p>
      <table class="ssr-t">
        <caption>${pr('1st, 2nd and 3rd prize winning numbers and zodiac for every 4D operator that drew on', 'Nombor menang hadiah utama, kedua, ketiga dan zodiak untuk semua operator 4D yang mengundi pada')} ${esc(pretty(iso, locale))}. ${pr('Tap a number to see its full history.', 'Sentuh nombor untuk lihat sejarah penuhnya.')}</caption>
        <thead><tr><th scope="col">${T('Operator')}</th><th scope="col">${T('1st Prize')}</th><th scope="col">${T('2nd Prize')}</th><th scope="col">${T('3rd Prize')}</th><th scope="col">${T('Draw No.')}</th><th scope="col">${T('Zodiac')}</th></tr></thead>
        <tbody>
        ${opRows(data, nLink)}
        </tbody>
      </table>
      ${opDetails(data)}
      ${sideHtml}
      ${spHtml}
      ${pager}
      <p class="ssr-more">${pr('Also', 'Juga')}: <a href="${prefix}/results/">${pr('all', 'semua')} ${nb.total} ${pr('archived draw dates', 'tarikh undian tersimpan')}</a>, <a href="${prefix}/history.html">${pr('search any number', 'cari sebarang nombor')}</a>, <a href="${prefix}/stats.html">${pr('number statistics', 'statistik nombor')}</a>, <a href="${prefix}/">${pr("today's live results", 'keputusan langsung hari ini')}</a>.</p>
    </section>`;
}

function injectBlock(html, iso, data, nb, locale) {
  locale = locale || 'ms';
  const b = block(iso, data, nb, locale);
  const m = /<(div|main) class="main container[^"]*">/.exec(html);
  if (m) return html.slice(0, m.index + m[0].length) + '\n    ' + b + html.slice(m.index + m[0].length);
  if (html.includes('</nav>')) return html.replace('</nav>', '</nav>\n' + b);
  return html.replace('<body>', '<body>\n' + b);
}

/* ---------------- JSON-LD ---------------- */

function ld(iso, data, locale) {
  locale = locale || 'ms';
  const ms = locale === 'ms';
  const pfx = ms ? '' : '/en';
  const items = data.ops.map((o, i) => ({
    '@type': 'ListItem', position: i + 1,
    name: ms
      ? `${o.name} undian ${iso}: hadiah utama ${o.top[0] || ''}, kedua ${o.top[1] || ''}, ketiga ${o.top[2] || ''}`
      : `${o.name} draw ${iso}: 1st prize ${o.top[0] || ''}, 2nd prize ${o.top[1] || ''}, 3rd prize ${o.top[2] || ''}`,
    url: SITE + pfx + '/results/' + iso,
  }));
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Dataset',
        '@id': SITE + pfx + '/results/' + iso + '#dataset',
        name: ms ? `Keputusan undian 4D ${pretty(iso, locale)}` : `4D draw results ${pretty(iso, locale)}`,
        description: ms
          ? `Nombor menang hadiah utama, kedua, ketiga, khas dan selesa untuk semua operator 4D yang mengundi pada ${pretty(iso, locale)}.`
          : `Winning 1st, 2nd and 3rd prize, special and consolation numbers for all 4D operators that drew on ${pretty(iso, locale)}.`,
        creator: { '@id': SITE + '/#org' },
        dateModified: iso,
        temporalCoverage: iso,
        isAccessibleForFree: true,
        inLanguage: ms ? 'ms-MY' : 'en-MY',
        variableMeasured: data.ops.map((o) => ({
          '@type': 'PropertyValue',
          name: ms ? `${o.name} hadiah utama/kedua/ketiga` : `${o.name} 1st/2nd/3rd prize`,
          value: o.top.join(' / '),
        })),
        distribution: data.ops.map((o) => ({
          '@type': 'DataDownload', name: `${o.name} ${pretty(iso, locale)}`,
          contentUrl: SITE + pfx + `/results/${iso}?operator=${o.op}`,
        })),
      },
      { '@type': 'ItemList', '@id': SITE + pfx + '/results/' + iso + '#draws', name: ms ? `Undian 4D pada ${pretty(iso, locale)}` : `4D draws on ${pretty(iso, locale)}`, numberOfItems: items.length, itemListElement: items },
    ],
  };
  return '<script type="application/ld+json">' + JSON.stringify(graph) + '</script>';
}

/* ---------------- /results/ hub ---------------- */

function hubMeta(locale) {
  locale = locale || 'ms';
  const ms = locale === 'ms';
  const pfx = ms ? '' : '/en';
  return ms ? {
    title: 'Keputusan Lepas 4D — Semua Hasil Mengikut Tarikh',
    desc: 'Semua hasil 4D mengikut tarikh yang tersimpan: nombor hadiah utama Magnum, SportsToto, DaMaCai, Grand Dragon, Sandakan, Sabah 88, CashSweep dan Singapura Pools.',
    h1: 'Keputusan Lepas 4D',
    sub: 'Setiap tarikh undian tersimpan, dengan nombor hadiah utama semua 8 operator bersebelahan. Buka mana-mana tarikh untuk senarai penuh nombor khas dan selesa.',
    breadcrumbs: [
      { name: '4D Malaysia Live', item: SITE + '/' },
      { name: 'Keputusan Lepas 4D', item: SITE + '/results/' },
    ],
  } : {
    title: '4D Results Archive — Every Draw Date',
    desc: 'Every archived 4D draw date: Magnum, SportsToto, DaMaCai, Grand Dragon, Sandakan, Sabah 88, CashSweep and Singapore Pools 1st prize numbers, day by day.',
    h1: '4D Results Archive',
    sub: 'Every draw date we have archived, with the 1st prize number for all 8 operators side by side. Open any date for the full 1st/2nd/3rd, special and consolation numbers.',
    breadcrumbs: [
      { name: '4D Malaysia Live', item: SITE + '/en/' },
      { name: '4D Results Archive', item: SITE + '/en/results/' },
    ],
  };
}

function hubBlock(locale) {
  locale = locale || 'ms';
  const ms = locale === 'ms';
  const pfx = ms ? '' : '/en';
  const dates = listDates().slice().reverse(); // newest first
  if (!dates.length) return '<section class="ssr"><h2>' + (ms ? 'Tiada undian tersimpan lagi' : 'No archived draws yet') + '</h2></section>';
  const ops = OP_ORDER.filter((op) => dates.some((d) => (loadDate(d).ops.find((o) => o.op === op))));
  const head = ops.map((op) => `<th scope="col">${esc(OP_LABEL[op].replace(/ 4D$/, ''))}</th>`).join('');
  const byMonth = new Map();
  for (const iso of dates) {
    const p = parts(iso, locale);
    const k = `${p.long} ${p.y}`;
    if (!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k).push(iso);
  }
  const sections = [...byMonth.entries()].map(([k, list]) => {
    const rows = list.map((iso) => {
      const d = loadDate(iso);
      const tds = ops.map((op) => {
        const o = d.ops.find((x) => x.op === op);
        return `<td class="dp-w">${o && o.top[0] ? `<a href="${pfx}/history.html?operator=${op}&number=${o.top[0]}">${esc(o.top[0])}</a>` : '<span class="ssr-x">—</span>'}</td>`;
      }).join('');
      return `<tr><th scope="row"><a href="${pfx}/results/${iso}"><time datetime="${iso}">${esc(short(iso))}</time></a></th>${tds}</tr>`;
    }).join('\n          ');
    return `<h3>${esc(k)}</h3>
        <table class="ssr-t dp-t">
          <thead><tr><th scope="col">${ms ? 'Tarikh' : 'Date'}</th>${head}</tr></thead>
          <tbody>
          ${rows}
          </tbody>
        </table>`;
  }).join('\n        ');

  return `<section class="ssr datepage" aria-labelledby="hub-h">
      <h2 id="hub-h">${dates.length} ${ms ? 'tarikh undian tersimpan' : 'archived draw dates'}</h2>
      <p class="dp-lead">${ms ? 'Terbaharu dahulu. Nombor hadiah utama setiap operator — buka satu tarikh untuk nombor khas dan selesa yang penuh.' : 'Newest first. 1st prize number per operator — open a date for the full 1st/2nd/3rd, special and consolation numbers.'}</p>
        ${sections}
      <p class="ssr-more">${ms ? 'Juga' : 'Also'}: <a href="${pfx}/history.html">${ms ? 'cari sebarang nombor' : 'search any number'}</a>, <a href="${pfx}/stats.html">${ms ? 'statistik nombor' : 'number statistics'}</a>, <a href="${pfx}/">${ms ? "keputusan langsung hari ini" : "today's live results"}</a>.</p>
    </section>`;
}

function insertSection(html, sectionHtml) {
  const m = /<(div|main) class="main container[^"]*">/.exec(html);
  if (m) return html.slice(0, m.index + m[0].length) + '\n    ' + sectionHtml + html.slice(m.index + m[0].length);
  if (html.includes('</nav>')) return html.replace('</nav>', '</nav>\n' + sectionHtml);
  return html.replace('<body>', '<body>\n' + sectionHtml);
}

function injectHub(html, locale) {
  return insertSection(html, hubBlock(locale));
}

module.exports = {
  SITE, OP_ORDER, OP_LABEL, pretty, short, parts, listDates, loadDate, invalidate,
  neighbours, meta, summary, block, injectBlock, ld, hubMeta, hubBlock, injectHub,
};
