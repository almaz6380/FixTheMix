// Levelbau durch RUECKWAERTSSPIEL.
//
// Vom geloesten Brett aus werden Zuege rueckwaerts angewandt. Was dabei
// herauskommt, ist per Konstruktion loesbar — der Rueckweg IST eine Loesung.
//
// VERWORFEN: vorwaerts zufaellig befuellen und den Loeser verwerfen lassen.
// Das kostet den vollen Loeserlauf fuer JEDES abgelehnte Brett, und die
// Ablehnungsquote steigt genau dort steil an, wo die Level interessant
// werden (wenige leere Glaeser). Schlimmer: es gibt keinen Hebel auf das,
// worauf es hier ankommt — ein zufaellig befuelltes Brett mit Orange darin
// ist meistens auch OHNE Shaker sortierbar, und die Mix-Mechanik waere
// Dekoration.
//
// WIE DER SHAKER ERZWUNGEN WIRD
// Das Rueckwaerts-Schuetteln nimmt ein volles Glas Orange vom Brett und legt
// dafuer je hoehe/2 Rot und Gelb hinein. Danach ist die Rot-Menge auf dem
// Brett kein Vielfaches von hoehe mehr — und weil im Ziel jede Farbe in
// VOLLEN Glaesern liegt, kann Rot ohne Mischen gar nicht mehr aufgehen.
// Das ist kein Daumenwert, sondern dieselbe Rechnung, die schuettelBedarf()
// anstellt. Deshalb prueft der Generator hart nach:
//
//     schuettelBedarf(start) === mischungen
//
// Gleichheit, nicht ">= 1": zwei Rueckwaerts-Schuettel desselben Paares
// heben sich auf (2+2 Rot ergibt wieder ein Vielfaches von 4), und das Level
// waere still wieder ohne Shaker loesbar.

import { FARBEN, MISCHTABELLE, codeVon, type FarbCode } from './farben.ts';
import type { Level, Schwierigkeit, Spielstand } from './typen.ts';
import { STROM, zufall, type Zufall } from './zufall.ts';
import {
  frei, istGeloest, laufOben, leererStand, oben, schluessel, startAusStand,
} from './zustand.ts';
import { schuettelBedarf, solve } from './loeser.ts';

/**
 * Die Stufen. `leer` ist der staerkste Regler ueberhaupt — ein leeres Glas
 * weniger macht ein Level ungleich schwerer als zwei Farben mehr.
 * `mischungen` ist der FixTheMix-eigene Regler.
 *
 * GEMESSENE GRENZE (25.09.2026, Node 22, diese Maschine). Nicht geraten,
 * sondern durchprobiert — und der Grund, warum die Leiter hier aufhoert:
 *
 *   reines Fix-Level  10 Glaeser / 6 Farben        ~ 25 ms je Level
 *   reines Fix-Level  12 Glaeser / 7 Farben        ~100 ms je Level
 *   reines Fix-Level  14 Glaeser / 8 Farben        ~1,4 s  je Level
 *   1 Shaker, 1 Mischung,  7 Glaeser               ~190 ms je Level
 *   1 Shaker, 2 Mischungen, 9 Glaeser, 3 leer      ~800 ms je Level
 *   1 Shaker, 2 Mischungen, 10 Glaeser             ~3,5 s, ein Drittel faellt durchs Budget
 *   2 Shaker, 2 Mischungen, 10 Glaeser             unbrauchbar (5 von 6 Anlaeufen sprengen das Budget)
 *
 * Der Engpass ist NICHT das Spielen, sondern der BEWEIS der Optimalitaet —
 * und den braucht es, weil drei Sterne am echten Optimum haengen. Ein
 * zweiter Shaker vervielfacht den Verzweigungsgrad, weil jeder Behaelter als
 * Giessziel dazukommt.
 *
 * Wer groessere Level will (Phase 3), kann sie erzeugen: der Generator laeuft
 * ohnehin im Voraus, nicht auf dem Geraet. Dann mit `maxMs`/`versuche` hoch
 * und einmal ueber Nacht. Auf dem Geraet sucht nie jemand — das Optimum steht
 * im Level, und der Tipp bekommt sein eigenes kleines Budget.
 *
 * Die Reihenfolge hier ist grob nach Kosten, nicht nach Spielgefuehl. Welche
 * Stufe in der App auf welches Level trifft, entscheidet Phase 3.
 */
