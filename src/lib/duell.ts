// Duelle auf dem Geraet — Bilanz, Gegnerwahl, Duellnummer.
//
// WAS HIER LAEUFT UND WAS NICHT. Ein Duell gegen einen Bot braucht keine
// Datenbank: das Brett entsteht aus der Duellnummer, der Bot spielt es
// wirklich durch, und beide Zugzahlen lassen sich vergleichen. Damit ist die
// Funktion vollstaendig und heute schon spielbar.
//
// Ein Duell gegen einen MENSCHEN braucht eine Datenbank, und die gibt es noch
// nicht (Phase 4 ist geschrieben, aber nicht deployt). Migration und Edge
// Function liegen fertig im Repo — `supabase/migrations/0002_duelle.sql` und
// `supabase/functions/duell-einreichen/`. Sobald das Projekt steht, kommt hier
// ein zweiter Weg dazu; die Auswertung aendert sich dabei nicht, denn sie
// steht in der Engine (`werteDuell`) und wird von beiden Seiten gerufen.
//
// Eigener Speicherschluessel, aus demselben Grund wie bei den Muenzen:
// `ladeFortschritt()` verwirft den gesamten Stand, sobald `folgeVersion` nicht
// mehr passt. Eine Duellbilanz gehoert zu keiner Levelfolge und darf davon
// nicht aufgefressen werden.

import type { Ausgang, Staerke } from '../engine/duell.ts';
import { naechsteStaerke } from '../engine/duell.ts';

const SCHLUESSEL = 'fixthemix.duelle.v1';

export interface DuellBilanz {
  /** Siege, Niederlagen, Remis — aus Sicht des Spielers. */
  siege: number;
  niederlagen: number;
  remis: number;
  /** Wie viele Duelle insgesamt gespielt wurden. Bestimmt die naechste Nummer. */
  gespielt: number;
  /** Die Staerke des naechsten Gegners. */
  staerke: Staerke;
  /**
   * Startpunkt der Duellnummern dieses Geraets.
   *
   * Ohne ihn bekaeme jeder Spieler dieselbe Reihe von Brettern — Duell 1, 2,
   * 3 fuer alle gleich. Das waere kein Fehler, aber es waere langweilig, und
   * wer zweimal neu anfaengt, saehe dieselben Bretter wieder.
   */
  basis: number;
}

export const BILANZ_LEER: DuellBilanz = {
  siege: 0,
  niederlagen: 0,
  remis: 0,
  gespielt: 0,
  staerke: 'leicht',
  basis: 1,
};

/**
 * Die Nummer des naechsten Duells. Sie bestimmt das Brett — zwei Partien
 * duerfen also nie dieselbe bekommen.
 */
export function naechsteNummer(b: DuellBilanz): number {
  return (b.basis + b.gespielt) >>> 0;
}

/**
 * Ein Ergebnis verbuchen. `'a'` ist immer der Spieler — so herum ruft die
 * Engine es auf, und so herum steht es auch in `werteDuell`.
 */
export function ausgangZaehlen(b: DuellBilanz, ausgang: Ausgang): DuellBilanz {
  return {
    ...b,
    siege: b.siege + (ausgang === 'a' ? 1 : 0),
    niederlagen: b.niederlagen + (ausgang === 'b' ? 1 : 0),
    remis: b.remis + (ausgang === 'remis' ? 1 : 0),
    gespielt: b.gespielt + 1,
    staerke: naechsteStaerke(b.staerke, ausgang),
  };
}

function istStaerke(x: unknown): x is Staerke {
  return x === 'leicht' || x === 'mittel' || x === 'stark';
}

function zahl(x: unknown): number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
}

/**
 * Bilanz lesen. Wie bei den Muenzen ist jeder Zugriff eingepackt: localStorage
 * kann werfen (privates Fenster, blockierte Seitendaten), und dann wird eben
 * neu angefangen, statt dass die App stehenbleibt.
 */
export function ladeBilanz(): DuellBilanz {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (roh === null) return frischeBilanz();
    const d = JSON.parse(roh) as Partial<DuellBilanz>;
    return {
      siege: zahl(d.siege),
      niederlagen: zahl(d.niederlagen),
      remis: zahl(d.remis),
      gespielt: zahl(d.gespielt),
      staerke: istStaerke(d.staerke) ? d.staerke : 'leicht',
      // Eine fehlende oder verbogene Basis wird ersetzt, nicht uebernommen —
      // eine 0 hier hiesse, dass zwei Geraete dieselben Bretter sehen.
      basis: zahl(d.basis) > 0 ? zahl(d.basis) : frischeBilanz().basis,
    };
  } catch {
    return frischeBilanz();
  }
}

export function speichereBilanz(b: DuellBilanz): void {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(b));
  } catch {
    // Kein Speicher da — gespielt wird trotzdem weiter.
  }
}

/**
 * Eine neue Bilanz mit eigener Nummernreihe.
 *
 * `Date.now()` steht bewusst HIER und nicht in der Engine: die Engine hat
 * keine Uhr (ausser dem einspeisbaren `jetzt` im Loeserbudget), damit sie in
 * einer Edge Function bitgleich laeuft. Welche Nummer ein Duell bekommt, ist
 * dagegen eine Sache des Geraets.
 */
function frischeBilanz(): DuellBilanz {
  return { ...BILANZ_LEER, basis: ((Date.now() >>> 8) ^ 0x5bf03635) >>> 0 || 1 };
}

/** Wie viele Duelle gewonnen — als Prozentwert fuer die Anzeige. */
export function quote(b: DuellBilanz): number {
  if (b.gespielt === 0) return 0;
  return Math.round((b.siege / b.gespielt) * 100);
}
