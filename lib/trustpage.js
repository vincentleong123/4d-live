/* lib/trustpage.js — real, hand-written trust pages in Bahasa Malaysia
 * (primary) with English mirrors at /en/: about, contact, privacy, terms,
 * responsible-play, FAQ.
 */
'use strict';

const I18N = require('./i18n.js');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sec = (h2, body) => '<section class="tp-sec"><h2>' + h2 + '</h2>' + body + '</section>';
const box = (title, body, cls) => '<div class="tp-box ' + (cls || '') + '"><h3>' + esc(title) + '</h3>' + body + '</div>';

function tentang(locale) {
  const en = locale === 'en';
  return sec(en ? 'Who is 4dmalaya?' : 'Siapa 4dmalaya?', `
    <p><strong>4dmalaya</strong> ${en ? 'is an independent 4D results engine — a portal that aggregates results' : 'ialah enjin keputusan 4D bebas — portal yang mengagregat keputusan'} ${en ? 'for Malaysian and Singapore Pools 4D draws.' : 'untuk undian 4D Malaysia dan Singapura Pools.'}</p>
    <p>${en ? 'We are' : 'Kami'} <strong>${en ? 'not a licensed betting operator' : 'bukan pengendali pertaruhan berlesen'}</strong>. ${en ? 'We do not accept bets, collect money from players, or sell numbers.' : 'Kami tidak menerima pertaruhan, tidak mengumpul duit pemain, dan tidak menjual nombor.'} ${en ? 'We merge publicly available results feeds from third parties and display them in one place, in your language.' : 'Kami menggabung feed keputusan awam daripada pihak ketiga dan memaparkannya di satu tempat, dalam bahasa anda.'}</p>`)

    + box(en ? 'Data sources' : 'Sumber data kami', `
      <ul>
        <li><strong>4d88.asia</strong> — ${en ? 'live results feed for all Malaysian 4D operators' : 'feed keputusan langsung untuk semua operator 4D Malaysia'}</li>
        <li><strong>4dmoon.com</strong> — ${en ? 'alternative feed for West/East Malaysia and Singapore Pools' : 'feed alternatif untuk Malaysia Barat/Timur dan Singapura Pools'}</li>
      </ul>
      <p>${en ? 'We fetch both feeds, merge slot-by-slot, and prefer the source with the more complete data. Every result page carries the draw number so you can double-check on the official site.' : 'Kami tarik kedua-dua feed, gabung slot demi slot, dan pilih sumber yang lebih lengkap. Setiap halaman keputusan menyebut no. undian supaya anda boleh semak semula di laman rasmi.'}</p>`)
    + box(en ? 'How we keep it accurate' : 'Bagaimana kami jaga ketepatan', `
      <ul>
        <li>${en ? 'Every draw date has a permanent URL' : 'Setiap tarikh undian mempunyai URL kekal'} <code>/results/2026-09-27</code> — ${en ? 'the numbers never change once stored.' : 'nombor tidak diubah selepas disimpan.'}</li>
        <li>${en ? 'Side game numbers (5D, 6D, Jackpot Gold, Fireball, Magnum Life) are stored separately, so one incomplete feed can never silently blank another game.' : 'Nombor permainan sampingan (5D, 6D, Jackpot Gold, Fireball, Magnum Life) disimpan berasingan, jadi satu feed yang tidak lengkap tidak boleh menghilangkan game lain secara senyap.'}</li>
      </ul>
      <p class="tp-note"><em>${en ? 'If a result here ever disagrees with the official operator&#39;s own page, trust the operator and tell us — we correct it the same day.' : 'Jika keputusan di sini pernah bercanggah dengan laman rasmi operator, percayakan laman rasmi dan beritahu kami — kami betulkan dalam hari yang sama.'} <a href="/hubungi.html">${en ? 'Contact' : 'Hubungi'}</a></em></p>`)
    + sec(en ? 'What we do NOT do' : 'Apa yang TIDAK kami buat', `
      <ul>
        <li>${en ? 'We do not sell winning numbers or "guaranteed" tips' : 'Kami tidak menjual nombor menang atau "tip terjamin"'}</li>
        <li>${en ? 'We do not take money from players' : 'Kami tidak menerima duit pemain'}</li>
        <li>${en ? 'We do not sell your data' : 'Kami tidak menjual data anda'} — <a href="/privasi.html">${en ? 'privacy policy' : 'polisi privasi'}</a></li>
        <li>${en ? 'We are not affiliated with Magnum, SportsToto, DaMaCai, Singapore Pools, or any operator' : 'Kami tidak berafiliasi dengan Magnum, SportsToto, DaMaCai, Singapura Pools, atau mana-mana operator'}</li>
      </ul>
      <p><strong>4D ${en ? 'is entertainment' : 'adalah hiburan'}</strong>. ${en ? 'Every operator draw is fully random.' : 'Setiap undian operator sepenuhnya rawak.'} <a href="/tanggungjawab.html"><strong>${en ? 'Responsible play guidance' : 'Panduan permainan bertanggungjawab'}</strong></a></p>`);
}

