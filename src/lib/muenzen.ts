// Die Muenzen.
//
// Wozu sie da sind: Ohne Preis ist der Tipp eine Loesungsmaschine. Er gibt
// nicht irgendeinen Zug, sondern den ersten Zug der BEWEISBAR kuerzesten
// Loesung — wer ihn oft genug drueckt, spielt jedes Level perfekt, ohne
// nachzudenken. Solange das gratis ist, kann kein Level schwer sein, egal wie
// gut die Levelkurve gebaut ist. Dasselbe gilt fuers Zuruecknehmen aus einer
// Sackgasse: kostenlos ist es eine Rueckgaengig-Taste, mit Preis ist es eine
// Entscheidung.
//
// EIGENER SPEICHERSCHLUESSEL, nicht im Fortschritt — und das ist kein
// Schoenheitsfehler, sondern der Grund, warum diese Datei existiert:
// `ladeFortschritt()` verwirft den GESAMTEN Stand, sobald `folgeVersion` nicht
// mehr passt. Bei Sternen ist das richtig (sie gehoeren zu bestimmten
// Brettern), aber Muenzen, fuer die jemand ein Werbevideo gesehen oder spaeter
// Geld bezahlt hat, duerfen von einer neuen Levelkurve nicht aufgefressen
// werden. Sie liegen deshalb unter einem eigenen Schluessel mit eigener
// Version.
//
// Ab Phase 4 gehoert der Stand zusaetzlich in die Datenbank: localStorage ist
// vom Spieler frei editierbar. Fuer eine reine Bequemlichkeitswaehrung am
// eigenen Geraet ist das egal — sobald Muenzen aus Werbung stammen, nicht mehr.

const SCHLUESSEL = 'fixthemix.muenzen.v1';

/** Startguthaben. Reicht fuer sechs Tipps oder zehn Rueckkaeufe. */
export const START = 100;

/** Was ein Tipp kostet. */
export const KOSTEN_TIPP = 15;

/** Was EIN Zug zurueck aus einer Sackgasse kostet. */
export const KOSTEN_RUECKKAUF = 10;

/**
 * Lohn nach Sternen, Index 0..3.
 *
 * Bewusst steil: drei Sterne bringen mehr als doppelt so viel wie einer. Wer
 * sauber spielt, finanziert damit die Tipps fuer die schweren Level — wer sich
 * durchtippt, geht irgendwann leer aus. Genau diese Rueckkopplung soll die
 * Waehrung leisten.
 */
export const LOHN: readonly number[] = [0, 5, 12, 25];

/**
 * Was ein Levelabschluss einbringt. Gezahlt wird nur die VERBESSERUNG.
 *
 * Ohne diese Regel waere ein einmal geloestes leichtes Level eine Muenzquelle
 * zum Wiederholen: Level 1 loesen, wieder loesen, wieder loesen. Wer sich von
 * einem Stern auf drei verbessert, bekommt die Differenz — wer sich nicht
 * verbessert, nichts.
 */
export function lohnFuer(vorher: number, nachher: number): number {
  const a = LOHN[klemme(vorher)]!;
  const b = LOHN[klemme(nachher)]!;
  return Math.max(0, b - a);
}

function klemme(sterne: number): number {
  if (!Number.isFinite(sterne)) return 0;
  return Math.min(3, Math.max(0, Math.trunc(sterne)));
}

/**
 * Guthaben lesen. localStorage kann werfen (privates Fenster, blockierte
 * Seitendaten) — dann faengt man eben von vorn an, statt dass die App
 * stehenbleibt.
 */
export function ladeMuenzen(): number {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (roh === null) return START;
    const n = Number(roh);
    // Ein von Hand verbogener oder halb geschriebener Wert darf nicht als
    // NaN oder als negatives Guthaben durchs Spiel geistern.
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : START;
  } catch {
    return START;
  }
}

export function speichereMuenzen(wert: number): void {
  try {
    localStorage.setItem(SCHLUESSEL, String(Math.max(0, Math.floor(wert))));
  } catch {
    // Kein Speicher da — gespielt wird trotzdem weiter.
  }
}

/**
 * Reicht das Guthaben? Eine eigene Funktion, damit „kann ich mir das leisten"
 * genau einmal im Code steht und die Knoepfe nicht jeder fuer sich rechnen.
 */
export function reichtFuer(guthaben: number, kosten: number): boolean {
  return guthaben >= kosten;
}

// HAKEN FUER PHASE 5: Hier kommt `belohnungsVideo()` hin — ein freiwilliges
// Werbevideo, das Muenzen gutschreibt (CLAUDE.md: „Werbevideos nur
// freiwillig"). Dafuer braucht es src/lib/ads.ts, und das kommt mit der
// Werbung. Bis dahin kommen Muenzen allein aus Sternen; wer blank ist, hat
// immer noch den kostenlosen Neustart, das Spiel bleibt also in jeder Lage
// spielbar.
