// Duelle — Version 1.1.
//
// DIE REGEL PASST IN EINEN SATZ: beide bekommen dasselbe Brett, wer weniger
// Zuege braucht, gewinnt. Gleich viele Zuege sind ein Remis, und das ist
// Absicht — siehe `duellSieger()`.
//
// Gespielt wird ZEITVERSETZT, nicht gleichzeitig. Ein Echtzeit-Duell braucht
// eine offene Verbindung, und die zerbricht auf dem Handy bei jedem Wechsel in
// den Hintergrund. Wer will, kann drei Tage spaeter antworten.
//
// Wie beim Tagesraetsel gilt: `duellLevel(seed)` ist der EINE Weg zum Brett.
// Client und Edge Function rufen dieselbe Funktion mit demselben Knotendeckel
// — sonst bekaemen zwei Spieler desselben Duells zwei verschiedene Bretter,
// und die Zugzahlen waeren nicht vergleichbar.
//
// Diese Datei ist rein: keine Uhr, kein Netz, kein Zufall ausser dem
// gesetzten. Damit laeuft sie in node, im Browser und in einer Deno-Edge-
// Function bitgleich.

import { generate } from './generator.ts';
import { solve } from './loeser.ts';
import type { Level, Schwierigkeit, Zug } from './typen.ts';
import { standAusLevel } from './zustand.ts';
import { giessen, legaleZuege } from './zuege.ts';
import { STROM, seedAusText, zufall } from './zufall.ts';

/**
 * Der Aufbau eines Duellbretts.
 *
 * Bewusst EIN Aufbau und keine Leiter: beide Spieler sollen dasselbe Brett
 * bekommen, und ein Duell soll in einer Pause zu schaffen sein. Zehn Glaeser
 * mit sechs Farben und einem leeren Glas kosten beim Erzeugen gemessen 39 ms
 * (siehe „Die Decke" in CLAUDE.md) und ergeben Optima um 18 Zuege — lang
 * genug, dass Koennen entscheidet, kurz genug fuer zwei Minuten.
 *
 * Das Zugband ist breiter als in `kurve.ts`, aus demselben Grund wie beim
 * Tagesraetsel: jeder verworfene Anlauf kostet einen vollen Loeserlauf, und
 * hier wird auf dem Geraet erzeugt, nicht vorgebaut.
 */
export const DUELL_STUFE: Schwierigkeit = {
  name: 'Duell',
  glaeser: 10,
  hoehe: 6,
  farben: 6,
  leer: 1,
  schritte: 20,
  zuegeMin: 15,
  zuegeMax: 23,
};

/**
 * Knotendeckel je Loeserlauf beim Erzeugen eines Duellbretts.
 *
 * Steht hier und nicht beim Aufrufer — derselbe Grund wie bei `TAG_KNOTEN`:
 * der Deckel entscheidet mit, welcher Anlauf angenommen wird. Zwei
 * verschiedene Werte ergaeben zwei verschiedene Bretter fuer dasselbe Duell.
 */
export const DUELL_KNOTEN = 60_000;

/** Das Brett eines Duells. Der EINE Weg dorthin. */
export function duellLevel(seed: number): Level {
  return generate(duellSeed(seed), DUELL_STUFE, { maxKnoten: DUELL_KNOTEN });
}

/**
 * Aus der Duellnummer den Seed des Bretts. Gehasht und nicht durchgezaehlt:
 * zwei aufeinanderfolgende Duelle sollen nichts miteinander zu tun haben,
 * sonst sieht man dem zweiten das erste an.
 */
export function duellSeed(nummer: number): number {
  return seedAusText(`fixthemix-duell-${nummer >>> 0}`);
}

// ---------------------------------------------------------------------------
// Der Ausgang
// ---------------------------------------------------------------------------

export type Ausgang = 'a' | 'b' | 'remis';

