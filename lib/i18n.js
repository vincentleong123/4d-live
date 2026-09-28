/* lib/i18n.js — Bahasa Malaysia is the PRIMARY language; English lives at /en/.
 *
 * Keys are the English source strings (self-documenting), values are the BM text.
 * Used by seo.js / ssr.js / datepage.js on the server and injected into the page
 * as window.__L__ so the client renderer (app.js) can localise without a build step.
 */
'use strict';

/* long month / weekday names, BM first class-citizen, English second */
const MS = {
  months: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
  days: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'],
  shortMonths: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'],
  shortDays: ['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'],
};
const EN = {
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const ZH = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  shortMonths: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  shortDays: ['日', '一', '二', '三', '四', '五', '六'],
};

const CAL = { ms: MS, en: EN, zh: ZH };

/* ---- visible UI / label dictionary ---- */
const STRINGS = {
  /* nav + site chrome */
  'Results': 'Keputusan',
  'Archive': 'Keputusan Lepas',
  'History': 'Sejarah',
  'Stats Lab': 'Statistik',
  'Predict': 'Ramalan',
  'Oracle': 'Oracle',
  'Wow': 'Kebetulan',
  'Journal': 'Jurnal',
  'About': 'Tentang Kami',
  'Contact': 'Hubungi',
  'Responsible Play': 'Permainan Bertanggungjawab',
  'Privacy': 'Privasi',
  'Terms': 'Terma',
  'FAQ': 'Soalan Lazim',
  'Check your number:': 'Semak nombor anda:',
  'All': 'Semua',
  'West Malaysia': 'Malaysia Barat',
  'East Malaysia': 'Malaysia Timur',
  'Singapore': 'Singapura',
  'Special Draws': 'Undian Khas',
  'Grand Dragon 4D': 'Grand Dragon 4D',
  'Refresh': 'Segar semula',
  'lang': 'BM',
  'other-lang': 'EN',

  /* results table labels */
  '1st Prize': 'Hadiah Utama',
  '2nd Prize': 'Hadiah Kedua',
  '3rd Prize': 'Hadiah Ketiga',
  'Zodiac': 'Zodiak',
  'Consolation': 'Hadiah Selesa',
  'Draw No.': 'No. Undian',
  'Operator': 'Operator',
  'Jackpot': 'Jackpot',
  'Jackpot Estimated Amount': 'Anggaran Jackpot',
  '1+3D Jackpot Estimated Amount': 'Anggaran Jackpot 1+3D',
  '4D Jackpot Estimated Amount': 'Anggaran Jackpot 4D',
  '3+3D Jackpot Estimated Amount': 'Anggaran Jackpot 3+3D',
  'Jackpot Gold Estimated Amount': 'Anggaran Jackpot Gold',
  'Special': 'Khas',
  'Special ( RM 30 )': 'Khas ( RM 30 )',
  'Consolation ( RM 10 )': 'Selesa ( RM 10 )',
  'WINNING NUMBERS': 'NOMBOR MENANG',
  'JACKPOT GOLD NUMBERS': 'NOMBOR JACKPOT GOLD',
  'GOLDEN NUMBER': 'NOMBOR EMAS',
  'BONUS NUMBERS': 'NOMBOR BONUS',
  'SWEEP WINNING NUMBERS': 'NOMBOR MENANG SWEEP',
  'Prize Division': 'Bahagian Hadiah',
  'Prize Group': 'Kumpulan Hadiah',
  'Share Amount (Each)': 'Nilai Bahagian (Setiap)',
  'No. of Winning Shares': 'Bilangan Bahagian Menang',
  'Prize Group': 'Kumpulan Hadiah',
  'Prize': 'Hadiah',
  'Bonus': 'Bonus',
  'Lotto 6/45': 'Lotto 6/45',
  'Fireball 1st (RM 500)': 'Fireball Ke-1 (RM 500)',
  'Fireball 2nd (RM 200)': 'Fireball Ke-2 (RM 200)',
  'Fireball 3rd (RM 100)': 'Fireball Ke-3 (RM 100)',
  'Fireball Special (RM 30)': 'Fireball Khas (RM 30)',
  'Fireball Consolation (RM 10)': 'Fireball Selesa (RM 10)',
  'Next Special Draw:': 'Undian Khas seterusnya:',
  "in {n} day{n}": 'dalam {n} hari',
  'Tomorrow': 'Esok',
  'in {n} days': 'dalam {n} hari',

  /* new: repeat-visit / engagement block */
  'Trending Numbers': 'Nombor Sedang Popular',
  'Hot numbers (last 30 draws)': 'Nombor panas (30 undian terakhir)',
  'Cold numbers (rarest)': 'Nombor sejuk (paling jarang)',
  'Sum & digits': 'Jumlah & digit',
  'See full statistics': 'Lihat statistik penuh',
  'What the stats say today': 'Apa kata statistik',
  'opens 4d stats lab': 'bukak makmal statistik',

  /* home / SEO */
  'Live 4D results merged from': 'Keputusan 4D langsung digabung dari',
  'tables and logos follow the classic 4dmoon layout': 'jadual dan logo mengikut susunan klasik 4dmoon',
  'Updated': 'Dikemas kini',
  'Updated ': 'Dikemas kini ',
  'STALE ': 'SUSUT ',
  'Updated ': 'Dikemas kini ',
  'failed:': 'gagal:',
  'draw in progress': 'undian sedang berjalan',
  'results': 'keputusan',
  'Updated HH:MM:SS': 'Dikemas kini HH:MM:SS',
  'no match in latest results': 'tiada padanan dalam undian terkini',
  'Found in:': 'Dijumpai dalam:',

  /* history page */
  'Draw History Archive': 'Sejarah Undian 4D',
  'One year of curated draws': 'Setahun undian terpilih',
  'search number e.g. 1234': 'cari nombor e.g. 1234',
  'Search': 'Cari',
  'Date': 'Tarikh',
  'Load more': 'Muat lagi',
  'No draws found': 'Tiada undian dijumpai',
  'latest draws': 'undian terkini',
  'hit(s)': 'padan',

  /*SSR block (server-rendered result summary)*/
  'Latest 4D results': 'Keputusan 4D terkini',
  'showing last known results': 'memaparkan keputusan terkini',
  'Show 1st/2nd/3rd': 'Klik untuk butiran',
  'Full results for': 'Keputusan penuh untuk',
  "Browse the full results archive": 'Lihat semua keputusan lepas',
  'every archived draw date': 'setiap tarikh undian tersimpan',
  'draw history': 'sejarah undian',
  'number statistics': 'statistik nombor',
  'prediction tools': 'alat ramalan',
  'facts & news': 'kebetulan & berita',
  'my 4D journal': 'jurnal 4D saya',
  'Also drawn': 'Turut diundi',
  'Special draws': 'Undian khas',
  'Next special draw:': 'Undian khas seterusnya:',
  'And more': 'Dan lain-lain',
  'side games': 'permainan sampingan',
  'prize breakdowns load live below': 'jadual hadiah penuh diloday secara langsung di bawah',
  'Full result tables': 'Jadual keputusan penuh',

  /* result-date pages */
  '4D results for': 'Keputusan 4D untuk',
  'all archived draw dates': 'setiap tarikh undian tersimpan',
  'search any number': 'cari sebarang nombor',
  "today's live results": 'keputusan langsung hari ini',
  'archived draw dates': 'tarikh undian tersimpan',
  'No archived draws yet': 'Tiada undian tersimpan lagi',
  'Newest first': 'Terbaharu dahulu',
  'Draw Date': 'Tarikh Undian',
  'Draw Date': 'Tarikh Undian',
  'Winning numbers for one draw date': 'Nombor menang bagi satu tarikh undian',

  /* new trust pages */
  'Who is 4dmalaya?': 'Siapa 4dmalaya?',
  'Write to us': 'Tulis kepada kami',
  'Your email address': 'Alamat emel anda',
  'Subject': 'Perkara',
  'Message': 'Mesej',
  'Send message': 'Hantar mesej',
  'Why do we collect?': 'Kenapa kami mengumpul?',
  'What we never do': 'Apa yang tidak pernah kami lakukan',
  'Cookies used on this site': 'Kuki yang digunakan',
  'Statistics only': 'Statistik sahaja',
  'Why is 4D random?': 'Kenapa 4D rawak?',
  'Our community rules': 'Peraturan komuniti kami',
  'Self-exclusion': 'Larangan diri',
  'Where to get help': 'Di mana mendapatkan bantuan',
  'Important Stats': 'Statistik Penting',
  'Read more about responsible play': 'Baca lagi tentang permainan bertanggungjawab',
  '18+ only': 'Hanya 18+',
};


