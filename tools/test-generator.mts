// Prueft den Generator: 1.000 Level, alle loesbar, Optimum belegt, Mischung
// wirklich erzwungen — und gleicher Seed ergibt bitgenau dasselbe Level.
// Aufruf: npx tsx tools/test-generator.mts
// Schneller (empfohlen, das Skript rechnet rund eine Minute):
//   node tools/test-generator.mts
import { LEER } from '../src/engine/farben.ts';
import { generate, STUFEN, sterneFuer } from '../src/engine/generator.ts';
import { loesbar, schuettelBedarf, solve } from '../src/engine/loeser.ts';
import { anwenden } from '../src/engine/zuege.ts';
import { istGeloest, klone, schluessel, standAusLevel } from '../src/engine/zustand.ts';
import type { Level } from '../src/engine/typen.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

/**
 * Wie viele Level je Stufe. Die Verteilung ist nach LAUFZEIT gewichtet, nicht
 * nach Spielgefuehl: die Shaker-Stufen kosten je Level das Hundert- bis
 * Tausendfache der kleinen (siehe die Messtabelle in generator.ts). In Summe
 * 1.000 Level, wie im Bauplan gefordert.
 */
const VERTEILUNG: readonly number[] = [300, 250, 200, 130, 40, 70, 10];
const GESAMT = VERTEILUNG.reduce((a, b) => a + b, 0);

console.log(`--- ${GESAMT} Level erzeugen und pruefen ---`);

let gebaut = 0;
let nichtLoesbar = 0;
let bandVerletzt = 0;
let mischungFehlt = 0;
let shakerNichtLeer = 0;
let mengeFalsch = 0;
let schonGeloest = 0;
let formFalsch = 0;
let jsonKaputt = 0;
const zeitProStufe: number[] = [];
const beispiele: Level[] = [];

const t0 = Date.now();
for (let stufe = 0; stufe < STUFEN.length; stufe++) {
  const s = STUFEN[stufe]!;
  const tStufe = Date.now();
  for (let i = 0; i < VERTEILUNG[stufe]!; i++) {
    const seed = 1000 * (stufe + 1) + i;
    const lvl = generate(seed, stufe);
    gebaut++;
    if (beispiele.length < 7 && i === 0) beispiele.push(lvl);

    const z = standAusLevel(lvl);

    // Form
    if (lvl.start.length !== (lvl.glaeser + lvl.shaker) * lvl.hoehe) formFalsch++;
    if (lvl.shaker > 0 && lvl.hoehe % 2 !== 0) formFalsch++;

    // Loesbarkeit — unabhaengig vom Loeserlauf im Generator
    if (!loesbar(z)) nichtLoesbar++;

    // Zugband
    if (lvl.optimalZuege < s.zuegeMin || lvl.optimalZuege > s.zuegeMax || lvl.optimalZuege < 1) {
      bandVerletzt++;
    }

    // Mischung ist erzwungen, nicht Dekoration
    const bedarf = schuettelBedarf(z);
    if (bedarf !== lvl.schuettelZuege) mischungFehlt++;
    if (s.mischungen > 0 && bedarf < 1) mischungFehlt++;
    if (s.mischungen === 0 && bedarf !== 0) mischungFehlt++;

    // Shaker starten leer
    for (let b = lvl.glaeser; b < lvl.glaeser + lvl.shaker; b++) {
      if (z.fuell[b]! !== 0) shakerNichtLeer++;
    }

    // Fluessigkeitsmenge: genau so viel, wie volle Glaeser fassen
    let belegt = 0;
    for (const c of lvl.start) if (c !== LEER) belegt++;
    if (belegt !== (s.glaeser - s.leer) * s.hoehe) mengeFalsch++;

    // Kein Level ist schon geloest
    if (istGeloest(z)) schonGeloest++;

    // JSON-Rundlauf (Level geht so in die Datenbank)
    const zurueck = JSON.parse(JSON.stringify(lvl)) as Level;
    if (schluessel(standAusLevel(zurueck)) !== schluessel(z)) jsonKaputt++;
  }
  zeitProStufe[stufe] = Date.now() - tStufe;
}
const gesamtMs = Date.now() - t0;

ok(gebaut === GESAMT, `${gebaut} von ${GESAMT} Leveln erzeugt, keines hat geworfen`);
ok(nichtLoesbar === 0, `jedes Level ist loesbar (${nichtLoesbar} Ausreisser)`);
ok(bandVerletzt === 0, `jedes Optimum liegt im Zugband der Stufe (${bandVerletzt} Ausreisser)`);
ok(mischungFehlt === 0, `Mischbedarf stimmt und ist erzwungen (${mischungFehlt} Ausreisser)`);
ok(shakerNichtLeer === 0, `alle Shaker starten leer (${shakerNichtLeer} Ausreisser)`);
ok(mengeFalsch === 0, `Fluessigkeitsmenge passt zu den vollen Glaesern (${mengeFalsch} Ausreisser)`);
ok(schonGeloest === 0, `kein Level ist schon geloest (${schonGeloest} Ausreisser)`);
ok(formFalsch === 0, `Brettform ist gueltig (${formFalsch} Ausreisser)`);
ok(jsonKaputt === 0, `Level ueberlebt den JSON-Rundlauf (${jsonKaputt} Ausreisser)`);

