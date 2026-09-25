// Farben, Mischtabelle und die Symbole fuer den Farbenblind-Modus.
//
// Die Mischtabelle steht hier als DATEN, nicht als if-Kette in der Logik.
// Grund: Josefs Bauplan sieht spaeter weitere Farben vor (Pur-Extras sind
// schon da, Dreifarben-Level kommen in Phase 3). Wer eine Farbe ergaenzt,
// ergaenzt genau zwei Listen in dieser Datei — zuege.ts, loeser.ts und
// generator.ts bleiben unberuehrt.
//
// Zwei Darstellungen, absichtlich:
//   FarbId   — Zeichenkette ('gruen'). Steht in Leveln, geht als JSON in die
//              Datenbank und ist in Tests lesbar.
//   FarbCode — kleine Zahl (0 = leer). Damit rechnet der Zustand, weil der
//              Loeser Millionen Zustaende packt und vergleicht.
// Umgerechnet wird genau einmal, beim Aufbau des Zustands aus dem Level.

export type FarbArt = 'grund' | 'misch' | 'pur';

export type FarbId =
  | 'rot' | 'gelb' | 'blau'        // Grundfarben — nur diese duerfen in den Shaker
  | 'orange' | 'gruen' | 'lila'    // Mischfarben — entstehen ausschliesslich im Shaker
  | 'minze' | 'kokos' | 'kaffee';  // Pur — nie mischbar, nur sortieren

export interface Farbe {
  id: FarbId;
  art: FarbArt;
  /** Symbol fuer den Farbenblind-Modus (Bildname, ab Tag 1 Pflicht). */
  symbol: string;
  /** Anzeigeton. Nur die Oberflaeche liest ihn; die Engine nie. */
  ton: string;
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
  { id: 'rot',    art: 'grund', symbol: 'erdbeere',  ton: '#e11d48', emoji: '\u{1F353}', i18n: 'farben.rot' },
  { id: 'gelb',   art: 'grund', symbol: 'zitrone',   ton: '#facc15', emoji: '\u{1F34B}', i18n: 'farben.gelb' },
  { id: 'blau',   art: 'grund', symbol: 'blaubeere', ton: '#3b82f6', emoji: '\u{1FAD0}', i18n: 'farben.blau' },
  { id: 'orange', art: 'misch', symbol: 'orange',    ton: '#f97316', emoji: '\u{1F34A}', i18n: 'farben.orange' },
  { id: 'gruen',  art: 'misch', symbol: 'apfel',     ton: '#22c55e', emoji: '\u{1F34F}', i18n: 'farben.gruen' },
  { id: 'lila',   art: 'misch', symbol: 'traube',    ton: '#a855f7', emoji: '\u{1F347}', i18n: 'farben.lila' },
  { id: 'minze',  art: 'pur',   symbol: 'minze',     ton: '#5eead4', emoji: '\u{1F33F}', i18n: 'farben.minze' },
  { id: 'kokos',  art: 'pur',   symbol: 'kokos',     ton: '#f5f5f4', emoji: '\u{1F965}', i18n: 'farben.kokos' },
  { id: 'kaffee', art: 'pur',   symbol: 'kaffee',    ton: '#78350f', emoji: '☕',    i18n: 'farben.kaffee' },
];

/** Eine Schicht Fluessigkeit, oder LEER. 0 ist bewusst „nichts“. */
export type FarbCode = number;

export const LEER: FarbCode = 0;

/**
 * Welche zwei Grundfarben zu welcher Mischfarbe werden.
 * Die Reihenfolge innerhalb von `aus` ist egal — mischungAus() ist symmetrisch.
 */
export const MISCHTABELLE: readonly { aus: readonly [FarbId, FarbId]; ergibt: FarbId }[] = [
  { aus: ['rot', 'gelb'],  ergibt: 'orange' },
  { aus: ['gelb', 'blau'], ergibt: 'gruen' },
  { aus: ['rot', 'blau'],  ergibt: 'lila' },
];

// --- Nachschlagewerke, einmal beim Laden gebaut ---------------------------

const CODE_VON_ID = new Map<FarbId, FarbCode>();
for (let i = 0; i < FARBEN.length; i++) CODE_VON_ID.set(FARBEN[i]!.id, i + 1);

/** MISCH[a]![b] = Ergebniscode, oder LEER wenn a und b sich nicht mischen. */
const MISCH: FarbCode[][] = [];
/** TEILE[ergebnis] = die beiden Grundfarben, aus denen sie entsteht. */
const TEILE: (readonly [FarbCode, FarbCode] | null)[] = [];

for (let a = 0; a <= FARBEN.length; a++) MISCH.push(new Array<FarbCode>(FARBEN.length + 1).fill(LEER));
for (let a = 0; a <= FARBEN.length; a++) TEILE.push(null);

for (const eintrag of MISCHTABELLE) {
  const a = CODE_VON_ID.get(eintrag.aus[0])!;
  const b = CODE_VON_ID.get(eintrag.aus[1])!;
  const e = CODE_VON_ID.get(eintrag.ergibt)!;
  MISCH[a]![b] = e;
  MISCH[b]![a] = e;
  TEILE[e] = [a, b];
}

// --- Oeffentliche Nachschlagefunktionen ------------------------------------

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

export function istGrund(code: FarbCode): boolean {
  return FARBEN[code - 1]?.art === 'grund';
}

export function istMisch(code: FarbCode): boolean {
  return FARBEN[code - 1]?.art === 'misch';
}

export function istPur(code: FarbCode): boolean {
  return FARBEN[code - 1]?.art === 'pur';
}

/** Ergebnis der Mischung, oder LEER wenn die beiden sich nicht mischen lassen. */
export function mischungAus(a: FarbCode, b: FarbCode): FarbCode {
  return MISCH[a]?.[b] ?? LEER;
}

/** Die beiden Grundfarben einer Mischfarbe, oder null bei Grund- und Purfarben. */
export function bestandteileVon(code: FarbCode): readonly [FarbCode, FarbCode] | null {
  return TEILE[code] ?? null;
}

/** Alle Codes, absteigend nach Nutzen sortiert braucht hier niemand — Reihenfolge = FARBEN. */
export const ALLE_CODES: readonly FarbCode[] = FARBEN.map((_, i) => i + 1);
