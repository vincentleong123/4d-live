/* lib/seo.js —.locale-aware SEO: per-page meta (BM primary, EN at /en/),
 * hreflang pairs + x-default, WhatsApp/Twitter cards, JSON-LD, visible H1,
 * sitemap index, and the client i18n bootstrap.
 */
'use strict';

const I18N = require('./i18n.js');
const SITE = 'https://4dmalaya.com';
const UPDATED = process.env.SEO_UPDATED || new Date().toISOString().slice(0, 10);

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* route (canonical, no prefix) -> meta picks. Trust pages live in lib/trustpage.js. */
const PAGES = ['/', '/history.html', '/stats.html', '/predict.html', '/oracle.html', '/wow.html', '/journal.html', '/results/'];
const TRUSTED = ['/tentang.html', '/hubungi.html', '/privasi.html', '/terma.html', '/tanggungjawab.html', '/soalan.html'];

/* ---------------- locale-aware URL helpers ---------------- */

function Lurl(route, locale) { return locale === 'en' ? SITE + '/en' + route : SITE + route; }
function siteRoot(locale) { return locale === 'en' ? SITE + '/en' : SITE; }

function picks(route, locale) {
  if (route === '/results/') return I18N.PAGES['/results-archive/'][locale];
  const p = I18N.PAGES[route];
  return p ? p[locale] : null;
}

function hreflang(route) {
  return [
    '<link rel="alternate" hreflang="ms-MY" href="' + SITE + route + '">',
    '<link rel="alternate" hreflang="en-MY" href="' + SITE + '/en' + route + '">',
    '<link rel="alternate" hreflang="x-default" href="' + SITE + route + '">',
  ];
}

/* lastmod for the /en/ mirror uses the archive date so freshness is preserved */
function lastmod(p, route) {
  return p && p.lastmod ? p.lastmod : UPDATED;
}

/* ---------------- JSON-LD ---------------- */

function jsonLd(route, p, locale) {
  const url = Lurl(route, locale);
  const crumbs = p && p.breadcrumbs
    ? p.breadcrumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item }))
    : [
      { '@type': 'ListItem', position: 1, name: '4D Malaya', item: Lurl('/', locale) },
      ...(route === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: p.h1, item: url }]),
    ];
  const graph = [
    { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: '4D Malaya', inLanguage: locale === 'en' ? 'en-MY' : 'ms-MY', publisher: { '@id': SITE + '/#org' } },
    { '@type': 'Organization', '@id': SITE + '/#org', name: '4D Malaya', url: SITE + '/', description: 'Live Malaysian 4D results, history, statistics and entertainment prediction tools.' },
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: p.title, description: p.desc, isPartOf: { '@id': SITE + '/#website' }, about: { '@id': SITE + '/#website' }, inLanguage: locale === 'en' ? 'en-MY' : 'ms-MY', dateModified: lastmod(p, route) },
    { '@type': 'BreadcrumbList', itemListElement: crumbs },
  ];
  if (route === '/') {
    graph.push({
      '@type': 'ItemList', '@id': SITE + '/#draws', name: '4D draws covered',
      itemListElement: ['Magnum 4D', 'SportsToto 4D', 'DaMaCai 1+3D', 'Grand Dragon 4D', 'Sandakan 4D', 'Sabah 88 4D', 'Sarawak CashSweep', 'Singapore Pools 4D']
        .map((n, i) => ({ '@type': 'ListItem', position: i + 1, name: n })),
    });
  }
  return '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) + '</script>';
}

/* ---------------- head ---------------- */

