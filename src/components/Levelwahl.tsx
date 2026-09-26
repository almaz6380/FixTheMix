// Levelliste zum Springen — in Abschnitten von 20.
//
// Bei 999 Leveln ist ein einziges Raster keine Option: 999 Kacheln sind 999
// Knoten im DOM, und niemand scrollt sich durch fuenfzig Reihen, um Level 640
// zu finden. Also immer nur EIN Abschnitt („Level 621–640") plus eine Leiste,
// mit der man Abschnitte wechselt. Geoeffnet wird auf dem Abschnitt des
// aktuellen Levels.
//
// Die Sperre entscheidet nicht diese Datei, sondern `istFrei` in
// src/lib/fortschritt.ts. Hier wird sie nur gezeichnet — sonst haette die
// Regel zwei Orte und irgendwann zwei Meinungen.

import { useState } from 'react';
import { BLOCK, BLOECKE, istExperte } from '../engine/kurve.ts';
import type { Level } from '../engine/typen.ts';

interface Eigenschaften {
  level: readonly Level[];
  aktuell: number;
  sterne: Record<number, number>;
  /** Hoechster freigeschalteter Levelindex, einschliesslich. */
  hoechstes: number;
  onWahl: (i: number) => void;
  onZu: () => void;
  titel: string;
  schliessen: string;
  bilanz: string;
  /** (von, bis) -> „Level 621–640" */
  abschnittTitel: (von: number, bis: number) => string;
  /** (nr, sterne, experte) -> Vorlesetext der Kachel. */
  kachelTitel: (nr: number, sterne: number, experte: boolean) => string;
  /** (nr) -> Vorlesetext einer gesperrten Kachel. */
  gesperrtTitel: (nr: number) => string;
  zurueck: string;
  vor: string;
  /** Tagesraetsel-Karte oben. */
  tagTitel: string;
  tagZeile: string;
  tagSerie: string;
  tagSterne: number;
  onTag: () => void;
  /** Duell-Karte, direkt unter dem Tagesraetsel (Version 1.1). */
  duellTitel: string;
  duellZeile: string;
  duellBilanz: string;
  onDuell: () => void;
  einstellungen: string;
  onEinstellungen: () => void;
}

