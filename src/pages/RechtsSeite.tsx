// Impressum, Datenschutz, Nutzungsbedingungen, Datenloeschung.
//
// EIGENE ADRESSEN, keine Dialoge: Apple und Google verlangen eine oeffentlich
// erreichbare Datenschutz-URL, die OHNE App und OHNE Anmeldung aufrufbar ist.
// Google Play verlangt dasselbe fuer den Weg zur Datenloeschung. Genau deshalb
// haengen diese vier Seiten an Routen und nicht in einem Fenster ueber dem
// Spiel — ein Fenster hat keine Adresse, die man in ein Store-Formular eintragen
// kann.
//
// Die Texte gibt es nur auf Deutsch und Englisch. Alle anderen Sprachen sehen
// Englisch: ein Rechtstext muss gegengelesen werden, und das lohnt nicht in
// fuenf Sprachen, solange keine Nutzer aus diesen Laendern da sind.

import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { appSprache } from '../i18n/index.ts';
import {
  RECHTS_PFADE, STAND, rechtsTexte, type RechtsSchluessel,
} from './legal/legalContent.ts';

export default function RechtsSeite({ was }: { was: RechtsSchluessel }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sprache = appSprache() === 'de' ? 'de' : 'en';
  const inhalt = rechtsTexte[was][sprache];

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 pt-[calc(env(safe-area-inset-top)+1.2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('spiel.zurueck')}
          className="flex h-[42px] w-[42px] flex-shrink-0 touch-manipulation items-center justify-center rounded-2xl border-[1.5px] border-kante bg-theke/90 text-creme"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="pfeil" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h1 className="font-anzeige text-2xl leading-tight font-bold text-creme">{inhalt.titel}</h1>
      </div>

      <div className="mt-6 flex flex-col gap-6 rounded-3xl border border-kante bg-theke/70 p-5">
        {inhalt.abschnitte.map((a) => (
          <section key={a.titel}>
            <h2 className="font-anzeige text-base leading-snug font-bold text-creme">{a.titel}</h2>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-rauch">{a.text}</p>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs font-bold text-rauch">{t('spiel.standVom', { datum: STAND })}</p>

      <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-glasrand">
        {(Object.keys(RECHTS_PFADE) as RechtsSchluessel[]).map((k) => (
          <Link key={k} to={RECHTS_PFADE[k]} className="underline">
            {rechtsTexte[k][sprache].titel}
          </Link>
        ))}
      </nav>
    </main>
  );
}
