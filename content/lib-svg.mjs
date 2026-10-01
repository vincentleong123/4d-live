export const W = 1200;

export const C = {
  navy: '#0B1E3A',
  navy2: '#16365F',
  navy3: '#1E4577',
  gold: '#F5B301',
  red: '#C1121F',
  ink: '#101828',
  muted: '#5B6472',
  line: '#DDE3EC',
  bg: '#F5F7FB',
  white: '#FFFFFF',
  green: '#0E9F6E',
  amber: '#FFF6E0',
};
export const F = 'Arial, Helvetica, sans-serif';

export const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const measure = (s, size) => String(s).length * size * 0.52;

export function wrap(text, size, maxW, maxLines = 99) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (measure(t, size) <= maxW) cur = t;
    else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    let last = cut[maxLines - 1];
    while (measure(last + '...', size) > maxW && last.length > 1) last = last.slice(0, -1);
    cut[maxLines - 1] = last + '...';
    return cut;
  }
  return lines;
}

export function text(lines, x, y, opts = {}) {
  const { size = 24, fill = C.ink, weight = '400', lh = size * 1.3, anchor = 'start', spacing } = opts;
  return lines
    .map((l, i) => {
      const sp = spacing ? ` letter-spacing="${spacing}"` : '';
      return `<text x="${x}" y="${y + i * lh}" font-family="${F}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${sp}>${esc(l)}</text>`;
    })
    .join('');
}

function footer(extra) {
  return `
  <line x1="48" y1="__H__-44" x2="${W - 48}" y2="__H__-44" stroke="${C.line}" stroke-width="1"/>
  <text x="48" y="__H__-18" font-family="${F}" font-size="17" fill="${C.muted}" font-weight="700">4DMALAYA.COM</text>
  <text x="${W - 48}" y="__H__-18" font-family="${F}" font-size="17" fill="${C.muted}" text-anchor="end">${esc(extra || '4D results, schedules and guides')}</text>`;
}

function headerBlock(title, kicker) {
  const lines = wrap(title, 40, W - 96 - 300, 2);
  const h = 54 + lines.length * 48 + 26;
  const parts = [
    `<rect x="0" y="0" width="${W}" height="${h}" fill="${C.navy}"/>`,
    `<rect x="0" y="${h - 5}" width="${W}" height="5" fill="${C.gold}"/>`,
    text(lines, 48, 62, { size: 40, fill: C.white, weight: '700', lh: 48 }),
  ];
  if (kicker) {
    const kw = measure(kicker, 15) + kicker.length * 1.5 + 26;
    parts.push(`<rect x="${W - 48 - kw}" y="46" width="${kw}" height="30" rx="15" fill="${C.gold}"/>`);
    parts.push(
      `<text x="${W - 48 - kw / 2}" y="66" font-family="${F}" font-size="15" font-weight="700" fill="${C.navy}" text-anchor="middle" letter-spacing="1.5">${esc(kicker)}</text>`
    );
  }
  return { svg: parts.join(''), h };
}

function baseWrap(inner, bodyH, headerTitle, kicker, note) {
  const hh = headerBlock(headerTitle, kicker || 'GUIDE');
  const noteH = note ? 56 : 0;
  const bodyY = hh.h + 36;
  const H = Math.max(675, bodyY + bodyH + noteH + 74);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += `<rect width="${W}" height="${H}" fill="${C.bg}"/>`;
  s += hh.svg;
  s += `<g transform="translate(0,${bodyY})">` + inner + `</g>`;
  if (note) {
    const y = bodyY + bodyH + 16;
    s += `<rect x="48" y="${y}" width="${W - 96}" height="44" rx="10" fill="#EEF2F9" stroke="${C.line}"/>`;
    s += `<circle cx="74" cy="${y + 22}" r="9" fill="${C.navy2}"/>`;
    s += `<text x="74" y="${y + 27}" font-family="${F}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">i</text>`;
    s += `<text x="94" y="${y + 27}" font-family="${F}" font-size="18" fill="${C.muted}">${esc(note)}</text>`;
  }
  s += footer().replaceAll('__H__', String(H));
  s += '</svg>';
  return s;
}

