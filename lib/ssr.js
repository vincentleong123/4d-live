/* lib/ssr.js — server-side rendering of the actual draw results.
 *
 * The results tables are built client-side by app.js, which means crawlers and
 * social bots receive an empty shell. This renders the real numbers into the
 * initial HTML as a genuine, visible, indexable block styled like the rest of
 * the site. It is not hidden text — it is the fastest-painting summary of the
 * draw and the page still works without JavaScript.
 */
'use strict';

const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* "(Sun) 27-Sep-2026" → { iso: '2026-09-27', pretty: 'Sunday 27 September 2026' } */
function parseLabel(label) {
  const m = /(\d{2})-([A-Za-z]{3})-(\d{4})/.exec(String(label || ''));
  if (!m) return { iso: '', pretty: String(label || '') };
  const mon = MONTHS[m[2]];
  const days = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };
  const dow = /^\(([A-Za-z]{3})\)/.exec(String(label || ''));
  const long = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mon ? parseInt(mon, 10) - 1 : 0] || m[2];
  return {
    iso: mon ? `${m[3]}-${mon}-${m[1]}` : '',
    pretty: `${dow && days[dow[1]] ? days[dow[1]] + ' ' : ''}${parseInt(m[1], 10)} ${long} ${m[3]}`.trim(),
  };
}

const nums = (arr) => (arr || []).filter(Boolean);
const list = (arr) => nums(arr).map((n) => `<span class="ssr-n">${esc(n)}</span>`).join(' ');

function money(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s || s === '-') return '';
  return s.replace(/^RM\s?/, 'RM ');
}

function jpRows(jackpots) {
  return (jackpots || []).filter((j) => j && j.value && j.value !== '-')
    .map((j) => `${esc(j.label)} ${money(j.value)}`).join(', ');
}

