import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { richtung, spracheFuer, type AppSprache } from './sprachen.ts';

export { SPRACHEN, type AppSprache } from './sprachen.ts';

// Zwanzig Sprachen seit dem 02.10.2026, vorher fuenf. Welche es gibt und wie
// aus der Geraetesprache eine davon wird, steht in sprachen.ts. Eine weitere:
// JSON-Datei in locales/ und Eintrag in `SPRACH_CODES`/`SPRACHEN` — sonst
// nichts. Die Dateien kommen hier per Glob herein; eine Datei, die es gibt,
// ist damit immer auch geladen.
//
// ALLE Dateien tragen dieselben Schluessel; `tools/test-recht.mts` prueft das,
// und auch, dass jede Sprache in `SPRACHEN` eine Datei hat und umgekehrt.
const dateien = import.meta.glob<{ default: Record<string, unknown> }>(
  './locales/*.json', { eager: true },
);
const resources = Object.fromEntries(
  Object.entries(dateien).map(([pfad, modul]) => [
    pfad.replace('./locales/', '').replace('.json', ''),
    { translation: modul.default },
  ]),
);

/**
 * Die Sprache des Geraets, sofern wir sie bedienen — sonst Englisch.
 *
 * Das `catch` bleibt schmal: es faengt nur, dass es `navigator` ueberhaupt
 * gibt. Beim ersten Anlauf (Phase 5) stand diese Funktion UNTER ihrer
 * Verwendung, die temporale Todeszone von `const` warf, und ein zu weites
 * `catch` lieferte still Englisch — auf jedem deutschen Geraet.
 */
function geraeteSprache(): AppSprache {
  let wuensche: readonly string[] = [];
  try {
    wuensche = navigator.languages ?? [navigator.language];
  } catch {
    return 'en';
  }
  return spracheFuer(wuensche);
}

// Beim ersten Start entscheidet die GERAETESPRACHE, nicht Deutsch. Ein
// gespeicherter Wert laeuft ebenfalls durch die Weiche — ein altes `zh` oder
// eine Sprache, die es nicht mehr gibt, landet so auf einer, die es gibt.
let gespeichert: string | null = null;
try {
  gespeichert = localStorage.getItem('language');
} catch {
  // Kein Speicher — dann entscheidet das Geraet.
}
const savedLanguage = gespeichert ? spracheFuer([gespeichert]) : geraeteSprache();

/**
 * `lang` und `dir` auf <html>. `lang` ist keine Zierde: an ihm waehlt das
 * Handy fuer dieselben Han-Zeichen die japanische, chinesische oder
 * koreanische Glyphe. `dir="rtl"` spiegelt die Oberflaeche fuer Arabisch —
 * das Brett nimmt sich davon ausdruecklich aus (siehe Brett.tsx).
 */
function setzeDokument(s: AppSprache): void {
  try {
    document.documentElement.lang = s;
    document.documentElement.dir = richtung(s);
  } catch {
    // Kein Dokument (Test in node) — nichts zu tun.
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});
setzeDokument(savedLanguage);

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
  setzeDokument(code);
  void i18n.changeLanguage(code);
}

// Sprache der Oberflaeche — kennt keine Sperre. Laeuft durch dieselbe Weiche
// wie der Start: `i18n.language` ist hier immer einer unserer Codes, aber
// `slice(0, 2)` haette aus „zh-Hant" ein „zh" gemacht, das es nicht gibt.
export function appSprache(): AppSprache {
  return spracheFuer([i18n.language ?? 'en']);
}

// Sprache fuer alles, was an die Datenbank geht. Bis Phase 4 gibt es gar keine
// Datenbank — die Weiche steht trotzdem schon hier, weil genau diese Luecke
// (Oberflaeche kann eine Sprache, Backend noch nicht) in anigosha einmal live
// gegangen ist. Inhalte gibt es nur auf Deutsch und Englisch.
export function datenSprache(): AppSprache {
  const s = appSprache();
  return s === 'de' || s === 'en' ? s : 'en';
}