export function heroSVG({ title, subtitle, kicker, digits = [7, 2, 9, 4] }) {
  const H = 630;
  const tLines = wrap(title, 58, 1010, 3);
  const sLines = wrap(subtitle, 26, 1010, 2);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += `<defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.navy}"/><stop offset="1" stop-color="#1B477E"/></linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${C.gold}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient></defs>`;
  s += `<rect width="${W}" height="${H}" fill="url(#hg)"/>`;
  s += `<circle cx="1050" cy="120" r="320" fill="url(#glow)"/>`;
  s += `<circle cx="1120" cy="560" r="240" fill="url(#glow)"/>`;
  s += `<g opacity="0.10" stroke="${C.gold}" stroke-width="2" fill="none">`;
  for (let i = 0; i < 5; i++) s += `<circle cx="${960 + (i % 3) * 90}" cy="${330 + Math.floor(i / 3) * 90 + (i % 3) * 34}" r="44"/>`;
  s += `</g>`;
  s += `<rect x="0" y="0" width="${W}" height="8" fill="${C.gold}"/>`;
  const kwc = measure(kicker, 16) + kicker.length * 2 + 34;
  s += `<rect x="48" y="56" width="${kwc}" height="34" rx="17" fill="${C.gold}"/>`;
  s += `<text x="${48 + kwc / 2}" y="79" font-family="${F}" font-size="16" font-weight="700" fill="${C.navy}" text-anchor="middle" letter-spacing="2">${esc(kicker)}</text>`;
  s += text(tLines, 48, 190, { size: 58, fill: C.white, weight: '700', lh: 72 });
  s += text(sLines, 48, 196 + tLines.length * 72, { size: 26, fill: '#BFD0E6', lh: 36 });
  digits.forEach((d, i) => {
    const x = 78 + i * 108;
    const y = 500;
    s += `<circle cx="${x}" cy="${y}" r="46" fill="#FFFFFF" fill-opacity="0.08" stroke="${C.gold}" stroke-width="3"/>`;
    s += `<text x="${x}" y="${y + 17}" font-family="${F}" font-size="42" font-weight="700" fill="${C.gold}" text-anchor="middle">${esc(d)}</text>`;
  });
  s += `<rect x="48" y="576" width="${measure('4DMALAYA.COM', 18) + 40}" height="36" rx="18" fill="#FFFFFF" fill-opacity="0.12"/>`;
  s += `<text x="68" y="600" font-family="${F}" font-size="18" font-weight="700" fill="#FFFFFF">4DMALAYA.COM</text>`;
  s += `<text x="${W - 48}" y="600" font-family="${F}" font-size="18" fill="#8FA8C7" text-anchor="end">Updated every draw</text>`;
  s += `</svg>`;
  return s;
}

export function tableSVG({ title, kicker, columns, rows, note }) {
  const pad = 16;
  const totalW = W - 96;
  const weights = columns.map((c) => c.w || 1);
  const sum = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => Math.max(90, (w / sum) * totalW));
  widths[widths.length - 1] += totalW - widths.reduce((a, b) => a + b, 0);
  const fs = 21;
  const headerH = 56;
  const cellLines = (val, w) => wrap(val, fs, w - pad * 2, 4);
  const rowHeights = rows.map((r) => Math.max(54, Math.max(...r.map((v, i) => cellLines(v, widths[i]).length)) * (fs * 1.35) + 36));

  let y = 0;
  let inner = '';
  let x = 48;
  columns.forEach((c, i) => {
    inner += `<rect x="${x}" y="${y}" width="${widths[i]}" height="${headerH}" fill="${i === 0 ? C.navy : C.navy2}"/>`;
    inner += text(wrap(c.label, 20, widths[i] - pad * 2, 2), x + pad, y + 35, { size: 20, fill: C.gold, weight: '700', lh: 24 });
    x += widths[i];
  });
  y += headerH;
  rows.forEach((r, ri) => {
    const rh = rowHeights[ri];
    const bg = ri % 2 === 0 ? C.white : '#F0F3F9';
    inner += `<rect x="48" y="${y}" width="${totalW}" height="${rh}" fill="${bg}"/>`;
    x = 48;
    r.forEach((v, ci) => {
      inner += text(cellLines(v, widths[ci]), x + pad, y + 34, {
        size: fs,
        fill: ci === 0 ? C.ink : C.muted,
        weight: ci === 0 ? '700' : '400',
        lh: fs * 1.35,
      });
      if (ci > 0) inner += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + rh}" stroke="${C.line}"/>`;
      x += widths[ci];
    });
    inner += `<line x1="48" y1="${y + rh}" x2="${W - 48}" y2="${y + rh}" stroke="${C.line}"/>`;
    y += rh;
  });
  inner += `<rect x="48" y="0" width="${totalW}" height="${y}" fill="none" stroke="${C.line}" stroke-width="2"/>`;
  return baseWrap(inner, y, title, kicker, note);
}

