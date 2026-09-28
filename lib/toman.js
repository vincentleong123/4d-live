/* lib/toman.js — "Ikan Toman / Nombor Pada Sisik" — folklore + interactive scale viewer.
 * Folk practice: punters read 4D numbers off toman (giant snakehead) scales ("ikan merga").
 * Page is honest: framed as folklore/entertainment, no guarantee — but the scales on this
 * fish carry REAL winning numbers from the archive (each deep-links to /history.html).
 * IPC-safe: picking scales reads data/history files directly, cached 2 min.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const DATA = path.join(__dirname, '..', 'data', 'history');

const META = {
  ms: {
    title: 'Ikan Toman: Nombor Pada Sisik — Ramalan 4D Folklor',
    desc: 'Nombor pada sisik ikan toman (ikan merga) — kisah folklore pemancing yang lihat nombor 4D pada sisik toman, pemerhatian patah, dan interaktif: baca sendiri nombor-nombor pada setiap sisik ikan di bawah.',
    h1: 'Ikan Toman: Nombor Pada Sisik',
    sub: 'Dari jaringan kepercayaan pemancing dan "ikan merga" — lihat sendiri nombor pada sisik toman, dan tekan sisik mana-mana untuk semak sejarah asli.',
  },
  en: {
    title: 'Toman Fish: Numbers On The Scales — 4D Folklore',
    desc: 'Numbers on toman (giant snakehead) scales — the angler folklore is thought to have appeared on a toman\u2019s scales — and an interactive: read the numbers printed on each scale yourself.',
    h1: 'Toman Fish: Numbers on the Scales',
    sub: 'Angler folklore meets real data — every printed scale carries a real winning number; tap one to check its full history.',
  },
};

let cache = { at: 0, scales: [] };

/* collect recent winning 4D numbers (1st–3rd) from the archive */
function recenteScales(want) {
  if (cache.scales.length >= want && Date.now() - cache.at < 2 * 60 * 1000) return cache.scales.slice(0, want);
  const scales = [];
  const files = fs.readdirSync(DATA).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse().slice(0, 6);
  for (const f of files) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
      const iso = j.date || f.replace('.json', '');
      const groups = [j.west, j.east, j.sg];
      for (const g of groups) {
        for (const [op, d] of Object.entries(g || {})) {
          (d && Array.isArray(d.top) ? d.top : []).forEach((n, i) => {
            if (n && /^\d{4}$/.test(n) && scales.length < want) scales.push({ n, op, tier: i + 1, iso });
          });
        }
      }
    } catch { /* skip corrupt file */ }
  }
  cache = { at: Date.now(), scales };
  return scales;
}

const OPNAME = {
  magnum: 'Magnum', toto: 'SportsToto', damacai: 'DaMaCai', dragon: 'Grand Dragon',
  sandakan: 'Sandakan', sabah88: 'Sabah 88', cashsweep: 'CashSweep', sgpools: 'Singapore Pools',
};

function fishSvg(scales, locale) {
  const rows = [[], [], [], []];
  scales.forEach((s0, i) => rows[i % rows.length].push(s0));
  const rx = 74, ry = 34, gapX = 148, gapY = 42, x0 = 118, y0 = 96;
  let body = '';
  rows.forEach((row, r) => {
    row.forEach((s, c) => {
      const x = x0 + c * gapX + (r % 2 ? gapX / 2 : 0);
      const y = y0 + r * gapY;
      const href = '/history.html?operator=' + s.op + '&number=' + s.n;
      const tip = locale === 'en'
        ? `${s.n} — ${OPNAME[s.op]} ${s.tier}st prize win · ${s.iso}`
        : `${s.n} — ${OPNAME[s.op]} hadiah ${s.tier === 1 ? 'Pertama' : s.tier === 2 ? 'Kedua' : 'Ketiga'} · undian ${s.iso}`;
      body += `<a href="${href}" title="${esc(tip)}" aria-label="${esc(tip)}" class="scale-link">`
        + `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="scale"/>`
        + `<text x="${x}" y="${y + 5}" class="scale-num">${s.n}</text></a>`;
    });
  });
  const W = 118 * 2 + Math.max(...rows.map((r) => r.length)) * gapX;
  return `<svg viewBox="0 0 ${W} 330" class="toman-fish" role="img">
  <defs>
    <radialGradient id="fg" cx="35%" cy="30%"><stop offset="0%" stop-color="#6d5a3d"/><stop offset="100%" stop-color="#2f2818"/></radialGradient>
  </defs>
  <path d="M ${x0 - 92} 176 C ${x0 - 92} 108, ${x0 + 40} 54, ${W / 2 + 60} 54 C ${W - 22} 54, ${W + 40} 120, ${W + 40} 176 C ${W + 40} 250, ${W - 50} 300, ${W / 2 + 20} 300 C ${x0 + 6} 300, ${x0 - 92} 252, ${x0 - 92} 176 Z" fill="url(#fg)" stroke="#1c1810" stroke-width="3"/>
  <path d="M ${x0 - 92} 176 L ${x0 - 150} 118 L ${x0 - 122} 176 L ${x0 - 158} 240 Z" fill="#4b3d27" stroke="#1c1810" stroke-width="3"/>
  <path d="M ${W / 2 + 10} 58 C ${W / 2 + 70} 22, ${W / 2 + 130} 30, ${W - 40} 8 C ${W - 70} 52, ${W - 46} 60, ${W / 2 + 10} 58 Z" fill="#4b3d27" stroke="#1c1810" stroke-width="2.5"/>
  <path d="M ${W - 60} 296 C ${W - 40} 322, ${W - 100} 328, ${W - 116} 306 C ${W - 92} 296, ${W - 84} 294, ${W - 60} 296 Z" fill="#4b3d27" stroke="#1c1810" stroke-width="2.5"/>
  <circle cx="${x0 - 62}" cy="212" r="12" fill="#faf3dc" stroke="#1c1810" stroke-width="2"/>
  <circle cx="${x0 - 58}" cy="212" r="5" fill="#1c1810"/>
  <path d="M ${x0 - 30} ${186} q 26 14 50 2" stroke="#faf3dc" stroke-width="4" fill="none" stroke-linecap="round"/>
  <text x="${W / 2}" y="36" class="scale-hint">${esc(locale === 'ms' ? 'Sisik toman bermata sedap ini membawa nombor memang keluar (tekan untuk sejarah penuh)' : 'Every scale below carries a real recent winner (tap for its history)')}</text>
  ${body}
</svg>`;
}

