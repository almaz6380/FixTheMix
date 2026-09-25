// Prueft den Loeser: findet er wirklich das OPTIMUM, und ist die Heuristik
// zulaessig? Das ist das wichtigste Skript hier — drei Sterne haengen am
// echten Optimum, und eine zu hohe Heuristik faellt sonst nirgends auf.
// Aufruf: npx tsx tools/test-loeser.mts
// Schneller: node tools/test-loeser.mts
import { codeVon } from '../src/engine/farben.ts';
import { istGeloest, klone, leererStand, schluessel } from '../src/engine/zustand.ts';
import { anwenden, legaleZuege } from '../src/engine/zuege.ts';
import { farbSummen, heuristik, loesbar, schuettelBedarf, solve } from '../src/engine/loeser.ts';
import { zufall } from '../src/engine/zufall.ts';
import type { FarbId } from '../src/engine/farben.ts';
import type { Spielstand } from '../src/engine/typen.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

function stand(hoehe: number, glaeser: FarbId[][], shaker: FarbId[][] = []): Spielstand {
  const z = leererStand(glaeser.length, shaker.length, hoehe);
  const alle = [...glaeser, ...shaker];
  for (let b = 0; b < alle.length; b++) {
    for (let i = 0; i < alle[b]!.length; i++) z.zellen[b * hoehe + i] = codeVon(alle[b]![i]!);
    z.fuell[b] = alle[b]!.length;
  }
  return z;
}
const R = 'rot', G = 'gelb', B = 'blau', O = 'orange';

/** Breitensuche als unabhaengige Vergleichsrechnung. Langsam, aber unbestechlich. */
function bfsTiefe(start: Spielstand, deckel = 200_000): number {
  if (istGeloest(start)) return 0;
  const gesehen = new Set<string>([schluessel(start)]);
  let rand = [start];
  let tiefe = 0;
  let knoten = 0;
  while (rand.length > 0) {
    tiefe++;
    const naechste: Spielstand[] = [];
    for (const z of rand) {
      for (const zug of legaleZuege(z)) {
        if (++knoten > deckel) return -1;
        const k = klone(z);
        anwenden(k, zug);
        if (istGeloest(k)) return tiefe;
        const s = schluessel(k);
        if (gesehen.has(s)) continue;
        gesehen.add(s);
        naechste.push(k);
      }
    }
    rand = naechste;
  }
  return -1;
}

console.log('--- Grundfaelle ---');
{
  const l = solve(stand(4, [[R, R, R, R], []]));
  ok(l.status === 'optimal' && l.laenge === 0, 'bereits geloest: Laenge 0');
}
{
  const l = solve(stand(4, [[R, R, R], [R], []]));
  ok(l.status === 'optimal' && l.laenge === 1, 'ein Zug bleibt ein Zug');
}
{
  const l = solve(stand(4, [[R, G, R, G], [G, R, G, R], []]));
  ok(l.status === 'optimal' && l.laenge === 7, 'gestreiftes Paar braucht genau 7 Zuege');
  const z = stand(4, [[R, G, R, G], [G, R, G, R], []]);
  for (const zug of l.zuege) anwenden(z, zug);
  ok(istGeloest(z), 'die zurueckgegebene Zugfolge loest das Level wirklich');
  ok(l.zuege.length === l.laenge, 'Zugliste und gemeldete Laenge stimmen ueberein');
}
{
  const z = stand(4, [[R, R, R, R], [R]]);
  ok(schuettelBedarf(z) === Infinity, '5 Rot bei hoehe 4: Farbbilanz geht nicht auf');
  ok(solve(z).status === 'unloesbar', '... und der Loeser meldet unloesbar');
  ok(!loesbar(z), 'loesbar() meldet dasselbe');
}
{
  // Ohne Shaker kann die fehlende Menge nicht ausgeglichen werden.
  const z = stand(4, [[R, R, G, G], [], []]);
  ok(solve(z).status === 'unloesbar', 'je 2 Rot und 2 Gelb ohne Shaker: unloesbar');
}

console.log('\n--- Mischen ---');
{
  const z = stand(4, [[R, R, G, G], [O, O, O, O], []], [[]]);
  ok(schuettelBedarf(z) === 1, 'genau ein Schuettelzug ist noetig');
  const l = solve(z);
  ok(l.status === 'optimal' && l.laenge === 4, 'Mischlevel in genau 4 Zuegen');
  ok(l.zuege.filter((t) => t.art === 'schuetteln').length === 1, 'die Loesung schuettelt genau einmal');
  const k = klone(z);
  for (const zug of l.zuege) anwenden(k, zug);
  ok(istGeloest(k), 'Mischloesung endet geloest');
}
{
  const z = stand(4, [[R, R, G, G], [O, O, O, O], []]);
  ok(solve(z).status === 'unloesbar', 'dasselbe Brett OHNE Shaker ist unloesbar');
}

