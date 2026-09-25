// Der Spielstand: anlegen, lesen, packen, vergleichen.
//
// Hier steht KEINE Regel. Was ein erlaubter Zug ist, steht in zuege.ts —
// diese Datei kennt nur die Form des Bretts.

import { LEER, farbeVon, idVon, istMisch, type FarbCode, type FarbId } from './farben.ts';
import type { Behaelter, Level, LevelBericht, Spielstand } from './typen.ts';

/** 4 Bit je Schicht in einem uint32 — mehr als 8 Schichten passen nicht. */
export const MAX_HOEHE = 8;

export function leererStand(glaeser: number, shaker: number, hoehe: number): Spielstand {
  if (hoehe < 1 || hoehe > MAX_HOEHE) {
    throw new Error(`hoehe muss zwischen 1 und ${MAX_HOEHE} liegen, war ${hoehe}`);
  }
  if (glaeser < 1) throw new Error('mindestens ein Glas');
  if (shaker < 0) throw new Error('shaker darf nicht negativ sein');
  // Das Kontingent im Shaker ist hoehe/2 je Farbe (siehe zuege.ts). Bei
  // ungerader hoehe gibt es kein Halbe-Halbe, ein voller Shaker koennte nie
  // entstehen und der Mix-Teil waere still kaputt. Deshalb hier hart stoppen.
  if (shaker > 0 && hoehe % 2 !== 0) {
    throw new Error(`mit Shakern muss hoehe gerade sein, war ${hoehe}`);
  }
  const n = glaeser + shaker;
  return {
    hoehe,
    glaeser,
    shaker,
    zellen: new Uint8Array(n * hoehe),
    fuell: new Uint8Array(n),
  };
}

export function klone(z: Spielstand): Spielstand {
  return {
    hoehe: z.hoehe,
    glaeser: z.glaeser,
    shaker: z.shaker,
    zellen: z.zellen.slice(),
    fuell: z.fuell.slice(),
  };
}

export function anzahlBehaelter(z: Spielstand): number {
  return z.glaeser + z.shaker;
}

export function istShaker(z: Spielstand, b: Behaelter): boolean {
  return b >= z.glaeser && b < z.glaeser + z.shaker;
}

export function imBrett(z: Spielstand, b: Behaelter): boolean {
  return Number.isInteger(b) && b >= 0 && b < z.glaeser + z.shaker;
}

/** Oberste Schicht, oder LEER. */
export function oben(z: Spielstand, b: Behaelter): FarbCode {
  const f = z.fuell[b]!;
  return f === 0 ? LEER : z.zellen[b * z.hoehe + f - 1]!;
}

/** Laenge des zusammenhaengenden Laufs gleicher Farbe von oben. 0 bei leer. */
export function laufOben(z: Spielstand, b: Behaelter): number {
  const f = z.fuell[b]!;
  if (f === 0) return 0;
  const basis = b * z.hoehe;
  const farbe = z.zellen[basis + f - 1]!;
  let n = 1;
  while (n < f && z.zellen[basis + f - 1 - n] === farbe) n++;
  return n;
}

export function frei(z: Spielstand, b: Behaelter): number {
  return z.hoehe - z.fuell[b]!;
}

/** Anzahl zusammenhaengender Farbbloecke. Leerer Behaelter = 0. */
export function segmente(z: Spielstand, b: Behaelter): number {
  const f = z.fuell[b]!;
  if (f === 0) return 0;
  const basis = b * z.hoehe;
  let n = 1;
  for (let i = 1; i < f; i++) {
    if (z.zellen[basis + i] !== z.zellen[basis + i - 1]) n++;
  }
  return n;
}

/** Wie viele Schichten dieser Farbe im Behaelter liegen. */
export function anzahlFarbeIn(z: Spielstand, b: Behaelter, farbe: FarbCode): number {
  const f = z.fuell[b]!;
  const basis = b * z.hoehe;
  let n = 0;
  for (let i = 0; i < f; i++) if (z.zellen[basis + i] === farbe) n++;
  return n;
}

/** Verschiedene Farben im Behaelter, aufsteigend. */
export function farbenIn(z: Spielstand, b: Behaelter): FarbCode[] {
  const f = z.fuell[b]!;
  const basis = b * z.hoehe;
  const raus: FarbCode[] = [];
  for (let i = 0; i < f; i++) {
    const c = z.zellen[basis + i]!;
    if (!raus.includes(c)) raus.push(c);
  }
  raus.sort((a, b2) => a - b2);
  return raus;
}

