#!/usr/bin/env node
/* scripts/smoke.js — permanent end-to-end check.
 *
 * Verifies the things that have silently broken before: SEO tags, JSON-LD validity,
 * server-rendered numbers matching the archive on disk, sitemap integrity and the
 * journal API. Run after any change:  node scripts/smoke.js
 * Exits non-zero on the first hard failure.
 */
'use strict';

const http = require('http');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:' + (process.env.PORT || 7011);
const HIST = path.join(__dirname, '..', 'data', 'history');

let pass = 0, fail = 0, warn = 0;
const ok = (m) => { pass++; console.log('  \u2713 ' + m); };
const no = (m) => { fail++; console.log('  \u2717 ' + m); };
const wr = (m) => { warn++; console.log('  ! ' + m); };
const group = (m) => console.log('\n' + m);

function get(p) {
  return new Promise((resolve, reject) => {
    http.get(BASE + p, (res) => {
      let b = '';
      res.on('data', (c) => { b += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b }));
    }).on('error', reject);
  });
}

/* request gzip and report both the wire size and the decoded size */
function getGz(p) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    http.get({ hostname: new URL(BASE).hostname, port: new URL(BASE).port, path: p, headers: { 'accept-encoding': 'gzip' } }, (res) => {
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        let decoded = raw;
        try { if (res.headers['content-encoding'] === 'gzip') decoded = require('zlib').gunzipSync(raw); } catch (e) { decoded = Buffer.from('<gunzip failed>'); }
        resolve({ status: res.statusCode, headers: res.headers, raw, decoded: decoded.toString('utf8') });
      });
    }).on('error', reject);
  });
}

