// Die Regeln. Sonst nichts.
//
// ZWEI SACHEN, die man beim ersten Lesen leicht ueberliest:
//
// 1. GIESSEN HAT ZWEI REGELN, nicht eine.
//    Ins GLAS gilt die Genre-Regel: Ziel leer oder oben dieselbe Farbe.
//    In den SHAKER kann diese Regel gar nicht gelten — sonst bekaeme man nie
//    eine zweite Farbe hinein, und der ganze Mix-Teil des Spiels waere tot.
//    Der Shaker hat deshalb seine eigene Zulaessigkeit: nur Grundfarben,
//    hoechstens zwei verschiedene, das Paar muss in der Mischtabelle stehen,
//    und je Farbe passt hoechstens die HAELFTE hinein.
//
// 2. DAS KONTINGENT VON hoehe/2 IST DER GANZE TRICK.
//    Weil keine Farbe mehr als die Haelfte belegen darf und der Shaker
//    hoehe fasst, gilt zwangslaeufig:
//
//        voller Shaker  <=>  genau zwei Grundfarben zu je hoehe/2
//
//    Damit ist `schuetteln` nur noch eine Fuellstandspruefung. Die
//    Mischbedingung wird nicht geprueft, sie ist strukturell unmoeglich zu
//    verletzen. Verworfen wurde die lockere Fassung („zwei Farben in
//    beliebigem Verhaeltnis werden zur Mischfarbe"): damit haette 3 Rot +
//    1 Gelb vier Orange ergeben, also Rot zu Orange im Verhaeltnis 1:1
//    getauscht. Die Farbbilanz des Generators waere nicht mehr berechenbar
//    gewesen, und der Loeser haette bei jedem Fuellstand zusaetzlich
//    „jetzt schuetteln oder erst noch nachgiessen?" abwaegen muessen.
//
// FOLGE, die bewusst in Kauf genommen wird: Wer einen Lauf von 3 Rot in
// einen leeren Shaker (hoehe 4) giesst, gibt nur 2 ab — der Rest bleibt in
// der Quelle. Der Shaker hat also eine sichtbare Haelfte-Markierung. Das
// weicht von „so viel wie passt" ab, verhindert aber, dass jemand einen
// Shaker in einen Zustand bringt, in dem er nur noch ausgeleert werden kann.

import {
  LEER,
  istGrund,
  mischungAus,
  type FarbCode,
} from './farben.ts';
import type { Behaelter, Spielstand, Zug, ZugErgebnis } from './typen.ts';
import {
  anzahlFarbeIn,
  farbenIn,
  frei,
  imBrett,
  istShaker,
  laufOben,
  oben,
} from './zustand.ts';

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
  const lauf = laufOben(z, von);

  if (istShaker(z, nach)) {
    // Shakerregel — siehe Kopfkommentar.
    if (!istGrund(farbe)) return ABGELEHNT('shaker-nur-grund');

    const drin = farbenIn(z, nach);
    if (!drin.includes(farbe)) {
      if (drin.length >= 2) return ABGELEHNT('shaker-dritte-farbe');
      if (drin.length === 1 && mischungAus(drin[0]!, farbe) === LEER) {
        return ABGELEHNT('shaker-kein-paar');
      }
    }

    const kontingent = z.hoehe / 2 - anzahlFarbeIn(z, nach, farbe);
    if (kontingent <= 0) return ABGELEHNT('shaker-kontingent');

    return { ok: true, grund: '', menge: Math.min(lauf, platz, kontingent), farbe };
  }

  // Glasregel — der Genre-Standard.
  const zielOben = oben(z, nach);
  if (zielOben !== LEER && zielOben !== farbe) return ABGELEHNT('farbe-passt-nicht');

  return { ok: true, grund: '', menge: Math.min(lauf, platz), farbe };
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

/**
 * Prueft das Schuetteln. Dank des Kontingents reicht die Fuellstandspruefung —
 * die Farbpruefung darunter ist reine Absicherung fuer von Hand gebaute
 * Staende (Tests, Generator) und kann im normalen Spiel nie greifen.
 */
export function pruefeSchuetteln(z: Spielstand, b: Behaelter): ZugErgebnis {
  if (!imBrett(z, b)) return ABGELEHNT('index');
  if (!istShaker(z, b)) return ABGELEHNT('kein-shaker');
  if (z.fuell[b]! !== z.hoehe) return ABGELEHNT('shaker-nicht-voll');

  const drin = farbenIn(z, b);
  if (drin.length !== 2) return ABGELEHNT('shaker-kein-paar');
  const ergebnis = mischungAus(drin[0]!, drin[1]!);
  if (ergebnis === LEER) return ABGELEHNT('shaker-kein-paar');

  return { ok: true, grund: '', menge: 0, farbe: ergebnis };
}

/** Schuettelt. VERAENDERT `z`. */
export function schuetteln(z: Spielstand, b: Behaelter): ZugErgebnis {
  const pruefung = pruefeSchuetteln(z, b);
  if (!pruefung.ok) return pruefung;
  const basis = b * z.hoehe;
  for (let i = 0; i < z.hoehe; i++) z.zellen[basis + i] = pruefung.farbe;
  return pruefung;
}

export function pruefe(z: Spielstand, zug: Zug): ZugErgebnis {
  return zug.art === 'giessen'
    ? pruefeGiessen(z, zug.von, zug.nach)
    : pruefeSchuetteln(z, zug.behaelter);
}

/** Wendet einen Zug an. VERAENDERT `z`. */
export function anwenden(z: Spielstand, zug: Zug): ZugErgebnis {
  return zug.art === 'giessen'
    ? giessen(z, zug.von, zug.nach)
    : schuetteln(z, zug.behaelter);
}

/**
 * Macht einen Giessvorgang rueckgaengig. Nur fuer verlauf.ts und den Loeser:
 * die Angaben stammen aus dem ZugErgebnis des Hinwegs, es wird NICHT geprueft.
 *
 * Schuetteln laesst sich so NICHT umkehren — aus vier Orange geht nicht
 * hervor, ob vorher r,r,g,g oder r,g,g,r im Shaker stand. Wer schuettelt,
 * muss die vier Zellen vorher sichern (siehe verlauf.ts).
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
 * Tests und spaeter die Oberflaeche — die Zulaessigkeit steht ausschliesslich
 * in pruefeGiessen/pruefeSchuetteln.
 */
export function legaleZuege(z: Spielstand): Zug[] {
  const n = z.glaeser + z.shaker;
  const raus: Zug[] = [];
  for (let von = 0; von < n; von++) {
    if (z.fuell[von]! === 0) continue;
    for (let nach = 0; nach < n; nach++) {
      if (von === nach) continue;
      if (pruefeGiessen(z, von, nach).ok) raus.push({ art: 'giessen', von, nach });
    }
  }
  for (let b = z.glaeser; b < n; b++) {
    if (pruefeSchuetteln(z, b).ok) raus.push({ art: 'schuetteln', behaelter: b });
  }
  return raus;
}
