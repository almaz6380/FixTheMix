import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';

// Fuenf Sprachen seit Phase 5. Weitere: neue JSON-Datei in locales/, Eintrag in
// `resources`, Code in `SPRACHEN` — sonst nichts.
//
// ALLE Dateien tragen dieselben Schluessel; `tools/test-recht.mts` prueft das.
// Eine fehlende Zeile faellt sonst erst auf, wenn ein Spieler in dieser Sprache
// vor einem englischen Text steht.
export type AppSprache = 'de' | 'en' | 'es' | 'fr' | 'pt';

/** Die Sprachen in der Reihenfolge, in der die Einstellungen sie zeigen. */
export const SPRACHEN: { code: AppSprache; name: string }[] = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
];

/**
 * Die Sprache des Geraets, sofern wir sie bedienen — sonst Englisch.
 *
 * MUSS ueber `savedLanguage` stehen, und `SPRACHEN` muss darueber stehen. Beim
 * ersten Anlauf stand beides DARUNTER: dann greift die temporale Todeszone von
 * `const`, `SPRACHEN` ist beim Aufruf noch nicht initialisiert, der Zugriff
 * wirft — und das `catch` unten hat den Fehler stillschweigend verschluckt und
 * Englisch geliefert. Die App war damit auf jedem deutschen Geraet englisch, und
 * kein Test und keine Konsole sagte ein Wort. Der Oberflaechentest hat es
 * gefunden, weil er deutsche Knopftexte sucht.
 *
 * Das `catch` bleibt schmal: es faengt nur, dass es `navigator` ueberhaupt gibt.
 */
function geraeteSprache(): AppSprache {
  let wuensche: readonly string[] = [];
  try {
    wuensche = navigator.languages ?? [navigator.language];
  } catch {
    return 'en';
  }
  for (const roh of wuensche) {
    const kurz = roh.slice(0, 2).toLowerCase();
    const treffer = SPRACHEN.find((s) => s.code === kurz);
    if (treffer) return treffer.code;
  }
  return 'en';
}

// Beim ersten Start entscheidet die GERAETESPRACHE, nicht Deutsch. Vorher stand
// hier `|| 'de'`, und damit sah ein Spieler in Madrid eine deutsche App, obwohl
// es Spanisch gibt.
let gespeichert: string | null = null;
try {
  gespeichert = localStorage.getItem('language');
} catch {
  // Kein Speicher — dann entscheidet das Geraet.
}
const savedLanguage = gespeichert || geraeteSprache();

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    pt: { translation: pt },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

// Zentrale Sprachweiche, uebernommen aus anigosha (src/i18n/index.ts).
// Zwei Funktionen, weil Oberflaeche und Datenbank auseinanderlaufen koennen:
// appSprache() fuer Angezeigtes, datenSprache() fuer alles, was an Supabase geht.

/** Sprache umstellen und merken. */
export function setzeSprache(code: AppSprache): void {
  try {
    localStorage.setItem('language', code);
  } catch {
    // Kein Speicher — die Wahl gilt dann nur fuer diese Sitzung.
  }
  void i18n.changeLanguage(code);
}

// Welche Sprachen die Datenbank wirklich bedienen kann. Bis Phase 4 gibt es
// gar keine Datenbank — der Eintrag steht trotzdem schon hier, weil genau
// diese Luecke (Oberflaeche kann eine Sprache, Backend noch nicht) in
// anigosha einmal live gegangen ist und dort ein Quiz zeigte, das nicht lud.
const DATEN_VORHANDEN: Record<AppSprache, boolean> = {
  de: true,
  en: true,
  // Die Rechtstexte gibt es nur auf Deutsch und Englisch — sie muessen von
  // einem Anwalt gegengelesen werden, und das lohnt nicht in fuenf Sprachen,
  // solange keine Nutzer aus diesen Laendern da sind.
  es: false,
  fr: false,
  pt: false,
};

// Sprache der Oberflaeche — kennt keine Sperre.
export function appSprache(): AppSprache {
  const l = (i18n.language ?? 'de').slice(0, 2).toLowerCase();
  return (SPRACHEN.find((s) => s.code === l)?.code ?? 'de');
}

// Sprache fuer alles, was an die Datenbank geht. Faellt auf Englisch zurueck,
// solange die Inhalte dort noch nicht liegen.
export function datenSprache(): AppSprache {
  const s = appSprache();
  return DATEN_VORHANDEN[s] ? s : 'en';
}
