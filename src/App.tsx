// Der Spielbildschirm. Phase 2 — genug, um FixTheMix am Handy zu spielen:
// Giessen, Schuetteln, Undo, Neustart, Tipp, Farbenblind-Modus, Sterne.
//
// Die Levelfolge ist VORGEBAUT (src/levels/folge.json, erzeugt von
// tools/level-bauen.mts). Im Browser zu erzeugen hiesse, den Loeser laufen zu
// lassen — bis zu fuenf Sekunden beim ersten Bild. Auf dem Geraet sucht
// niemand: das Optimum steht im Level, nur der Tipp rechnet, und der bekommt
// ein knappes Budget.
//
// `Partie` veraendert ihren Zustand an Ort und Stelle (die Engine arbeitet so,
// weil der Loeser Millionen Zustaende durchgeht). React sieht solche
// Aenderungen nicht — deshalb steht hinter jedem gelungenen Zug ein
// `neuZeichnen()`. Die Partie liegt dabei bewusst im State und nicht in einem
// Ref: aus einem Ref waehrend des Renderns zu lesen ist genau der Weg, auf dem
// Anzeige und Wahrheit auseinanderlaufen.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Brett from './components/Brett.tsx';
import Levelwahl from './components/Levelwahl.tsx';
import { Partie } from './engine/verlauf.ts';
import { pruefeSchuetteln } from './engine/zuege.ts';
import type { Level, Zug } from './engine/typen.ts';
import {
  haptik, ladeEinstellung, ladeFortschritt, merkeSterne,
  speichereEinstellung, speichereFortschritt,
} from './lib/fortschritt.ts';
import roheFolge from './levels/folge.json';

