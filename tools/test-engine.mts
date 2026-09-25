// Prueft die Spielregeln: Giessen, Siegbedingung, Packen und Kanonisierung.
// Aufruf: npx tsx tools/test-engine.mts
// Schneller (Node 22 kann .mts direkt): node tools/test-engine.mts
import { codeVon, FARBEN, LEER } from '../src/engine/farben.ts';
import {
  anzahlFarbeIn, farbenIn, glaeserMitFarbe, istGeloest, klone, laufOben, leererStand,
  packGlas, pruefeInvariante, schluessel, segmente, oben,
} from '../src/engine/zustand.ts';
import { giessen, legaleZuege, pruefeGiessen } from '../src/engine/zuege.ts';
import type { FarbId } from '../src/engine/farben.ts';
import type { Spielstand } from '../src/engine/typen.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

/** Baut einen Stand aus lesbaren Farbnamen. Index 0 = unten. */
function stand(hoehe: number, glaeser: FarbId[][]): Spielstand {
  const z = leererStand(glaeser.length, hoehe);
  for (let b = 0; b < glaeser.length; b++) {
    const inhalt = glaeser[b]!;
    for (let i = 0; i < inhalt.length; i++) z.zellen[b * hoehe + i] = codeVon(inhalt[i]!);
    z.fuell[b] = inhalt.length;
  }
  return z;
}

const R = 'rot', G = 'gelb', B = 'blau', M = 'minze';

