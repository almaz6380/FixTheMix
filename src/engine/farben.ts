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
  /** Anzeigeton. */
  ton: string;
  /**
   * Aufhellung desselben Tons. Die Oberflaeche zeichnet damit die gewoelbte
   * Oberkante jeder Schicht — der Kniff, der aus einem Farbstreifen
   * Fluessigkeit in einem Glas macht.
   */
  hell: string;
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
  { id: 'rot',    symbol: 'erdbeere',  ton: '#FF4D6D', hell: '#FF7A93', emoji: '\u{1F353}', i18n: 'farben.rot' },
  { id: 'gelb',   symbol: 'zitrone',   ton: '#FFC93C', hell: '#FFDC7A', emoji: '\u{1F34B}', i18n: 'farben.gelb' },
  { id: 'blau',   symbol: 'blaubeere', ton: '#3FA9F5', hell: '#86CBFA', emoji: '\u{1FAD0}', i18n: 'farben.blau' },
  { id: 'orange', symbol: 'orange',    ton: '#FF8A3D', hell: '#FFB47E', emoji: '\u{1F34A}', i18n: 'farben.orange' },
  { id: 'gruen',  symbol: 'apfel',     ton: '#4ED16A', hell: '#8FE3A2', emoji: '\u{1F34F}', i18n: 'farben.gruen' },
  { id: 'lila',   symbol: 'traube',    ton: '#A26BE8', hell: '#C6A2F2', emoji: '\u{1F347}', i18n: 'farben.lila' },
  { id: 'minze',  symbol: 'minze',     ton: '#45DDC4', hell: '#8AEBD9', emoji: '\u{1F33F}', i18n: 'farben.minze' },
  { id: 'kokos',  symbol: 'kokos',     ton: '#F2E4CE', hell: '#FBF3E6', emoji: '\u{1F965}', i18n: 'farben.kokos' },
  { id: 'kaffee', symbol: 'kaffee',    ton: '#8A5A3B', hell: '#B08163', emoji: '☕',    i18n: 'farben.kaffee' },
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
