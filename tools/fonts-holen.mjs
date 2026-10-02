// Holt die Schriftdateien von Google und legt sie ins Repo.
// Aufruf: node tools/fonts-holen.mjs
//
// Einmalig gelaufen, das Ergebnis liegt in public/fonts/ und die erzeugten
// @font-face-Regeln stehen oben in src/index.css. Das Skript bleibt hier,
// damit ein weiteres Gewicht nicht von Hand zusammengesucht werden muss.
//
// Warum ueberhaupt: die App soll offline laufen (Capacitor) und der
// Oberflaechentest zaehlt Konsolenfehler — ein Abruf bei fonts.gstatic.com
// erzeugte hinter dem Proxy jedes Mal einen. Es gibt deshalb KEINEN
// Netz-Fallback; fehlt eine Datei, faellt die Schrift auf system-ui zurueck.
//
// Der User-Agent ist Pflicht: ohne ihn liefert Google die alte TTF-Variante
// statt woff2, und die ist gut dreimal so gross.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Welche Familien in welchen Schnitten. Nur was die Oberflaeche wirklich nutzt. */
const WUNSCH = [
  { familie: 'Fredoka', gewichte: [600, 700] },
  { familie: 'Nunito', gewichte: [600, 700, 800] },
];

const ZIEL = new URL('../public/fonts/', import.meta.url);

/**
 * Welche Unterschnitte. Bis zum 02.10.2026 nur `latin` (U+0000-00FF) — fuer
 * DE/EN/ES/FR/PT genug. Mit zwanzig Sprachen fielen Polnisch (ł), Tuerkisch
 * (ş ğ ı) und Vietnamesisch mitten im Wort auf die Systemschrift zurueck, und
 * Russisch/Ukrainisch ganz. Jede Datei bekommt ihre `unicode-range`; der
 * Browser laedt nur, was eine Seite wirklich braucht.
 *
 * Japanisch, Koreanisch, Chinesisch, Thai, Hindi und Arabisch bleiben bewusst
 * bei der Systemschrift: eine CJK-Schrift waere mehrere MB im Bundle, und
 * die Geraete bringen gute mit. Fredoka hat kein Kyrillisch — dort greift
 * ueber `--font-anzeige` Nunito.
 */
const UNTERSCHNITTE = ['latin', 'latin-ext', 'vietnamese', 'cyrillic', 'cyrillic-ext'];

async function css(familie, gewichte) {
  const url =
    'https://fonts.googleapis.com/css2?family=' +
    encodeURIComponent(familie) +
    ':wght@' +
    gewichte.join(';') +
    '&display=swap';
  const antwort = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!antwort.ok) throw new Error(`${familie}: HTTP ${antwort.status}`);
  return antwort.text();
}

/** Zerlegt die Google-CSS in ihre @font-face-Bloecke samt Unterschnitt —
    der steht bei Google als Kommentar davor (`/* latin-ext *\/`). */
function bloecke(text) {
  return [...text.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)]
    .map((m) => ({ schnitt: m[1], block: m[2] }));
}

function feld(block, name) {
  const m = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : '';
}

async function main() {
  await mkdir(ZIEL, { recursive: true });
  const regeln = [];

  for (const { familie, gewichte } of WUNSCH) {
    const text = await css(familie, gewichte);
    for (const { schnitt, block } of bloecke(text)) {
      if (!UNTERSCHNITTE.includes(schnitt)) continue;
      const bereich = feld(block, 'unicode-range');
      const gewicht = Number(feld(block, 'font-weight'));
      if (!gewichte.includes(gewicht)) continue;
      const quelle = feld(block, 'src').match(/url\((https:[^)]+\.woff2)\)/);
      if (!quelle) continue;

      // Latin behaelt den alten Namen (fredoka-600.woff2), die anderen
      // tragen den Unterschnitt im Namen.
      const datei = schnitt === 'latin'
        ? `${familie.toLowerCase()}-${gewicht}.woff2`
        : `${familie.toLowerCase()}-${gewicht}-${schnitt}.woff2`;
      const roh = await fetch(quelle[1], { headers: { 'User-Agent': UA } });
      if (!roh.ok) throw new Error(`${datei}: HTTP ${roh.status}`);
      const bytes = new Uint8Array(await roh.arrayBuffer());
      await writeFile(join(ZIEL.pathname, datei), bytes);
      console.log(`${datei}  ${bytes.length} Bytes`);

      regeln.push(
        `@font-face {\n` +
          `  font-family: '${familie}';\n` +
          `  src: url('/fonts/${datei}') format('woff2');\n` +
          `  font-weight: ${gewicht};\n` +
          `  font-style: normal;\n` +
          `  font-display: swap;\n` +
          `  unicode-range: ${bereich};\n` +
          `}`,
      );
    }
  }

  console.log(`\n${regeln.length} @font-face-Regeln — gehoeren oben in src/index.css:\n`);
  console.log(regeln.join('\n'));
}

main().catch((f) => {
  console.error(f);
  process.exit(1);
});
