// Prueft das Tagesraetsel: Datumsrechnung, Wochenleiter, Serie, Teiltext.
//
// Warum das ein eigenes Skript verdient: die Datumsrechnung ist der Teil, der
// still falsch wird. Ein Fehler am Schalttag oder an der Zeitzone zeigt sich an
// EINEM Tag im Jahr, trifft dann alle Spieler gleichzeitig, und niemand kann
// ihn hinterher nachstellen. Also wird hier gerechnet, nicht gehofft.
//
// Aufruf: npx tsx tools/test-tagesraetsel.mts
// Schneller: node tools/test-tagesraetsel.mts
import { generate } from '../src/engine/generator.ts';
import {
  TAG_NULL, alsIso, seedFuerTag, stufeFuerTag, tagDanach, tagDavor, tagLevel,
  tagesNummer, tagesZahl, wochentag,
} from '../src/engine/tagesraetsel.ts';
import { pruefeTag } from '../src/engine/tagespruefung.ts';
import { solve } from '../src/engine/loeser.ts';
import { istGeloest, standAusLevel } from '../src/engine/zustand.ts';
import { loesbar } from '../src/engine/loeser.ts';
import { heute, merkeTag, serieLaeuft, tagGeloest } from '../src/lib/serie.ts';
import { balken, teilText } from '../src/lib/teilen.ts';
import type { Taeglich } from '../src/lib/serie.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

console.log('--- Datumsrechnung ---');
ok(tagesNummer(TAG_NULL) === 1, `${TAG_NULL} ist Tag 1`);
ok(tagesNummer('2026-09-27') === 2, 'der Tag danach ist Tag 2');
ok(tagDavor('2026-01-01') === '2025-12-31', 'ueber den Jahreswechsel rueckwaerts');
ok(tagDavor('2028-03-01') === '2028-02-29', 'im Schaltjahr liegt vor dem 1. Maerz der 29. Februar');
ok(tagDavor('2027-03-01') === '2027-02-28', '... in einem normalen Jahr der 28.');
ok(tagesNummer('2028-03-01') - tagesNummer('2028-02-01') === 29, 'Februar 2028 hat 29 Tage');
ok(tagesNummer('2027-03-01') - tagesNummer('2027-02-01') === 28, 'Februar 2027 hat 28');
ok(tagesNummer('2100-03-01') - tagesNummer('2100-02-01') === 28, '2100 ist KEIN Schaltjahr (Jahrhundertregel)');
ok(tagesNummer('2000-03-01') - tagesNummer('2000-02-01') === 29, '2000 war eines (400er-Regel)');

{
  // Rundlauf ueber 4000 Tage (rund elf Jahre, mit drei Schaltjahren):
  // Tageszahl -> Datum -> Tageszahl muss die Zahl zurueckgeben, und Nachbarn
  // muessen Nachbarn bleiben. Das faengt jeden Rundungsfehler, auch die, die
  // nur in einem einzigen Monat auftreten.
  let rundlauf = 0, nachbarn = 0, nichtSteigend = 0;
  let vorher = tagesNummer(alsIso(20_000));
  for (let n = 20_000; n < 24_000; n++) {
    const iso = alsIso(n);
    if (tagesZahl(iso) !== n) rundlauf++;
    if (tagDavor(alsIso(n + 1)) !== iso || tagDanach(iso) !== alsIso(n + 1)) nachbarn++;
    if (n > 20_000) {
      const jetzt = tagesNummer(iso);
      if (jetzt !== vorher + 1) nichtSteigend++;
      vorher = jetzt;
    }
  }
  ok(rundlauf === 0, 'Tageszahl -> Datum -> Tageszahl stimmt ueber 4000 Tage');
  ok(nachbarn === 0, 'tagDavor und tagDanach sind ueber 4000 Tage zueinander invers');
  ok(nichtSteigend === 0, 'die Tagesnummer steigt um genau 1 je Tag');
}

console.log('\n--- Krumme Daten fliegen auf ---');
for (const bad of ['2026-02-31', '2026-13-01', '2026-00-10', '26-09-01', '2026-9-1', '', 'heute']) {
  let geworfen = false;
  try {
    tagesNummer(bad);
  } catch {
    geworfen = true;
  }
  ok(geworfen, `"${bad}" wird abgelehnt`);
}

/** Ein bekannter Montag — von hier laeuft der Test die Woche ab. */
const MONTAG = '2026-09-28';

console.log('\n--- Wochenleiter ---');
ok(wochentag('2026-09-28') === 0, '2026-09-28 ist ein Montag');
ok(wochentag('2026-10-04') === 6, '2026-10-04 ist ein Sonntag');
{
  const woche = [];
  let tag = MONTAG;
  for (let k = 0; k < 7; k++) {
    woche.push(stufeFuerTag(tag));
    tag = tagDanach(tag);
  }
  let nichtSteigend = 0;
  for (let k = 1; k < 7; k++) {
    if (woche[k]!.zuegeMin < woche[k - 1]!.zuegeMin) nichtSteigend++;
  }
  ok(nichtSteigend === 0, 'von Montag bis Sonntag faellt der Boden nie');
  ok(woche[0]!.glaeser < woche[6]!.glaeser, 'sonntags ist das Brett groesser als montags');
}

