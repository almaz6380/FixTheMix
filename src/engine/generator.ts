// Levelbau durch RUECKWAERTSSPIEL.
//
// Vom geloesten Brett aus werden Zuege rueckwaerts angewandt. Was dabei
// herauskommt, ist per Konstruktion loesbar — der Rueckweg IST eine Loesung.
//
// VERWORFEN: vorwaerts zufaellig befuellen und den Loeser verwerfen lassen.
// Das kostet den vollen Loeserlauf fuer JEDES abgelehnte Brett, und die
// Ablehnungsquote steigt genau dort steil an, wo die Level interessant
// werden (wenige leere Glaeser).

import { FARBEN, codeVon, type FarbCode } from './farben.ts';
import type { Level, Schwierigkeit, Spielstand } from './typen.ts';
import { STROM, zufall, type Zufall } from './zufall.ts';
import { frei, istGeloest, laufOben, leererStand, oben, schluessel, startAusStand } from './zustand.ts';
import { solve } from './loeser.ts';

/**
 * Die Stufen. `leer` ist der staerkste Regler ueberhaupt — ein leeres Glas
 * weniger macht ein Level ungleich schwerer als zwei Farben mehr.
 *
 * SECHS SCHICHTEN je Glas (vorher vier, Josefs Entscheidung vom 25.09.2026).
 * Jede Farbe braucht damit sechs Einheiten fuer ein volles Glas.
 *
 * Gemessene Grenze: Der Engpass ist nicht das Spielen, sondern der BEWEIS der
 * Optimalitaet — und den braucht es, weil drei Sterne am echten Optimum
 * haengen. Ohne Shaker ist die Suche deutlich schlanker als vorher; die Werte
 * unten stehen in der CLAUDE.md.
 *
 * Wer groessere Level will, kann sie erzeugen: der Generator laeuft ohnehin
 * im Voraus, nicht auf dem Geraet. Dann `maxKnoten`/`versuche` hoch und einmal
 * ueber Nacht.
 */
export const STUFEN: readonly Schwierigkeit[] = [
  { name: 'Start',  glaeser: 5,  hoehe: 6, farben: 3, leer: 2, schritte: 8,  zuegeMin: 3,  zuegeMax: 16 },
  { name: 'Leicht', glaeser: 6,  hoehe: 6, farben: 4, leer: 2, schritte: 12, zuegeMin: 6,  zuegeMax: 22 },
  { name: 'Mittel', glaeser: 8,  hoehe: 6, farben: 5, leer: 2, schritte: 18, zuegeMin: 10, zuegeMax: 32 },
  { name: 'Gross',  glaeser: 10, hoehe: 6, farben: 6, leer: 2, schritte: 20, zuegeMin: 12, zuegeMax: 42 },
  { name: 'Weit',   glaeser: 12, hoehe: 6, farben: 7, leer: 3, schritte: 20, zuegeMin: 12, zuegeMax: 46 },
  { name: 'Bar',    glaeser: 14, hoehe: 6, farben: 8, leer: 4, schritte: 22, zuegeMin: 14, zuegeMax: 52 },
];

const ALLE_FARBEN: FarbCode[] = FARBEN.map((f) => codeVon(f.id));

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
 *  3. Nach der Entnahme traegt `quelle` oben WIEDER dieselbe Farbe, oder
 *     `quelle` ist leer. Denn vorwaerts gilt die Genre-Regel: man giesst nur
 *     auf dieselbe Farbe oder ins Leere. Also entweder `menge` < Lauf (Farbe
 *     bleibt oben) oder `menge` = Fuellstand (Glas wird leer).
 *
 * Ohne Bedingung 3 blieben vom geloesten Brett aus nur Zuege uebrig, die ein
 * volles einfarbiges Glas in ein leeres schieben — also reine Umbenennungen.
 * Das Brett blieb geloest, und `generate` fand nie ein Level.
 */