export const STUFEN: readonly Schwierigkeit[] = [
  { name: 'Start',    glaeser: 5,  hoehe: 4, farben: 3, leer: 2, shaker: 0, mischungen: 0, schritte: 8,  zuegeMin: 3,  zuegeMax: 14 },
  { name: 'Leicht',   glaeser: 6,  hoehe: 4, farben: 4, leer: 2, shaker: 0, mischungen: 0, schritte: 12, zuegeMin: 6,  zuegeMax: 20 },
  { name: 'Mittel',   glaeser: 8,  hoehe: 4, farben: 5, leer: 2, shaker: 0, mischungen: 0, schritte: 18, zuegeMin: 10, zuegeMax: 30 },
  { name: 'Gross',    glaeser: 10, hoehe: 4, farben: 6, leer: 2, shaker: 0, mischungen: 0, schritte: 22, zuegeMin: 12, zuegeMax: 40 },
  { name: 'Weit',     glaeser: 12, hoehe: 4, farben: 7, leer: 2, shaker: 0, mischungen: 0, schritte: 26, zuegeMin: 14, zuegeMax: 48 },
  { name: 'Shaker',   glaeser: 7,  hoehe: 4, farben: 4, leer: 2, shaker: 1, mischungen: 1, schritte: 12, zuegeMin: 8,  zuegeMax: 28 },
  { name: 'Shaker+',  glaeser: 9,  hoehe: 4, farben: 5, leer: 3, shaker: 1, mischungen: 2, schritte: 18, zuegeMin: 10, zuegeMax: 42 },
];

/** Stufen ohne Shaker — die billigen. Fuer Massenlaeufe in den Tests. */
export const FIX_STUFEN: readonly number[] = [0, 1, 2, 3, 4];
/** Stufen mit Shaker — die teuren, aber die mit der FixTheMix-Mechanik. */
export const MISCH_STUFEN: readonly number[] = [5, 6];

const PAARE = MISCHTABELLE.map((r) => ({
  a: codeVon(r.aus[0]),
  b: codeVon(r.aus[1]),
  ergibt: codeVon(r.ergibt),
}));

const GRUNDFARBEN: FarbCode[] = FARBEN.filter((f) => f.art === 'grund').map((f) => codeVon(f.id));
const PURFARBEN: FarbCode[] = FARBEN.filter((f) => f.art === 'pur').map((f) => codeVon(f.id));
const MISCHFARBEN: FarbCode[] = FARBEN.filter((f) => f.art === 'misch').map((f) => codeVon(f.id));

/**
 * Giesst rueckwaerts: nimmt `menge` Schichten vom obersten Lauf aus `quelle`
 * und legt sie auf `ziel`.
 *
 * DREI BEDINGUNGEN, damit der Vorwaertszug `giessen(ziel -> quelle)` genau
 * diese Menge zurueckbewegt. Die dritte hat beim ersten Anlauf gefehlt und
 * den ganzen Generator lahmgelegt — es lohnt, sie sich zu merken:
 *
 *  1. `ziel` ist leer oder traegt oben eine ANDERE Farbe. Sonst waere der
 *     Lauf in `ziel` laenger als `menge`, und vorwaerts floesse mehr.
 *  2. In `ziel` ist Platz fuer `menge`.
 *  3. NUR wenn `quelle` ein GLAS ist: nach der Entnahme traegt es oben
 *     wieder dieselbe Farbe, oder es ist leer. Denn vorwaerts gilt fuer ein
 *     Glas die Genre-Regel — man giesst nur auf dieselbe Farbe oder ins
 *     Leere. Also entweder `menge` < Lauf (Farbe bleibt oben) oder
 *     `menge` = Fuellstand (Glas wird leer). Fuer einen Shaker als Quelle
 *     entfaellt das: dort entscheiden Kontingent und Mischpaar.
 *
 * Ohne Bedingung 3 blieben vom geloesten Brett aus nur Zuege uebrig, die ein
 * volles einfarbiges Glas in ein leeres schieben — also reine Umbenennungen.
 * Das Brett blieb geloest, und `generate` fand nie ein Level.
 */