export function chartSVG({ title, kicker, bars, note, unitLabel }) {
  const labelW = 330;
  const valW = 180;
  const x0 = 48 + labelW + 24;
  const barMaxW = W - 48 - valW - x0;
  const barH = 46;
  const gap = 26;
  const rawMax = Math.max(...bars.map((b) => b.value));
  const sqrt = bars.some((b) => b.sqrtScale);
  const scale = (v) => (sqrt ? Math.sqrt(v) / Math.sqrt(rawMax) : v / rawMax);
  let y = 0;
  let inner = '';
  if (unitLabel) {
    inner += `<text x="48" y="16" font-family="${F}" font-size="18" fill="${C.muted}" font-weight="700">${esc(unitLabel)}</text>`;
    y += 30;
  }
  bars.forEach((b, i) => {
    const bw = Math.max(10, scale(b.value) * barMaxW);
    const fill = [C.gold, C.navy2, C.navy3, '#3C6EA5', '#5B87BE'][i] || '#3C6EA5';
    inner += text(wrap(b.label, 22, labelW, 2), 48, y + 30, { size: 22, fill: C.ink, weight: '700', lh: 27 });
    inner += `<rect x="${x0}" y="${y + 4}" width="${barMaxW}" height="${barH}" rx="${barH / 2}" fill="#E7ECF4"/>`;
    inner += `<rect x="${x0}" y="${y + 4}" width="${bw}" height="${barH}" rx="${barH / 2}" fill="${fill}"/>`;
    inner += `<text x="${Math.min(x0 + bw + 16, W - 60)}" y="${y + 35}" font-family="${F}" font-size="24" font-weight="700" fill="${C.navy}">${esc(b.display)}</text>`;
    y += barH + gap;
  });
  if (sqrt) {
    inner += `<text x="48" y="${y + 6}" font-family="${F}" font-size="16" fill="${C.muted}">Bar length uses a square-root scale so small values stay readable.</text>`;
    y += 26;
  }
  return baseWrap(inner, y, title, kicker, note);
}

export function stepsSVG({ title, kicker, items, note }) {
  const xNum = 78;
  const xTxt = 136;
  const txtW = W - 48 - xTxt;
  let y = 0;
  let inner = '';
  items.forEach((it, i) => {
    const desc = wrap(it.p, 21, txtW, 3);
    const itemH = Math.max(96, 44 + desc.length * 28);
    const cy = y + 30;
    if (i < items.length - 1)
      inner += `<line x1="${xNum}" y1="${cy + 32}" x2="${xNum}" y2="${y + itemH + 30}" stroke="${C.line}" stroke-width="4"/>`;
    inner += `<circle cx="${xNum}" cy="${cy}" r="30" fill="${C.gold}"/>`;
    inner += `<text x="${xNum}" y="${cy + 11}" font-family="${F}" font-size="30" font-weight="700" fill="${C.navy}" text-anchor="middle">${i + 1}</text>`;
    inner += `<text x="${xTxt}" y="${cy + 6}" font-family="${F}" font-size="26" font-weight="700" fill="${C.ink}">${esc(it.h)}</text>`;
    inner += text(desc, xTxt, cy + 42, { size: 21, fill: C.muted, lh: 28 });
    y += itemH;
  });
  return baseWrap(inner, y, title, kicker, note);
}

export function cardSVG({ title, kicker, heading, bullets, note, warn }) {
  const xTxt = 96;
  const txtW = W - 48 - xTxt;
  let inner = '';
  const headLines = wrap(heading, 28, txtW, 2);
  const bulletBlocks = bullets.map((b) => wrap(b, 22, txtW - 30, 3));
  let contentH = 34 + headLines.length * 36 + 14;
  bulletBlocks.forEach((bl) => (contentH += bl.length * 30 + 18));
  const warnH = warn ? Math.max(64, wrap(warn, 20, W - 96 - 60, 3).length * 28 + 34) : 0;
  const boxH = contentH + 40 + warnH;
  const y = 8;
  inner += `<rect x="48" y="${y}" width="${W - 96}" height="${boxH}" rx="18" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>`;
  inner += `<rect x="48" y="${y}" width="10" height="${boxH}" rx="5" fill="${C.gold}"/>`;
  inner += text(headLines, xTxt, y + 48, { size: 28, fill: C.navy, weight: '700', lh: 36 });
  let by = y + 48 + headLines.length * 36 + 8;
  bulletBlocks.forEach((bl) => {
    inner += `<rect x="${xTxt}" y="${by - 17}" width="14" height="14" rx="3" fill="${C.gold}"/>`;
    inner += text(bl, xTxt + 30, by, { size: 22, fill: C.ink, lh: 30 });
    by += bl.length * 30 + 18;
  });
  if (warn) {
    const wy = y + boxH - warnH - 6;
    inner += `<rect x="${xTxt - 12}" y="${wy}" width="${txtW - 20}" height="${warnH - 12}" rx="12" fill="${C.amber}" stroke="#F2D48A"/>`;
    inner += text(wrap(warn, 20, txtW - 80, 3), xTxt + 8, wy + 34, { size: 20, fill: '#7A5A00', lh: 28 });
  }
  return baseWrap(inner, boxH + 16, title, kicker, note);
}

