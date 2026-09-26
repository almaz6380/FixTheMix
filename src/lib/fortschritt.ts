// Fortschritt im Browser merken: Sterne je Level, das zuletzt gespielte Level
// und wie weit freigeschaltet ist.
//
// localStorage kann werfen (privates Fenster, blockierte Seitendaten), und
// dann darf die App NICHT stehenbleiben — deshalb ist jeder Zugriff
// eingepackt. Ab Phase 4 wandert der Fortschritt zusaetzlich in die
// Datenbank; hier geht es nur ums Testen am Geraet.
//
// FORMAT v2 (26.09.2026). v1 kannte nur `sterne` und `zuletzt`, und die Sterne
// lagen unter dem Levelindex — ohne jeden Hinweis darauf, ZU WELCHER Folge
// dieser Index gehoert. Als die Folge von 20 auf 999 Level wuchs, hiess das:
// dieselbe Zahl, anderes Brett. Deshalb steht jetzt `folgeVersion` mit im
// Speicher. Passt sie nicht, wird der Stand verworfen statt umgedeutet — ein
// Stern auf einem Brett, das man nie gesehen hat, ist eine Luege.
//
// Der alte v1-Stand wird NICHT uebernommen: er gehoert zu 20 anderen Brettern.

const SCHLUESSEL = 'fixthemix.fortschritt.v2';

/**
 * Zaehlt hoch, sobald sich die Zuordnung Levelnummer -> Brett aendert (neue
 * Kurve, umsortierte Folge, neue Seeds). Steht auch in der CLAUDE.md.
 */
export const FOLGE_VERSION = 1;

export interface Fortschritt {
  /** Zu welcher Levelfolge dieser Stand gehoert. */
  folgeVersion: number;
  /** Sterne je Levelindex (0-basiert). Fehlt ein Eintrag, nie geloest. */
  sterne: Record<number, number>;
  /** Levelindex, der beim Start gezeigt wird. */
  zuletzt: number;
  /**
   * Hoechster freigeschalteter Levelindex. Gespielt werden darf alles bis
   * hierher, einschliesslich — der Rest ist gesperrt.
   */
  hoechstes: number;
}

const LEER: Fortschritt = { folgeVersion: FOLGE_VERSION, sterne: {}, zuletzt: 0, hoechstes: 0 };

export function ladeFortschritt(): Fortschritt {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return { ...LEER };
    const f = JSON.parse(roh) as Partial<Fortschritt>;
    if (f.folgeVersion !== FOLGE_VERSION) return { ...LEER };
    const sterne = f.sterne ?? {};
    // `hoechstes` aus den Sternen nachziehen, falls der Eintrag fehlt oder
    // hinter dem Gespielten herhinkt. Sonst koennte ein halb geschriebener
    // Stand ein bereits geloestes Level wieder sperren.
    let aus = f.hoechstes ?? 0;
    for (const k of Object.keys(sterne)) {
      const i = Number(k);
      if ((sterne[i] ?? 0) > 0 && i + 1 > aus) aus = i + 1;
    }
    return {
      folgeVersion: FOLGE_VERSION,
      sterne,
      zuletzt: f.zuletzt ?? 0,
      hoechstes: aus,
    };
  } catch {
    return { ...LEER };
  }
}

export function speichereFortschritt(f: Fortschritt): void {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(f));
  } catch {
    // Kein Speicher da — das Spiel laeuft trotzdem weiter.
  }
}

/** Sterne nur nach oben fortschreiben: ein schlechterer Lauf nimmt nichts weg. */
export function merkeSterne(f: Fortschritt, level: number, sterne: number): Fortschritt {
  const bisher = f.sterne[level] ?? 0;
  return {
    ...f,
    sterne: { ...f.sterne, [level]: Math.max(bisher, sterne) },
    // Ein geloestes Level schaltet das naechste frei.
    hoechstes: Math.max(f.hoechstes, level + 1),
  };
}

/**
 * Die EINE Stelle, die ueber die Sperre entscheidet. Levelwahl und
 * Weiter-Knopf fragen beide hier — sonst laufen Anzeige und Regel auseinander.
 */
export function istFrei(f: Fortschritt, level: number): boolean {
  return level <= f.hoechstes;
}

export function ladeEinstellung(name: string, vorgabe: boolean): boolean {
  try {
    const roh = localStorage.getItem(`fixthemix.${name}`);
    return roh === null ? vorgabe : roh === '1';
  } catch {
    return vorgabe;
  }
}

export function speichereEinstellung(name: string, wert: boolean): void {
  try {
    localStorage.setItem(`fixthemix.${name}`, wert ? '1' : '0');
  } catch {
    // egal
  }
}

/**
 * Kurzes Ruettelsignal. Android-Browser koennen das, iOS-Safari ignoriert es
 * stillschweigend — deshalb hier nur ein Versuch, nie eine Bedingung.
 * In der Store-App uebernimmt das spaeter Capacitor Haptics.
 */
export function haptik(dauer: number): void {
  try {
    navigator.vibrate?.(dauer);
  } catch {
    // egal
  }
}