const ZH_STRINGS = {
  /* nav + site chrome */
  'Results': '开奖成绩',
  'Archive': '历史成绩',
  'History': '万字历史',
  'Stats Lab': '统计走势',
  'Predict': '万字预测',
  'Oracle': '玄学灵签',
  'Wow': '趣闻纪录',
  'Journal': '个人记录',
  'About': '关于我们',
  'Contact': '联络我们',
  'Responsible Play': '负责任博彩',
  'Privacy': '隐私政策',
  'Terms': '服务条款',
  'FAQ': '常见问题',
  'Check your number:': '输入您的万字号码：',
  'search number e.g. 1234': '搜索号码 例如 1234',
  'All': '全部',
  'West Malaysia': '西马',
  'East Malaysia': '东马',
  'Singapore': '新加坡',
  'Special Draws': '特别开奖',
  'Grand Dragon 4D': '豪龙 4D',
  'Refresh': '刷新',
  'lang': '中文',
  'other-lang': 'BM',

  /* results table labels */
  '1st Prize': '头奖',
  '2nd Prize': '二奖',
  '3rd Prize': '三奖',
  'Zodiac': '生肖',
  'Consolation': '安慰奖',
  'Draw No.': '期号',
  'Operator': '博彩公司',
  'Jackpot': '积宝',
  'Jackpot Estimated Amount': '积宝估计奖金',
  '1+3D Jackpot Estimated Amount': '1+3D 积宝估计奖金',
  '4D Jackpot Estimated Amount': '4D 积宝估计奖金',
  '3+3D Jackpot Estimated Amount': '3+3D 积宝估计奖金',
  'Jackpot Gold Estimated Amount': '黄金积宝估计奖金',
  'Special': '特别奖',
  'Special ( RM 30 )': '特别奖 ( RM 30 )',
  'Consolation ( RM 10 )': '安慰奖 ( RM 10 )',
  'WINNING NUMBERS': '中奖号码',
  'JACKPOT GOLD NUMBERS': '黄金积宝号码',
  'GOLDEN NUMBER': '金球号码',
  'BONUS NUMBERS': '特别号码',
  'SWEEP WINNING NUMBERS': '大彩中奖号码',
  'Prize Division': '奖项组别',
  'Prize Group': '奖金组别',
  'Share Amount (Each)': '每份奖金',
  'No. of Winning Shares': '中奖份数',
  'Prize': '奖金',
  'Bonus': '特别奖',
  'Lotto 6/45': '乐透 6/45',
  'Fireball 1st (RM 500)': '火球首奖 (RM 500)',
  'Fireball 2nd (RM 200)': '火球二奖 (RM 200)',
  'Fireball 3rd (RM 100)': '火球三奖 (RM 100)',
  'Fireball Special (RM 30)': '火球特别奖 (RM 30)',
  'Fireball Consolation (RM 10)': '火球安慰奖 (RM 10)',
  'Next Special Draw:': '下一期特别开奖：',
  'in {n} day{n}': '{n} 天后',
  'Tomorrow': '明天',
  'in {n} days': '{n} 天后',

  /* trend / repeat-visit */
  'Trending Numbers': '热门走势',
  'Hot numbers (last 30 draws)': '近期热门号码 (近30期)',
  'Cold numbers (rarest)': '冷门号码 (遗漏最久)',
  'Sum & digits': '和值与数字',
  'See full statistics': '查看完整统计',
  'What the stats say today': '今日数据看点',
  'opens 4d stats lab': '打开万字统计实验室',

  /* home / SEO */
  'Live 4D results merged from': '开奖成绩汇聚自',
  'tables and logos follow the classic 4dmoon layout': '版面采用经典4D开奖走势排版',
  'Updated': '更新时间',
  'Updated ': '更新时间 ',
  'STALE ': '缓存数据 ',
  'failed:': '失败：',
  'draw in progress': '现场开奖中',
  'results': '开奖成绩',
  'Updated HH:MM:SS': '更新时间 HH:MM:SS',
  'no match in latest results': '最新开奖中未发现此号码',
  'Found in:': '命中公司：',

  /* history page */
  'Draw History Archive': '万字开奖历史记录',
  'One year of curated draws': '过去一年完整开奖数据',
  'Search': '搜索',
  'Date': '日期',
  'Load more': '加载更多',
  'No draws found': '未找到相关开奖记录',
  'latest draws': '最新期数',
  'hit(s)': '次中奖',

  /* SSR block */
  'Latest 4D results': '最新万字开奖成绩',
  'showing last known results': '显示最近期开奖数据',
  'Show 1st/2nd/3rd': '点击查看详情',
  'Full results for': '完整成绩：',
  'Browse the full results archive': '浏览所有历史开奖存档',
  'every archived draw date': '历史开奖日期一览',
  'draw history': '开奖历史',
  'number statistics': '万字统计',
  'prediction tools': '预测工具',
  'facts & news': '趣闻与资讯',
  'my 4D journal': '我的万字日记',
  'Also drawn': '其他开奖游戏',
  'Special draws': '特别开奖',
  'Next special draw:': '下期特别开奖：',
  'And more': '及更多',
  'side games': '彩票与乐透',
  'prize breakdowns load live below': '现场开奖详情与奖金分配在下方实时加载',
  'Full result tables': '完整开奖成绩表',

  /* result-date pages */
  '4D results for': '4D万字开奖成绩：',
  'all archived draw dates': '所有历史开奖日期',
  'search any number': '搜索任意号码',
  "today's live results": '今日现场开奖成绩',
  'archived draw dates': '历史开奖期数',
  'No archived draws yet': '暂无开奖存档',
  'Newest first': '按最新排序',
  'Draw Date': '开奖日期',
  'Winning numbers for one draw date': '单期各博彩公司完整中奖号码',
  'Who is 4dmalaya?': '谁是 4dmalaya？',
  'Write to us': '给我们留言',
  'Your email address': '您的电子邮箱',
  'Subject': '主题',
  'Message': '内容',
  'Send message': '发送信息',
  'Why do we collect?': '为何收集数据？',
  'What we never do': '我们绝不从事的行为',
  'Cookies used on this site': '网站 Cookie 使用',
  'Statistics only': '仅限统计用途',
  'Why is 4D random?': '为什么4D是完全随机的？',
  'Our community rules': '社区守则',
  'Self-exclusion': '自我限制',
  'Where to get help': '寻求援助渠道',
  'Important Stats': '核心统计指标',
  'Read more about responsible play': '了解更多负责任博彩资讯',
  '18+ only': '仅限18岁以上',
};