export function flowSVG({ title, kicker, steps, note }) {
  const n = steps.length;
  const gapW = 14;
  const totalW = W - 96;
  const w = (totalW - gapW * (n - 1)) / n;
  const boxH = 250;
  let inner = '';
  steps.forEach((st, i) => {
    const x = 48 + i * (w + gapW);
    const fill = i % 2 === 0 ? C.navy : C.navy2;
    inner += `<rect x="${x}" y="0" width="${w}" height="${boxH}" rx="16" fill="${fill}"/>`;
    inner += `<rect x="${x}" y="0" width="${w}" height="6" rx="3" fill="${C.gold}"/>`;
    inner += `<circle cx="${x + w / 2}" cy="56" r="26" fill="${C.gold}"/>`;
    inner += `<text x="${x + w / 2}" y="66" font-family="${F}" font-size="26" font-weight="700" fill="${C.navy}" text-anchor="middle">${i + 1}</text>`;
    const hLines = wrap(st.h, 22, w - 36, 3);
    inner += text(hLines, x + w / 2, 106, { size: 22, fill: C.gold, weight: '700', lh: 27, anchor: 'middle' });
    inner += text(wrap(st.p, 17, w - 36, 5), x + w / 2, 106 + hLines.length * 27 + 12, {
      size: 17,
      fill: '#C3D2E6',
      lh: 23,
      anchor: 'middle',
    });
    if (i < n - 1) {
      const ax = x + w + gapW / 2;
      inner += `<polygon points="${ax - 7},112 ${ax + 7},120 ${ax - 7},128" fill="${C.gold}"/>`;
    }
  });
  return baseWrap(inner, boxH + 10, title, kicker, note);
}

export function vsSVG({ title, kicker, left, right, note }) {
  const colW = (W - 96 - 60) / 2;
  const build = (col, x, accent) => {
    let s = '';
    const heads = wrap(col.head, 26, colW - 56, 2);
    const rowBlocks = col.rows.map((r) => wrap(r, 21, colW - 76, 3));
    let h = 44 + heads.length * 34;
    rowBlocks.forEach((rb) => (h += rb.length * 29 + 20));
    s += `<rect x="${x}" y="0" width="${colW}" height="${h}" rx="18" fill="${C.white}" stroke="${accent}" stroke-width="3"/>`;
    s += text(heads, x + 28, 46, { size: 26, fill: accent, weight: '700', lh: 34 });
    let ry = 46 + heads.length * 34 + 14;
    rowBlocks.forEach((rb) => {
      s += `<circle cx="${x + 36}" cy="${ry - 7}" r="6" fill="${accent}"/>`;
      s += text(rb, x + 56, ry, { size: 21, fill: C.ink, lh: 29 });
      ry += rb.length * 29 + 20;
    });
    return { s, h };
  };
  const a = build(left, 48, C.green);
  const b = build(right, 48 + colW + 60, C.red);
  const h = Math.max(a.h, b.h);
  let inner = a.s + b.s;
  inner += `<rect x="${48 + colW + 6}" y="${h / 2 - 34}" width="48" height="68" rx="24" fill="${C.navy}"/>`;
  inner += `<text x="${48 + colW + 30}" y="${h / 2 + 11}" font-family="${F}" font-size="24" font-weight="700" fill="${C.gold}" text-anchor="middle">VS</text>`;
  return baseWrap(inner, h + 10, title, kicker, note);
}

export const BUILDERS = {
  hero: heroSVG,
  table: tableSVG,
  chart: chartSVG,
  steps: stepsSVG,
  card: cardSVG,
  flow: flowSVG,
  vs: vsSVG,
};
