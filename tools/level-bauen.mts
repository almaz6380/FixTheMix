// Baut die Levelfolge einmal vor und schreibt sie nach src/levels/folge.json.
//
// Warum vorgebaut und nicht im Browser erzeugt: `generate` laesst den Loeser
// laufen, und der braucht fuer die Shaker-Stufen bis zu zwei Sekunden. Beim
// Start der App darauf zu warten waere der schlechteste erste Eindruck. Die
// Erzeugung gehoert ohnehin nicht aufs Geraet — auf dem Geraet sucht nie
// jemand, das Optimum steht im Level.
//
// Aufruf: node tools/level-bauen.mts
import { writeFileSync } from 'node:fs';
import { generate, STUFEN } from '../src/engine/generator.ts';
import type { Level } from '../src/engine/typen.ts';

// Erst reine Fix-Level, dann der Shaker — so steht es im Bauplan. Fuer den
// Testaufbau kommt der Shaker frueher als Level 15, damit die Mix-Mechanik
// nicht erst nach einer Viertelstunde auftaucht.
const FOLGE: readonly number[] = [
  0, 0, 0,        // Start
  1, 1,           // Leicht
  5,              // erster Shaker
  2, 2,           // Mittel
  5,              // Shaker
  3,              // Gross
  5, 6,           // Shaker, Shaker+
  2, 3,           // Mittel, Gross
  6,              // Shaker+
  4,              // Weit
  5, 3, 6, 4,     // gemischt
];

const level: Level[] = [];
const t0 = Date.now();
for (let i = 0; i < FOLGE.length; i++) {
  const stufe = FOLGE[i]!;
  const t1 = Date.now();
  const l = generate(9_000_000 + i * 7919, stufe);
  level.push(l);
  console.log(
    `  ${String(i + 1).padStart(2)}. ${STUFEN[stufe]!.name.padEnd(8)} ` +
    `Optimum ${String(l.optimalZuege).padStart(2)}  ` +
    `${l.schuettelZuege > 0 ? `${l.schuettelZuege}x schuetteln  ` : '              '}` +
    `${Date.now() - t1} ms`,
  );
}
writeFileSync(
  new URL('../src/levels/folge.json', import.meta.url),
  `${JSON.stringify(level, null, 1)}\n`,
);
console.log(`\n${level.length} Level in ${((Date.now() - t0) / 1000).toFixed(1)} s nach src/levels/folge.json geschrieben.`);
