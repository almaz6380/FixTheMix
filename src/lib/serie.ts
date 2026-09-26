// Das Tagesraetsel im Speicher: welcher Tag geloest ist, wie lang die Serie
// ist, und das beste Ergebnis je Tag.
//
// EIGENER SCHLUESSEL, wie bei den Muenzen und aus demselben Grund: eine neue
// Levelkurve wirft den Fortschritt weg (`folgeVersion`), aber sie hat mit dem
// Tagesraetsel nichts zu tun. Eine Serie von 80 Tagen darf daran nicht
// zerbrechen.
//
// ORTSTAG, nicht UTC. Die Begruendung steht in src/engine/tagesraetsel.ts —
// hier steht nur die eine Stelle, die den Ortstag bildet. `Date` ist in
// src/lib/ erlaubt; in der Engine waere es verboten.

import { tagDavor } from '../engine/tagesraetsel.ts';

const SCHLUESSEL = 'fixthemix.taeglich.v1';

/** So viele Tage Ergebnisse werden behalten. Mehr braucht niemand im Browser. */
const HISTORIE = 60;

export interface TagErgebnis {
  zuege: number;
  sterne: number;
}

export interface Taeglich {
  /** Letzter GELOESTER Tag als `YYYY-MM-DD`, leer wenn noch keiner. */
  zuletzt: string;
  /** Wie viele Tage in Folge geloest, den letzten eingeschlossen. */
  serie: number;
  /** Laengste Serie, die je erreicht wurde. */
  beste: number;
  /** Ergebnis je Tag, hoechstens `HISTORIE` Einträge. */
  tage: Record<string, TagErgebnis>;
}

const LEER: Taeglich = { zuletzt: '', serie: 0, beste: 0, tage: {} };

/**
 * Das heutige Datum des SPIELERS, als `YYYY-MM-DD`.
 *
 * Bewusst aus den lokalen Feldern zusammengesetzt und nicht
 * `toISOString().slice(0, 10)` — das waere UTC und laege fuer jeden oestlich
 * von Greenwich am Abend einen Tag zurueck. Genau dieser Einzeiler ist der
 * haeufigste Zeitzonenfehler ueberhaupt.
 */
export function heute(datum: Date = new Date()): string {
  const zwei = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${datum.getFullYear()}-${zwei(datum.getMonth() + 1)}-${zwei(datum.getDate())}`;
}

export function ladeTaeglich(): Taeglich {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return { ...LEER, tage: {} };
    const t = JSON.parse(roh) as Partial<Taeglich>;
    return {
      zuletzt: typeof t.zuletzt === 'string' ? t.zuletzt : '',
      serie: Number.isFinite(t.serie) ? Math.max(0, Math.trunc(t.serie!)) : 0,
      beste: Number.isFinite(t.beste) ? Math.max(0, Math.trunc(t.beste!)) : 0,
      tage: t.tage && typeof t.tage === 'object' ? t.tage : {},
    };
  } catch {
    return { ...LEER, tage: {} };
  }
}

export function speichereTaeglich(t: Taeglich): void {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(t));
  } catch {
    // Kein Speicher da — gespielt wird trotzdem.
  }
}

/**
 * Einen geloesten Tag eintragen.
 *
 * Die Serie waechst nur, wenn der Tag DAVOR der letzte geloeste war. Ein Tag
 * uebersprungen heisst: Serie faengt bei 1 an. Denselben Tag noch einmal
 * (besser) zu loesen aendert die Serie nicht — sonst liesse sie sich durch
 * Wiederholen hochzaehlen.
 */
export function merkeTag(t: Taeglich, iso: string, zuege: number, sterne: number): Taeglich {
  const bisher = t.tage[iso];
  const besser = bisher === undefined || sterne > bisher.sterne
    || (sterne === bisher.sterne && zuege < bisher.zuege);

  const tage = { ...t.tage };
  if (besser) tage[iso] = { zuege, sterne };

  // Alte Tage wegwerfen. Die Schluessel sind `YYYY-MM-DD`, also sortiert die
  // Zeichenkette schon richtig — kein Datumsvergleich noetig.
  const schluessel = Object.keys(tage).sort();
  while (schluessel.length > HISTORIE) {
    const weg = schluessel.shift()!;
    delete tage[weg];
  }

  // Schon heute geloest? Dann bleibt die Serie, wie sie ist.
  if (bisher !== undefined) return { ...t, tage };

  const serie = t.zuletzt === tagDavor(iso) ? t.serie + 1 : 1;
  return {
    zuletzt: iso,
    serie,
    beste: Math.max(t.beste, serie),
    tage,
  };
}

/** Ist dieser Tag schon geloest? */
export function tagGeloest(t: Taeglich, iso: string): boolean {
  return t.tage[iso] !== undefined;
}

/**
 * Laeuft die Serie noch? Nach einem verpassten Tag steht die alte Zahl noch im
 * Speicher — angezeigt werden darf sie dann nicht mehr.
 */
export function serieLaeuft(t: Taeglich, iso: string): boolean {
  return t.serie > 0 && (t.zuletzt === iso || t.zuletzt === tagDavor(iso));
}
