// Prueft den Generator: 1.000 Level, alle loesbar, Optimum belegt — und
// gleicher Seed ergibt bitgenau dasselbe Level.
// Aufruf: npx tsx tools/test-generator.mts
// Schneller (empfohlen, das Skript rechnet einige Minuten):
//   node tools/test-generator.mts
import { generate, STUFEN, sterneFuer } from '../src/engine/generator.ts';
import { loesbar, solve } from '../src/engine/loeser.ts';
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
 * nach Spielgefuehl: ein „Bar"-Level kostet das Tausendfache eines „Start".
 * In Summe 1.000 Level, wie im Bauplan gefordert.
 */
const VERTEILUNG: readonly number[] = [350, 330, 200, 80, 30, 10];
const GESAMT = VERTEILUNG.reduce((a, b) => a + b, 0);

console.log(`--- ${GESAMT} Level erzeugen und pruefen ---`);

let gebaut = 0, nichtLoesbar = 0, bandVerletzt = 0, mengeFalsch = 0;
let schonGeloest = 0, formFalsch = 0, jsonKaputt = 0, versionFalsch = 0;
const zeitProStufe: number[] = [];

const t0 = Date.now();
for (let stufe = 0; stufe < STUFEN.length; stufe++) {
  const s = STUFEN[stufe]!;
  const tStufe = Date.now();
  for (let i = 0; i < VERTEILUNG[stufe]!; i++) {
    const lvl = generate(1000 * (stufe + 1) + i, stufe);
    gebaut++;
    const z = standAusLevel(lvl);

    if (lvl.version !== 3) versionFalsch++;
    if (lvl.start.length !== lvl.glaeser * lvl.hoehe) formFalsch++;
    if (lvl.hoehe !== s.hoehe || lvl.glaeser !== s.glaeser) formFalsch++;

    if (!loesbar(z)) nichtLoesbar++;
    if (lvl.optimalZuege < s.zuegeMin || lvl.optimalZuege > s.zuegeMax || lvl.optimalZuege < 1) bandVerletzt++;

    // `start` ist ab Version 3 eine Ziffernkette — '0' ist die leere Schicht.
    let belegt = 0;
    for (const c of lvl.start) if (c !== '0') belegt++;
    if (belegt !== (s.glaeser - s.leer) * s.hoehe) mengeFalsch++;

    if (istGeloest(z)) schonGeloest++;

    const zurueck = JSON.parse(JSON.stringify(lvl)) as Level;
    if (schluessel(standAusLevel(zurueck)) !== schluessel(z)) jsonKaputt++;
  }
  zeitProStufe[stufe] = Date.now() - tStufe;
}
const gesamtMs = Date.now() - t0;

ok(gebaut === GESAMT, `${gebaut} von ${GESAMT} Leveln erzeugt, keines hat geworfen`);
ok(nichtLoesbar === 0, `jedes Level ist loesbar (${nichtLoesbar} Ausreisser)`);
ok(bandVerletzt === 0, `jedes Optimum liegt im Zugband der Stufe (${bandVerletzt} Ausreisser)`);
ok(mengeFalsch === 0, `Fluessigkeitsmenge passt zu den vollen Glaesern (${mengeFalsch} Ausreisser)`);
ok(schonGeloest === 0, `kein Level ist schon geloest (${schonGeloest} Ausreisser)`);
ok(formFalsch === 0, `Brettform stimmt mit der Stufe ueberein (${formFalsch} Ausreisser)`);
ok(versionFalsch === 0, `jedes Level traegt version 3 (${versionFalsch} Ausreisser)`);
ok(jsonKaputt === 0, `Level ueberlebt den JSON-Rundlauf (${jsonKaputt} Ausreisser)`);