console.log('--- Farben ---');
ok(FARBEN.length === 9, `neun Farben (${FARBEN.length})`);
ok(new Set(FARBEN.map((f) => f.id)).size === 9, 'alle Farb-Kennungen verschieden');
ok(new Set(FARBEN.map((f) => f.symbol)).size === 9, 'jede Farbe hat ein EIGENES Symbol (Farbenblind-Modus)');
ok(new Set(FARBEN.map((f) => f.ton)).size === 9, 'alle Farbtoene verschieden');
ok(FARBEN.every((f) => /^#[0-9A-F]{6}$/i.test(f.ton) && /^#[0-9A-F]{6}$/i.test(f.hell)), 'Ton und Aufhellung sind gueltige Hex-Werte');
ok(FARBEN.every((f, i) => codeVon(f.id) === i + 1), 'der Farbcode ist der Index + 1 (Reihenfolge ist bindend)');

console.log('\n--- Giessen ---');
{
  const z = stand(6, [[R, G, G], [G]]);
  const e = giessen(z, 0, 1);
  ok(e.ok && e.menge === 2, 'giesst den GANZEN Lauf oben (2x Gelb, nicht 1)');
  ok(z.fuell[0] === 1 && z.fuell[1] === 3, 'Fuellstaende stimmen danach');
  ok(pruefeInvariante(z) === '', 'Invariante haelt');
}
{
  const z = stand(6, [[R, G, G, G], [G, G, G, G, G]]);
  const e = giessen(z, 0, 1);
  ok(e.ok && e.menge === 1, 'bei zu wenig Platz fliesst nur, was passt');
  ok(z.fuell[0] === 3, 'der Rest bleibt in der Quelle');
}
ok(pruefeGiessen(stand(6, [[R], [G]]), 0, 1).grund === 'farbe-passt-nicht', 'Rot auf Gelb wird abgelehnt');
ok(pruefeGiessen(stand(6, [[], [G]]), 0, 1).grund === 'quelle-leer', 'aus leerem Glas giessen wird abgelehnt');
ok(pruefeGiessen(stand(6, [[R], [G]]), 0, 0).grund === 'selber-behaelter', 'in sich selbst giessen wird abgelehnt');
ok(pruefeGiessen(stand(6, [[R], [G]]), 0, 9).grund === 'index', 'Index ausserhalb des Bretts wird abgelehnt (ohne Ausnahme)');
ok(pruefeGiessen(stand(6, [[R], [G]]), -1, 0).grund === 'index', 'negativer Index ebenso');
ok(pruefeGiessen(stand(6, [[R], [G, G, G, G, G, G]]), 0, 1).grund === 'ziel-voll', 'in volles Glas giessen wird abgelehnt');
ok(pruefeGiessen(stand(6, [[R], []]), 0, 1).ok, 'in leeres Glas giessen ist erlaubt');
{
  const z = stand(6, [[R], [G]]);
  const vorher = schluessel(z);
  giessen(z, 0, 1);
  ok(schluessel(z) === vorher, 'ein abgelehnter Zug laesst den Stand unveraendert');
}
{
  const z = stand(6, [[R, R, R, R, R, R], []]);
  ok(legaleZuege(z).length === 1, 'volles einfarbiges Glas hat genau einen Zug (ins leere)');
  ok(legaleZuege(stand(6, [[], []])).length === 0, 'ein leeres Brett hat keine Zuege');
}

console.log('\n--- Siegbedingung ---');
ok(istGeloest(stand(6, [[R, R, R, R, R, R], [], [G, G, G, G, G, G]])), 'volle einfarbige und leere Glaeser = geloest');
ok(!istGeloest(stand(6, [[R, R, R], []])), 'halbvolles einfarbiges Glas zaehlt NICHT als geloest');
ok(!istGeloest(stand(6, [[R, R, R, R, R, G]])), 'gemischtes volles Glas ist nicht geloest');
ok(istGeloest(stand(6, [[], []])), 'ein leeres Brett gilt als geloest');

console.log('\n--- Packen und Kanonisierung ---');
ok(packGlas(stand(6, [[]]), 0) === 0, 'leeres Glas packt zu 0');
{
  const z = stand(2, [['kaffee', 'kaffee']]);
  ok(packGlas(z, 0) > 0, 'gepacktes Wort ist nie negativ (>>> 0 greift)');
}
ok(schluessel(stand(6, [[R, R], [G]])) === schluessel(stand(6, [[G], [R, R]])), 'vertauschte Glaeser ergeben denselben Schluessel');
ok(schluessel(stand(6, [[R, R], []])) === schluessel(stand(6, [[], [R, R]])), 'leeres Glas ist austauschbar');
ok(schluessel(stand(6, [[R, G]])) !== schluessel(stand(6, [[G, R]])), 'Reihenfolge innerhalb eines Glases zaehlt');
ok(schluessel(stand(6, [[R], [G], [B]])).length === 6, 'Schluessellaenge ist 2 Zeichen je Glas');
{
  // Kollisionsprobe gegen eine langsame Vergleichsrechnung.
  const farben: FarbId[] = [R, G];
  const alle: Spielstand[] = [];
  const inhalte: FarbId[][] = [[], [farben[0]!], [farben[1]!], [farben[0]!, farben[0]!],
    [farben[0]!, farben[1]!], [farben[1]!, farben[0]!], [farben[1]!, farben[1]!]];
  for (const a of inhalte) for (const b of inhalte) for (const c of inhalte) {
    alle.push(stand(2, [a.slice(), b.slice(), c.slice()]));
  }
  const perSchluessel = new Set(alle.map(schluessel));
  const langsam = new Set(alle.map((z) => {
    const w = [];
    for (let b = 0; b < z.glaeser; b++) w.push(packGlas(z, b));
    return w.sort((x, y) => x - y).join(',');
  }));
  ok(perSchluessel.size === langsam.size, `Kanonisierung kollisionsfrei (${perSchluessel.size} Klassen aus ${alle.length} Staenden)`);
}

console.log('\n--- Hilfsfunktionen ---');
ok(segmente(stand(6, [[R, R, G, G]]), 0) === 2, 'segmente() zaehlt Farbbloecke');
ok(segmente(stand(6, [[]]), 0) === 0, 'leeres Glas hat 0 Segmente');
ok(laufOben(stand(6, [[R, G, G]]), 0) === 2, 'laufOben() misst den obersten Block');
ok(oben(stand(6, [[]]), 0) === LEER, 'oben() eines leeren Glases ist LEER');
ok(anzahlFarbeIn(stand(6, [[R, G, R]]), 0, codeVon('rot')) === 2, 'anzahlFarbeIn() zaehlt ueber das ganze Glas');
ok(farbenIn(stand(6, [[R, G, R, M]]), 0).length === 3, 'farbenIn() zaehlt jede Farbe einmal');
ok(glaeserMitFarbe(stand(6, [[R], [R], [G]]), codeVon('rot')) === 2, 'glaeserMitFarbe() zaehlt Glaeser, nicht Schichten');
{
  const z = stand(6, [[R, G]]);
  const k = klone(z);
  giessen(k, 0, 0);
  ok(schluessel(k) === schluessel(z), 'klone() liefert eine unabhaengige Kopie');
}
{
  let warf = false;
  try { leererStand(4, 9); } catch { warf = true; }
  ok(warf, 'mehr als 8 Schichten werden abgelehnt (4 Bit je Schicht)');
}
{
  const z = stand(6, [[R, G]]);
  z.fuell[0] = 5;
  ok(pruefeInvariante(z) !== '', 'pruefeInvariante() erkennt einen falschen Fuellstand');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