function page(locale) {
  const ms = locale === 'ms';
  const M = META[locale];
  const scales = recenteScales(12);
  const featured = scales[0] || { n: '0000', op: 'magnum', tier: 1, iso: '' };
  const runM = scales.slice(0, 6).map((s0) => `${s0.n} (${OPNAME[s0.op]})`).join(' · ');
  const linksHm = 'https://www.hmetro.com.my/mutakhir/2026/02/1322740/toman-10-kg-tewas-di-tangan-halif';
  const linksK1 = 'https://www.kosmo.com.my/2021/10/23/asakan-toman-enam-jahanam-di-tasik-unisel/';
  const warn = ms
    ? 'Ingat: 4D undian sepenuhnya rawak. Nombor pada sisik, mimpi atau plate kereta ialah <strong>hiburan folklor</strong> — tiada siapa boleh ramal. Baru-baru ini sahaja anggota media lapor toman 95 cm / hampir 10 kg menjuarai <a href="https://www.hmetro.com.my/mutakhir/2026/02/1322740/toman-10-kg-tewas-di-tangan-halif" target="_blank" rel="noopener">Snakehead Master Championship</a>, tapi tiada kaedah boleh jamin nombor.'
    : 'Reminder: 4D draws are fully random. Numbers on scales, dreams or car plates are <strong>folklore entertainment</strong> — nobody can predict them. While anglers keep landing trophy tomans (a 95 cm / near-10 kg fish won the <a href="https://www.hmetro.com.my/mutakhir/2026/02/1322740/toman-10-kg-tewas-di-tangan-halif" target="_blank" rel="noopener">Snakehead Master Championship 2026</a>), no method guarantees numbers.';
  const story = ms
    ? `<p>Di kalangan pemancing dan peminat 4D, <strong>ikan toman</strong> (giant snakehead, "toman bata") adalah ikan mitosnya di Malaysia — jiwa & memori nombor tanggap. Ada yang membeli aneksis: ke berapa sebelum laporan media seperti <a href="${linksK1}" target="_blank" rel="noopener">Kosmo</a> dan <a href="${linksHm}" target="_blank" rel="noopener">Harian Metro</a> melaporkan buruan toman mega di tasik dan sungai.</p>
    <p>Cerita-b-ceritanya: pemancing membawa ikan sg dulu pulang, membela sisik bawah scales — sesetengah percaya melihat corak digit termasuk <b>4D</b>; betul-betul keluar pada undian seterusnya. Amalan ini se-kerja <b>ikan merga / ikat-merga</b> — ikan yang merebak di kampung apabila sisiknya dibaca dan berita tahniah dilaporkan. Tidak ada sumber rasmi; undian remain rawak. Namun nombor yang memupuk kebetulan undian — dah pernah:</p>
    <div class="how-note"><b>${ms ? 'Nombor memang keluar baru-baru ini' : 'Numbers that really came out recently'}:</b> ${esc(runM)}</div>`
    : `<p>Among Malaysian anglers and 4D players, the <strong>giant snakehead (toman)</strong> is the mythical fish: the belief that the scales of a caught toman display lucky digits — playing scales is local folklore. Recent trophy catches are well covered: reports like <a href="${linksK1}" target="_blank" rel="noopener">Kosmo</a> and <a href="${linksHm}" target="_blank" rel="noopener">Harian Metro</a>.</p>
    <p>The tale goes: an angler lands a big toman, a family member reads the overlapping scales, spots a pattern matching <b>4D numbers</b>, and the number really comes out in that night\u2019s draw — the so-called "ikan merga" story retold in every drawer. It\u2019s a taufan/remembrance; legal draws remain random. But the numbers these coincidences point at <em>did</em> come out — which we can prove from our own archive:</p>
    <div class="how-note"><b>Real recent winners:</b> ${esc(runM)}</div>`;
  const howRead = ms
    ? '<h3>Cara "baca" sisik di bawah</h3><p>Bergantung dari mana anda mula membaca — dari ekor, kepala atau tengah — order sisik memberi nombor berbeza; kekuatan penilaian patah anda sendiri. Di laman ini, setiap sisik dipaparkan nombor <strong>sebenar</strong> dari sejarah undian; tekan satu sisik untuk semak nombor itu melintasi sejarah penuh pasaran itu.</p>'
    : '<h3>How to "read" the scales below</h3><p>The fun part: start from the tail, the head or the middle — the order of the scales suggests different numbers. On this page every scale is stamped with a <strong>real</strong> winning number from our archive; tap any scale to check it across our permanent history.</p>';
  return `
  <section class="how-sec">
    <h2>${esc(M.h1)}</h2>
    <figure class="toman-hero">
      <img src="/ikan-toman-4ekor-4d-ramalan.jpg" alt="${esc(locale === 'ms' ? 'Empat ekor ikan toman yang ditangkap pemancing — siapa tahu nombor pada sisik mereka' : 'Four giant snakehead (toman) caught by anglers — maybe the numbers hide in their scales')}" width="1000" height="515" fetchpriority="high">
      <figcaption>${esc(locale === 'ms' ? 'Empat ekor toman tangkapan pemancing — 4 ekor dalam sekali pancing ("4 ekor", siapa tahu?). Nampak digit pada sisik mereka? Semak di bawah.' : 'Four tomans landed in one outing ("4 ekor"). Spot digits on their scales? Check them below.')}</figcaption>
    </figure>
    ${story}
    ${howRead}
    <div class="toman-fig">${fishSvg(scales, locale)}</div>
    <div class="toman-result">
      <p><b>${ms ? 'Sisik paling atas hari ini' : 'Today\u2019s head scale'}:</b> <a href="/history.html?operator=${featured.op}&number=${featured.n}" class="scale-chip">${featured.n}</a>
      ${ms ? `— ${OPNAME[featured.op]} hadiah ${featured.tier === 1 ? 'pertama' : 'teratas'}, undian ${featured.iso}.` : `— ${OPNAME[featured.op]} top-${featured.tier}, draw of ${featured.iso}.`}</p>
      <p class="how-note" style="margin:8px 0 0">${warn}</p>
    </div>
  </section>`;
}

