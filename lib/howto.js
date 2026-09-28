/* lib/howto.js — "Cara Main" (How to Play) guide.
 *
 * One comprehensive page (/cara-main.html) with a per-game anchor section.
 * Every result card links to its own section via app.js's HOWTO map.
 * Real search demand points at this page ("cara main magnum 4d", "cara beli
 * toto", "cara main 4d"), and the FAQ block emits FAQPage JSON-LD so it is
 * eligible for People-Also-Ask. Kept honest: we never imply we sell bets.
 */
'use strict';

const I18N = require('./i18n.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const META = {
  ms: {
    title: 'Cara Main 4D Malaysia — Panduan Penuh Setiap Pasaran',
    desc: 'Panduan cara main 4D untuk pemula: Magnum, SportsToto, DaMaCai, Grand Dragon, Sabah, CashSweep dan Singapura — beli di mana, kos, jenis taruhan Big/Small, dan masa undian.',
    h1: 'Cara Main 4D — Panduan Lengkap',
    sub: 'Semua yang perlukan untuk kali pertama: ke mana pembelian, bagaimana taruhan Big/Small/box berfungsi, apa maksud Hadiah Khas & Selesa, kos dan masa undian setiap pasaran.',
  },
  en: {
    title: 'How to Play 4D Malaysia — Complete Guide for Every Market',
    desc: 'Beginner-friendly guide to playing Malaysian 4D: Magnum, SportsToto, DaMaCai, Grand Dragon, Sabah, CashSweep and Singapore — where to buy, costs, Big/Small bets and draw times.',
    h1: 'How to Play 4D — The Complete Guide',
    sub: 'Everything for a first timer: where to buy, how Big/Small/box bets work, what Special & Consolation prizes mean, costs and draw times for every market.',
  },
};

/* shared fragments, per locale */
const F = {
  ms: {
    buy: 'Beli di <strong>kaunter darat rasmi</strong> operator (gerai/servis berlesen) atau di mesin layan diri. Beberapa pasaran jual dalam talian melalui situs rasmi mereka sahaja — jangan guna situs/agen tidak berlesen.',
    odds: 'Realistik: peluang satu nombor 4-digit untuk keluar dalam satu undian ialah lebih kurang <strong>23 dalam 10,000</strong> (23 nombor ditambah). Jadi nombor yang lama tidak keluar tidak "hari ini mesti keluar" — setiap undian adalah rawak.',
    big: 'Big RM1 — menang lebih banyak kategori (23 nombor termasuk Khas & Selesa) tapi hadiah atas lebih rendah.',
    small: 'Small RM1 — hanya 3 hadiah atas tetapi nilainya lebih tinggi.',
    cost4d: 'RM1 sepatutnya untuk setiap nombor-straight (Big / Small), RM6 sepasang "RM1 Big + RM1 Small" x',
  },
  en: {
    buy: 'Buy at the operator\u2019s <strong>licensed physical outlet</strong> or self-service terminal. Some markets also sell online via their official site only — never via unlicensed agents.',
    odds: 'Realistically: a single 4-digit number has about a <strong>23 in 10,000</strong> chance to appear in one draw (23 numbers are drawn). A number that keeps missing is not "due" — every draw is random.',
    big: 'Big RM1 — wins more categories (all 23 drawn numbers) but lower top prizes.',
    small: 'Small RM1 — only the top 3 prizes but noticeably higher payouts.',
    cost4d: 'RM1 straight on Big and RM1 on Small; box / iPerm pricing follows the number of combinations.',
  },
};

