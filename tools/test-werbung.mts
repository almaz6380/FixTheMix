// Prueft die Werbebremse und das Extra-Glas.
//
// Zwei Dinge, die man nicht am Geraet ausprobieren kann, ohne echte Anzeigen
// anzusehen — und genau das ist verboten (CLAUDE.md: „Nie echte eigene Anzeigen
// antippen"). Also wird die REGEL geprueft, nicht das SDK.
//
// Die Bremse ist die Stelle, an der ein Fehler direkt Spieler kostet: zu oft
// Werbung, und sie sind weg. Das Extra-Glas ist die Stelle, an der ein Fehler
// die Sternwertung entwertet.
//
// Aufruf: npx tsx tools/test-werbung.mts
// Schneller: node tools/test-werbung.mts
import { generate } from '../src/engine/generator.ts';
import { solve } from '../src/engine/loeser.ts';
import { Partie } from '../src/engine/verlauf.ts';
import { replay } from '../src/engine/wiedergabe.ts';
import { legaleZuege } from '../src/engine/zuege.ts';
import { istGeloest, mitExtraGlas, pruefeInvariante, schluessel, standAusLevel } from '../src/engine/zustand.ts';
import {
  JEDES_NTE_LEVEL, MINDESTABSTAND_MS, darfInterstitial,
} from '../src/lib/werbung.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

console.log('--- Die Werbebremse ---');
{
  ok(JEDES_NTE_LEVEL >= 2, `nie nach jedem Level (jedes ${JEDES_NTE_LEVEL}.)`);
  ok(MINDESTABSTAND_MS >= 60_000, `Mindestabstand mindestens eine Minute (${MINDESTABSTAND_MS / 1000} s)`);

  ok(!darfInterstitial({ zaehler: 0, zuletzt: 0 }, 1_000_000),
     'vor dem ersten beendeten Level gibt es keine Anzeige');
  for (let n = 1; n < JEDES_NTE_LEVEL; n++) {
    ok(!darfInterstitial({ zaehler: n, zuletzt: 0 }, 1_000_000),
       `nach Level ${n} noch nicht`);
  }
  ok(darfInterstitial({ zaehler: JEDES_NTE_LEVEL, zuletzt: 0 }, 1_000_000),
     `nach Level ${JEDES_NTE_LEVEL} schon`);

  // Der Mindestabstand ist die zweite Bremse und wirkt UNABHAENGIG vom Zaehler:
  // wer drei Level in zwei Minuten durchspielt, bekommt trotzdem nur eine.
  const jetzt = 5_000_000;
  ok(!darfInterstitial({ zaehler: JEDES_NTE_LEVEL, zuletzt: jetzt - 1000 }, jetzt),
     'eine Sekunde nach der letzten Anzeige nicht');
  ok(!darfInterstitial({ zaehler: JEDES_NTE_LEVEL, zuletzt: jetzt - MINDESTABSTAND_MS + 1 }, jetzt),
     'eine Millisekunde zu frueh nicht');
  ok(darfInterstitial({ zaehler: JEDES_NTE_LEVEL, zuletzt: jetzt - MINDESTABSTAND_MS }, jetzt),
     'genau nach dem Mindestabstand schon');

  // Und die Rechnung ueber eine ganze Sitzung: wie viele Anzeigen bekaeme
  // jemand, der dreissig Level in Folge spielt, je zwei Minuten lang?
  let zaehler = 0, zuletzt = 0, gezeigt = 0, uhr = 1_000_000;
  for (let level = 0; level < 30; level++) {
    uhr += 120_000;
    zaehler += 1;
    if (darfInterstitial({ zaehler, zuletzt }, uhr)) {
      gezeigt++;
      zuletzt = uhr;
    }
  }
  ok(gezeigt === 10, `dreissig Level in einer Stunde ergeben ${gezeigt} Anzeigen (erwartet 10)`);

  // Und derselbe Lauf im Schnelldurchgang — 20 Sekunden je Level.
  zaehler = 0; zuletzt = 0; gezeigt = 0; uhr = 1_000_000;
  for (let level = 0; level < 30; level++) {
    uhr += 20_000;
    zaehler += 1;
    if (darfInterstitial({ zaehler, zuletzt }, uhr)) {
      gezeigt++;
      zuletzt = uhr;
    }
  }
  ok(gezeigt <= 5, `dreissig Level in zehn Minuten ergeben nur ${gezeigt} Anzeigen`);
}

