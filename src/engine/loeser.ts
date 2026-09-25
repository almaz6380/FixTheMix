// Der Loeser. A* mit bewiesenem Optimum — daran haengen die drei Sterne.
//
// WARUM ZULAESSIGKEIT HIER NICHT VERHANDELBAR IST
// Josefs Bauplan gibt drei Sterne nur fuer die kuerzeste Loesung. Schaetzt die
// Heuristik auch nur ein einziges Mal zu hoch, findet A* eine Loesung, die
// nicht die kuerzeste ist, und ein Spieler, der perfekt spielt, bekommt zwei
// Sterne. Das faellt in keinem Test auf, der nur „loesbar?" prueft — deshalb
// misst test-loeser.mts die Heuristik gegen eine Breitensuche nach.
//
// DIE HEURISTIK: DREI DISJUNKTE ZUGKLASSEN
// Jeder Zug gehoert zu genau einer der drei Klassen. Also darf man je Klasse
// eine Untergrenze bilden und die drei ADDIEREN — das bleibt zulaessig.
//
//   C1  schuetteln                 >= X
//   C2  giessen AUS einem Shaker   >= mischShaker + X
//   C3  giessen AUS einem Glas     >= Phi
//
//   X          kleinste Zahl Schuettelvorgaenge, mit der die Farbbilanz
//              ueberhaupt aufgeht (siehe schuettelBedarf)
//   mischShaker  Shaker, die gerade eine Mischfarbe halten — jeder braucht
//              mindestens einen Zug, um leer zu werden
//   Phi        Summe (Farbbloecke - 1) ueber alle GLAESER
//
//   h = Phi + 2*X + mischShaker
//
// Das war der zweite Anlauf. Der erste war `max(Phi, X)`: sicher, aber viel
// zu schwach — A* lief damit in Minuten statt Sekunden. Die Trennung nach
// Zugklassen ist der Grund, dass hier addiert werden DARF.
//
// Die Heuristik ist ausserdem KONSISTENT (kein Zug senkt h um mehr als 1):
//   Giessen aus einem Glas:   Phi faellt um <= 1, X und mischShaker gleich.
//   Giessen aus einem Shaker: Phi gleich, mischShaker faellt um <= 1.
//   Schuetteln:               Phi gleich, X' >= X-1, mischShaker' = +1,
//                             also 2(X'-X) + 1 >= -1.
// Konsistenz heisst: ein einmal entnommener Knoten ist endgueltig. Deshalb
// braucht es hier keine Wiederaufnahme geschlossener Knoten.
//
// Beide Terme sind unabhaengig von der Reihenfolge der Behaelter — das ist
// die Bedingung dafuer, dass die Kanonisierung in zustand.ts die Optimalitaet
// nicht kaputtmacht.

import { LEER, MISCHTABELLE, codeVon, istMisch, FARBEN } from './farben.ts';
import type { Budget, Loesung, Spielstand, Zug } from './typen.ts';
import {
  anzahlBehaelter, istGeloest, klone, leererStand, packBehaelter,
  schluessel, segmente,
} from './zustand.ts';
import { giessen, giessenZurueck, pruefeGiessen, pruefeSchuetteln, schuetteln } from './zuege.ts';

const HOCH = Number.POSITIVE_INFINITY;

// --- Farbbilanz ------------------------------------------------------------

/** Schichten je Farbcode auf dem ganzen Brett. Index = Farbcode. */
export function farbSummen(z: Spielstand): Int32Array {
  const raus = new Int32Array(FARBEN.length + 1);
  const n = anzahlBehaelter(z);
  for (let b = 0; b < n; b++) {
    const basis = b * z.hoehe;
    for (let i = 0; i < z.fuell[b]!; i++) raus[z.zellen[basis + i]!]!++;
  }
  return raus;
}

const PAARE = MISCHTABELLE.map((r) => ({
  a: codeVon(r.aus[0]),
  b: codeVon(r.aus[1]),
  ergibt: codeVon(r.ergibt),
}));

