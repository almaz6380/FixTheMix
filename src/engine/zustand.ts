// Der Spielstand: anlegen, lesen, packen, vergleichen.
//
// Hier steht KEINE Regel. Was ein erlaubter Zug ist, steht in zuege.ts —
// diese Datei kennt nur die Form des Bretts.

import { LEER, farbeVon, idVon, type FarbCode, type FarbId } from './farben.ts';
import type { Behaelter, Level, LevelBericht, Spielstand } from './typen.ts';

/** 4 Bit je Schicht in einem uint32 — mehr als 8 Schichten passen nicht. */
export const MAX_HOEHE = 8;

export function leererStand(glaeser: number, hoehe: number): Spielstand {
  if (hoehe < 1 || hoehe > MAX_HOEHE) {
    throw new Error(`hoehe muss zwischen 1 und ${MAX_HOEHE} liegen, war ${hoehe}`);
  }
  if (glaeser < 1) throw new Error('mindestens ein Glas');
  return {
    hoehe,
    glaeser,
    zellen: new Uint8Array(glaeser * hoehe),
    fuell: new Uint8Array(glaeser),
  };
}

export function klone(z: Spielstand): Spielstand {
  return {
    hoehe: z.hoehe,
    glaeser: z.glaeser,
    zellen: z.zellen.slice(),
    fuell: z.fuell.slice(),
  };
}

