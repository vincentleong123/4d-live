import fs from 'node:fs';
import path from 'node:path';

const root = 'articles';
let issues = 0;
let totalWords = 0;
let totalImgs = 0;

for (const d of fs.readdirSync(root).sort()) {
  const md = path.join(root, d, 'article.md');
  if (!fs.existsSync(md)) {
    console.log('MISSING ' + md);
    issues++;
    continue;
  }
  const t = fs.readFileSync(md, 'utf8');
  const fm = t.match(/^---\n([\s\S]*?)\n---/);
  const body = fm ? t.slice(fm[0].length) : t;
  const words = body
    .replace(/[#*|[\]()!_`>-]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[a-zA-Z0-9]/.test(w)).length;
  totalWords += words;

  const imgs = [...body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  totalImgs += imgs.length;

  for (const m of imgs) {
    const p = path.join(root, d, m[2]);
    if (!fs.existsSync(p)) {
      console.log('BROKEN IMG ' + p);
      issues++;
    }
    if (m[1].length > 125) {
      console.log('LONG ALT ' + m[1].length + ' ' + m[2]);
      issues++;
    }
    if (m[1].length < 20) {
      console.log('SHORT ALT ' + m[2]);
      issues++;
    }
  }

  const meta = t.match(/meta_description: "([^"]+)"/);
  const mc = meta ? meta[1].length : 0;
  if (mc > 160 || mc < 120) {
    console.log('META LEN ' + mc + ' ' + d);
    issues++;
  }

  const files = fs
    .readdirSync(path.join(root, d, 'images'))
    .filter((f) => f.endsWith('.webp')).length;
  if (files !== 5) {
    console.log('IMG COUNT ' + files + ' ' + d);
    issues++;
  }
  if (imgs.length !== 5) {
    console.log('EMBED COUNT ' + imgs.length + ' ' + d);
    issues++;
  }

  console.log(
    d.padEnd(34) +
      ' words:' + String(words).padStart(5) +
      '  meta:' + mc +
      '  embeds:' + imgs.length + '/5' +
      '  files:' + files + '/5'
  );
}

console.log('----');
console.log('TOTAL words: ' + totalWords + ' | image embeds: ' + totalImgs + ' | ISSUES: ' + issues);
const man = fs.readFileSync('images-manifest.csv', 'utf8').trim().split('\n').length - 1;
console.log('manifest rows: ' + man + ' (expected 100 = 50 images x webp+png)');
const alts = fs.readFileSync('images-manifest.csv', 'utf8').trim().split('\n').slice(1);
const maxAlt = Math.max(...alts.map((l) => (l.match(/,(\d+),/)||[0,0])[1]));
console.log('longest alt: ' + maxAlt + ' chars');
