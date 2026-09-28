/* lib/seo.js — minimalist SEO: per-page meta, Open Graph/WhatsApp card, Twitter,
 * canonical, JSON-LD, H1 + crawlable summary, robots.txt, sitemap.xml.
 * Injected at serve time so every page stays in sync without a build step.
 */
'use strict';

const SITE = 'https://4dmalaya.com';
const OG = '/og.png';
const UPDATED = process.env.SEO_UPDATED || new Date().toISOString().slice(0, 10);

const PAGES = {
  '/': {
    title: '4D Malaysia Live Results Today — Magnum, SportsToto, DaMaCai',
    desc: 'Live 4D results for Magnum, SportsToto, DaMaCai, Grand Dragon, Sandakan, Sabah 88, CashSweep and Singapore Pools, plus side games, history and a number checker.',
    h1: '4D Malaysia Live Results',
    sub: 'Magnum 4D, SportsToto 4D, DaMaCai, Grand Dragon 4D, Sandakan 4D, Sabah 88, Sarawak CashSweep and Singapore Pools 4D — live results, side games, history and a number checker, merged from 4d88.asia and 4dmoon.com.',
  },
  '/history.html': {
    title: '4D Results History — 1 Year Archive | 4D Malaysia Live',
    desc: 'Search and browse 1 year of 4D draw results — top 3 winning numbers, special and consolation numbers for every Malaysian 4D operator, plus Singapore 4D.',
    h1: '4D Results History',
    sub: 'A searchable archive of 4D draw results: winning top 3 numbers, special and consolation numbers per operator, filterable by date and operator.',
  },
  '/stats.html': {
    title: '4D Statistics Lab — Hot & Cold Numbers | 4D Malaysia Live',
    desc: '4D number statistics from 165 draws per operator: hot and cold numbers, frequency heatmap, digit sum and odd/even breakdowns, plus mined Ripley facts.',
    h1: '4D Statistics Lab',
    sub: 'Frequency, hot and cold numbers, digit-sum and odd/even analysis for every 4D operator, computed from the stored draw archive.',
  },
  '/predict.html': {
    title: '4D Number Prediction — 8 Methods + AI Overwatch',
    desc: 'Generate 4D picks with 8 methods (hot, cold, numerology, cosmic, 432Hz, conspiracy, black magic, crystal ball) merged by a backtested AI Overwatch ensemble.',
    h1: '4D Prediction Lab',
    sub: 'Eight prediction methods scored against real backtests and merged into an AI Overwatch consensus. Entertainment only — every 4D draw is random.',
  },
  '/oracle.html': {
    title: '4D Oracle — Crystal Ball, Black Magic & Cosmic Picks',
    desc: 'The 4D Oracle: crystal ball, black magic, cosmic rays, 432Hz resonance and numerology picks for Magnum, SportsToto, DaMaCai, Grand Dragon and more.',
    h1: 'The 4D Oracle',
    sub: 'Crystal ball, black magic, cosmic rays and 432Hz resonance number picks. For entertainment only — 4D draws are random and cannot be forecast.',
  },
  '/wow.html': {
    title: '4D Fun Facts, Ripley\'s Corner & Lottery News',
    desc: 'Odd-but-true 4D statistics from Ripley\'s Believe It or Not, verified lottery facts, winner stories and the latest Malaysian lottery news.',
    h1: "4D Wow — Ripley's Corner",
    sub: 'Odd-but-true 4D statistics, verified lottery facts, winner stories and Malaysian lottery news.',
  },
  '/journal.html': {
    title: 'My 4D Journal — Track Numbers, Bets & Results',
    desc: 'A private 4D journal: save your numbers, bets and omens, then let it auto-check them against the real draw archive with RM prizes, hit rate and net profit.',
    h1: 'My 4D Journal',
    sub: 'Save your numbers, bet type, amount and the omen behind them. Entries are checked automatically against the real draw archive with RM prize payouts, hit rate, ROI and net profit.',
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function jsonLd(route, p) {
  const url = SITE + route;
  const graph = [
    {
      '@type': 'WebSite',
      '@id': SITE + '/#website',
      url: SITE + '/',
      name: '4D Malaysia Live',
      inLanguage: 'en-MY',
      publisher: { '@id': SITE + '/#org' },
    },
    {
      '@type': 'Organization',
      '@id': SITE + '/#org',
      name: '4D Malaysia Live',
      url: SITE + '/',
      description: 'Live Malaysian 4D results, history, statistics and entertainment prediction tools.',
    },
    {
      '@type': 'WebPage',
      '@id': url + '#webpage',
      url,
      name: p.title,
      description: p.desc,
      isPartOf: { '@id': SITE + '/#website' },
      about: { '@id': SITE + '/#website' },
      inLanguage: 'en-MY',
      dateModified: UPDATED,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '4D Malaysia Live', item: SITE + '/' },
        ...(route === '/' ? [] : [{ '@type': 'ListItem', position: 2, name: p.h1, item: url }]),
      ],
    },
  ];
  if (route === '/') {
    graph.push({
      '@type': 'ItemList',
      '@id': SITE + '/#draws',
      name: '4D draws covered',
      itemListElement: [
        'Magnum 4D', 'SportsToto 4D', 'DaMaCai 1+3D', 'Grand Dragon 4D',
        'Sandakan 4D', 'Sabah 88 4D', 'Sarawak CashSweep', 'Singapore Pools 4D',
      ].map((n, i) => ({ '@type': 'ListItem', position: i + 1, name: n })),
    });
  }
  return '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) + '</script>';
}