/* "Where to buy / how to pay" — the full walkthrough section (BM primary, EN mirror) */
const BUY = {
  ms: {
    toc: 'Di Mana Beli & Cara Bayar',
    title: 'Di Mana Beli & Cara Bayar — Langkah Demi Langkah',
    intro: 'Ada tiga cara orang cuba beli 4D: <strong>gerai fizikal berlesen</strong>, "dalam talian", dan penataruhan gelap (bookie). Di Malaysia hanya cara pertama yang sah dan selamat. Inilah langkah sebenar — dari cari gerai sampai terima hadiah.',
    t1: '1 · Gerai fizikal berlesen (satu-satunya cara sah)',
    p1: 'Gerai Magnum, Sports Toto dan DaMaCai ada di hampir setiap bandar (Sabah 88 / Sandakan di Sabah, CashSweep di Sarawak, Grand Dragon melalui gerai harian sendiri). Gerai berlesen memaparkan papan tanda operator dan nombor lesen. Cara cari: Google Maps ("Magnum 4D" / "Sports Toto" / "DaMaCai" + nama kawasan) atau senarai gerai di laman web rasmi operator. Sesetengah gerai ada mesin layan diri.',
    st: 'Langkah di kaunter — contoh: nombor 2581, Big, RM1',
    steps: [
      'Datang pada hari undian (Magnum/Sports Toto/DaMaCai: Rabu, Sabtu, Ahad — pasaran lain ikut jadual mereka). Jualan tutup sebelum undian malam; tanya juruwang waktu potong (cut-off) hari itu.',
      'Ambil borang kosong (slip taruhan) di kaunter, atau guna mesin layan diri.',
      'Tulis nombor anda — satu digit satu kotak (2 · 5 · 8 · 1). Tak nak pilih sendiri? Minta nombor rawak (Quick Pick / Lucky Pick).',
      'Tanda jenis taruhan: <b>Big</b>, <b>Small</b> atau kedua-duanya; untuk semua susunan digit pilih <b>iBox / i-Perm</b>.',
      'Beri slip kepada juruwang dan <b>nyatakan jumlah</b>: "satu Big, satu Small, RM1 setiap satu". Minimum biasanya RM1 se-nombor.',
      '<b>Bayar tunai di kaunter semasa beli</b> — tiada konsep "bayar kemudian". Sesetengah gerai mungkin terima e-dompet; tanya dulu.',
      'Tiket tercetak: <b>semak sebelum tinggal kaunter</b> — nombor, Big/Small, nombor & tarikh undian, jumlah.',
      '<b>Simpan tiket.</b> Ia bukti satu-satunya untuk menuntut hadiah — hilang atau koyak bermakna hilang hak.',
    ],
    pay: 'Peraturan emas: <strong>wang hanya berubah tangan di kaunter berlesen</strong>. Jika seseorang menyuruh anda transfer dulu, "bayar lepas menang", atau menawarkan kredit — itu bukan gerai berlesen.',
    t2: '2 · "Dalam talian"?',
    p2: 'Magnum, Sports Toto dan DaMaCai <strong>tiada jualan dalam talian yang rasmi di Malaysia</strong>. Laman web, aplikasi, WhatsApp atau Telegram yang mendakwa boleh "beli untuk anda" ialah orang tengah tidak berlesen — nombor dimainkan tanpa tiket sah dan tiada siapa melindungi anda jika berlaku pertikaian. Satu-satunya taruhan dalam talian yang sah di rantau ini: <strong>Singapore Pools</strong>, untuk penduduk Singapura dengan akaun + pengesahan umur sahaja.',
    t3: '3 · Bookie haram (penataruhan gelap)',
    p3: 'Bookie mengambil taruhan tanpa lesen — biasanya secara kredit, panggilan atau mesej, kadang dengan tawaran "rebat". Ia <strong>haram</strong> (Akta Pertaruhan 1953). Tiada tiket, tiada rekod, tiada perlindungan: taruhan tidak sah di sisi undang-undang, pemenang besar sering tidak dibayar penuh, dan mudah terjebak hutang. Pendek kata: <strong>jangan guna bookie</strong> — gerai berlesen sahaja.',
    t4: '4 · Jika menang — di mana terima wang',
    p4: 'Hadiah biasa (cth. RM60–RM2,500): tunai di <strong>mana-mana gerai operator yang sama</strong> — bawa tiket sah (dan IC untuk hadiah lebih besar). Hadiah besar/jackpot: tuntut di <strong>pejabat pusat operator</strong>. Tempoh sah tuntutan ditetapkan operator (selalunya 90–180 hari — semak belakang tiket); tuntut secepat mungkin. Keputusan tersiar di 4dmalaya pada malam undian; setiap halaman tarikh kekal selama-lamanya.',
  },
  en: {
    toc: 'Where to Buy & How to Pay',
    title: 'Where to Buy & How to Pay — Step by Step',
    intro: 'There are three ways people try to buy 4D: <strong>licensed physical outlets</strong>, "online", and underground bookies. In Malaysia only the first is legal and safe. Here is the real-world walk-through, from finding an outlet to collecting a prize.',
    t1: '1 · Licensed physical outlets (the only legal way)',
    p1: 'Magnum, Sports Toto and DaMaCai (PMP-licensed) outlets cover nearly every town in Peninsular Malaysia; Sabah 88 / Sandakan in Sabah, CashSweep in Sarawak, Grand Dragon through its own daily outlets. A licensed outlet displays the operator brand and licence number. To find one: Google Maps ("Magnum 4D" / "Sports Toto" / "DaMaCai" + your area) or the outlet locator on each operator\u2019s official site. Some also have self-service terminals.',
    st: 'At the counter — example: number 2581, Big, RM1',
    steps: [
      'Go on a draw day (Magnum/Sports Toto/DaMaCai: Wednesday, Saturday, Sunday — other markets follow their own schedules). Sales close before the night draw; ask the counter for that day\u2019s cut-off time.',
      'Take a blank bet slip at the counter, or use the self-service terminal if there is one.',
      'Write your number — one digit per box (2 · 5 · 8 · 1). Don\u2019t want to choose? Ask for a random number (Quick Pick / Lucky Pick).',
      'Mark the bet type: <b>Big</b>, <b>Small</b> or both; for every digit arrangement pick <b>iBox / i-Perm</b>.',
      'Hand the slip to the cashier and <b>state the amount</b> ("one Big, one Small, RM1 each"). Minimum is usually RM1 per number.',
      '<b>Pay cash at the counter when buying</b> — there is no "pay later". Some outlets may accept e-wallets; ask first.',
      'The ticket prints: <b>check it before you leave</b> — number, Big/Small, draw number & date, stake.',
      '<b>Keep the ticket.</b> It is the only proof to claim a prize — lost or torn means no claim.',
    ],
    pay: 'Golden rule: <strong>money changes hands only at the licensed counter</strong>. Anyone asking you to transfer first, "pay after you win", or offering credit is not a licensed outlet.',
    t2: '2 · "Online"?',
    p2: 'Magnum, Sports Toto and DaMaCai have <strong>no official online sales in Malaysia</strong>. Websites, apps, WhatsApp or Telegram accounts claiming to buy for you are unlicensed middlemen — your number is played without a valid ticket and nobody protects you in a dispute. The only legitimate online betting in this region: <strong>Singapore Pools</strong>, for Singapore residents with an account + age verification only.',
    t3: '3 · Illegal bookies',
    p3: 'Bookies take bets without a licence — usually on credit, by phone or message, sometimes with "rebates". It is <strong>illegal</strong> (Betting Act 1953). No ticket, no record, no protection: the bet is not legally enforceable, big winners often go unpaid, and debt spirals easily. In short: <strong>don\u2019t use bookies</strong>. Licensed outlets with a ticket in hand only.',
    t4: '4 · If you win — where you get paid',
    p4: 'Standard prizes (e.g. RM60–RM2,500): cash at <strong>any outlet of the same operator</strong> — bring the valid ticket (plus ID for larger prizes). Jackpots/large prizes: claim at the <strong>operator\u2019s head office</strong>. Claim windows are set per operator (usually 90–180 days — check the back of the ticket); claim as soon as possible. Results go live on 4dmalaya on draw night; every date page is archived permanently.',
  },
};

