// Die Levelfolge als FUNKTION.
//
// Vorher stand die Folge als handgeschriebene Liste von 20 Stufenindizes in
// tools/level-bauen.mts. Das reicht fuer eine Handprobe und fuer nichts sonst:
// die Schwierigkeit stieg nicht (Level 15 brauchte 18 Zuege, Level 13 aber 20),
// und ab dem 21. Level gab es nichts mehr.
//
// Warum hier in src/engine/ und nicht in src/levels/: die Kurve ist rein, hat
// keine Abhaengigkeiten und wird in Phase 4 ein zweites Mal gebraucht — das
// Tagesraetsel rechnet Datum -> Seed -> Schwierigkeit, und die Edge Function
// muss dasselbe Brett serverseitig neu bauen koennen. Also gelten hier die
// Engine-Regeln: relative Importe mit .ts-Endung, kein Math.random, kein
// Date.now.
//
// GEMESSEN am 26.09.2026, und beide Messungen drehen den Entwurf um:
//
//  1. Ein leeres Glas WENIGER macht das Erzeugen fuenf- bis zehnmal BILLIGER
//     (8 Glaeser: 68 ms -> 12 ms; 10 Glaeser: 393 ms -> 39 ms). Weniger leere
//     Glaeser heisst weniger legale Zuege heisst ein schmalerer Suchbaum. Der
//     staerkste Schwierigkeitsregler ist also auch der guenstigste — deshalb
//     steigt die Kurve unten ueber `leer`, nicht ueber die Glaeserzahl.
//     (Die alte STUFEN-Leiter macht das Gegenteil: dort STEIGT `leer` mit der
//     Stufe. Siehe CLAUDE.md, „Zwei Leitern".)
//
//  2. Mehr `schritte` bringen ab etwa 30 gar nichts mehr — bei 45 und 60
//     Schritten kommen bitgenau dieselben Optima heraus wie bei 30. Das
//     Rueckwaertsspiel saettigt. Die Schwierigkeit ist nach oben also durch die
//     BRETTGROESSE begrenzt, nicht durch das Verwuerfeln.
//     Und der Weg von 24 auf 30 Schritte kostet das 17-fache (109 ms -> 1849 ms
//     bei 14 Glaesern) und bringt drei Zuege. Fuer 800 Level ist das nicht zu
//     bezahlen, fuer ein paar Spitzen schon — daher taucht `schritte: 30` in
//     der Rotation unten genau einmal auf.
//
// Daraus folgt die ehrliche Grenze: bei sechs Schichten und hoechstens 14
// Glaesern (mehr passt nicht aufs Handy) liegt das haerteste bezahlbare Level
// bei rund 26 Zuegen. Die Kurve kann bis Level 185 wirklich steigen; danach
// kommt die Abwechslung aus der FORM des Bretts, nicht aus mehr Schwierigkeit.
// Das steht so auch in der CLAUDE.md — 800 Level als „immer schwerer" zu
// verkaufen waere eine Luege.

import type { Schwierigkeit } from './typen.ts';

/** So viele Level hat die Folge. Josefs Entscheidung vom 26.09.2026. */
export const ANZAHL_LEVEL = 999;

/** Abschnittsgroesse der Levelwahl — die Kacheln stehen unter „Level 1–20". */
export const BLOCK = 20;

/**
 * Der Aufstieg: Level 1 bis 185.
 *
 * `bis` ist die letzte Levelnummer des Abschnitts, einschliesslich. Eine
 * Tabelle und kein Polynom, damit man eine Stelle nachjustieren kann, ohne die
 * ganze Kurve zu verschieben.
 *
 * `zuegeMin` ist ein BODEN, der von Abschnitt zu Abschnitt waechst. Er ist der
 * eigentliche Fortschritt: ohne ihn nimmt `generate` den ersten Treffer im Band,
 * und genau so wurde in der alten Folge Level 20 leichter als Level 10.
 */
/** Ein Abschnitt des Aufstiegs: eine Schwierigkeit plus die letzte Levelnummer. */
interface Stufe extends Schwierigkeit {
  /** Letzte Levelnummer dieses Abschnitts, einschliesslich. */
  bis: number;
}