const bm = STRINGS;
const en = {}; /* English is the source: every key is already English */

/* translation of long page copy (titles, descriptions, h1, sub) */
const PAGES = {
  '/': {
    zh: {
      "title": "马来西亚4D现场开奖成绩 — 万能、多多、大马彩、豪龙",
      "desc": "实时更新马来西亚与新加坡4D开奖结果：万能4D、多多、大马彩、豪龙4D、山打根、沙巴88、砂拉越CashSweep及新加坡博彩，附带走势图与号码核对。",
      "h1": "马来西亚4D现场开奖成绩",
      "sub": "万能4D、SportsToto多多、大马彩、豪龙、沙巴88、砂拉越及新加坡万字最新中奖号码。开奖即时现场同步，数据完整核实。"
    },
    en: {
      title: '4D Malaysia Live Results Today — Magnum, SportsToto, DaMaCai',
      desc: 'Live 4D results for Magnum, SportsToto, DaMaCai, Grand Dragon, Sandakan, Sabah 88, CashSweep and Singapore Pools, plus side games, history and a number checker.',
      h1: '4D Malaysia Live Results',
      sub: 'Magnum 4D, SportsToto 4D, DaMaCai, Grand Dragon 4D, Sandakan 4D, Sabah 88, Sarawak CashSweep and Singapore Pools 4D — live results, side games, history and a number checker, merged from 4d88.asia and 4dmoon.com.',
    },
    ms: {
      title: 'Hasil 4D Hari Ini Secara Langsung — Magnum, SportsToto, DaMaCai',
      desc: 'Hasil dan keputusan 4D langsung untuk Magnum, SportsToto, DaMaCai, Grand Dragon, Sandakan, Sabah 88, CashSweep dan Singapura, permainan sampingan, sejarah dan penyemak nombor.',
      h1: 'Keputusan 4D Malaysia Secara Langsung',
      sub: 'Nombor menang Magnum 4D, SportsToto 4D, DaMaCai, Grand Dragon 4D, Sandakan 4D, Sabah 88, CashSweep Sarawak dan Singapura 4D — keputusan langsung, permainan sampingan, sejarah dan penyemak nombor. Semak hasil 4D hari ini untuk semua operator, dikemas kini sebaik undian selesai. Sumber digabung dari 4d88.asia dan 4dmoon.com.',
    },
  },
  '/history.html': {
    zh: {
      "title": "4D开奖历史记录 — 过去一年开奖存档",
      "desc": "搜索与查询马来西亚各大4D博彩公司一年完整开奖记录：头奖、二奖、三奖、特别奖与安慰奖。",
      "h1": "4D开奖历史记录",
      "sub": "支持按日期、博彩公司与万字号码精确查询历史中奖记录。"
    },
    en: {
      title: '4D Results History — 1 Year Archive',
      desc: 'Search and browse 1 year of 4D draw results — top 3 winning numbers, special and consolation numbers for every Malaysian 4D operator, plus Singapore 4D.',
      h1: '4D Results History',
      sub: 'A searchable archive of 4D draw results: winning top 3 numbers, special and consolation numbers per operator, filterable by date and operator.',
    },
    ms: {
      title: 'Sejarah Keputusan 4D — Setahun',
      desc: 'Cari dan semak setahun keputusan 4D — nombor menang hadiah utama, kedua dan ketiga, nombor khas dan selesa setiap operator 4D Malaysia, termasuk Singapura.',
      h1: 'Sejarah Keputusan 4D',
      sub: 'Semak keputusan undian 4D: nombor menang utama, kedua dan ketiga, nombor khas dan selesa setiap operator, boleh tapis ikut tarikh dan operator.',
    },
  },
  '/stats.html': {
    zh: {
      "title": "4D万字统计走势 — 热门与冷门号码分析",
      "desc": "基于各大博彩公司开奖历史深度统计：冷热号码排行、遗漏期数、千百十个位数字分布与奇偶分析。",
      "h1": "4D万字统计走势",
      "sub": "深入剖析冷热号码、数字频率与出现规律，真实数据统计。"
    },
    en: {
      title: '4D Statistics Lab — Hot & Cold Numbers',
      desc: '4D number statistics from 165 draws per operator: hot and cold numbers, frequency heatmap, digit sum and odd/even breakdowns.',
      h1: '4D Statistics Lab',
      sub: 'Frequency, hot and cold numbers, digit-sum and odd/even analysis for every 4D operator, computed from the stored draw archive.',
    },
    ms: {
      title: 'Makmal Statistik 4D — Nombor Panas & Sejuk',
      desc: 'Statistik nombor 4D daripada 165 undian setiap operator: nombor panas dan sejuk, peta kekerapan, jumlah digit dan pecahan ganjil/genap.',
      h1: 'Makmal Statistik 4D',
      sub: 'Kekerapan, nombor panas dan sejuk, jumlah digit serta analisis ganjil/genap untuk setiap operator 4D, dikira dari keputusan undian tersimpan.',
    },
  },
  '/predict.html': {
    zh: {
      "title": "4D万字预测 — 8大分析模型与AI算法",
      "desc": "结合冷热统计、数字规律与AI Overwatch算法回测的4D号码推荐。仅供娱乐参考。",
      "h1": "4D万字预测模型",
      "sub": "融合历史回测数据与多维算法分析。纯属娱乐 — 万字开奖完全随机。"
    },
    en: {
      title: '4D Number Prediction — 8 Methods + AI Overwatch',
      desc: 'Generate 4D picks with 8 methods (hot, cold, numerology, cosmic, 432Hz, conspiracy, black magic, crystal ball) merged by a backtested AI Overwatch ensemble. Entertainment only.',
      h1: '4D Prediction Lab',
      sub: 'Eight prediction methods scored against real backtests and merged into an AI Overwatch consensus. Entertainment only — every 4D draw is random.',
    },
    ms: {
      title: 'Ramalan Nombor 4D — 8 Kaedah + AI Overwatch',
      desc: 'Jana nombor 4D dengan 8 kaedah (panas, sejuk, numerologi, kosmik, 432Hz, ilmu hitam, bola kristal) digabung oleh AI Overwatch yang diuji semula. Untuk hiburan sahaja.',
      h1: 'Makmal Ramalan 4D',
      sub: 'Lapan kaedah ramalan diperiksa terhadap ujian semula jadi dan digabung dalam konsensus AI Overwatch. Untuk hiburan sahaja — setiap undian 4D adalah rawak.',
    },
  },
  '/oracle.html': {
    zh: {
      "title": "4D玄学灵签 — 水晶球与幸运数字",
      "desc": "充满趣味的4D玄学与宇宙灵感数字生成。纯属娱乐，理性购彩。",
      "h1": "4D玄学灵签",
      "sub": "灵感探索与趣味开奖号码体验。纯属娱乐 — 开奖完全随机。"
    },
    en: {
      title: '4D Oracle — Crystal Ball, Black Magic & Cosmic Picks',
      desc: 'The 4D Oracle: crystal ball, black magic, cosmic rays, 432Hz resonance and numerology picks for Magnum, SportsToto, DaMaCai, Grand Dragon and more. Entertainment only.',
      h1: 'The 4D Oracle',
      sub: 'Crystal ball, black magic, cosmic rays and 432Hz resonance number picks. For entertainment only — 4D draws are random and cannot be forecast.',
    },
    ms: {
      title: 'Oracle 4D — Bola Kristal, Ilmu Hitam & Nombor Kosmik',
      desc: 'Oracle 4D: bola kristal, ilmu hitam, sinar kosmik, resonans 432Hz dan nombor numerologi untuk Magnum, SportsToto, DaMaCai, Grand Dragon dan banyak lagi. Untuk hiburan sahaja.',
      h1: 'Oracle 4D',
      sub: 'Pilihan nombor dari bola kristal, ilmu hitam, sinar kosmik dan resonans 432Hz. Untuk hiburan sahaja — undian 4D adalah rawak dan tidak boleh diramal.',
    },
  },
  '/wow.html': {
    zh: {
      "title": "4D趣闻纪录与大奖新闻",
      "desc": "搜罗马来西亚与新加坡万字趣闻、历史罕见连号纪录及官方中奖故事。",
      "h1": "4D趣闻与纪录",
      "sub": "真实有趣的开奖巧合、大奖新闻与开奖奇闻。"
    },
    en: {
      title: "4D Fun Facts, Ripley's Corner & Lottery News",
      desc: "Odd-but-true 4D statistics from Ripley's Believe It or Not, verified lottery facts, winner stories and the latest Malaysian lottery news.",
      h1: "4D Wow — Ripley's Corner",
      sub: "Odd-but-true 4D statistics, verified lottery facts, winner stories and Malaysian lottery news.",
    },
    ms: {
      title: 'Kebetulan 4D, Sudut Ripley & Berita Loteri',
      desc: 'Kebetulan 4D yang pelik tapi benar dari undian sebenar, kisah pemenang dan berita loteri Malaysia terkini.',
      h1: 'Wow 4D — Sudut Ripley',
      sub: 'Kebetulan 4D yang pelik tapi benar dari undian sebenar, kisah pemenang dan berita loteri Malaysia.',
    },
  },
  '/journal.html': {
    zh: {
      "title": "我的4D万字记录本",
      "desc": "私密记录您的心水号码与买字记录，自动对比当期真实开奖结果，核算奖金与命中率。",
      "h1": "我的4D万字记录本",
      "sub": "轻松记录号码，自动核对官方开奖成绩，盈亏奖金一目了然。"
    },
    en: {
      title: 'My 4D Journal',
      desc: 'A private 4D journal: save your numbers, bets and omens, then let it auto-check them against the real draw archive with RM prizes, hit rate and profit.',
      h1: 'My 4D Journal',
      sub: 'Save your numbers, bet type, amount and the omen behind them. Entries are checked automatically against the real draw archive with RM prize payouts.',
    },
    ms: {
      title: 'Jurnal 4D Saya',
      desc: 'Jurnal 4D peribadi: simpan nombor, wager anda dan tanda-tanda, biar ia semak sendiri terhadap sejarah undian sebenar dengan hadiah RM, kadar hitung dan untung.',
      h1: 'Jurnal 4D Saya',
      sub: 'Simpan nombor, jenis wager, jumlah dan omen di sebaliknya. Setiap catatan disemak automatik terhadap sejarah undian sebenar dengan payout hadiah RM.',
    },
  },
  /* archive hub */
  '/results-archive/': {
    zh: {
      "title": "4D历史开奖总汇 — 按日期浏览",
      "desc": "完整收录每一期马来西亚与新加坡4D开奖结果，轻松回溯任何一天的官方成绩。",
      "h1": "4D历史开奖总汇",
      "sub": "按开奖日期归档的所有历史开奖成绩。"
    },
    en: { title: '4D Results Archive', desc: 'Every archived 4D draw date, side by side.', h1: '4D Results Archive', sub: 'Every archived draw date.' },
    ms: { title: 'Keputusan Lepas 4D — Semua Hasil Mengikut Tarikh', desc: 'Semua hasil 4D mengikut tarikh untuk setiap operator: Magnum, SportsToto, DaMaCai, Grand Dragon, Sandakan, Sabah 88, CashSweep dan Singapura Pools.', h1: 'Keputusan Lepas 4D', sub: 'Setiap tarikh undian tersimpan.' },
  },
};

