// Prueft Undo-Stapel und Wiedergabe. Die Wiedergabe ist die Vorstufe des
// Schummelschutzes: dieselbe Funktion spielt in Phase 4 serverseitig nach,
// was der Client behauptet gespielt zu haben.
// Aufruf: npx tsx tools/test-wiedergabe.mts
// Schneller: node tools/test-wiedergabe.mts
import { codeVon } from '../src/engine/farben.ts';
import { generate } from '../src/engine/generator.ts';
import { solve } from '../src/engine/loeser.ts';
import { Partie } from '../src/engine/verlauf.ts';
import { replay, replayAusSeed } from '../src/engine/wiedergabe.ts';
import { legaleZuege } from '../src/engine/zuege.ts';
import { schluessel, standAusLevel, leererStand } from '../src/engine/zustand.ts';
import { zufall } from '../src/engine/zufall.ts';
import type { Level, Zug } from '../src/engine/typen.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

/** Ein Level mit Shaker, damit auch der Schuettelzug mitgeprueft wird. */
const mischLevel: Level = generate(11, 5);
const fixLevel: Level = generate(3, 2);

console.log('--- Undo-Stapel ---');
{
  const p = new Partie(fixLevel);
  const vorher = schluessel(p.zustand);
  const zug = legaleZuege(p.zustand)[0]!;
  const e = p.pour((zug as { von: number }).von, (zug as { nach: number }).nach);
  ok(e.ok, 'ein erlaubter Zug geht durch');
  ok(schluessel(p.zustand) !== vorher, '... und veraendert den Stand');
  ok(p.undo(), 'undo() meldet Erfolg');
  ok(schluessel(p.zustand) === vorher, '... und stellt den Stand bitgenau wieder her');
  ok(p.zugzahl === 0, 'die Zugzahl faellt wieder auf 0');
}
{
  // Der Fall, den ein naiver Undo falsch macht: aus vier Orange geht nicht
  // hervor, ob vorher r,r,g,g oder r,g,g,r im Shaker stand.
  const z = leererStand(2, 1, 4);
  const setze = (b: number, farben: string[]) => {
    for (let i = 0; i < farben.length; i++) z.zellen[b * 4 + i] = codeVon(farben[i]! as 'rot');
    z.fuell[b] = farben.length;
  };
  setze(2, ['rot', 'gelb', 'gelb', 'rot']);
  const level: Level = {
    version: 1, seed: 0, stufe: -1, hoehe: 4, glaeser: 2, shaker: 1,
    start: Array.from(z.zellen), optimalZuege: 1, schuettelZuege: 1,
    sterne: { drei: 1, zwei: 2 },
  };
  const p = new Partie(level);
  const vorher = Array.from(p.zustand.zellen);
  ok(p.shake(2).ok, 'der volle Shaker laesst sich schuetteln');
  ok(p.undo(), 'undo() nach dem Schuetteln meldet Erfolg');
  ok(JSON.stringify(Array.from(p.zustand.zellen)) === JSON.stringify(vorher),
     'die GENAUE Schichtung r,g,g,r ist wieder da (nicht nur "zwei Rot, zwei Gelb")');
}
{
  const p = new Partie(fixLevel);
  const r = zufall(99, 1);
  let gespielt = 0;
  const start = schluessel(p.zustand);
  for (let i = 0; i < 150; i++) {
    const moeglich = legaleZuege(p.zustand);
    if (moeglich.length === 0) break;
    const zug = r.zieh(moeglich);
    if (zug.art === 'giessen') p.pour(zug.von, zug.nach); else p.shake(zug.behaelter);
    gespielt++;
  }
  ok(gespielt > 20, `genug Zuege fuer die Probe gespielt (${gespielt})`);
  while (p.undo()) { /* alles zuruecknehmen */ }
  ok(schluessel(p.zustand) === start, `${gespielt} Zuege und ebenso viele Undos fuehren zum Start zurueck`);
  ok(!p.kannUndo(), 'der Stapel ist danach leer');
  ok(!p.undo(), 'undo() auf leerem Stapel meldet false');
}
{
  const p = new Partie(fixLevel);
  const vorher = schluessel(p.zustand);
  const e = p.pour(0, 99);
  ok(!e.ok && e.grund === 'index', 'ein Zug ins Nichts wird abgelehnt (ohne Ausnahme)');
  ok(!p.kannUndo(), 'ein ABGELEHNTER Zug landet nicht auf dem Undo-Stapel');
  ok(p.zugzahl === 0, '... und zaehlt nicht als Zug');
  ok(schluessel(p.zustand) === vorher, '... und laesst den Stand unveraendert');
}
{
  const p = new Partie(fixLevel);
  const start = schluessel(p.zustand);
  const zug = legaleZuege(p.zustand)[0] as { von: number; nach: number };
  p.pour(zug.von, zug.nach);
  p.neustart();
  ok(schluessel(p.zustand) === start && p.zugzahl === 0, 'neustart() setzt Stand und Protokoll zurueck');
}

