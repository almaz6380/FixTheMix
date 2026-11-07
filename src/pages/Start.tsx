// Der Startbildschirm — die Haustuer der App.
//
// Bis zum 27.09.2026 gab es keine. Die App oeffnete mitten in einem Level,
// und die Levelwahl war ein FENSTER UEBER dem Spiel, erreichbar nur ueber den
// Burger in der Kopfzeile. Damit hing die gesamte Navigation an einem Knopf
// innerhalb des einen Bildschirms, den es gab: Tagesraetsel, Duelle und
// Einstellungen lagen alle hinter dem Spiel statt davor.
//
// Jetzt ist die Ordnung herum: Start → (Levelwahl) → Spiel. Der Weg zurueck
// geht eine Stufe nach oben, nicht in ein Fenster.
//
// Der Bildschirm zeigt bewusst NUR, was man von hier aus tun kann. Der
// Fortschritt steht als eine Zeile da und nicht als Tabelle — wer weiterspielen
// will, soll einen Knopf sehen und nicht eine Bilanz.

import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { GlasKoerper } from '../components/Glas.tsx';
import Gaeste from '../components/Gaeste.tsx';
import Rueckwand from '../components/Rueckwand.tsx';
import { codeVon } from '../engine/farben.ts';
import { ANZAHL_LEVEL } from '../engine/kurve.ts';
import { tagesNummer } from '../engine/tagesraetsel.ts';
import { ladeFortschritt } from '../lib/fortschritt.ts';
import { ladeMuenzen } from '../lib/muenzen.ts';
import { heute, ladeTaeglich, serieLaeuft } from '../lib/serie.ts';
import { ladeBilanz } from '../lib/duell.ts';

/** Wie in App.tsx: der Tag wird EINMAL beim Laden festgehalten. */
const HEUTE = heute();

/**
 * Die fuenf Glaeser hinter dem Titel. Reine Zierde — kein Brett, kein Zustand,
 * kein Antippen. Ein halbes Spielbrett, das nichts tut, waere eine Einladung,
 * darauf zu tippen.
 *
 * Die Farben kommen ueber `codeVon` aus `farben.ts` und stehen nicht als
 * Hexwerte hier: genau daran ist die vorige Fassung gescheitert.
 */
const BLAU = codeVon('blau');
const GELB = codeVon('gelb');
const ROT = codeVon('rot');

/*
  Drei Drinks auf dem Tresen (Josef, 03.10.2026: Entwurf „oben links" aus
  Gemini). Zwei fast voll, einer fertig — der fertige bekommt im
  `GlasKoerper` von selbst seinen Strohhalm, genau wie im Spiel.
*/
const GLAESER: readonly { breite: number; fuellung: number[] }[] = [
  { breite: 76, fuellung: [ROT, ROT, ROT, ROT, ROT] },
  { breite: 76, fuellung: [GELB, GELB, GELB, GELB, GELB] },
  { breite: 76, fuellung: [BLAU, BLAU, BLAU, BLAU, BLAU, BLAU] },
];

/**
 * Das Leuchtschild. „FixThe" in Zitrus, „Mix" in Erdbeere — der Name ist in
 * allen Sprachen derselbe, aber falls eine Datei ihn je anders schreibt, steht
 * er einfarbig da statt zerschnitten.
 */
function Schriftzug({ name }: { name: string }) {
  const teile = /^(.*)(Mix)$/.exec(name);
  if (!teile) return <span className="neon-zitrus">{name}</span>;
  return (
    <>
      <span className="neon-zitrus">{teile[1]}</span>
      <span className="neon-erdbeere">{teile[2]}</span>
    </>
  );
}

/** Aufsteigende Blaeschen in einem Startglas: Position, Groesse, Takt. */
const BLASEN: readonly { x: number; r: number; dauer: number; verz: number }[] = [
  { x: 28, r: 3, dauer: 3.4, verz: 0 },
  { x: 52, r: 2, dauer: 2.7, verz: 1.1 },
  { x: 70, r: 2.5, dauer: 3.9, verz: 2.0 },
];