function hubungi(locale) {
  const en = locale === 'en';
  return sec(en ? 'Contact Us' : 'Hubungi Kami', `
    <p>${en ? 'Found a wrong result? Want a feature? Anything at all — we read every message, and we reply.' : 'Jumpa keputusan yang salah? Ada fungsi yang anda mahu? Apa-apa sahaja — kami baca setiap mesej, dan kami balas.'}</p>
    <p><strong>${en ? 'Fastest' : 'Paling cepat'}</strong>: <a href="mailto:mychocorabbit@gmail.com?subject=4dmalaya%20feedback">mychocorabbit@gmail.com</a></p>`)

    + box(en ? 'Or send a message here' : 'Atau hantar mesej di sini', `
      <form method="post" action="/api/contact" class="tp-form">
        <label for="cName">${en ? 'Your name' : 'Nama anda'}</label>
        <input id="cName" name="name" type="text" maxlength="120" required>
        <label for="cEmail">${en ? 'Your email' : 'Emel anda'}</label>
        <input id="cEmail" name="email" type="email" maxlength="160" required>
        <label for="cMsg">${en ? 'Message' : 'Mesej anda'}</label>
        <textarea id="cMsg" name="message" rows="5" maxlength="4000" required></textarea>
        <button class="btn-go" type="submit">${en ? 'Send message' : 'Hantar'}</button>
        <p id="cOut" class="tp-out" role="status" aria-live="polite"></p>
      </form>
      <p class="tp-mini">${en ? 'No account needed. We never show your email publicly.' : 'Tiada akaun diperlukan. Emel anda tidak disiarkan.'}</p>`, 'tp-contact')
    + box(en ? 'Typical response time' : 'Masa balas biasa', `
      <ul>
        <li>${en ? 'Result correction: same day' : 'Pembetulan keputusan: hari yang sama'}</li>
        <li>${en ? 'Feature request: within 48 h' : 'Permintaan fungsi: dalam 48 jam'}</li>
        <li>${en ? 'Anything else: usually within 1 working day' : 'Lain-lain: biasanya dalam 1 hari kerja'}</li>
      </ul>`);
}

