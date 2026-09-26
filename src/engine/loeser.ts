// Der Loeser. A* mit bewiesenem Optimum — daran haengen die drei Sterne.
//
// WARUM ZULAESSIGKEIT HIER NICHT VERHANDELBAR IST
// Drei Sterne gibt es nur fuer die kuerzeste Loesung. Schaetzt die Heuristik
// auch nur ein einziges Mal zu hoch, findet A* eine Loesung, die nicht die
// kuerzeste ist, und wer perfekt spielt, bekommt zwei Sterne. Das faellt in
// keinem Test auf, der nur „loesbar?" prueft — deshalb misst
// test-loeser.mts die Heuristik gegen eine Breitensuche nach.
//
// DIE HEURISTIK
// Jeder Zug ist ein Giessvorgang aus einem Glas. Es gibt also nur EINE
// Zugklasse, und zwei Untergrenzen dafuer, von denen die groessere gilt:
//
//   Phi       Summe (Farbbloecke - 1) ueber alle Glaeser. Ein Zug senkt sie
//             um hoechstens 1, im Ziel ist sie 0.
//   Streuung  Summe ueber c von max(0, glaeserMit(c) - gesamt(c)/hoehe).
//             Am Ende liegt Farbe c in genau gesamt(c)/hoehe vollen Glaesern;
//             ein Zug senkt die Zahl der Glaeser mit c um hoechstens 1.
//
//   h = max(Phi, Streuung)
//
// Beide schaetzen DIESELBE Zugklasse, deshalb max und nicht plus — die Summe
// waere nicht mehr zulaessig. Streuung faengt genau den Fall, bei dem Phi
// blind ist: [r,r,r,-,-,-] und [r,-,-,-,-,-] hat Phi = 0, braucht aber noch
// einen Zug.
//
// Die Heuristik ist ausserdem KONSISTENT: kein Zug senkt sie um mehr als 1.
// Damit ist ein einmal entnommener Knoten endgueltig, und es braucht keine
// Wiederaufnahme geschlossener Knoten.
//
// Beide Terme sind unabhaengig von der Reihenfolge der Glaeser — das ist die
// Bedingung dafuer, dass die Kanonisierung in zustand.ts die Optimalitaet
// nicht kaputtmacht.
//
// Bis zum 25.09.2026 kam ein dritter Term fuer die Schuettelzuege dazu. Mit
// dem Shaker ist er entfallen; die Suche ist dadurch spuerbar schneller.

import { FARBEN, LEER } from './farben.ts';
import type { Budget, Loesung, Spielstand, Zug } from './typen.ts';
import { istGeloest, klone, leererStand, packGlas, schluessel, segmente } from './zustand.ts';
import { giessen, giessenZurueck, pruefeGiessen } from './zuege.ts';

const HOCH = Number.POSITIVE_INFINITY;

/** Schichten je Farbcode auf dem ganzen Brett. Index = Farbcode. */
export function farbSummen(z: Spielstand): Int32Array {
  const raus = new Int32Array(FARBEN.length + 1);
  for (let b = 0; b < z.glaeser; b++) {
    const basis = b * z.hoehe;
    for (let i = 0; i < z.fuell[b]!; i++) raus[z.zellen[basis + i]!]!++;
  }
  return raus;
}

/**
 * Geht die Farbbilanz ueberhaupt auf? Im Ziel liegt jede Farbe in vollen
 * Glaesern, ihre Gesamtmenge ist also ein Vielfaches von hoehe. Stimmt das
 * nicht, ist das Brett unloesbar — und das ist der billigste
 * Unloesbarkeitsbeweis, den wir haben: er laeuft in Mikrosekunden, bevor die
 * Suche ueberhaupt anfaengt.
 */
export function bilanzStimmt(z: Spielstand): boolean {
  const gesamt = farbSummen(z);
  for (let c = 1; c <= FARBEN.length; c++) {
    if (gesamt[c]! % z.hoehe !== 0) return false;
  }
  // Mehr Fluessigkeit als Glaeser fassen kann geht auch nicht auf.
  let belegt = 0;
  for (let c = 1; c <= FARBEN.length; c++) belegt += gesamt[c]!;
  return belegt <= z.glaeser * z.hoehe;
}

