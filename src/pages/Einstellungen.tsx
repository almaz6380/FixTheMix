// Einstellungen.
//
// Hier sammelt sich alles, was Phase 5 verlangt und was die Stores verlangen:
// Sprache, Farbenblind-Modus, „Werbung entfernen" samt Wiederherstellung, die
// nachtraegliche Aenderung der Werbe-Einwilligung (DSGVO-Pflicht), die Kennung
// fuer Auskunfts- und Loeschbegehren, der Weg zur Datenloeschung (Google Play
// verlangt ihn) und die vier Rechtstexte.
//
// Eine eigene Adresse und kein Fenster ueber dem Spiel: aus den Einstellungen
// heraus wird auf die Rechtstexte verlinkt, und die brauchen Adressen.

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SPRACHEN, appSprache, setzeSprache, type AppSprache } from '../i18n/index.ts';
import { ladeEinstellung, loescheAlles, speichereEinstellung } from '../lib/fortschritt.ts';
import { klangWahl, setzeTon, tonGeladen } from '../lib/klang.ts';
import {
  BELOHNUNG_VIDEO, ladeMuenzen, ladeVideoStand, speichereMuenzen, speichereVideoStand,
  videoKontingent, zaehleVideo,
} from '../lib/muenzen.ts';
import { heute } from '../lib/serie.ts';
import {
  kaufMoeglich, kaufeWerbefrei, kennung, preisHolen, stelleKaufWiederHer, werbefreiPruefen,
} from '../lib/kauf.ts';
import {
  aendereEinwilligung, belohnungMoeglich, einwilligungAenderbar, zeigeBelohnungsVideo,
} from '../lib/werbung.ts';
import {
  RECHTS_PFADE, rechtsTexte, type RechtsSchluessel,
} from './legal/legalContent.ts';

type Meldung = { art: 'gut' | 'schlecht'; text: string } | null;

