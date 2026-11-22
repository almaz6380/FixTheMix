// AdMob-Anbindung.
//
// Uebernommen aus `anigosha/src/lib/ads.ts` und angepasst. Dort ist dieser Code
// durch eine Apple-Ablehnung (Richtlinie 2.1) und zehn Builds hindurchgegangen;
// die Kommentare, die davon erzaehlen, stehen bewusst mit hier drin.
//
// SEIT DEM 03.10.2026 LAUFEN ECHTE ANZEIGEN (`TEST_ANZEIGEN = false`), direkt
// vor dem ersten Release-Build. Eigene Live-Anzeigen anzusehen oder anzuklicken
// ist ein Richtlinienverstoss und kann das AdMob-Konto sperren — an Josefs Konto
// haengen auch Anigosha, MyPeak und WELLbooked. Zum Ausprobieren am Geraet:
// in AdMob das Geraet als Testgeraet eintragen oder hier kurz auf true stellen.
//
// Die beiden AdMob-APPS gibt es seit dem 26.09.2026, ihre echten App-IDs
// stehen in `Info.plist` und `AndroidManifest.xml`. Eine App-ID (mit Tilde)
// sagt dem SDK nur, welches Konto die App ist; ausgeliefert wird nach den
// BLOECKEN (mit Schraegstrich). Steht `TEST_ANZEIGEN` wieder auf true, kommen
// Googles Testbloecke, und es wird nichts verrechnet.
//
// VOR DEM ERSTEN RELEASE-BUILD (Phase 6):
//  1. ~~In AdMob je eine App „FixTheMix" fuer iOS und Android anlegen.~~
//     ERLEDIGT am 26.09.2026; die App-IDs stehen in ios/App/App/Info.plist
//     (GADApplicationIdentifier) und android/.../AndroidManifest.xml.
//  2. ~~Je einen Interstitial- und einen Rewarded-Block anlegen.~~ ERLEDIGT
//     am 02.10.2026, siehe PROD.
//  3. ~~`TEST_ANZEIGEN` auf false setzen.~~ ERLEDIGT am 03.10.2026.
//  4. ~~In AdMob eine DSGVO-Nachricht erstellen UND veroeffentlichen.~~
//     ERLEDIGT am 02.10.2026 — ohne sie erschiene gar kein Dialog.
//  5. Fuer iOS muessen DREI Dinge zusammenstimmen, sonst kommt die Ablehnung:
//     NSUserTrackingUsageDescription in der Info.plist, die native ATT-Abfrage
//     im SceneDelegate (NICHT im AppDelegate — Capacitor 8 legt ein
//     Scene-Manifest an, damit ruft iOS `applicationDidBecomeActive` nie auf),
//     und in App Store Connect „Tracking: ja" (nur von Hand).
//
// Im Browser passiert bewusst nichts: `fixthemix.almaz6380.workers.dev` zeigt keine
// Werbung, dort fehlt das Plugin.

import { Capacitor } from '@capacitor/core';

const TEST_ANZEIGEN = false;

