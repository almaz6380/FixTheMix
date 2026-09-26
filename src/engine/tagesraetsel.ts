// Das Tagesraetsel: ein Level pro Tag, fuer alle Spieler dasselbe.
//
// Rein und ohne Uhr — das Datum kommt IMMER von aussen hinein, als
// `YYYY-MM-DD`. Damit laeuft dieselbe Datei im Browser und in der Edge
// Function, und der Schummelschutz kann das Brett eines beliebigen Tages
// nachbauen, ohne zu wissen, welcher Tag heute ist.
//
// KEIN `Date` in dieser Datei, auch nicht zum Parsen. Zwei Gruende:
//  1. `new Date('2026-10-05')` liest die Zeichenkette als UTC, `new
//     Date('2026-10-05T00:00')` als Ortszeit. Dieser Unterschied ist ein
//     Fehler, der sich nur an einem Tag im Jahr zeigt und dann fuer alle
//     Spieler einer Zeitzone das falsche Raetsel liefert.
//  2. Die Engine muss ohne Laufzeitumgebung auskommen (siehe index.ts).
// Also wird selbst gerechnet — die Umrechnung Kalenderdatum -> Tageszahl ist
// zwanzig Zeilen und hat keine Kanten.
//
// ZEITZONE, bewusst entschieden am 26.09.2026 (die CLAUDE.md hat diese
// Entscheidung fuer Phase 4 ausdruecklich offengelassen):
// **Es gilt der ORTSTAG des Spielers.** Der Client bildet sein lokales Datum
// und schickt es mit. Anigosha nimmt `current_date` der Datenbank, also UTC —
// damit wechselt das Raetsel in Hawaii um 14 Uhr und in Neuseeland um 12 Uhr
// mittags, mitten im Tag. Ein Tagesraetsel ist ein Ritual; ein Wechsel am
// Nachmittag zerstoert es. Der Preis: die Bestenliste eines Tages umfasst
// weltweit rund 50 Stunden. Das ist der bessere Handel.
// Fuer Phase 4 heisst das: die Edge Function prueft das mitgeschickte Datum
// gegen ein Fenster um ihr eigenes UTC-Datum (ein Tag Spiel in jede
// Richtung) — ein Client, der sich das Raetsel von naechster Woche holen
// will, fliegt auf.

import { generate } from './generator.ts';
import type { Level, Schwierigkeit } from './typen.ts';
import { seedAusText } from './zufall.ts';

/** Tag 1 der Zaehlung. Steht im geteilten Text („FixTheMix #12"). */
export const TAG_NULL = '2026-09-26';

const TAGE_MUSTER = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Kalenderdatum -> Tage seit 1970-01-01. Reine Ganzzahlrechnung, gueltig fuer
 * jedes Jahr — die bekannte Umrechnung mit verschobenem Jahresanfang im Maerz,
 * damit der Schalttag ans Ende faellt und keine Sonderfaelle braucht.
 */
function tageSeitEpoche(jahr: number, monat: number, tag: number): number {
  const j = jahr - (monat <= 2 ? 1 : 0);
  const aera = Math.floor(j / 400);
  const jahrInAera = j - aera * 400;                       // 0..399
  const tagImJahr = Math.floor((153 * (monat + (monat > 2 ? -3 : 9)) + 2) / 5) + tag - 1;
  const tagInAera = jahrInAera * 365
    + Math.floor(jahrInAera / 4) - Math.floor(jahrInAera / 100)
    + tagImJahr;                                           // 0..146096
  return aera * 146097 + tagInAera - 719468;
}

/** Zerlegt und prueft ein Datum. Wirft laut — ein krummes Datum ist ein Fehler. */
function zerlege(iso: string): { jahr: number; monat: number; tag: number } {
  const m = TAGE_MUSTER.exec(iso);
  if (!m) throw new Error(`Datum muss YYYY-MM-DD sein, war "${iso}"`);
  const jahr = Number(m[1]), monat = Number(m[2]), tag = Number(m[3]);
  if (monat < 1 || monat > 12 || tag < 1 || tag > 31) {
    throw new Error(`Unmoegliches Datum: "${iso}"`);
  }
  // Rueckprobe: 2026-02-31 passt durch die Grenzen oben, aber nicht durch die
  // Umrechnung. Wer ein solches Datum schickt, bekommt kein Raetsel.
  const zurueck = alsIso(tageSeitEpoche(jahr, monat, tag));
  if (zurueck !== iso) throw new Error(`Unmoegliches Datum: "${iso}" (waere ${zurueck})`);
  return { jahr, monat, tag };
}

