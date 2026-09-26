// Nur Typen. Kein Laufzeitcode — damit jede andere Engine-Datei hierauf
// zeigen kann, ohne einen Ring zu bauen.
//
// Der Spielstand ist ein FLACHES Uint8Array, kein Array von Arrays. Der Loeser
// besucht sechsstellige Knotenzahlen; verschachtelte Arrays kosten dort je
// Knoten eine Handvoll Allokationen. Flach ist unbequemer zu lesen und um ein
// Vielfaches schneller — zustand.ts kapselt das.
//
// Bis zum 25.09.2026 gab es hier zusaetzlich Shaker und einen Schuettelzug.
// Beides ist gestrichen (siehe CLAUDE.md, „Kein Shaker"): es wird nur noch
// sortiert. `Zug` ist deshalb keine Vereinigung mehr, sondern schlicht ein
// Giessvorgang.

import type { FarbCode, FarbId } from './farben.ts';

/** Index eines Glases. */
export type Behaelter = number;

export interface Spielstand {
  /** Fassungsvermoegen jedes Glases. */
  readonly hoehe: number;
  readonly glaeser: number;
  /**
   * glaeser * hoehe Zellen, Index `b * hoehe + i`.
   * i = 0 ist UNTEN. 0 = leer. Fluessigkeit steht immer lueckenlos von unten.
   */
  zellen: Uint8Array;
  /**
   * Fuellstand je Glas. Streng genommen ableitbar (lueckenlos von unten),
   * wird aber mitgefuehrt, weil der Loeser ihn in jeder Zuggenerierung
   * braucht. Wer `zellen` anfasst, MUSS `fuell` nachziehen —
   * `pruefeInvariante()` in zustand.ts faengt Verstoesse in den Tests.
   */
  fuell: Uint8Array;
}

export interface Zug {
  von: Behaelter;
  nach: Behaelter;
}

/**
 * Maschinenlesbarer Ablehnungsgrund. Bewusst kein `false` und kein Fliesstext:
 * die Tests sichern damit ab, WARUM ein Zug abgelehnt wurde, und der
 * Schummelschutz schreibt ihn spaeter ins Protokoll.
 */
export type Fehlergrund =
  | ''
  | 'index'
  | 'selber-behaelter'
  | 'quelle-leer'
  | 'ziel-voll'
  | 'farbe-passt-nicht';

export interface ZugErgebnis {
  ok: boolean;
  grund: Fehlergrund;
  /** Wie viele Schichten bewegt wurden (0 bei Ablehnung). */
  menge: number;
  /** Die bewegte Farbe. */
  farbe: FarbCode;
}

/** Schwellen fuer die Sternewertung. Drei Sterne nur fuer das Optimum. */
export interface Sterne {
  /** Zuganzahl fuer drei Sterne — immer gleich `optimalZuege`. */
  drei: number;
  /** Bis hierher zwei Sterne. Darueber hinaus: ein Stern fuers Loesen. */
  zwei: number;
}

/**
 * Ein fertiges Level. JSON-faehig, weil es so in die Datenbank und in eine
 * Edge Function geht: bewusst `number[]` und kein Uint8Array.
 */
export interface Level {
  /** Format-Version. 1 hatte noch Shaker; ab 2 gibt es nur Glaeser. */
  version: 2;
  seed: number;
  stufe: number;
  hoehe: number;
  glaeser: number;
  /** glaeser * hoehe Zellen, gleiche Anordnung wie Spielstand.zellen. */
  start: number[];
  /** Vom Loeser BEWIESEN, nie geschaetzt. */
  optimalZuege: number;
  sterne: Sterne;
}

export interface Schwierigkeit {
  /** Anzeigename der Stufe, nur fuer Protokolle. */
  name: string;
  glaeser: number;
  hoehe: number;
  /** Wie viele verschiedene Farben auf dem Brett landen. */
  farben: number;
  /** Leere Glaeser. Der staerkste Schwierigkeitsregler ueberhaupt. */
  leer: number;
  /** Rueckwaerts-Giessschritte beim Verwuerfeln. */
  schritte: number;
  /** Annahmeband fuer das GEMESSENE Optimum. */
  zuegeMin: number;
  zuegeMax: number;
}

export interface Budget {
  maxKnoten?: number;
  maxMs?: number;
  /**
   * Einspeisbare Uhr. Die Engine ruft sonst nirgends Date.now() —
   * so bleibt sie rein und in einer Edge Function pruefbar.
   */
  jetzt?: () => number;
  /**
   * Bekannte obere Schranke (z. B. die Laenge der Verwuerfelung beim
   * Generator). Knoten mit f > schranke fliegen sofort raus. Das ist der
   * groesste einzelne Geschwindigkeitsgewinn im Generator.
   */
  schranke?: number;
}

export type LoeserStatus = 'optimal' | 'unloesbar' | 'budget';

export interface Loesung {
  status: LoeserStatus;
  /** Leer ausser bei 'optimal'. */
  zuege: Zug[];
  /** Bei 'optimal' die bewiesene Optimalzahl, sonst -1. */
  laenge: number;
  /** Kleinstes f in der offenen Liste beim Abbruch — eine bewiesene Schranke. */
  untergrenze: number;
  knoten: number;
  ms: number;
}

export interface WiedergabeOptionen {
  /** Schutz vor Millionen-Zug-Listen aus dem Netz. */
  maxZuege?: number;
}

export interface WiedergabeErgebnis {
  /** Jeder einzelne Zug war regelkonform. */
  gueltig: boolean;
  /** Der Endzustand erfuellt die Siegbedingung. */
  geloest: boolean;
  /** Tatsaechlich ausgefuehrte Zuege. */
  zuege: number;
  /** -1, sonst Index des ersten unzulaessigen Zuges. */
  fehlerIndex: number;
  grund: Fehlergrund;
  /** 0..3 */
  sterne: number;
  endstand: Spielstand;
}

/** Nur fuer Testausgaben und Protokolle. */
export interface LevelBericht {
  glaeser: FarbId[][];
}
