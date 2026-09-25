// Prueft Undo-Stapel und Wiedergabe. Die Wiedergabe ist die Vorstufe des
// Schummelschutzes: dieselbe Funktion spielt in Phase 4 serverseitig nach,
// was der Client behauptet gespielt zu haben.
// Aufruf: npx tsx tools/test-wiedergabe.mts
// Schneller: node tools/test-wiedergabe.mts
import { generate } from '../src/engine/generator.ts';
import { solve } from '../src/engine/loeser.ts';
import { Partie } from '../src/engine/verlauf.ts';
import { replay, replayAusSeed } from '../src/engine/wiedergabe.ts';
import { anwenden, legaleZuege } from '../src/engine/zuege.ts';
import { klone, schluessel, standAusLevel } from '../src/engine/zustand.ts';
import { zufall } from '../src/engine/zufall.ts';
import type { Level, Zug } from '../src/engine/typen.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

const level: Level = generate(3, 2);

console.log('--- Undo-Stapel ---');
{
  const p = new Partie(level);
  const vorher = schluessel(p.zustand);
  const zug = legaleZuege(p.zustand)[0]!;
  ok(p.pour(zug.von, zug.nach).ok, 'ein erlaubter Zug geht durch');
  ok(schluessel(p.zustand) !== vorher, '... und veraendert den Stand');
  ok(p.undo(), 'undo() meldet Erfolg');
  ok(schluessel(p.zustand) === vorher, '... und stellt den Stand bitgenau wieder her');
  ok(p.zugzahl === 0, 'die Zugzahl faellt wieder auf 0');
}
{
  const p = new Partie(level);
  const r = zufall(99, 1);
  const start = schluessel(p.zustand);
  let gespielt = 0;
  for (let i = 0; i < 200; i++) {
    const moeglich = legaleZuege(p.zustand);
    if (moeglich.length === 0) break;
    const zug = r.zieh(moeglich);
    p.pour(zug.von, zug.nach);
    gespielt++;
  }
  ok(gespielt > 40, `genug Zuege fuer die Probe gespielt (${gespielt})`);
  while (p.undo()) { /* alles zuruecknehmen */ }
  ok(schluessel(p.zustand) === start, `${gespielt} Zuege und ebenso viele Undos fuehren zum Start zurueck`);
  ok(!p.kannUndo(), 'der Stapel ist danach leer');
  ok(!p.undo(), 'undo() auf leerem Stapel meldet false');
}
{
  const p = new Partie(level);
  const vorher = schluessel(p.zustand);
  const e = p.pour(0, 99);
  ok(!e.ok && e.grund === 'index', 'ein Zug ins Nichts wird abgelehnt (ohne Ausnahme)');
  ok(!p.kannUndo(), 'ein ABGELEHNTER Zug landet nicht auf dem Undo-Stapel');
  ok(p.zugzahl === 0, '... und zaehlt nicht als Zug');
  ok(schluessel(p.zustand) === vorher, '... und laesst den Stand unveraendert');
}
{
  const p = new Partie(level);
  const start = schluessel(p.zustand);
  const zug = legaleZuege(p.zustand)[0]!;
  p.pour(zug.von, zug.nach);
  p.neustart();
  ok(schluessel(p.zustand) === start && p.zugzahl === 0, 'neustart() setzt Stand und Protokoll zurueck');
}
{
  const p = new Partie(level);
  const l = solve(p.zustand);
  for (const zug of l.zuege) p.pour(zug.von, zug.nach);
  ok(p.isSolved(), 'die Loeserfolge loest die Partie');
  ok(p.sterne() === 3, '... und gibt drei Sterne');
  ok(p.zuege.length === l.laenge, 'das Protokoll hat genau die Laenge der Loesung');
}

