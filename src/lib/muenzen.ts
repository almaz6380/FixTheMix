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

// DIE OEKONOMIE SEIT 1.1.0 (04.10.2026, Josefs Entscheidung): Muenzen sind
// knapp. Ziel ist ungefaehr EINE Hilfe je acht bis zehn Level, die man aus
// eigener Kraft verdient — wer oefter Hilfe will, sieht freiwillig ein
// Werbevideo (Tipp per Video, Zug zurueck per Video, siehe App.tsx). Vorher
// zahlte ein perfektes Level 25 Muenzen und ein Tipp kostete 15: jedes Level
// finanzierte mehr als einen Tipp, und die Waehrung war wirkungslos.
//
// Rechnung: ein Spieler, der meist zwei bis drei Sterne holt, verdient je
// Level etwa 5–6 Muenzen (Erstabschluss). Ein Rueckkauf (40) ist damit nach
// rund acht Leveln drin, ein Tipp (60) nach rund zehn.

/** Startguthaben. Reicht fuer einen Tipp oder zwei Rueckkaeufe zum Kennenlernen. */
export const START = 100;

/** Was ein Tipp kostet — rund zehn Level Lohn. */
export const KOSTEN_TIPP = 60;

/** Was EIN Zug zurueck aus einer Sackgasse kostet — rund acht Level Lohn. */
export const KOSTEN_RUECKKAUF = 40;

/**
 * Lohn nach Sternen, Index 0..3.
 *
 * Klein und steil: drei Sterne bringen das Vierfache von einem. Wer sauber
 * spielt, kommt schneller zur naechsten Hilfe — wer sich durchtippt, geht leer
 * aus und hat nur noch das Werbevideo. Genau diese Rueckkopplung soll die
 * Waehrung leisten.
 */
export const LOHN: readonly number[] = [0, 2, 4, 8];

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

/**
 * Was ein freiwilliges Werbevideo einbringt (Phase 5).
 *
 * Seit 1.1.0 deutlich mehr als ein perfektes Level (8) — dafuer gedeckelt auf
 * `VIDEOS_JE_TAG` am Tag (`videoKontingent`). Ohne Deckel liesse sich die
 * Waehrung mit Videos beliebig auffuellen, und die Hilfen haetten wieder
 * keinen Preis. Wer ueber den Deckel hinaus Hilfe will, nimmt den Tipp bzw.
 * den Zug zurueck direkt per Video — das kostet ihn genau ein Video je Hilfe.
 *
 * Das Video selbst liegt in `src/lib/werbung.ts` (`zeigeBelohnungsVideo`).
 * Gutgeschrieben wird NUR, wenn es vollstaendig gesehen wurde — das entscheidet
 * Googles SDK, nicht wir.
 */
export const BELOHNUNG_VIDEO = 30;

// --- Der Tagesdeckel fuer „Video fuer Muenzen" -------------------------------
//
// Hoechstens drei solche Videos je ORTSTAG (wie beim Tagesraetsel: der Tag des
// Spielers, nicht UTC). Eigener Speicherschluessel, aus demselben Grund wie die
// Muenzen selbst: der Fortschritt darf ihn nicht mitreissen.
//
// Die Regel steht als REINE Funktion da, damit sie ohne localStorage und ohne
// Uhr pruefbar ist (`tools/test-muenzen.mts`). Das Datum kommt vom Aufrufer
// (`heute()` aus serie.ts).

export const VIDEOS_JE_TAG = 3;

const VIDEO_SCHLUESSEL = 'fixthemix.muenzvideos.v1';

export interface VideoStand {
  /** Ortstag als JJJJ-MM-TT. */
  tag: string;
  /** An diesem Tag schon gesehene Muenzvideos. */
  anzahl: number;
}

/** Wie viele Muenzvideos gehen heute noch? Ein Stand von gestern zaehlt nicht. */
export function videoKontingent(stand: VideoStand | null, heute: string): number {
  if (!stand || stand.tag !== heute) return VIDEOS_JE_TAG;
  const n = Number.isFinite(stand.anzahl) ? Math.max(0, Math.trunc(stand.anzahl)) : VIDEOS_JE_TAG;
  return Math.max(0, VIDEOS_JE_TAG - n);
}

/** Ein gesehenes Video verbuchen. Ein neuer Tag faengt bei eins an. */
export function zaehleVideo(stand: VideoStand | null, heute: string): VideoStand {
  if (!stand || stand.tag !== heute) return { tag: heute, anzahl: 1 };
  return { tag: heute, anzahl: Math.max(0, Math.trunc(stand.anzahl) || 0) + 1 };
}

export function ladeVideoStand(): VideoStand | null {
  try {
    const roh = localStorage.getItem(VIDEO_SCHLUESSEL);
    if (!roh) return null;
    const o = JSON.parse(roh) as Partial<VideoStand>;
    if (typeof o?.tag !== 'string' || typeof o?.anzahl !== 'number') return null;
    return { tag: o.tag, anzahl: o.anzahl };
  } catch {
    return null;
  }
}

export function speichereVideoStand(stand: VideoStand): void {
  try {
    localStorage.setItem(VIDEO_SCHLUESSEL, JSON.stringify(stand));
  } catch {
    // Kein Speicher — der Deckel gilt dann nur fuer diese Sitzung nicht.
  }
}