/* ---- main block ---- */
function resultsBlock(data, locale, opts) {
  if (!data || !Array.isArray(data.cards) || !data.cards.length) return '';
  /* opts.home = compact summary (crawlable fast paint only); date pages get the full block */
  opts = opts || {};
  const home = !!opts.home;
  locale = locale || 'ms';
  const cards = data.cards;
  const ms = locale === 'ms';
  const I18N = require('./i18n.js');
  const T = (s) => I18N.T(s, locale);
  const pr = (en, bm) => (ms ? bm : en);
  const pre = ms ? '' : '/en';
  /* cards can carry different draw dates (dragon draws daily, west ops Wed/Sat...) —
   * the header uses the LATEST date, and every row shows its own date so nothing is misdated */
  const cd = cards.map((c) => parseLabel(c.date));
  const d0 = cd.reduce((mx, d, i) => (d.iso > mx.iso ? d : mx), cd[0] || parseLabel(''));
  const stamp = d0.iso ? `<time datetime="${d0.iso}">${esc(d0.pretty)}</time>` : esc(d0.pretty);
  const status = data.stale ? ' <span class="ssr-stale">(showing last known results)</span>' : '';

  const rows = cards.map((c, i) => {
    const jp = jpRows(c.jackpots);
    const own = cd[i] && cd[i].iso && cd[i].iso !== d0.iso ? ' <span class="ssr-x">' + esc(cd[i].iso.slice(8) + '-' + cd[i].iso.slice(5, 7)) + '</span>' : '';
    return `<tr>
      <th scope="row">${esc(c.name)}</th>
      <td class="ssr-w1">${esc(c.top[0] || '—')}</td>
      <td class="ssr-w1">${esc(c.top[1] || '—')}</td>
      <td class="ssr-w1">${esc(c.top[2] || '—')}</td>
      <td class="ssr-dn">${esc(c.drawNo || '—')}${own}</td>
      <td class="ssr-jp">${jp ? esc(jp) : '—'}</td>
    </tr>`;
  }).join('\n        ');

  /* special + consolation numbers, collapsible but fully present in the HTML */
  const details = cards.map((c) => {
    const sp = nums(c.special), co = nums(c.consolation);
    if (!sp.length && !co.length) return '';
    return `<details class="ssr-det">
          <summary>${esc(c.name)} — special (${sp.length}) &amp; consolation (${co.length}) numbers</summary>
          <p><b>Special:</b> ${list(sp) || '—'}</p>
          <p><b>Consolation:</b> ${list(co) || '—'}</p>
        </details>`;
  }).join('\n        ');

  /* side games */
  const S = data.side || {};
  const sideItems = [];
  const push = (label, balls, extra) => { if (balls && balls.filter(Boolean).length) sideItems.push({ label, balls: balls.filter(Boolean), extra }); };
  (S.lottos || []).forEach((l) => push(l.name, l.balls, jpRows(l.jackpots)));
  push('SportsToto 5D', S.toto5d && S.toto5d.prizes, S.toto5d && S.toto5d.date);
  push('SportsToto 6D', S.toto6d && S.toto6d.prizes, S.toto6d && S.toto6d.date);
  push('Magnum 4D Jackpot Gold', S.mgold && S.mgold.balls, [S.mgold && S.mgold.golden ? 'gold ' + S.mgold.golden : '', jpRows(S.mgold && S.mgold.jackpots)].filter(Boolean).join(', '));
  push('Magnum Life', S.life && S.life.balls, jpRows(S.life && S.life.jackpots));
  push('Damacai 3+3D', S.dmc33 && S.dmc33.top, S.dmc33 && S.dmc33.zodiac ? S.dmc33.zodiac.filter(Boolean).join('/') : '');
  push('Sabah 3D', S.sabah3d && S.sabah3d.rows, '');
  push('Sarawak CashSweep 3D', S.cs3d && S.cs3d.rows, '');
  push('Sabah Lotto', S.sabahLotto && S.sabahLotto.balls, jpRows(S.sabahLotto && S.sabahLotto.jackpots));
  push('Sabah Lotto 6', S.sabahL6 && S.sabahL6.balls, '');
  push('Sabah Lotto 5', S.sabahL5 && S.sabahL5.balls, '');
  push('Singapore Toto', S.sgToto && S.sgToto.balls, jpRows(S.sgToto && S.sgToto.tiers || (S.sgToto && S.sgToto.groups)));
  push('SportsToto Fireball', S.fireball && S.fireball.numbers, S.fireball && S.fireball.digit ? 'digit ' + S.fireball.digit : '');

  const sideHtml = (!home && sideItems.length)
    ? `<h3>${T('Also drawn')}</h3>
      <ul class="ssr-side">
        ${sideItems.map((s) => `<li><b>${esc(s.label)}</b> — ${list(s.balls)}${s.extra ? ` <span class="ssr-x">(${esc(s.extra)})</span>` : ''}</li>`).join('\n        ')}
      </ul>`
    : '';

  const spDraws = (data.specialDraws || []).filter((s) => s && (s.top || []).filter(Boolean).length);
  const spHtml = (!home && spDraws.length)
    ? `<h3>${T('Special draws')}</h3>
      <ul class="ssr-side">
        ${spDraws.map((s) => `<li><b>${esc(s.name)}</b> (${esc(String(s.date || '').replace(/^\(([^)]*)\)\s*/, '$1 '))}) — ${list(s.top)}</li>`).join('\n        ')}
      </ul>`
    : '';
  const ns = data.nextSpecial;
  const nsHtml = ns && ns.days != null
    ? `<p class="ssr-next">${T('Next special draw:')} <b>${esc(ns.date)}</b>${ns.days <= 60 ? ` — ${ms ? 'dalam ' + ns.days + ' hari' : 'in ' + ns.days + ' day' + (ns.days === 1 ? '' : 's')}` : ''}.</p>`
    : '';

  /* link the live draw to its permanent archive page (freshness + internal linking) */
  let archiveLink = '';
  try {
    const DP = require('./datepage.js');
    const dates = DP.listDates();
    if (d0.iso && dates.indexOf(d0.iso) > -1) {
      archiveLink = ` <a href="${pre}/results/${d0.iso}">${pr('Full results for', 'Keputusan penuh untuk')} ${esc(d0.pretty)} →</a>`;
    } else if (dates.length) {
      archiveLink = ` <a href="${pre}/results/">${pr('Browse the full results archive', 'Lihat semua keputusan lepas')} →</a>`;
    }
  } catch { /* archive unavailable: no link, no crash */ }

  return `<section class="ssr" aria-labelledby="ssr-h">
      <h2 id="ssr-h">${pr('Latest 4D results', 'Keputusan 4D terkini')} — ${stamp}${ms ? `<span class="en-sub">Latest 4D results — ${esc(d0.pretty)}</span>` : ''}${status}</h2>
      <table class="ssr-t">
        <caption>${pr('1st, 2nd and 3rd prize winning numbers for every 4D operator', 'Nombor menang hadiah utama, kedua dan ketiga untuk setiap operator 4D')}</caption>
        <thead><tr><th scope="col">${T('Operator')}</th><th scope="col">${T('1st Prize')}</th><th scope="col">${T('2nd Prize')}</th><th scope="col">${T('3rd Prize')}</th><th scope="col">${T('Draw No.')}</th><th scope="col">${T('Jackpot')}</th></tr></thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
      ${details}
      ${sideHtml}
      ${spHtml}
      ${nsHtml}
      <p class="ssr-more">${archiveLink} ${home ? pr('The full tables below load with special, consolation and prize breakdowns.', 'Jadual penuh di bawah memuat nombor khas, selesa dan butiran hadiah.') : pr('Full result tables, side games and prize breakdowns load live below.', 'Jadual keputusan penuh, permainan sampingan dan hadiah diload secara langsung di bawah.')} ${pr('Also', 'Juga')}: <a href="${pre}/results/">${pr('every archived draw date', 'setiap tarikh undian tersimpan')}</a>, <a href="${pre}/history.html">${pr('draw history', 'sejarah undian')}</a>, <a href="${pre}/stats.html">${pr('number statistics', 'statistik nombor')}</a>${home ? '' : `, <a href="${pre}/predict.html">${pr('prediction tools', 'alat ramalan')}</a>, <a href="${pre}/oracle.html">${pr('the oracle', 'oracle')}</a>, <a href="${pre}/wow.html">${pr('facts &amp; news', 'kebetulan &amp; berita')}</a>, <a href="${pre}/journal.html">${pr('my 4D journal', 'jurnal 4D saya')}</a>`}.</p>
    </section>`;
}