const AUFSTIEG: readonly Stufe[] = [
  // Die ersten drei Level sind die Anleitung. Es gibt kein Tutorial (CLAUDE.md,
  // „kein Tutorial"), also muss das Brett selbst erklaeren, was ein Zug ist:
  // vier Glaeser, zwei Farben, in wenigen Zuegen fertig.
  { name: '1–3',     bis:   3, glaeser:  4, hoehe: 6, farben: 2, leer: 2, schritte:  5, zuegeMin:  2, zuegeMax:  5 },
  { name: '4–8',     bis:   8, glaeser:  5, hoehe: 6, farben: 3, leer: 2, schritte:  8, zuegeMin:  4, zuegeMax:  8 },
  { name: '9–14',    bis:  14, glaeser:  6, hoehe: 6, farben: 4, leer: 2, schritte: 12, zuegeMin:  7, zuegeMax: 13 },
  { name: '15–24',   bis:  24, glaeser:  7, hoehe: 6, farben: 4, leer: 2, schritte: 14, zuegeMin: 10, zuegeMax: 16 },
  { name: '25–40',   bis:  40, glaeser:  8, hoehe: 6, farben: 5, leer: 2, schritte: 18, zuegeMin: 12, zuegeMax: 18 },
  { name: '41–55',   bis:  55, glaeser:  8, hoehe: 6, farben: 5, leer: 1, schritte: 18, zuegeMin: 13, zuegeMax: 19 },
  { name: '56–75',   bis:  75, glaeser: 10, hoehe: 6, farben: 6, leer: 2, schritte: 20, zuegeMin: 16, zuegeMax: 21 },
  { name: '76–95',   bis:  95, glaeser: 10, hoehe: 6, farben: 6, leer: 1, schritte: 20, zuegeMin: 17, zuegeMax: 22 },
  { name: '96–120',  bis: 120, glaeser: 12, hoehe: 6, farben: 7, leer: 2, schritte: 22, zuegeMin: 19, zuegeMax: 24 },
  { name: '121–150', bis: 150, glaeser: 12, hoehe: 6, farben: 7, leer: 1, schritte: 24, zuegeMin: 20, zuegeMax: 25 },
  { name: '151–185', bis: 185, glaeser: 14, hoehe: 6, farben: 8, leer: 2, schritte: 24, zuegeMin: 21, zuegeMax: 26 },
];

/**
 * Die Decke: Level 186 bis 999.
 *
 * Zwoelf Aufbauten, die der Reihe nach durchlaufen werden (`(nr - 186) % 12`) —
 * deterministisch, kein Zufall. Alle tragen denselben Boden von 20 Zuegen: ab
 * hier wird es nicht mehr leichter, aber auch nicht mehr wesentlich schwerer.
 * Was sich aendert, ist die Form — Glaeserzahl, Farbzahl, Luft.
 *
 * Alle Aufbauten haben 12 bis 14 Glaeser, weil kleinere Bretter die 20 Zuege
 * nicht zuverlaessig erreichen (10 Glaeser kommen gemessen auf 18–20).
 */
const DECKE: readonly Schwierigkeit[] = [
  { name: 'D1',  glaeser: 14, hoehe: 6, farben: 8, leer: 1, schritte: 24, zuegeMin: 21, zuegeMax: 27 },
  { name: 'D2',  glaeser: 12, hoehe: 6, farben: 7, leer: 1, schritte: 24, zuegeMin: 20, zuegeMax: 26 },
  { name: 'D3',  glaeser: 13, hoehe: 6, farben: 8, leer: 1, schritte: 24, zuegeMin: 20, zuegeMax: 26 },
  { name: 'D4',  glaeser: 14, hoehe: 6, farben: 9, leer: 1, schritte: 24, zuegeMin: 20, zuegeMax: 27 },
  { name: 'D5',  glaeser: 12, hoehe: 6, farben: 8, leer: 1, schritte: 24, zuegeMin: 20, zuegeMax: 26 },
  // Die beiden Aufbauten mit `leer: 2` sind bewusst die FARBREICHEN. 14/8/leer2
  // liefert dieselben Optima, kostet aber 5,1 s statt 0,3 s je Level — bei 68
  // Leveln im Umlauf waeren das allein sechs Minuten Bauzeit fuer nichts.
  { name: 'D6',  glaeser: 13, hoehe: 6, farben: 9, leer: 2, schritte: 24, zuegeMin: 20, zuegeMax: 26 },
  { name: 'D7',  glaeser: 13, hoehe: 6, farben: 7, leer: 1, schritte: 24, zuegeMin: 20, zuegeMax: 26 },
  { name: 'D8',  glaeser: 12, hoehe: 6, farben: 9, leer: 1, schritte: 24, zuegeMin: 20, zuegeMax: 26 },
  { name: 'D9',  glaeser: 14, hoehe: 6, farben: 7, leer: 1, schritte: 24, zuegeMin: 21, zuegeMax: 27 },
  { name: 'D10', glaeser: 13, hoehe: 6, farben: 9, leer: 1, schritte: 24, zuegeMin: 20, zuegeMax: 26 },
  { name: 'D11', glaeser: 12, hoehe: 6, farben: 9, leer: 2, schritte: 24, zuegeMin: 20, zuegeMax: 26 },
  // Die eine Spitze mit 30 Schritten. Kostet gut das 17-fache, liefert aber die
  // laengsten Loesungen, die diese Brettgroesse hergibt.
  { name: 'D12', glaeser: 14, hoehe: 6, farben: 8, leer: 1, schritte: 30, zuegeMin: 24, zuegeMax: 30 },
];