function post(p, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + p);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, (res) => {
      let b = '';
      res.on('data', (c) => { b += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

function ldBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}

function checkLd(html, where) {
  const blocks = ldBlocks(html);
  if (!blocks.length) return no(`${where}: no JSON-LD`);
  let bad = 0;
  for (const b of blocks) {
    try { JSON.parse(b); } catch (e) { bad++; console.log('      invalid: ' + e.message.slice(0, 90)); }
  }
  if (bad) no(`${where}: ${bad}/${blocks.length} JSON-LD block(s) invalid`);
  else ok(`${where}: ${blocks.length} JSON-LD block(s) valid JSON`);
}

function checkSeo(html, where, expectCanonical) {
  const need = [
    [/<title>[^<]{10,120}<\/title>/, 'title present & sane length'],
    [/<meta name="description" content="[^"]{50,180}">/, 'description 50-180 chars'],
    [/<link rel="canonical" href="[^"]+">/, 'canonical'],
    [/<meta property="og:title"/, 'og:title'],
    [/<meta property="og:image"/, 'og:image'],
    [/<meta property="og:url"/, 'og:url'],
    [/<meta name="twitter:card" content="summary_large_image">/, 'twitter card'],
    [/<html lang="[^"]+">/, 'html lang set'],
  ];
  const isDatePage = /\/results\/\d{4}-\d{2}-\d{2}/.test(where);
  for (const [re, label] of need) {
    if (re.test(html)) ok(`${where}: ${label}`);
    else no(`${where}: ${label} MISSING`);
  }
  if (expectCanonical && !html.includes(expectCanonical)) no(`${where}: canonical should be ${expectCanonical}`);
  checkLd(html, where);
}

/* every page must carry a correct hreflang pair + x-default */
function checkHreflang(html, where, route) {
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const r = escRe(route || '/');
  const ms = new RegExp('<link rel="alternate" hreflang="ms-MY" href="https://4dmalaya\\.com' + r + '">');
  const en = new RegExp('<link rel="alternate" hreflang="en-MY" href="https://4dmalaya\\.com/en' + r + '">');
  const xd = new RegExp('<link rel="alternate" hreflang="x-default" href="https://4dmalaya\\.com' + r + '">');
  for (const [re, l] of [[ms, 'ms-MY'], [en, 'en-MY'], [xd, 'x-default']]) {
    if (re.test(html)) ok(`${where}: hreflang ${l}`);
    else no(`${where}: hreflang ${l} MISSING`);
  }
}

/* latest date that actually has 1st-prize numbers */
const HOWTO_ANCHORS = ['magnum-4d', 'sports-toto-4d', 'damacai-4d', 'grand-dragon-4d', 'sandakan-4d', 'sabah-88-4d', 'cashsweep-4d', 'singapore-4d', 'toto-fireball', 'toto-5d', 'toto-6d', 'toto-lotto', 'magnum-jackpot-gold', 'magnum-life', 'damacai-3-3d', 'sabah-3d', 'sabah-lotto', 'singapore-toto', 'special-draws'];

function latestDate() {
  const dates = fs.readdirSync(HIST).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  for (let i = dates.length - 1; i >= 0; i--) {
    const iso = dates[i].slice(0, -5);
    let j;
    try { j = JSON.parse(fs.readFileSync(path.join(HIST, dates[i]), 'utf8')); } catch { continue; }
    if (!j.empty && j.west && j.west.magnum && (j.west.magnum.top || []).some((v) => /^\d{4}$/.test(v))) return { iso, j };
  }
  return null;
}

(async () => {
  console.log(`4D LIVE smoke test → ${BASE}`);

  group('home page');
  const home = await get('/');
  if (home.status !== 200) no(`GET / → ${home.status}`);
  else {
    ok(`GET / → 200, ${home.body.length} bytes`);
    checkSeo(home.body, 'home');
    if (/<section class="ssr"/.test(home.body)) ok('home: SSR results block present'); else no('home: SSR results block MISSING');
    if (/<section class="ssr"[\s\S]{0,4000}?ssr-t/.test(home.body)) ok('home: SSR numbers in initial HTML'); else no('home: SSR numbers MISSING from HTML');
  }

  group('static pages');
  for (const p of ['/history.html', '/stats.html', '/predict.html', '/oracle.html', '/wow.html', '/journal.html']) {
    const r = await get(p);
    if (r.status !== 200) { no(`GET ${p} → ${r.status}`); continue; }
    checkSeo(r.body, p);
  }

  group('archive hub');
  const hub = await get('/results/');
  if (hub.status !== 200) no(`GET /results/ → ${hub.status}`);
  else {
    ok(`GET /results/ → 200, ${hub.body.length} bytes`);
    checkSeo(hub.body, 'hub', 'https://4dmalaya.com/results/');
    const links = [...hub.body.matchAll(/href="\/results\/(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);
    const uniq = new Set(links);
    if (uniq.size > 20) ok(`hub: ${uniq.size} unique date pages linked`);
    else no(`hub: only ${uniq.size} date links — expected the full archive`);
    checkLd(hub.body, 'hub');
    if (/lang="ms-MY"/.test(hub.body)) ok('hub: BM is the primary (lang="ms-MY")');
    else { no('hub: not BM (lang ms-MY missing)'); }
  }

  group('date pages');
  const latest = latestDate();
  if (!latest) no('no dated archive file with real numbers found');
  else {
    const { iso, j } = latest;
    const r = await get('/results/' + iso);
    if (r.status !== 200) no(`GET /results/${iso} → ${r.status}`);
    else {
      ok(`GET /results/${iso} → 200, ${r.body.length} bytes`);
      checkSeo(r.body, `date ${iso}`, 'https://4dmalaya.com/results/' + iso);
      if (r.body.includes(`<title>Keputusan 4D ${Number(iso.slice(8))} `) || r.body.includes(`<title>4D Results ${Number(iso.slice(8))} `)) ok('date: title carries the human date'); else no('date: title missing human date');
      if (/<time datetime="\d{4}-\d{2}-\d{2}">/.test(r.body)) ok('date: <time datetime> present'); else no('date: no <time datetime>');

      /* the important one: every number rendered must equal the file on disk */
      const REG = { magnum: 'west', toto: 'west', damacai: 'west', dragon: 'west', sandakan: 'east', sabah88: 'east', cashsweep: 'east', sgpools: 'sg' };
      let checked = 0, mismatch = 0, missing = 0;
      for (const [op, region] of Object.entries(REG)) {
        const g = j[region] && j[region][op];
        if (!g || !(g.top || []).some((v) => /^\d{4}$/.test(v))) continue;
        const top = g.top.filter((v) => /^\d{4}$/.test(v));
        for (const n of top) {
          checked++;
          if (!r.body.includes(`?operator=${op}&number=${n}`)) missing++;
        }
      }
      if (!checked) no('date: could not verify any numbers');
      else if (missing) no(`date: ${missing}/${checked} winning numbers missing or wrong operator`);
      else ok(`date: all ${checked} winning numbers match data/history/${iso}.json`);

      if (/class="dp-pager"/.test(r.body)) ok('date: prev/next pager present'); else wr('date: no pager (only archived date)');

      /* side games are not 4-digit — a 4-digit-only filter silently blanks them */
      const sd = (j.side || {});
      const sideWant = [];
      const pushWant = (label, arr) => { const a = (arr || []).filter((v) => v != null && String(v).trim() !== ''); if (a.length) sideWant.push([label, a]); };
      pushWant('Magnum 4D Jackpot Gold', sd.mgold && sd.mgold.digits);
      pushWant('Magnum Life', sd.life && sd.life.balls);
      pushWant('SportsToto 5D', sd.toto5d && sd.toto5d.prizes);
      pushWant('SportsToto 6D', sd.toto6d && sd.toto6d.prizes);
      if (sd.fireball) { pushWant('SportsToto Fireball — 1st', sd.fireball.first); pushWant('SportsToto Fireball — 2nd', sd.fireball.second); pushWant('SportsToto Fireball — 3rd', sd.fireball.third); }
      let sideBad = 0;
      for (const [label, vals] of sideWant) {
        if (!r.body.includes(label)) { no(`date: side game "${label}" missing`); sideBad++; continue; }
        const missing = vals.filter((v) => !r.body.includes('>' + String(v) + '<'));
        if (missing.length) { no(`date: side game "${label}" lost ${missing.length}/${vals.length} value(s) (e.g. ${missing[0]})`); sideBad++; }
      }
      if (!sideWant.length) wr('date: no side games stored for this date');
      else if (!sideBad) ok(`date: all ${sideWant.length} side games rendered with every value (${sideWant.reduce((a, [, v]) => a + v.length, 0)} numbers)`);
    }

    /* older date: check it renders and paginates */
    const older = await get('/results/2026-09-20');
    if (older.status === 200) ok('GET /results/2026-09-20 → 200 (older date)');
    else wr(`GET /results/2026-09-20 → ${older.status}`);

    const missingDate = await get('/results/2020-01-01');
    if (missingDate.status === 404) ok('GET /results/2020-01-01 → 404 (not archived)');
    else no(`GET /results/2020-01-01 → ${missingDate.status}, expected 404`);
  }

  group('sitemaps');
  const sm = await get('/sitemap.xml');
  if (sm.status !== 200 || !/<sitemapindex/.test(sm.body)) no('/sitemap.xml is not a sitemap index');
  else ok('/sitemap.xml → sitemapindex');
  for (const [p, expect] of [['/sitemap-pages.xml', /history\.html/], ['/sitemap-dates.xml', /\/results\/\d{4}-\d{2}-\d{2}/]]) {
    const r = await get(p);
    if (r.status !== 200) { no(`GET ${p} → ${r.status}`); continue; }
    if (!/<urlset/.test(r.body)) { no(`${p} is not a urlset`); continue; }
    const locs = [...r.body.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    if (!expect.test(r.body)) no(`${p}: expected pattern ${expect}`);
    else ok(`${p}: ${locs.length} URLs`);
    if (locs.length > 50_000) no(`${p}: ${locs.length} URLs exceeds the 50k sitemap limit`);
    const bad = locs.filter((l) => !/^https:\/\/4dmalaya\.com\//.test(l));
    if (bad.length) no(`${p}: ${bad.length} non-absolute or off-domain loc(s)`);
    else if (locs.length) ok(`${p}: all locs absolute on 4dmalaya.com`);
  }
  const rb = await get('/robots.txt');
  if (rb.status === 200 && /Sitemap: https:\/\/4dmalaya\.com\/sitemap\.xml/.test(rb.body)) ok('robots.txt points at the sitemap index');
  else no('robots.txt missing Sitemap directive');

  group('APIs');
  const apis = [['/api/results', /"cards"/], ['/api/journal', /"entries"|"summary"/], ['/api/stats', /.+/], ['/api/facts', /.+/], ['/api/backtest', /.+/], ['/api/news', /.+/], ['/api/history?operator=magnum&limit=5', /"draws"/]];
  for (const [p, re] of apis) {
    try {
      const r = await get(p);
      if (r.status !== 200) { no(`GET ${p} → ${r.status}`); continue; }
      let parsed = null;
      try { parsed = JSON.parse(r.body); } catch (e) { no(`GET ${p}: invalid JSON — ${e.message.slice(0, 60)}`); continue; }
      if (re.test(r.body)) ok(`GET ${p} → 200 valid JSON`);
      else no(`GET ${p} → 200 but payload shape changed`);
    } catch (e) { no(`GET ${p} threw: ${e.message}`); }
  }

  const res = await get('/api/results');
  try {
    const j = JSON.parse(res.body);
    const withNums = (j.cards || []).filter((c) => (c.top || []).filter(Boolean).length).length;
    if (withNums >= 8) ok(`/api/results: ${withNums} operators with winning numbers`);
    else no(`/api/results: only ${withNums} operators with numbers (expected 8)`);
    if (j.side && j.side.sgToto) ok('/api/results: Singapore Toto present (Singapore Sweep correctly absent)');
    else no('/api/results: sgToto MISSING');
    if (j.side && j.side.sgSweep) no('/api/results: sgSweep present — that was the P4.JP/Toto duplication bug'); else ok('/api/results: no bogus sgSweep');
  } catch (e) { no('/api/results parse failed: ' + e.message); }

  group('assets');
  for (const [p, type] of [['/og.png', 'image/png'], ['/og-ms.png', 'image/png'], ['/favicon.svg', 'image/svg+xml'], ['/favicon.ico', 'image/x-icon'], ['/apple-touch-icon.png', 'image/png'], ['/icon-192.png', 'image/png'], ['/icon-512.png', 'image/png'], ['/site.webmanifest', 'application/manifest+json'], ['/style.css', 'text/css']]) {
    const r = await get(p);
    if (r.status === 200 && String(r.headers['content-type'] || '').startsWith(type)) ok(`GET ${p} → 200 ${r.headers['content-type']}`);
    else no(`GET ${p} → ${r.status} ${r.headers['content-type'] || '?'}`);
  }
  /* manifest must reference icons that exist; brand must be 4D Malaya */
  const mf = await get('/site.webmanifest');
  try {
    const j = JSON.parse(mf.body);
    if (!/4D Malaya/.test(j.name)) no('manifest: brand is not 4D Malaya');
    else ok('manifest: brand 4D Malaya');
    for (const ic of j.icons || []) {
      const r = await get(ic.src);
      if (r.status === 200) ok(`manifest icon ${ic.src} → 200`);
      else no(`manifest icon ${ic.src} → ${r.status}`);
    }
  } catch (e) { no('manifest: invalid JSON — ' + e.message.slice(0, 60)); }
  /* every Icon link present in head */
  const hm = await get('/');
  for (const frag of ['rel="manifest" href="/site.webmanifest"', 'rel="icon" href="/favicon.ico"', 'rel="apple-touch-icon" href="/apple-touch-icon.png"', 'rel="icon" href="/favicon.svg"']) {
    if (hm.body.includes(frag)) ok('home head: ' + frag);
    else no('home head missing: ' + frag);
  }

  group('compression');
  for (const p of ['/', '/results/', '/results/' + (latest ? latest.iso : '2026-09-27'), '/style.css']) {
    const r = await getGz(p);
    if (r.status !== 200) { no(`gzip ${p} → ${r.status}`); continue; }
    if (r.headers['content-encoding'] !== 'gzip') { no(`gzip ${p}: no content-encoding`); continue; }
    const ratio = Math.round((1 - r.raw.length / r.decoded.length) * 100);
    if (ratio < 30) wr(`gzip ${p}: only ${ratio}% smaller`);
    else ok(`gzip ${p}: ${Math.round(r.raw.length / 1024)}KB vs ${Math.round(r.decoded.length / 1024)}KB raw (-${ratio}%)`);
  }
  const noGz = await get('/style.css');
  if (noGz.body.includes('.ssr-w1') || noGz.body.includes('.dp-t')) ok('identity encoding still serves readable CSS');
  else no('identity encoding returned unreadable CSS');

  group('languages — BM primary, English at /en/');
  const pairs = [
    ['/', '/en/'],
    ['/results/', '/en/results/'],
    ['/results/' + (latest ? latest.iso : '2026-09-27'), '/en/results/' + (latest ? latest.iso : '2026-09-27')],
    ['/history.html', '/en/history.html'],
    ['/tentang.html', '/en/tentang.html'],
  ];
  for (const [msPath, enPath] of pairs) {
    const a = await get(msPath), b = await get(enPath);
    if (a.status !== 200) { no(`BM ${msPath} → ${a.status}`); continue; }
    ok(`BM ${msPath} → 200 (${Math.round(a.body.length / 1024)}KB)`);
    if (/lang="ms-MY"/.test(a.body)) ok(`  ${msPath}: lang=ms-MY`);
    else no(`  ${msPath}: lang is not ms-MY`);
    if (/Keputusan|Tentang/i.test(a.body)) ok(`  ${msPath}: Bahasa Malaysia content present`);
    else no(`  ${msPath}: no BM copy found`);
    checkHreflang(a.body, msPath, msPath);
    if (b.status !== 200) { no(`EN ${enPath} → ${b.status}`); continue; }
    ok(`EN ${enPath} → 200 (${Math.round(b.body.length / 1024)}KB)`);
    if (/lang="en-MY"/.test(b.body)) ok(`  ${enPath}: lang=en-MY`);
    else no(`  ${enPath}: lang is not en-MY`);
    if (a.body.length && b.body.length && Math.abs(a.body.length - b.body.length) > 5 * 1024) wr(`  ${msPath} vs ${enPath} differ by >5KB (check tpl)`);
  }
  /* /en/ mirrors must point back to BM with an hreflang link */
  const enHome = await get('/en/');
  if (enHome.status === 200) {
    if (/hreflang="ms-MY" href="https:\/\/4dmalaya\.com\/"/.test(enHome.body)) ok('/en/: hreflang links back to BM root');
    else no('/en/: missing hreflang back to BM');
    if (/class="lang-sw"[^>]*href="https:\/\/4dmalaya\.com\/"/.test(enHome.body)) ok('/en/: switcher points to BM');
    else no('/en/: switcher does not point back to BM');
  }

  group('trust pages (BM + EN)');
  for (const p of ['/tentang.html', '/hubungi.html', '/privasi.html', '/terma.html', '/tanggungjawab.html', '/soalan.html']) {
    const a = await get(p), b = await get('/en' + p);
    if (a.status !== 200) no(`BM ${p} → ${a.status}`);
    else {
      ok(`BM ${p} → 200 (${Math.round(a.body.length / 1024)}KB)`);
      if (/tp-sec/.test(a.body)) ok(`  ${p}: real content rendered`);
      else no(`  ${p}: content NOT rendered`);
    }
    if (b.status !== 200) no(`EN ${p} → ${b.status}`);
    else ok(`EN ${p} → 200`);
  }
  const sitemapTrust = await get('/sitemap-pages.xml');
  if (sitemapTrust.status === 200) {
    const missing = ['/tentang.html', '/hubungi.html', '/privasi.html', '/terma.html', '/tanggungjawab.html', '/soalan.html', '/cara-main.html'].filter((p) => !sitemapTrust.body.includes(p));
    if (!missing.length) ok('sitemap: all 6 trust pages + cara-main listed');
    else no('sitemap: missing ' + missing.join(', '));
  }

  group('how-to-play guide (/cara-main.html)');
  for (const [p, anchors] of [['/cara-main.html', HOWTO_ANCHORS], ['/en/cara-main.html', HOWTO_ANCHORS]]) {
    const r = await get(p);
    if (r.status !== 200) { no(`GET ${p} → ${r.status}`); continue; }
    ok(`GET ${p} → 200 (${Math.round(r.body.length / 1024)}KB)`);
    const missingAnchors = anchors.filter((a) => !r.body.includes(`id="${a}"`));
    if (!missingAnchors.length) ok(`${p}: all ${anchors.length} game sections present`);
    else no(`${p}: sections missing (${missingAnchors.join(', ')})`);
    try {
      const blocks = [...r.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
      const faq = blocks.map((b) => { try { return JSON.parse(b); } catch { return null; } }).find((j) => j && j["@type"] === "FAQPage");
      if (faq) ok(`${p}: FAQPage JSON-LD valid (${faq.mainEntity.length} questions)`);
      else no(`${p}: FAQPage JSON-LD MISSING or unparseable`);
    } catch (e) { no(`${p}: FAQPage check crashed — ${e.message.slice(0, 50)}`); }
    if (/how-toc/.test(r.body)) ok(`${p}: table of contents present`);
    else no(`${p}: TOC MISSING`);
    if (r.body.includes('id="di-mana-beli"') && /how-steps/.test(r.body) && /Akta Pertaruhan|Betting Act/.test(r.body) && /Singapore Pools/.test(r.body)) ok(`${p}: where-to-buy section (licensed counter steps, online, bookie warning)`);
    else no(`${p}: where-to-buy section incomplete`);
  }

  group('toman folklore page (/toman.html)');
  for (const p of ['/toman.html', '/en/toman.html']) {
    const r = await get(p);
    if (r.status === 200 && r.body.includes('toman-fish') && /<ellipse[^>]+class="scale"/.test(r.body) && /history\.html\?operator=\w+&number=\d{4}/.test(r.body)) ok(`${p}: toman scale viewer with real-number deep links`);
    else no(`${p}: toman page broken (${r.status})`);
  }
  const homeToman = await get('/');
  if (!homeToman.body.includes('id="toman-teaser"')) ok('homepage: clean (toman teaser removed from live feed)');
  else no('homepage: toman teaser should not be on homepage');
  if (homeToman.body.includes('/toman.html')) ok('homepage: footer links to /toman.html');
  else no('homepage: footer missing /toman.html link');
  const smMap = await get('/sitemap-pages.xml');
  if (smMap.body.includes('/toman.html')) ok('sitemap: /toman.html listed');
  else no('sitemap: /toman.html missing');

  group('contact API');
  const bad = await post('/api/contact', JSON.stringify({ name: '', email: 'nope', message: '' }));
  if (bad.status === 400) ok('/api/contact rejects an empty form');
  else no(`/api/contact accepted an empty form (${bad.status})`);
  const good = await post('/api/contact', JSON.stringify({ name: 'Smoke Bot', email: 'bot@4dmalaya.com', message: 'smoke test ping — safe to ignore' }));
  if (good.status === 200 && /"ok":true/.test(good.body)) ok('/api/contact accepts a valid submission');
  else no(`/api/contact failed a valid submission (${good.status})`);
  /* never leave test data in the inbox the owner reads */
  try {
    const f = require('path').join(__dirname, '..', 'data', 'messages.json');
    const m = JSON.parse(fs.readFileSync(f, 'utf8'));
    const kept = m.filter((x) => !/smoke bot|smoke test ping/i.test([x.name, x.message].join(' ')));
    fs.writeFileSync(f, JSON.stringify(kept, null, 2));
  } catch { /* non-fatal */ }
  await get('/api/journal');

  console.log(`\n${'='.repeat(46)}\n  ${pass} passed, ${fail} failed, ${warn} warnings`);
  console.log('='.repeat(46));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('smoke crashed: ' + e.stack); process.exit(1); });
