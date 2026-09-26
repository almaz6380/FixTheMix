// Der Spielbildschirm.
//
// Die Levelfolge ist VORGEBAUT (src/levels/folge.json, erzeugt von
// tools/level-bauen.mts). Im Browser zu erzeugen hiesse, den Loeser laufen zu
// lassen — mehrere Sekunden beim ersten Bild. Auf dem Geraet sucht niemand:
// das Optimum steht im Level, nur der Tipp rechnet, und der bekommt ein
// knappes Budget.
//
// `Partie` veraendert ihren Zustand an Ort und Stelle (die Engine arbeitet so,
// weil der Loeser Millionen Zustaende durchgeht). React sieht solche
// Aenderungen nicht — deshalb steht hinter jedem gelungenen Zug ein
// `neuZeichnen()`. Die Partie liegt dabei bewusst im State und nicht in einem
// Ref: aus einem Ref waehrend des Renderns zu lesen ist genau der Weg, auf dem
// Anzeige und Wahrheit auseinanderlaufen. Aus demselben Grund steht hier
// nirgends `useCallback` — alle Handler haengen an genau diesem
// veraenderlichen Objekt, eine Merkung waere bestenfalls wirkungslos.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Brett from './components/Brett.tsx';
import Levelwahl from './components/Levelwahl.tsx';
import { Partie } from './engine/verlauf.ts';
import type { Level, Zug } from './engine/typen.ts';
import {
  haptik, ladeEinstellung, ladeFortschritt, merkeSterne,
  speichereEinstellung, speichereFortschritt,
} from './lib/fortschritt.ts';
import roheFolge from './levels/folge.json';

// Der JSON-Import kommt als weit gefasster Typ herein (`version: number`
// statt `2`). Die Datei stammt aus dem Generator und hat garantiert die
// richtige Form — dafuer steht tools/test-generator.mts.
const FOLGE = roheFolge as unknown as Level[];

const start = ladeFortschritt();
const STARTLEVEL = Math.min(Math.max(start.zuletzt, 0), FOLGE.length - 1);

