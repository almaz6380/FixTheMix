// „Werbung entfernen" ueber RevenueCat.
//
// Uebernommen aus `anigosha/src/lib/purchases.ts`. Ohne hinterlegte Schluessel
// bleibt alles stumm (`nicht_eingerichtet`) — die App laeuft dann unveraendert
// weiter, statt beim Start ueber ein fehlendes SDK zu stolpern. Das ist
// wichtig, weil die Schluessel erst existieren, wenn die Store-Eintraege stehen
// (Phase 6).
//
// BEWUSST OHNE serverseitige Freischaltung, anders als beim Tagesraetsel:
// Werbefreiheit verschafft niemandem einen Vorteil im Spiel. Wer sie sich
// erschleicht, spart nur sich selbst die Anzeigen — es gibt keinen Gegner, der
// dadurch benachteiligt wird. Eine Webhook-Infrastruktur waere hier Aufwand
// ohne Schutzwirkung. (Bei den Muenzen ist das anders zu bewerten, sobald sie
// aus Werbevideos kommen — dazu der Hinweis in muenzen.ts.)

import { Capacitor } from '@capacitor/core';
import { setzeWerbefrei } from './werbung.ts';

/** Name des Anspruchs, wie er in RevenueCat angelegt wird. */
export const WERBEFREI = 'no_ads';

/** Kennung des Kaufprodukts in beiden Stores. */
export const PRODUKT_ID = 'fixthemix_no_ads';

const IOS_KEY = (import.meta.env.VITE_REVENUECAT_IOS_KEY as string) || '';
const ANDROID_KEY = (import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string) || '';

/**
 * Nur Gruende, keine Saetze — uebersetzt wird in der Oberflaeche
 * (`kauf.fehler.<grund>`). Fertige deutsche Texte hier waeren auf einem
 * englischen Geraet deutsch geblieben; genau der Fehler ist in Anigosha
 * einmal live gegangen.
 */
export type KaufErgebnis =
  | { ok: true; werbefrei: boolean }
  | {
      ok: false;
      grund: 'nicht_eingerichtet' | 'nur_app' | 'abgebrochen' | 'kein_angebot' | 'fehler';
      /** Technischer Befund — nur zur Diagnose, nie fuer den Spieler. */
      detail?: string;
    };

function schluessel(): string {
  const p = Capacitor.getPlatform();
  if (p === 'ios') return IOS_KEY;
  if (p === 'android') return ANDROID_KEY;
  return '';
}

/** Kaeufe gibt es nur in den nativen Apps — im Browser fehlt der Store. */
export function kaufMoeglich(): boolean {
  return Capacitor.isNativePlatform() && Boolean(schluessel());
}

const KENNUNG_SCHLUESSEL = 'fixthemix.kennung.v1';

/**
 * Eine stabile Kennung fuer RevenueCat.
 *
 * Heute geraetelokal, weil FixTheMix noch keine Konten hat. Sobald die anonyme
 * Anmeldung aus Phase 4 steht, gehoert hier die Supabase-User-ID hin — nur so
 * findet der Kauf beim Geraetewechsel zum richtigen Konto zurueck.
 *
 * Bis dahin gilt: „Kauf wiederherstellen" funktioniert trotzdem, denn
 * `restorePurchases()` fragt das STORE-Konto (Apple-ID bzw. Google-Konto), nicht
 * unsere Kennung. Nur die automatische Zuordnung beim ersten Start auf einem
 * neuen Geraet fehlt, und dafuer gibt es den Knopf.
 */