function buyBlock(locale) {
  const b = BUY[locale];
  return `
  <section id="di-mana-beli" class="how-sec">
    <h2>${esc(b.title)}</h2>
    <p style="line-height:1.7;color:#3d3428;font-size:14.5px;margin:0 0 6px">${b.intro}</p>
    <dl class="how-dl">
      <dt>${b.t1}</dt><dd>${b.p1}
        <div class="how-extra" style="margin-top:8px"><b>${b.st}</b>
          <ol class="how-steps">${b.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        </div>
        <div class="how-note" style="margin:8px 0 0">${b.pay}</div>
      </dd>
      <dt>${b.t2}</dt><dd>${b.p2}</dd>
      <dt>${b.t3}</dt><dd>${b.p3}</dd>
      <dt>${b.t4}</dt><dd>${b.p4}</dd>
    </dl>
  </section>`;
}

/* per-game sections */
const GAMES = [
  {
    anchor: 'magnum-4d', id: 'magnum',
    name: { ms: 'Magnum 4D', en: 'Magnum 4D' },
    apa: { ms: 'Pasar 4D paling lama di Malaysia — pilih satu nombor 4 digit 0000–9999.', en: "Malaysia's longest-running 4D market — you pick one 4-digit number from 0000 to 9999." },
    cara: { ms: 'Pilih nombor di kaunter (atau Quick Pick biar mesin pilih). Pilih <b>Big</b>, <b>Small</b>, atau kedua-duanya. Ada juga <b>M-Box</b> (susun semula digit) dan <b>iPerm</b>.', en: 'Pick your number at the counter (or let the terminal Quick Pick it). Choose <b>Big</b>, <b>Small</b>, or both. <b>M-Box</b> (any digit order) and <b>iPerm</b> are also available.' },
    jadual: { ms: 'Setiap <b>Rabu, Sabtu dan Ahad</b>, termasuk undian khas', en: 'Draws every <b>Wednesday, Saturday and Sunday</b>, plus special draws.' },
    extras: { ms: 'Magnum turut ada <b>4D Jackpot Gold</b> (6 digit digabung 2 nombor 4D) dan <b>Magnum Life</b> (8 nombor + 2 bonus). Lihat cariMain bahagian masing-masing.', en: 'Magnum also runs <b>4D Jackpot Gold</b> (6 digits from a pair of 4D numbers) and <b>Magnum Life</b> (8 numbers + 2 bonus). Each is covered in its own section below.' },
  },
  {
    anchor: 'sports-toto-4d', id: 'toto',
    name: { ms: 'SportsToto 4D', en: 'SportsToto 4D' },
    apa: { ms: 'Operator 4D terbesar di Malaysia, keluarga Toto result; nombor disokong oleh zodiak.', en: "One of Malaysia's largest 4D operators; the 4D game pairs with a zodiac sign." },
    cara: { ms: 'Sama macam Magnum: pilih nombor 4 digit, pilih Big dan/atau Small. Toto juga cantum <b>Zodiak</b> pada keputusan — jika nombor anda menang, hadiah boleh naik ikut zodiak warisan.', en: 'Same as Magnum: pick a 4-digit number, then Big and/or Small. Toto also publishes a <b>zodiac</b> with the draw — a winning number can earn extra via the zodiac.' },
    jadual: { ms: 'Rabu, Sabtu, Ahad + undian khas', en: 'Wednesday, Saturday, Sunday + special draws.' },
    extras: { ms: 'Toto keluarga besar: <b>4D Zodiak</b>, <b>Fireball</b>, <b>5D</b>, <b>6D</b>, <b>Star/Power/Supreme Toto</b>. Rujuk bahagian masing-masing.', en: 'The Toto family: 4D, Zodiac 4D, Fireball, 5D, 6D, and the Star/Power/Supreme Toto lotteries.' },
  },
  {
    anchor: 'damacai-4d', id: 'damacai',
    name: { ms: 'DaMaCai 1+3D', en: 'DaMaCai 1+3D' },
    apa: { ms: 'Pasar 4D klasik dengan tambahan permainan <b>1+3D</b> dan <b>3+3D</b>.', en: 'A classic 4D market that also runs <b>1+3D</b> and <b>3+3D</b>.' },
    cara: { ms: 'Untuk 1+3D: nombor 4-digit anda automatik jadi tiket 1+3D — hadiahnya digabung. Boleh juga beli nombor 3+3D berasingan.', en: 'For 1+3D: your 4D number automatically enters the 1+3D prize pool too. The 3+3D game uses pairs and must be bought separately.' },
    jadual: { ms: 'Rabu, Sabtu, Ahad + undian khas', en: 'Wednesday, Saturday, Sunday + special draws.' },
  },
  {
    anchor: 'grand-dragon-4d', id: 'dragon',
    name: { ms: 'Grand Dragon 4D', en: 'Grand Dragon 4D' },
    apa: { ms: 'Pasaran 4D harian — satu undian hampir setiap hari.', en: 'A daily 4D market — a draw almost every day.' },
    cara: { ms: 'Format 4D standard: pilih nombor 4 digit, Big / Small / box.', en: 'Standard 4D format: pick a 4-digit number, Big / Small / box.' },
    jadual: { ms: '<b>Setiap hari</b> — jadi nombor macam itu disemak sendiri untuk undian setiap hari', en: '<b>Daily</b> — a fresh draw every day.' },
  },
  {
    anchor: 'sandakan-4d', id: 'sandakan',
    name: { ms: 'Sandakan 4D', en: 'Sandakan 4D' },
    apa: { ms: 'Pasaran Timur Malaysia (Sabah).', en: 'An East Malaysia (Sabah) market.' },
    cara: { ms: '4D standard: satu nombor 4 digit, Big / Small / box.', en: 'Standard 4D: one 4-digit number, Big / Small / box.' },
    jadual: { ms: 'Jadual berbeza daripada pasaran Barat — semak di laman rasmi Sandakan untuk hari undian terkini.', en: 'Draw days differ from the West Malaysian markets — check the official Sandakan site for the current schedule.' },
  },
  {
    anchor: 'sabah-88-4d', id: 'sabah88',
    name: { ms: 'Sabah 88 4D', en: 'Sabah 88 4D' },
    apa: { ms: 'Operator 4D Sabah dengan susunan nombor asli & jackpot berasingan.', en: 'Sabah\u2019s 4D operator, with its own prize schedule and jackpots.' },
    cara: { ms: '4D standard + permainan tambahan: <b>3D</b>, <b>Sabah Lotto</b>, <b>L6 / L5</b> series.', en: 'Standard 4D plus extra games: <b>3D</b>, <b>Sabah Lotto</b>, and the <b>L6 / L5</b> series.' },
    jadual: { ms: 'Bertukar ikut pasaran; semak di laman rasmi.', en: 'Varies by market — check the official site.' },
  },
  {
    anchor: 'cashsweep-4d', id: 'cashsweep',
    name: { ms: 'Sarawak CashSweep', en: 'Sarawak CashSweep' },
    apa: { ms: 'Operator 4D Sarawak dengan nombor sweep klasik.', en: "Sarawak's 4D operator with its classic sweep number." },
    cara: { ms: 'Sama: pilih nombor 4 digit. CashSweep juga ada <b>Gold4D Sweep</b> (4 digit + sweep) dan <b>3D</b>.', en: 'Same 4D flow. CashSweep also runs <b>Gold4D Sweep</b> (4 digits + a sweep) and a <b>3D</b> market.' },
    jadual: { ms: 'Undian kebiasaannya Rabu, Sabtu, Ahad; semak di laman rasmi untuk hari yang tepat.', en: 'Typically Wednesday, Saturday, Sunday — confirm with the official site.' },
  },
  {
    anchor: 'singapore-4d', id: 'sgpools',
    name: { ms: 'Singapore 4D (Pools)', en: 'Singapore 4D (Pools)' },
    apa: { ms: 'Pasar 4D Singapura — format menyamai 4D Malaysia, dengan hadiah kumpulan berasingan.', en: "Singapore's 4D — very close in format, with its own prize groups." },
    cara: { ms: 'Pilih nombor 4 digit dan jenis Taruhan; boleh beli di kaunter Singapore Pools atau <b>dalam talian secara rasmi</b> melalui situs / aplikasi Singapore Pools (perlu akaun, sah umur).', en: 'Pick a 4-digit number and bet type; buy at a Singapore Pools outlet or <b>officially online</b> via the Singapore Pools site or app (account + age verification required).' },
    jadual: { ms: 'Rabu, Sabtu, Ahad', en: 'Wednesday, Saturday, Sunday.' },
  },
  {
    anchor: 'toto-fireball', id: 'fireball',
    name: { ms: 'SportsToto Fireball', en: 'SportsToto Fireball' },
    apa: { ms: 'Variasi 4D di mana berlawan nombor anda dengan <b>1 digit "Fireball"</b> — 5 nombor pinjaman bagi setiap hadiah.', en: 'A 4D variant where your number is matched through one <b>"Fireball" digit</b> — 5 borrowed numbers per prize.' },
    cara: { ms: 'Pilih nombor 4-digit + digit Fireball 0–9 + kategori. Jika Fireball hari itu 6, nombor 9069 6 9 menyala: 9069 jadi 9069/6069/9669/9069/9066 — 5 kombinasi direkod atas tiket.', en: 'Pick your 4-digit number, a Fireball digit 0–9, and the category. If that draw\u2019s Fireball is 6, 9069 spawns 9069/6069/9669/9069/9066 — 5 recorded combinations.' },
    jadual: { ms: 'Undian sama dengan SportsToto (Rabu/Sabtu/Ahad).', en: 'Same draws as SportsToto (Wednesday/Saturday/Sunday).' },
  },
  {
    anchor: 'toto-5d', id: 'toto5d',
    name: { ms: 'SportsToto 5D', en: 'SportsToto 5D' },
    apa: { ms: 'Nombor 5-digit, menang ikut kedudukan digit (1st hingga 6th Prize).', en: 'A 5-digit number; prizes pay per digit position (1st through 6th).' },
    cara: { ms: 'Pilih nombor 5-digit atau biar Quick Pick; menang mengikut padanan digit dari belakang. Setiap kedudukan ditetapkan hadiah berasingan.', en: 'Pick a 5-digit number (or Quick Pick). Winning follows digit matches from the back, with a separate prize per position.' },
    jadual: { ms: 'Rabu, Sabtu, Ahad (bersama 4D Toto).', en: 'Wednesday, Saturday, Sunday, alongside Toto 4D.' },
  },
  {
    anchor: 'toto-6d', id: 'toto6d',
    name: { ms: 'SportsToto 6D', en: 'SportsToto 6D' },
    apa: { ms: 'Nombor 6-digit — padankan dari belakang, makin panjang makin besar hadiah.', en: 'A 6-digit number — matches from the back; the longer the match, the bigger the prize.' },
    cara: { ms: 'Pilih nombor 6-digit. Menang bila sejumlah digit belakang bertepatan dengan nombor menang.', en: 'Pick a 6-digit number. You win when the trailing digits match the drawn number.' },
    jadual: { ms: 'Rabu, Sabtu, Ahad (bersama 4D Toto).', en: 'Wednesday, Saturday, Sunday (same as Toto 4D).' },
  },
  {
    anchor: 'toto-lotto', id: 'lotto',
    name: { ms: 'Star / Power / Supreme Toto', en: 'Star / Power / Supreme Toto' },
    apa: { ms: '3 permainan nombor berundi (6 dari 50 / 55 / 58) — nombor diperoleh dari bola diundi, bukan 4 digit.', en: 'Three 6-number lotteries (from 50 / 55 / 58) — numbers are balls drawn from a drum, not 4 digits.' },
    cara: { ms: 'Pilih 6 nombor (atau Quick Pick). Jackpot untuk padanan penuh; hadiah rendah untuk 3–5 nombor + extra.', en: 'Choose 6 numbers (or Quick Pick). The jackpot needs all 6; lower matches of 3–5 + the extra number also pay.' },
    jadual: { ms: 'Rabu, Sabtu, Ahad (bersama 4D Toto).', en: 'Wednesday, Saturday, Sunday (same as Toto 4D).' },
  },
  {
    anchor: 'magnum-jackpot-gold', id: 'mgold',
    name: { ms: 'Magnum 4D Jackpot Gold', en: 'Magnum 4D Jackpot Gold' },
    apa: { ms: 'Guna 6 digit — 2 pasangan 4 digit; menang besar bila kedua-dua kumpulan nombor bertepatan.', en: 'Uses 6 digits made of two 4D pairs; the jackpot needs both pairs to hit.' },
    cara: { ms: 'Sistem pilih 2 pasangan nombor 4-digit; keputusan Gold menunjukkan 6 digit + nombor GOLD. Jika kedua bahagian menang, jackpot lebih besar.', en: 'You select a pair of 4D numbers; keys reward the pair plus a GOLD number for an extra prize group.' },
    jadual: { ms: 'Sama dengan Magnum 4D.', en: 'Same draws as Magnum 4D.' },
  },
  {
    anchor: 'magnum-life', id: 'life',
    name: { ms: 'Magnum Life', en: 'Magnum Life' },
    apa: { ms: 'Permainan 8 nombor + 2 nombor bonus dengan hadiah yang boleh diwarisi (setahun, atau "RM1000×tahun").', en: 'An 8-number game with 2 bonus numbers where jackpots can pay annually for life.' },
    cara: { ms: 'Pilih atau Quick Pick 8 nombor (1–40). Bonus 2 nombor diundi bersama. Hadiah Formula / Divisyen ada dalam senarai Pools.', en: 'Pick (or Quick Pick) 8 numbers plus 2 bonus numbers. Prize tiers depend on how many of the 9 ball results (8 + 2 bonus) your set matches.' },
    jadual: { ms: 'Undian langsung bersama Magnum 4D (Rabu/Sabtu/Ahad).', en: 'Draws with Magnum 4D (Wednesday/Saturday/Sunday).' },
  },
  {
    anchor: 'damacai-3-3d', id: 'dmc33',
    name: { ms: 'DaMaCai 3+3D', en: 'DaMaCai 3+3D' },
    apa: { ms: '6 digit (2 nombor 3 digit) - menang dengan kemunculan 6-digit.', en: '6 digits made of two 3-digit numbers; the draw shows 3 winning numbers.' },
    cara: { ms: 'Pilih 6 digit di kaunter; hadiah memerlukan padanan berturutan. Juga ada versi <b>1 + 3D</b> bila nombor 4-digit lawan 3 digit.', en: 'Pick your 6 digits. There is also the <b>1+3D</b> variant where a 4-digit entry pairs with the 3-digit draw.' },
    jadual: { ms: 'Rabu, Sabtu, Ahad.', en: 'Wednesday, Saturday, Sunday.' },
  },
  {
    anchor: 'sabah-3d', id: 'sabah3d',
    name: { ms: 'Sabah 3D & CashSweep 3D', en: 'Sabah 3D & CashSweep 3D' },
    apa: { ms: 'Nombor 3-digit dari kedua-dua pasaran Timur.', en: 'The 3-digit games of both East Malaysian markets.' },
    cara: { ms: 'Pilih nombor 3 digit; hadiah 1st/2nd/3rd menurut undian masing-masing pasaran.', en: 'Pick a 3-digit number; 1st/2nd/3rd prizes are set per market.' },
    jadual: { ms: 'Ikut jadual Sabah 88 / CashSweep.', en: 'Follows Sabah 88 / CashSweep schedules.' },
  },
  {
    anchor: 'sabah-lotto', id: 'sabahLotto',
    name: { ms: 'Sabah Lotto & L6/L5', en: 'Sabah Lotto & L6/L5' },
    apa: { ms: 'Lotto 6 nombor (6/45) + series <b>L6 / L5</b> (pilih nombor 5 atau 4 digit dengan siri huruf A/B).', en: 'A 6-number lottery plus the <b>L6 / L5</b> lettered series (A/B numbers per draw).' },
    cara: { ms: 'Lotto: pilih 6 nombor + extra. L6/L5: pilih nombor dan siri huruf; setiap hadiah dinyatakan per siri.', en: 'Lotto: choose 6 numbers + match the extra. L6/L5: pick your numbers per lettered series; each pays on its own prize table.' },
    jadual: { ms: 'Ikut jadual Sabah 88.', en: 'Follows the Sabah 88 schedule.' },
  },
  {
    anchor: 'singapore-toto', id: 'sgToto',
    name: { ms: 'Singapore Toto', en: 'Singapore Toto' },
    apa: { ms: 'Pilih 6 nombor dari 1–49 + nombor tambahan, 7 kumpulan hadiah.', en: 'Pick 6 numbers from 1–49 plus an additional number; 7 prize groups.' },
    cara: { ms: 'Beli di kaunter atau secara rasmi dalam talian melalui Singapore Pools. Hadiah penuh bila 6 nombor + tambahan tepat. Semua 7 bahagian dipaparkan di keputusan kami.', en: 'Buy at an outlet or officially online via Singapore Pools. The jackpot needs all 6 + the additional number; we publish the complete 7-division table each draw.' },
    jadual: { ms: 'Isnin dan Khamis (Toto), keputusan kami juga termasuk Toto张力 terbaharu.', en: 'Monday and Thursday draws.' },
  },
  {
    anchor: 'special-draws', id: 'sp',
    name: { ms: 'Undian Khas', en: 'Special Draws' },
    apa: { ms: 'Undian tambahan di atas jadual biasa — biasanya pada cuti besar (CNY, Merdeka, Tahun Baru).', en: 'Extra draws beyond the weekly schedule — usually tied to Chinese New Year, Merdeka, Christmas etc.' },
    cara: { ms: 'Main macam 4D biasa danikah di kaunter yang sama; kami senaraikan <b>Undian Khas seterusnya</b> di laman utama bila ada.', en: 'Played exactly like the normal 4D, through the same outlets. We announce the <b>next special draw</b> on the home page when one is scheduled.' },
    jadual: { ms: 'Iklan oleh operator, biasanya beberapa minggu lebih awal.', en: 'Announced by each operator, usually a few weeks ahead.' },
  },
];