export default function Start() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Alles nur gelesen, nichts geschrieben: dieser Bildschirm veraendert keinen
  // Spielstand. Deshalb reicht ein Lauf beim Rendern, kein State.
  const fortschritt = ladeFortschritt();
  const taeglich = ladeTaeglich();
  const bilanz = ladeBilanz();
  const muenzen = ladeMuenzen();

  const gesamtSterne = Object.values(fortschritt.sterne).reduce((a, b) => a + b, 0);
  const angefangen = fortschritt.hoechstes > 0 || gesamtSterne > 0;
  const weiterLevel = Math.min(Math.max(fortschritt.zuletzt, 0), ANZAHL_LEVEL - 1);
  const tagFertig = taeglich.tage[HEUTE];
  const serie = serieLaeuft(taeglich, HEUTE) ? taeglich.serie : 0;
  const anteil = Math.min(1, gesamtSterne / (ANZAHL_LEVEL * 3));

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      {/* Die Bar hinter dem Titel: dieselbe Rueckwand wie im Spiel, die
          Lampen aber ganz aussen, neben dem Schriftzug. */}
      <Rueckwand lampenX={[26, 364]} />

      {/* Oben: links, was ich habe (Muenzen — eine ANZEIGE, kein Knopf; bis
          zum 03.11.2026 stand sie als Kachel im Menue und sah antippbar aus),
          rechts die Einstellungen. Wie die Kopfzeile im Spiel. */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] right-4 left-4 z-10 flex items-center justify-between">
        <div
          className="start-chip flex h-[40px] items-center gap-2 rounded-full px-3.5 text-[15px] font-bold text-zitrus tabular-nums"
          data-muenzen={muenzen}
          aria-label={t('spiel.muenzen', { n: muenzen })}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" fill="var(--color-zitrus)" />
            <circle cx="12" cy="12" r="6" fill="none" stroke="rgba(120,78,10,0.5)" strokeWidth="1.6" />
            <path d="M8.6 8.4a4.6 4.6 0 013.4-1.6" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {muenzen}
        </div>
        <Link
          to="/einstellungen"
          aria-label={t('spiel.einstellungen')}
          className="start-chip flex h-[44px] w-[44px] touch-manipulation items-center justify-center rounded-2xl text-creme"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3.1" />
            <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-2.9-1.2l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004 15H3.9a2 2 0 110-4H4a1.7 1.7 0 001.51-2.9l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 0011 4.6V4a2 2 0 114 0v.1a1.7 1.7 0 002.9 1.2l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0020 11h.1a2 2 0 110 4H20a1.7 1.7 0 00-.6.9z" />
          </svg>
        </Link>
      </div>

      {/* Das Leuchtschild: der Name als Neonschrift auf einer dunklen Tafel
          mit Messingrahmen, an zwei Ketten. Vorher war er nackter weisser
          Text — die einzige Stelle der Bar, die nach Software aussah. */}
      <header className="relative mt-[68px] flex flex-col items-center px-6 text-center">
        <div className="start-schild">
          <h1 className="start-titel font-anzeige text-[2.7rem] leading-[1.05] font-bold tracking-[-0.01em]">
            <Schriftzug name={t('app.name')} />
          </h1>
        </div>
        <p className="mt-3 text-[14px] font-bold text-creme/80">{t('spiel.startZeile')}</p>
      </header>

      {/* Die Drinks stehen auf der Platte, links und rechts sitzen zwei Gaeste.
          Reine Zierde, deshalb `aria-hidden`. Gezeichnet von `GlasKoerper`,
          demselben Teil wie im Spiel: zwei Zeichnungen desselben Dings laufen
          immer auseinander. */}
      <div className="relative z-[1] flex flex-grow items-end justify-center gap-5 px-6" aria-hidden="true">
        <Gaeste />
        {GLAESER.map((g, i) => (
          <div key={i} className="start-glas" style={{ width: `${g.breite}px` }}>
            <GlasKoerper fuellung={g.fuellung} hoehe={6} saat={i * 3 + 1} />
            <div className="start-blasen">
              {BLASEN.map((b, k) => (
                <span
                  key={k}
                  className="start-blase"
                  style={{
                    left: `${b.x}%`,
                    width: `${b.r * 2}px`,
                    height: `${b.r * 2}px`,
                    animationDuration: `${b.dauer + i * 0.3}s`,
                    animationDelay: `${b.verz + i * 0.7}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Der Tresen: Platte, Messingreling, Front aus Holz. Das Menue liegt
          AUF der Front, und das Holz reicht bis an den unteren Rand. */}
      <div className="start-tresen relative px-5 pt-[78px] pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <div className="start-reling" aria-hidden="true" />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/spiel')}
            data-weiter={weiterLevel + 1}
            className="knopf knopf-haupt min-h-[58px] w-[78%] rounded-full text-[18px]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 4.5v15a1 1 0 001.5.86l12.4-7.5a1 1 0 000-1.72L8.5 3.64A1 1 0 007 4.5z" fill="currentColor" />
            </svg>
            {angefangen
              ? `${t('spiel.weiterspielen')} · ${t('spiel.level', { n: weiterLevel + 1 })}`
              : t('spiel.spielen')}
          </button>
        </div>

        {/* Drei gleich grosse Kacheln, jede mit Bild und Namen: Levelwahl,
            Tagesraetsel, Duell. Gleich gross, weil keine wichtiger ist als die
            andere — wichtiger ist nur der Hauptknopf darueber. */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Link to="/level" className="start-kachel min-h-[92px] flex-col justify-center gap-1.5 rounded-2xl px-2 py-2 text-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="text-messing-hell" aria-hidden="true">
              <rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" />
            </svg>
            <span className="font-anzeige text-[13px] leading-tight font-bold">{t('spiel.levelwahl')}</span>
          </Link>

          {/* Das Tagesraetsel steht NEBEN der Folge, nicht darin — es ist kein
              Level, sondern eine eigene Verabredung. Ein Punkt sagt, dass das
              heutige noch offen ist; geloest zeigt es Sterne und Zugzahl. */}
          <Link to="/tagesraetsel" className="start-kachel relative min-h-[92px] flex-col justify-center gap-1 rounded-2xl px-2 py-2 text-center" data-tag-offen={tagFertig ? '0' : '1'}>
            {!tagFertig && <span className="start-punkt" aria-hidden="true" />}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="text-zitrus" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
              <path d="M3.5 10h17" /><path d="M8 3v4" /><path d="M16 3v4" />
              <path d="M12 12.6l1.1 2.2 2.4.35-1.75 1.7.42 2.4L12 18.1l-2.17 1.15.42-2.4-1.75-1.7 2.4-.35z" fill="currentColor" stroke="none" />
            </svg>
            <span className="font-anzeige text-[13px] leading-tight font-bold text-zitrus">{t('spiel.tagesraetsel')}</span>
            {tagFertig ? (
              <span className="flex gap-[2px]" aria-label={t('spiel.tagFertig', { zuege: tagFertig.zuege })}>
                {[0, 1, 2].map((k) => (
                  <svg key={k} width="12" height="12" viewBox="0 0 24 24"
                    fill={k < tagFertig.sterne ? 'var(--color-zitrus)' : 'none'}
                    stroke={k < tagFertig.sterne ? 'none' : 'rgba(246,199,107,0.5)'}
                    strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
                  </svg>
                ))}
              </span>
            ) : (
              <span className="text-[11px] leading-tight font-bold text-creme/75 tabular-nums">#{tagesNummer(HEUTE)}</span>
            )}
            {serie > 0 && (
              <span className="text-[10px] leading-tight font-bold text-rauch">{t('spiel.serie', { n: serie })}</span>
            )}
          </Link>

          <Link
            to="/duell"
            data-duell
            aria-label={bilanz.gespielt === 0
              ? `${t('spiel.duelle')} · ${t('spiel.duellKeine')}`
              : `${t('spiel.duelle')} · ${t('spiel.duellBilanz', { s: bilanz.siege, n: bilanz.niederlagen, r: bilanz.remis })}`}
            className="start-kachel min-h-[92px] flex-col justify-center gap-1.5 rounded-2xl px-2 py-2 text-center"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" className="text-messing-hell" fill="none"
              stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
              <path d="M4 3.5l9.5 9.5" /><path d="M20 3.5L10.5 13" />
              <path d="M3 20.5l3.5-3.5" /><path d="M21 20.5l-3.5-3.5" />
              <circle cx="12" cy="15.5" r="2.4" />
            </svg>
            <span className="font-anzeige text-[13px] leading-tight font-bold">{t('spiel.duelle')}</span>
            {bilanz.gespielt > 0 && (
              <span className="text-[10px] leading-tight font-bold text-rauch tabular-nums">
                {bilanz.siege}–{bilanz.remis}–{bilanz.niederlagen}
              </span>
            )}
          </Link>
        </div>

        {/* Der Fortschritt als duenner Messingbalken mit einer Zeile darunter —
            eine Zahl wie „0 von 2997" allein las sich als Vorwurf. */}
        <div className="mx-auto mt-4 w-[62%]" aria-hidden="true">
          <div className="start-balken"><div style={{ width: `${Math.max(anteil * 100, gesamtSterne > 0 ? 2 : 0)}%` }} /></div>
        </div>
        <p className="mt-1.5 text-center text-[11px] font-bold text-creme/50 tabular-nums">
          {t('spiel.sterneGesamt', { n: gesamtSterne, gesamt: ANZAHL_LEVEL * 3 })}
        </p>
      </div>
    </main>
  );
}