/* new trust/policy pages — BM is the primary, English is the /en/ mirror */
const TRUST_PAGES = {
  '/tentang.html': {
    zh: {
      "title": "关于 4D Malaya — 独立万字开奖平台",
      "desc": "4D Malaya 是独立的马来西亚与新加坡4D开奖信息汇总平台，非博彩运营商，不销售号码。",
      "h1": "关于 4D Malaya"
    },
    title: 'Siapa 4dmalaya — Tentang Kami',
    desc: '4dmalaya adalah enjin keputusan 4D bebas: menggabung feed 4d88.asia dan 4dmoon.com, dengan sejarah untuk setahun, statistik dan alat peribadi.',
    h1: 'Siapa 4dmalaya?',
    en: {
      title: 'About 4dmalaya',
      desc: '4dmalaya is a 4D results engine that merges the 4d88.asia and 4dmoon.com feeds with 1-year history, statistics and a private journal.',
      h1: 'Who is 4dmalaya?',
    },
  },
  '/hubungi.html': {
    zh: {
      "title": "联络我们 — 4D Malaya",
      "desc": "有任何数据更正、意见建议或合作咨询？欢迎联络 4D Malaya 团队。",
      "h1": "联络我们"
    },
    title: 'Hubungi 4dmalaya',
    desc: 'Ada pertanyaan, pembetulan data, atau pertanyaan media? Hubungi pasukan 4dmalaya — kami membaca setiap mesej.',
    h1: 'Hubungi Kami',
    en: { title: 'Contact 4dmalaya', desc: 'Have a question, data correction, or a media enquiry? Contact the 4dmalaya team.', h1: 'Contact Us' },
  },
  '/privasi.html': {
    zh: {
      "title": "隐私政策 — 4D Malaya",
      "desc": "4D Malaya 隐私政策：保障您的隐私安全，不收集或出售个人信息。",
      "h1": "隐私政策"
    },
    title: 'Polisi Privasi 4dmalaya',
    desc: 'Dasar privasi penuh: data yang disimpan, kuki, analitik, hak GDPR dan cara anda boleh memadam data anda.',
    h1: 'Polisi Privasi',
    en: { title: 'Privacy Policy 4dmalaya', desc: 'Full privacy policy: what data we store, cookies, analytics, and how you can delete your data.', h1: 'Privacy Policy' },
  },
  '/terma.html': {
    zh: {
      "title": "服务条款 — 4D Malaya",
      "desc": "4D Malaya 网站使用条款与免责声明。",
      "h1": "服务条款"
    },
    title: 'Terma Perkhidmatan 4dmalaya',
    desc: 'Terma penggunaan 4dmalaya — hak penggunaan, liputan tidak tepat, liabiliti, dan larangan buru wang.',
    h1: 'Terma Perkhidmatan',
    en: { title: 'Terms of Service 4dmalaya', desc: 'Terms of use for 4dmalaya, covering accuracy, liability, and responsible play.', h1: 'Terms of Service' },
  },
  '/tanggungjawab.html': {
    zh: {
      "title": "负责任博彩 — 4D Malaya",
      "desc": "理性购彩指南：仅限18岁以上成人，博彩纯属娱乐，切勿沉迷。",
      "h1": "负责任博彩"
    },
    title: 'Permainan Bertanggungjawab — 4dmalaya',
    desc: 'Bantuan perjudian 18+ di Malaysia: larangan diri, nasihat kewangan, siapa untuk hubungi bila ia menjadi masalah.',
    h1: 'Permainan Bertanggungjawab',
    en: { title: 'Responsible Play — 4dmalaya', desc: '18+ gambling help in Malaysia: self-exclusion, financial advice, and who to call.', h1: 'Responsible Play' },
  },
};

/* merge: STRINGS are used for corpus copy, PAGES for the head, TRUST_PAGES single-lang */
const T = (s, lang) => {
  if (!s) return '';
  if (lang === 'zh') return Object.prototype.hasOwnProperty.call(ZH_STRINGS, s) ? ZH_STRINGS[s] : s;
  if (lang !== 'ms') return s;               /* english pass-through */
  return Object.prototype.hasOwnProperty.call(bm, s) ? bm[s] : s; /* BM or English fallback */
};

module.exports = { CAL, STRINGS, ZH_STRINGS, PAGES, TRUST_PAGES, T, L: 'ms' };
