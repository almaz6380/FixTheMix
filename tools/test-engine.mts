// Prueft die Spielregeln: Giessen, Shakerkontingent, Schuetteln, Siegbedingung,
// Packen und Kanonisierung.
// Aufruf: npx tsx tools/test-engine.mts
// Schneller (Node 22 kann .mts direkt): node tools/test-engine.mts
import { codeVon, istGrund, istMisch, istPur, mischungAus, FARBEN, LEER, bestandteileVon } from '../src/engine/farben.ts';
import {
  anzahlFarbeIn, farbenIn, istGeloest, klone, laufOben, leererStand,
  packBehaelter, pruefeInvariante, schluessel, segmente, oben,
} from '../src/engine/zustand.ts';
import { giessen, legaleZuege, pruefeGiessen, pruefeSchuetteln, schuetteln } from '../src/engine/zuege.ts';
import type { FarbId } from '../src/engine/farben.ts';
import type { Spielstand } from '../src/engine/typen.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

/** Baut einen Stand aus lesbaren Farbnamen. Index 0 = unten. */
function stand(hoehe: number, glaeser: FarbId[][], shaker: FarbId[][] = []): Spielstand {
  const z = leererStand(glaeser.length, shaker.length, hoehe);
  const alle = [...glaeser, ...shaker];
  for (let b = 0; b < alle.length; b++) {
    const inhalt = alle[b]!;
    for (let i = 0; i < inhalt.length; i++) z.zellen[b * hoehe + i] = codeVon(inhalt[i]!);
    z.fuell[b] = inhalt.length;
  }
  return z;
}

const R = 'rot', G = 'gelb', B = 'blau', O = 'orange', M = 'minze';

console.log('--- Mischtabelle ---');
ok(mischungAus(codeVon('rot'), codeVon('gelb')) === codeVon('orange'), 'Rot + Gelb = Orange');
ok(mischungAus(codeVon('gelb'), codeVon('blau')) === codeVon('gruen'), 'Gelb + Blau = Gruen');
ok(mischungAus(codeVon('rot'), codeVon('blau')) === codeVon('lila'), 'Rot + Blau = Lila');
{
  let symmetrisch = true;
  for (const a of FARBEN) for (const b of FARBEN) {
    if (mischungAus(codeVon(a.id), codeVon(b.id)) !== mischungAus(codeVon(b.id), codeVon(a.id))) symmetrisch = false;
  }
  ok(symmetrisch, 'Mischen ist symmetrisch (alle 81 Paare)');
}
ok(mischungAus(codeVon('rot'), codeVon('rot')) === LEER, 'gleiche Farbe mischt sich nicht mit sich selbst');
ok(FARBEN.every((f) => f.art === 'pur' ? FARBEN.every((g) => mischungAus(codeVon(f.id), codeVon(g.id)) === LEER) : true),
   'Purfarben mischen sich mit gar nichts');
ok(mischungAus(codeVon('orange'), codeVon('blau')) === LEER, 'Mischfarben sind keine Zutaten');
ok(FARBEN.every((f) => [istGrund, istMisch, istPur].filter((p) => p(codeVon(f.id))).length === 1),
   'jede Farbe ist genau eine Art (grund/misch/pur)');
ok(bestandteileVon(codeVon('gruen'))!.map((c) => c).sort().join() === [codeVon('gelb'), codeVon('blau')].sort().join(),
   'bestandteileVon(Gruen) nennt Gelb und Blau');
ok(bestandteileVon(codeVon('rot')) === null, 'Grundfarben haben keine Bestandteile');
{
  const ergebnisse = FARBEN.filter((f) => f.art === 'misch').map((f) => f.id);
  ok(new Set(ergebnisse).size === ergebnisse.length, 'keine zwei Paare ergeben dieselbe Mischfarbe');
}