/** Tage seit Epoche -> `YYYY-MM-DD`. Gegenstueck zu tageSeitEpoche(). */
export function alsIso(tage: number): string {
  const z = tage + 719468;
  const aera = Math.floor(z / 146097);
  const tagInAera = z - aera * 146097;                     // 0..146096
  const jahrInAera = Math.floor(
    (tagInAera - Math.floor(tagInAera / 1460) + Math.floor(tagInAera / 36524)
      - Math.floor(tagInAera / 146096)) / 365,
  );
  const tagImJahr = tagInAera - (365 * jahrInAera + Math.floor(jahrInAera / 4)
    - Math.floor(jahrInAera / 100));                        // 0..365
  const mp = Math.floor((5 * tagImJahr + 2) / 153);         // 0..11, 0 = Maerz
  const tag = tagImJahr - Math.floor((153 * mp + 2) / 5) + 1;
  const monat = mp + (mp < 10 ? 3 : -9);
  const jahr = jahrInAera + aera * 400 + (monat <= 2 ? 1 : 0);
  const zwei = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${String(jahr).padStart(4, '0')}-${zwei(monat)}-${zwei(tag)}`;
}

/** Fortlaufende Nummer des Tagesraetsels. `TAG_NULL` ist die 1. */
export function tagesNummer(iso: string): number {
  return tagesZahl(iso) - tagesZahl(TAG_NULL) + 1;
}

/** Tageszahl eines Datums. Gegenstueck zu `alsIso`. */
export function tagesZahl(iso: string): number {
  const { jahr, monat, tag } = zerlege(iso);
  return tageSeitEpoche(jahr, monat, tag);
}

/** Datum des Tages davor. Fuer die Serie — und ohne `Date` zu bemuehen. */
export function tagDavor(iso: string): string {
  return alsIso(tagesZahl(iso) - 1);
}

/** Datum des Tages danach. */
export function tagDanach(iso: string): string {
  return alsIso(tagesZahl(iso) + 1);
}

/** Wochentag, 0 = Montag. 1970-01-01 war ein Donnerstag. */
export function wochentag(iso: string): number {
  return (((tagesZahl(iso) + 3) % 7) + 7) % 7;
}

/**
 * Die Wochenleiter: montags leicht, sonntags schwer.
 *
 * Alle sieben Aufbauten sind mit Absicht BILLIG. Das Tagesraetsel wird auf dem
 * Geraet erzeugt, nicht vorgebaut — es gibt unendlich viele kuenftige Tage,
 * und eine Datei mit zwei Jahren Vorrat waere in zwei Jahren still kaputt.
 * Gemessen am 26.09.2026 ueber zehn Wochen auf dem Bauserver: im Schnitt
 * 1 ms (Montag) bis 198 ms (Samstag), im schlimmsten Einzelfall 584 ms
 * (ein Freitag). Auf einem Mittelklassehandy sind das rund zwei Sekunden im
 * schlechtesten Fall — deshalb hat der Tagesraetsel-Schirm einen Ladezustand
 * und keinen Hoffnungsschimmer. Aufbauten mit `leer: 2` bei 14 Glaesern
 * (gemessen 5 s!) sind hier ausdruecklich NICHT dabei.
 *
 * Die Zugbaender sind BEWUSST breiter als in kurve.ts. Ein engeres Band heisst
 * mehr verworfene Anlaeufe, und jeder kostet einen vollen Loeserlauf — beim
 * Vorbauen egal, auf dem Geraet Wartezeit.
 */
const WOCHE: readonly Schwierigkeit[] = [
  { name: 'Montag',     glaeser:  6, hoehe: 6, farben: 4, leer: 2, schritte: 12, zuegeMin:  7, zuegeMax: 15 },
  { name: 'Dienstag',   glaeser:  8, hoehe: 6, farben: 5, leer: 2, schritte: 18, zuegeMin: 11, zuegeMax: 19 },
  { name: 'Mittwoch',   glaeser:  8, hoehe: 6, farben: 5, leer: 1, schritte: 18, zuegeMin: 12, zuegeMax: 20 },
  { name: 'Donnerstag', glaeser: 10, hoehe: 6, farben: 6, leer: 1, schritte: 20, zuegeMin: 15, zuegeMax: 23 },
  { name: 'Freitag',    glaeser: 12, hoehe: 6, farben: 7, leer: 1, schritte: 24, zuegeMin: 18, zuegeMax: 26 },
  { name: 'Samstag',    glaeser: 14, hoehe: 6, farben: 8, leer: 1, schritte: 24, zuegeMin: 19, zuegeMax: 28 },
  { name: 'Sonntag',    glaeser: 14, hoehe: 6, farben: 9, leer: 1, schritte: 24, zuegeMin: 19, zuegeMax: 29 },
];

export function stufeFuerTag(iso: string): Schwierigkeit {
  const s = WOCHE[wochentag(iso)]!;
  return { ...s, name: `${s.name} ${iso}` };
}

/**
 * Der Seed des Tages. Aus dem Datum gehasht, nicht durchgezaehlt: zwei
 * benachbarte Tage sollen nichts miteinander zu tun haben, sonst sieht man dem
 * Dienstag den Montag an.
 */
export function seedFuerTag(iso: string): number {
  zerlege(iso);
  return seedAusText(`fixthemix-tag-${iso}`);
}

/**
 * Knotendeckel je Loeserlauf beim Erzeugen eines Tagesraetsels.
 *
 * Er gehoert HIERHER und nicht zum Aufrufer, und das ist wichtig: der Deckel
 * entscheidet mit, welcher Anlauf angenommen wird. Wuerde der Client 60.000
 * und die Edge Function 250.000 einsetzen, bekaeme derselbe Tag zwei
 * verschiedene Bretter — und die Bestenliste waere Unsinn. Deshalb gibt es
 * `tagLevel()` und keinen Weg daran vorbei.
 *
 * Der Deckel ist NICHT als Geschwindigkeitsgewinn gedacht, und er ist auch
 * keiner: gemessen ueber zehn Wochen liegt der schlimmste Tag mit und ohne
 * Deckel bei rund einer halben Sekunde auf dem Bauserver. Die Zeit geht nicht
 * in einen zaehen Anlauf, sondern in die SUMME mehrerer Anlaeufe, die das
 * Zugband verpassen. Der Deckel steht hier allein, damit Client und Server
 * denselben Wert benutzen.
 *
 * Ein angenommenes Level hat immer ein BEWIESENES Optimum — `generate` nimmt
 * nur `optimal`, nie `budget`.
 */
export const TAG_KNOTEN = 60_000;

/**
 * Das Raetsel des Tages. Der EINE Weg dorthin — Client und Edge Function
 * rufen dieselbe Funktion, sonst laufen sie auseinander.
 */
export function tagLevel(iso: string): Level {
  return generate(seedFuerTag(iso), stufeFuerTag(iso), { maxKnoten: TAG_KNOTEN });
}
