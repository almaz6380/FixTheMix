// Prueft den Loeser: findet er wirklich das OPTIMUM, und ist die Heuristik
// zulaessig? Das ist das wichtigste Skript hier — drei Sterne haengen am
// echten Optimum, und eine zu hohe Heuristik faellt sonst nirgends auf.
// Aufruf: npx tsx tools/test-loeser.mts
// Schneller: node tools/test-loeser.mts
import { codeVon } from '../src/engine/farben.ts';
import { istGeloest, klone, leererStand, schluessel, standAusLevel } from '../src/engine/zustand.ts';
import { generate } from '../src/engine/generator.ts';
import { anwenden, legaleZuege } from '../src/engine/zuege.ts';
import { bilanzStimmt, farbSummen, festgefahren, heuristik, hint, loesbar, solve } from '../src/engine/loeser.ts';
import { zufall } from '../src/engine/zufall.ts';
import type { FarbId } from '../src/engine/farben.ts';
import type { Spielstand } from '../src/engine/typen.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

function stand(hoehe: number, glaeser: FarbId[][]): Spielstand {
  const z = leererStand(glaeser.length, hoehe);
  for (let b = 0; b < glaeser.length; b++) {
    for (let i = 0; i < glaeser[b]!.length; i++) z.zellen[b * hoehe + i] = codeVon(glaeser[b]![i]!);
    z.fuell[b] = glaeser[b]!.length;
  }
  return z;
}
const R = 'rot', G = 'gelb', B = 'blau';

/** Breitensuche als unabhaengige Vergleichsrechnung. Langsam, aber unbestechlich. */
function bfsTiefe(start: Spielstand, deckel = 60_000): number {
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
  const z = stand(4, [[R, G, R, G], [G, R, G, R], []]);
  const l = solve(z);
  ok(l.status === 'optimal' && l.laenge === 7, 'gestreiftes Paar braucht genau 7 Zuege');
  const k = klone(z);
  for (const zug of l.zuege) anwenden(k, zug);
  ok(istGeloest(k), 'die zurueckgegebene Zugfolge loest das Level wirklich');
  ok(l.zuege.length === l.laenge, 'Zugliste und gemeldete Laenge stimmen ueberein');
}
{
  const z = stand(4, [[R, R, R, R], [R]]);
  ok(!bilanzStimmt(z), '5 Rot bei hoehe 4: Farbbilanz geht nicht auf');
  ok(solve(z).status === 'unloesbar', '... und der Loeser meldet unloesbar');
  ok(!loesbar(z), 'loesbar() meldet dasselbe');
}
{
  const z = stand(6, [[R, R, G, G], [], []]);
  ok(!bilanzStimmt(z), 'je 2 von 6 noetigen Einheiten: unloesbar');
}
{
  // Alles am Platz, aber kein freier Zug: zwei volle gemischte Glaeser.
  const z = stand(2, [[R, G], [G, R]]);
  ok(solve(z).status === 'unloesbar', 'zwei volle, gegenlaeufig gemischte Glaeser sind unloesbar');
}

console.log('\n--- Heuristik gegen Breitensuche (Zulaessigkeit) ---');
{
  const r = zufall(20260925, 7);
  let geprueft = 0, zuHoch = 0, falscheLaenge = 0, unstetig = 0;
  const palette: FarbId[] = [R, G, B];
  for (let lauf = 0; lauf < 500; lauf++) {
    const hoehe = 3 + r.unter(2);
    const farbzahl = 2 + r.unter(2);
    const glaeser = farbzahl + 1 + r.unter(2);
    const vorrat: FarbId[] = [];
    for (let f = 0; f < farbzahl; f++) for (let k = 0; k < hoehe; k++) vorrat.push(palette[f]!);
    const gemischt = r.mische(vorrat);
    const inhalt: FarbId[][] = Array.from({ length: glaeser }, () => []);
    for (let i = 0; i < gemischt.length; i++) {
      const ziel = Math.floor(i / hoehe);
      if (ziel < glaeser) inhalt[ziel]!.push(gemischt[i]!);
    }
    const z = stand(hoehe, inhalt);
    const tiefe = bfsTiefe(z, 30_000);
    if (tiefe < 0) continue;
    geprueft++;
    const gesamt = farbSummen(z);
    const h = heuristik(z, gesamt);
    if (h > tiefe) zuHoch++;
    const l = solve(z);
    if (l.status !== 'optimal' || l.laenge !== tiefe) falscheLaenge++;
    for (const zug of legaleZuege(z)) {
      const k = klone(z);
      anwenden(k, zug);
      if (h - heuristik(k, farbSummen(k)) > 1) unstetig++;
    }
  }
  ok(geprueft > 150, `genug Vergleichsfaelle gerechnet (${geprueft})`);
  ok(zuHoch === 0, `Heuristik ueberschaetzt nie (${zuHoch} Verstoesse bei ${geprueft} Faellen)`);
  ok(falscheLaenge === 0, `A* trifft die Breitensuche exakt (${falscheLaenge} Abweichungen)`);
  ok(unstetig === 0, `Heuristik ist konsistent: kein Zug senkt sie um mehr als 1 (${unstetig} Verstoesse)`);
}