/** Alle Abschnitte hintereinander — Index davon landet als `stufe` im Level. */
/**
 * Die Experten-Level: jedes 25. Level ab 225, also 225, 250, … 975 — 31 Stueck.
 *
 * HOHE GLAESER. Sechs Schichten sind und bleiben die Regel (Josefs
 * Entscheidung vom 25.09.2026), aber sie sind auch die Decke: 14 Glaeser mit
 * sechs Schichten geben gemessen 23–24 Zuege her, mit sieben 27–28, mit acht
 * bis zu 30. Ein hohes Glas ist der einzige Hebel, der die Folge ueber ihre
 * Decke hebt — deshalb ein paar davon, verteilt, als Ausrufezeichen.
 *
 * Mehr als acht Schichten gehen nicht: der Loeser packt vier Bit je Schicht in
 * ein uint32 (`MAX_HOEHE` in zustand.ts).
 *
 * Die beiden Aufbauten wechseln sich ab. Kosten beim Bauen 0,7–1,4 s je Level,
 * bei 31 Leveln also rund eine halbe Minute extra.
 */
const EXPERTE: readonly Schwierigkeit[] = [
  { name: 'Experte A', glaeser: 12, hoehe: 7, farben: 7, leer: 1, schritte: 28, zuegeMin: 24, zuegeMax: 31 },
  { name: 'Experte B', glaeser: 14, hoehe: 8, farben: 8, leer: 1, schritte: 30, zuegeMin: 26, zuegeMax: 34 },
];

/** Ab hier gibt es Experten-Level, und dann jedes `EXPERTE_JEDES`-te. */
const EXPERTE_AB = 225;
const EXPERTE_JEDES = 25;

/**
 * Traegt dieses Level hohe Glaeser? Auch die Oberflaeche fragt hier —
 * die Levelwahl markiert solche Kacheln, damit ein ploetzlich viel schwereres
 * Level nicht wie ein Fehler wirkt.
 */
export function istExperte(nr: number): boolean {
  pruefeNummer(nr);
  return nr >= EXPERTE_AB && nr % EXPERTE_JEDES === 0;
}

export const ABSCHNITTE: readonly Schwierigkeit[] = [...AUFSTIEG, ...DECKE, ...EXPERTE];

/** Wo der Aufstieg endet und die Rotation beginnt. */
const DECKE_AB = 186;

function pruefeNummer(nr: number): void {
  if (!Number.isInteger(nr) || nr < 1 || nr > ANZAHL_LEVEL) {
    throw new Error(`Levelnummer muss 1..${ANZAHL_LEVEL} sein, war ${String(nr)}`);
  }
}

/** Index in `ABSCHNITTE` fuer eine Levelnummer (1-basiert). */
export function abschnittFuer(nr: number): number {
  pruefeNummer(nr);
  for (let i = 0; i < AUFSTIEG.length; i++) {
    if (nr <= AUFSTIEG[i]!.bis) return i;
  }
  // Die Experten-Level liegen UEBER der Rotation, nicht IN ihr. Wuerden sie
  // eingeschoben, verschoebe sich die Phase von `(nr - DECKE_AB) % DECKE.length`
  // und alle 800 Level ab 186 waeren andere. So aendern sich genau die 31.
  if (istExperte(nr)) {
    const k = Math.floor((nr - EXPERTE_AB) / EXPERTE_JEDES) % EXPERTE.length;
    return AUFSTIEG.length + DECKE.length + k;
  }
  return AUFSTIEG.length + ((nr - DECKE_AB) % DECKE.length);
}

/**
 * Die Schwierigkeit fuer Level `nr` (1-basiert). Reine Funktion: gleiche Nummer,
 * gleiches Ergebnis, ueberall.
 */
export function stufeFuer(nr: number): Schwierigkeit {
  const a = ABSCHNITTE[abschnittFuer(nr)]!;
  // Feld fuer Feld, nicht per Spread: die Abschnitte des Aufstiegs tragen
  // zusaetzlich `bis`, und das hat in einer `Schwierigkeit` nichts zu suchen.
  return {
    name: `${a.name} (Level ${nr})`,
    glaeser: a.glaeser,
    hoehe: a.hoehe,
    farben: a.farben,
    leer: a.leer,
    schritte: a.schritte,
    zuegeMin: a.zuegeMin,
    zuegeMax: a.zuegeMax,
  };
}

/**
 * Der Seed fuer Level `nr`. Arithmetisch und langweilig — `generate` mischt den
 * Seed ohnehin durch fmix32, hier braucht es nur Verschiedenheit.
 *
 * Dass der Seed ALLEIN an der Levelnummer haengt (und nicht an der
 * Schwierigkeit), ist Absicht: so laesst sich ein Abschnitt nachjustieren, ohne
 * dass sich die Seeds aller folgenden Level verschieben.
 */
export function seedFuer(nr: number): number {
  pruefeNummer(nr);
  return 4_000_000 + nr * 7919;
}

/** Erste und letzte Levelnummer des Abschnitts, in dem `nr` liegt. */
export function blockFuer(nr: number): { von: number; bis: number; index: number } {
  pruefeNummer(nr);
  const index = Math.floor((nr - 1) / BLOCK);
  return {
    index,
    von: index * BLOCK + 1,
    bis: Math.min((index + 1) * BLOCK, ANZAHL_LEVEL),
  };
}

/** Wie viele Abschnitte die Levelwahl hat. */
export const BLOECKE = Math.ceil(ANZAHL_LEVEL / BLOCK);
