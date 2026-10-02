// Welche Sprachen es gibt und wie aus einer Geraetesprache eine davon wird.
//
// Eigene Datei OHNE DOM und ohne i18next, damit tools/test-recht.mts sie in
// node pruefen kann — die Weiche ist genau der Teil, der still falsch wird:
// ein Spieler in Taipeh, der vereinfachtes Chinesisch bekommt, meldet das nicht,
// er loescht die App.
//
// Zwanzig Sprachen seit dem 02.10.2026 (Josef: „alle grossen Sprachen"). Die
// Rechtstexte bleiben bei DE und EN, siehe RechtsSeite.tsx.

export const SPRACH_CODES = [
  'de', 'en', 'es', 'fr', 'pt', 'it', 'nl', 'pl', 'tr', 'ru',
  'uk', 'ar', 'hi', 'id', 'vi', 'th', 'ja', 'ko', 'zh-Hans', 'zh-Hant',
] as const;

export type AppSprache = (typeof SPRACH_CODES)[number];

/** Die Sprachen in der Reihenfolge, in der die Einstellungen sie zeigen —
    jede in ihrem eigenen Namen, denn wer die App nicht lesen kann, sucht
    „日本語" und nicht „Japanisch". */
export const SPRACHEN: { code: AppSprache; name: string }[] = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ru', name: 'Русский' },
  { code: 'uk', name: 'Українська' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ไทย' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh-Hans', name: '简体中文' },
  { code: 'zh-Hant', name: '繁體中文' },
];

/** Sprachen, die von rechts nach links laufen. */
export const RTL: readonly AppSprache[] = ['ar'];

/**
 * Die erste Wunschsprache, die wir bedienen — sonst Englisch.
 *
 * Nicht einfach die ersten zwei Buchstaben: „zh" allein sagt nicht, welche
 * Schrift. Taiwan, Hongkong und Macau lesen traditionell, das Festland und
 * Singapur vereinfacht. Ein Tag mit Schriftangabe (`zh-Hant-HK`) entscheidet
 * selbst; ohne sie entscheidet die Region; ganz ohne beides gilt vereinfacht,
 * weil das die weit groessere Leserschaft ist.
 */
export function spracheFuer(wuensche: readonly string[]): AppSprache {
  for (const roh of wuensche) {
    const tag = roh.trim().replace(/_/g, '-').toLowerCase();
    if (!tag) continue;
    const [haupt] = tag.split('-');
    if (haupt === 'zh') {
      if (tag.includes('hant')) return 'zh-Hant';
      if (tag.includes('hans')) return 'zh-Hans';
      return /-(tw|hk|mo)\b/.test(tag) ? 'zh-Hant' : 'zh-Hans';
    }
    const treffer = SPRACH_CODES.find((c) => c === haupt);
    if (treffer) return treffer;
  }
  return 'en';
}

/** Richtung fuer das `dir`-Attribut. */
export function richtung(s: AppSprache): 'rtl' | 'ltr' {
  return RTL.includes(s) ? 'rtl' : 'ltr';
}