export function imBrett(z: Spielstand, b: Behaelter): boolean {
  return Number.isInteger(b) && b >= 0 && b < z.glaeser;
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

/** Anzahl zusammenhaengender Farbbloecke. Leeres Glas = 0. */
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

/** Wie viele Schichten dieser Farbe im Glas liegen. */
export function anzahlFarbeIn(z: Spielstand, b: Behaelter, farbe: FarbCode): number {
  const f = z.fuell[b]!;
  const basis = b * z.hoehe;
  let n = 0;
  for (let i = 0; i < f; i++) if (z.zellen[basis + i] === farbe) n++;
  return n;
}

/** Verschiedene Farben im Glas, aufsteigend. */
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

/** In wie vielen Glaesern diese Farbe vorkommt. */
export function glaeserMitFarbe(z: Spielstand, farbe: FarbCode): number {
  let raus = 0;
  for (let b = 0; b < z.glaeser; b++) if (anzahlFarbeIn(z, b, farbe) > 0) raus++;
  return raus;
}

// --- Packen und Vergleichen ------------------------------------------------

/**
 * Ein uint32 je Glas: Farbe der Zelle i in den Bits 4i..4i+3.
 *
 * FALLE: Das abschliessende `>>> 0` ist Pflicht. Ohne es macht eine Farbe in
 * der obersten Zelle (z. B. 9 << 28) das Wort als int32 negativ, und zwei
 * Zustaende, die sich nur dort unterscheiden, koennen ueber einen
 * nachlaessigen Schluesselbau zusammenfallen.
 */
export function packGlas(z: Spielstand, b: Behaelter): number {
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
 * Glaeser sind untereinander vertauschbar — also werden die gepackten Woerter
 * sortiert. Das halbiert den Suchraum und erledigt nebenbei zwei klassische
 * Beschneidungen von selbst: alle leeren Glaeser packen zu 0, und „volles
 * einfarbiges Glas in ein leeres giessen" laesst die Wortmenge unveraendert
 * und faellt damit als Wiederholung heraus.
 *
 * WICHTIG: Der Zustand selbst behaelt seine Reihenfolge — sortiert wird nur
 * die KOPIE fuer den Schluessel. Sonst zeigen die zurueckgegebenen Zuege auf
 * die falschen Glaeser, und der Tipp waere Unsinn.
 *
 * Der Schluessel enthaelt einzelne Surrogat-Halbzeichen. Als Map-Schluessel
 * ist das einwandfrei (JS-Zeichenketten sind ungepruefte UTF-16-Folgen), er
 * darf aber NIE durch JSON oder ueber das Netz — nur im Speicher.
 */
export function schluessel(z: Spielstand): string {
  const n = z.glaeser;
  if (puffer.length < n) puffer = new Uint32Array(n * 2);
  const w = puffer.subarray(0, n);
  for (let b = 0; b < n; b++) w[b] = packGlas(z, b);
  w.sort();
  let s = '';
  for (let b = 0; b < n; b++) s += String.fromCharCode(w[b]! & 0xffff, w[b]! >>> 16);
  return s;
}

// --- Siegbedingung ---------------------------------------------------------

/**
 * Geloest heisst: jedes Glas ist leer ODER randvoll einfarbig. Halbvolle
 * einfarbige Glaeser zaehlen NICHT — sonst waere jedes Level mit genug
 * Glaesern trivial.
 */
export function istGeloest(z: Spielstand): boolean {
  for (let b = 0; b < z.glaeser; b++) {
    const f = z.fuell[b]!;
    if (f === 0) continue;
    if (f !== z.hoehe) return false;
    if (segmente(z, b) !== 1) return false;
  }
  return true;
}

// --- Level <-> Spielstand --------------------------------------------------

/**
 * Baut den Spielstand aus einem Level. `start` ist ab Version 3 eine
 * ZIFFERNKETTE, kein Zahlenfeld — siehe den Kommentar an `Level` in typen.ts.
 *
 * Geprueft wird hier streng, weil das die Stelle ist, an der Fremddaten
 * hereinkommen: die Folge aus dem Bundle, spaeter ein Level aus der Datenbank
 * und die Zugfolge eines Spielers in der Edge Function.
 */
export function standAusLevel(level: Level): Spielstand {
  const z = leererStand(level.glaeser, level.hoehe);
  if (level.start.length !== z.zellen.length) {
    throw new Error(`Level.start hat ${level.start.length} Zeichen, erwartet ${z.zellen.length}`);
  }
  for (let i = 0; i < level.start.length; i++) {
    const c = level.start.charCodeAt(i) - 48;
    if (c < 0 || c > 9) {
      throw new Error(`Level.start: Zeichen ${i} ist keine Ziffer (${level.start[i]!})`);
    }
    z.zellen[i] = c;
  }
  fuellNachziehen(z);
  return z;
}

/** Die Ziffernkette fuer `Level.start`. Gegenstueck zu standAusLevel(). */
export function startAusStand(z: Spielstand): string {
  let s = '';
  for (let i = 0; i < z.zellen.length; i++) s += String.fromCharCode(48 + z.zellen[i]!);
  return s;
}

/** Rechnet `fuell` aus `zellen` neu. Nur beim Aufbau noetig — Zuege pflegen es selbst. */
export function fuellNachziehen(z: Spielstand): void {
  for (let b = 0; b < z.glaeser; b++) {
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
  if (z.zellen.length !== z.glaeser * z.hoehe) return 'zellen hat die falsche Laenge';
  if (z.fuell.length !== z.glaeser) return 'fuell hat die falsche Laenge';
  for (let b = 0; b < z.glaeser; b++) {
    const basis = b * z.hoehe;
    const f = z.fuell[b]!;
    if (f > z.hoehe) return `Glas ${b}: fuell > hoehe`;
    for (let i = 0; i < f; i++) {
      if (z.zellen[basis + i] === LEER) return `Glas ${b}: Loch unter dem Fuellstand`;
    }
    for (let i = f; i < z.hoehe; i++) {
      if (z.zellen[basis + i] !== LEER) return `Glas ${b}: Fluessigkeit ueber dem Fuellstand`;
    }
  }
  return '';
}

/** Lesbare Fassung fuer Testausgaben. */
export function bericht(z: Spielstand): LevelBericht {
  const glaeser: FarbId[][] = [];
  for (let b = 0; b < z.glaeser; b++) {
    const inhalt: FarbId[] = [];
    for (let i = 0; i < z.fuell[b]!; i++) inhalt.push(idVon(z.zellen[b * z.hoehe + i]!));
    glaeser.push(inhalt);
  }
  return { glaeser };
}

/** Eine Zeile je Glas, mit Emoji — fuer die Handprobe im Terminal. */
export function alsText(z: Spielstand): string {
  const zeilen: string[] = [];
  for (let b = 0; b < z.glaeser; b++) {
    let s = `${`Glas ${b}`.padEnd(9)} `;
    for (let i = 0; i < z.hoehe; i++) {
      const c = z.zellen[b * z.hoehe + i]!;
      s += c === LEER ? '· ' : `${farbeVon(c).emoji} `;
    }
    zeilen.push(s);
  }
  return zeilen.join('\n');
}