function unGiessen(z: Spielstand, quelle: number, ziel: number, menge: number): boolean {
  const lauf = laufOben(z, quelle);
  if (menge < 1 || menge > lauf) return false;
  if (menge === lauf && menge !== z.fuell[quelle]!) return false;
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

/** Alle moeglichen Rueckwaertsgiessungen, als (von, nach, menge). */
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

/** Baut das geloeste Zielbrett: volle einfarbige Glaeser plus leere. */
function zielBrett(s: Schwierigkeit, r: Zufall): Spielstand | null {
  const voll = s.glaeser - s.leer;
  if (voll < s.farben) return null;
  if (s.farben > ALLE_FARBEN.length) return null;

  const wahl = r.mische(ALLE_FARBEN).slice(0, s.farben);
  const proFarbe = new Map<FarbCode, number>(wahl.map((c) => [c, 1]));
  for (let k = wahl.length; k < voll; k++) {
    const c = r.zieh(wahl);
    proFarbe.set(c, proFarbe.get(c)! + 1);
  }

  const z = leererStand(s.glaeser, s.hoehe);
  let b = 0;
  for (const [c, anzahl] of proFarbe) {
    for (let k = 0; k < anzahl; k++) {
      for (let i = 0; i < s.hoehe; i++) z.zellen[b * s.hoehe + i] = c;
      z.fuell[b] = s.hoehe;
      b++;
    }
  }
  return z;
}

export interface GeneratorOptionen {
  /** Wie oft ein Seed mit neuem Nonce neu versucht wird. */
  versuche?: number;
  /** Knotendeckel je Loeserlauf. */
  maxKnoten?: number;
  /**
   * Zeitdeckel je Loeserlauf in Millisekunden. Standard ist 0 — ABGESCHALTET,
   * und das ist keine Nachlaessigkeit, sondern Pflicht: ein Zeitdeckel macht
   * das Ergebnis von der Uhr abhaengig. Ein Anlauf, der heute in 1,4 s durch
   * ist und morgen auf einer belegten Maschine in 1,6 s, liefert dann ein
   * ANDERES Level fuer denselben Seed. Genau das hat `test-generator.mts`
   * gefangen ("gleicher Seed ergibt bitgenau dasselbe Level", 1 Abweichung).
   * Die Schranke ist stattdessen `maxKnoten` — die zaehlt Arbeit, nicht Zeit.
   * Wer hier doch einen Wert setzt, gibt die Wiederholbarkeit auf.
   */
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
  const versuche = optionen.versuche ?? 40;

  for (let nonce = 0; nonce < versuche; nonce++) {
    const r = zufall(seed, (STROM.aufbau ^ Math.imul(nonce + 1, 0x9e3779b1)) >>> 0);
    const z = zielBrett(s, r);
    if (!z) continue;
    const zielSchluessel = schluessel(z);

    let rueckZuege = 0;
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

    // Budget ist Pflicht, nicht Kuer: ohne es kann ein einzelner Anlauf
    // beliebig lange rechnen, und `generate` haette keine Laufzeitschranke.
    // Ein gesprengtes Budget heisst schlicht: naechster Nonce. Damit bleibt
    // die Zusicherung „jedes ausgelieferte Level hat ein BEWIESENES Optimum"
    // unangetastet — geraten wird nie.
    //
    // Die Laenge des Rueckwegs ist eine gueltige obere Schranke: Knoten mit
    // f > rueckZuege koennen nicht besser werden. Das ist der groesste
    // einzelne Geschwindigkeitsgewinn hier.
    const loesung = solve(z, {
      schranke: rueckZuege,
      maxKnoten: optionen.maxKnoten ?? 250_000,
      maxMs: optionen.maxMs ?? 0,
    });
    if (loesung.status !== 'optimal') continue;
    if (loesung.laenge < s.zuegeMin || loesung.laenge > s.zuegeMax) continue;

    return {
      version: 2,
      seed,
      stufe: stufenNummer,
      hoehe: s.hoehe,
      glaeser: s.glaeser,
      start: startAusStand(z),
      optimalZuege: loesung.laenge,
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