export default function Einstellungen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sprache = appSprache();
  const rechtsSprache = sprache === 'de' ? 'de' : 'en';

  const [symbole, setSymbole] = useState(() => ladeEinstellung('symbole', false));
  const [ton, setTon] = useState(() => tonGeladen());
  const [muenzen, setMuenzen] = useState(() => ladeMuenzen());
  const [preis, setPreis] = useState<string | null>(null);
  const [werbefrei, setWerbefrei] = useState(false);
  const [einwilligung, setEinwilligung] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<Meldung>(null);
  const [loeschFrage, setLoeschFrage] = useState(false);
  // Der Tagesdeckel fuer „Video fuer Muenzen" (seit 1.1.0, drei je Ortstag).
  const [videoStand, setVideoStand] = useState(() => ladeVideoStand());
  const [videoMoeglich, setVideoMoeglich] = useState(() => belohnungMoeglich());
  const videosRest = videoKontingent(videoStand, heute());

  // Preis und Einwilligungsknopf kommen aus dem Store bzw. von UMP und brauchen
  // beide einen nativen Aufruf. Im Browser liefern sie nichts — dann bleiben
  // die Zeilen weg, statt eine Schaltflaeche zu zeigen, die nichts tut.
  useEffect(() => {
    let lebt = true;
    void (async () => {
      // Der Kaufstatus gehoert hierher: ohne ihn stand nach einem Kauf und dem
      // naechsten Oeffnen der Einstellungen wieder der Kaufknopf da.
      const [p, e, frei] = await Promise.all([
        preisHolen(), einwilligungAenderbar(), werbefreiPruefen(),
      ]);
      if (!lebt) return;
      setPreis(p);
      setEinwilligung(e);
      setWerbefrei(frei);
      setVideoMoeglich(belohnungMoeglich());
    })();
    return () => { lebt = false; };
  }, []);

  const kaufFehler = (grund: string): string => {
    const schluessel: Record<string, string> = {
      nicht_eingerichtet: 'spiel.kaufNichtEingerichtet',
      nur_app: 'spiel.kaufNurApp',
      abgebrochen: 'spiel.kaufAbgebrochen',
      kein_angebot: 'spiel.kaufKeinAngebot',
      fehler: 'spiel.kaufFehler',
    };
    return t(schluessel[grund] ?? 'spiel.kaufFehler');
  };

  const kaufen = async (wiederher: boolean) => {
    setLaeuft(true);
    setMeldung(null);
    const e = wiederher ? await stelleKaufWiederHer() : await kaufeWerbefrei();
    setLaeuft(false);
    if (e.ok) {
      setWerbefrei(e.werbefrei);
      if (e.werbefrei) setMeldung({ art: 'gut', text: t('spiel.werbefrei') });
    } else {
      setMeldung({ art: 'schlecht', text: kaufFehler(e.grund) });
    }
  };

  const videoFuerMuenzen = async () => {
    if (videosRest <= 0) return;
    setLaeuft(true);
    setMeldung(null);
    const ergebnis = await zeigeBelohnungsVideo();
    setLaeuft(false);
    if (ergebnis !== 'earned') {
      setMeldung({
        art: 'schlecht',
        text: t(ergebnis === 'aborted' ? 'spiel.videoNichts' : 'spiel.videoKeins'),
      });
      return;
    }
    // Erst verbuchen, dann gutschreiben: der Deckel zaehlt nur gesehene Videos.
    const stand = zaehleVideo(ladeVideoStand(), heute());
    speichereVideoStand(stand);
    setVideoStand(stand);
    // Frisch gelesen statt aus dem State: waehrend des Videos koennte ein
    // anderer Bildschirm Muenzen veraendert haben.
    const neu = ladeMuenzen() + BELOHNUNG_VIDEO;
    setMuenzen(neu);
    speichereMuenzen(neu);
    setMeldung({ art: 'gut', text: t('spiel.gewinn', { n: BELOHNUNG_VIDEO }) });
  };

  // Eine Ueberschrift ueber jeder Karte — gleiche Bauart ueberall.
  const titel = (text: string) => (
    <h2 className="font-anzeige mt-7 mb-2 px-1 text-[13px] font-bold tracking-[0.08em] text-messing-hell/80 uppercase">
      {text}
    </h2>
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-[calc(env(safe-area-inset-top)+1.2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('spiel.zurueck')}
          className="start-chip flex h-[42px] w-[42px] flex-shrink-0 touch-manipulation items-center justify-center rounded-2xl text-creme"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="pfeil" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h1 className="font-anzeige text-2xl leading-tight font-bold text-creme">{t('spiel.einstellungen')}</h1>
      </div>

      {meldung && (
        <p className={`mt-4 rounded-2xl border px-4 py-2.5 text-sm font-bold ${
          meldung.art === 'gut'
            ? 'border-zitrus/50 bg-theke text-zitrus'
            : 'border-kante bg-theke text-rauch'
        }`}>
          {meldung.text}
        </p>
      )}

      {/* Sprache. Eine Auswahlliste statt Knoepfen: bei zwanzig Sprachen
          waeren es sechs Zeilen Chips gewesen. Jede Sprache steht in ihrem
          eigenen Namen — wer die App nicht lesen kann, sucht „日本語". `lang`
          je Eintrag, damit das Geraet die Zeichen richtig setzt. */}
      {titel(t('spiel.sprache'))}
      <select
        value={sprache}
        onChange={(e) => setzeSprache(e.target.value as AppSprache)}
        aria-label={t('spiel.sprache')}
        className="knopf sprachwahl einst-karte w-full px-4"
      >
        {SPRACHEN.map((s) => (
          <option key={s.code} value={s.code} lang={s.code}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Spiel. Eigener Schluessel und NICHT `spiel.tagesraetsel`. Die beiden
          Schalter waren bis zum 03.11.2026 Knoepfe mit der Aufschrift
          „… ein- oder ausschalten" — man sah nicht, was gerade an ist. Jetzt
          ein Schalter mit Zustand, wie auf jedem Telefon. */}
      {titel(t('spiel.bereichSpiel'))}
      <div className="einst-karte flex flex-col">
        <Schalter
          an={symbole}
          text={t('spiel.symboleKurz')}
          onWechsel={() => { const n = !symbole; setSymbole(n); speichereEinstellung('symbole', n); }}
        />
        {/* Der Ton-Schalter gibt beim EINSCHALTEN gleich eine Probe — sonst
            tippt man ihn an und weiss nicht, ob etwas passiert ist. */}
        <Schalter
          an={ton}
          text={t('spiel.tonKurz')}
          daten={{ 'data-ton': ton ? '1' : '0' }}
          onWechsel={() => {
            const neu = !ton;
            setTon(neu);
            setzeTon(neu);
            speichereEinstellung('ton', neu);
            if (neu) klangWahl();
          }}
        />
        <div className="einst-zeile">
          <span className="flex items-center gap-2 text-[15px] font-bold text-zitrus tabular-nums" data-muenzstand={muenzen}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9.5" fill="var(--color-zitrus)" />
              <circle cx="12" cy="12" r="6" fill="none" stroke="rgba(120,78,10,0.5)" strokeWidth="1.6" />
            </svg>
            {t('spiel.muenzen', { n: muenzen })}
          </span>
        </div>
        {videoMoeglich && (
          <div className="einst-zeile flex-col items-stretch gap-1.5">
            <button type="button" onClick={videoFuerMuenzen} disabled={laeuft || videosRest <= 0}
              className="knopf knopf-bar min-h-[46px] px-4 text-[15px]" data-videos-rest={videosRest}>
              {t('spiel.muenzenVideo', { n: BELOHNUNG_VIDEO })}
            </button>
            <p className="px-1 text-xs text-rauch">
              {videosRest > 0 ? t('spiel.videosHeute', { n: videosRest }) : t('spiel.videosAlle')}
            </p>
          </div>
        )}
      </div>

      {/* Werbung und Kauf. Im Browser gibt es beides nicht — dann bleibt der
          ganze Abschnitt weg, statt Knoepfe zu zeigen, die nichts tun. */}
      {(kaufMoeglich() || einwilligung) && (
        <>
          {titel(t('spiel.werbungEntfernen'))}
          <div className="einst-karte flex flex-col gap-2.5 p-3">
            {werbefrei ? (
              <p className="px-1 text-sm font-bold text-zitrus">{t('spiel.werbefrei')}</p>
            ) : kaufMoeglich() && (
              <>
                <button type="button" onClick={() => void kaufen(false)} disabled={laeuft}
                  className="knopf knopf-haupt px-4">
                  {t('spiel.werbungEntfernen')}{preis ? ` · ${preis}` : ''}
                </button>
                <button type="button" onClick={() => void kaufen(true)} disabled={laeuft}
                  className="knopf knopf-bar px-4">
                  {t('spiel.kaufWieder')}
                </button>
              </>
            )}
            {einwilligung && (
              <button type="button" onClick={() => void aendereEinwilligung()} className="knopf knopf-bar px-4">
                {t('spiel.einwilligung')}
              </button>
            )}
          </div>
        </>
      )}

      {/* Recht und Daten: eine Liste mit Pfeilen statt vier grosser Knoepfe. */}
      {titel(t('spiel.datenschutz'))}
      <nav className="einst-karte flex flex-col">
        {(Object.keys(RECHTS_PFADE) as RechtsSchluessel[]).map((k) => (
          <Link key={k} to={RECHTS_PFADE[k]} className="einst-zeile einst-link">
            <span>{rechtsTexte[k][rechtsSprache].titel}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="pfeil text-rauch" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </Link>
        ))}
      </nav>

      {/* Die Kennung. Ohne sie koennen wir ein Auskunfts- oder Loeschbegehren
          nicht zuordnen — wir kennen keine Namen und keine E-Mail-Adressen.
          Deshalb steht sie hier und wird in der Datenschutzerklaerung genannt. */}
      <p className="mt-4 px-1 text-[11px] leading-relaxed font-bold break-all text-rauch/80" data-kennung>
        {kennung()}
      </p>

      {/* Der Knopf heisst ANDERS als der Link darueber: der Link fuehrt auf die
          Seite „Daten loeschen", die Google Play verlangt, dieser Knopf loescht
          wirklich. Die Bestaetigung darf schlicht „Daten loeschen" heissen,
          dort ist der Zusammenhang eindeutig. */}
      {loeschFrage ? (
        <div className="einst-karte mt-3 flex flex-col gap-2.5 p-4">
          <p className="text-sm text-rauch">{rechtsTexte.loeschen[rechtsSprache].abschnitte[4]!.text}</p>
          <div className="flex gap-2.5">
            <button
              type="button"
              className="knopf einst-gefahr flex-grow"
              onClick={() => { loescheAlles(); window.location.href = '/'; }}
            >
              {t('spiel.loeschen')}
            </button>
            <button type="button" className="knopf knopf-bar flex-grow" onClick={() => setLoeschFrage(false)}>
              {t('spiel.zurueck')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setLoeschFrage(true)} className="knopf einst-gefahr-leise mt-3 px-4">
          {t('spiel.loeschenStarten')}
        </button>
      )}
    </main>
  );
}

/**
 * Ein Schalter mit sichtbarem Zustand. `role="switch"` und `aria-checked`,
 * damit ein Vorleseprogramm „an" bzw. „aus" sagt; die ganze Zeile ist die
 * Trefferflaeche, nicht nur der kleine Knubbel.
 */
function Schalter({ an, text, onWechsel, daten }: {
  an: boolean;
  text: string;
  onWechsel: () => void;
  daten?: Record<string, string>;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={an}
      onClick={onWechsel}
      className="einst-zeile einst-link text-start"
      {...daten}
    >
      <span>{text}</span>
      <span className={`schalter ${an ? 'schalter-an' : ''}`} aria-hidden="true"><span /></span>
    </button>
  );
}