/**
 * Kleinste Zahl Schuettelvorgaenge, mit der die Farbbilanz ueberhaupt
 * aufgehen kann. Infinity bedeutet: von hier aus UNLOESBAR — und das ist der
 * billigste Unloesbarkeitsbeweis, den wir haben; er laeuft in Mikrosekunden,
 * bevor die Suche ueberhaupt anfaengt.
 *
 * Rechnung: Im Ziel liegt jede Farbe in vollen Glaesern, ihre Gesamtmenge ist
 * also ein Vielfaches von hoehe. Ein Schuettelvorgang des Paares (a,b) frisst
 * hoehe/2 von a und hoehe/2 von b und erzeugt hoehe der Mischfarbe. Gesucht
 * sind also nichtnegative ganze Zahlen x_paar mit
 *
 *     gesamt(c) - hoehe/2 * Summe{x_paar : c im Paar}  >= 0  und  = 0 (mod hoehe)
 *
 * fuer jede Grundfarbe, und gesamt(c) = 0 (mod hoehe) fuer Pur- und
 * Mischfarben (Mischfarben entstehen nur in ganzen hoehe-Portionen und
 * koennen nie wieder verbraucht werden).
 *
 * Die Zahl der Kombinationen ist winzig (je Paar hoechstens 2*gesamt/hoehe,
 * in der Praxis <= 4), deshalb reicht stures Durchprobieren.
 */
export function schuettelBedarf(z: Spielstand): number {
  const gesamt = farbSummen(z);
  const H = z.hoehe;
  const halb = H / 2;

  // Pur- und Mischfarben koennen nicht nachjustiert werden.
  for (const f of FARBEN) {
    const c = codeVon(f.id);
    if (f.art === 'grund') continue;
    if (gesamt[c]! % H !== 0) return HOCH;
  }
  if (z.shaker === 0 || PAARE.length === 0) {
    for (const f of FARBEN) {
      if (f.art !== 'grund') continue;
      if (gesamt[codeVon(f.id)]! % H !== 0) return HOCH;
    }
    return 0;
  }

  const grenzen = PAARE.map((p) => Math.floor(Math.min(gesamt[p.a]!, gesamt[p.b]!) / halb));
  let bestes = HOCH;
  const x = new Array<number>(PAARE.length).fill(0);

  const lauf = (i: number, summe: number): void => {
    if (summe >= bestes) return;               // schon schlechter als der Fund
    if (i === PAARE.length) {
      for (const f of FARBEN) {
        if (f.art !== 'grund') continue;
        const c = codeVon(f.id);
        let rest = gesamt[c]!;
        for (let k = 0; k < PAARE.length; k++) {
          if (PAARE[k]!.a === c || PAARE[k]!.b === c) rest -= halb * x[k]!;
        }
        if (rest < 0 || rest % H !== 0) return;
      }
      bestes = summe;
      return;
    }
    for (let v = 0; v <= grenzen[i]!; v++) {
      x[i] = v;
      lauf(i + 1, summe + v);
    }
    x[i] = 0;
  };
  lauf(0, 0);
  return bestes;
}

/** Summe (Farbbloecke - 1) ueber alle GLAESER. Null genau im Ziel. */
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

/**
 * Streuungsschranke — die zweite Untergrenze fuer C3 (giessen AUS einem Glas).
 *
 * Am Ende liegt Farbe c in genau ziel(c) = endmenge(c)/hoehe vollen Glaesern.
 * Ein Giessvorgang aus einem Glas senkt die Zahl der GLAESER, die c
 * enthalten, um hoechstens 1 — und nur ein solcher Zug senkt sie ueberhaupt
 * (aus einem Shaker giessen kann sie nur erhoehen, Schuetteln ruehrt Glaeser
 * nicht an). Also sind mindestens
 *
 *     Summe ueber c von max(0, glaeserMit(c) - ziel(c))
 *
 * Zuege aus Glaesern noetig. Das faengt genau den Fall, bei dem Phi blind
 * ist: [r,r,r,-] und [r,-,-,-] hat Phi = 0, braucht aber noch einen Zug.
 *
 * WARUM DAS AUCH BEI OFFENEN MISCHUNGEN GILT — das war der Knackpunkt.
 * Zulaessig bleibt die Schranke, solange ziel(c) nicht UNTERschaetzt wird.
 *   - Purfarben: endmenge = jetzige Menge. ziel steht fest.
 *   - Grundfarben: Schuetteln verbraucht sie nur, endmenge <= jetzige Menge.
 *     floor(menge/hoehe) ist also eine obere Schranke fuer ziel.
 *   - Mischfarben: die koennen noch WACHSEN. Solange also noch geschuettelt
 *     werden muss, bleiben sie hier aussen vor (Beitrag 0).
 *
 * Der erste Anlauf schaltete die ganze Schranke ab, solange noch etwas zu
 * mischen war. Genau dort — bei den Shaker-Leveln — war die Suche dann zu
 * schwach und brauchte ueber 40.000 Knoten je Level.
 */
export function streuung(z: Spielstand, gesamt: Int32Array, mischungOffen: boolean): number {
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
    if (mischungOffen && istMisch(c)) continue;
    const ziel = Math.floor(gesamt[c]! / z.hoehe);
    if (da > ziel) raus += da - ziel;
  }
  return raus;
}