console.log('\n--- Heuristik gegen Breitensuche (Zulaessigkeit) ---');
{
  // Zufaellige kleine Staende. Die Breitensuche liefert die Wahrheit, die
  // Heuristik darf sie nie ueberschaetzen — sonst stimmen die Sterne nicht.
  const r = zufall(20260925, 7);
  let geprueft = 0, zuHoch = 0, falscheLaenge = 0, unstetig = 0;
  const palette: FarbId[] = [R, G, B];
  for (let lauf = 0; lauf < 400; lauf++) {
    const glaeser = 4 + r.unter(2);
    const mitShaker = r.unter(2) === 1;
    const farbzahl = 2 + r.unter(2);
    // Vorrat aus vollen Glaesern, dann verwuerfeln.
    const vorrat: FarbId[] = [];
    for (let f = 0; f < farbzahl; f++) for (let k = 0; k < 4; k++) vorrat.push(palette[f]!);
    const gemischt = r.mische(vorrat);
    const inhalt: FarbId[][] = Array.from({ length: glaeser }, () => []);
    for (let i = 0; i < gemischt.length; i++) {
      const ziel = Math.floor(i / 4);
      if (ziel < glaeser) inhalt[ziel]!.push(gemischt[i]!);
    }
    const z = stand(4, inhalt, mitShaker ? [[]] : []);
    const tiefe = bfsTiefe(z, 40_000);
    if (tiefe < 0) continue;
    geprueft++;
    const h = heuristik(z, schuettelBedarf(z), farbSummen(z));
    if (h > tiefe) zuHoch++;
    const l = solve(z);
    if (l.status !== 'optimal' || l.laenge !== tiefe) falscheLaenge++;
    // Konsistenz: kein Zug darf h um mehr als 1 senken.
    const hier = h;
    for (const zug of legaleZuege(z)) {
      const k = klone(z);
      anwenden(k, zug);
      const h2 = heuristik(k, schuettelBedarf(k), farbSummen(k));
      if (h2 !== Infinity && hier - h2 > 1) unstetig++;
    }
  }
  ok(geprueft > 100, `genug Vergleichsfaelle gerechnet (${geprueft})`);
  ok(zuHoch === 0, `Heuristik ueberschaetzt nie (${zuHoch} Verstoesse bei ${geprueft} Faellen)`);
  ok(falscheLaenge === 0, `A* trifft die Breitensuche exakt (${falscheLaenge} Abweichungen)`);
  ok(unstetig === 0, `Heuristik ist konsistent: kein Zug senkt sie um mehr als 1 (${unstetig} Verstoesse)`);
}

console.log('\n--- Kanonisierung veraendert das Ergebnis nicht ---');
{
  // Dasselbe Brett mit vertauschten Glaesern muss dieselbe Laenge ergeben.
  let abweichungen = 0;
  const r = zufall(4711, 3);
  for (let lauf = 0; lauf < 30; lauf++) {
    const inhalt: FarbId[][] = [[R, G, R, G], [G, R, G, R], [B, B, B, B], []];
    const a = solve(stand(4, inhalt));
    const b = solve(stand(4, r.mische(inhalt)));
    if (a.laenge !== b.laenge) abweichungen++;
  }
  ok(abweichungen === 0, 'vertauschte Glaeser ergeben dieselbe Optimalzahl');
}

console.log('\n--- Budget ---');
{
  const z = stand(4, [[R, G, B, R], [G, B, R, G], [B, R, G, B], [R, G, B, R], [G, B, R, G], [B, R, G, B], [], []]);
  const l = solve(z, { maxKnoten: 10 });
  ok(l.status === 'budget', 'winziges Knotenbudget fuehrt zu status "budget"');
  ok(l.zuege.length === 0 && l.laenge === -1, '... und liefert KEINE geratene Zahl');
  ok(l.untergrenze >= 1, '... aber eine bewiesene Untergrenze');
  const voll = solve(z);
  ok(voll.status === 'optimal' && voll.laenge >= l.untergrenze, 'die Untergrenze haelt gegen das echte Optimum');
}
{
  const z = stand(4, [[R, R, R], [R], []]);
  const l = solve(z, { schranke: 0 });
  ok(l.status !== 'optimal', 'eine zu enge Schranke liefert nie ein falsches Optimum');
}

console.log('\n--- Tipp ---');
{
  const z = stand(4, [[R, G, R, G], [G, R, G, R], []]);
  const l = solve(z);
  const { hint } = await import('../src/engine/loeser.ts');
  const t = hint(z);
  ok(t !== null, 'der Tipp liefert einen Zug');
  ok(JSON.stringify(t) === JSON.stringify(l.zuege[0]), 'der Tipp ist der erste Zug der kuerzesten Loesung');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