function privasi(locale) {
  const en = locale === 'en';
  return sec(en ? 'Privacy Policy' : 'Polisi Privasi', `
    <p><em>${en ? 'Effective date: 28 September 2026 (updated when Google Analytics 4 was added)' : 'Tarikh berkuat kuasa: 28 September 2026 (dikemas kini apabila Google Analytics 4 ditambah)'}</em></p>
    <p>${en ? 'Short version: we collect almost nothing, and we do not track you.' : 'Ringkas: kami hampir tidak mengumpul data anda, dan tidak mengesan anda.'}</p>`)

    + box(en ? 'What we collect' : 'Apa yang kami simpan', `
      <ul>
        <li><strong>${en ? 'Draw archive' : 'Rekod undian'}</strong> — ${en ? 'draw date + winning numbers per operator. This is a public record.' : 'tarikh undian + nombor menang setiap operator. Ini rekod awam.'}</li>
        <li><strong>${en ? 'Journal entries' : 'Catatan jurnal'}</strong> — ${en ? 'your own saved numbers and bets, not tied to any identity.' : 'nombor dan wager yang anda simpan sendiri, tidak dihubungkan dengan apa-apa identiti.'}</li>
        <li><strong>${en ? 'Contact form' : 'Borang hubungi'}</strong> — ${en ? 'the name, email and message you choose to send.' : 'nama, emel dan mesej yang anda pilih untuk hantar.'}</li>
        <li><strong>${en ? 'Google Analytics (anonymous traffic counts)' : 'Google Analytics (kiraan trafik tanpa nama)'}</strong> — ${en ? 'we use Google Analytics 4 (measurement ID G-3PGGPTT41J) to count page visits anonymously. Google sets the <code>_ga</code> analytics cookie and may keep device/browser data and an IP-based region. Nothing there joins to your journal entries or contact messages. If you prefer, block analytics with any ad blocker, or use a browser in private mode.'
          : 'kami guna Google Analytics 4 untuk kiraan lawatan secara tanpa nama (ID G-3PGGPTT41J). Google meletakkan kuki analisis <code>_ga</code>, dan mungkin simpan data peranti/pelayar serta data ikut rangkaian IP. Data itu TIDAK disambungkan dengan catatan jurnal atau mesej hubungi anda. Jika anda mahu, sekat kuki analisis dengan ad-blocker, atau guna pelayar dalam mod peribadi.'}</li>
      </ul>`)
    + box(en ? 'What we never do' : 'Apa yang tidak pernah kami lakukan', `
      <ul>
        <li>${en ? 'No ID, no phone number, no home address' : 'Tiada kad pengenalan, tiada nombor telefon, tiada alamat rumah'}</li>
        <li>${en ? 'No ad-network cookies, no retargeting, no fingerprinting' : 'Tiada kuki rangkaian iklan, tiada retargeting, tiada fingerprinting'}</li>
        <li>${en ? 'No account required to use any page' : 'Tiada akaun diperlukan untuk guna mana-mana halaman'}</li>
        <li>${en ? 'Never sell or share any of the above' : 'Tidak menjual mana-mana data di atas'}</li>
      </ul>`)
    + box(en ? 'The 4D journal — please read' : 'Jurnal 4D — baca ini', `
      <p>${en ? 'Journal entries are stored as plain text on our server, with no password and no encryption. Treat it like a notepad: do not put your name, phone number or betting account details in it. It cannot be used against you by us, but it is not a locked box.' : 'Catatan jurnal disimpan sebagai teks biasa di pelayan kami, tanpa kata laluan dan tanpa penyulitan. Anggapnya seperti buku nota: jangan tulis nama, nombor telefon atau butiran akaun pertaruhan anda. Ia tidak boleh digunakan oleh kami untuk apa jua, tetapi ia bukan peti berkunci.'}</p>`)
    + box(en ? 'Your rights' : 'Hak anda', `
      <ul>
        <li>${en ? 'Ask us to delete any journal entry or contact message — we do it within 24 h' : 'Minta kami padamkan catatan jurnal atau mesej — kami lakukan dalam 24 jam'}</li>
        <li>${en ? 'Ask what we have about you (it is the 3 things above, or nothing)' : 'Tanya apa yang kami simpan tentang anda (jawap: 3 perkara di atas, atau tiada)'}</li>
        <li>${en ? 'Ask for your journal exported as JSON' : 'Minta jurnal anda dieksport sebagai JSON'}</li>
      </ul>`)
    + sec(en ? 'Contact for privacy questions' : 'Kontak untuk soal privasi', `
      <p>${en ? 'Email' : 'Emel'}: <strong>mychocorabbit@gmail.com</strong> — ${en ? 'privacy questions are answered first.' : 'soalan privasi dijawab lebih dulu.'} <a href="/hubungi.html">${en ? 'Contact form' : 'Borang hubungi'}</a></p>`);
}