function mischShakerZahl(z: Spielstand): number {
  let raus = 0;
  for (let b = z.glaeser; b < z.glaeser + z.shaker; b++) {
    const f = z.fuell[b]!;
    if (f > 0 && istMisch(z.zellen[b * z.hoehe + f - 1]!)) raus++;
  }
  return raus;
}

/**
 * `x` ist schuettelBedarf(z). Er wird uebergeben statt berechnet, weil er
 * sich nur beim Schuetteln aendert — pro Knoten neu zu rechnen waere der
 * teuerste Teil der ganzen Suche.
 */
export function heuristik(z: Spielstand, x: number, gesamt: Int32Array): number {
  if (x === HOCH) return HOCH;
  const phi = segmentSumme(z);
  const shakerTeil = 2 * x + mischShakerZahl(z);
  // Phi und Streuung schaetzen BEIDE dieselbe Zugklasse (giessen aus einem
  // Glas). Deshalb max und nicht plus — die Summe waere nicht mehr zulaessig.
  return Math.max(phi, streuung(z, gesamt, x > 0)) + shakerTeil;
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
// Ein Behaelter passt (4 Bit je Schicht, hoehe <= 8) in EIN uint32. Ein
// ganzer Spielstand ist also n uint32-Woerter. Die Knoten liegen deshalb in
// einem flachen Array, nicht als Objekte — sechsstellige Knotenzahlen mit je
// zwei frischen typisierten Arrays waeren der Flaschenhals.

function packeStand(z: Spielstand, ziel: Int32Array, offset: number): void {
  const n = anzahlBehaelter(z);
  for (let b = 0; b < n; b++) ziel[offset + b] = packBehaelter(z, b) | 0;
}

function entpackeStand(quelle: Int32Array, offset: number, z: Spielstand): void {
  const n = anzahlBehaelter(z);
  for (let b = 0; b < n; b++) {
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

/** Priorität: f in den oberen Bits, invertiertes g darunter — tiefer zuerst. */
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

  const n = anzahlBehaelter(start);
  const arbeit = leererStand(start.glaeser, start.shaker, start.hoehe);
  arbeit.zellen.set(start.zellen);
  arbeit.fuell.set(start.fuell);

  const leer = (grund: Loesung['status'], untergrenze: number, knoten: number): Loesung => ({
    status: grund, zuege: [], laenge: -1, untergrenze, knoten,
    ms: maxMs > 0 ? jetzt() - beginn : 0,
  });

  const gesamtWurzel = farbSummen(start);
  const xWurzel = schuettelBedarf(start);
  if (xWurzel === HOCH) return leer('unloesbar', HOCH, 0);
  if (istGeloest(start)) {
    return { status: 'optimal', zuege: [], laenge: 0, untergrenze: 0, knoten: 0, ms: 0 };
  }

  // Knotenspeicher. Waechst in Schueben, damit kleine Level nichts kosten.
  let kapazitaet = 4096;
  let worte = new Int32Array(kapazitaet * n);
  let eltern = new Int32Array(kapazitaet);
  let zugA = new Int32Array(kapazitaet);   // 0 = giessen, 1 = schuetteln
  let zugV = new Int32Array(kapazitaet);
  let zugN = new Int32Array(kapazitaet);
  let gWert = new Int32Array(kapazitaet);
  let xWert = new Int32Array(kapazitaet);
  let gesamtWert: Int32Array[] = [];
  let anzahl = 0;

  const platzSchaffen = () => {
    if (anzahl < kapazitaet) return;
    kapazitaet *= 2;
    const w = new Int32Array(kapazitaet * n); w.set(worte); worte = w;
    const e = new Int32Array(kapazitaet); e.set(eltern); eltern = e;
    const a = new Int32Array(kapazitaet); a.set(zugA); zugA = a;
    const v = new Int32Array(kapazitaet); v.set(zugV); zugV = v;
    const na = new Int32Array(kapazitaet); na.set(zugN); zugN = na;
    const g = new Int32Array(kapazitaet); g.set(gWert); gWert = g;
    const x = new Int32Array(kapazitaet); x.set(xWert); xWert = x;
  };

  const neuerKnoten = (
    elter: number, art: number, von: number, nach: number,
    g: number, x: number, gesamt: Int32Array,
  ): number => {
    platzSchaffen();
    const id = anzahl++;
    packeStand(arbeit, worte, id * n);
    eltern[id] = elter; zugA[id] = art; zugV[id] = von; zugN[id] = nach;
    gWert[id] = g; xWert[id] = x;
    gesamtWert[id] = gesamt;
    return id;
  };

  const haufen = new Haufen();
  const beste = new Map<string, number>();

  const wurzel = neuerKnoten(-1, -1, -1, -1, 0, xWurzel, gesamtWurzel);
  const hWurzel = heuristik(arbeit, xWurzel, gesamtWurzel);
  if (hWurzel === HOCH) return leer('unloesbar', HOCH, 0);
  beste.set(schluessel(arbeit), 0);
  haufen.lege(hWurzel * G_BREITE + (G_BREITE - 1), wurzel);

  let entnommen = 0;
  let zuletztGeprueft = 0;

  while (haufen.groesse > 0) {
    const id = haufen.nimm();
    entnommen++;

    if (entnommen > maxKnoten) {
      return leer('budget', Math.min(haufen.kleinstesF(G_BREITE), gWert[id]! + 0), entnommen);
    }
    if (maxMs > 0 && entnommen - zuletztGeprueft >= 4096) {
      zuletztGeprueft = entnommen;
      if (jetzt() - beginn > maxMs) {
        return leer('budget', haufen.kleinstesF(G_BREITE), entnommen);
      }
    }

    entpackeStand(worte, id * n, arbeit);
    const g = gWert[id]!;
    const x = xWert[id]!;
    const gesamt = gesamtWert[id]!;

    if (istGeloest(arbeit)) {
      // Weg zurueckverfolgen.
      const zuege: Zug[] = [];
      let k = id;
      while (eltern[k]! >= 0) {
        zuege.push(zugA[k] === 1
          ? { art: 'schuetteln', behaelter: zugV[k]! }
          : { art: 'giessen', von: zugV[k]!, nach: zugN[k]! });
        k = eltern[k]!;
      }
      zuege.reverse();
      return {
        status: 'optimal', zuege, laenge: g, untergrenze: g,
        knoten: entnommen, ms: maxMs > 0 ? jetzt() - beginn : 0,
      };
    }

    // --- Nachfolger: giessen. Make/unmake, damit nichts allokiert wird. ---
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
          const h2 = heuristik(arbeit, x, gesamt);
          const f2 = g2 + h2;
          if (h2 !== HOCH && f2 <= schranke) {
            beste.set(k, g2);
            const kind = neuerKnoten(id, 0, von, nach, g2, x, gesamt);
            haufen.lege(f2 * G_BREITE + (G_BREITE - 1 - Math.min(g2, G_BREITE - 1)), kind);
          }
        }
        giessenZurueck(arbeit, von, nach, e.menge, e.farbe);
      }
    }

    // --- Nachfolger: schuetteln. Der Shakerinhalt muss gesichert werden:
    //     aus vier Orange geht nicht hervor, ob r,r,g,g oder r,g,g,r drin war.
    for (let b = arbeit.glaeser; b < n; b++) {
      if (!pruefeSchuetteln(arbeit, b).ok) continue;
      const basis = b * arbeit.hoehe;
      const vorher = arbeit.zellen.slice(basis, basis + arbeit.hoehe);
      schuetteln(arbeit, b);
      const g2 = g + 1;
      const k = schluessel(arbeit);
      const alt = beste.get(k);
      if (alt === undefined || alt > g2) {
        const gesamt2 = farbSummen(arbeit);
        const x2 = schuettelBedarf(arbeit);
        if (x2 !== HOCH) {
          const h2 = heuristik(arbeit, x2, gesamt2);
          const f2 = g2 + h2;
          if (h2 !== HOCH && f2 <= schranke) {
            beste.set(k, g2);
            const kind = neuerKnoten(id, 1, b, -1, g2, x2, gesamt2);
            haufen.lege(f2 * G_BREITE + (G_BREITE - 1 - Math.min(g2, G_BREITE - 1)), kind);
          }
        }
      }
      arbeit.zellen.set(vorher, basis);
      arbeit.fuell[b] = arbeit.hoehe;
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
  if (schuettelBedarf(start) === HOCH) return false;
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
    const n = anzahlBehaelter(z);
    // Zuerst die Schuettelzuege, dann die Giesszuege — in dieser Reihenfolge
    // auf den Stapel, damit oben die vielversprechenden liegen.
    for (let b = z.glaeser; b < n; b++) {
      if (!pruefeSchuetteln(z, b).ok) continue;
      const k2 = klone(z); schuetteln(k2, b); stapel.push(k2);
    }
    for (let von = 0; von < n; von++) {
      if (z.fuell[von]! === 0) continue;
      for (let nach = 0; nach < n; nach++) {
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