/** Offizielle Test-IDs von Google, oeffentlich dokumentiert. */
const TEST = {
  ios: {
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
  android: {
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
};

/**
 * Die echten Anzeigenbloecke, angelegt am 02.10.2026 (Josef, AdMob). Sie wirken
 * erst, wenn `TEST_ANZEIGEN` auf false steht — seit dem 03.10.2026, direkt vor
 * dem ersten Release-Build. Die IDs sind nicht geheim: sie stehen in
 * jeder ausgelieferten App.
 */
const PROD = {
  ios: {
    interstitial: 'ca-app-pub-8860791993288062/3646198515',
    rewarded: 'ca-app-pub-8860791993288062/2333116848',
  },
  android: {
    interstitial: 'ca-app-pub-8860791993288062/5015120505',
    rewarded: 'ca-app-pub-8860791993288062/3574046320',
  },
};

/**
 * Die Anzeige beim Oeffnen der App („App-Start", seit 1.1.3, als Versuch).
 * Eigene Anzeigenbloecke, getrennt von PROD/TEST, weil `test-release.mts` dort
 * genau vier Bloecke zaehlt.
 *
 * ⚠ LEER HEISST AUS. Solange hier keine echten IDs stehen, laedt und zeigt die
 * App keine Start-Anzeige. Eintragen: in AdMob je Plattform einen Block vom
 * Typ „App-Start" anlegen. Und DANN auch die Datenschutzerklaerung ergaenzen
 * (`legalContent.ts`, Abschnitt „Werbung und deine Einwilligung": dort steht
 * bisher nur „zwischen zwei Leveln").
 */
const START_ANZEIGE = {
  prod: { ios: '', android: '' },
  // Googles oeffentliche Test-Bloecke fuer App-Start-Anzeigen.
  test: {
    ios: 'ca-app-pub-3940256099942544/5575463023',
    android: 'ca-app-pub-3940256099942544/9257395921',
  },
};

function startAnzeigeId(): string {
  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  return (TEST_ANZEIGEN ? START_ANZEIGE.test : START_ANZEIGE.prod)[platform];
}

function ids() {
  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  return (TEST_ANZEIGEN ? TEST : PROD)[platform];
}

const nativ = Capacitor.isNativePlatform();

/* eslint-disable @typescript-eslint/no-explicit-any */
let AdMob: any = null;
let bereit = false;
let werbefrei = false;
let initLauf: Promise<void> | null = null;
/** Verlangt UMP einen Einstieg fuer die Datenschutzoptionen (EWR, UK, …)? */
let datenschutzOptionen: string | null = null;

// --- Die Bremse -------------------------------------------------------------
// „Keine Werbung mitten im Level, hoechstens ein Interstitial zwischen zwei
// Leveln, mit Bremse" — so steht es in der CLAUDE.md unter Fairness.
//
// Ein Level dauert hier eine bis drei Minuten, deutlich kuerzer als eine
// Quizrunde in Anigosha. Deshalb JEDES DRITTE Level statt jedes zweite, und ein
// Mindestabstand von zwei Minuten. Ein Sortierspiel, das nach jedem Level
// Werbung zeigt, verliert seine Spieler schneller, als die Einblendungen
// einbringen.
//
// Das Tagesraetsel zaehlt MIT, hat aber keine eigene Gelegenheit: sonst kaeme
// nach dem einen Raetsel am Tag zuverlaessig eine Anzeige, und genau das waere
// die unangenehmste Stelle im ganzen Spiel.

export const JEDES_NTE_LEVEL = 3;
export const MINDESTABSTAND_MS = 120_000;

export interface BremsStand {
  /** Beendete Level seit dem Start der App. */
  zaehler: number;
  /** Zeitpunkt der letzten Anzeige, 0 wenn noch keine. */
  zuletzt: number;
}

/**
 * Die Regel als REINE Funktion — damit sie ohne AdMob, ohne Capacitor und ohne
 * Browser geprueft werden kann (`tools/test-werbung.mts`). Die Bremse ist der
 * Teil, bei dem ein Fehler direkt weh tut: zu oft, und die Spieler gehen.
 */
export function darfInterstitial(stand: BremsStand, jetzt: number): boolean {
  if (stand.zaehler <= 0) return false;
  if (stand.zaehler % JEDES_NTE_LEVEL !== 0) return false;
  if (stand.zuletzt > 0 && jetzt - stand.zuletzt < MINDESTABSTAND_MS) return false;
  return true;
}

const bremse: BremsStand = { zaehler: 0, zuletzt: 0 };

/** Nur fuer Tests und die Einstellungsanzeige. */
export function bremsStand(): BremsStand {
  return { ...bremse };
}

export function setzeWerbefrei(frei: boolean): void {
  werbefrei = frei;
}

/** Hat UMP erlaubt, Anzeigen anzufragen? Fehlt die Angabe, gilt ja. */
let darfAnfragen = true;
/** Ist der Start einmal gescheitert? Dann gibt es in dieser Sitzung keine Videos. */
let startFehlgeschlagen = false;

async function einwilligungsInfo() {
  try {
    const info = await AdMob.requestConsentInfo();
    datenschutzOptionen = info.privacyOptionsRequirementStatus ?? null;
    if (typeof info.canRequestAds === 'boolean') darfAnfragen = info.canRequestAds;
    return info;
  } catch (e) {
    console.warn('Einwilligungsstatus nicht lesbar:', e);
    return null;
  }
}

async function einwilligungsFormular() {
  try {
    const ergebnis = await AdMob.showConsentForm();
    if (typeof ergebnis?.canRequestAds === 'boolean') darfAnfragen = ergebnis.canRequestAds;
  } catch (e) {
    console.warn('Einwilligungsformular fehlgeschlagen:', e);
  }
}

/**
 * Wartet auf die Antwort zum ATT-Dialog — fragt aber selbst NICHT.
 *
 * Gefragt wird nativ im SceneDelegate. Von hier aus geht es nicht: Capacitor
 * fuehrt Plugin-Aufrufe auf einer Hintergrund-Warteschlange aus, und
 * `ATTrackingManager` zeigt dort nichts an. Genau daran ist Anigosha 1.0 an
 * Apples Richtlinie 2.1 gescheitert — der Dialog kam nie.
 *
 * Gewartet wird trotzdem, denn Google verlangt die ATT-Antwort VOR dem Start
 * des Anzeigen-SDK. Nach sechs Sekunden geht es ohnehin weiter: eine haengende
 * Abfrage darf die Werbung nicht dauerhaft blockieren.
 */
async function warteAufTracking() {
  if (Capacitor.getPlatform() !== 'ios') return;
  for (let versuch = 0; versuch < 20; versuch += 1) {
    try {
      const { status } = await AdMob.trackingAuthorizationStatus();
      if (status !== 'notDetermined') return;
    } catch (e) {
      console.warn('ATT-Status nicht lesbar:', e);
      return;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.warn('ATT blieb unbeantwortet — Werbung startet ohne Personalisierung.');
}

export function starteWerbung(): Promise<void> {
  if (!nativ) return Promise.resolve();
  initLauf ??= starteIntern();
  return initLauf;
}

/**
 * Reihenfolge seit 1.1.0: EINWILLIGUNG VOR `AdMob.initialize`. Google verlangt,
 * dass das SDK erst startet, wenn die Einwilligung eingeholt ist
 * (`canRequestAds`) — der Start selbst baut schon Verbindungen auf.
 *
 * ⚠ EINE AUSNAHME, und sie steckt im Plugin, nicht bei uns: auf iOS setzt
 * `@capacitor-community/admob` die Rueckreferenz seines Consent-Teils
 * (`consentExecutor.plugin`) AUSSCHLIESSLICH in `initialize()`. Vorher findet
 * `showConsentForm` keinen ViewController und lehnt mit „No ViewController" ab
 * — Swaply hatte genau so eine Sitzung lang gar keine Werbung (CLAUDE.md dort,
 * 29.07.2026). Auf iOS wird deshalb der STATUS vor dem Start geholt, das
 * FORMULAR aber direkt nach `initialize()` gezeigt. Eine Anzeige wird auch dort
 * erst NACH dem Formular angefragt (`bereit` steht erst danach), und nur, wenn
 * UMP es erlaubt. Auf Android gibt es diese Abhaengigkeit nicht (das Formular
 * holt sich die Activity selbst), dort laeuft alles vor dem Start.
 */
async function starteIntern() {
  try {
    const mod = await import('@capacitor-community/admob');
    AdMob = mod.AdMob;
    belohnungsEreignisse = mod.RewardAdPluginEvents;
    await warteAufTracking();
    const info = await einwilligungsInfo();
    const formularNoetig = Boolean(info?.isConsentFormAvailable && info?.status === 'REQUIRED');
    const ios = Capacitor.getPlatform() === 'ios';
    if (formularNoetig && !ios) await einwilligungsFormular();
    await AdMob.initialize({ initializeForTesting: TEST_ANZEIGEN });
    if (formularNoetig && ios) await einwilligungsFormular();
    bereit = darfAnfragen;
    if (!bereit) console.warn('UMP erlaubt keine Anzeigen — Werbung bleibt aus.');
  } catch (e) {
    startFehlgeschlagen = true;
    console.warn('AdMob-Start fehlgeschlagen:', e);
  }
}

/**
 * Darf die Einwilligung nachtraeglich geaendert werden? Die DSGVO verlangt
 * diesen Weg. Wartet den laufenden Start ab — wer die Einstellungen gleich
 * nach dem Oeffnen aufruft, soll den Knopf nicht grundlos vermissen. Wo UMP
 * ausdruecklich keinen Einstieg verlangt (ausserhalb EWR/UK), bleibt er weg.
 */
export async function einwilligungAenderbar(): Promise<boolean> {
  if (initLauf) await initLauf;
  return nativ && bereit && datenschutzOptionen !== 'NOT_REQUIRED';
}

export async function aendereEinwilligung(): Promise<void> {
  if (!bereit) return;
  try {
    await AdMob.resetConsentInfo();
    const info = await einwilligungsInfo();
    if (info?.isConsentFormAvailable) await einwilligungsFormular();
    bereit = darfAnfragen;
  } catch (e) {
    console.warn('Einwilligungs-Aenderung fehlgeschlagen:', e);
  }
}

// --- Das Interstitial: beim Sieg vorladen, beim WEITERTIPPEN zeigen ----------
//
// Bis 1.1.2 lief die Anzeige im Moment des letzten Gusses an — sie platzte in
// die Siegfeier (Welle, Sterne, Karte) und ueberdeckte genau das, wofuer man
// gespielt hat. Seit 1.1.3 sind es zwei Schritte:
//
//   1. `levelBeendet()` beim Loesen: zaehlt, fragt die Bremse, und laedt die
//      Anzeige im Hintergrund VOR. Zu sehen ist nichts.
//   2. `zeigeFaelligesInterstitial()` beim Verlassen des Siegfensters
//      („Weiter", „Nochmal", „Levelwahl"): zeigt sie, falls eine faellig ist.
//
// Das Vorladen hat einen zweiten Nutzen: die Anzeige steht sofort, statt nach
// dem Tipp noch Sekunden zu laden und in das naechste Level zu fallen.

/** Ist seit dem letzten Sieg eine Anzeige faellig und noch nicht gezeigt? */
let faellig = false;
/** Laeuft bzw. lief das Vorladen? Loest mit „geladen ja/nein" auf. */
let vorgeladen: Promise<boolean> | null = null;
/** Laenger wartet der Tipp auf „Weiter" nicht auf eine ladende Anzeige. */
const LADE_GEDULD_MS = 2500;

function ladeVor(): Promise<boolean> {
  return AdMob.prepareInterstitial({ adId: ids().interstitial })
    .then(() => true)
    .catch((e: unknown) => {
      console.warn('Interstitial nicht geladen:', e);
      return false;
    });
}

/**
 * Nach einem geloesten Level aufrufen. Wird auch ohne Werbung aufgerufen, damit
 * der Zaehler mitlaeuft — sonst kaeme nach dem Kauf „Werbung entfernen" und
 * einem spaeteren Widerruf sofort eine Anzeige.
 *
 * Gibt zurueck, ob eine Anzeige faellig ist — die Bitte um eine Bewertung
 * (bewertung.ts) darf nie zum selben Sieg kommen.
 */
export function levelBeendet(): boolean {
  bremse.zaehler += 1;
  if (!bereit || werbefrei) return false;
  if (!faellig && !darfInterstitial(bremse, Date.now())) return false;
  faellig = true;
  vorgeladen ??= ladeVor();
  return true;
}

/**
 * Beim Verlassen des Siegfensters aufrufen. Zeigt die faellige Anzeige, wenn
 * sie geladen ist; sonst geht es ohne weiter. Loest IMMER auf — der Knopf, an
 * dem das haengt, darf nie stehenbleiben.
 */
export async function zeigeFaelligesInterstitial(): Promise<boolean> {
  if (!faellig) return false;
  faellig = false;
  const laden = vorgeladen;
  vorgeladen = null;
  if (!bereit || werbefrei || !laden) return false;
  try {
    const geladen = await Promise.race([
      laden,
      new Promise<boolean>((r) => setTimeout(() => r(false), LADE_GEDULD_MS)),
    ]);
    // Nicht geladen heisst: keine Anzeige, und die Bremse laeuft NICHT an —
    // eine Luecke bei Google soll nicht zwei Minuten Sperre kosten.
    if (!geladen) return false;
    await AdMob.showInterstitial();
    bremse.zuletzt = Date.now();
    return true;
  } catch (e) {
    console.warn('Interstitial fehlgeschlagen:', e);
    return false;
  }
}

/**
 * Nach einem freiwillig gesehenen Video: die faellige Anzeige entfaellt, und
 * die Bremse laeuft neu an. Wer gerade 30 Sekunden Werbung gesehen hat, bekommt
 * nicht beim naechsten Tipp gleich noch eine.
 */
export function videoGesehen(): void {
  faellig = false;
  bremse.zuletzt = Date.now();
}

// --- Die Anzeige beim Oeffnen der App ----------------------------------------
//
// Ein Versuch (Josef, 22.11.2026), bewusst eng gefasst:
//   - nur beim Kaltstart und nur, solange der Startbildschirm offen ist —
//     nie in ein Level hinein („keine Werbung mitten im Level" gilt weiter);
//   - nie in der allerersten Sitzung: dort kommen schon Einwilligungsdialog
//     und Tracking-Frage, und wer die App zum ersten Mal oeffnet, soll das
//     Spiel sehen;
//   - hoechstens alle vier Stunden;
//   - nicht fuer Kaeufer von „Werbung entfernen".
// Eine gezeigte Start-Anzeige laesst die Bremse der Level-Anzeige neu
// anlaufen — nie zwei Vollbilder kurz hintereinander.

export const START_ABSTAND_MS = 4 * 60 * 60 * 1000;
const START_SCHLUESSEL = 'fixthemix.startanzeige.v1';
const START_LADE_GEDULD_MS = 4000;

export interface StartStand {
  /** Wie oft die App schon geoeffnet wurde, die laufende Sitzung mitgezaehlt. */
  sitzungen: number;
  /** Zeitpunkt der letzten Start-Anzeige, 0 wenn noch keine. */
  zuletzt: number;
}

/** Die Regel als reine Funktion, pruefbar ohne Plugin (`tools/test-werbung.mts`). */
export function darfStartAnzeige(stand: StartStand, jetzt: number): boolean {
  if (stand.sitzungen < 2) return false;
  if (stand.zuletzt > 0 && jetzt - stand.zuletzt < START_ABSTAND_MS) return false;
  return true;
}

function ladeStartStand(): StartStand {
  try {
    const roh = JSON.parse(localStorage.getItem(START_SCHLUESSEL) ?? 'null') as Partial<StartStand> | null;
    return {
      sitzungen: Number.isFinite(roh?.sitzungen) ? Math.max(0, Math.trunc(roh!.sitzungen!)) : 0,
      zuletzt: Number.isFinite(roh?.zuletzt) ? Math.max(0, roh!.zuletzt!) : 0,
    };
  } catch {
    return { sitzungen: 0, zuletzt: 0 };
  }
}

function speichereStartStand(stand: StartStand): void {
  try {
    localStorage.setItem(START_SCHLUESSEL, JSON.stringify(stand));
  } catch {
    // Kein Speicher — dann gilt jede Sitzung als die erste, und es kommt nie eine.
  }
}

/** Einmal je Sitzung (Lebensdauer des JS-Kontexts). */
let startAnzeigeVersucht = false;

/**
 * Beim Kaltstart vom Startbildschirm aus aufrufen, NACH `starteWerbung()`.
 * `nochAmStart` wird unmittelbar vor dem Zeigen gefragt: wer inzwischen in
 * ein Level getippt hat, bekommt nichts mehr.
 */
export async function vielleichtStartAnzeige(nochAmStart: () => boolean): Promise<boolean> {
  if (startAnzeigeVersucht) return false;
  startAnzeigeVersucht = true;
  if (!nativ) return false;

  const stand = ladeStartStand();
  stand.sitzungen += 1;
  speichereStartStand(stand);

  const adId = startAnzeigeId();
  if (!adId || !bereit || werbefrei) return false;
  if (!darfStartAnzeige(stand, Date.now())) return false;
  try {
    const geladen = await Promise.race([
      AdMob.loadAppOpen({ adId }).then(() => true),
      new Promise<boolean>((r) => setTimeout(() => r(false), START_LADE_GEDULD_MS)),
    ]);
    if (!geladen || !nochAmStart()) return false;
    await AdMob.showAppOpen();
    const jetzt = Date.now();
    speichereStartStand({ ...stand, zuletzt: jetzt });
    bremse.zuletzt = jetzt;
    return true;
  } catch (e) {
    console.warn('Start-Anzeige fehlgeschlagen:', e);
    return false;
  }
}

// --- Belohnte Anzeige ---------------------------------------------------------
//
// Fuer Muenzen, das Extra-Glas, den Tipp per Video und den Zug zurueck per
// Video.
//
//  'earned'      = vollstaendig gesehen, Belohnung darf gutgeschrieben werden
//  'aborted'     = das Video lief, wurde aber abgebrochen -> KEINE Belohnung
//  'unavailable' = gar kein Video (kein Netz, keine Fuellung, kein Plugin)
//
// ⚠ DIE HAENGE-FALLE (aus Mahjong Royale, dort am 31.07.2026 im Store
// aufgefallen): `showRewardVideoAd()` loest im Plugin AUSSCHLIESSLICH im
// Belohnungs-Callback auf (iOS `AdRewardExecutor.swift`, Android
// `onUserEarnedReward`). Bricht der Spieler ab, kommt NIE eine Antwort — ein
// blankes `await` haengt fuer immer, der Knopf bleibt grau und nichts passiert.
// Deshalb wird zusaetzlich auf Dismissed/FailedToShow gehoert und hart auf
// Zeit begrenzt. Die Aufloesung der Plugin-Promise zaehlt selbst als Beleg —
// nicht nur das Rewarded-Ereignis, sonst entschiede ein Reihenfolge-Rennen
// zwischen Ereignis und Antwort ueber die Belohnung.

export type VideoErgebnis = 'earned' | 'aborted' | 'unavailable';

const VIDEO_NOTBREMSE_MS = 180_000;
const VIDEO_NACH_BELOHNUNG_MS = 15_000;
const VIDEO_NACH_SCHLIESSEN_MS = 400;

/* Die Ereignisnamen kommen aus dem dynamisch geladenen Modul. */
let belohnungsEreignisse: any = null;
/** Ein Doppeltipp darf ein Video nicht zweimal gutschreiben. */
let videoLaeuftGerade = false;

export async function zeigeBelohnungsVideo(): Promise<VideoErgebnis> {
  if (!nativ) return 'unavailable';
  // Wer „Werbung entfernen" gekauft hat, startet das SDK nicht beim
  // App-Start (kein Einwilligungsdialog fuer jemanden, der dafuer bezahlt
  // hat). Erst wenn er selbst ein Video haben will, wird es hier gestartet.
  if (!bereit) await starteWerbung();
  if (!bereit || !belohnungsEreignisse) return 'unavailable';
  if (videoLaeuftGerade) return 'unavailable';
  videoLaeuftGerade = true;

  const griffe: Array<{ remove: () => Promise<void> }> = [];
  let verdient = false;
  let gezeigt = false;
  let fertig!: () => void;
  const ende = new Promise<void>((r) => { fertig = r; });
  let uhr = setTimeout(() => fertig(), VIDEO_NOTBREMSE_MS);
  const neuStellen = (ms: number) => {
    clearTimeout(uhr);
    uhr = setTimeout(() => fertig(), ms);
  };

  try {
    const E = belohnungsEreignisse;
    griffe.push(await AdMob.addListener(E.Showed, () => { gezeigt = true; }));
    griffe.push(await AdMob.addListener(E.Rewarded, () => {
      verdient = true;
      neuStellen(VIDEO_NACH_BELOHNUNG_MS);
    }));
    griffe.push(await AdMob.addListener(E.Dismissed, () => neuStellen(VIDEO_NACH_SCHLIESSEN_MS)));
    griffe.push(await AdMob.addListener(E.FailedToShow, () => fertig()));

    try {
      await AdMob.prepareRewardVideoAd({ adId: ids().rewarded });
    } catch (e) {
      console.warn('Belohnungsvideo nicht geladen:', e);
      return 'unavailable';
    }

    // Bewusst OHNE await, siehe oben: diese Promise kann ewig offen bleiben.
    AdMob.showRewardVideoAd()
      .then(() => {
        verdient = true;
        neuStellen(VIDEO_NACH_BELOHNUNG_MS);
      })
      .catch((e: unknown) => {
        console.warn('Belohnungsvideo fehlgeschlagen:', e);
        fertig();
      });

    await ende;
    return verdient ? 'earned' : gezeigt ? 'aborted' : 'unavailable';
  } catch (e) {
    console.warn('Belohnungsvideo fehlgeschlagen:', e);
    return 'unavailable';
  } finally {
    videoLaeuftGerade = false;
    clearTimeout(uhr);
    for (const g of griffe) {
      try { await g.remove(); } catch { /* schon weg */ }
    }
  }
}

/**
 * Gibt es hier ueberhaupt Belohnungsvideos? Im Browser nicht.
 *
 * „Werbung entfernen" schaltet NUR die Interstitials ab, nicht die
 * freiwilligen Videos (seit 1.1.0): wer bezahlt hat, soll nicht schlechter
 * dastehen als jemand, der nicht bezahlt hat. Fuer ihn ist das SDK eventuell
 * noch gar nicht gestartet — dann startet es beim ersten Video.
 */
export function belohnungMoeglich(): boolean {
  if (!nativ || startFehlgeschlagen) return false;
  return bereit || (werbefrei && initLauf === null);
}

/** Nur fuer die Anzeige in den Einstellungen. */
export function werbungLaeuft(): boolean {
  return bereit && !werbefrei;
}