/**
 * Wer gewinnt. `null` heisst „hat nicht geloest" — aufgegeben, festgefahren
 * oder nie angetreten.
 *
 * REMIS IST EIN ECHTES ERGEBNIS und wird nicht weggerechnet. Naheliegend waere
 * ein Stechen ueber die Zeit oder ueber „wer zuerst eingereicht hat". Beides
 * ist unfair: die Zeit belohnt das schnellere Telefon, die Reihenfolge belohnt
 * die guenstigere Zeitzone. Und bei einem Brett, dessen Optimum bewiesen ist,
 * heisst gleich viele Zuege wirklich gleich gut gespielt.
 */
export function duellSieger(zuegeA: number | null, zuegeB: number | null): Ausgang {
  if (zuegeA === null && zuegeB === null) return 'remis';
  if (zuegeA === null) return 'b';
  if (zuegeB === null) return 'a';
  if (zuegeA < zuegeB) return 'a';
  if (zuegeB < zuegeA) return 'b';
  return 'remis';
}

// ---------------------------------------------------------------------------
// Der Bot
// ---------------------------------------------------------------------------

export type Staerke = 'leicht' | 'mittel' | 'stark';

/**
 * Wie viele Umwege der Bot einbaut, je Staerke: [min, max] einschliesslich.
 *
 * Ein Umweg ist ein Zug, der nicht auf der kuerzesten Loesung liegt. Danach
 * rechnet der Bot neu — er verrennt sich also nicht, er spielt nur
 * umstaendlicher. Ein Umweg kostet in der Regel zwei Zuege (hin und wieder
 * zurueck), manchmal nur einen.
 */
const UMWEGE: Record<Staerke, [number, number]> = {
  leicht: [5, 9],
  mittel: [2, 4],
  // Bewusst nicht [0, 0]. Ein Bot, der immer das bewiesene Optimum spielt,
  // waere unschlagbar — bestenfalls Remis, und damit waere die oberste Stufe
  // keine Aufgabe, sondern eine Wand. Mit ein bis zwei Umwegen gewinnt genau
  // die perfekte Partie. Das haengt den Duellsieg an dieselbe Zusicherung wie
  // die drei Sterne: an die kuerzeste Loesung.
  stark: [1, 2],
};

export interface BotPartie {
  /** Die wirklich gespielte Zugfolge. Mit `replay()` nachspielbar. */
  zuege: Zug[];
  /** Die Zugzahl, die ins Duell geht. `null` = nicht geloest. */
  zugzahl: number | null;
  staerke: Staerke;
}

/**
 * Der Bot spielt das Brett WIRKLICH durch.
 *
 * Naheliegend waere gewesen, ihm einfach eine Zahl zu geben („Optimum plus
 * vier"). Das haette drei Nachteile: die Zahl liesse sich nicht nachspielen,
 * sie koennte unerreichbar sein, und man muesste dem Spieler erklaeren, warum
 * sein Gegner keine Zuege hat. So entsteht eine echte Zugfolge, die durch
 * `replay()` geht wie die eines Menschen.
 *
 * Der Ablauf ist billig, und das ist der Punkt: der Bot folgt der kuerzesten
 * Loesung und biegt nur an wenigen Stellen ab. Nach jedem Umweg rechnet er
 * einmal neu. Ein Bot, der bei JEDEM Zug den Loeser fragte, braeuchte zwanzig
 * Loeserlaeufe statt fuenf.
 *
 * Deterministisch: gleicher Seed und gleiche Staerke ergeben bitgenau
 * dieselbe Partie — auf jedem Geraet und auf dem Server. Ohne das koennte der
 * Bot auf zwei Bildschirmen zwei verschiedene Ergebnisse haben.
 */