function head(route, p) {
  const url = SITE + route;
  return [
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">',
    '<link rel="canonical" href="' + url + '">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<meta name="theme-color" content="#55472d">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<meta property="og:site_name" content="4D Malaysia Live">',
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="en_MY">',
    '<meta property="og:title" content="' + esc(p.title) + '">',
    '<meta property="og:description" content="' + esc(p.desc) + '">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:image" content="' + SITE + OG + '">',
    '<meta property="og:image:secure_url" content="' + SITE + OG + '">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="4D Malaysia Live — live 4D results for Magnum, SportsToto, DaMaCai, Grand Dragon and more">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + esc(p.title) + '">',
    '<meta name="twitter:description" content="' + esc(p.desc) + '">',
    '<meta name="twitter:image" content="' + SITE + OG + '">',
    jsonLd(route, p),
  ].join('\n    ');
}

/* H1 + crawlable summary, injected as the first block below the fixed navbar */
function masthead(p) {
  return '<div class="seo-mast"><div class="container"><h1>' + esc(p.h1) + '</h1><p>' + esc(p.sub) + '</p></div></div>';
}

function inject(html, route) {
  const p = PAGES[route] || PAGES['/'];
  let out = html
    .replace('<html lang="en">', '<html lang="en-MY">')
    .replace('</head>', '    ' + head(route, p) + '\n</head>');
  /* place after the fixed navbar so nothing hides behind it */
  if (out.includes('</nav>')) out = out.replace('</nav>', '</nav>\n' + masthead(p));
  else out = out.replace('<body>', '<body>\n' + masthead(p));
  /* single source of truth for title/description */
  out = out.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(p.title) + '</title>');
  if (/<meta name="description"/.test(out)) {
    out = out.replace(/<meta name="description" content="[\s\S]*?">/, '<meta name="description" content="' + esc(p.desc) + '">');
  } else {
    out = out.replace('<head>', '<head>\n<meta name="description" content="' + esc(p.desc) + '">');
  }
  return out;
}

function robots() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    'Sitemap: ' + SITE + '/sitemap.xml',
    '',
  ].join('\n');
}

function sitemap() {
  const urls = Object.keys(PAGES).map((r) =>
    '  <url>\n    <loc>' + SITE + r + '</loc>\n    <lastmod>' + UPDATED + '</lastmod>\n    <changefreq>' + (r === '/' ? '5' : 'daily') + '</changefreq>\n    <priority>' + (r === '/' ? '1.0' : '0.7') + '</priority>\n  </url>'
  ).join('\n');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>';
}

module.exports = { SITE, OG, PAGES, inject, robots, sitemap, head, UPDATED };
