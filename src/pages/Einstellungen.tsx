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
import { SPRACHEN, appSprache, setzeSprache } from '../i18n/index.ts';
import { ladeEinstellung, loescheAlles, speichereEinstellung } from '../lib/fortschritt.ts';
import { BELOHNUNG_VIDEO, ladeMuenzen, speichereMuenzen } from '../lib/muenzen.ts';
import {
  kaufMoeglich, kaufeWerbefrei, kennung, preisHolen, stelleKaufWiederHer,
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
  const [muenzen, setMuenzen] = useState(() => ladeMuenzen());
  const [preis, setPreis] = useState<string | null>(null);
  const [werbefrei, setWerbefrei] = useState(false);
  const [einwilligung, setEinwilligung] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<Meldung>(null);
  const [loeschFrage, setLoeschFrage] = useState(false);

  // Preis und Einwilligungsknopf kommen aus dem Store bzw. von UMP und brauchen
  // beide einen nativen Aufruf. Im Browser liefern sie nichts — dann bleiben
  // die Zeilen weg, statt eine Schaltflaeche zu zeigen, die nichts tut.
  useEffect(() => {
    let lebt = true;
    void (async () => {
      const [p, e] = await Promise.all([preisHolen(), einwilligungAenderbar()]);
      if (!lebt) return;
      setPreis(p);
      setEinwilligung(e);
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
    setLaeuft(true);
    setMeldung(null);
    const gesehen = await zeigeBelohnungsVideo();
    setLaeuft(false);
    if (!gesehen) {
      setMeldung({ art: 'schlecht', text: t('spiel.videoNichts') });
      return;
    }
    const neu = muenzen + BELOHNUNG_VIDEO;
    setMuenzen(neu);
    speichereMuenzen(neu);
    setMeldung({ art: 'gut', text: t('spiel.gewinn', { n: BELOHNUNG_VIDEO }) });
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-[calc(env(safe-area-inset-top)+1.2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('spiel.zurueck')}
          className="flex h-[42px] w-[42px] flex-shrink-0 touch-manipulation items-center justify-center rounded-2xl border-[1.5px] border-kante bg-theke/90 text-creme"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
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

      {/* Sprache */}
      <h2 className="font-anzeige mt-7 text-sm font-bold tracking-[0.08em] text-rauch uppercase">
        {t('spiel.sprache')}
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {SPRACHEN.map((s) => (
          <button
            key={s.code}
            type="button"
            onClick={() => setzeSprache(s.code)}
            aria-pressed={sprache === s.code}
            className={`knopf px-4 ${sprache === s.code ? 'knopf-an' : ''}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Spiel */}
      <h2 className="font-anzeige mt-7 text-sm font-bold tracking-[0.08em] text-rauch uppercase">
        {t('spiel.tagesraetsel')}
      </h2>
      <div className="mt-2 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => { const n = !symbole; setSymbole(n); speichereEinstellung('symbole', n); }}
          aria-pressed={symbole}
          className={`knopf justify-start px-4 ${symbole ? 'knopf-an' : ''}`}
        >
          {t('spiel.symbole')}
        </button>
        <p className="px-1 text-sm font-bold text-zitrus" data-muenzstand={muenzen}>
          {t('spiel.muenzen', { n: muenzen })}
        </p>
        {belohnungMoeglich() && (
          <button type="button" onClick={videoFuerMuenzen} disabled={laeuft} className="knopf justify-start px-4">
            {t('spiel.muenzenVideo', { n: BELOHNUNG_VIDEO })}
          </button>
        )}
      </div>

      {/* Werbung und Kauf. Im Browser gibt es beides nicht — dann bleibt der
          ganze Abschnitt weg, statt Knoepfe zu zeigen, die nichts tun. */}
      {(kaufMoeglich() || einwilligung) && (
        <>
          <h2 className="font-anzeige mt-7 text-sm font-bold tracking-[0.08em] text-rauch uppercase">
            {t('spiel.werbungEntfernen')}
          </h2>
          <div className="mt-2 flex flex-col gap-2.5">
            {werbefrei ? (
              <p className="px-1 text-sm font-bold text-zitrus">{t('spiel.werbefrei')}</p>
            ) : kaufMoeglich() && (
              <>
                <button type="button" onClick={() => void kaufen(false)} disabled={laeuft}
                  className="knopf knopf-an justify-start px-4">
                  {t('spiel.werbungEntfernen')}{preis ? ` · ${preis}` : ''}
                </button>
                <button type="button" onClick={() => void kaufen(true)} disabled={laeuft}
                  className="knopf justify-start px-4">
                  {t('spiel.kaufWieder')}
                </button>
              </>
            )}
            {einwilligung && (
              <button type="button" onClick={() => void aendereEinwilligung()} className="knopf justify-start px-4">
                {t('spiel.einwilligung')}
              </button>
            )}
          </div>
        </>
      )}

      {/* Recht und Daten */}
      <h2 className="font-anzeige mt-7 text-sm font-bold tracking-[0.08em] text-rauch uppercase">
        {t('spiel.datenschutz')}
      </h2>
      <nav className="mt-2 flex flex-col gap-2.5">
        {(Object.keys(RECHTS_PFADE) as RechtsSchluessel[]).map((k) => (
          <Link key={k} to={RECHTS_PFADE[k]} className="knopf justify-start px-4">
            {rechtsTexte[k][rechtsSprache].titel}
          </Link>
        ))}
      </nav>

      {/* Die Kennung. Ohne sie koennen wir einen Eintrag in der Bestenliste
          nicht zuordnen — wir kennen keine Namen und keine E-Mail-Adressen.
          Deshalb steht sie hier und wird in der Datenschutzerklaerung genannt. */}
      <p className="mt-6 px-1 text-[11px] leading-relaxed font-bold break-all text-rauch" data-kennung>
        {kennung()}
      </p>

      {loeschFrage ? (
        <div className="mt-3 flex flex-col gap-2.5 rounded-2xl border border-kante bg-theke p-4">
          <p className="text-sm text-rauch">{rechtsTexte.loeschen[rechtsSprache].abschnitte[4]!.text}</p>
          <div className="flex gap-2.5">
            <button
              type="button"
              className="knopf knopf-an flex-grow"
              onClick={() => { loescheAlles(); window.location.href = '/'; }}
            >
              {t('spiel.loeschen')}
            </button>
            <button type="button" className="knopf flex-grow" onClick={() => setLoeschFrage(false)}>
              {t('spiel.zurueck')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setLoeschFrage(true)} className="knopf mt-3 justify-start px-4">
          {t('spiel.loeschen')}
        </button>
      )}
    </main>
  );
}
