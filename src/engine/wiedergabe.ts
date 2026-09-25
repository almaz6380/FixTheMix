// Wiedergabe einer Zugfolge. Grundlage des Schummelschutzes (Phase 4).
//
// Der Ablauf dort: Der Client spielt lokal, schickt am Ende (seed, stufe,
// zuege[]). Die Edge Function baut das Brett AUS DEM SEED NEU und spielt die
// Folge mit genau diesem Code nach. Erst dann wird gewertet.
//
// Drei Dinge, die bewusst NICHT vom Client kommen:
//   1. Das Brett. Wer ein praepariertes Brett schickt, gewinnt nichts.
//   2. Die Sternschwellen. Die stehen im Level (vom Generator bewiesen) und
//      kommen serverseitig aus der Datenbank. `replayAusSeed` nimmt sie
//      deshalb als Parameter — damit der Aufrufer sie aus einer
//      vertrauenswuerdigen Quelle holen MUSS.
//   3. Die Zugzahl. Die zaehlt diese Funktion selbst.
//
// `maxZuege` deckelt die Arbeit. Nachspielen ist O(Zuege * hoehe) ohne jede
// Suche, eine ehrliche Einsendung kostet also Mikrosekunden — aber eine
// Einsendung mit einer Million Zuege soll keine Rechenzeit verbrennen.

import { generate } from './generator.ts';
import type {
  Level, Schwierigkeit, WiedergabeErgebnis, WiedergabeOptionen, Zug,
} from './typen.ts';
import { anwenden } from './zuege.ts';
import { istGeloest, standAusLevel } from './zustand.ts';
import { sterneFuer } from './generator.ts';

export const MAX_ZUEGE = 5000;

/**
 * Spielt `zuege` auf dem Brett von `level` nach. `level` wird NICHT
 * veraendert — `standAusLevel` legt eine eigene Kopie an.
 */
export function replay(
  level: Level,
  zuege: readonly Zug[],
  optionen: WiedergabeOptionen = {},
): WiedergabeErgebnis {
  const grenze = optionen.maxZuege ?? MAX_ZUEGE;
  const stand = standAusLevel(level);

  if (zuege.length > grenze) {
    return {
      gueltig: false, geloest: false, zuege: 0, fehlerIndex: grenze,
      grund: 'index', sterne: 0, endstand: stand,
    };
  }

  for (let i = 0; i < zuege.length; i++) {
    const e = anwenden(stand, zuege[i]!);
    if (!e.ok) {
      // Ab hier wird nichts mehr ausgefuehrt: was nach einem unzulaessigen
      // Zug kommt, hat der Spieler so nie gesehen.
      return {
        gueltig: false, geloest: istGeloest(stand), zuege: i,
        fehlerIndex: i, grund: e.grund, sterne: 0, endstand: stand,
      };
    }
  }

  const geloest = istGeloest(stand);
  return {
    gueltig: true,
    geloest,
    zuege: zuege.length,
    fehlerIndex: -1,
    grund: '',
    sterne: sterneFuer(level, zuege.length, geloest),
    endstand: stand,
  };
}

/**
 * Wie `replay`, baut das Brett aber selbst aus dem Seed. Das ist der Weg fuer
 * die Edge Function: der Client nennt nur die Kennung.
 *
 * ACHTUNG: `generate` laesst den Loeser laufen und ist damit zu teuer fuer
 * einen Anfragepfad. In Phase 4 kommt das Level aus der Datenbank und diese
 * Funktion bleibt den Tests und dem Nachbau vorbehalten.
 */
export function replayAusSeed(
  seed: number,
  stufe: number | Schwierigkeit,
  zuege: readonly Zug[],
  optionen: WiedergabeOptionen = {},
): WiedergabeErgebnis {
  return replay(generate(seed, stufe), zuege, optionen);
}
