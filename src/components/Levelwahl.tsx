// Levelliste zum Springen.
//
// Fuer den Testaufbau wichtiger als fuer die fertige App: ohne sie muesste
// man sich durchspielen, um ein spaeteres Level ueberhaupt zu sehen.

import type { Level } from '../engine/typen.ts';

interface Eigenschaften {
  level: readonly Level[];
  aktuell: number;
  sterne: Record<number, number>;
  onWahl: (i: number) => void;
  onZu: () => void;
  titel: string;
  schliessen: string;
  bilanz: string;
}

export default function Levelwahl({
  level, aktuell, sterne, onWahl, onZu, titel, schliessen, bilanz,
}: Eigenschaften) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-nacht-tief/95 backdrop-blur">
      <div className="flex items-start justify-between gap-4 px-6 pt-[calc(env(safe-area-inset-top)+1.2rem)] pb-4">
        <div>
          <h2 className="font-anzeige text-2xl leading-tight font-bold text-creme">{titel}</h2>
          <p className="mt-1 text-xs font-bold text-rauch">{bilanz}</p>
        </div>
        <button
          type="button"
          onClick={onZu}
          aria-label={schliessen}
          className="flex h-[46px] w-[46px] flex-shrink-0 touch-manipulation items-center justify-center rounded-2xl border-[1.5px] border-kante bg-theke/90 text-creme"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="grid flex-1 grid-cols-4 content-start gap-3 overflow-y-auto px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:grid-cols-5">
        {level.map((l, i) => {
          const s = sterne[i] ?? 0;
          const jetzt = i === aktuell;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onWahl(i)}
              aria-label={`Level ${i + 1}, ${s} von 3 Sternen`}
              className={`flex aspect-square touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border transition ${
                jetzt
                  ? 'border-2 border-zitrus bg-theke-hell text-zitrus'
                  : 'border-kante bg-theke text-creme'
              }`}
            >
              <span className="font-anzeige text-xl leading-none font-semibold">{i + 1}</span>
              <span className="flex gap-[1.5px]" aria-hidden="true">
                {[0, 1, 2].map((k) => (
                  <svg key={k} width="9" height="9" viewBox="0 0 24 24"
                    fill={k < s ? 'var(--color-zitrus)' : 'none'}
                    stroke={k < s ? 'none' : '#2F4A6B'} strokeWidth="2.6" strokeLinejoin="round">
                    <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
                  </svg>
                ))}
              </span>
              <span className="text-[9px] leading-none font-bold text-rauch tabular-nums">{l.optimalZuege}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
