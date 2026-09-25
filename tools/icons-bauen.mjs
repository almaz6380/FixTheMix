// Macht aus public/favicon.svg die PNG-Groessen, die Browser und Telefone
// verlangen. Nur SVG reicht nicht: iOS nimmt fuer „Zum Home-Bildschirm
// hinzufuegen" ausschliesslich apple-touch-icon.png, und der Android-Manifest
// will PNG.
//
// Aufruf: node tools/icons-bauen.mjs
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const wurzel = new URL('..', import.meta.url).pathname;
const svg = readFileSync(join(wurzel, 'public/favicon.svg'));
mkdirSync(join(wurzel, 'public/icons'), { recursive: true });

const groessen = [
  ['public/apple-touch-icon.png', 180],
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
];
for (const [ziel, px] of groessen) {
  await sharp(svg, { density: 512 }).resize(px, px).png().toFile(join(wurzel, ziel));
  console.log(`  ${ziel}  ${px}x${px}`);
}
console.log('Fertig.');