function unGiessen(z: Spielstand, quelle: number, ziel: number, menge: number): boolean {
  const lauf = laufOben(z, quelle);
  if (menge < 1 || menge > lauf) return false;
  // Bedingung 3 gilt NUR fuer Glaeser. Ist die Quelle ein Shaker, lautet der
  // Vorwaertszug `giessen(ziel -> shaker)`, und in den Shaker giesst man nicht
  // nach der Glasregel, sondern nach Kontingent und Mischpaar. Dort darf ein
  // ganzer Lauf also auch dann zurueckwandern, wenn darunter die andere
  // Grundfarbe liegt — genau so wird der Shaker rueckwaerts geleert.
  if (quelle < z.glaeser && menge === lauf && menge !== z.fuell[quelle]!) return false;
  const farbe = oben(z, quelle);
  if (frei(z, ziel) < menge) return false;
  const zielOben = oben(z, ziel);
  if (zielOben !== 0 && zielOben === farbe) return false;

  const qb = quelle * z.hoehe, zb = ziel * z.hoehe;
  let fq = z.fuell[quelle]!, fz = z.fuell[ziel]!;
  for (let k = 0; k < menge; k++) {
    z.zellen[qb + fq - 1] = 0;
    z.zellen[zb + fz] = farbe;
    fq--; fz++;
  }
  z.fuell[quelle] = fq;
  z.fuell[ziel] = fz;
  return true;
}

/** Alle moeglichen Rueckwaertsgiessungen zwischen Glaesern, als (von, nach, menge). */
function unGiessKandidaten(z: Spielstand): [number, number, number][] {
  const raus: [number, number, number][] = [];
  for (let q = 0; q < z.glaeser; q++) {
    const lauf = laufOben(z, q);
    if (lauf === 0) continue;
    const farbe = oben(z, q);
    const fuell = z.fuell[q]!;
    for (let t = 0; t < z.glaeser; t++) {
      if (t === q) continue;
      const to = oben(z, t);
      if (to !== 0 && to === farbe) continue;
      const platz = frei(z, t);
      for (let menge = 1; menge <= Math.min(lauf, platz); menge++) {
        if (menge === lauf && menge !== fuell) continue;
        raus.push([q, t, menge]);
      }
    }
  }
  return raus;
}

/**
 * Baut das geloeste Zielbrett und zieht die Mischpaare, die rueckwaerts
 * wieder ausgebaut werden.
 *
 * DIE PAARE DUERFEN SICH WIEDERHOLEN — das ist wichtig und war anfangs
 * falsch. Zieht man drei VERSCHIEDENE Paare, also Rot+Gelb, Gelb+Blau und
 * Rot+Blau, dann bekommt jede Grundfarbe genau zweimal hoehe/2 dazu, also
 * hoehe. Damit ist jede Grundfarbenmenge wieder ein Vielfaches von hoehe,
 * die Bilanz geht ohne einen einzigen Schuettelzug auf, und das Level waere
 * ohne Shaker loesbar. Stufe „Bar" hat deshalb anfangs KEIN einziges Level
 * geliefert — zu Recht, die Pruefung hat gegriffen.
 *
 * Mit Wiederholung bleibt ein Rest: zweimal Rot+Gelb und einmal Gelb+Blau
 * ergibt Rot +hoehe, Gelb +1.5*hoehe, Blau +hoehe/2 — und mindestens ein
 * Schuettelzug ist unvermeidbar.
 */