console.log('\n  Laufzeit je Stufe:');
for (let stufe = 0; stufe < STUFEN.length; stufe++) {
  const n = VERTEILUNG[stufe]!;
  console.log(`    ${STUFEN[stufe]!.name.padEnd(7)} ${String(n).padStart(4)} Level  ${String(zeitProStufe[stufe]).padStart(7)} ms  (${(zeitProStufe[stufe]! / n).toFixed(1)} ms/Level)`);
}
console.log(`    ${'gesamt'.padEnd(7)} ${String(GESAMT).padStart(4)} Level  ${String(gesamtMs).padStart(7)} ms`);
// Weiche Schranke: schlaegt an, wenn eine Aenderung den Loeser stillschweigend
// verlangsamt. Kein Leistungstest, nur ein Rauchmelder.
ok(gesamtMs < 420_000, `der 1.000er-Lauf bleibt unter 7 Minuten (${(gesamtMs / 1000).toFixed(1)} s)`);

console.log('\n--- Stichprobe: Optimum wirklich nachgerechnet ---');
{
  let abweichung = 0, loestNicht = 0, sterneFalsch = 0, geprueft = 0;
  for (let stufe = 0; stufe < STUFEN.length; stufe++) {
    for (let i = 0; i < 6; i++) {
      const lvl = generate(50_000 + 100 * stufe + i, stufe);
      const z = standAusLevel(lvl);
      const l = solve(z, { schranke: lvl.optimalZuege });
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
  ok(geprueft === STUFEN.length * 6, `${geprueft} Level unabhaengig nachgerechnet`);
  ok(abweichung === 0, `das gespeicherte Optimum stimmt (${abweichung} Abweichungen)`);
  ok(loestNicht === 0, `die nachgerechnete Zugfolge loest (${loestNicht} Ausreisser)`);
  ok(sterneFalsch === 0, `Sternschwellen greifen richtig (${sterneFalsch} Ausreisser)`);
}

console.log('\n--- Determinismus ---');
{
  let ungleich = 0;
  for (let stufe = 0; stufe < STUFEN.length; stufe++) {
    for (const seed of [1, 77, 4242]) {
      if (JSON.stringify(generate(seed, stufe)) !== JSON.stringify(generate(seed, stufe))) ungleich++;
    }
  }
  ok(ungleich === 0, `gleicher Seed ergibt bitgenau dasselbe Level (${ungleich} Abweichungen)`);
}
{
  const s = new Set<string>();
  for (let seed = 1; seed <= 40; seed++) s.add(schluessel(standAusLevel(generate(seed, 1))));
  ok(s.size >= 35, `verschiedene Seeds ergeben verschiedene Level (${s.size} von 40 verschieden)`);
}
{
  // Feste Tabelle. DAS ist der eigentliche Regressionsschutz: eine Aenderung,
  // die die Seed-zu-Level-Abbildung verschiebt, entwertet jede gespeicherte
  // Wiedergabe und jeden Bestenlisteneintrag — und faellt sonst nirgends auf.
  const GOLDEN: [number, number, string, number][] = [
    [1, 0, '222400111000114220442000441000', 7],
    [2, 1, '772233255553330000253200777752000000', 11],
    [3, 2, '882820220000222200555552448822666665444468200000', 11],
    [7, 3, '111100116200555400666600622240455566881114246000668818824611', 20],
    [11, 4, '222770666644550000744000400000448500447400999999888225448850444466772544', 18],
    [42, 0, '332211000000210000333310122210', 8],
    [123, 2, '338000844840999998666669684800333384888848000000', 15],
    [2026, 1, '443326446660333362200000442000622000', 10],
  ];
  const tabelle = GOLDEN;
  let falsch = 0;
  for (const [seed, stufe, roh, opt] of tabelle) {
    const lvl = generate(seed, stufe);
    if (lvl.start !== roh) falsch++;
    if (lvl.optimalZuege !== opt) falsch++;
  }
  ok(falsch === 0, `feste Seed-Tabelle stimmt weiterhin (${falsch} Abweichungen bei ${tabelle.length} Faellen)`);
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