console.log('\n--- Kanonisierung veraendert das Ergebnis nicht ---');
{
  let abweichungen = 0;
  const r = zufall(4711, 3);
  const inhalt: FarbId[][] = [[R, G, R, G], [G, R, G, R], [B, B, B, B], []];
  const a = solve(stand(4, inhalt));
  for (let lauf = 0; lauf < 30; lauf++) {
    const b = solve(stand(4, r.mische(inhalt)));
    if (a.laenge !== b.laenge) abweichungen++;
  }
  ok(abweichungen === 0, 'vertauschte Glaeser ergeben dieselbe Optimalzahl');
}

console.log('\n--- Budget ---');
{
  const z = stand(6, [
    [R, G, B, R, G, B], [G, B, R, G, B, R], [B, R, G, B, R, G],
    [R, G, B, R, G, B], [G, B, R, G, B, R], [B, R, G, B, R, G], [], [],
  ]);
  const l = solve(z, { maxKnoten: 10 });
  ok(l.status === 'budget', 'winziges Knotenbudget fuehrt zu status "budget"');
  ok(l.zuege.length === 0 && l.laenge === -1, '... und liefert KEINE geratene Zahl');
  ok(l.untergrenze >= 1, '... aber eine bewiesene Untergrenze');
  const voll = solve(z);
  ok(voll.status !== 'optimal' || voll.laenge >= l.untergrenze, 'die Untergrenze haelt gegen das echte Optimum');
}
{
  const l = solve(stand(4, [[R, R, R], [R], []]), { schranke: 0 });
  ok(l.status !== 'optimal', 'eine zu enge Schranke liefert nie ein falsches Optimum');
}
{
  let gerufen = 0;
  const l = solve(stand(6, [[R, G, B, R, G, B], [G, B, R, G, B, R], [B, R, G, B, R, G], [], []]),
    { maxMs: 1, jetzt: () => { gerufen++; return gerufen * 1000; } });
  ok(gerufen > 0, 'die einspeisbare Uhr wird benutzt (die Engine ruft nie selbst Date.now)');
  ok(l.status === 'budget' || l.status === 'optimal', 'Zeitbudget liefert ein sauberes Ergebnis');
}

console.log('\n--- Tipp ---');
{
  const z = stand(4, [[R, G, R, G], [G, R, G, R], []]);
  const l = solve(z);
  const t = hint(z);
  ok(t !== null, 'der Tipp liefert einen Zug');
  ok(JSON.stringify(t) === JSON.stringify(l.zuege[0]), 'der Tipp ist der erste Zug der kuerzesten Loesung');
  ok(hint(stand(4, [[R, R, R, R]])) === null, 'im geloesten Zustand gibt es keinen Tipp');
}

console.log('\n--- Festgefahren ---');
{
  ok(!festgefahren(stand(4, [[R, R, R, R]])), 'ein geloestes Brett gilt nie als festgefahren');
  ok(!festgefahren(stand(4, [[R, G, R, G], [G, R, G, R], []])),
     'ein loesbares Brett gilt nicht als festgefahren');

  // Voll, und kein Oberlauf passt auf einen anderen: es gibt gar keinen Zug.
  ok(festgefahren(stand(3, [[R, R, G], [G, G, R]])),
     'ein Brett ohne einen einzigen legalen Zug ist festgefahren');

  // Der haeufigere Fall: Zuege gibt es noch, nur fuehrt keiner ans Ziel.
  // Gesucht wird er so, wie er im Spiel entsteht — mit gesetztem Zufall, damit
  // der Test bei jedem Lauf dasselbe Brett prueft.
  const start = standAusLevel(generate(20_260_926, 3));
  const r = zufall(4711, 3);
  let tot: Spielstand | null = null;
  for (let versuch = 0; versuch < 200 && !tot; versuch++) {
    const z = klone(start);
    for (let t = 0; t < 12; t++) {
      const zs = legaleZuege(z);
      if (zs.length === 0) break;
      anwenden(z, r.zieh(zs));
      if (istGeloest(z)) break;
    }
    if (!istGeloest(z) && legaleZuege(z).length > 0 && solve(z).status === 'unloesbar') tot = z;
  }
  ok(tot !== null, 'ein totes Brett MIT verbleibenden Zuegen laesst sich finden');
  ok(tot !== null && festgefahren(tot), '... und festgefahren() erkennt es');

  // Die wichtigste Zusicherung ueberhaupt: ein zu knappes Budget darf NIE als
  // Sackgasse durchgehen. Ein falscher Alarm triebe den Spieler in einen
  // Neustart, der gar nicht noetig war.
  const schwer = stand(6, [
    [R, G, B, R, G, B], [G, B, R, G, B, R], [B, R, G, B, R, G], [], [],
  ]);
  ok(solve(schwer, { maxKnoten: 3 }).status === 'budget', 'mit drei Knoten gibt der Loeser auf');
  ok(!festgefahren(schwer, 3), '... und festgefahren() meldet trotzdem KEINE Sackgasse');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