function zielBrett(s: Schwierigkeit, r: Zufall): { z: Spielstand; paare: typeof PAARE } | null {
  const voll = s.glaeser - s.leer;

  const paare = Array.from({ length: s.mischungen }, () => r.zieh(PAARE));
  const mischBedarf = new Map<FarbCode, number>();
  for (const p of paare) mischBedarf.set(p.ergibt, (mischBedarf.get(p.ergibt) ?? 0) + 1);
  const mischFarben = [...mischBedarf.keys()];
  if (mischFarben.length > s.farben) return null;

  // Jede Mischfarbe bekommt GENAU so viele volle Glaeser, wie das
  // Rueckwaerts-Schuetteln davon auffrisst. Danach steht sie zu Spielbeginn
  // nirgends mehr auf dem Brett: sie MUSS erst gemischt werden.
  // Fuellfarben: Grund, Pur — und auch Mischfarben, SOFERN sie nicht
  // rueckwaerts ausgebaut werden. Eine Mischfarbe, die einfach als volles
  // Glas auf dem Brett steht, ist zum Sortieren so gut wie jede andere; sie
  // muss dann eben nicht gemischt werden. Ohne sie standen einem reinen
  // Fix-Level nur sechs Farben zur Verfuegung, und Stufen mit sieben oder
  // acht Farben liessen sich gar nicht bauen.
  const uebrige = r.mische([
    ...GRUNDFARBEN,
    ...PURFARBEN,
    ...MISCHFARBEN.filter((c) => !mischBedarf.has(c)),
  ]);
  const wahl: FarbCode[] = [...mischFarben];
  for (const c of uebrige) {
    if (wahl.length >= s.farben) break;
    if (!wahl.includes(c)) wahl.push(c);
  }
  if (wahl.length < s.farben) return null;

  const proFarbe = new Map<FarbCode, number>();
  for (const c of wahl) proFarbe.set(c, mischBedarf.get(c) ?? 1);
  let vergeben = 0;
  for (const n of proFarbe.values()) vergeben += n;
  if (vergeben > voll) return null;

  // Restliche volle Glaeser nur auf Nicht-Mischfarben verteilen — sonst
  // bliebe Mischfarbe auf dem Brett liegen und muesste nicht gemischt werden.
  const verteilbar = wahl.filter((c) => !mischBedarf.has(c));
  if (verteilbar.length === 0 && vergeben < voll) return null;
  for (let k = vergeben; k < voll; k++) {
    const c = r.zieh(verteilbar);
    proFarbe.set(c, proFarbe.get(c)! + 1);
  }

  const z = leererStand(s.glaeser, s.shaker, s.hoehe);
  let b = 0;
  for (const [c, anzahl] of proFarbe) {
    for (let k = 0; k < anzahl; k++) {
      for (let i = 0; i < s.hoehe; i++) z.zellen[b * s.hoehe + i] = c;
      z.fuell[b] = s.hoehe;
      b++;
    }
  }
  return { z, paare };
}

/**
 * Ein Rueckwaerts-Schuettelvorgang: volles Mischglas -> Shaker, entmischen,
 * Shaker per Rueckwaertsgiessen leeren.
 * Liefert die Zahl der so umgekehrten Vorwaertszuege, oder -1 bei Misserfolg.
 */