/** Schichten dieser Farbe auf dem GANZEN Brett — Glaeser und Shaker. */
export function gesamtFarben(z: Spielstand): Map<FarbCode, number> {
  const raus = new Map<FarbCode, number>();
  const n = anzahlBehaelter(z);
  for (let b = 0; b < n; b++) {
    const f = z.fuell[b]!;
    const basis = b * z.hoehe;
    for (let i = 0; i < f; i++) {
      const c = z.zellen[basis + i]!;
      raus.set(c, (raus.get(c) ?? 0) + 1);
    }
  }
  return raus;
}

/** In wie vielen Behaeltern diese Farbe vorkommt. */
export function behaelterMitFarbe(z: Spielstand, farbe: FarbCode): number {
  const n = anzahlBehaelter(z);
  let raus = 0;
  for (let b = 0; b < n; b++) if (anzahlFarbeIn(z, b, farbe) > 0) raus++;
  return raus;
}

/** Shaker, die gerade eine Mischfarbe halten (also geschuettelt wurden). */
export function mischShaker(z: Spielstand): number {
  let raus = 0;
  for (let b = z.glaeser; b < z.glaeser + z.shaker; b++) {
    if (istMisch(oben(z, b))) raus++;
  }
  return raus;
}

// --- Packen und Vergleichen ------------------------------------------------

/**
 * Ein uint32 je Behaelter: Farbe der Zelle i in den Bits 4i..4i+3.
 *
 * FALLE: Das abschliessende `>>> 0` ist Pflicht. Ohne es macht eine Farbe in
 * der obersten Zelle (z. B. 9 << 28) das Wort als int32 negativ, und zwei
 * Zustaende, die sich nur dort unterscheiden, koennen ueber einen
 * nachlaessigen Schluesselbau zusammenfallen.
 */
export function packBehaelter(z: Spielstand, b: Behaelter): number {
  const basis = b * z.hoehe;
  let w = 0;
  for (let i = 0; i < z.hoehe; i++) w |= z.zellen[basis + i]! << (4 * i);
  return w >>> 0;
}

// Wiederverwendeter Puffer: schluessel() laeuft im Loeser millionenfach.
let puffer = new Uint32Array(32);

/**
 * Kanonischer Schluessel fuer den Besucht-Speicher.
 *
 * Glaeser sind untereinander vertauschbar, Shaker ebenso — also werden die
 * gepackten Woerter sortiert. Das halbiert den Suchraum und erledigt neben-
 * bei zwei klassische Beschneidungen von selbst: alle leeren Glaeser packen
 * zu 0, und „volles einfarbiges Glas in ein leeres Glas giessen“ laesst die
 * Wortmenge unveraendert und faellt damit als Wiederholung heraus.
 *
 * ZWEI BEDINGUNGEN, ohne die das die Optimalitaet zerstoert:
 *  1. Glaeser NUR mit Glaesern sortieren, Shaker NUR mit Shakern. Ein Shaker
 *     gehorcht anderen Giessregeln und ist kein vertauschbares Glas.
 *  2. Der Zustand selbst behaelt seine Reihenfolge — sortiert wird nur die
 *     KOPIE fuer den Schluessel. Sonst zeigen die zurueckgegebenen Zuege auf
 *     die falschen Behaelter, und der Tipp waere Unsinn.
 *
 * Der Schluessel enthaelt einzelne Surrogat-Halbzeichen. Als Map-Schluessel
 * ist das einwandfrei (JS-Zeichenketten sind ungepruefte UTF-16-Folgen), er
 * darf aber NIE durch JSON oder ueber das Netz — nur im Speicher.
 */
export function schluessel(z: Spielstand): string {
  const n = z.glaeser + z.shaker;
  if (puffer.length < n) puffer = new Uint32Array(n * 2);
  const w = puffer.subarray(0, n);
  for (let b = 0; b < n; b++) w[b] = packBehaelter(z, b);
  w.subarray(0, z.glaeser).sort();
  w.subarray(z.glaeser).sort();
  let s = '';
  for (let b = 0; b < n; b++) s += String.fromCharCode(w[b]! & 0xffff, w[b]! >>> 16);
  return s;
}