function terma(locale) {
  const en = locale === 'en';
  return sec(en ? 'Terms of Service' : 'Terma Perkhidmatan', `
    <p><em>${en ? 'Version 1.0 · effective 28 September 2026' : 'Versi 1.0 · berkuat kuasa 28 September 2026'}</em></p>`)

    + box(en ? 'What this site is' : 'Apa yang situs ini', `
      <ul>
        <li>${en ? 'A free results information portal — reading it is free forever' : 'Portal maklumat keputusan percuma — baca tanpa bayar selalu'}</li>
        <li>${en ? 'Combined feed from 4d88.asia + 4dmoon.com — we publish numbers we did not generate' : 'Gabungan feed dari 4d88.asia + 4dmoon.com — kami paparkan nombor yang kami tidak menjana'}</li>
        <li>${en ? 'Entertainment — not a betting operator' : 'Hiburan — bukan pengendali pertaruhan'}</li>
      </ul>`)
    + box(en ? 'The rule that matters most' : 'Peraturan paling penting', `
      <p><strong>${en ? '4D is random' : '4D sepenuhnya rawak'}</strong>. ${en ? 'Every draw is an independent event. Our prediction tools, statistics and AI Overwatch are entertainment features — they cannot forecast the future. Any tool claiming guaranteed numbers is a scam, including if it pretends to be us.' : 'Setiap undian adalah kejadian berasingan. Alat ramalan, statistik dan AI Overwatch kami adalah fungsi hiburan — ia tidak boleh meramal masa depan. Alat apa pun yang menjanjikan nombor terjamin adalah scams, termasuk jika ia menyamar sebagai kami.'}</p>`)
    + box(en ? 'Accuracy' : 'Ketepatan', `
      <p>${en ? 'We work hard to publish results within seconds of the official draw, but we cannot guarantee zero errors. If a result differs from the operator&#39;s own page, their result is correct. We are not liable for losses caused by an error here, including an error from our third-party feeds.' : 'Kami berusaha memaparkan keputusan dalam saat sama dengan undian rasmi, tetapi kami tidak boleh jamin tiada sebarang ralat. Sekiranya keputusan di sini bercanggah dengan laman rasmi, keputusan mereka adalah yang betul. Kami tidak bertanggungjawab untuk kehilangan akibat ralat, termasuk yang datang dari feed pihak ketiga.'}</p>`)
    + box(en ? 'Age restriction' : 'Sekatan umur', `
      <p><strong>${en ? '18+ only' : '18 tahun ke atas sahaja'}</strong>. ${en ? 'The Malaysian Special Draw scheme is available only to adults. If you are under 18, please close this page.' : 'Skema Undian Khas Malaysia hanya terbuka kepada orang dewasa. Jika umur anda belum cukup 18, sila tutup laman ini.'}</p>`)
    + box(en ? 'What we allow' : 'Apa yang kami izin', `
      <ul>
        <li>${en ? 'Link to our pages freely — no permission needed' : 'Pautkan halaman kami bebas — tidak perlu izin'}</li>
        <li>${en ? 'Quote a result table with a site link' : 'Petik jadual keputusan dengan pautan situs'}</li>
      </ul>
      <p><strong>${en ? 'What we do NOT allow' : 'Apa yang kami TIDAK izin'}</strong>: ${en ? 'scraping us for a competitor site, republishing as your own, or claiming our numbers guarantee a win.' : 'mengorek data kami untuk situs saingan, mengubahsiar sebagai milik anda, atau mengklaim nombor kami menjamin menang.'}</p>`)
    + sec(en ? 'Questions' : 'Soalan', `
      <p><a href="/hubungi.html">${en ? 'Contact us' : 'Hubungi kami'}</a> · <a href="/privasi.html">${en ? 'Privacy policy' : 'Polisi privasi'}</a></p>`);
}