console.log('\n--- Das Extra-Glas ---');
{
  const level = generate(555, 3);
  const stand = standAusLevel(level);
  const mehr = mitExtraGlas(stand);
  ok(mehr.glaeser === stand.glaeser + 1, 'ein Glas mehr');
  ok(mehr.hoehe === stand.hoehe, 'dieselbe Hoehe');
  ok(pruefeInvariante(mehr) === '', 'der neue Stand ist in sich stimmig');
  ok(mehr.fuell[mehr.glaeser - 1] === 0, 'das neue Glas ist leer');
  ok(stand.glaeser === level.glaeser, 'der alte Stand bleibt unangetastet');

  // Angehaengt, nicht eingeschoben — sonst zeigten alle gemerkten Zuege auf
  // andere Glaeser.
  let gleich = true;
  for (let b = 0; b < stand.glaeser; b++) {
    if (mehr.fuell[b] !== stand.fuell[b]) gleich = false;
    for (let i = 0; i < stand.hoehe; i++) {
      if (mehr.zellen[b * stand.hoehe + i] !== stand.zellen[b * stand.hoehe + i]) gleich = false;
    }
  }
  ok(gleich, 'alle bestehenden Glaeser behalten Index und Inhalt');

  ok(legaleZuege(mehr).length > legaleZuege(stand).length,
     'mit dem leeren Glas gibt es mehr Zuege');
  const ohne = solve(stand);
  const mit = solve(mehr);
  ok(mit.status === 'optimal' && ohne.status === 'optimal' && mit.laenge <= ohne.laenge,
     `mit Extra-Glas ist das Level nicht schwerer (${ohne.laenge} -> ${mit.laenge} Zuege)`);
}

console.log('\n--- Extra-Glas in der Partie ---');
{
  const level = generate(556, 2);
  const p = new Partie(level);
  ok(!p.hatExtraGlas, 'eine frische Partie hat kein Extra-Glas');
  ok(p.extraGlas(), 'das Extra-Glas laesst sich holen');
  ok(p.hatExtraGlas, '... und ist danach da');
  ok(!p.extraGlas(), 'ein ZWEITES gibt es nicht');
  ok(p.zustand.glaeser === level.glaeser + 1, 'das Brett hat ein Glas mehr');

  // Der Undo-Stapel muss die neuen Indizes vertragen: ein Zug INS Extra-Glas
  // und wieder zurueck.
  const zugInsNeue = legaleZuege(p.zustand).find((z) => z.nach === level.glaeser);
  ok(zugInsNeue !== undefined, 'es gibt einen Zug in das Extra-Glas');
  if (zugInsNeue) {
    const vorher = schluessel(p.zustand);
    ok(p.pour(zugInsNeue.von, zugInsNeue.nach).ok, 'der Zug geht durch');
    ok(p.undo(), 'und laesst sich zuruecknehmen');
    ok(schluessel(p.zustand) === vorher, '... bitgenau');
  }

  // Neustart BEHAELT das Extra-Glas — wer ein Werbevideo dafuer gesehen hat,
  // darf es nicht durch einen Neustart verlieren.
  p.neustart();
  ok(p.hatExtraGlas && p.zustand.glaeser === level.glaeser + 1,
     'der Neustart behaelt das Extra-Glas');
  ok(p.zugzahl === 0, '... setzt die Zugzahl aber zurueck');

  // Und der Kern: mit Extra-Glas gibt es HOECHSTENS zwei Sterne.
  const loesung = solve(p.zustand);
  for (const zug of loesung.zuege) p.pour(zug.von, zug.nach);
  ok(p.isSolved(), 'das Level laesst sich mit Extra-Glas loesen');
  ok(p.sterne() === 2,
     `perfekt gespielt gibt es mit Extra-Glas zwei Sterne, nicht drei (${p.sterne()})`);

  const sauber = new Partie(level);
  const l2 = solve(sauber.zustand);
  for (const zug of l2.zuege) sauber.pour(zug.von, zug.nach);
  ok(sauber.sterne() === 3, 'ohne Extra-Glas gibt dieselbe Leistung drei Sterne');
}

console.log('\n--- Warum es im Tagesraetsel kein Extra-Glas gibt ---');
{
  // Der Server baut das Brett aus dem Level, also OHNE Extra-Glas. Eine
  // Zugfolge, die das zusaetzliche Glas benutzt, ist dort nicht nachspielbar —
  // deshalb waere sie in einer Bestenliste nicht vergleichbar.
  const level = generate(557, 2);
  const p = new Partie(level);
  p.extraGlas();

  // Das Extra-Glas MUSS in der Folge vorkommen, sonst prueft der Test nichts:
  // eine Loesung, die das zusaetzliche Glas gar nicht anfasst, laesst sich
  // natuerlich auch ohne es nachspielen. Genau das ist hier beim ersten Anlauf
  // passiert — mit Extra-Glas war die kuerzeste Loesung dieselbe wie ohne.
  const hinein = legaleZuege(p.zustand).find((z) => z.nach === level.glaeser)!;
  ok(p.pour(hinein.von, hinein.nach).ok, 'erster Zug geht ins Extra-Glas');

  const loesung = solve(p.zustand);
  for (const zug of loesung.zuege) p.pour(zug.von, zug.nach);
  ok(p.isSolved(), 'die Partie ist mit Extra-Glas geloest');
  ok(p.zuege.some((z) => z.von === level.glaeser || z.nach === level.glaeser),
     'die Zugfolge benutzt das Extra-Glas wirklich');

  const nach = replay(level, p.zuege);
  ok(!(nach.gueltig && nach.geloest),
     'dieselbe Zugfolge ist auf dem Brett OHNE Extra-Glas nicht nachspielbar');
  ok(nach.grund === 'index',
     `... und der Grund benennt es: ein Glas, das es dort nicht gibt (${nach.grund})`);
  ok(!istGeloest(nach.endstand), '... der Endstand ist nicht geloest');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