export default function App() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(STARTLEVEL);
  const [partie, setPartie] = useState(() => new Partie(FOLGE[STARTLEVEL]!));
  const [fortschritt, setFortschritt] = useState(start);
  const [symbole, setSymbole] = useState(() => ladeEinstellung('symbole', false));
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const [kippt, setKippt] = useState<number | null>(null);
  const [tippZiel, setTippZiel] = useState<number | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [wahlOffen, setWahlOffen] = useState(false);
  const [takt, setTakt] = useState(0);
  const neuZeichnen = () => setTakt((x) => x + 1);

  const level = FOLGE[index]!;
  const stand = partie.zustand;
  const geloest = partie.isSolved();
  const zuege = partie.zugzahl;
  const sterne = sterneFuer(level, zuege, geloest);

  const wechsle = (i: number) => {
    setIndex(i);
    setPartie(new Partie(FOLGE[i]!));
    setGewaehlt(null);
    setTippZiel(null);
    setWahlOffen(false);
  };

  const antippen = (b: number) => {
    if (geloest) return;
    setTippZiel(null);
    if (gewaehlt === null) {
      if (stand.fuell[b]! > 0) setGewaehlt(b);
      return;
    }
    if (gewaehlt === b) { setGewaehlt(null); return; }
    const quelle = gewaehlt;
    if (partie.pour(quelle, b).ok) {
      haptik(8);
      setKippt(quelle);
      window.setTimeout(() => setKippt(null), 200);
      setGewaehlt(null);
      neuZeichnen();
      if (partie.isSolved()) {
        haptik(40);
        setFortschritt((f) => {
          const neu = merkeSterne(
            { ...f, zuletzt: Math.min(index + 1, FOLGE.length - 1) },
            index,
            partie.sterne(),
          );
          speichereFortschritt(neu);
          return neu;
        });
      }
    } else {
      // Fehlgriff: statt stumm abzuwaehlen die neue Quelle uebernehmen, wenn
      // dort ueberhaupt etwas drin ist. Das fuehlt sich fluessiger an.
      setGewaehlt(stand.fuell[b]! > 0 ? b : null);
    }
  };

  const tipp = () => {
    setRechnet(true);
    // Erst zeichnen lassen, dann rechnen — sonst haengt der Knopf, ohne dass
    // man sieht, dass ueberhaupt etwas passiert.
    window.setTimeout(() => {
      const zug: Zug | null = partie.tipp();
      setRechnet(false);
      if (!zug) return;
      setGewaehlt(zug.von);
      setTippZiel(zug.nach);
      window.setTimeout(() => setTippZiel(null), 3000);
    }, 30);
  };

  const zugFarbe = zuege <= level.sterne.drei
    ? 'text-zitrus'
    : zuege <= level.sterne.zwei ? 'text-creme' : 'text-rauch';

  return (
    <main className="flex min-h-dvh flex-col" data-takt={takt}>
      <header className="flex flex-shrink-0 items-center justify-between gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.9rem)] pb-2">
        <button
          type="button"
          onClick={() => setWahlOffen(true)}
          className="flex min-h-[44px] touch-manipulation items-center gap-2 rounded-full border-[1.5px] border-kante bg-theke/85 px-4 text-sm font-bold text-creme"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="text-rauch" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          {t('spiel.level', { n: index + 1 })}
        </button>

        <div className="flex flex-col items-center">
          <div data-zuege={zuege} className={`font-anzeige text-3xl leading-none font-semibold tabular-nums ${zugFarbe}`}>{zuege}</div>
          <div className="text-[10.5px] font-bold tracking-[0.1em] text-rauch uppercase">
            {t('spiel.vonZuegen', { n: level.optimalZuege })}
          </div>
        </div>

        <div className="flex min-h-[44px] items-center gap-0.5" aria-label={t('spiel.sterne', { n: sterne })}>
          {[0, 1, 2].map((i) => (
            <svg key={i} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
              fill={i < sterne ? 'var(--color-zitrus)' : 'none'}
              stroke={i < sterne ? 'none' : '#2F4A6B'} strokeWidth="2.2" strokeLinejoin="round">
              <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
            </svg>
          ))}
        </div>
      </header>

      <div className="flex flex-grow items-center justify-center px-4 py-2">
        <Brett
          stand={stand}
          gewaehlt={gewaehlt}
          kippt={kippt}
          tippZiel={tippZiel}
          symbole={symbole}
          onTap={antippen}
          textGlas={(i) => t('spiel.glas', { n: i + 1 })}
        />
      </div>

      <footer className="flex flex-shrink-0 items-center gap-2.5 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <button type="button" aria-label={t('spiel.undo')} disabled={!partie.kannUndo() || geloest}
          onClick={() => { if (partie.undo()) { setGewaehlt(null); neuZeichnen(); } }}
          className="knopf w-[54px] flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h11a5.5 5.5 0 010 11H8" /><path d="M7 4L3 8l4 4" /></svg>
        </button>

        <button type="button" aria-label={t('spiel.neustart')} disabled={zuege === 0}
          onClick={() => { partie.neustart(); setGewaehlt(null); setTippZiel(null); neuZeichnen(); }}
          className="knopf w-[54px] flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 11-2.6-5.9" /><path d="M20 4v5h-5" /></svg>
        </button>

        <button type="button" onClick={tipp} disabled={rechnet || geloest} className="knopf knopf-haupt flex-grow">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6" /><path d="M10 21.5h4" /><path d="M12 2.5a6.5 6.5 0 00-3.7 11.8c.5.4.7.9.7 1.4v.3h6v-.3c0-.5.2-1 .7-1.4A6.5 6.5 0 0012 2.5z" /></svg>
          {rechnet ? t('spiel.rechnet') : t('spiel.tipp')}
        </button>

        <button type="button" aria-label={t('spiel.symbole')} aria-pressed={symbole}
          onClick={() => { const n = !symbole; setSymbole(n); speichereEinstellung('symbole', n); }}
          className={`knopf w-[54px] flex-shrink-0 ${symbole ? 'knopf-an' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="2.3" />
            <path d="M12 3.6a8.4 8.4 0 000 16.8z" fill="currentColor" />
          </svg>
        </button>
      </footer>

      {geloest && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-nacht-tief/85 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl border border-kante bg-theke p-7 text-center">
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <svg key={i} width={i === 1 ? 54 : 40} height={i === 1 ? 54 : 40} viewBox="0 0 24 24" aria-hidden="true"
                  fill={i < sterne ? 'var(--color-zitrus)' : 'none'}
                  stroke={i < sterne ? 'none' : '#2F4A6B'} strokeWidth="2.2" strokeLinejoin="round"
                  style={i < sterne ? { filter: 'drop-shadow(0 0 14px rgba(255,201,60,0.55))' } : undefined}>
                  <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
                </svg>
              ))}
            </div>
            <h2 className="font-anzeige mt-4 text-3xl leading-tight font-bold">
              {sterne === 3 ? t('spiel.perfekt') : t('spiel.gewonnen')}
            </h2>
            <p className="mt-2 text-sm text-rauch">{t('spiel.bilanz', { zuege, optimum: level.optimalZuege })}</p>
            {sterne < 3 && (
              <p className="mt-1 text-xs text-rauch">{t('spiel.dreiSterne', { n: level.optimalZuege })}</p>
            )}
            <div className="mt-6 flex flex-col gap-2.5">
              <button type="button" disabled={index >= FOLGE.length - 1}
                onClick={() => wechsle(Math.min(index + 1, FOLGE.length - 1))}
                className="knopf knopf-an">
                {index >= FOLGE.length - 1 ? t('spiel.ende') : t('spiel.weiter')}
              </button>
              <div className="flex gap-2.5">
                <button type="button" className="knopf flex-grow"
                  onClick={() => { partie.neustart(); setGewaehlt(null); neuZeichnen(); }}>
                  {t('spiel.nochmal')}
                </button>
                <button type="button" className="knopf flex-grow" onClick={() => setWahlOffen(true)}>
                  {t('spiel.levelwahl')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {wahlOffen && (
        <Levelwahl
          level={FOLGE}
          aktuell={index}
          sterne={fortschritt.sterne}
          onWahl={wechsle}
          onZu={() => setWahlOffen(false)}
          titel={t('spiel.levelwahl')}
          schliessen={t('spiel.schliessen')}
          bilanz={t('spiel.sterneGesamt', {
            n: Object.values(fortschritt.sterne).reduce((a, b) => a + b, 0),
            gesamt: FOLGE.length * 3,
          })}
        />
      )}
    </main>
  );
}

/**
 * Sterne. Vor dem Sieg als Vorschau — man soll live sehen, was ein Zug
 * zu viel kostet, nicht erst im Ergebnisfenster.
 */
function sterneFuer(level: Level, zuege: number, geloest: boolean): number {
  if (geloest && zuege > level.sterne.zwei) return 1;
  if (zuege <= level.sterne.drei) return 3;
  if (zuege <= level.sterne.zwei) return 2;
  return 1;
}
