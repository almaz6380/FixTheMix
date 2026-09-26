// Baut die Levelfolge vor und schreibt sie nach src/levels/folge.json.
//
// Warum vorgebaut und nicht im Browser erzeugt: `generate` laesst den Loeser
// laufen, und der braucht fuer die grossen Bretter Sekunden. Beim Start der
// App darauf zu warten waere der schlechteste erste Eindruck. Die Erzeugung
// gehoert ohnehin nicht aufs Geraet — dort sucht nie jemand, das Optimum
// steht im Level.
//
// WELCHES Level gebaut wird, entscheidet nicht dieses Werkzeug, sondern
// src/engine/kurve.ts. Hier steht nur die Mechanik: Bereich, Fortschritt,
// Zwischenspeichern. Vorher stand die Folge als handgeschriebene Liste von 20
// Stufenindizes in dieser Datei — und mit ihr die Schwierigkeitskurve an der
// falschen Stelle.
//
// Aufruf:
//   node tools/level-bauen.mts                  alle 999 Level
//   node tools/level-bauen.mts --von 1 --bis 40 nur diesen Bereich
//   node tools/level-bauen.mts --neu            Bestand verwerfen
//
// UNTERBRECHBAR: nach jedem Block von 20 Leveln wird die Datei geschrieben.
// Ein Abbruch kostet damit hoechstens 20 Level, nicht den ganzen Lauf — bei
// einer Bauzeit von mehreren Minuten in einem Container, der einschlafen kann,
// ist das der Unterschied zwischen aergerlich und verloren.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { generate } from '../src/engine/generator.ts';
import { ANZAHL_LEVEL, BLOCK, abschnittFuer, seedFuer, stufeFuer } from '../src/engine/kurve.ts';
import type { Level } from '../src/engine/typen.ts';

const ZIEL = new URL('../src/levels/folge.json', import.meta.url);

const arg = (name: string, vorgabe: number): number => {
  const i = process.argv.indexOf(`--${name}`);
  const wert = i >= 0 ? process.argv[i + 1] : undefined;
  return wert === undefined ? vorgabe : Number(wert);
};

const von = Math.max(1, arg('von', 1));
const bis = Math.min(ANZAHL_LEVEL, arg('bis', ANZAHL_LEVEL));
const neu = process.argv.includes('--neu');

if (!Number.isInteger(von) || !Number.isInteger(bis) || von > bis) {
  console.error(`Ungueltiger Bereich: --von ${von} --bis ${bis}`);
  process.exit(1);
}

// Bestand einlesen. Ein Level, das nicht neu gebaut wird, bleibt unveraendert
// stehen — deshalb laesst sich der Lauf in Haeppchen fahren.
const folge: (Level | null)[] = new Array<Level | null>(ANZAHL_LEVEL).fill(null);
if (!neu && existsSync(ZIEL)) {
  const alt = JSON.parse(readFileSync(ZIEL, 'utf8')) as Level[];
  for (let i = 0; i < Math.min(alt.length, ANZAHL_LEVEL); i++) {
    // Nur Version 3 wird uebernommen. Aeltere Formate (Shaker, `start` als
    // Zahlenliste) werden stillschweigend verworfen und neu gebaut.
    if (alt[i]?.version === 3) folge[i] = alt[i]!;
  }
}

/**
 * Die Datei ist immer ein LUECKENLOSER ANFANG der Folge — geschrieben wird bis
 * zum ersten fehlenden Level. Anders geht es nicht: ein JSON-Feld hat keine
 * Loecher, und ein zusammengeschobenes Feld mit Luecken wuerde beim naechsten
 * Einlesen alle Levelnummern verschieben.
 */
function schreibe(): void {
  const fertig: Level[] = [];
  for (const l of folge) {
    if (l === null) break;
    fertig.push(l);
  }
  writeFileSync(ZIEL, `${JSON.stringify(fertig, null, 1)}\n`);
}

for (let nr = 1; nr < von; nr++) {
  if (folge[nr - 1] === null) {
    console.error(
      `--von ${von} wuerde eine Luecke lassen: Level ${nr} fehlt noch. ` +
      `Die Datei muss ein lueckenloser Anfang bleiben, also hier weiter: --von ${nr}`,
    );
    process.exit(1);
  }
}

