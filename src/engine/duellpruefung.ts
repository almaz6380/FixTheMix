// Der Schummelschutz fuer Duelle — die Rechnung, nicht die Leitung.
//
// Gleiche Bauart wie `tagespruefung.ts`, und aus demselben Grund: rein, ohne
// Uhr und ohne Netz, damit `tools/test-duell.mts` sie mit node pruefen kann.
// Die Edge Function darueber ist nur Verkabelung.
//
// DAS PRINZIP: Dem Client wird NICHTS geglaubt. Er schickt die Duellnummer und
// seine Zugfolge. Der Server baut das Brett dieses Duells selbst
// (`duellLevel`), spielt die Zuege nach und zaehlt selbst. Eine Einsendung
// „ich habe in 17 Zuegen gewonnen" gibt es gar nicht.
//
// Ein Unterschied zum Tagesraetsel, und er ist wichtig: dort entscheidet ein
// DATUM, ob eine Einsendung gueltig ist. Hier gibt es kein Datum — die Frist
// steht in der Datenbank (`supabase/migrations/0002_duelle.sql`), weil nur sie
// weiss, wann das Duell begonnen hat. Diese Datei prueft die ZUEGE, nicht die
// Zeit.

import { duellLevel, duellSieger, type Ausgang } from './duell.ts';
import type { Fehlergrund, Zug } from './typen.ts';
import { MAX_ZUEGE, replay } from './wiedergabe.ts';

export interface DuellEinsendung {
  /** Die Duellnummer. Bestimmt das Brett. */
  nummer: number;
  zuege: Zug[];
}

export type DuellAblehnung =
  | ''
  | 'nummer-form'
  | 'zu-viele-zuege'
  | 'ungueltiger-zug'
  | 'nicht-geloest';

export interface DuellUrteil {
  ok: boolean;
  grund: DuellAblehnung;
  /** Nur bei `ungueltiger-zug` gesetzt, sonst ''. */
  zugGrund: Fehlergrund;
  /** -1, sonst der Index des ersten unzulaessigen Zuges. */
  fehlerIndex: number;
  /** Selbst nachgezaehlt, nie uebernommen. `null` = nicht geloest. */
  zuege: number | null;
  optimum: number;
}

function nummerStimmt(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 0xffffffff;
}

/**
 * Prueft eine Einsendung und zaehlt die Zuege selbst.
 *
 * Eine nicht geloeste Einsendung ist KEIN Fehler, sondern ein Ergebnis: wer
 * sich festgefahren hat oder aufgibt, verliert das Duell — er wird nicht
 * abgewiesen. Deshalb steht `zuege: null` im Urteil und nicht `ok: false`.
 * Abgewiesen wird nur, was gar nicht gespielt worden sein kann.
 */
export function pruefeDuell(einsendung: DuellEinsendung): DuellUrteil {
  const leer: DuellUrteil = {
    ok: false, grund: '', zugGrund: '', fehlerIndex: -1, zuege: null, optimum: 0,
  };

  if (!nummerStimmt(einsendung.nummer)) return { ...leer, grund: 'nummer-form' };

  const zuege = einsendung.zuege;
  if (!Array.isArray(zuege)) return { ...leer, grund: 'ungueltiger-zug' };
  // Vor dem Nachspielen, nicht danach: eine Liste mit Millionen Zuegen aus dem
  // Netz darf nicht erst abgearbeitet werden.
  if (zuege.length > MAX_ZUEGE) return { ...leer, grund: 'zu-viele-zuege' };

  const level = duellLevel(einsendung.nummer);
  const e = replay(level, zuege);

  if (!e.gueltig) {
    return {
      ...leer,
      grund: 'ungueltiger-zug',
      zugGrund: e.grund,
      fehlerIndex: e.fehlerIndex,
      optimum: level.optimalZuege,
    };
  }
  if (!e.geloest) {
    // Gueltig gespielt, aber nicht zu Ende. Zaehlt als Niederlage, nicht als
    // Betrugsversuch.
    return {
      ok: true, grund: 'nicht-geloest', zugGrund: '', fehlerIndex: -1,
      zuege: null, optimum: level.optimalZuege,
    };
  }

  return {
    ok: true, grund: '', zugGrund: '', fehlerIndex: -1,
    zuege: e.zuege, optimum: level.optimalZuege,
  };
}

/**
 * Beide Einsendungen eines Duells auswerten. Der eine Ort, an dem aus zwei
 * Zugfolgen ein Ergebnis wird — Client und Server rufen dieselbe Funktion.
 */
export function werteDuell(a: DuellEinsendung, b: DuellEinsendung): {
  a: DuellUrteil;
  b: DuellUrteil;
  ausgang: Ausgang;
} {
  const ua = pruefeDuell(a);
  const ub = pruefeDuell(b);
  return {
    a: ua,
    b: ub,
    // Eine abgewiesene Einsendung zaehlt wie „nicht geloest": sie darf nicht
    // dazu fuehren, dass jemand gewinnt, weil sein Gegner manipuliert hat —
    // aber auch nicht dazu, dass Manipulation sich lohnt.
    ausgang: duellSieger(ua.ok ? ua.zuege : null, ub.ok ? ub.zuege : null),
  };
}