/* second JSON-LD graph describing the drawn numbers (valid alongside seo.js) */
function resultsLd(data, locale) {
  locale = locale || 'ms';
  if (!data || !Array.isArray(data.cards) || !data.cards.length) return '';
  const d0 = data.cards.map((c) => parseLabel(c.date)).reduce((mx, d) => (d.iso > mx.iso ? d : mx), parseLabel((data.cards[0] || {}).date));
  const ms = locale === 'ms';
  const pre = ms ? '' : '/en';
  const items = data.cards.filter((c) => (c.top || []).filter(Boolean).length).map((c, i) => {
    const own = parseLabel(c.date);
    return {
      '@type': 'ListItem',
      position: i + 1,
      name: `${c.name} 4D ${ms ? 'undian' : 'draw'} ${own.iso || ''}: ${ms ? 'hadiah utama' : '1st prize'} ${nums(c.top)[0] || ''}`,
      url: own.iso ? 'https://4dmalaya.com' + pre + '/results/' + own.iso : 'https://4dmalaya.com' + pre + '/results/',
    };
  });
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Dataset',
        '@id': 'https://4dmalaya.com/#draw-' + (d0.iso || 'latest'),
        name: '4D draw results ' + (d0.pretty || ''),
        description: 'Winning 4D numbers for all Malaysian and Singapore 4D operators.',
        creator: { '@id': 'https://4dmalaya.com/#org' },
        dateModified: data.updatedAt || new Date().toISOString(),
        temporalCoverage: d0.iso || undefined,
        variableMeasured: data.cards.map((c) => ({
          '@type': 'PropertyValue',
          name: c.name,
          value: nums(c.top).join(' / '),
        })),
        distribution: data.cards.map((c) => ({
          '@type': 'DataDownload',
          name: c.name + ' 1st/2nd/3rd prize',
          contentUrl: 'https://4dmalaya.com/api/history?operator=' + c.id,
        })),
      },
      { '@type': 'ItemList', '@id': 'https://4dmalaya.com/#draws-today', name: '4D draws today', itemListElement: items },
    ],
  };
  return '<script type="application/ld+json">' + JSON.stringify(graph) + '</script>';
}

function injectResults(html, data, locale, opts) {
  locale = locale || 'ms';
  const block = resultsBlock(data, locale, opts);
  const ld = resultsLd(data, locale);
  if (!block) return html;
  let out = html;
  if (ld) out = out.replace('</head>', ld + '\n</head>');
  /* inside the page container, above the tabs and the rich tables */
  const m = /<(div|main) class="main container[^"]*">/.exec(out);
  if (m) out = out.slice(0, m.index + m[0].length) + '\n    ' + block + out.slice(m.index + m[0].length);
  else if (out.includes('</nav>')) out = out.replace('</nav>', '</nav>\n' + block);
  else out = out.replace('<body>', '<body>\n' + block);
  return out;
}

module.exports = { injectResults, resultsBlock, resultsLd, parseLabel };