console.log('\n  Laufzeit je Stufe:');
for (let stufe = 0; stufe < STUFEN.length; stufe++) {
  const n = VERTEILUNG[stufe]!;
  console.log(`    ${STUFEN[stufe]!.name.padEnd(8)} ${String(n).padStart(4)} Level  ${String(zeitProStufe[stufe]).padStart(6)} ms  (${(zeitProStufe[stufe]! / n).toFixed(1)} ms/Level)`);
}
console.log(`    ${'gesamt'.padEnd(8)} ${String(GESAMT).padStart(4)} Level  ${String(gesamtMs).padStart(6)} ms`);
// Weiche Schranke: schlaegt an, wenn eine Aenderung den Loeser stillschweigend
// verlangsamt. Kein Leistungstest, nur ein Rauchmelder.
ok(gesamtMs < 180_000, `der 1.000er-Lauf bleibt unter 3 Minuten (${(gesamtMs / 1000).toFixed(1)} s)`);

console.log('\n--- Stichprobe: Optimum wirklich nachgerechnet ---');
{
  // Der Generator hat das Optimum schon bewiesen. Hier wird es unabhaengig
  // nachgerechnet — und die gefundene Zugfolge auch tatsaechlich gespielt.
  let abweichung = 0, loestNicht = 0, sterneFalsch = 0;
  let geprueft = 0;
  for (let stufe = 0; stufe < STUFEN.length; stufe++) {
    for (let i = 0; i < 8; i++) {
      const lvl = generate(50_000 + 100 * stufe + i, stufe);
      const z = standAusLevel(lvl);
      const l = solve(z);
      geprueft++;
      if (l.status !== 'optimal' || l.laenge !== lvl.optimalZuege) abweichung++;
      const k = klone(z);
      for (const zug of l.zuege) anwenden(k, zug);
      if (!istGeloest(k)) loestNicht++;
      if (sterneFuer(lvl, lvl.optimalZuege, true) !== 3) sterneFalsch++;
      if (sterneFuer(lvl, lvl.sterne.zwei, true) !== 2) sterneFalsch++;
      if (sterneFuer(lvl, lvl.sterne.zwei + 1, true) !== 1) sterneFalsch++;
      if (sterneFuer(lvl, lvl.optimalZuege, false) !== 0) sterneFalsch++;
    }
  }
  ok(geprueft === STUFEN.length * 8, `${geprueft} Level unabhaengig nachgerechnet`);
  ok(abweichung === 0, `das gespeicherte Optimum stimmt (${abweichung} Abweichungen)`);
  ok(loestNicht === 0, `die nachgerechnete Zugfolge loest (${loestNicht} Ausreisser)`);
  ok(sterneFalsch === 0, `Sternschwellen greifen richtig (${sterneFalsch} Ausreisser)`);
}

console.log('\n--- Determinismus ---');
{
  let ungleich = 0;
  for (let stufe = 0; stufe < STUFEN.length; stufe++) {
    for (const seed of [1, 77, 4242]) {
      const a = generate(seed, stufe);
      const b = generate(seed, stufe);
      if (JSON.stringify(a) !== JSON.stringify(b)) ungleich++;
    }
  }
  ok(ungleich === 0, `gleicher Seed ergibt bitgenau dasselbe Level (${ungleich} Abweichungen)`);
}
{
  const schluessel10 = new Set<string>();
  for (let seed = 1; seed <= 40; seed++) schluessel10.add(schluessel(standAusLevel(generate(seed, 1))));
  ok(schluessel10.size >= 35, `verschiedene Seeds ergeben verschiedene Level (${schluessel10.size} von 40 verschieden)`);
}
{
  // Feste Tabelle. DAS ist der eigentliche Regressionsschutz: eine Aenderung,
  // die die Seed-zu-Level-Abbildung verschiebt, entwertet jede gespeicherte
  // Wiedergabe und jeden Bestenlisteneintrag — und faellt sonst nirgends auf.
  const tabelle: [number, number, string, number, number][] = [
    [1, 0, '00007717111200002227', 5, 0],
    [2, 1, '382282003334000044482800', 7, 0],
    [3, 2, '20002000252055977752998788829220', 12, 0],
    [7, 3, '1182119288900000771977925598200099591151', 17, 0],
    [11, 5, '98901000229092208282228033100000', 14, 1],
    [42, 0, '32001210211233003000', 7, 0],
    [123, 2, '55905900777375900000333556596665', 12, 0],
    [2026, 1, '229200003900339077207739', 9, 0],
  ];
  let falsch = 0;
  for (const [seed, stufe, roh, opt, misch] of tabelle) {
    const lvl = generate(seed, stufe);
    if (lvl.start.join('') !== roh) falsch++;
    if (lvl.optimalZuege !== opt) falsch++;
    if (lvl.schuettelZuege !== misch) falsch++;
  }
  ok(falsch === 0, `feste Seed-Tabelle stimmt weiterhin (${falsch} Abweichungen bei ${tabelle.length} Faellen)`);
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