export function botSpielt(level: Level, staerke: Staerke, seed: number): BotPartie {
  const r = zufall(seed ^ level.seed, STROM.mischen);
  const [min, max] = UMWEGE[staerke];
  const umwegeSoll = min + r.unter(max - min + 1);

  const stand = standAusLevel(level);
  const zuege: Zug[] = [];
  let umwege = 0;
  // Harte Schranke gegen eine Endlosschleife, falls der Loeser einmal nichts
  // liefert. Sie darf nie greifen; `test-duell.mts` prueft das.
  const deckel = level.optimalZuege * 3 + 40;

  let plan = solve(stand, { maxKnoten: DUELL_KNOTEN, maxMs: 0 });
  if (plan.status !== 'optimal') return { zuege: [], zugzahl: null, staerke };

  while (zuege.length < deckel) {
    if (plan.zuege.length === 0) break;

    // Soll hier ein Umweg hin? Die Wahrscheinlichkeit richtet sich danach, wie
    // viele noch offen sind und wie viel Brett noch kommt — sonst haeuften
    // sich alle Umwege am Anfang.
    const restBesteZuege = plan.zuege.length;
    const offen = umwegeSoll - umwege;
    const umwegJetzt = offen > 0 && r.unter(Math.max(restBesteZuege, 1)) < offen;

    if (umwegJetzt) {
      const abweichend = legaleZuege(stand).filter(
        (z) => !(z.von === plan.zuege[0]!.von && z.nach === plan.zuege[0]!.nach),
      );
      if (abweichend.length > 0) {
        const z = r.zieh(abweichend);
        const vorher = stand.zellen.slice();
        const vorherFuell = stand.fuell.slice();
        if (giessen(stand, z.von, z.nach).ok) {
          const neu = solve(stand, { maxKnoten: DUELL_KNOTEN, maxMs: 0 });
          if (neu.status === 'optimal') {
            zuege.push({ von: z.von, nach: z.nach });
            // NUR ein Zug, der die Partie WIRKLICH verlaengert, zaehlt als
            // Umweg. Viele Bretter haben mehrere gleich gute erste Zuege; ein
            // anderer Zug als `plan.zuege[0]` ist also noch lange kein Fehler.
            // Der erste Anlauf hat genau das uebersehen — „leicht" spielte auf
            // manchen Brettern das Optimum, weil jeder „Umweg" zufaellig auch
            // optimal war.
            if (neu.zuege.length >= plan.zuege.length) umwege++;
            plan = neu;
            continue;
          }
          // Der Umweg fuehrt in eine Sackgasse (oder der Loeser hat aufgegeben).
          // Zuruecknehmen und diesmal den besten Zug spielen — ein Bot, der sich
          // festfaehrt, waere ein Gegner, der einfach verschwindet.
          stand.zellen.set(vorher);
          stand.fuell.set(vorherFuell);
        }
      }
    }

    const best = plan.zuege[0]!;
    if (!giessen(stand, best.von, best.nach).ok) break;
    zuege.push({ von: best.von, nach: best.nach });
    plan = { ...plan, zuege: plan.zuege.slice(1) };
  }

  // Der Bot hat die kuerzeste Loesung zu Ende gespielt; dass das Brett damit
  // geloest ist, folgt aus der Zusicherung des Loesers. Geprueft wird es
  // trotzdem, denn eine falsche Zugzahl im Duell faellt sonst nirgends auf.
  const fertig = plan.zuege.length === 0 && zuege.length > 0;
  return {
    zuege,
    zugzahl: fertig ? zuege.length : null,
    staerke,
  };
}

/**
 * Welche Staerke der naechste Bot bekommt.
 *
 * Kein Elo und keine Rangliste: ein Solospieler soll nicht erst zwanzig Duelle
 * brauchen, bis es passt. Drei Stufen, und die Richtung entscheidet das letzte
 * Ergebnis — gewonnen heisst haerter, verloren heisst leichter. Ein Remis
 * laesst sie stehen, sonst waere das Ergebnis „gleich gut" ein Grund, etwas zu
 * aendern.
 */
export function naechsteStaerke(jetzt: Staerke, letzter: Ausgang | null): Staerke {
  if (letzter === null || letzter === 'remis') return jetzt;
  const leiter: Staerke[] = ['leicht', 'mittel', 'stark'];
  const i = leiter.indexOf(jetzt);
  // 'a' ist immer der Mensch — so herum rufen es Client und Server auf.
  const ziel = letzter === 'a' ? i + 1 : i - 1;
  return leiter[Math.max(0, Math.min(leiter.length - 1, ziel))]!;
}