function head(route, p, locale) {
  const url = Lurl(route, locale);
  const og = locale === 'en' ? '/og.png' : '/og-ms.png';
  const loc = locale === 'en' ? 'en_MY' : 'ms_MY';
  const alt = locale === 'en' ? 'ms_MY' : 'en_MY';
  const siteName = '4D Malaya';
  return [
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">',
    '<link rel="canonical" href="' + url + '">',
    ...hreflang(route),
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<meta name="theme-color" content="#55472d">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="icon" href="/favicon.ico" sizes="16x16 48x48" type="image/x-icon">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    '<meta property="og:site_name" content="' + siteName + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="' + loc + '">',
    '<meta property="og:locale:alternate" content="' + alt + '">',
    '<meta property="og:title" content="' + esc(p.title) + '">',
    '<meta property="og:description" content="' + esc(p.desc) + '">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:image" content="' + SITE + og + '">',
    '<meta property="og:image:secure_url" content="' + SITE + og + '">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="' + esc(locale === 'en' ? 'Live 4D results — Magnum, SportsToto, DaMaCai and more' : 'Hasil dan keputusan 4D langsung — Magnum, SportsToto, DaMaCai dan lebih banyak') + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + esc(p.title) + '">',
    '<meta name="twitter:description" content="' + esc(p.desc) + '">',
    '<meta name="twitter:image" content="' + SITE + og + '">',
    jsonLd(route, p, locale),
  ].join('\n    ');
}

/* ---------------- visible H1 + crawlable summary, with small English mirror ---------------- */

function masthead(p, enOverride) {
  const en = enOverride ? '<span class="en-sub">' + esc(enOverride) + '</span>' : '';
  return '<div class="seo-mast"><div class="container"><h1>' + esc(p.h1) + en + '</h1><p>' + esc(p.sub) + '</p></div></div>';
}

/* ---------------- Google Analytics (gtag) — injected once per page ----------------
 * ID is overridable with GA_ID env var so the code never needs editing.
 */
const GA_ID = process.env.GA_ID || 'G-3PGGPTT41J';
const gaTag = () => process.env.GA_ID === 'off' ? '' :
  '<script async src="https://www.googletagmanager.com/gtag/js?id=' + esc(GA_ID) + '"></script>\n'
  + '<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n'
  + '  gtag(\'js\', new Date());\n  gtag(\'config\', \'' + esc(GA_ID) + '\');\n</script>';

/* ---------------- i18n bootstrap for the client ---------------- */

function i18nBootstrap(locale) {
  if (locale !== 'ms') return ''; /* English is the source fallback */
  return '<script>window.__L__=' + JSON.stringify({ lang: 'ms', t: I18N.STRINGS }) + ';</script>';
}

/* ---------------- localize the static chrome ---------------- */

function alternates(route, locale) {
  return locale === 'ms' ? siteRoot(locale) + route : SITE + route;
}
function switcherLib(route, locale) {
  return '<a class="lang-sw" href="' + (locale === 'ms' ? SITE + '/en' + route : SITE + route)
    + '" hreflang="' + (locale === 'ms' ? 'en-MY' : 'ms-MY') + '" rel="alternate" title="Switch language">'
    + (locale === 'ms' ? 'EN' : 'BM') + '</a>';
}

function trustLinks(locale) {
  const ms = locale !== 'en';
  const L = (en, bm) => (ms ? bm : en);
  const p = ms ? '' : '/en';
  return '<div class="footer-trust container">'
    + '<a href="' + p + '/">4DMALAYA</a> <a href="' + p + '/cara-main.html">' + esc(L('How to play', 'Cara Main')) + '</a> &nbsp;·&nbsp; '
    + '<a href="' + p + '/tentang.html">' + esc(L('About', 'Tentang Kami')) + '</a> &nbsp;·&nbsp; '
    + '<a href="' + p + '/hubungi.html">' + esc(L('Contact', 'Hubungi')) + '</a> &nbsp;·&nbsp; '
    + '<a href="' + p + '/privasi.html">' + esc(L('Privacy', 'Privasi')) + '</a> &nbsp;·&nbsp; '
    + '<a href="' + p + '/terma.html">' + esc(L('Terms', 'Terma')) + '</a> &nbsp;·&nbsp; '
    + '<a href="' + p + '/tanggungjawab.html"><strong>' + esc(L('Responsible Play', 'Permainan Bertanggungjawab')) + '</strong></a> &nbsp;·&nbsp; '
    + '<a href="' + p + '/soalan.html">' + esc(L('FAQ', 'Soalan Lazim')) + '</a> &nbsp;·&nbsp; '
    + '<a href="' + p + '/toman.html">' + esc(L('Toman Folklore', 'Folklor Toman')) + '</a>'
    + ' <span class="age">18+ · ' + esc(ms ? 'Bermain bertanggungjawab' : 'Play responsibly') + '</span>'
    + ' <span class="src-note">' + esc(ms ? 'Sumber data' : 'Data sources') + ': 4d88.asia · 4dmoon.com</span>'
    + '</div>';
}