// Der JSON-Import kommt als weit gefasster Typ herein (`version: number`
// statt `1`). Die Datei stammt aus dem Generator und hat garantiert die
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
  // `Partie` aendert ihren Zustand an Ort und Stelle, React sieht das nicht.
  // Kein useCallback in dieser Datei: die Handler haengen alle an genau
  // diesem veraenderlichen Objekt, eine Merkung waere bestenfalls wirkungslos
  // und schlimmstenfalls falsch (der React-Compiler sagt dasselbe).
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

  /** Nach jedem gelungenen Zug: kippen, ruetteln, und bei Sieg buchen. */
  const nachZug = (quelle: number, staerke: number) => {
    haptik(staerke);
    setKippt(quelle);
    window.setTimeout(() => setKippt(null), 200);
    setGewaehlt(null);
    setTippZiel(null);
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
      nachZug(quelle, 8);
    } else {
      // Fehlgriff: statt stumm abzuwaehlen die neue Quelle uebernehmen, wenn
      // dort ueberhaupt etwas drin ist. Das fuehlt sich fluessiger an.
      setGewaehlt(stand.fuell[b]! > 0 ? b : null);
    }
  };

  const schuetteln = (b: number) => {
    if (geloest) return;
    if (partie.shake(b).ok) nachZug(b, 25);
  };

  const tipp = () => {
    setRechnet(true);
    // Erst zeichnen lassen, dann rechnen — sonst haengt der Knopf, ohne dass
    // man sieht, dass ueberhaupt etwas passiert.
    window.setTimeout(() => {
      const zug: Zug | null = partie.tipp();
      setRechnet(false);
      if (!zug) return;
      if (zug.art === 'schuetteln') {
        setGewaehlt(null);
        setTippZiel(zug.behaelter);
      } else {
        setGewaehlt(zug.von);
        setTippZiel(zug.nach);
      }
      window.setTimeout(() => setTippZiel(null), 3000);
    }, 30);
  };

  const schuettelbar = (b: number) => pruefeSchuetteln(stand, b).ok;

  const zugFarbe = zuege <= level.sterne.drei
    ? 'text-zitrus-300'
    : zuege <= level.sterne.zwei ? 'text-stone-200' : 'text-stone-400';

  return (
    <main className="flex min-h-dvh flex-col bg-bar-950 text-stone-100" data-takt={takt}>
      <header className="flex items-center justify-between gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-2">
        <button
          type="button"
          onClick={() => setWahlOffen(true)}
          className="touch-manipulation rounded-full bg-bar-800 px-3 py-1.5 text-sm font-semibold"
        >
          {t('spiel.level', { n: index + 1, gesamt: FOLGE.length })}
        </button>
        <div className="text-center">
          <div className={`text-sm font-semibold tabular-nums ${zugFarbe}`}>
            {t('spiel.zuege', { n: zuege })}
          </div>
          <div className="text-[11px] text-bar-600">{t('spiel.optimum', { n: level.optimalZuege })}</div>
        </div>
        <div className="w-[4.5rem] text-right text-base tracking-tight text-zitrus-400">
          {'★'.repeat(sterne)}
          <span className="text-bar-700">{'☆'.repeat(3 - sterne)}</span>
        </div>
      </header>

      {level.shaker > 0 && zuege === 0 && (
        <p className="px-6 pb-1 text-center text-xs leading-snug text-bar-600">
          {t('spiel.hinweisShaker')}
        </p>
      )}

      <div className="flex flex-1 items-center justify-center px-3 py-2">
        <Brett
          stand={stand}
          gewaehlt={gewaehlt}
          kippt={kippt}
          tippZiel={tippZiel}
          schuettelbar={schuettelbar}
          symbole={symbole}
          onTap={antippen}
          onSchuetteln={schuetteln}
          textGlas={(i) => t('spiel.glas', { n: i + 1 })}
          textShaker={(i) => t('spiel.shaker', { n: i + 1 })}
          textSchuetteln={t('spiel.schuetteln')}
        />
      </div>

      <footer className="flex items-center justify-center gap-2 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
        <Knopf onClick={() => { if (partie.undo()) { setGewaehlt(null); neuZeichnen(); } }} aus={!partie.kannUndo() || geloest}>
          {t('spiel.undo')}
        </Knopf>
        <Knopf onClick={() => { partie.neustart(); setGewaehlt(null); setTippZiel(null); neuZeichnen(); }} aus={zuege === 0}>
          {t('spiel.neustart')}
        </Knopf>
        <Knopf onClick={tipp} aus={rechnet || geloest} hervor>
          {rechnet ? t('spiel.rechnet') : t('spiel.tipp')}
        </Knopf>
        <Knopf
          onClick={() => { const n = !symbole; setSymbole(n); speichereEinstellung('symbole', n); }}
          aus={false}
          an={symbole}
        >
          {t('spiel.symbole')}
        </Knopf>
      </footer>

      {geloest && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-bar-950/85 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-bar-700 bg-bar-900 p-6 text-center">
            <div className="text-3xl tracking-widest text-zitrus-400">
              {'★'.repeat(sterne)}
              <span className="text-bar-700">{'☆'.repeat(3 - sterne)}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">{t('spiel.gewonnen')}</h2>
            <p className="mt-1 text-sm text-bar-600">
              {t('spiel.bilanz', { zuege, optimum: level.optimalZuege })}
            </p>
            {sterne < 3 && (
              <p className="mt-1 text-xs text-bar-600">
                {t('spiel.dreiSterne', { n: level.optimalZuege })}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => { partie.neustart(); setGewaehlt(null); neuZeichnen(); }}
                className="touch-manipulation flex-1 rounded-xl bg-bar-800 py-3 text-sm font-semibold"
              >
                {t('spiel.nochmal')}
              </button>
              <button
                type="button"
                onClick={() => wechsle(Math.min(index + 1, FOLGE.length - 1))}
                disabled={index >= FOLGE.length - 1}
                className="touch-manipulation flex-1 rounded-xl bg-zitrus-400 py-3 text-sm font-semibold text-bar-950 disabled:opacity-40"
              >
                {index >= FOLGE.length - 1 ? t('spiel.ende') : t('spiel.weiter')}
              </button>
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
        />
      )}
    </main>
  );
}

function Knopf({
  children, onClick, aus, hervor = false, an = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  aus: boolean;
  hervor?: boolean;
  an?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={aus}
      className={`touch-manipulation flex-1 rounded-xl py-3 text-sm font-semibold transition disabled:opacity-35 ${
        an ? 'bg-zitrus-400 text-bar-950' : hervor ? 'bg-bar-700 text-zitrus-300' : 'bg-bar-800 text-stone-200'
      }`}
    >
      {children}
    </button>
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
