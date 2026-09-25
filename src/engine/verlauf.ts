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
import { istGeloest, standAusLevel } from './zustand.ts';

interface Schritt {
  zug: Zug;
  menge: number;
  farbe: FarbCode;
}

export class Partie {
  readonly level: Level;
  private stand: Spielstand;
  private stapel: Schritt[] = [];

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
    this.stapel = [];
  }

  isSolved(): boolean {
    return istGeloest(this.stand);
  }

  /** 0..3. Drei nur fuer das Optimum. */
  sterne(): number {
    return sterneFuer(this.level, this.stapel.length, this.isSolved());
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