/* rewrite internal hrefs + visible chrome at serve time. BM is the primary source in the
 * HTML; /en/ swaps BM chrome back to English so both locales come from one file. */
const CHROME_PAIRS = [
  ['>Semua<', '>All<'],
  ['>Malaysia Barat<', '>West Malaysia<'],
  ['>Malaysia Timur<', '>East Malaysia<'],
  ['>Singapura<', '>Singapore<'],
  ['>Undian Khas<', '>Special Draws<'],
  /* strip the .en-sub dual-language mirror so /en/ stays pure English */
  ['<span class="en-sub">Live 4D results right now — every operator</span>', ''],
  ['Nombor panas &amp; sejuk <span class="tr-sub">daripada 30 undian terakhir</span><span class="en-sub">Hot &amp; cold numbers — from the last 30 draws</span>',
   'Hot &amp; cold numbers <span class="tr-sub">from the last 30 draws</span>'],
  ['<span class="en-sub">Hot numbers</span>', ''],
  ['<span class="en-sub">Cold numbers</span>', ''],
  ['<span class="en-sub">Trends &amp; analysis</span>', ''],
  ['<span class="en-sub">West Malaysia · Grand Dragon</span>', ''],
  ['>Nombor panas<', '>Hot numbers<'],
  ['>Nombor sejuk<', '>Cold numbers<'],
  ['>Trend &amp; analisis<', '>Trends &amp; analysis<'],
  ['Keputusan 4D terkini <strong>secara langsung</strong> — semua operator', 'Live 4D results right now — every operator'],
  ['>Keputusan<', '>Results<'],
  ['>Keputusan Lepas<', '>Archive<'],
  ['>Sejarah<', '>History<'],
  ['>Statistik<', '>Stats Lab<'],
  ['>Ramalan<', '>Predict<'],
  ['>Kebetulan<', '>Wow<'],
  ['>📓 Jurnal<', '>📓 Journal<'],
  ['Semak nombor anda:', 'Check your number:'],
  ['cari nombor e.g. 1234', 'search number e.g. 1234'],
  ['Statistik penuh setiap operator →', 'Full statistics per operator →'],
  ['Uji ramalan AI Overwatch →', 'Try the AI Overwatch prediction →'],
];

/* localized copy for the static text that lives inside the archive shells */
const SHELL_MS = [
  ['<h2>📜 Draw Date</h2>', '<h2>📜 Tarikh Undian</h2>'],
  ['Winning numbers for one draw date — 1st, 2nd and 3rd prize, special and consolation numbers for every 4D operator.',
   'Nombor menang bagi satu tarikh undian — hadiah utama, kedua dan ketiga, serta nombor khas dan selesa untuk setiap operator 4D.'],
  ['<h2>📚 4D Results Archive</h2>', '<h2>📚 Keputusan Lepas 4D</h2>'],
  ['Every draw date we have stored, with the 1st prize number for all 8 operators side by side. Open any date for the full breakdown.',
   'Setiap tarikh undian yang kami simpan, dengan nombor hadiah utama semua 8 operator bersebelahan. Buka mana-mana tarikh untuk senarai penuh.'],
];

/* live count for the "Keputusan {n} hari lepas" home link (archive grows daily) */
function archiveCount() {
  try { return require('./datepage.js').listDates().length; } catch { return 0; }
}

