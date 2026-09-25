// Fortschritt im Browser merken. Bewusst klein gehalten: Sterne je Level und
// das zuletzt gespielte Level, mehr nicht.
//
// localStorage kann werfen (privates Fenster, blockierte Seitendaten), und
// dann darf die App NICHT stehenbleiben — deshalb ist jeder Zugriff
// eingepackt. Ab Phase 4 wandert der Fortschritt zusaetzlich in die
// Datenbank; hier geht es nur ums Testen am Geraet.

const SCHLUESSEL = 'fixthemix.fortschritt.v1';

export interface Fortschritt {
  /** Sterne je Levelindex. Fehlt ein Eintrag, wurde das Level nie geloest. */
  sterne: Record<number, number>;
  zuletzt: number;
}

const LEER: Fortschritt = { sterne: {}, zuletzt: 0 };

export function ladeFortschritt(): Fortschritt {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return { ...LEER };
    const f = JSON.parse(roh) as Fortschritt;
    return { sterne: f.sterne ?? {}, zuletzt: f.zuletzt ?? 0 };
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
    sterne: { ...f.sterne, [level]: Math.max(bisher, sterne) },
    zuletzt: f.zuletzt,
  };
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