console.log('\n--- Jedes Tagesraetsel ist spielbar ---');
{
  // Eine ganze Woche, damit jede Stufe der Leiter einmal dran ist.
  let nichtLoesbar = 0, geloest = 0, langsam = 0, maxMs = 0;
  let iso = MONTAG;
  for (let k = 0; k < 7; k++, iso = tagDanach(iso)) {
    const t0 = Date.now();
    const level = tagLevel(iso);
    const ms = Date.now() - t0;
    maxMs = Math.max(maxMs, ms);
    // 900 ms ist keine schoene Zahl, sondern die gemessene: ueber zehn Wochen
    // lag der schlimmste Tag bei 584 ms. Wer diese Grenze reisst, hat einen
    // Aufbau eingebaut, den ein Handy nicht mehr in vertretbarer Zeit erzeugt.
    if (ms > 900) langsam++;
    const z = standAusLevel(level);
    if (istGeloest(z)) geloest++;
    if (!loesbar(z, 200_000)) nichtLoesbar++;
  }
  ok(nichtLoesbar === 0, `alle sieben Wochentage sind loesbar (${nichtLoesbar} Ausreisser)`);
  ok(geloest === 0, 'keines startet geloest');
  // Das Tagesraetsel wird AUF DEM GERAET erzeugt. Wird ein Aufbau hier teuer,
  // wartet der Spieler auf dem Handy ein Mehrfaches davon.
  ok(langsam === 0, `kein Wochentag braucht ueber 900 ms (Maximum ${maxMs} ms)`);
}

console.log('\n--- Derselbe Tag, dasselbe Raetsel ---');
{
  const a = tagLevel('2026-10-07');
  const b = tagLevel('2026-10-07');
  ok(a.start === b.start && a.optimalZuege === b.optimalZuege,
     'zweimal derselbe Tag ergibt bitgenau dasselbe Brett');
  const c = tagLevel('2026-10-14');
  ok(a.start !== c.start, 'derselbe Wochentag eine Woche spaeter ist ein anderes Brett');
  // Und der Weg ueber die Einzelteile muss dasselbe liefern wie tagLevel() —
  // sonst koennte der Server das Brett des Clients nicht nachbauen.
  const d = generate(seedFuerTag('2026-10-07'), stufeFuerTag('2026-10-07'), { maxKnoten: 60_000 });
  ok(d.start === a.start, 'seedFuerTag + stufeFuerTag ergeben dasselbe Brett wie tagLevel');
}

console.log('\n--- Serie ---');
{
  const leer: Taeglich = { zuletzt: '', serie: 0, beste: 0, tage: {} };
  let t = merkeTag(leer, '2026-10-01', 20, 3);
  ok(t.serie === 1, 'der erste geloeste Tag macht Serie 1');
  ok(tagGeloest(t, '2026-10-01'), '... und der Tag gilt als geloest');
  t = merkeTag(t, '2026-10-02', 22, 2);
  ok(t.serie === 2, 'der Tag danach macht Serie 2');
  t = merkeTag(t, '2026-10-04', 25, 1);
  ok(t.serie === 1, 'ein uebersprungener Tag setzt die Serie auf 1 zurueck');
  ok(t.beste === 2, '... die beste Serie bleibt gespeichert');

  const wieder = merkeTag(t, '2026-10-04', 24, 3);
  ok(wieder.serie === 1, 'denselben Tag nochmal zu loesen zaehlt die Serie NICHT hoch');
  ok(wieder.tage['2026-10-04']?.sterne === 3, '... aber das bessere Ergebnis wird behalten');
  const schlechter = merkeTag(wieder, '2026-10-04', 40, 1);
  ok(schlechter.tage['2026-10-04']?.sterne === 3, 'ein schlechterer Lauf nimmt nichts weg');

  ok(serieLaeuft(wieder, '2026-10-04'), 'am geloesten Tag laeuft die Serie');
  ok(serieLaeuft(wieder, '2026-10-05'), '... und am Tag danach auch noch');
  ok(!serieLaeuft(wieder, '2026-10-06'), '... zwei Tage spaeter nicht mehr');
}

console.log('\n--- Ortstag, nicht UTC ---');
{
  // 23:30 Ortszeit. Wer hier UTC nimmt, liegt oestlich von Greenwich einen Tag
  // vor — genau der Einzeiler `toISOString().slice(0,10)`, den `heute()`
  // deshalb nicht benutzt.
  const spaet = new Date(2026, 9, 7, 23, 30, 0);
  ok(heute(spaet) === '2026-10-07', 'spaet abends gilt noch der heutige Tag');
  const frueh = new Date(2026, 9, 8, 0, 15, 0);
  ok(heute(frueh) === '2026-10-08', 'kurz nach Mitternacht der neue');
  ok(heute(new Date(2026, 0, 1)) === '2026-01-01', 'einstellige Monate und Tage bekommen eine Null');
}

