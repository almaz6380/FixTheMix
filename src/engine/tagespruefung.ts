// Der Schummelschutz fuer das Tagesraetsel — die Rechnung, nicht die Leitung.
//
// Bewusst hier und nicht in der Edge Function: diese Datei ist rein, hat keine
// Uhr und kein Netz, und deshalb laesst sie sich in `tools/test-tagesraetsel.mts`
// mit node pruefen. Die Edge Function ist danach nur noch Verkabelung —
// JSON herein, `pruefeTag()`, Zeile in die Datenbank. Wer die Regeln aendern
// will, aendert sie hier, und der Test faellt sofort.
//
// DAS PRINZIP: Dem Client wird NICHTS geglaubt. Er schickt das Datum und seine
// Zugfolge. Der Server baut das Brett dieses Tages selbst (`tagLevel`), spielt
// die Zuege nach und rechnet Zugzahl und Sterne selbst aus. Eine Einsendung
// mit „ich hatte 3 Sterne" gibt es gar nicht — es gibt nur „das sind meine
// Zuege", und der Rest ist Nachrechnen.

import { sterneFuer } from './generator.ts';
import { tagesNummer, tagLevel, tagesZahl } from './tagesraetsel.ts';
import type { Fehlergrund, Zug } from './typen.ts';
import { MAX_ZUEGE, replay } from './wiedergabe.ts';

export interface TagEinsendung {
  /** Ortstag des Spielers als `YYYY-MM-DD`. */
  datum: string;
  zuege: Zug[];
}

export type TagAblehnung =
  | ''
  | 'datum-form'
  | 'datum-fenster'
  | 'zu-viele-zuege'
  | 'ungueltiger-zug'
  | 'nicht-geloest';

export interface TagUrteil {
  ok: boolean;
  grund: TagAblehnung;
  /** Nur bei `ungueltiger-zug` gesetzt, sonst ''. */
  zugGrund: Fehlergrund;
  /** -1, sonst der Index des ersten unzulaessigen Zuges. */
  fehlerIndex: number;
  /** Selbst nachgezaehlt, nie uebernommen. */
  zuege: number;
  /** Selbst berechnet, nie uebernommen. */
  sterne: number;
  nummer: number;
  optimum: number;
}

/**
 * Wie viele Tage die Einsendung vom UTC-Datum des Servers abweichen darf.
 *
 * Eins in jede Richtung, und das ist keine Bequemlichkeit, sondern die Folge
 * der Zeitzonen-Entscheidung (siehe tagesraetsel.ts): es gilt der ORTSTAG des
 * Spielers. Waehrend es in Kiribati schon der 8. ist, ist es in Hawaii noch der
 * 6. — beide spielen legitim ihr eigenes Datum. Ein Fenster von einem Tag
 * deckt jede existierende Zeitzone (UTC-12 bis UTC+14) ab.
 *
 * Es deckt aber KEIN Raetsel von naechster Woche. Genau das ist der Punkt: wer
 * sich das Brett von uebermorgen holen und in Ruhe loesen will, fliegt auf.
 */
export const DATUM_FENSTER = 1;

function formStimmt(datum: string): boolean {
  if (typeof datum !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) return false;
  try {
    tagesZahl(datum);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prueft eine Einsendung. `heuteUtc` ist das Datum des Servers — hereingegeben,
 * weil die Engine keine Uhr hat und weil der Test sonst nur am echten heutigen
 * Tag gruen waere.
 */
export function pruefeTag(
  einsendung: TagEinsendung,
  heuteUtc: string,
  fenster: number = DATUM_FENSTER,
): TagUrteil {
  const leer: TagUrteil = {
    ok: false, grund: '', zugGrund: '', fehlerIndex: -1,
    zuege: 0, sterne: 0, nummer: 0, optimum: 0,
  };

  if (!formStimmt(einsendung.datum)) return { ...leer, grund: 'datum-form' };
  if (!formStimmt(heuteUtc)) throw new Error(`heuteUtc ist kein Datum: "${heuteUtc}"`);

  if (Math.abs(tagesZahl(einsendung.datum) - tagesZahl(heuteUtc)) > fenster) {
    return { ...leer, grund: 'datum-fenster' };
  }

  const zuege = einsendung.zuege;
  if (!Array.isArray(zuege)) return { ...leer, grund: 'ungueltiger-zug' };
  // Vor dem Nachspielen, nicht danach: eine Liste mit Millionen Zuegen aus dem
  // Netz darf nicht erst abgearbeitet werden.
  if (zuege.length > MAX_ZUEGE) return { ...leer, grund: 'zu-viele-zuege' };

  const level = tagLevel(einsendung.datum);
  const nummer = tagesNummer(einsendung.datum);
  const e = replay(level, zuege);

  if (!e.gueltig) {
    return {
      ...leer,
      grund: 'ungueltiger-zug',
      zugGrund: e.grund,
      fehlerIndex: e.fehlerIndex,
      nummer,
      optimum: level.optimalZuege,
    };
  }
  if (!e.geloest) {
    return {
      ...leer, grund: 'nicht-geloest', zuege: e.zuege, nummer,
      optimum: level.optimalZuege,
    };
  }

  return {
    ok: true,
    grund: '',
    zugGrund: '',
    fehlerIndex: -1,
    zuege: e.zuege,
    sterne: sterneFuer(level, e.zuege, true),
    nummer,
    optimum: level.optimalZuege,
  };
}
