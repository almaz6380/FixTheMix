// Levelliste zum Springen. Fuer den Testaufbau wichtiger als fuer die
// fertige App: ohne sie muesste Josef sich bis zum ersten Shaker-Level
// durchspielen, um die Mix-Mechanik ueberhaupt zu sehen.

import type { Level } from '../engine/typen.ts';

interface Eigenschaften {
  level: readonly Level[];
  aktuell: number;
  sterne: Record<number, number>;
  onWahl: (i: number) => void;
  onZu: () => void;
  titel: string;
  schliessen: string;
}

export default function Levelwahl({
  level, aktuell, sterne, onWahl, onZu, titel, schliessen,
}: Eigenschaften) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-bar-950/95 backdrop-blur">
      <div className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
        <h2 className="text-lg font-semibold text-zitrus-300">{titel}</h2>
        <button
          type="button"
          onClick={onZu}
          className="touch-manipulation rounded-full bg-bar-800 px-4 py-2 text-sm text-bar-600"
        >
          {schliessen}
        </button>
      </div>
      <div className="grid flex-1 grid-cols-4 content-start gap-3 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:grid-cols-5">
        {level.map((l, i) => {
          const s = sterne[i] ?? 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onWahl(i)}
              className={`touch-manipulation flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${
                i === aktuell
                  ? 'border-zitrus-400 bg-bar-800 text-zitrus-300'
                  : 'border-bar-800 bg-bar-900 text-stone-200'
              }`}
            >
              <span>{i + 1}</span>
              <span className="mt-0.5 text-[10px] leading-none text-zitrus-400">
                {s > 0 ? '★'.repeat(s) : '·'}
              </span>
              {l.shaker > 0 && <span className="mt-0.5 text-[9px] leading-none">🍹</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