/** Summe (Farbbloecke - 1) ueber alle Glaeser. Null genau im Ziel. */
export function segmentSumme(z: Spielstand): number {
  let raus = 0;
  for (let b = 0; b < z.glaeser; b++) {
    const s = segmente(z, b);
    if (s > 1) raus += s - 1;
  }
  return raus;
}

// Wiederverwendeter Puffer: streuung() laeuft einmal je erzeugtem Knoten.
// Ein frisches Int32Array je Aufruf war in der Messung ein spuerbarer Posten.
const streuZaehler = new Int32Array(FARBEN.length + 1);

/** Siehe Kopfkommentar. Zweite Untergrenze, faengt was Phi nicht sieht. */
export function streuung(z: Spielstand, gesamt: Int32Array): number {
  const zaehler = streuZaehler;
  zaehler.fill(0);
  for (let b = 0; b < z.glaeser; b++) {
    const basis = b * z.hoehe;
    const f = z.fuell[b]!;
    for (let i = 0; i < f; i++) {
      const c = z.zellen[basis + i]!;
      let schonDa = false;
      for (let k = 0; k < i; k++) if (z.zellen[basis + k] === c) { schonDa = true; break; }
      if (!schonDa) zaehler[c]!++;
    }
  }
  let raus = 0;
  for (let c = 1; c <= FARBEN.length; c++) {
    const da = zaehler[c]!;
    if (da === 0) continue;
    const ziel = Math.floor(gesamt[c]! / z.hoehe);
    if (da > ziel) raus += da - ziel;
  }
  return raus;
}

export function heuristik(z: Spielstand, gesamt: Int32Array): number {
  return Math.max(segmentSumme(z), streuung(z, gesamt));
}

// --- Binaerhaufen -----------------------------------------------------------

class Haufen {
  private prio = new Int32Array(1024);
  private knoten = new Int32Array(1024);
  private n = 0;

  get groesse(): number { return this.n; }

  private wachse(): void {
    if (this.n < this.prio.length) return;
    const p = new Int32Array(this.prio.length * 2);
    const k = new Int32Array(this.knoten.length * 2);
    p.set(this.prio); k.set(this.knoten);
    this.prio = p; this.knoten = k;
  }

  lege(prio: number, knoten: number): void {
    this.wachse();
    let i = this.n++;
    this.prio[i] = prio;
    this.knoten[i] = knoten;
    while (i > 0) {
      const e = (i - 1) >> 1;
      if (this.prio[e]! <= this.prio[i]!) break;
      this.tausche(i, e);
      i = e;
    }
  }

  /** Kleinste Prioritaet. -1 wenn leer. */
  nimm(): number {
    if (this.n === 0) return -1;
    const raus = this.knoten[0]!;
    this.n--;
    if (this.n > 0) {
      this.prio[0] = this.prio[this.n]!;
      this.knoten[0] = this.knoten[this.n]!;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let k = i;
        if (l < this.n && this.prio[l]! < this.prio[k]!) k = l;
        if (r < this.n && this.prio[r]! < this.prio[k]!) k = r;
        if (k === i) break;
        this.tausche(i, k);
        i = k;
      }
    }
    return raus;
  }

  /** Kleinstes f in der offenen Liste — beim Abbruch eine bewiesene Schranke. */
  kleinstesF(teiler: number): number {
    return this.n === 0 ? HOCH : Math.floor(this.prio[0]! / teiler);
  }

  private tausche(i: number, j: number): void {
    const p = this.prio[i]!; this.prio[i] = this.prio[j]!; this.prio[j] = p;
    const k = this.knoten[i]!; this.knoten[i] = this.knoten[j]!; this.knoten[j] = k;
  }
}

// --- Zustaende packen und entpacken ----------------------------------------
//
// Ein Glas passt (4 Bit je Schicht, hoehe <= 8) in EIN uint32. Ein ganzer
// Spielstand ist also n uint32-Woerter. Die Knoten liegen deshalb in einem
// flachen Array, nicht als Objekte — sechsstellige Knotenzahlen mit je zwei
// frischen typisierten Arrays waeren der Flaschenhals.