console.log('\n--- Wiedergabe: der ehrliche Fall ---');
for (const [name, level] of [['Fix-Level', fixLevel], ['Misch-Level', mischLevel]] as const) {
  const l = solve(standAusLevel(level));
  const e = replay(level, l.zuege);
  ok(e.gueltig && e.geloest, `${name}: die optimale Zugfolge ist gueltig und loest`);
  ok(e.zuege === level.optimalZuege, `${name}: die gezaehlte Zugzahl stimmt`);
  ok(e.sterne === 3, `${name}: das Optimum gibt drei Sterne`);
  ok(e.fehlerIndex === -1 && e.grund === '', `${name}: kein Fehler gemeldet`);
}
{
  const vorher = JSON.stringify(fixLevel);
  replay(fixLevel, solve(standAusLevel(fixLevel)).zuege);
  ok(JSON.stringify(fixLevel) === vorher, 'replay() veraendert das uebergebene Level nicht');
}
{
  const l = solve(standAusLevel(mischLevel));
  ok(l.zuege.some((t) => t.art === 'schuetteln'), 'die Misch-Loesung enthaelt einen Schuettelzug');
  ok(replay(mischLevel, l.zuege).geloest, '... und wird korrekt nachgespielt');
}

console.log('\n--- Wiedergabe: manipulierte Folgen ---');
{
  const l = solve(standAusLevel(fixLevel));
  const gekuerzt = l.zuege.slice(0, l.zuege.length - 2);
  const e = replay(fixLevel, gekuerzt);
  ok(e.gueltig && !e.geloest, 'eine abgebrochene Folge ist gueltig, loest aber nicht');
  ok(e.sterne === 0, '... und gibt null Sterne');
}
{
  const l = solve(standAusLevel(fixLevel));
  const verdreht = l.zuege.slice();
  const i = 2;
  const g = verdreht[i] as { art: 'giessen'; von: number; nach: number };
  verdreht[i] = { art: 'giessen', von: g.nach, nach: g.von };
  const e = replay(fixLevel, verdreht);
  ok(!e.gueltig, 'ein vertauschter Zug macht die Folge ungueltig');
  ok(e.fehlerIndex === i, `... und der Fehlerindex zeigt genau darauf (${e.fehlerIndex})`);
  ok(e.grund !== '', `... mit benanntem Grund (${e.grund})`);
  ok(e.zuege === i, '... und die Zuege danach werden nicht mehr ausgefuehrt');
}
{
  const l = solve(standAusLevel(fixLevel));
  const erfunden: Zug[] = [...l.zuege.slice(0, 3), { art: 'giessen', von: 0, nach: 77 }, ...l.zuege.slice(3)];
  const e = replay(fixLevel, erfunden);
  ok(!e.gueltig && e.grund === 'index' && e.fehlerIndex === 3, 'ein erfundener Behaelter wird abgelehnt, nicht geworfen');
}
{
  const e = replay(fixLevel, [{ art: 'schuetteln', behaelter: 0 }]);
  ok(!e.gueltig && e.grund === 'kein-shaker', 'Schuetteln eines Glases wird abgelehnt');
}
{
  const viele: Zug[] = Array.from({ length: 20 }, () => ({ art: 'giessen', von: 0, nach: 1 }));
  const e = replay(fixLevel, viele, { maxZuege: 5 });
  ok(!e.gueltig && e.zuege === 0, 'eine zu lange Folge wird abgelehnt, OHNE sie zu spielen');
}

console.log('\n--- Sterne unter dem Optimum ---');
{
  // Ein Spieler, der einen Umweg macht: ein erster Zug, der NICHT auf einem
  // kuerzesten Weg liegt, danach optimal weiter.
  //
  // FALLE, in die dieser Test schon getappt ist: „irgendein anderer erster
  // Zug" genuegt nicht. Es gibt meist mehrere kuerzeste Loesungen, und ein
  // abweichender erster Zug landet oft auf einer davon — die Folge war dann
  // genauso lang wie das Optimum. Gesucht ist also ein Zug, nach dem die
  // Restloesung nachweislich laenger ausfaellt.
  const { klone } = await import('../src/engine/zustand.ts');
  const { anwenden } = await import('../src/engine/zuege.ts');
  const z = standAusLevel(fixLevel);
  const optimum = fixLevel.optimalZuege;

  let folge: Zug[] | null = null;
  for (const kandidat of legaleZuege(z)) {
    const k = klone(z);
    anwenden(k, kandidat);
    const rest = solve(k);
    if (rest.status !== 'optimal') continue;
    if (1 + rest.laenge > optimum) { folge = [kandidat, ...rest.zuege]; break; }
  }
  ok(folge !== null, 'es gibt einen ersten Zug abseits jedes kuerzesten Weges');
  if (folge) {
    const e = replay(fixLevel, folge);
    ok(e.gueltig && e.geloest, 'der Umweg loest das Level ebenfalls');
    ok(e.zuege > optimum, `... braucht aber mehr Zuege (${e.zuege} statt ${optimum})`);
    const erwartet = e.zuege <= fixLevel.sterne.zwei ? 2 : 1;
    ok(e.sterne === erwartet, `... und bekommt ${erwartet} statt 3 Sterne`);
    ok(replay(fixLevel, folge.slice(0, -1)).sterne === 0, 'dieselbe Folge ohne den letzten Zug gibt null Sterne');
  }
}

console.log('\n--- Wiedergabe aus dem Seed (der Weg der Edge Function) ---');
{
  const l = solve(standAusLevel(fixLevel));
  const a = replay(fixLevel, l.zuege);
  const b = replayAusSeed(fixLevel.seed, fixLevel.stufe, l.zuege);
  ok(b.gueltig === a.gueltig && b.geloest === a.geloest && b.sterne === a.sterne,
     'das aus dem Seed neu gebaute Brett liefert dasselbe Ergebnis');
  ok(schluessel(b.endstand) === schluessel(a.endstand), '... und denselben Endstand');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
