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
//
// Seit dem 27.09.2026 ist das eine SEITE (`/level`) und kein Fenster ueber dem
// Spiel mehr. Damit sind auch Tagesraetsel und Duell hier ausgezogen: beides
// ist kein Level, und beides lag vorher hinter dem Spielbildschirm statt
// davor. Sie stehen jetzt auf dem Startbildschirm. Hier ist nur noch, was der
// Name sagt: die Wahl eines Levels.

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
  /** Aufschrift der Kachel, die als naechste dran ist. */
  weiter: string;
}

export default function Levelwahl({
  level, aktuell, sterne, hoechstes, onWahl, onZu, titel, schliessen, bilanz,
  abschnittTitel, kachelTitel, gesperrtTitel, zurueck, vor, weiter,
}: Eigenschaften) {
  const bloecke = Math.min(BLOECKE, Math.ceil(level.length / BLOCK));
  const [block, setBlock] = useState(() => Math.min(Math.floor(aktuell / BLOCK), bloecke - 1));

  const von = block * BLOCK;
  const bis = Math.min(von + BLOCK, level.length);
  const sichtbar = level.slice(von, bis);

  let bloseSterne = 0;
  for (let i = von; i < bis; i++) bloseSterne += sterne[i] ?? 0;

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="theke-fest" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-4 px-6 pt-[calc(env(safe-area-inset-top)+1.2rem)] pb-3">
        <div>
          <h2 className="font-anzeige text-2xl leading-tight font-bold text-creme">{titel}</h2>
          <p className="mt-1 text-xs font-bold text-rauch">{bilanz}</p>
        </div>
        <button
          type="button"
          onClick={onZu}
          aria-label={schliessen}
          className="start-chip flex h-[46px] w-[46px] flex-shrink-0 touch-manipulation items-center justify-center rounded-2xl text-creme"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="pfeil" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
      </div>



      {/* Abschnittswechsel. Die Pfeile sind die Hauptbedienung, die Leiste
          darunter der Sprung ueber mehrere Abschnitte. */}
      <div className="relative flex items-center justify-between gap-3 px-6 pb-2">
        <button
          type="button"
          onClick={() => setBlock((b) => Math.max(0, b - 1))}
          disabled={block === 0}
          aria-label={zurueck}
          className="flex h-[38px] w-[38px] flex-shrink-0 touch-manipulation items-center justify-center rounded-xl start-chip text-creme disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="pfeil" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div className="text-center">
          <p className="font-anzeige text-sm leading-none font-bold text-creme">
            {abschnittTitel(von + 1, bis)}
          </p>
          {/* Ein Balken statt nur „27 / 60". Die Zahl allein sagt nichts ueber
              den Abstand zum vollen Abschnitt — der Balken zeigt ihn, ohne
              dass man rechnen muss. */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="start-balken w-[104px]">
              <div
                style={{ width: `${Math.round((bloseSterne / Math.max(1, (bis - von) * 3)) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] leading-none font-bold text-rauch tabular-nums">
              {bloseSterne} / {(bis - von) * 3}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setBlock((b) => Math.min(bloecke - 1, b + 1))}
          disabled={block >= bloecke - 1}
          aria-label={vor}
          className="flex h-[38px] w-[38px] flex-shrink-0 touch-manipulation items-center justify-center rounded-xl start-chip text-creme disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="pfeil" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="relative grid flex-1 grid-cols-4 content-start gap-3 overflow-y-auto px-6 pb-[calc(env(safe-area-inset-bottom)+7rem)] sm:grid-cols-5">
        {sichtbar.map((_, k) => {
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
              className={`flex aspect-square touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl transition ${
                !frei
                  ? 'level-kachel level-zu text-rauch/75'
                  : jetzt
                    ? 'level-kachel level-jetzt text-zitrus'
                    : s === 3
                      ? 'level-kachel level-voll text-creme'
                      : 'level-kachel text-creme'
              }`}
            >
              {frei ? (
                <>
                  <span className="font-anzeige relative text-xl leading-none font-semibold">
                    {i + 1}
                    {experte && (
                      <span className="absolute -top-0.5 -end-2.5 h-1.5 w-1.5 rounded-full bg-zitrus" aria-hidden="true" />
                    )}
                  </span>
                  {/*
                    NUR verdiente Sterne. Vorher trug jede Kachel drei hohle
                    Sterne, also 60 leere Umrisse je Abschnitt — ein Raster
                    aus Rauschen, in dem die verdienten untergingen. Wer
                    nichts verdient hat, sieht nichts; der naechste Level
                    sagt stattdessen, dass er dran ist.

                    Die nackte Zahl darunter ist ganz weg. Das war das
                    Optimum, unbeschriftet, und damit fuer jeden, der es
                    nicht wusste, ein Fehler im Raster.
                  */}
                  {s > 0 ? (
                    <span className="flex gap-[1.5px]" aria-hidden="true">
                      {Array.from({ length: s }, (_, j) => (
                        <svg key={j} width="10" height="10" viewBox="0 0 24 24" fill="var(--color-zitrus)">
                          <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
                        </svg>
                      ))}
                    </span>
                  ) : jetzt ? (
                    <span className="text-[8.5px] leading-none font-bold tracking-[0.12em] text-zitrus uppercase">
                      {weiter}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="font-anzeige text-base leading-none font-semibold">{i + 1}</span>
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
    </main>
  );
}