export function kennung(): string {
  try {
    const da = localStorage.getItem(KENNUNG_SCHLUESSEL);
    if (da) return da;
    const neu = `ftm-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(KENNUNG_SCHLUESSEL, neu);
    return neu;
  } catch {
    // Kein Speicher: eine Kennung nur fuer diese Sitzung. Der Kauf laesst sich
    // dann nicht automatisch wiederfinden, aber wiederherstellen schon.
    return 'ftm-ohne-speicher';
  }
}

let bereitFuer: string | null = null;
let initLauf: Promise<SdkZugang> | null = null;
type PurchasesPlugin = typeof import('@revenuecat/purchases-capacitor')['Purchases'];

/**
 * ⚠ DIE THENABLE-FALLE. Das Plugin-Objekt NIEMALS aus einer async-Funktion
 * zurueckgeben und niemals direkt `await`en — nur in dieser Huelle
 * weiterreichen.
 *
 * `Purchases` ist ein Capacitor-Proxy, der JEDEN Eigenschaftszugriff in einen
 * Plugin-Aufruf verwandelt — auch `.then`. Damit ist das Objekt ein falsches
 * „Thenable": `await` oder `return` aus einer async-Funktion ruft
 * `Purchases.then(resolve, reject)` auf, der Proxy ruft resolve/reject aber nie
 * auf, und die Promise loest NIE auf. Genau das war der „Kauf haengt auf
 * iOS"-Fehler in Anigosha, zehn Builds lang: kein nativer Aufruf wurde je
 * abgesetzt, darum keine RevenueCat-Logzeile und kein Netzverkehr.
 */
type SdkZugang = { Purchases: PurchasesPlugin };

/**
 * Richtet das SDK genau EINMAL ein und gibt allen Aufrufern denselben Vorgang.
 * Beim Start laufen zwei Wege gleichzeitig los (Status pruefen, Preis holen) —
 * es darf trotzdem nur ein `configure` geben.
 */
function bereitmachen(id: string): Promise<SdkZugang> | null {
  if (!kaufMoeglich()) return null;
  if (!initLauf || bereitFuer !== id) {
    bereitFuer = id;
    initLauf = (async () => {
      const modul = await import('@revenuecat/purchases-capacitor');
      const { Purchases, LOG_LEVEL } = modul;
      await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
      await Purchases.configure({ apiKey: schluessel(), appUserID: id });
      return { Purchases };
    })().catch((e) => {
      // Fehlschlag nicht einbrennen — der naechste Versuch darf es neu probieren.
      initLauf = null;
      bereitFuer = null;
      throw e;
    });
  }
  return initLauf;
}

function hatAnspruch(
  info: { customerInfo?: { entitlements?: { active?: Record<string, unknown> } } },
): boolean {
  return Boolean(info?.customerInfo?.entitlements?.active?.[WERBEFREI]);
}

/**
 * Bricht ein Versprechen nach `ms` ab. Ohne das haengt ein nicht antwortender
 * nativer Aufruf endlos, der Knopf bleibt blass, und es erscheint nirgends ein
 * Fehler. Genau so sah der Kauf-Fehler in Anigosha auf dem Geraet aus.
 */
function mitZeitlimit<T>(p: Promise<T>, ms: number, was: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, ab) => setTimeout(() => ab(new Error(`Zeitlimit ${ms} ms bei ${was}`)), ms)),
  ]);
}

/**
 * Beim Start pruefen, ob schon gekauft wurde, und die Werbung entsprechend
 * stummschalten. Gibt nie einen Fehler nach aussen — im Zweifel laeuft die App
 * eben mit Werbung weiter.
 */
export async function werbefreiPruefen(): Promise<boolean> {
  try {
    const zugang = await bereitmachen(kennung());
    if (!zugang) return false;
    const { Purchases } = zugang;
    const info = await mitZeitlimit(Purchases.getCustomerInfo(), 8000, 'getCustomerInfo');
    const frei = hatAnspruch(info);
    setzeWerbefrei(frei);
    return frei;
  } catch {
    return false;
  }
}

/** Preis in der Waehrung des Nutzers, fuer die Beschriftung des Knopfs. */
export async function preisHolen(): Promise<string | null> {
  try {
    const zugang = await bereitmachen(kennung());
    if (!zugang) return null;
    const { Purchases } = zugang;
    const angebote = await mitZeitlimit(Purchases.getOfferings(), 8000, 'getOfferings');
    return angebote.current?.availablePackages?.[0]?.product?.priceString ?? null;
  } catch {
    return null;
  }
}

export async function kaufeWerbefrei(): Promise<KaufErgebnis> {
  if (!Capacitor.isNativePlatform()) return { ok: false, grund: 'nur_app' };
  if (!schluessel()) return { ok: false, grund: 'nicht_eingerichtet' };
  try {
    const zugang = await mitZeitlimit(bereitmachen(kennung())!, 8000, 'SDK-Start');
    if (!zugang) return { ok: false, grund: 'nicht_eingerichtet' };
    const { Purchases } = zugang;
    const angebote = await mitZeitlimit(Purchases.getOfferings(), 8000, 'getOfferings');
    const paket = angebote.current?.availablePackages?.[0];
    if (!paket) return { ok: false, grund: 'kein_angebot' };
    const ergebnis = await Purchases.purchasePackage({ aPackage: paket });
    const frei = hatAnspruch(ergebnis);
    setzeWerbefrei(frei);
    return { ok: true, werbefrei: frei };
  } catch (e) {
    const f = e as { userCancelled?: boolean; code?: string; message?: string };
    // Abbruch ist kein Fehler. Wer „Abbrechen" tippt, will keine Fehlermeldung.
    if (f?.userCancelled) return { ok: false, grund: 'abgebrochen' };
    return { ok: false, grund: 'fehler', detail: f?.message ?? String(e) };
  }
}

export async function stelleKaufWiederHer(): Promise<KaufErgebnis> {
  if (!Capacitor.isNativePlatform()) return { ok: false, grund: 'nur_app' };
  if (!schluessel()) return { ok: false, grund: 'nicht_eingerichtet' };
  try {
    const zugang = await mitZeitlimit(bereitmachen(kennung())!, 8000, 'SDK-Start');
    if (!zugang) return { ok: false, grund: 'nicht_eingerichtet' };
    const { Purchases } = zugang;
    const info = await mitZeitlimit(Purchases.restorePurchases(), 15_000, 'restorePurchases');
    const frei = hatAnspruch(info);
    setzeWerbefrei(frei);
    return { ok: true, werbefrei: frei };
  } catch (e) {
    const f = e as { message?: string };
    return { ok: false, grund: 'fehler', detail: f?.message ?? String(e) };
  }
}
