// Zeigt ein erzeugtes Level und seine kuerzeste Loesung als Text.
//
// Zweck: beurteilen, ob sich die Level GUT ANFUEHLEN — die Tests sagen nur,
// ob sie loesbar sind. Vor Phase 2 gibt es keine Oberflaeche, und ohne so
// eine Ausgabe baut man die Stufen blind.
//
// ZWEI Betriebsarten, weil es zwei Leitern gibt (siehe CLAUDE.md):
//   --level 120   Level 120 der ausgelieferten Folge, aus src/engine/kurve.ts
//   --stufe 5     ein Level der groben STUFEN-Leiter, fuer Handproben am Loeser
//
// Aufruf: node tools/zeige-level.mts --level 120 --loesung
//         node tools/zeige-level.mts --stufe 5 --seed 7 --loesung
import { generate, STUFEN } from '../src/engine/generator.ts';
import { ANZAHL_LEVEL, abschnittFuer, ABSCHNITTE, seedFuer, stufeFuer } from '../src/engine/kurve.ts';
import { solve } from '../src/engine/loeser.ts';
import { alsText, klone, standAusLevel } from '../src/engine/zustand.ts';
import { anwenden } from '../src/engine/zuege.ts';
import type { Level } from '../src/engine/typen.ts';

const arg = (name: string, vorgabe: number): number => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : vorgabe;
};
const mitLoesung = process.argv.includes('--loesung');
const nr = arg('level', 0);

let level: Level;
let kopf: string;
let ms: number;

if (nr > 0) {
  if (nr > ANZAHL_LEVEL) {
    console.log(`Die Folge hat ${ANZAHL_LEVEL} Level, ${nr} liegt darueber.`);
    process.exit(1);
  }
  const s = stufeFuer(nr);
  const t0 = Date.now();
  level = generate(seedFuer(nr), s);
  ms = Date.now() - t0;
  kopf =
    `Level ${nr} der Folge — Abschnitt ${abschnittFuer(nr)} ` +
    `"${ABSCHNITTE[abschnittFuer(nr)]!.name}", Seed ${seedFuer(nr)}  (erzeugt in ${ms} ms)\n` +
    `Aufbau: ${s.glaeser} Glaeser, ${s.farben} Farben, ${s.leer} leer, ` +
    `${s.schritte} Rueckwaertsschritte, Band [${s.zuegeMin}, ${s.zuegeMax}]`;
} else {
  const stufe = arg('stufe', 5);
  const seed = arg('seed', 7);
  const s = STUFEN[stufe];
  if (!s) {
    console.log(`Stufe ${stufe} gibt es nicht. Vorhanden: ${STUFEN.map((x, i) => `${i}=${x.name}`).join(', ')}`);
    process.exit(1);
  }
  const t0 = Date.now();
  level = generate(seed, stufe);
  ms = Date.now() - t0;
  kopf = `Stufe ${stufe} "${s.name}", Seed ${seed}  (erzeugt in ${ms} ms)`;
}

const z = standAusLevel(level);

console.log(kopf);
console.log(`${level.glaeser} Glaeser, Hoehe ${level.hoehe}`);
console.log(`Optimum ${level.optimalZuege} Zuege`);
console.log(`Sterne: 3 bei <= ${level.sterne.drei}, 2 bei <= ${level.sterne.zwei}, sonst 1\n`);
console.log(alsText(z));

if (mitLoesung) {
  const l = solve(z);
  console.log(`\nKuerzeste Loesung (${l.laenge} Zuege, ${l.knoten} Knoten durchsucht):`);
  const k = klone(z);
  for (let i = 0; i < l.zuege.length; i++) {
    const zug = l.zuege[i]!;
    const e = anwenden(k, zug);
    console.log(`  ${String(i + 1).padStart(2)}. Glas ${zug.von} -> Glas ${zug.nach}  (${e.menge}x)`);
  }
  console.log(`\nEndstand:\n${alsText(k)}`);
}