function tanggungjawab(locale) {
  const en = locale === 'en';
  return sec(en ? 'Before anything else' : 'Sebelum apa-apa', `
    <p class="age-badge">${en ? '18+ only' : 'Hanya 18+'}</p>
    <p><strong>${en ? '4D is entertainment, not income.' : '4D adalah hiburan, bukan sumber pendapatan.'}</strong> ${en ? 'If a ticket costs more than you can afford to lose, it is already too expensive.' : 'Jika satu tiket lebih mahal daripada apa yang anda mampu hilang, ia sudah terlalu mahal.'}</p>`)

    + box(en ? 'One fact to remember' : 'Satu fakta untuk diingat', `
      <p><strong>${en ? 'Every draw is independent' : 'Setiap undian adalah berasingan'}</strong>. ${en ? 'Past results have zero influence on the next one. If 1234 missed 300 times, it is not "due". The machines do not remember.' : 'Keputusan lampau tiada pengaruh pada keputusan berikutnya. Kalau 1234 terlepas 300 kali, itu tidak bermakna ia "akan keluar". Mesin tidak mengingat.'}</p>`)
    + box(en ? 'Our five honest rules for playing' : 'Lima peraturan berlaku yang baik', `
      <ol>
        <li><strong>${en ? 'Set a budget' : 'Tentukan bajet'}</strong> — ${en ? 'decide before you buy what you can lose this month, and stop when you reach it.' : 'tentukan had sebelum membeli, dan berhenti bila capai.'}</li>
        <li><strong>${en ? 'Never chase' : 'Jangan buru'}</strong> — ${en ? 'lost money is gone. Buying more to win it back is how RM 5 becomes RM 600.' : 'keauntungan sudah hilang. Beli lagi untuk salit itu cara RM 5 jadi RM 600.'}</li>
        <li><strong>${en ? 'Do not borrow' : 'Jangan pakai pinjaman'}</strong> — ${en ? 'never use borrowed money, rent money, or your child&#39;s school fees.' : 'jangan guna duit pinjaman, duit sewa, atau yuran sekolah anak.'}</li>
        <li><strong>${en ? 'Tell someone' : 'Ceritakan pada orang'}</strong> — ${en ? 'if you find yourself hiding how much you spend, that is the signal to stop.' : 'jika anda mulai rahsia belanja anda, itu adalah tanda untuk berhenti.'}</li>
        <li><strong>${en ? 'No "systems"' : 'Tiada "sistem"'}</strong> — ${en ? 'anyone selling guaranteed numbers is taking your money.' : 'siapa pun yang menjual nombor terjamin sedang mengambil duit anda.'}</li>
      </ol>`)
    + box(en ? 'Official operator help' : 'Bantuan operator rasmi', `
      <p>${en ? 'Magnum, SportsToto and DaMaCai all run responsible-play pages where you can self-exclude or set limits. Look for "Permainan Bertanggungjawab" / "Responsible Play" on their official sites:' : 'Magnum, SportsToto dan DaMaCai semuanya menyediakan laman Permainan Bertanggungjawab di mana anda boleh larangan diri dan sekat belanja. Cari "Permainan Bertanggungjawab" di situs rasmi mereka:'}</p>
      <ul>
        <li><a href="https://www.magnum4d.my" rel="noopener nofollow" target="_blank">magnum4d.my</a></li>
        <li><a href="https://www.sports-toto.com.my" rel="noopener nofollow" target="_blank">www.sports-toto.com.my</a></li>
        <li><a href="https://www.damacai.com.my" rel="noopener nofollow" target="_blank">damacai.com.my</a></li>
      </ul>`)
    + box(en ? 'If it has become a problem' : 'Jika sudah jadi masalah', `
      <p>${en ? 'In Malaysia there is currently no single national gambling helpline, but these all work:' : 'Di Malaysia kini tiada talian tunggu tunggal nasional, tetapi semua ini membantu:'}</p>
      <ul>
        <li>${en ? 'Speak to your doctor or a licensed counsellor — an initial consultation is confidential' : 'Bercakap dengan doktor atau kaunselor berlesen — sesi pertama adalah sulit'}</li>
        <li>${en ? 'Gamblers Anonymous meets in Klang Valley and other cities — search "Gamblers Anonymous Malaysia" for the current meeting list' : 'Gamblers Anonymous bertemu di Klang Valley dan bandar lain — cari "Gamblers Anonymous Malaysia" untuk senarai pertemuan terkini'}</li>
        <li>${en ? 'Singapore (we also publish Singapore Pools results): NCPG gambling support helpline 1800-666-8668, or self-exclude via their official website' : 'Singapura (kami juga siarkan keputusan Singapura Pools): talian bantuan NCPG 1800-666-8668, atau larangan diri via situs rasmi mereka'}</li>
        <li>${en ? 'Tell a family member. They are usually kinder than you fear, and a second opinion prevents debt.' : 'Cerita pada ahli keluarga. Mereka biasanya lebih lembut daripada yang anda fikirkan, dan cadangan kedua mengelakkan hutang.'}</li>
      </ul>`)
    + sec(en ? 'How 4dmalaya stays safe' : 'Bagaimana 4dmalaya jaga diri anda', `
      <ul>
        <li>${en ? 'We never sell tips, systems, or numbered packages' : 'Kami tidak menjual tip, sistem, atau pakej nombor terjamin'}</li>
        <li>${en ? 'Every prediction tool has a <strong>For entertainment only</strong> banner' : 'Setiap alat ramalan mempunyai banner <strong>untuk hiburan sahaja</strong>'}</li>
        <li>${en ? 'We do not accept payments for bets, and never will' : 'Kami tidak menerima bayaran untuk pertaruhan, dan tidak akan melakukannya'}</li>
      </ul>
      <p class="tp-note"><em>${en ? 'If any page here feels like it is tempting you to bet beyond your means, message us. We want to know.' : 'Jika mana-mana halaman di sini terasa menggalakkan anda untuk pertaruhan di luar kemampuan, hantar mesej. Kami mahu tahu.'}</em></p>`);
}