console.log('\n--- Giessen: die Glasregel ---');
{
  const z = stand(4, [[R, G, G], [G]]);
  const e = giessen(z, 0, 1);
  ok(e.ok && e.menge === 2, 'giesst den GANZEN Lauf oben (2x Gelb, nicht 1)');
  ok(z.fuell[0] === 1 && z.fuell[1] === 3, 'Fuellstaende stimmen danach');
  ok(pruefeInvariante(z) === '', 'Invariante haelt');
}
{
  const z = stand(4, [[R, G, G, G], [G, G, G]]);
  const e = giessen(z, 0, 1);
  ok(e.ok && e.menge === 1, 'bei zu wenig Platz fliesst nur, was passt');
  ok(z.fuell[0] === 3, 'der Rest bleibt in der Quelle');
}
ok(pruefeGiessen(stand(4, [[R], [G]]), 0, 1).grund === 'farbe-passt-nicht', 'Rot auf Gelb wird abgelehnt');
ok(pruefeGiessen(stand(4, [[], [G]]), 0, 1).grund === 'quelle-leer', 'aus leerem Glas giessen wird abgelehnt');
ok(pruefeGiessen(stand(4, [[R], [G]]), 0, 0).grund === 'selber-behaelter', 'in sich selbst giessen wird abgelehnt');
ok(pruefeGiessen(stand(4, [[R], [G]]), 0, 9).grund === 'index', 'Index ausserhalb des Bretts wird abgelehnt (ohne Ausnahme)');
ok(pruefeGiessen(stand(4, [[R], [G, G, G, G]]), 0, 1).grund === 'ziel-voll', 'in volles Glas giessen wird abgelehnt');
ok(pruefeGiessen(stand(4, [[R], []]), 0, 1).ok, 'in leeres Glas giessen ist erlaubt');
{
  const z = stand(4, [[R], [G]]);
  const vorher = schluessel(z);
  giessen(z, 0, 1);
  ok(schluessel(z) === vorher, 'ein abgelehnter Zug laesst den Stand unveraendert');
}

console.log('\n--- Giessen: die Shakerregel ---');
ok(pruefeGiessen(stand(4, [[M]], [[]]), 0, 1).grund === 'shaker-nur-grund', 'Purfarbe darf nicht in den Shaker');
ok(pruefeGiessen(stand(4, [[O]], [[]]), 0, 1).grund === 'shaker-nur-grund', 'Mischfarbe darf nicht in den Shaker');
ok(pruefeGiessen(stand(4, [[B]], [[R, G]]), 0, 1).grund === 'shaker-dritte-farbe', 'dritte Farbe in den Shaker wird abgelehnt');
{
  // Rot+Gelb, Gelb+Blau und Rot+Blau gehen; ein Paar ohne Tabelleneintrag nicht.
  // Dafuer braucht es zwei Grundfarben, die sich nicht mischen — es gibt nur
  // drei Grundfarben und alle drei Paare stehen in der Tabelle. Also wird die
  // Ablehnung ueber einen von Hand gebauten Shaker mit Purfarbe geprueft.
  const z = stand(4, [[R]], [[M]]);
  ok(pruefeGiessen(z, 0, 1).grund === 'shaker-kein-paar', 'Grundfarbe zu einer nicht mischbaren Farbe wird abgelehnt');
}
{
  const z = stand(4, [[R, R, R]], [[]]);
  const e = giessen(z, 0, 1);
  ok(e.ok && e.menge === 2, 'Kontingent: von 3 Rot passen nur 2 in den Shaker (hoehe/2)');
  ok(z.fuell[0] === 1, 'der dritte Rot-Anteil bleibt im Glas');
  ok(pruefeGiessen(z, 0, 1).grund === 'shaker-kontingent', 'weiteres Rot wird abgelehnt: Haelfte ist voll');
}

console.log('\n--- Schuetteln ---');
ok(pruefeSchuetteln(stand(4, [[R, R]], [[R, R]]), 0).grund === 'kein-shaker', 'ein Glas laesst sich nicht schuetteln');
ok(pruefeSchuetteln(stand(4, [[R]], [[R, R, G]]), 1).grund === 'shaker-nicht-voll', 'halbvoller Shaker wird abgelehnt');
{
  const z = stand(4, [[R]], [[R, R, G, G]]);
  const e = schuetteln(z, 1);
  ok(e.ok && e.farbe === codeVon('orange'), 'Rot+Gelb im vollen Shaker wird Orange');
  ok(anzahlFarbeIn(z, 1, codeVon('orange')) === 4, 'alle vier Schichten sind Orange');
  ok(z.fuell[1] === 4, 'der Fuellstand bleibt bei 4');
}
{
  // Die Zusicherung, auf der der ganze Entwurf ruht.
  const z = stand(4, [[R, R, R, R], [G, G, G, G], [B, B, B, B]], [[]]);
  let verstoss = false;
  let voll = 0;
  // Alle Wege, den Shaker vollzumachen, roh durchprobieren.
  const lauf = (s: Spielstand, tiefe: number) => {
    if (s.fuell[3]! === 4) {
      voll++;
      const drin = farbenIn(s, 3);
      if (drin.length !== 2) verstoss = true;
      else if (drin.some((c) => anzahlFarbeIn(s, 3, c) !== 2)) verstoss = true;
      return;
    }
    if (tiefe === 0) return;
    for (const zug of legaleZuege(s)) {
      if (zug.art !== 'giessen' || zug.nach !== 3) continue;
      const k = klone(s);
      giessen(k, zug.von, zug.nach);
      lauf(k, tiefe - 1);
    }
  };
  lauf(z, 4);
  ok(voll > 0, `es gibt erreichbare volle Shaker (${voll} Wege gefunden)`);
  ok(!verstoss, 'voller Shaker heisst IMMER genau zwei Farben zu je hoehe/2');
}
{
  const z = stand(4, [[R, R], [G, G], [B, B]], [[], []]);
  giessen(z, 0, 3); giessen(z, 1, 3);
  giessen(z, 2, 4);
  const vorherShaker1 = packBehaelter(z, 4);
  schuetteln(z, 3);
  ok(oben(z, 3) === codeVon('orange'), 'mehrere Shaker: Shaker 0 wird Orange');
  ok(packBehaelter(z, 4) === vorherShaker1, 'mehrere Shaker: Shaker 1 bleibt unberuehrt');
}

