// Eine laufende Partie: Zustand, Zugprotokoll, Undo-Stapel.
//
// Das ist die Schnittstelle, gegen die die Oberflaeche baut. Die Engine
// darunter (zuege.ts) veraendert Zustaende an Ort und Stelle, weil der Loeser
// Millionen davon durchgeht; hier oben ist das gekapselt.
//
// Der Undo-Stapel speichert DELTAS, keine Schnappschuesse: ein Giessvorgang
// laesst sich vollstaendig aus (von, nach, menge, farbe) umkehren. Solange es
// den Shaker gab, war das anders — aus vier Orange ging nicht hervor, ob
// vorher r,r,g,g oder r,g,g,r drin stand, und der Schuettelschritt musste die
// Zellen mitsichern. Ohne Shaker faellt dieser Sonderfall weg.
//
// Ein ABGELEHNTER Zug darf nichts auf den Stapel legen und nichts ins
// Protokoll schreiben. Sonst zaehlt die Oberflaeche Fehlversuche als Zuege
// mit, und die Sternewertung waere ungerecht.

import type { FarbCode } from './farben.ts';
import { sterneFuer } from './generator.ts';
import { hint, type LoeserOptionen } from './loeser.ts';
import type { Behaelter, Level, Spielstand, Zug, ZugErgebnis } from './typen.ts';
import { giessen, giessenZurueck } from './zuege.ts';
import { istGeloest, mitExtraGlas, standAusLevel } from './zustand.ts';

interface Schritt {
  zug: Zug;
  menge: number;
  farbe: FarbCode;
}

export class Partie {
  readonly level: Level;
  private stand: Spielstand;
  private stapel: Schritt[] = [];
  /** Wie viele Extra-Glaeser dazugekauft wurden. Hoechstens eines. */
  private extra = 0;

  constructor(level: Level) {
    this.level = level;
    this.stand = standAusLevel(level);
  }

  /** Nur lesen — die Oberflaeche zeichnet daraus, veraendert ihn aber nie. */
  get zustand(): Spielstand {
    return this.stand;
  }

  /** Das Zugprotokoll. Genau das schickt der Client spaeter zur Pruefung. */
  get zuege(): readonly Zug[] {
    return this.stapel.map((s) => s.zug);
  }

  get zugzahl(): number {
    return this.stapel.length;
  }

  pour(von: Behaelter, nach: Behaelter): ZugErgebnis {
    const e = giessen(this.stand, von, nach);
    if (e.ok) this.stapel.push({ zug: { von, nach }, menge: e.menge, farbe: e.farbe });
    return e;
  }

  kannUndo(): boolean {
    return this.stapel.length > 0;
  }

  undo(): boolean {
    const s = this.stapel.pop();
    if (!s) return false;
    giessenZurueck(this.stand, s.zug.von, s.zug.nach, s.menge, s.farbe);
    return true;
  }

  neustart(): void {
    this.stand = standAusLevel(this.level);
    // Das Extra-Glas BLEIBT ueber den Neustart. Wer dafuer ein Werbevideo
    // gesehen hat, soll es nicht durch einen Neustart verlieren — sonst wird
    // aus der Hilfe eine Falle. Mit dem Levelwechsel ist es weg, denn dann gibt
    // es eine neue Partie.
    for (let k = 0; k < this.extra; k++) this.stand = mitExtraGlas(this.stand);
    this.stapel = [];
  }

  /** Ist bereits ein Extra-Glas im Spiel? */
  get hatExtraGlas(): boolean {
    return this.extra > 0;
  }

  /**
   * Ein leeres Glas dazu. Hoechstens EINES je Partie: zwei machten aus fast
   * jedem Brett eine Fingeruebung, und die 999 Level waeren umsonst gebaut.
   *
   * Gibt false zurueck, wenn es schon eines gibt oder die Partie gewonnen ist.
   */
  extraGlas(): boolean {
    if (this.extra > 0 || this.isSolved()) return false;
    this.stand = mitExtraGlas(this.stand);
    this.extra += 1;
    return true;
  }

  isSolved(): boolean {
    return istGeloest(this.stand);
  }

  /**
   * 0..3. Drei nur fuer das Optimum — und NUR ohne Extra-Glas.
   *
   * Das Optimum ist fuer das Brett ohne das zusaetzliche Glas bewiesen. Mit
   * einem Glas mehr ist dasselbe Level leichter; drei Sterne dafuer zu
   * vergeben wuerde die Zusicherung entwerten, auf der die ganze Sternwertung
   * ruht („drei Sterne nur fuer die kuerzeste Loesung").
   */
  sterne(): number {
    const s = sterneFuer(this.level, this.stapel.length, this.isSolved());
    return this.extra > 0 ? Math.min(2, s) : s;
  }

  /**
   * Naechster guter Zug. Bekommt bewusst ein knappes Budget: der Tipp laeuft
   * auf dem Geraet, waehrend jemand wartet. Findet er in der Zeit nichts,
   * gibt es null — lieber kein Tipp als ein schlechter.
   */
  tipp(optionen: LoeserOptionen = {}): Zug | null {
    return hint(this.stand, optionen);
  }
}
