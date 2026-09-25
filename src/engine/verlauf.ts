// Eine laufende Partie: Zustand, Zugprotokoll, Undo-Stapel.
//
// Das ist die Schnittstelle, gegen die die Oberflaeche in Phase 2 baut. Die
// Engine darunter (zuege.ts) veraendert Zustaende an Ort und Stelle, weil der
// Loeser Millionen davon durchgeht; hier oben ist das gekapselt.
//
// WARUM DER UNDO-STAPEL DELTAS SPEICHERT, NICHT SCHNAPPSCHUESSE
// Ein Giessvorgang laesst sich vollstaendig aus (von, nach, menge, farbe)
// umkehren. Ein SCHUETTELN nicht: aus vier Orange geht nicht hervor, ob
// vorher r,r,g,g oder r,g,g,r im Shaker stand. Der Schuettelschritt sichert
// deshalb als einziger die vier Zellen des Shakers mit. Das sind ein paar
// Byte je Schuettelzug — und der Unterschied zwischen „Undo stimmt" und
// „Undo stimmt meistens".
//
// Ein ABGELEHNTER Zug darf nichts auf den Stapel legen und nichts ins
// Protokoll schreiben. Sonst zaehlt die Oberflaeche Fehlversuche als Zuege
// mit, und die Sternewertung waere ungerecht.

import type { FarbCode } from './farben.ts';
import { sterneFuer } from './generator.ts';
import { hint, type LoeserOptionen } from './loeser.ts';
import type { Behaelter, Level, Spielstand, Zug, ZugErgebnis } from './typen.ts';
import { giessen, giessenZurueck, schuetteln } from './zuege.ts';
import { istGeloest, standAusLevel } from './zustand.ts';

interface Schritt {
  zug: Zug;
  menge: number;
  farbe: FarbCode;
  /** Nur beim Schuetteln: die Zellen des Shakers davor. */
  vorher: Uint8Array | null;
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
    if (e.ok) {
      this.stapel.push({
        zug: { art: 'giessen', von, nach },
        menge: e.menge,
        farbe: e.farbe,
        vorher: null,
      });
    }
    return e;
  }

  shake(behaelter: Behaelter): ZugErgebnis {
    const basis = behaelter * this.stand.hoehe;
    // Sichern VOR dem Zug — danach ist die Anordnung unwiederbringlich weg.
    const vorher = this.stand.zellen.slice(basis, basis + this.stand.hoehe);
    const e = schuetteln(this.stand, behaelter);
    if (e.ok) {
      this.stapel.push({
        zug: { art: 'schuetteln', behaelter },
        menge: 0,
        farbe: e.farbe,
        vorher,
      });
    }
    return e;
  }

  kannUndo(): boolean {
    return this.stapel.length > 0;
  }

  undo(): boolean {
    const s = this.stapel.pop();
    if (!s) return false;
    if (s.zug.art === 'giessen') {
      giessenZurueck(this.stand, s.zug.von, s.zug.nach, s.menge, s.farbe);
    } else {
      const basis = s.zug.behaelter * this.stand.hoehe;
      this.stand.zellen.set(s.vorher!, basis);
      this.stand.fuell[s.zug.behaelter] = this.stand.hoehe;
    }
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
