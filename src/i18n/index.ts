import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';
import en from './locales/en.json';

// Weitere Sprachen: neue JSON-Datei in locales/ + Eintrag in resources — sonst nichts.
// Laut Bauplan zuerst DE und EN, danach ES/FR/PT (Phase 5).
const savedLanguage = localStorage.getItem('language') || 'de';

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
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
export type AppSprache = 'de' | 'en';

// Welche Sprachen die Datenbank wirklich bedienen kann. Bis Phase 4 gibt es
// gar keine Datenbank — der Eintrag steht trotzdem schon hier, weil genau
// diese Luecke (Oberflaeche kann eine Sprache, Backend noch nicht) in
// anigosha einmal live gegangen ist und dort ein Quiz zeigte, das nicht lud.
const DATEN_VORHANDEN: Record<AppSprache, boolean> = {
  de: true,
  en: true,
};

// Sprache der Oberflaeche — kennt keine Sperre.
export function appSprache(): AppSprache {
  const l = i18n.language ?? 'de';
  if (l.startsWith('en')) return 'en';
  return 'de';
}

// Sprache fuer alles, was an die Datenbank geht. Faellt auf Englisch zurueck,
// solange die Inhalte dort noch nicht liegen.
export function datenSprache(): AppSprache {
  const s = appSprache();
  return DATEN_VORHANDEN[s] ? s : 'en';
}