function unSchuetteln(
  z: Spielstand, paar: (typeof PAARE)[number], r: Zufall,
): number {
  const H = z.hoehe;
  const shaker = z.glaeser + r.unter(z.shaker);
  if (z.fuell[shaker]! !== 0) return -1;

  // 1. Volles Glas der Mischfarbe suchen und in den Shaker kippen.
  const kandidaten: number[] = [];
  for (let b = 0; b < z.glaeser; b++) {
    if (z.fuell[b]! === H && oben(z, b) === paar.ergibt && laufOben(z, b) === H) kandidaten.push(b);
  }
  if (kandidaten.length === 0) return -1;
  const glas = r.zieh(kandidaten);
  for (let i = 0; i < H; i++) {
    z.zellen[shaker * H + i] = paar.ergibt;
    z.zellen[glas * H + i] = 0;
  }
  z.fuell[shaker] = H;
  z.fuell[glas] = 0;
  let zuege = 1;

  // 2. Entmischen: hoehe/2 von jeder Grundfarbe, in zufaelliger Anordnung.
  //    Die Anordnung entscheidet, wie viele Rueckwaertsgiessungen Schritt 3
  //    braucht — [a,a,b,b] sind zwei, [a,b,b,a] sind drei.
  const halb = H / 2;
  const muster = r.mische([
    ...new Array<FarbCode>(halb).fill(paar.a),
    ...new Array<FarbCode>(halb).fill(paar.b),
  ]);
  for (let i = 0; i < H; i++) z.zellen[shaker * H + i] = muster[i]!;
  zuege++;

  // 3. Shaker rueckwaerts in Glaeser leeren.
  let schutz = 0;
  while (z.fuell[shaker]! > 0) {
    if (++schutz > 2 * H) return -1;
    const menge = laufOben(z, shaker);
    const farbe = oben(z, shaker);
    const ziele: number[] = [];
    for (let b = 0; b < z.glaeser; b++) {
      if (frei(z, b) < menge) continue;
      const to = oben(z, b);
      if (to !== 0 && to === farbe) continue;
      ziele.push(b);
    }
    if (ziele.length === 0) return -1;
    if (!unGiessen(z, shaker, r.zieh(ziele), menge)) return -1;
    zuege++;
  }
  return zuege;
}

export interface GeneratorOptionen {
  /** Wie oft ein Seed mit neuem Nonce neu versucht wird. */
  versuche?: number;
  /** Knotendeckel je Loeserlauf. 0 waere unbegrenzt — hier nie sinnvoll. */
  maxKnoten?: number;
  /** Zeitdeckel je Loeserlauf in Millisekunden. 0 schaltet ihn ab. */
  maxMs?: number;
}

/**
 * Baut ein Level. Gleicher Seed und gleiche Stufe ergeben bitgenau dasselbe
 * Level — darauf beruhen Tagesraetsel, Duelle und die Wiedergabepruefung.
 *
 * Wirft, wenn nach `versuche` Anlaeufen nichts im Zugband liegt. Lieber ein
 * lauter Fehler als ein Level ohne bewiesenes Optimum: die Sternschwellen
 * haengen daran.
 */
