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
import { ANZAHL_LEVEL } from '../engine/kurve.ts';
import { tagesNummer } from '../engine/tagesraetsel.ts';
import { ladeFortschritt } from '../lib/fortschritt.ts';
import { ladeMuenzen } from '../lib/muenzen.ts';
import { heute, ladeTaeglich, serieLaeuft } from '../lib/serie.ts';
import { ladeBilanz } from '../lib/duell.ts';

/** Wie in App.tsx: der Tag wird EINMAL beim Laden festgehalten. */
const HEUTE = heute();

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

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+1.75rem)]">
      {/* Der Tresen als Fuss des Bildschirms — dasselbe Holz wie im Spiel,
          damit der Start nicht wie eine andere App aussieht. */}
      <div className="theke-fest" aria-hidden="true" />

      <div className="relative flex flex-grow flex-col">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-anzeige text-[2.6rem] leading-[1.05] font-bold tracking-[-0.02em] text-creme">
              {t('app.name')}
            </h1>
            <p className="mt-1.5 text-[13px] font-bold text-rauch">{t('spiel.startZeile')}</p>
          </div>
          <Link
            to="/einstellungen"
            aria-label={t('spiel.einstellungen')}
            className="flex h-[46px] w-[46px] flex-shrink-0 touch-manipulation items-center justify-center rounded-2xl border-[1.5px] border-kante bg-theke/85 text-creme"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3.1" />
              <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-2.9-1.2l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004 15H3.9a2 2 0 110-4H4a1.7 1.7 0 001.51-2.9l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 0011 4.6V4a2 2 0 114 0v.1a1.7 1.7 0 002.9 1.2l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0020 11h.1a2 2 0 110 4H20a1.7 1.7 0 00-.6.9z" />
            </svg>
          </Link>
        </header>

        {/* Ein paar Glaeser als Bild, nicht als Spiel. Reine Zierde, deshalb
            `aria-hidden` — vorgelesen waere es Unsinn. */}
        <div className="relative mt-7 flex flex-grow items-end justify-center gap-3.5 pb-1.5" aria-hidden="true">
          {/* Auch hier stehen die Glaeser auf etwas. Ein schwebendes Glas war
              genau der Fehler, der auf dem Spielbildschirm behoben wurde —
              ihn auf dem Startbildschirm zu wiederholen hiesse, die Bar an
              der Haustuer wieder abzuschaffen. */}
          <div className="brett-leiste" style={{ left: '-14px', right: '-14px', bottom: '-4px' }} />
          <div className="start-glas" style={{ height: '108px' }}>
            <span style={{ height: '58%', background: 'linear-gradient(180deg,#86CBFA 0%,#3FA9F5 54%)' }} />
          </div>
          <div className="start-glas" style={{ height: '140px' }}>
            <span style={{ height: '34%', background: 'linear-gradient(180deg,#FFDC7A 0%,#FFC93C 54%)' }} />
            <span style={{ height: '30%', background: 'linear-gradient(180deg,#FF7A93 0%,#FF4D6D 54%)' }} />
          </div>
          <div className="start-glas" style={{ height: '168px' }}>
            <span style={{ height: '26%', background: 'linear-gradient(180deg,#8FE3A2 0%,#4ED16A 54%)' }} />
            <span style={{ height: '22%', background: 'linear-gradient(180deg,#C6A2F2 0%,#A26BE8 54%)' }} />
            <span style={{ height: '24%', background: 'linear-gradient(180deg,#8AEBD9 0%,#45DDC4 54%)' }} />
          </div>
          <div className="start-glas" style={{ height: '132px' }}>
            <span style={{ height: '46%', background: 'linear-gradient(180deg,#FFB47E 0%,#FF8A3D 54%)' }} />
          </div>
          <div className="start-glas" style={{ height: '96px' }}>
            <span style={{ height: '30%', background: 'linear-gradient(180deg,#FBF3E6 0%,#F2E4CE 54%)' }} />
          </div>
        </div>

        <div className="relative mt-9 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/spiel')}
            data-weiter={weiterLevel + 1}
            className="knopf knopf-haupt min-h-[60px] text-[18px]"
          >
            {angefangen
              ? `${t('spiel.weiterspielen')} · ${t('spiel.level', { n: weiterLevel + 1 })}`
              : t('spiel.spielen')}
          </button>

          <div className="flex gap-2.5">
            <Link to="/level" className="knopf knopf-bar flex-grow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" />
              </svg>
              {t('spiel.levelwahl')}
            </Link>
            <div
              className="flex min-h-[54px] flex-shrink-0 items-center gap-2 rounded-[18px] border-[1.5px] border-zitrus/28 bg-zitrus/10 px-4 text-sm font-bold text-zitrus tabular-nums"
              data-muenzen={muenzen}
              aria-label={t('spiel.muenzen', { n: muenzen })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="var(--color-zitrus)" />
                <circle cx="12" cy="12" r="5.6" fill="none" stroke="rgba(120,78,10,0.5)" strokeWidth="1.6" />
              </svg>
              {muenzen}
            </div>
          </div>

          {/* Tagesraetsel und Duell stehen NEBEN der Folge, nicht darin: beides
              ist kein Level, sondern eine eigene Verabredung. Bis zum Umbau
              lagen sie in der Levelwahl und damit hinter dem Spiel. */}
          <Link
            to="/tagesraetsel"
            className="flex min-h-[74px] touch-manipulation items-center gap-3.5 rounded-2xl border-[1.5px] border-zitrus/45 bg-theke-hell/70 px-4 py-3 text-left"
          >
            <svg width="30" height="30" viewBox="0 0 32 32" className="flex-shrink-0" aria-hidden="true">
              <path d="M10.4 15.6h11.2l-1.3 9.6a1.6 1.6 0 01-1.6 1.4h-5.4a1.6 1.6 0 01-1.6-1.4z" fill="var(--color-zitrus)" opacity="0.4" />
              <g fill="none" stroke="var(--color-zitrus)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.4 9h13.2l-1.9 16.3a1.8 1.8 0 01-1.8 1.6h-5.8a1.8 1.8 0 01-1.8-1.6z" />
                <path d="M10.4 15.6h11.2" />
                <path d="M19.2 9L23 3.6" />
              </g>
              <circle cx="23.6" cy="3.2" r="1.8" fill="#FF4D6D" />
            </svg>
            <span className="min-w-0 flex-grow">
              <span className="font-anzeige block text-base leading-tight font-bold text-zitrus">
                {t('spiel.tagesraetsel')}
              </span>
              <span className="block truncate text-[11.5px] leading-tight font-bold text-creme">
                {tagFertig
                  ? t('spiel.tagFertig', { zuege: tagFertig.zuege })
                  : t('spiel.tagHeute', { n: tagesNummer(HEUTE) })}
              </span>
              {serie > 0 && (
                <span className="block truncate text-[10.5px] leading-tight font-bold text-rauch">
                  {t('spiel.serie', { n: serie })}
                </span>
              )}
            </span>
            <span className="flex flex-shrink-0 gap-[1.5px]" aria-hidden="true">
              {[0, 1, 2].map((k) => (
                <svg key={k} width="12" height="12" viewBox="0 0 24 24"
                  fill={k < (tagFertig?.sterne ?? 0) ? 'var(--color-zitrus)' : 'none'}
                  stroke={k < (tagFertig?.sterne ?? 0) ? 'none' : 'rgba(246,199,107,0.4)'}
                  strokeWidth="2.4" strokeLinejoin="round">
                  <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
                </svg>
              ))}
            </span>
          </Link>

          <Link
            to="/duell"
            data-duell
            className="flex min-h-[70px] touch-manipulation items-center gap-3.5 rounded-2xl border-[1.5px] border-glasrand/40 bg-theke-hell/60 px-4 py-3 text-left"
          >
            <svg width="27" height="27" viewBox="0 0 24 24" className="flex-shrink-0 text-glasrand" fill="none"
              stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
              <path d="M4 3.5l9.5 9.5" /><path d="M20 3.5L10.5 13" />
              <path d="M3 20.5l3.5-3.5" /><path d="M21 20.5l-3.5-3.5" />
              <circle cx="12" cy="15.5" r="2.4" />
            </svg>
            <span className="min-w-0 flex-grow">
              <span className="font-anzeige block text-base leading-tight font-bold text-glasrand">
                {t('spiel.duelle')}
              </span>
              <span className="block truncate text-[11.5px] leading-tight font-bold text-rauch tabular-nums">
                {bilanz.gespielt === 0
                  ? t('spiel.duellKeine')
                  : t('spiel.duellBilanz', { s: bilanz.siege, n: bilanz.niederlagen, r: bilanz.remis })}
              </span>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(147,170,205,0.55)" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </Link>

          <p className="mt-2.5 text-center text-[11.5px] font-bold text-rauch tabular-nums">
            {t('spiel.sterneGesamt', { n: gesamtSterne, gesamt: ANZAHL_LEVEL * 3 })}
          </p>
        </div>
      </div>
    </main>
  );
}