function soalan(locale) {
  const en = locale === 'en';
  const q = (qq, a) => '<div class="faq"><h3>' + esc(qq) + '</h3><div>' + a + '</div></div>';
  return sec(en ? 'Frequently asked questions' : 'Soalan lazim', `
    <p><em>${en ? 'If your question is not here, ask us — we add the answer to this page.' : 'Jika soalan anda tidak ada di sini, tanya kami — jawapan akan ditambah pada halaman ini.'} <a href="/hubungi.html">${en ? 'Ask' : 'Tanya'}</a></em></p>`)
    + q(en ? 'What is 4D?' : 'Apa itu 4D?', `<p><strong>4D</strong> ${en ? 'is a Malaysian lottery where you pick a 4-digit number from 0000 to 9999. The operator draws the winning numbers and if yours match, you win according to the operator payout table.' : 'adalah loteri Malaysia di mana anda pilih nombor 4 digit dari 0000 hingga 9999. Operator mengundi nombor menang dan jika nombor anda padan, anda menang mengikut jadual hadiah operator.'}</p>`)
    + q(en ? 'When is the draw?' : 'Bila berlansing undian?', `<p>${en ? 'Magnum, SportsToto, DaMaCai, Sandakan and Sabah 88 draw on Wednesday, Saturday and Sunday. Singapore 4D draws on Wednesday, Saturday and Sunday. There are also occasional special draws — we list upcoming ones on the home page.' : 'Magnum, SportsToto, DaMaCai, Sandakan dan Sabah 88 berundian pada Rabu, Sabtu dan Ahad. Singapura 4D juga berlansing pada Rabu, Sabtu dan Ahad. Ada juga undian khas kadangkala — kami senaraikan di laman utama.'}</p>`)
    + q(en ? 'How do I check my number?' : 'Bagaimana semak nombor saya?', `<p>${en ? 'Type the 4-digit number in the Check your number box at the top of any results page. If the number appears in the latest draw it is highlighted with the prize tier it hit.' : 'Taip nombor 4 digit pada ruang Semak nombor anda di atas halaman keputusan. Jika nombor ada dalam undian terkini, ia akan disorot dengan hadiah yang dijangka.'}</p>`)
    + q(en ? 'Why are the results different here vs the official site?' : 'Kenapa keputusan di sini lain daripada situs rasmi?', `<p>${en ? 'Best guess: a timing issue — one source has partial data while the other has the full list. Our merging rule shows the fuller result and mentions the draw number so you can cross-check. If a result is genuinely wrong, message us and it is fixed the same day.' : 'Percaya: masalah waktu — satu sumber ada data separa sementara yang lain lengkap. Peraturan gabungan kami paparkan yang lebih lengkap dan menyebut no. undian supaya boleh semak silang. Jika keputusan betul-betul salah, hantar mesej dan dibaiki hari itu.'} <a href="/hubungi.html">${en ? 'Contact' : 'Hubungi'}</a></p>`)
    + q(en ? 'Do you sell winning numbers?' : 'Adakah anda menjual nombor menang?', `<p><strong>${en ? 'No. Never.' : 'Tidak. Tidak pernah.'}</strong> ${en ? 'We sell nothing and we never ask for money. Anybody claiming to sell you guaranteed 4D numbers — especially via WhatsApp — is a scammer.' : 'Kami tidak menjual apa-apa dan tidak meminta bayaran. Siapa pun yang menawarkan nombor 4D terjamin — terutamanya melalui WhatsApp — adalah penipu.'}</p>`)
    + q(en ? 'Is the prediction tool real?' : 'Adakah alat ramalan ini sebenar?', `<p>${en ? 'It is honest about what it is: 8 prediction methods mixed by an AI that we then backtest against real draws. It is fun, and the numbers it shows are genuinely chosen by the methods — but every 4D draw is random. Backtest scores above the random baseline are small and not a licence to bet more.' : 'Ia jujur tentang apa itu: 8 kaedah ramalan digabung oleh AI yang kemudian diuji semula terhadap undian sebenar. Ia tetaplah hiburan, dan nombor yang dipaparkan benar-benar dipilih oleh kaedah — tetapi setiap undian 4D adalah rawak. Keputusan belakang di atas baseline rawak adalah kecil dan bukan lesen untuk pertaruhan lebih.'}</p>`)
    + q(en ? 'Where does the 1-year history come from?' : 'Dari mana datang sejarah setahun itu?', `<p>${en ? 'We store the results as they come in and keep every draw date permanently archived. It is our own archive, built from our sources, not imported from an operator.' : 'Kami simpan keputusan semasa ia keluar dan setiap tarikh undian disimpan kekal. Itu sejarah kami sendiri, dibina dari sumber kami, bukan dari operator.'} <a href="/results/">${en ? 'See the archive' : 'Lihat sejarah'}</a></p>`)
    + q(en ? 'Is it free?' : 'Adakah ini percuma?', `<p><strong>${en ? 'Yes, entirely.' : 'Ya, sepenuhnya.'}</strong> ${en ? 'No subscription, no paywall, no account, no hidden premium tier.' : 'Tiada langganan, tiada paywall, tiada akaun, tiada yang tersembunyi.'}</p>`)
    + sec(en ? 'Under 18?' : 'Belum 18 tahun?', `<p><strong>${en ? 'Please close this page.' : 'Sila tutup halaman ini.'}</strong> ${en ? 'This site is for adults only.' : 'Situs ini hanya untuk orang dewasa.'} <a href="/tanggungjawab.html">${en ? 'Responsible play' : 'Permainan bertanggungjawab'}</a></p>`);
}
const trustMetaOf = (route) => {
  const t = I18N.TRUST_PAGES[route];
  return { title: t.title, desc: t.desc, h1: t.h1 };
};

