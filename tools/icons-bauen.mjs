// Macht aus tools/vorlagen/app-symbol.jpg die PNG-Groessen, die Browser und
// Telefone verlangen: das Favicon fuer den Browser-Tab, apple-touch-icon.png
// (iOS nimmt fuer „Zum Home-Bildschirm hinzufuegen" ausschliesslich diese
// Datei) und die beiden Groessen fuer das Web-Manifest.
//
// Bis zum 02.10.2026 war die Quelle public/favicon.svg. Das Symbol ist seitdem
// ein Bild aus Gemini, und ein SVG kann es nicht mehr sein — der Tab bekommt
// deshalb ein PNG.
//
// Aufruf: node tools/icons-bauen.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const wurzel = new URL('..', import.meta.url).pathname;
const quelle = join(wurzel, 'tools/vorlagen/app-symbol.jpg');
mkdirSync(join(wurzel, 'public/icons'), { recursive: true });

const groessen = [
  ['public/favicon.png', 64],
  ['public/apple-touch-icon.png', 180],
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
];
for (const [ziel, px] of groessen) {
  await sharp(quelle).resize(px, px, { kernel: 'lanczos3' }).png().toFile(join(wurzel, ziel));
  console.log(`  ${ziel}  ${px}x${px}`);
}
console.log('Fertig.');