/* FAQ (People-Also-Ask material) */
const FAQ = {
  ms: [
    { q: 'Cara main 4D untuk pemula?', a: 'Pilih satu nombor 4 digit (0000–9999), pergi ke kaunter operator rasmi seperti Magnum, SportsToto atau DaMaCai, beritahu jenis taruhan (Big, Small, atau kedua-duanya) dan jumlah kupon. Tiket tercetak — tersimpan baik sampai undian selesai. Peluang menang top-1 ialah 1 dalam 10,000.' },
    { q: 'Berapa kos satu taruhan 4D?', a: 'RM1 untuk satu nombor straight (Big atau Small). Box dan iPerm kos ikut bilangan kombinasi. Nilai hadiah standard: Hadiah pertama RM2,500 (Big) atau RM3,500 (Small) untuk setiap RM1.' },
    { q: 'Apa perbezaan Big dan Small?', a: 'Big menang jika nombor anda dalam mana-mana 23 nombor yang ditarik (utama, kedua, ketiga, Khas, Selesa) — hadiah atas lebih rendah. Small hanya menang pada 3 hadiah atas tetapi nilainya lebih tinggi.' },
    { q: 'Apa itu Hadiah Khas dan Selesa?', a: 'Selain 3 hadiah atas (1st/2nd/3rd), operator juga menarik 10 nombor Khas (RM180 setiap RM1 Big) dan 10 nombor Selesa (RM60 setiap RM1 Big).' },
    { q: 'Boleh main 4D dalam talian di Malaysia?', a: 'Tidak secara rasmi. Magnum, SportsToto dan DaMaCai menjual tiket di kaunter darat berlesen sahaja. Singapura Pools menyediaka akaun dalam talian rasmi kepada penduduk Singapura. Jangan gunakan situs atau agen tidak berlesen — duit boleh hilang tanpa perlindungan.' },
    { q: 'Bila masa undian 4D Malaysia?', a: 'Magnum, SportsToto dan DaMaCai mengundi setiap Rabu, Sabtu dan Ahad, plus undian khas sempena cuti. Keputusan di 4dmalaya kekal tersimpan pada URL kekal bagi setiap tarikh.' },
    { q: 'Adakah statistik atau ramalan daripada situs ini boleh menjamin menang?', a: 'Tidak — dan siapa pun yang menjanjikan nombor terjamin adalah penipu. 4D sepenuhnya rawak. Alat ramalan di sini hanyalah hiburan, dan setiap halaman memakai disclaimer "untuk hiburan sahaja".' },
    { q: 'Berapa umur minimum untuk main 4D?', a: '18 tahun ke atas. Bermain bertanggungjawab — tetapkan bajet, jangan kejar kekalahan, dan jangan guna duit pinjaman. Panduan penuh di halaman permainan bertanggungjawab kami.' },
  ],
  en: [
    { q: 'How does a beginner play 4D?', a: 'Pick one 4-digit number from 0000 to 9999, go to a licensed operator outlet (Magnum, SportsToto or DaMaCai), tell the counter the bet type (Big, Small or both) and how many RM1 units. The ticket prints; keep it until the draw. Your number has a 1-in-10,000 shot at 1st prize.' },
    { q: 'How much does one 4D bet cost?', a: 'RM1 per straight number on Big and RM1 per straight number on Small; box and iPerm pricing follows the number of combinations. Standard prizes: RM2,500 for 1st (Big) or RM3,500 for 1st (Small) per RM1.' },
    { q: 'What is the difference between Big and Small?', a: 'Big wins if your number appears anywhere in the 23 drawn numbers (1st/2nd/3rd/Special/Consolation) at lower rates. Small only pays the top 3 prizes but pays them much higher.' },
    { q: 'What are Special and Consolation prizes?', a: 'Beyond the top 3, each draw also draws 10 Special numbers (RM180 per RM1 Big) and 10 Consolation numbers (RM60 per RM1 Big).' },
    { q: 'Can I play 4D online in Malaysia?', a: 'Not officially. Magnum, SportsToto and DaMaCai sell only through licensed physical outlets. Singapore Pools offers legitimate online account betting for Singapore residents. Avoid unlicensed agents or websites — losses there have zero protection.' },
    { q: 'When are Malaysian 4D draws held?', a: 'Magnum, SportsToto and DaMaCai draw every Wednesday, Saturday and Sunday, plus special public-holiday draws. Every 4dmalaya date page archives the exact numbers permanently.' },
    { q: "Can this site's statistics or predictions guarantee a win?", a: 'No — and anyone who promises guaranteed numbers is a scammer. 4D is fully random. Our prediction tools are entertainment features marked "for entertainment only".' },
    { q: 'What is the minimum age to play 4D?', a: '18 and above. Play responsibly: set a budget first, never chase losses, never borrow to bet. See our responsible play page for help resources.' },
  ],
};

