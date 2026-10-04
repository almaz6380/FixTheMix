// Die Bitte um eine Bewertung (seit 1.1.0).
//
// Ohne Gegenleistung — Apple (Richtlinie 5.6.1) und Google verbieten, eine
// Bewertung an eine Belohnung zu koppeln oder das Ergebnis abzufragen. Das
// System entscheidet ohnehin selbst, ob der Dialog wirklich erscheint (iOS
// hoechstens dreimal im Jahr) und meldet nichts zurueck.
//
// Wann gefragt wird, ist trotzdem unsere Sache, und daran haengt alles:
//  - erst nach dem ZEHNTEN geloesten Level — wer so weit kommt, mag das Spiel;
//  - danach hoechstens alle 90 Tage (eigene Bremse, weil wir nicht erfahren,
//    ob der Dialog erschienen ist);
//  - NIE im selben Moment wie ein Interstitial — zwei Unterbrechungen
//    hintereinander nach einem Sieg waeren genau der Moment, in dem jemand
//    einen Stern vergibt, und zwar einen;
//  - nie im Browser, dort gibt es keinen Store.
//
// Die Regel ist eine reine Funktion (`darfBewertungFragen`), geprueft in
// `tools/test-werbung.mts`.

import { Capacitor } from '@capacitor/core';

export const AB_LEVEL = 10;
export const ABSTAND_MS = 90 * 24 * 60 * 60 * 1000;

const SCHLUESSEL = 'fixthemix.bewertung.v1';

export interface BewertungsStand {
  /** Geloeste Partien insgesamt. */
  geloest: number;
  /** Zeitpunkt der letzten Bitte, 0 wenn noch nie. */
  zuletzt: number;
}

export function darfBewertungFragen(
  stand: BewertungsStand, jetzt: number, interstitialGerade: boolean,
): boolean {
  if (interstitialGerade) return false;
  if (stand.geloest < AB_LEVEL) return false;
  if (stand.zuletzt > 0 && jetzt - stand.zuletzt < ABSTAND_MS) return false;
  return true;
}

function lade(): BewertungsStand {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return { geloest: 0, zuletzt: 0 };
    const o = JSON.parse(roh) as Partial<BewertungsStand>;
    return {
      geloest: Number.isFinite(o.geloest) ? Math.max(0, Math.trunc(o.geloest!)) : 0,
      zuletzt: Number.isFinite(o.zuletzt) ? Math.max(0, o.zuletzt!) : 0,
    };
  } catch {
    return { geloest: 0, zuletzt: 0 };
  }
}

function speichere(stand: BewertungsStand): void {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
  } catch {
    // Kein Speicher — dann wird eben nie gefragt. Kein Schaden.
  }
}

/**
 * Nach jedem geloesten Level aufrufen, NACHDEM klar ist, ob ein Interstitial
 * kam. Zaehlt mit und fragt hoechstens dann, wenn die Regel es erlaubt.
 */
export async function vielleichtBewerten(interstitialGerade: boolean): Promise<void> {
  const stand = lade();
  stand.geloest += 1;
  const jetzt = Date.now();
  const fragen = Capacitor.isNativePlatform() && darfBewertungFragen(stand, jetzt, interstitialGerade);
  if (fragen) stand.zuletzt = jetzt;
  speichere(stand);
  if (!fragen) return;
  try {
    // Erst nach dem Siegfenster: die Karte kommt nach 1000 ms (index.css,
    // „Der Sieg"). Mitten in die Feier gehoert kein Systemdialog.
    await new Promise((r) => setTimeout(r, 1800));
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch (e) {
    console.warn('Bewertungsdialog nicht moeglich:', e);
  }
}