/**
 * Baut ein Level. Findet `generate` im vorgegebenen Band nichts, wird erst der
 * Nonce-Raum vergroessert und danach das Band um +/-2 geweitet. Bleibt es
 * erfolglos, bricht der Lauf LAUT ab: ein Level ohne bewiesenes Optimum darf
 * nicht in die Folge, daran haengen die drei Sterne.
 */
function baue(nr: number): Level {
  const s = stufeFuer(nr);
  const anlaeufe = [
    { versuche: 40, weiter: 0 },
    { versuche: 200, weiter: 0 },
    { versuche: 200, weiter: 2 },
    { versuche: 400, weiter: 4 },
  ];
  let letzter = '';
  for (const a of anlaeufe) {
    const stufe = {
      ...s,
      zuegeMin: Math.max(1, s.zuegeMin - a.weiter),
      zuegeMax: s.zuegeMax + a.weiter,
    };
    try {
      const l = generate(seedFuer(nr), stufe, { versuche: a.versuche });
      // `generate` setzt stufe: -1, wenn eine freie Schwierigkeit hereinkommt.
      // Hier gehoert der Kurvenabschnitt hinein — gut fuer Protokolle und fuer
      // tools/test-folge.mts.
      return { ...l, stufe: abschnittFuer(nr) };
    } catch (f) {
      letzter = f instanceof Error ? f.message : String(f);
    }
  }
  console.error(
    `\nLevel ${nr} liess sich nicht bauen (${s.glaeser} Glaeser, ${s.farben} Farben, ` +
    `leer ${s.leer}, Band [${s.zuegeMin}, ${s.zuegeMax}]).\n${letzter}`,
  );
  process.exit(1);
}

const t0 = Date.now();
let gebaut = 0;

for (let block = Math.floor((von - 1) / BLOCK) * BLOCK + 1; block <= bis; block += BLOCK) {
  const a = Math.max(block, von);
  const b = Math.min(block + BLOCK - 1, bis);
  const tBlock = Date.now();
  const optima: number[] = [];
  for (let nr = a; nr <= b; nr++) {
    const l = baue(nr);
    folge[nr - 1] = l;
    optima.push(l.optimalZuege);
    gebaut++;
  }
  schreibe();

  const msBlock = Date.now() - tBlock;
  const proLevel = msBlock / (b - a + 1);
  const restLevel = bis - b;
  const rest = (restLevel * (Date.now() - t0)) / gebaut / 1000;
  const s = stufeFuer(a);
  // Ein Block von 20 kann zwei Kurvenabschnitte beruehren — dann steht ein '+'
  // hinter dem Aufbau, damit die Zeile nicht mehr behauptet, als sie weiss.
  const gemischt = abschnittFuer(a) !== abschnittFuer(b) ? '+' : ' ';
  console.log(
    `  Level ${String(a).padStart(3)}–${String(b).padEnd(3)} ` +
    `${s.glaeser}G/${s.farben}F/leer${s.leer}${gemischt}`.padEnd(15) +
    ` Optima ${Math.min(...optima)}–${Math.max(...optima)}  ` +
    `${proLevel.toFixed(0).padStart(5)} ms/Level` +
    (restLevel > 0 ? `  noch ${restLevel} Level, ~${rest.toFixed(0)} s` : ''),
  );
}

const fertig = folge.filter((l) => l !== null).length;
console.log(
  `\n${gebaut} Level gebaut in ${((Date.now() - t0) / 1000).toFixed(1)} s. ` +
  `src/levels/folge.json enthaelt jetzt ${fertig} von ${ANZAHL_LEVEL}.`,
);
if (fertig < ANZAHL_LEVEL) {
  const fehlt: number[] = [];
  for (let i = 0; i < ANZAHL_LEVEL; i++) if (folge[i] === null) fehlt.push(i + 1);
  console.log(
    `Es fehlen ${fehlt.length} Level, ab Nummer ${fehlt[0]}. ` +
    `Weiter mit: node tools/level-bauen.mts --von ${fehlt[0]}`,
  );
}