export default function Levelwahl({
  level, aktuell, sterne, hoechstes, onWahl, onZu, titel, schliessen, bilanz,
  abschnittTitel, kachelTitel, gesperrtTitel, zurueck, vor,
  tagTitel, tagZeile, tagSerie, tagSterne, onTag,
  duellTitel, duellZeile, duellBilanz, onDuell,
  einstellungen, onEinstellungen,
}: Eigenschaften) {
  const bloecke = Math.min(BLOECKE, Math.ceil(level.length / BLOCK));
  const [block, setBlock] = useState(() => Math.min(Math.floor(aktuell / BLOCK), bloecke - 1));

  const von = block * BLOCK;
  const bis = Math.min(von + BLOCK, level.length);
  const sichtbar = level.slice(von, bis);

  let bloseSterne = 0;
  for (let i = von; i < bis; i++) bloseSterne += sterne[i] ?? 0;

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-nacht-tief/95 backdrop-blur">
      <div className="flex items-start justify-between gap-4 px-6 pt-[calc(env(safe-area-inset-top)+1.2rem)] pb-3">
        <div>
          <h2 className="font-anzeige text-2xl leading-tight font-bold text-creme">{titel}</h2>
          <p className="mt-1 text-xs font-bold text-rauch">{bilanz}</p>
        </div>
        {/* Der Weg zu Einstellungen und Rechtstexten. Er liegt hier und nicht
            im Spielbildschirm: dort ist die Kopfzeile voll, und der Burger muss
            das erste Button im header bleiben (daran haengt der
            Oberflaechentest). */}
        <button
          type="button"
          onClick={onEinstellungen}
          aria-label={einstellungen}
          className="flex h-[46px] w-[46px] flex-shrink-0 touch-manipulation items-center justify-center rounded-2xl border-[1.5px] border-kante bg-theke/90 text-creme"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3.1" />
            <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-2.9-1.2l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004 15H3.9a2 2 0 110-4H4a1.7 1.7 0 001.51-2.9l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 0011 4.6V4a2 2 0 114 0v.1a1.7 1.7 0 002.9 1.2l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0020 11h.1a2 2 0 110 4H20a1.7 1.7 0 00-.6.9z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onZu}
          aria-label={schliessen}
          className="flex h-[46px] w-[46px] flex-shrink-0 touch-manipulation items-center justify-center rounded-2xl border-[1.5px] border-kante bg-theke/90 text-creme"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Das Tagesraetsel steht ueber der Folge, nicht daneben: es ist eine
          eigene taegliche Verabredung und soll nicht als Level 1000 wirken. */}
      <div className="px-6 pb-3">
        <button
          type="button"
          onClick={onTag}
          className="flex w-full touch-manipulation items-center gap-3 rounded-2xl border-[1.5px] border-zitrus/45 bg-theke-hell/70 px-4 py-3 text-left"
        >
          <span className="text-2xl leading-none" aria-hidden="true">🍹</span>
          <span className="min-w-0 flex-grow">
            <span className="font-anzeige block text-base leading-tight font-bold text-zitrus">{tagTitel}</span>
            <span className="block truncate text-[11px] leading-tight font-bold text-creme">{tagZeile}</span>
            <span className="block truncate text-[10px] leading-tight font-bold text-rauch">{tagSerie}</span>
          </span>
          <span className="flex flex-shrink-0 gap-[1.5px]" aria-hidden="true">
            {[0, 1, 2].map((k) => (
              <svg key={k} width="11" height="11" viewBox="0 0 24 24"
                fill={k < tagSterne ? 'var(--color-zitrus)' : 'none'}
                stroke={k < tagSterne ? 'none' : '#2F4A6B'} strokeWidth="2.6" strokeLinejoin="round">
                <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
              </svg>
            ))}
          </span>
        </button>
      </div>

      {/* Das Duell steht neben dem Tagesraetsel und nicht in der Folge: es ist
          kein Level, sondern eine Partie gegen jemanden. Beide Karten sind
          bewusst gleich gebaut — die zwei Dinge, die man ausserhalb der Folge
          tun kann, sollen gleich viel Gewicht haben. */}
      <div className="px-6 pb-3">
        <button
          type="button"
          onClick={onDuell}
          data-duell
          className="flex w-full touch-manipulation items-center gap-3 rounded-2xl border-[1.5px] border-glasrand/45 bg-theke-hell/70 px-4 py-3 text-left"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" className="flex-shrink-0 text-glasrand" fill="none"
            stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 3.5l9.5 9.5" /><path d="M20 3.5L10.5 13" />
            <path d="M3 20.5l3.5-3.5" /><path d="M21 20.5l-3.5-3.5" />
            <circle cx="12" cy="15.5" r="2.4" />
          </svg>
          <span className="min-w-0 flex-grow">
            <span className="font-anzeige block text-base leading-tight font-bold text-glasrand">{duellTitel}</span>
            <span className="block truncate text-[11px] leading-tight font-bold text-creme">{duellZeile}</span>
            <span className="block truncate text-[10px] leading-tight font-bold text-rauch tabular-nums">{duellBilanz}</span>
          </span>
        </button>
      </div>

      {/* Abschnittswechsel. Die Pfeile sind die Hauptbedienung, die Leiste
          darunter der Sprung ueber mehrere Abschnitte. */}
      <div className="flex items-center justify-between gap-3 px-6 pb-2">
        <button
          type="button"
          onClick={() => setBlock((b) => Math.max(0, b - 1))}
          disabled={block === 0}
          aria-label={zurueck}
          className="flex h-[38px] w-[38px] flex-shrink-0 touch-manipulation items-center justify-center rounded-xl border-[1.5px] border-kante bg-theke/90 text-creme disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="text-center">
          <p className="font-anzeige text-sm leading-none font-bold text-creme">
            {abschnittTitel(von + 1, bis)}
          </p>
          <p className="mt-1 text-[10px] leading-none font-bold text-rauch tabular-nums">
            {bloseSterne} / {(bis - von) * 3}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBlock((b) => Math.min(bloecke - 1, b + 1))}
          disabled={block >= bloecke - 1}
          aria-label={vor}
          className="flex h-[38px] w-[38px] flex-shrink-0 touch-manipulation items-center justify-center rounded-xl border-[1.5px] border-kante bg-theke/90 text-creme disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid flex-1 grid-cols-4 content-start gap-3 overflow-y-auto px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:grid-cols-5">
        {sichtbar.map((l, k) => {
          const i = von + k;
          const s = sterne[i] ?? 0;
          const jetzt = i === aktuell;
          const frei = i <= hoechstes;
          // Experten-Level haben hohe Glaeser und sind spuerbar schwerer. Ohne
          // Markierung wirkt so ein Sprung wie ein Fehler.
          const experte = istExperte(i + 1);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onWahl(i)}
              disabled={!frei}
              aria-label={frei ? kachelTitel(i + 1, s, experte) : gesperrtTitel(i + 1)}
              className={`flex aspect-square touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border transition ${
                !frei
                  ? 'border-kante/60 bg-theke/40 text-rauch'
                  : jetzt
                    ? 'border-2 border-zitrus bg-theke-hell text-zitrus'
                    : 'border-kante bg-theke text-creme'
              }`}
            >
              {frei ? (
                <>
                  <span className="font-anzeige relative text-xl leading-none font-semibold">
                    {i + 1}
                    {experte && (
                      <span className="absolute -top-0.5 -right-2.5 h-1.5 w-1.5 rounded-full bg-zitrus" aria-hidden="true" />
                    )}
                  </span>
                  <span className="flex gap-[1.5px]" aria-hidden="true">
                    {[0, 1, 2].map((j) => (
                      <svg key={j} width="9" height="9" viewBox="0 0 24 24"
                        fill={j < s ? 'var(--color-zitrus)' : 'none'}
                        stroke={j < s ? 'none' : '#2F4A6B'} strokeWidth="2.6" strokeLinejoin="round">
                        <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
                      </svg>
                    ))}
                  </span>
                  <span className="text-[9px] leading-none font-bold text-rauch tabular-nums">{l.optimalZuege}</span>
                </>
              ) : (
                <>
                  <span className="font-anzeige text-base leading-none font-semibold opacity-60">{i + 1}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
