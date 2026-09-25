// Gesetzter Zufall. Gleicher Seed, gleiche Folge — im Browser, in Node und in
// einer Deno-Edge-Function.
//
// Warum ueberhaupt: Tagesraetsel und Duelle muessen fuer alle Spieler bitgenau
// dasselbe Level ergeben, und der Schummelschutz muss serverseitig dasselbe
// Brett neu bauen koennen. Anigosha loest das anders (Postgres
// `order by md5(id || datum)`) — das geht dort, weil die Auswahl IN der
// Datenbank stattfindet. Hier entsteht das Level im Client.
//
// FALLE 1: Nur ganzzahlige Rechnung mit `>>> 0`, `| 0` und Math.imul. Diese
// Operationen sind in ECMAScript exakt als 32-Bit-Ganzzahlrechnung
// festgelegt, also bitgleich auf jeder Maschine. Wer hier mit Gleitkomma
// arbeitet, bekommt irgendwann zwei Spieler mit verschiedenen Tagesraetseln —
// und merkt es erst aus Beschwerden.
//
// FALLE 2: mulberry32 roh mit 1, 2, 3 ... gefuettert liefert ANFANGS
// aehnliche Folgen. Level 1, 2 und 3 saehen sich dann aehnlich. Der Seed
// laeuft deshalb zuerst durch fmix32 (den Abschluss von MurmurHash3).
//
// FALLE 3: Fisher-Yates steht genau EINMAL im ganzen Projekt. Zwei leicht
// verschiedene Mischungen auf Client und Server sind der klassische Weg,
// die Wiedergabepruefung kaputtzumachen.

/** Streams: trennt Ziehungen mit verschiedenem Zweck, damit sie nicht korrelieren. */
export const STROM = {
  aufbau: 0x9e3779b9,
  farben: 0x85ebca6b,
  mischen: 0xc2b2ae35,
  rueckwaerts: 0x27d4eb2f,
} as const;

export interface Zufall {
  /** Rohes uint32. */
  next32(): number;
  /** Ganzzahl in [0, n) — ohne Modulo-Schieflage, per Rueckweisung. */
  unter(n: number): number;
  /** Ein Element aus der Liste. */
  zieh<T>(liste: readonly T[]): T;
  /** Fisher-Yates auf einer KOPIE. Die Vorlage bleibt unberuehrt. */
  mische<T>(liste: readonly T[]): T[];
}

/** MurmurHash3-Abschluss. Streut benachbarte Seeds ueber den ganzen Raum. */
export function fmix32(h: number): number {
  let x = h >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

/** Rohe mulberry32-Folge. Gleiche Umsetzung wie tools/reels/storyboard.mjs in anigosha. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

export function zufall(seed: number, strom: number = 0): Zufall {
  const next32 = mulberry32(fmix32((seed ^ strom) >>> 0));

  // Rueckweisung statt Modulo: `next32() % n` bevorzugt die kleinen Werte,
  // wenn n kein Teiler von 2^32 ist. Bei n <= 16 (unser Fall) ist die
  // Schieflage winzig — aber sie waere fuer immer in den Leveln.
  const unter = (n: number): number => {
    if (n <= 0) throw new Error('unter(n) mit n <= 0');
    if (n === 1) return 0;
    const grenze = Math.floor(0x100000000 / n) * n;
    let w = next32();
    while (w >= grenze) w = next32();
    return w % n;
  };

  return {
    next32,
    unter,
    zieh<T>(liste: readonly T[]): T {
      if (liste.length === 0) throw new Error('zieh() aus leerer Liste');
      return liste[unter(liste.length)]!;
    },
    mische<T>(liste: readonly T[]): T[] {
      const kopie = liste.slice();
      for (let i = kopie.length - 1; i > 0; i--) {
        const j = unter(i + 1);
        const h = kopie[i]!;
        kopie[i] = kopie[j]!;
        kopie[j] = h;
      }
      return kopie;
    },
  };
}

/**
 * Text zu Seed (FNV-1a, 32 Bit). Gedacht fuers Tagesraetsel: aus '2026-09-25'
 * wird immer derselbe Seed, ohne Datumsrechnung in der Engine.
 *
 * Bewusst KEIN Date-Parameter: welcher Tag gilt und in welcher Zeitzone,
 * entscheidet die aufrufende Seite. Anigosha nimmt `current_date` der
 * Datenbank, also UTC — wer in Neuseeland spielt, bekommt den Tageswechsel
 * mitten am Nachmittag. Diese Entscheidung faellt in Phase 4 bewusst, nicht
 * versehentlich hier.
 */
export function seedAusText(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