function localizeChrome(html, route, locale) {
  if (locale !== 'ms') { /* /en/: prefix internal links and swap BM chrome to English */
    let out = html
      .replace(/(<a [^>]*href=")\/(?!\/|en\/)/g, '$1/en/');
    const n = archiveCount();
    if (n) out = out.replace(/Keputusan \d+ hari lepas/g, 'Every one of ' + n + ' archived days');
    for (const [ms, en] of CHROME_PAIRS) out = out.split(ms).join(en);
    return out;
  }
  const T = (s) => I18N.T(s, 'ms');
  let out = html;
  const chrome = [
    ['>Results<', '>' + T('Results') + '<'],
    ['>Archive<', '>' + T('Archive') + '<'],
    ['>History<', '>' + T('History') + '<'],
    ['>Stats Lab<', '>' + T('Stats Lab') + '<'],
    ['>Predict<', '>' + T('Predict') + '<'],
    ['>Oracle<', '>' + T('Oracle') + '<'],
    ['>Wow<', '>' + T('Wow') + '<'],
    ['>📓 Journal<', '>📓 ' + T('Journal') + '<'],
    ['Check your number:', T('Check your number:')],
    ['placeholder="e.g. 3715"', 'placeholder="' + T('search number e.g. 1234') + '"'],
    /* crucial section headings: BM primary + small English mirror underneath */
    ['West Malaysia</div>', T('West Malaysia') + '<span class="en-sub">West Malaysia</span></div>'],
    ['East Malaysia</div>', T('East Malaysia') + '<span class="en-sub">East Malaysia</span></div>'],
    ['<div class="captionH3">Singapore</div>', '<div class="captionH3">' + T('Singapore') + '<span class="en-sub">Singapore</span></div>'],
    ['<div class="captionH3">Special Draws</div>', '<div class="captionH3">' + T('Special Draws') + '<span class="en-sub">Special Draws</span></div>'],
  ];
  for (const [a, b] of chrome) out = out.split(a).join(b);
  const n = archiveCount();
  if (n) out = out.replace(/Keputusan \d+ hari lepas/g, 'Keputusan ' + n + ' hari lepas');
  for (const [en, ms] of SHELL_MS) out = out.split(en).join(ms);
  return out;
}

/* ---------------- main inject ---------------- */

function inject(html, route, locale, override) {
  let out = String(html);
  const p = override || picks(route, locale) || picks('/', locale);
  if (!p) return out;
  out = out.replace(/<html lang="[^"]*"/, '<html lang="' + (locale === 'en' ? 'en-MY' : 'ms-MY') + '"');
  /* gtag immediately after <head> (Google's recommended position), once per page */
  out = out.replace(/<head>/, '<head>' + (gaTag() ? '\n' + gaTag() : ''));
  out = out.replace('</head>', '    ' + (i18nBootstrap(locale) ? i18nBootstrap(locale) + '\n    ' : '') + head(route, p, locale) + '\n</head>');
  /* h1 gets a small English mirror on the BM primary (English is the secondary) */
  const enH1 = locale === 'ms' ? ((p.enH1 || null) || (picks(route, 'en') || {}).h1 || null) : null;
  if (out.includes('</nav>')) out = out.replace('</nav>', '</nav>\n' + masthead(p, enH1));
  else out = out.replace('<body>', '<body>\n' + masthead(p, enH1));
  /* footer trust block before </body> */
  if (out.includes('</body>')) out = out.replace('</body>', trustLinks(locale) + '\n</body>');
  /* language switcher inside the navbar container */
  if (out.includes('nav-links')) {
    out = out.replace(/(<ul class="nav-links")/, '$1 lang-sw-host"');
    if (!out.includes('lang-sw-host')) {
      out = out.replace(/(<div class="nav-links">)/, '$1' + switcherLib(route, locale));
    }
    out = out.replace(' lang-sw-host"', '"');
  }
  out = localizeChrome(out, route, locale);
  out = out.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(p.title) + '</title>');
  if (/<meta name="description"/.test(out)) {
    out = out.replace(/<meta name="description" content="[\s\S]*?">/, '<meta name="description" content="' + esc(p.desc) + '">');
  } else {
    out = out.replace('<head>', '<head>\n<meta name="description" content="' + esc(p.desc) + '">');
  }
  return out;
}

/* ---------------- sitemaps ---------------- */

const XMLNS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const XHTML = 'http://www.w3.org/1999/xhtml';

/* bilingual entries carry hreflang alternates in-sitemap, so the en/ mirrors and the
   en/ date pages are discoverable by crawlers even before they follow page links */
function altLinks(msPath, enPath) {
  const m = SITE + msPath;
  const e = SITE + enPath;
  return '\n    <xhtml:link rel="alternate" hreflang="ms-MY" href="' + m + '"/>\n'
    + '    <xhtml:link rel="alternate" hreflang="en-MY" href="' + e + '"/>\n'
    + '    <xhtml:link rel="alternate" hreflang="x-default" href="' + m + '"/>';
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return '  <url>\n    <loc>' + SITE + loc + '</loc>\n    <lastmod>' + lastmod + '</lastmod>\n    <changefreq>' + changefreq + '</changefreq>\n    <priority>' + priority + '</priority>\n  </url>';
}

function bilingualEntry(msPath, enPath, lastmod, changefreq, priority) {
  return '  <url>\n    <loc>' + SITE + msPath + '</loc>\n    <lastmod>' + lastmod + '</lastmod>\n    <changefreq>' + changefreq + '</changefreq>\n    <priority>' + priority + '</priority>' + altLinks(msPath, enPath) + '\n  </url>';
}

/* keep the old function names used elsewhere in the site (smoke test) */
function sitemap() {
  const children = [['/sitemap-pages.xml', UPDATED, 'daily'], ['/sitemap-dates.xml', UPDATED, 'daily']];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="' + XMLNS + '">\n'
    + children.map(([l, lm, cf]) => '  <sitemap>\n    <loc>' + SITE + l + '</loc>\n    <lastmod>' + lm + '</lastmod>\n    <changefreq>' + cf + '</changefreq>\n  </sitemap>').join('\n')
    + '\n</sitemapindex>';
}

function sitemapPages() {
  const urls = [
    bilingualEntry('/', '/en/', UPDATED, 'daily', '1.0'),
    ...['/history.html', '/stats.html', '/predict.html', '/oracle.html', '/wow.html', '/journal.html', '/cara-main.html', '/toman.html']
      .map((r) => bilingualEntry(r, '/en' + r, UPDATED, 'daily', '0.7')),
    ...TRUSTED.map((r) => bilingualEntry(r, '/en' + r, UPDATED, 'monthly', '0.5')),
    bilingualEntry('/results/', '/en/results/', UPDATED, 'weekly', '0.8'),
  ];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="' + XMLNS + '" xmlns:xhtml="' + XHTML + '">\n' + urls.join('\n') + '\n</urlset>';
}

function sitemapDates() {
  let dates = null;
  try { dates = require('./datepage.js').listDates(); } catch { dates = []; }
  const fresh = new Date(); fresh.setDate(fresh.getDate() - 2);
  const freshISO = fresh.toISOString().slice(0, 10);
  const urls = dates.map((iso) => {
    const recent = iso >= freshISO;
    return bilingualEntry('/results/' + iso, '/en/results/' + iso, iso, recent ? 'daily' : 'yearly', recent ? '0.9' : '0.6');
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="' + XMLNS + '" xmlns:xhtml="' + XHTML + '">\n' + urls.join('\n') + '\n</urlset>';
}

function robots() {
  return ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', 'Sitemap: ' + SITE + '/sitemap.xml', ''].join('\n');
}

module.exports = { SITE, PAGES, inject, robots, sitemap, sitemapPages, sitemapDates, head, UPDATED, T: I18N.T, I18N, Lurl, picks, hreflang, lastmod };