// --- Siegbedingung ---------------------------------------------------------

/**
 * Gelöst heisst: jedes Glas ist leer ODER randvoll einfarbig, und alle
 * Shaker sind leer. Halbvolle einfarbige Glaeser zaehlen NICHT — sonst waere
 * jedes Level mit genug Glaesern trivial.
 */
export function istGeloest(z: Spielstand): boolean {
  for (let b = z.glaeser; b < z.glaeser + z.shaker; b++) {
    if (z.fuell[b]! !== 0) return false;
  }
  for (let b = 0; b < z.glaeser; b++) {
    const f = z.fuell[b]!;
    if (f === 0) continue;
    if (f !== z.hoehe) return false;
    if (segmente(z, b) !== 1) return false;
  }
  return true;
}

// --- Level <-> Spielstand --------------------------------------------------

export function standAusLevel(level: Level): Spielstand {
  const z = leererStand(level.glaeser, level.shaker, level.hoehe);
  if (level.start.length !== z.zellen.length) {
    throw new Error(`Level.start hat ${level.start.length} Zellen, erwartet ${z.zellen.length}`);
  }
  z.zellen.set(level.start);
  fuellNachziehen(z);
  return z;
}

export function startAusStand(z: Spielstand): number[] {
  return Array.from(z.zellen);
}

/** Rechnet `fuell` aus `zellen` neu. Nur beim Aufbau noetig — Zuege pflegen es selbst. */
export function fuellNachziehen(z: Spielstand): void {
  const n = anzahlBehaelter(z);
  for (let b = 0; b < n; b++) {
    const basis = b * z.hoehe;
    let f = 0;
    while (f < z.hoehe && z.zellen[basis + f] !== LEER) f++;
    z.fuell[b] = f;
  }
}

/**
 * Prueft die Zusicherungen, auf die sich der Rest verlaesst. Leerer Text =
 * alles in Ordnung. Nur fuer Tests gedacht, nicht fuer den heissen Pfad.
 */
export function pruefeInvariante(z: Spielstand): string {
  const n = anzahlBehaelter(z);
  if (z.zellen.length !== n * z.hoehe) return 'zellen hat die falsche Laenge';
  if (z.fuell.length !== n) return 'fuell hat die falsche Laenge';
  for (let b = 0; b < n; b++) {
    const basis = b * z.hoehe;
    const f = z.fuell[b]!;
    if (f > z.hoehe) return `Behaelter ${b}: fuell > hoehe`;
    for (let i = 0; i < f; i++) {
      if (z.zellen[basis + i] === LEER) return `Behaelter ${b}: Loch unter dem Fuellstand`;
    }
    for (let i = f; i < z.hoehe; i++) {
      if (z.zellen[basis + i] !== LEER) return `Behaelter ${b}: Fluessigkeit ueber dem Fuellstand`;
    }
  }
  return '';
}

/** Lesbare Fassung fuer Testausgaben. */
export function bericht(z: Spielstand): LevelBericht {
  const lies = (b: Behaelter): FarbId[] => {
    const raus: FarbId[] = [];
    for (let i = 0; i < z.fuell[b]!; i++) raus.push(idVon(z.zellen[b * z.hoehe + i]!));
    return raus;
  };
  const glaeser: FarbId[][] = [];
  for (let b = 0; b < z.glaeser; b++) glaeser.push(lies(b));
  const shaker: FarbId[][] = [];
  for (let b = z.glaeser; b < z.glaeser + z.shaker; b++) shaker.push(lies(b));
  return { glaeser, shaker };
}

/** Eine Zeile je Behaelter, mit Emoji — fuer die Handprobe im Terminal. */
export function alsText(z: Spielstand): string {
  const zeile = (b: Behaelter, name: string) => {
    let s = `${name.padEnd(9)} `;
    for (let i = 0; i < z.hoehe; i++) {
      const c = z.zellen[b * z.hoehe + i]!;
      s += c === LEER ? '· ' : `${farbeVon(c).emoji} `;
    }
    return s;
  };
  const zeilen: string[] = [];
  for (let b = 0; b < z.glaeser; b++) zeilen.push(zeile(b, `Glas ${b}`));
  for (let b = z.glaeser; b < z.glaeser + z.shaker; b++) {
    zeilen.push(zeile(b, `Shaker ${b - z.glaeser}`));
  }
  return zeilen.join('\n');
}
