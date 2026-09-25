// Die Regeln. Sonst nichts.
//
// Seit dem 25.09.2026 gibt es nur noch EINE Regel, die Genre-Regel:
// gegossen wird auf dieselbe Farbe oder in ein leeres Glas, und es fliesst
// der ganze zusammenhaengende Block von oben, soweit er ins Ziel passt.
//
// Davor gab es eine zweite Regel fuer den Shaker (nur Grundfarben, hoechstens
// zwei, je hoechstens die Haelfte). Die ist mit dem Shaker gestrichen —
// Begruendung in der CLAUDE.md unter „Kein Shaker". Wer sie wieder braucht,
// findet sie in der Historie zu Commit 968332e.

import { LEER, type FarbCode } from './farben.ts';
import type { Behaelter, Spielstand, Zug, ZugErgebnis } from './typen.ts';
import { frei, imBrett, laufOben, oben } from './zustand.ts';

const ABGELEHNT = (grund: ZugErgebnis['grund']): ZugErgebnis => ({
  ok: false,
  grund,
  menge: 0,
  farbe: LEER,
});

/**
 * Prueft einen Giessvorgang, ohne den Stand anzufassen. `menge` sagt, wie
 * viele Schichten fliessen wuerden.
 */
export function pruefeGiessen(z: Spielstand, von: Behaelter, nach: Behaelter): ZugErgebnis {
  if (!imBrett(z, von) || !imBrett(z, nach)) return ABGELEHNT('index');
  if (von === nach) return ABGELEHNT('selber-behaelter');
  if (z.fuell[von]! === 0) return ABGELEHNT('quelle-leer');

  const platz = frei(z, nach);
  if (platz === 0) return ABGELEHNT('ziel-voll');

  const farbe = oben(z, von);
  const zielOben = oben(z, nach);
  if (zielOben !== LEER && zielOben !== farbe) return ABGELEHNT('farbe-passt-nicht');

  return { ok: true, grund: '', menge: Math.min(laufOben(z, von), platz), farbe };
}

/** Fuehrt den Giessvorgang aus. VERAENDERT `z`. */
export function giessen(z: Spielstand, von: Behaelter, nach: Behaelter): ZugErgebnis {
  const pruefung = pruefeGiessen(z, von, nach);
  if (!pruefung.ok) return pruefung;

  const { menge, farbe } = pruefung;
  const quelle = von * z.hoehe;
  const ziel = nach * z.hoehe;
  let fq = z.fuell[von]!;
  let fz = z.fuell[nach]!;
  for (let k = 0; k < menge; k++) {
    z.zellen[quelle + fq - 1] = LEER;
    z.zellen[ziel + fz] = farbe;
    fq--;
    fz++;
  }
  z.fuell[von] = fq;
  z.fuell[nach] = fz;
  return pruefung;
}

export function pruefe(z: Spielstand, zug: Zug): ZugErgebnis {
  return pruefeGiessen(z, zug.von, zug.nach);
}

/** Wendet einen Zug an. VERAENDERT `z`. */
export function anwenden(z: Spielstand, zug: Zug): ZugErgebnis {
  return giessen(z, zug.von, zug.nach);
}

/**
 * Macht einen Giessvorgang rueckgaengig. Nur fuer verlauf.ts und den Loeser:
 * die Angaben stammen aus dem ZugErgebnis des Hinwegs, es wird NICHT geprueft.
 */
export function giessenZurueck(
  z: Spielstand,
  von: Behaelter,
  nach: Behaelter,
  menge: number,
  farbe: FarbCode,
): void {
  const quelle = von * z.hoehe;
  const ziel = nach * z.hoehe;
  let fq = z.fuell[von]!;
  let fz = z.fuell[nach]!;
  for (let k = 0; k < menge; k++) {
    z.zellen[ziel + fz - 1] = LEER;
    z.zellen[quelle + fq] = farbe;
    fz--;
    fq++;
  }
  z.fuell[von] = fq;
  z.fuell[nach] = fz;
}

/**
 * Alle erlaubten Zuege. Eine Quelle der Wahrheit fuer Loeser, Generator,
 * Tests und die Oberflaeche — die Zulaessigkeit steht ausschliesslich in
 * pruefeGiessen.
 */
export function legaleZuege(z: Spielstand): Zug[] {
  const raus: Zug[] = [];
  for (let von = 0; von < z.glaeser; von++) {
    if (z.fuell[von]! === 0) continue;
    for (let nach = 0; nach < z.glaeser; nach++) {
      if (von === nach) continue;
      if (pruefeGiessen(z, von, nach).ok) raus.push({ von, nach });
    }
  }
  return raus;
}