console.log('\n--- Wiedergabe: der ehrliche Fall ---');
{
  const l = solve(standAusLevel(level));
  const e = replay(level, l.zuege);
  ok(e.gueltig && e.geloest, 'die optimale Zugfolge ist gueltig und loest');
  ok(e.zuege === level.optimalZuege, 'die gezaehlte Zugzahl stimmt');
  ok(e.sterne === 3, 'das Optimum gibt drei Sterne');
  ok(e.fehlerIndex === -1 && e.grund === '', 'kein Fehler gemeldet');
}
{
  const vorher = JSON.stringify(level);
  replay(level, solve(standAusLevel(level)).zuege);
  ok(JSON.stringify(level) === vorher, 'replay() veraendert das uebergebene Level nicht');
}

console.log('\n--- Wiedergabe: manipulierte Folgen ---');
{
  const l = solve(standAusLevel(level));
  const e = replay(level, l.zuege.slice(0, l.zuege.length - 2));
  ok(e.gueltig && !e.geloest, 'eine abgebrochene Folge ist gueltig, loest aber nicht');
  ok(e.sterne === 0, '... und gibt null Sterne');
}
{
  const l = solve(standAusLevel(level));
  const verdreht = l.zuege.slice();
  const i = 2;
  const g = verdreht[i]!;
  verdreht[i] = { von: g.nach, nach: g.von };
  const e = replay(level, verdreht);
  ok(!e.gueltig, 'ein vertauschter Zug macht die Folge ungueltig');
  ok(e.fehlerIndex === i, `... und der Fehlerindex zeigt genau darauf (${e.fehlerIndex})`);
  ok(e.grund !== '', `... mit benanntem Grund (${e.grund})`);
  ok(e.zuege === i, '... und die Zuege danach werden nicht mehr ausgefuehrt');
}
{
  const l = solve(standAusLevel(level));
  const erfunden: Zug[] = [...l.zuege.slice(0, 3), { von: 0, nach: 77 }, ...l.zuege.slice(3)];
  const e = replay(level, erfunden);
  ok(!e.gueltig && e.grund === 'index' && e.fehlerIndex === 3, 'ein erfundenes Glas wird abgelehnt, nicht geworfen');
}
{
  const viele: Zug[] = Array.from({ length: 20 }, () => ({ von: 0, nach: 1 }));
  const e = replay(level, viele, { maxZuege: 5 });
  ok(!e.gueltig && e.zuege === 0, 'eine zu lange Folge wird abgelehnt, OHNE sie zu spielen');
}

console.log('\n--- Sterne unter dem Optimum ---');
{
  // FALLE, in die dieser Test schon getappt ist: „irgendein anderer erster
  // Zug" genuegt nicht. Es gibt meist mehrere kuerzeste Loesungen, und ein
  // abweichender erster Zug landet oft auf einer davon. Gesucht ist ein Zug,
  // nach dem die Restloesung nachweislich laenger ausfaellt.
  const z = standAusLevel(level);
  const optimum = level.optimalZuege;
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
    const e = replay(level, folge);
    ok(e.gueltig && e.geloest, 'der Umweg loest das Level ebenfalls');
    ok(e.zuege > optimum, `... braucht aber mehr Zuege (${e.zuege} statt ${optimum})`);
    const erwartet = e.zuege <= level.sterne.zwei ? 2 : 1;
    ok(e.sterne === erwartet, `... und bekommt ${erwartet} statt 3 Sterne`);
    ok(replay(level, folge.slice(0, -1)).sterne === 0, 'dieselbe Folge ohne den letzten Zug gibt null Sterne');
  }
}

console.log('\n--- Wiedergabe aus dem Seed (der Weg der Edge Function) ---');
{
  const l = solve(standAusLevel(level));
  const a = replay(level, l.zuege);
  const b = replayAusSeed(level.seed, level.stufe, l.zuege);
  ok(b.gueltig === a.gueltig && b.geloest === a.geloest && b.sterne === a.sterne,
     'das aus dem Seed neu gebaute Brett liefert dasselbe Ergebnis');
  ok(schluessel(b.endstand) === schluessel(a.endstand), '... und denselben Endstand');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