export function generate(
  seed: number,
  stufe: number | Schwierigkeit,
  optionen: GeneratorOptionen = {},
): Level {
  const s = typeof stufe === 'number' ? STUFEN[stufe] : stufe;
  if (!s) throw new Error(`Unbekannte Stufe: ${String(stufe)}`);
  const stufenNummer = typeof stufe === 'number' ? stufe : -1;
  if (s.mischungen > 0 && s.hoehe % 2 !== 0) {
    throw new Error('Mischlevel brauchen eine gerade hoehe');
  }

  const versuche = optionen.versuche ?? 40;

  for (let nonce = 0; nonce < versuche; nonce++) {
    const r = zufall(seed, (STROM.aufbau ^ Math.imul(nonce + 1, 0x9e3779b1)) >>> 0);
    const gebaut = zielBrett(s, r);
    if (!gebaut) continue;
    const { z, paare } = gebaut;
    const zielSchluessel = schluessel(z);

    // --- Rueckwaerts-Schuettel ---
    let rueckZuege = 0;
    let misslungen = false;
    for (const paar of paare) {
      const k = unSchuetteln(z, paar, r);
      if (k < 0) { misslungen = true; break; }
      rueckZuege += k;
    }
    if (misslungen) continue;

    // Die harte Zusicherung: der Shaker ist erzwungen, nicht Dekoration.
    if (s.mischungen > 0 && schuettelBedarf(z) < 1) continue;

    // --- Rueckwaerts-Giessen, nur zwischen Glaesern ---
    let zuletzt: [number, number] | null = null;
    for (let k = 0; k < s.schritte; k++) {
      const kandidaten = unGiessKandidaten(z).filter(
        ([q, t]) => !(zuletzt && zuletzt[0] === t && zuletzt[1] === q),
      );
      if (kandidaten.length === 0) break;
      const [q, t, menge] = r.zieh(kandidaten);
      if (!unGiessen(z, q, t, menge)) break;
      zuletzt = [q, t];
      rueckZuege++;
    }

    if (istGeloest(z)) continue;
    if (schluessel(z) === zielSchluessel) continue;

    // Der GEMESSENE Mischbedarf, nicht die Zahl der Rueckwaerts-Schuettel.
    //
    // Die beiden koennen auseinandergehen, und das ist kein Fehler: baut man
    // rueckwaerts einmal Rot+Gelb und einmal Gelb+Blau aus, laesst sich die
    // Bilanz auch mit einem EINZIGEN Schuetteln von Rot+Blau schliessen —
    // dann entsteht eben Lila statt Orange und Gruen, und die Siegbedingung
    // ist genauso erfuellt. Wer hier `mischungen` hineinschreiben wuerde,
    // legte eine Zahl ins Level, die kein Spieler erreichen muss.
    //
    // Das Giessen zwischen Glaesern aendert keine Farbmengen, deshalb gilt
    // der Wert unveraendert auch nach dem Verwuerfeln.
    const bedarf = schuettelBedarf(z);
    if (s.mischungen > 0 && bedarf < 1) continue;
    if (s.mischungen === 0 && bedarf !== 0) continue;

    // --- Optimum messen. Die Laenge des Rueckwegs ist eine gueltige obere
    //     Schranke: Knoten mit f > rueckZuege koennen nicht besser werden.
    //     Das ist der groesste einzelne Geschwindigkeitsgewinn hier.
    // Budget ist Pflicht, nicht Kuer: ohne es kann ein einzelner Anlauf
    // beliebig lange rechnen, und `generate` haette keine Laufzeitschranke.
    // Ein gesprengtes Budget heisst schlicht: naechster Nonce. Damit bleibt
    // die Zusicherung „jedes ausgelieferte Level hat ein BEWIESENES Optimum"
    // unangetastet — geraten wird nie.
    const loesung = solve(z, {
      schranke: rueckZuege,
      maxKnoten: optionen.maxKnoten ?? 250_000,
      maxMs: optionen.maxMs ?? 1500,
    });
    if (loesung.status !== 'optimal') continue;
    if (loesung.laenge < s.zuegeMin || loesung.laenge > s.zuegeMax) continue;

    return {
      version: 1,
      seed,
      stufe: stufenNummer,
      hoehe: s.hoehe,
      glaeser: s.glaeser,
      shaker: s.shaker,
      start: startAusStand(z),
      optimalZuege: loesung.laenge,
      schuettelZuege: bedarf,
      sterne: sterneSchwellen(loesung.laenge),
    };
  }

  throw new Error(
    `generate(${seed}, ${s.name}) hat nach ${versuche} Anlaeufen kein Level im Band ` +
    `[${s.zuegeMin}, ${s.zuegeMax}] gefunden`,
  );
}

/**
 * Drei Sterne NUR fuer das Optimum — so steht es im Bauplan. Zwei Sterne bis
 * ein Viertel darueber, sonst ein Stern fuers Loesen.
 */
export function sterneSchwellen(optimum: number): { drei: number; zwei: number } {
  return { drei: optimum, zwei: Math.ceil(optimum * 1.25) };
}

/** Sterne fuer eine geloeste Partie. 0, wenn gar nicht geloest. */
export function sterneFuer(level: Level, zuege: number, geloest: boolean): number {
  if (!geloest) return 0;
  if (zuege <= level.sterne.drei) return 3;
  if (zuege <= level.sterne.zwei) return 2;
  return 1;
}