console.log('\n--- Teiltext ---');
{
  const w = { zuege: 'Zuege', optimum: 'Optimum', serie: 'Tage Serie' };
  const perfekt = teilText({ nummer: 12, zuege: 20, optimum: 20, sterne: 3, serie: 5 }, w);
  ok(perfekt.includes('#12'), 'die Tagesnummer steht drin');
  ok(perfekt.includes('⭐⭐⭐'), 'drei Sterne stehen drin');
  ok(perfekt.includes('🔥 5'), 'die Serie steht drin');
  ok(!perfekt.includes('🍓') && !perfekt.includes('🍋'),
     'KEINE Farben im Text — der Teiltext darf das Raetsel nicht verraten');
  ok(balken(20, 20) === '🟩'.repeat(10), 'ein perfekter Lauf gibt zehn Felder');
  ok(balken(40, 20) === `${'🟩'.repeat(5)}${'⬜'.repeat(5)}`, 'der doppelte Weg gibt fuenf');
  ok(balken(21, 20) !== '🟩'.repeat(10), 'ein Zug zu viel gibt NICHT zehn Felder');
  // In Zeichen gezaehlt, nicht in `.length`: 🟩 belegt zwei UTF-16-Einheiten,
  // ⬜ nur eine. Was zaehlt, ist wie viele Felder der Leser sieht.
  const felder = (t: string) => [...t].length;
  ok(felder(balken(20, 20)) === 10 && felder(balken(99, 20)) === 10,
     'der Balken hat immer zehn Felder');
  const ohneSerie = teilText({ nummer: 1, zuege: 30, optimum: 20, sterne: 1, serie: 1 }, w);
  ok(!ohneSerie.includes('🔥'), 'bei Serie 1 wird die Zeile weggelassen');
}

console.log('\n--- Schummelschutz (die Rechnung der Edge Function) ---');
{
  const TAG = '2026-10-07';
  const echt = solve(standAusLevel(tagLevel(TAG))).zuege;

  const gut = pruefeTag({ datum: TAG, zuege: echt }, TAG);
  ok(gut.ok, 'eine echte Loesung wird angenommen');
  ok(gut.zuege === echt.length, '... mit selbst nachgezaehlter Zugzahl');
  ok(gut.sterne === 3, '... und drei Sternen fuer das Optimum');
  ok(gut.nummer === tagesNummer(TAG), '... und der richtigen Tagesnummer');

  // Das Datum darf um einen Tag abweichen — die Zeitzonen verlangen es.
  ok(pruefeTag({ datum: TAG, zuege: echt }, tagDavor(TAG)).ok,
     'ein Tag Vorsprung auf die Serverzeit ist erlaubt (Kiribati)');
  ok(pruefeTag({ datum: TAG, zuege: echt }, tagDanach(TAG)).ok,
     'ein Tag Rueckstand ebenfalls (Hawaii)');
  ok(pruefeTag({ datum: TAG, zuege: echt }, tagDanach(tagDanach(TAG))).grund === 'datum-fenster',
     'zwei Tage nicht — so holt sich niemand das Raetsel von uebermorgen');

  // Manipulationen.
  ok(pruefeTag({ datum: TAG, zuege: echt.slice(0, -1) }, TAG).grund === 'nicht-geloest',
     'ein fehlender letzter Zug loest nicht');
  const vertauscht = echt.slice();
  [vertauscht[0], vertauscht[1]] = [vertauscht[1]!, vertauscht[0]!];
  const u = pruefeTag({ datum: TAG, zuege: vertauscht }, TAG);
  ok(!u.ok, 'zwei vertauschte Zuege werden abgelehnt');
  ok(u.grund === 'ungueltiger-zug' || u.grund === 'nicht-geloest',
     `... mit benanntem Grund (${u.grund}${u.fehlerIndex >= 0 ? `, Index ${u.fehlerIndex}` : ''})`);
  ok(pruefeTag({ datum: '2026-02-31', zuege: echt }, TAG).grund === 'datum-form',
     'ein unmoegliches Datum wird abgelehnt');
  ok(pruefeTag({ datum: TAG, zuege: new Array(6000).fill({ von: 0, nach: 1 }) }, TAG).grund === 'zu-viele-zuege',
     'eine Liste mit 6000 Zuegen wird abgelehnt, OHNE sie nachzuspielen');

  // Und der Kern: ein Client, der behauptet, mit weniger als dem Optimum
  // geloest zu haben, kann das nicht — die Zugzahl kommt aus dem Nachspielen.
  const geschoent = pruefeTag({ datum: TAG, zuege: echt.slice(0, 3) }, TAG);
  ok(!geschoent.ok && geschoent.sterne === 0,
     'eine abgebrochene Folge bekommt null Sterne, nicht drei');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