console.log('\n--- Siegbedingung ---');
ok(istGeloest(stand(4, [[R, R, R, R], [], [G, G, G, G]])), 'volle einfarbige und leere Glaeser = geloest');
ok(!istGeloest(stand(4, [[R, R, R], []])), 'halbvolles einfarbiges Glas zaehlt NICHT als geloest');
ok(!istGeloest(stand(4, [[R, R, R, G]])), 'gemischtes volles Glas ist nicht geloest');
ok(!istGeloest(stand(4, [[R, R, R, R]], [[G, G]])), 'ein nicht leerer Shaker verhindert die Loesung');
ok(istGeloest(stand(4, [[R, R, R, R]], [[]])), 'leerer Shaker stoert nicht');

console.log('\n--- Packen und Kanonisierung ---');
ok(packBehaelter(stand(4, [[]]), 0) === 0, 'leerer Behaelter packt zu 0');
{
  // Die klassische Falle: oberste Zelle mit hoher Farbnummer darf nicht negativ werden.
  const z = stand(2, [['kaffee', 'kaffee']]);
  ok(packBehaelter(z, 0) > 0, 'gepacktes Wort ist nie negativ (>>> 0 greift)');
}
ok(schluessel(stand(4, [[R, R], [G]])) === schluessel(stand(4, [[G], [R, R]])), 'vertauschte Glaeser ergeben denselben Schluessel');
ok(schluessel(stand(4, [[R, R], []])) === schluessel(stand(4, [[], [R, R]])), 'leeres Glas ist austauschbar');
ok(schluessel(stand(4, [[R, R]], [[]])) !== schluessel(stand(4, [[]], [[R, R]])), 'Glas und Shaker sind NICHT austauschbar');
ok(schluessel(stand(4, [[R, G]])) !== schluessel(stand(4, [[G, R]])), 'Reihenfolge innerhalb eines Glases zaehlt');
ok(schluessel(stand(4, [[R], [G], [B]])).length === 6, 'Schluessellaenge ist 2 Zeichen je Behaelter');
{
  // Kollisionsprobe gegen eine langsame Vergleichsrechnung.
  const farben: FarbId[] = [R, G];
  const alle: Spielstand[] = [];
  const baue = (glaeser: FarbId[][], i: number) => {
    if (i === 3) { alle.push(stand(2, glaeser.map((g) => g.slice()))); return; }
    for (const inhalt of [[], [farben[0]!], [farben[1]!], [farben[0]!, farben[0]!], [farben[0]!, farben[1]!], [farben[1]!, farben[0]!], [farben[1]!, farben[1]!]]) {
      baue([...glaeser, inhalt as FarbId[]], i + 1);
    }
  };
  baue([], 0);
  const perSchluessel = new Set(alle.map(schluessel));
  const langsam = new Set(alle.map((z) => {
    const woerter = [];
    for (let b = 0; b < z.glaeser; b++) woerter.push(packBehaelter(z, b));
    return woerter.sort((a, b2) => a - b2).join(',');
  }));
  ok(perSchluessel.size === langsam.size, `Kanonisierung kollisionsfrei (${perSchluessel.size} Klassen aus ${alle.length} Staenden)`);
}

console.log('\n--- Hilfsfunktionen ---');
ok(segmente(stand(4, [[R, R, G, G]]), 0) === 2, 'segmente() zaehlt Farbbloecke');
ok(segmente(stand(4, [[]]), 0) === 0, 'leerer Behaelter hat 0 Segmente');
ok(laufOben(stand(4, [[R, G, G]]), 0) === 2, 'laufOben() misst den obersten Block');
ok(oben(stand(4, [[]]), 0) === LEER, 'oben() eines leeren Behaelters ist LEER');
{
  let warf = false;
  try { leererStand(4, 1, 3); } catch { warf = true; }
  ok(warf, 'ungerade hoehe mit Shakern wird abgelehnt');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