/* ---------- page builder ---------- */

function page(locale) {
  const ms = locale === 'ms';
  const M = META[locale];
  const f = F[locale];
  const T = (s) => I18N.T(s, locale);
  const label = (k) => ({
    apa: ms ? 'Apa itu' : 'What it is',
    cara: ms ? 'Cara main' : 'How to play',
    kos: ms ? 'Kos & hadiah' : 'Costs & prizes',
    jadual: ms ? 'Jadual undian' : 'Draw schedule',
    extras: ms ? 'Permainan lain dalam keluarga ini' : 'Other games in this family',
  }[k]);
  const back = ms ? '← Ke atas' : '← Back to top';

  const toc = `<a class="how-toc" href="#di-mana-beli">${BUY[locale].toc}</a>` + GAMES.map((g) => `<a class="how-toc" href="#${g.anchor}">${esc(g.name[locale])}</a>`).join('');
  const sections = GAMES.map((g) => `
    <section id="${g.anchor}" class="how-sec">
      <h2>${esc(g.name[locale])}</h2>
      <dl class="how-dl">
        <dt>${label('apa')}</dt><dd>${g.apa[locale]}</dd>
        <dt>${label('cara')}</dt><dd>${g.cara[locale]}</dd>
        <dt>${label('kos')}</dt><dd>${f.big} ${f.small}${g.extras ? `<div class="how-extra">${g.extras[locale]}</div>` : ''}</dd>
        <dt>${label('jadual')}</dt><dd>${g.jadual[locale]}</dd>
      </dl>
      <a class="how-back" href="/cara-main.html">${back}</a>
    </section>`).join('\n');

  const faq = FAQ[locale].map((q) => `<div class="faq"><h3>${esc(q.q)}</h3><div>${q.a}</div></div>`).join('\n');
  const odds = `<div class="how-note">${f.odds}</div>`;

  return `${buyBlock(locale)}\n${odds}\n<nav class="how-toc-bar">${toc}</nav>\n${sections}\n${faq}`;
}

/* FAQPage JSON-LD so the guide is eligible for rich results */
function faqLd(locale) {
  const graph = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ[locale].map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: { '@type': 'Answer', text: q.a },
    })),
  };
  return '<script type="application/ld+json">' + JSON.stringify(graph) + '</script>';
}

module.exports = { META, GAMES, FAQ, BUY, page, faqLd, buyBlock };
