// Baut die Levelfolge einmal vor und schreibt sie nach src/levels/folge.json.
//
// Warum vorgebaut und nicht im Browser erzeugt: `generate` laesst den Loeser
// laufen, und der braucht fuer die grossen Stufen Sekunden. Beim Start der
// App darauf zu warten waere der schlechteste erste Eindruck. Die Erzeugung
// gehoert ohnehin nicht aufs Geraet — dort sucht nie jemand, das Optimum
// steht im Level.
//
// Aufruf: node tools/level-bauen.mts
import { writeFileSync } from 'node:fs';
import { generate, STUFEN } from '../src/engine/generator.ts';
import type { Level } from '../src/engine/typen.ts';

// Ruhig ansteigend: erst kleine Bretter mit wenigen Farben, dann mehr von
// beidem. Die teuren Stufen kommen hinten und bleiben selten.
const FOLGE: readonly number[] = [
  0, 0, 0,
  1, 1, 1,
  2, 2,
  1, 2, 3,
  2, 3, 3,
  4, 3, 4,
  5, 4, 5,
];

const level: Level[] = [];
const t0 = Date.now();
for (let i = 0; i < FOLGE.length; i++) {
  const stufe = FOLGE[i]!;
  const t1 = Date.now();
  const l = generate(9_000_000 + i * 7919, stufe);
  level.push(l);
  console.log(
    `  ${String(i + 1).padStart(2)}. ${STUFEN[stufe]!.name.padEnd(7)} ` +
    `${String(l.glaeser).padStart(2)} Glaeser  Optimum ${String(l.optimalZuege).padStart(2)}  ` +
    `${Date.now() - t1} ms`,
  );
}
writeFileSync(
  new URL('../src/levels/folge.json', import.meta.url),
  `${JSON.stringify(level, null, 1)}\n`,
);
console.log(`\n${level.length} Level in ${((Date.now() - t0) / 1000).toFixed(1)} s nach src/levels/folge.json geschrieben.`);
