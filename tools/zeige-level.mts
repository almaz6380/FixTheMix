// Zeigt ein erzeugtes Level und seine kuerzeste Loesung als Text.
//
// Zweck: beurteilen, ob sich die Level GUT ANFUEHLEN — die Tests sagen nur,
// ob sie loesbar sind. Vor Phase 2 gibt es keine Oberflaeche, und ohne so
// eine Ausgabe baut man die Stufen blind.
//
// Aufruf: node tools/zeige-level.mts [--stufe 5] [--seed 7] [--loesung]
//         npx tsx tools/zeige-level.mts --stufe 5 --seed 7 --loesung
import { generate, STUFEN } from '../src/engine/generator.ts';
import { solve } from '../src/engine/loeser.ts';
import { farbeVon } from '../src/engine/farben.ts';
import { alsText, klone, standAusLevel } from '../src/engine/zustand.ts';
import { anwenden } from '../src/engine/zuege.ts';

const arg = (name: string, vorgabe: number): number => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : vorgabe;
};
const stufe = arg('stufe', 5);
const seed = arg('seed', 7);
const mitLoesung = process.argv.includes('--loesung');

const s = STUFEN[stufe];
if (!s) {
  console.log(`Stufe ${stufe} gibt es nicht. Vorhanden: ${STUFEN.map((x, i) => `${i}=${x.name}`).join(', ')}`);
  process.exit(1);
}

const t0 = Date.now();
const level = generate(seed, stufe);
const ms = Date.now() - t0;
const z = standAusLevel(level);

console.log(`Stufe ${stufe} "${s.name}", Seed ${seed}  (erzeugt in ${ms} ms)`);
console.log(`${level.glaeser} Glaeser, ${level.shaker} Shaker, Hoehe ${level.hoehe}`);
console.log(`Optimum ${level.optimalZuege} Zuege, davon mindestens ${level.schuettelZuege} Schuettelzuege`);
console.log(`Sterne: 3 bei <= ${level.sterne.drei}, 2 bei <= ${level.sterne.zwei}, sonst 1\n`);
console.log(alsText(z));

if (mitLoesung) {
  const l = solve(z);
  console.log(`\nKuerzeste Loesung (${l.laenge} Zuege, ${l.knoten} Knoten durchsucht):`);
  const k = klone(z);
  for (let i = 0; i < l.zuege.length; i++) {
    const zug = l.zuege[i]!;
    if (zug.art === 'schuetteln') {
      const ergebnis = farbeVon(anwenden(k, zug).farbe);
      console.log(`  ${String(i + 1).padStart(2)}. Shaker ${zug.behaelter - level.glaeser} schuetteln  -> ${ergebnis.emoji} ${ergebnis.id}`);
    } else {
      const e = anwenden(k, zug);
      const wohin = zug.nach >= level.glaeser ? `Shaker ${zug.nach - level.glaeser}` : `Glas ${zug.nach}`;
      const woher = zug.von >= level.glaeser ? `Shaker ${zug.von - level.glaeser}` : `Glas ${zug.von}`;
      console.log(`  ${String(i + 1).padStart(2)}. ${woher} -> ${wohin}  (${e.menge}x ${farbeVon(e.farbe).emoji})`);
    }
  }
  console.log(`\nEndstand:\n${alsText(k)}`);
}
