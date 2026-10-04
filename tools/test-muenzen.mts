// Prueft die Muenzregeln.
//
// Klein, aber nicht unwichtig: hier haengt die Balance des ganzen Spiels dran.
// Zahlt ein Level mehrfach, laesst sich die Waehrung farmen und der Preis fuer
// den Tipp ist wirkungslos — und damit auch die ganze Arbeit an der
// Schwierigkeitskurve.
//
// Aufruf: npx tsx tools/test-muenzen.mts
// Schneller: node tools/test-muenzen.mts
import {
  BELOHNUNG_VIDEO, KOSTEN_RUECKKAUF, KOSTEN_TIPP, LOHN, START, VIDEOS_JE_TAG,
  ladeMuenzen, ladeVideoStand, lohnFuer, reichtFuer, speichereMuenzen, speichereVideoStand,
  videoKontingent, zaehleVideo,
} from '../src/lib/muenzen.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

console.log('--- Die Staffel ---');
ok(LOHN.length === 4, 'es gibt einen Lohn je Sternzahl 0..3');
ok(LOHN[0] === 0, 'ohne Stern gibt es nichts');
ok(LOHN[1]! < LOHN[2]! && LOHN[2]! < LOHN[3]!, 'mehr Sterne bringen mehr');
ok(LOHN[3]! > 2 * LOHN[1]!, 'drei Sterne bringen mehr als doppelt so viel wie einer');

console.log('\n--- Gezahlt wird nur die Verbesserung ---');
ok(lohnFuer(0, 3) === LOHN[3], 'das erste Mal drei Sterne zahlt den vollen Lohn');
ok(lohnFuer(1, 3) === LOHN[3]! - LOHN[1]!, 'von einem auf drei Sterne zahlt die Differenz');
ok(lohnFuer(3, 3) === 0, 'dasselbe Ergebnis noch einmal zahlt NICHTS — sonst liesse sich farmen');
ok(lohnFuer(3, 1) === 0, 'ein schlechterer Lauf zahlt nichts und nimmt nichts weg');
ok(lohnFuer(0, 0) === 0, 'ein nicht geloestes Level zahlt nichts');

console.log('\n--- Unsinnige Eingaben ---');
ok(lohnFuer(-5, 9) === LOHN[3], 'Werte ausserhalb 0..3 werden geklemmt, nicht geglaubt');
ok(Number.isFinite(lohnFuer(NaN, NaN)), 'NaN ergibt nie NaN-Muenzen');

console.log('\n--- Preise ---');
ok(KOSTEN_TIPP > 0 && KOSTEN_RUECKKAUF > 0, 'beide Preise sind echte Preise');
ok(KOSTEN_TIPP > KOSTEN_RUECKKAUF,
   'der Tipp kostet mehr als ein Zug zurueck — er nimmt die Aufgabe ab, nicht nur den Fehler');
ok(START >= KOSTEN_TIPP,
   `das Startguthaben (${START}) traegt mindestens einen Tipp zum Kennenlernen`);
// Seit 1.1.0 sind Hilfen knapp: rund eine je acht bis zehn Level. Gerechnet
// mit einem Spieler, der abwechselnd zwei und drei Sterne holt.
{
  const jeLevel = (LOHN[2]! + LOHN[3]!) / 2;
  const levelJeTipp = KOSTEN_TIPP / jeLevel;
  const levelJeRueckkauf = KOSTEN_RUECKKAUF / jeLevel;
  ok(levelJeTipp >= 8 && levelJeTipp <= 12,
     `ein Tipp kostet rund zehn Level Lohn (${levelJeTipp.toFixed(1)})`);
  ok(levelJeRueckkauf >= 6 && levelJeRueckkauf <= 10,
     `ein Zug zurueck kostet rund acht Level Lohn (${levelJeRueckkauf.toFixed(1)})`);
  ok(LOHN[3]! < KOSTEN_RUECKKAUF,
     'kein einzelnes Level finanziert eine Hilfe — sonst waeren die Preise wirkungslos');
  ok(BELOHNUNG_VIDEO > LOHN[3]!, 'ein Muenzvideo bringt mehr als ein perfektes Level');
}

console.log('\n--- Reicht es? ---');
ok(reichtFuer(KOSTEN_TIPP, KOSTEN_TIPP), 'genau der Preis reicht');
ok(!reichtFuer(KOSTEN_TIPP - 1, KOSTEN_TIPP), 'eine Muenze zu wenig reicht nicht');
ok(!reichtFuer(0, 1), 'ohne Guthaben reicht gar nichts');

console.log('\n--- Speicher ohne localStorage ---');
{
  // In Node gibt es kein localStorage. Genau das ist der Fall, den die App im
  // privaten Fenster erlebt: jeder Zugriff wirft, und trotzdem muss gespielt
  // werden koennen.
  const hat = typeof localStorage !== 'undefined';
  ok(!hat, 'dieser Lauf hat wirklich kein localStorage (sonst prueft der Test nichts)');
  ok(ladeMuenzen() === START, 'ohne Speicher steht das Startguthaben bereit');
  let geworfen = false;
  try {
    speichereMuenzen(42);
  } catch {
    geworfen = true;
  }
  ok(!geworfen, 'speichern ohne Speicher wirft nicht');
}

console.log('\n--- Tagesdeckel fuer Muenzvideos ---');
{
  ok(VIDEOS_JE_TAG === 3, 'hoechstens drei Muenzvideos am Tag');
  const tag = '2026-10-04';
  ok(videoKontingent(null, tag) === 3, 'ohne Stand gehen alle drei');
  let s = zaehleVideo(null, tag);
  ok(s.tag === tag && s.anzahl === 1, 'das erste Video zaehlt eins');
  ok(videoKontingent(s, tag) === 2, 'danach noch zwei');
  s = zaehleVideo(zaehleVideo(s, tag), tag);
  ok(videoKontingent(s, tag) === 0, 'nach drei Videos ist fuer heute Schluss');
  ok(videoKontingent(zaehleVideo(s, tag), tag) === 0, 'ein viertes macht den Rest nie negativ');
  ok(videoKontingent(s, '2026-10-05') === 3, 'am naechsten Tag geht es von vorn los');
  ok(zaehleVideo(s, '2026-10-05').anzahl === 1, 'ein neuer Tag faengt bei eins an');
  ok(Number.isFinite(videoKontingent({ tag, anzahl: NaN }, tag)),
     'ein verbogener Stand ergibt nie NaN');
  ok(videoKontingent({ tag, anzahl: -4 }, tag) === 3, 'ein negativer Stand wird geklemmt');
  ok(ladeVideoStand() === null, 'ohne Speicher gibt es keinen Stand');
  let geworfen = false;
  try { speichereVideoStand(s); } catch { geworfen = true; }
  ok(!geworfen, 'speichern ohne Speicher wirft nicht');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
