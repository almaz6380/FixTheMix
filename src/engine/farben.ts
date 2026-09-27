// Die Farben der Fluessigkeiten.
//
// HIER STAND EINMAL EINE MISCHTABELLE. Am 25.09.2026 hat Josef den Shaker
// gestrichen: es wird nur noch sortiert, nicht mehr gemischt. Damit fallen die
// Unterscheidung in Grund-, Misch- und Purfarben weg und alle neun Farben sind
// gleichberechtigt. Die Begruendung steht in der CLAUDE.md unter „Kein Shaker".
//
// Zwei Darstellungen, absichtlich:
//   FarbId   — Zeichenkette ('apfel'). Steht in Leveln, geht als JSON in die
//              Datenbank und ist in Tests lesbar.
//   FarbCode — kleine Zahl (0 = leer). Damit rechnet der Zustand, weil der
//              Loeser Millionen Zustaende packt und vergleicht.
// Umgerechnet wird genau einmal, beim Aufbau des Zustands aus dem Level.

export type FarbId =
  | 'rot' | 'gelb' | 'blau'
  | 'orange' | 'gruen' | 'lila'
  | 'minze' | 'kokos' | 'kaffee';

export interface Farbe {
  id: FarbId;
  /** Symbol fuer den Farbenblind-Modus (Bildname, ab Tag 1 Pflicht). */
  symbol: string;
  /** Anzeigeton — die Mitte der Schicht. */
  ton: string;
  /**
   * Aufhellung desselben Tons, fuer die Oberkante einer Schicht: dort faellt
   * Licht durch die Oberflaeche. Zusammen mit `tief` macht das aus einem
   * Farbstreifen Fluessigkeit.
   */
  hell: string;
  /**
   * Verdunkelung fuer den Fuss der Schicht. Fluessigkeit ist unten tiefer und
   * damit dunkler. `hell` und `tief` liegen bewusst WEIT auseinander (rund
   * 28 L*): aus dem Abstand entsteht die Woelbung. Ein enger Abstand ergibt
   * einen flachen Farbbalken — und flach ist genau das, was billig aussieht.
   */
  tief: string;
  /**
   * Welche Tinte das Farbenblind-Zeichen traegt. NICHT nach Gefuehl gesetzt,
   * sondern gerechnet: es gewinnt die Tinte mit dem hoeheren Kontrast, und
   * `test-engine.mts` besteht auf mindestens 3:1. Vorher stand dafuer eine
   * Liste von Hand in `Symbole.tsx`, und Kaffee lag darin bei 2,2:1.
   */
  tinte: 'dunkel' | 'hell';
  /** Fuer das Emoji-Raster beim Teilen des Tagesraetsels (Phase 4). */
  emoji: string;
  /** Schluessel in src/i18n/locales/*.json */
  i18n: string;
}

/**
 * Reihenfolge ist bindend: der FarbCode einer Farbe ist ihr Index + 1.
 * Neue Farben deshalb immer HINTEN anhaengen — sonst aendern sich die Codes
 * und damit jedes gespeicherte Level und jedes Tagesraetsel der Vergangenheit.
 */
export const FARBEN: readonly Farbe[] = [
  { id: 'rot',    symbol: 'erdbeere',  ton: '#FD455E', hell: '#FF93A1', tief: '#D4112B', tinte: 'dunkel', emoji: '\u{1F353}', i18n: 'farben.rot' },
  { id: 'gelb',   symbol: 'zitrone',   ton: '#F4CE50', hell: '#FFE07D', tief: '#D2A925', tinte: 'dunkel', emoji: '\u{1F34B}', i18n: 'farben.gelb' },
  { id: 'blau',   symbol: 'blaubeere', ton: '#3268D5', hell: '#6692E8', tief: '#0943B7', tinte: 'hell',   emoji: '\u{1FAD0}', i18n: 'farben.blau' },
  { id: 'orange', symbol: 'orange',    ton: '#E9842C', hell: '#FFAF68', tief: '#C95E01', tinte: 'dunkel', emoji: '\u{1F34A}', i18n: 'farben.orange' },
  { id: 'gruen',  symbol: 'apfel',     ton: '#55C316', hell: '#92EA5F', tief: '#3A9D00', tinte: 'dunkel', emoji: '\u{1F34F}', i18n: 'farben.gruen' },
  { id: 'lila',   symbol: 'traube',    ton: '#B44FE7', hell: '#D584FE', tief: '#9024C6', tinte: 'dunkel', emoji: '\u{1F347}', i18n: 'farben.lila' },
  { id: 'minze',  symbol: 'minze',     ton: '#34D2B2', hell: '#7CFBE2', tief: '#05AD8B', tinte: 'dunkel', emoji: '\u{1F33F}', i18n: 'farben.minze' },
  { id: 'kokos',  symbol: 'kokos',     ton: '#F4E3C6', hell: '#FFF2DA', tief: '#D1BFA0', tinte: 'dunkel', emoji: '\u{1F965}', i18n: 'farben.kokos' },
  { id: 'kaffee', symbol: 'kaffee',    ton: '#894919', hell: '#A6734C', tief: '#642B00', tinte: 'hell',   emoji: '☕',        i18n: 'farben.kaffee' },
];

/** Eine Schicht Fluessigkeit, oder LEER. 0 ist bewusst „nichts“. */
export type FarbCode = number;

export const LEER: FarbCode = 0;

const CODE_VON_ID = new Map<FarbId, FarbCode>();
for (let i = 0; i < FARBEN.length; i++) CODE_VON_ID.set(FARBEN[i]!.id, i + 1);

export function codeVon(id: FarbId): FarbCode {
  const c = CODE_VON_ID.get(id);
  if (c === undefined) throw new Error(`Unbekannte Farbe: ${id}`);
  return c;
}

export function idVon(code: FarbCode): FarbId {
  const f = FARBEN[code - 1];
  if (!f) throw new Error(`Unbekannter Farbcode: ${code}`);
  return f.id;
}

export function farbeVon(code: FarbCode): Farbe {
  const f = FARBEN[code - 1];
  if (!f) throw new Error(`Unbekannter Farbcode: ${code}`);
  return f;
}

export const ALLE_CODES: readonly FarbCode[] = FARBEN.map((_, i) => i + 1);
