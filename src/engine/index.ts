// Oeffentliche Schnittstelle der Spiellogik.
//
// PORTABILITAET NACH DENO — bitte beim Aendern beachten:
// Jede Datei in src/engine/ importiert ihre Nachbarn MIT ausgeschriebener
// `.ts`-Endung (`from './zustand.ts'`). Deno verlangt vollstaendige
// Dateiangaben; Vite und tsc erlauben sie, weil in tsconfig.app.json
// `allowImportingTsExtensions` gesetzt ist. Damit laesst sich dieser Ordner
// unveraendert in eine Supabase-Edge-Function kopieren — genau das braucht
// der Schummelschutz in Phase 4.
//
// Aus demselben Grund gilt hier drinnen: keine Abhaengigkeiten, kein React,
// kein `window`, kein `localStorage`, kein `Math.random`, kein `Date.now`.
// Die einzige Uhr ist das einspeisbare `jetzt` im Loeserbudget.

export { Partie } from './verlauf.ts';
export { solve, hint, loesbar, schuettelBedarf, heuristik, farbSummen } from './loeser.ts';
export { generate, STUFEN, FIX_STUFEN, MISCH_STUFEN, sterneFuer, sterneSchwellen } from './generator.ts';
export { replay, replayAusSeed, MAX_ZUEGE } from './wiedergabe.ts';
export {
  istGeloest as isSolved,
  standAusLevel, startAusStand, leererStand, klone, schluessel,
  bericht, alsText, pruefeInvariante, segmente, oben, laufOben,
} from './zustand.ts';
export {
  giessen as pour, schuetteln as shake, legaleZuege, pruefeGiessen,
  pruefeSchuetteln, anwenden, pruefe,
} from './zuege.ts';
export {
  FARBEN, MISCHTABELLE, LEER, codeVon, idVon, farbeVon,
  mischungAus, bestandteileVon, istGrund, istMisch, istPur,
} from './farben.ts';
export { zufall, mulberry32, fmix32, seedAusText, STROM } from './zufall.ts';
export type { FarbId, FarbCode, FarbArt, Farbe } from './farben.ts';
export type {
  Behaelter, Budget, Fehlergrund, Level, LevelBericht, Loesung, LoeserStatus,
  Schwierigkeit, Spielstand, Sterne, WiedergabeErgebnis, WiedergabeOptionen,
  Zug, ZugErgebnis,
} from './typen.ts';
export type { Zufall } from './zufall.ts';