function packeStand(z: Spielstand, ziel: Int32Array, offset: number): void {
  for (let b = 0; b < z.glaeser; b++) ziel[offset + b] = packGlas(z, b) | 0;
}

function entpackeStand(quelle: Int32Array, offset: number, z: Spielstand): void {
  for (let b = 0; b < z.glaeser; b++) {
    const w = quelle[offset + b]! >>> 0;
    const basis = b * z.hoehe;
    let f = 0;
    for (let i = 0; i < z.hoehe; i++) {
      const c = (w >>> (4 * i)) & 0xf;
      z.zellen[basis + i] = c;
      if (c !== LEER) f = i + 1;
    }
    z.fuell[b] = f;
  }
}

// --- A* ---------------------------------------------------------------------

/** Prioritaet: f in den oberen Bits, invertiertes g darunter — tiefer zuerst. */
const G_BREITE = 4096;

export interface LoeserOptionen extends Budget {}

/**
 * Sucht die kuerzeste Zugfolge. `status` sagt, wie ernst das Ergebnis ist:
 *   'optimal'   — `laenge` ist bewiesen die kleinste moegliche Zugzahl
 *   'unloesbar' — es gibt keine Loesung
 *   'budget'    — abgebrochen; `untergrenze` ist trotzdem bewiesen
 *
 * Bei 'budget' NIE eine Zahl raten. Der Generator verwirft solche Level, und
 * die Oberflaeche darf daraus keine Sternschwelle bauen.
 */
export function solve(start: Spielstand, optionen: LoeserOptionen = {}): Loesung {
  const jetzt = optionen.jetzt ?? Date.now;
  const maxKnoten = optionen.maxKnoten ?? 400_000;
  const maxMs = optionen.maxMs ?? 0;
  const schranke = optionen.schranke ?? HOCH;
  const beginn = maxMs > 0 ? jetzt() : 0;

  const n = start.glaeser;
  const arbeit = leererStand(start.glaeser, start.hoehe);
  arbeit.zellen.set(start.zellen);
  arbeit.fuell.set(start.fuell);

  const leer = (grund: Loesung['status'], untergrenze: number, knoten: number): Loesung => ({
    status: grund, zuege: [], laenge: -1, untergrenze, knoten,
    ms: maxMs > 0 ? jetzt() - beginn : 0,
  });

  if (!bilanzStimmt(start)) return leer('unloesbar', HOCH, 0);
  if (istGeloest(start)) {
    return { status: 'optimal', zuege: [], laenge: 0, untergrenze: 0, knoten: 0, ms: 0 };
  }

  // Die Farbmengen aendern sich durch Giessen nicht — einmal rechnen reicht.
  const gesamt = farbSummen(start);

  let kapazitaet = 4096;
  let worte = new Int32Array(kapazitaet * n);
  let eltern = new Int32Array(kapazitaet);
  let zugV = new Int32Array(kapazitaet);
  let zugN = new Int32Array(kapazitaet);
  let gWert = new Int32Array(kapazitaet);
  let anzahl = 0;

  const platzSchaffen = () => {
    if (anzahl < kapazitaet) return;
    kapazitaet *= 2;
    const w = new Int32Array(kapazitaet * n); w.set(worte); worte = w;
    const e = new Int32Array(kapazitaet); e.set(eltern); eltern = e;
    const v = new Int32Array(kapazitaet); v.set(zugV); zugV = v;
    const na = new Int32Array(kapazitaet); na.set(zugN); zugN = na;
    const g = new Int32Array(kapazitaet); g.set(gWert); gWert = g;
  };

  const neuerKnoten = (elter: number, von: number, nach: number, g: number): number => {
    platzSchaffen();
    const id = anzahl++;
    packeStand(arbeit, worte, id * n);
    eltern[id] = elter; zugV[id] = von; zugN[id] = nach; gWert[id] = g;
    return id;
  };

  const haufen = new Haufen();
  const beste = new Map<string, number>();

  const wurzel = neuerKnoten(-1, -1, -1, 0);
  const hWurzel = heuristik(arbeit, gesamt);
  beste.set(schluessel(arbeit), 0);
  haufen.lege(hWurzel * G_BREITE + (G_BREITE - 1), wurzel);

  let entnommen = 0;
  let zuletztGeprueft = 0;

  while (haufen.groesse > 0) {
    const id = haufen.nimm();
    entnommen++;

    if (entnommen > maxKnoten) {
      return leer('budget', haufen.kleinstesF(G_BREITE), entnommen);
    }
    if (maxMs > 0 && entnommen - zuletztGeprueft >= 4096) {
      zuletztGeprueft = entnommen;
      if (jetzt() - beginn > maxMs) {
        return leer('budget', haufen.kleinstesF(G_BREITE), entnommen);
      }
    }

    entpackeStand(worte, id * n, arbeit);
    const g = gWert[id]!;

    if (istGeloest(arbeit)) {
      const zuege: Zug[] = [];
      let k = id;
      while (eltern[k]! >= 0) {
        zuege.push({ von: zugV[k]!, nach: zugN[k]! });
        k = eltern[k]!;
      }
      zuege.reverse();
      return {
        status: 'optimal', zuege, laenge: g, untergrenze: g,
        knoten: entnommen, ms: maxMs > 0 ? jetzt() - beginn : 0,
      };
    }

    // Nachfolger. Make/unmake, damit nichts allokiert wird.
    for (let von = 0; von < n; von++) {
      if (arbeit.fuell[von]! === 0) continue;
      for (let nach = 0; nach < n; nach++) {
        if (von === nach) continue;
        const e = giessen(arbeit, von, nach);
        if (!e.ok) continue;
        const g2 = g + 1;
        // Reihenfolge ist Absicht: der Schluessel ist billiger als die
        // Heuristik, und die grosse Mehrheit der Nachfolger ist schon
        // gesehen. Umgekehrt herum lief die Suche rund doppelt so lange.
        const k = schluessel(arbeit);
        const alt = beste.get(k);
        if (alt === undefined || alt > g2) {
          const f2 = g2 + heuristik(arbeit, gesamt);
          if (f2 <= schranke) {
            beste.set(k, g2);
            const kind = neuerKnoten(id, von, nach, g2);
            haufen.lege(f2 * G_BREITE + (G_BREITE - 1 - Math.min(g2, G_BREITE - 1)), kind);
          }
        }
        giessenZurueck(arbeit, von, nach, e.menge, e.farbe);
      }
    }
  }

  return leer('unloesbar', HOCH, entnommen);
}