/* homepage teaser (both locales): compact gold card linking to the page */
function teaser(locale) {
  const ms = locale === 'ms';
  return `
  <section id="toman-teaser" class="toman-teaser">
    <div class="toman-teaser-inner">
      <a href="${pth(locale)}/toman.html" class="toman-teaser-fig"><img src="/ikan-toman-scales.jpg" alt="${esc(ms ? 'Sisik ikan toman — corak sisik yang menyerupai digit nombor 4D' : 'Toman fish scales — scale patterns that resemble 4D digits')}" width="600" height="303" loading="lazy"></a>
      <div>
        <h3><a href="${pth(locale)}/toman.html">${esc(ms ? 'Ikan Toman: Nombor Pada Sisik' : 'Toman Fish: Numbers on the Scales')}</a></h3>
        <p>${esc(ms ? 'Tengok corak sisik toman dalam gambar ni — macam digit nombor, kan? Folklor pemancing: sisik yang seakan nombor 4D, dan nombor tu betul-betul keluar. Baca sendiri sisik demi sisik di laman penuh; setiap sisik ada nombor menang sebenar. (Hiburan sahaja.)' : 'Look at the scale patterns on this catch — don\u2019t they resemble digits? Angler folklore says numbers spotted on a toman\u2019s scales really came out. Read the full-size scales yourself; every one is a real past winner. (For entertainment only.)')}</p>
      </div>
    </div>
  </section>`;
}

function pth(locale) { return locale === 'en' ? '/en' : ''; }

/* inject the teaser into the home page HTML */
function injectTeaser(html, locale) {
  if (html.includes('id="toman-teaser"')) return html;
  const t = teaser(locale);
  if (html.includes('<section id="trend"')) return html.replace('<section id="trend"', t + '\n<section id="trend"');
  if (html.includes('</nav>')) return html.replace('</nav>', '</nav>\n' + t);
  return html;
}

module.exports = { META, page, teaser, injectTeaser, fishSvg };