const TRUSTPAGES = {
  '/tentang.html':       { ...trustMetaOf('/tentang.html'), en: I18N.TRUST_PAGES['/tentang.html'].en, content: tentang },
  '/hubungi.html':       { ...trustMetaOf('/hubungi.html'), en: I18N.TRUST_PAGES['/hubungi.html'].en, content: hubungi },
  '/privasi.html':       { ...trustMetaOf('/privasi.html'), en: I18N.TRUST_PAGES['/privasi.html'].en, content: privasi },
  '/terma.html':         { ...trustMetaOf('/terma.html'),   en: I18N.TRUST_PAGES['/terma.html'].en,   content: terma },
  '/tanggungjawab.html': { ...trustMetaOf('/tanggungjawab.html'), en: I18N.TRUST_PAGES['/tanggungjawab.html'].en, content: tanggungjawab },
  '/soalan.html':        { title: 'Soalan Lazim 4D | 4D Malaysia Live', desc: 'Jawapan kepada 8 soalan lazim tentang 4D: apa itu, bila undian, cara semak nombor, kenapa keputusan berbeza, adakah kami jual nombor terjamin.', h1: 'Soalan Lazim', en: { title: '4D FAQ — Frequently Asked Questions', desc: 'Answers to 8 common 4D questions: what 4D is, when it draws, how to check a number, why results differ, and whether we sell guaranteed numbers.', h1: '4D FAQ' }, content: soalan },
};

module.exports = { TRUSTPAGES, sec, box };