/**
 * Schnelle Ja/Nein-Antwort ohne Optimalitaetsanspruch: Tiefensuche mit
 * Gedaechtnis und Knotendeckel. Gedacht fuer Massenpruefungen (1.000 Level),
 * wo nur „ist das ueberhaupt loesbar?" zaehlt.
 */
export function loesbar(start: Spielstand, maxKnoten = 60_000): boolean {
  if (!bilanzStimmt(start)) return false;
  const gesehen = new Set<string>();
  const stapel: Spielstand[] = [klone(start)];
  let knoten = 0;
  while (stapel.length > 0) {
    const z = stapel.pop()!;
    if (istGeloest(z)) return true;
    if (++knoten > maxKnoten) return false;
    const k = schluessel(z);
    if (gesehen.has(k)) continue;
    gesehen.add(k);
    for (let von = 0; von < z.glaeser; von++) {
      if (z.fuell[von]! === 0) continue;
      for (let nach = 0; nach < z.glaeser; nach++) {
        if (von === nach || !pruefeGiessen(z, von, nach).ok) continue;
        const k2 = klone(z); giessen(k2, von, nach); stapel.push(k2);
      }
    }
  }
  return false;
}

/**
 * Naechster guter Zug. CLAUDE.md sieht dafuer ausdruecklich den Loeser vor —
 * der Tipp ist einfach der erste Zug der kuerzesten Loesung.
 */
export function hint(z: Spielstand, optionen: LoeserOptionen = {}): Zug | null {
  const l = solve(z, { maxKnoten: 60_000, maxMs: 1500, ...optionen });
  return l.status === 'optimal' && l.zuege.length > 0 ? l.zuege[0]! : null;
}
