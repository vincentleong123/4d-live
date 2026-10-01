import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { BUILDERS } from './lib-svg.mjs';
import { ARTICLES as A } from './data-a.mjs';
import { ARTICLES as B } from './data-b.mjs';

const ARTICLES = [...A, ...B];
const ROOT = process.cwd();
const ART_DIR = path.join(ROOT, 'articles');

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const row = (cells) => cells.map(csvCell).join(',');

const manifest = [
  row(['article_folder', 'slug', 'image_file', 'format', 'alt_text', 'alt_chars', 'caption', 'width', 'height']),
];

let total = 0;
let altIssues = 0;

for (const art of ARTICLES) {
  const imgDir = path.join(ART_DIR, art.folder, 'images');
  const svgDir = path.join(imgDir, 'svg');
  fs.mkdirSync(svgDir, { recursive: true });

  for (const img of art.images) {
    const build = BUILDERS[img.type];
    if (!build) throw new Error('Unknown image type: ' + img.type);
    const svg = build(img.data);
    fs.writeFileSync(path.join(svgDir, img.file + '.svg'), svg, 'utf8');

    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
    const webp = await sharp(Buffer.from(svg)).webp({ quality: 88, effort: 5 }).toBuffer();
    fs.writeFileSync(path.join(imgDir, img.file + '.png'), png);
    fs.writeFileSync(path.join(imgDir, img.file + '.webp'), webp);

    const meta = await sharp(Buffer.from(svg)).metadata();
    const altLen = img.alt.length;
    if (altLen > 125) {
      altIssues++;
      console.log('ALT TOO LONG (' + altLen + '): ' + img.file);
    }
    manifest.push(
      row([art.folder, art.slug, img.file + '.webp', 'webp', img.alt, altLen, img.caption, meta.width, meta.height])
    );
    manifest.push(
      row([art.folder, art.slug, img.file + '.png', 'png', img.alt, altLen, img.caption, meta.width, meta.height])
    );
    total++;
    console.log('ok ' + art.folder + '/' + img.file + ' (' + img.type + ', ' + meta.width + 'x' + meta.height + ')');
  }
}

fs.writeFileSync(path.join(ROOT, 'images-manifest.csv'), manifest.join('\n') + '\n', 'utf8');
console.log('\n' + total + ' images generated across ' + ARTICLES.length + ' articles.');
console.log(altIssues + ' alt texts over 125 chars.');
