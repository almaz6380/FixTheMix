// Das Spielfeld: Glaeser oben, Shaker darunter.
//
// Bedienung bewusst zweistufig (antippen = waehlen, nochmal antippen =
// giessen) statt Ziehen: auf einem Handy ist Ziehen mit dem Daumen ueber ein
// halbes Display hinweg unangenehm, und ein abgebrochener Zug ist schwer
// erkennbar.
//
// Der Shaker bekommt einen EIGENEN Knopf zum Schuetteln, statt das auf einen
// Tipp aufs Glas zu legen. Sonst waere ein Tipp mal „waehlen" und mal
// „schuetteln" — und die zentrale Mechanik des Spiels darf nicht raten.

import Glas from './Glas.tsx';
import type { Spielstand } from '../engine/typen.ts';

interface Eigenschaften {
  stand: Spielstand;
  gewaehlt: number | null;
  kippt: number | null;
  /** Vom Tipp hervorgehobenes Ziel. Gestrichelter Rahmen, kein Zwang. */
  tippZiel: number | null;
  schuettelbar: (b: number) => boolean;
  symbole: boolean;
  onTap: (b: number) => void;
  onSchuetteln: (b: number) => void;
  textGlas: (i: number) => string;
  textShaker: (i: number) => string;
  textSchuetteln: string;
}

export default function Brett({
  stand, gewaehlt, kippt, tippZiel, schuettelbar, symbole, onTap, onSchuetteln,
  textGlas, textShaker, textSchuetteln,
}: Eigenschaften) {
  const glaeser = [];
  for (let b = 0; b < stand.glaeser; b++) {
    glaeser.push(
      <Glas
        key={b}
        stand={stand}
        behaelter={b}
        istShaker={false}
        gewaehlt={gewaehlt === b}
        kippt={kippt === b}
        tipp={tippZiel === b}
        symbole={symbole}
        onTap={() => onTap(b)}
        beschriftung={textGlas(b)}
      />,
    );
  }

  const shaker = [];
  for (let b = stand.glaeser; b < stand.glaeser + stand.shaker; b++) {
    const kann = schuettelbar(b);
    shaker.push(
      <div key={b} className="flex flex-col items-center gap-1.5">
        <Glas
          stand={stand}
          behaelter={b}
          istShaker
          gewaehlt={gewaehlt === b}
          kippt={kippt === b}
          tipp={tippZiel === b}
          symbole={symbole}
          onTap={() => onTap(b)}
          beschriftung={textShaker(b - stand.glaeser)}
        />
        <button
          type="button"
          onClick={() => onSchuetteln(b)}
          disabled={!kann}
          className={`touch-manipulation rounded-full px-3 py-1 text-xs font-semibold transition ${
            tippZiel === b ? 'animate-pulse ' : ''
          }${
            kann
              ? 'bg-zitrus-400 text-bar-950 shadow-lg shadow-zitrus-500/30'
              : 'bg-bar-800 text-bar-600'
          }`}
        >
          {textSchuetteln}
        </button>
      </div>,
    );
  }

  // Zeilen gleichmaessig aufteilen. Ein Umbruch per flex-wrap lieferte bei
  // sieben Glaesern 6 + 1 — eine Zeile voll, eine mit einem einsamen Glas.
  // Hier wird stattdessen die Spaltenzahl gerechnet: 7 werden zu 4 + 3.
  const reihen = Math.ceil(stand.glaeser / 5);
  const proReihe = Math.ceil(stand.glaeser / reihen);
  // Obergrenze, damit die Glaeser auf einem Tablet nicht ins Groteske wachsen.
  const breite = Math.min(proReihe * 78, 430);
  // Der Shaker bekommt GENAU die Spaltenbreite der Glaeser. Mit einer eigenen
  // Obergrenze war er breiter als sie — und sah aus wie ein Sonderfall,
  // obwohl er einfach ein weiterer Behaelter ist.
  const spalte = (breite - (proReihe - 1) * 12) / proReihe;

  return (
    <div className="flex w-full flex-col items-center gap-7">
      <div
        className="grid w-full gap-x-3 gap-y-5"
        style={{
          gridTemplateColumns: `repeat(${proReihe}, minmax(0, 1fr))`,
          maxWidth: `${breite}px`,
        }}
      >
        {glaeser}
      </div>
      {shaker.length > 0 && (
        <div
          className="grid w-full justify-center gap-6 border-t border-bar-800 pt-6"
          style={{
            gridTemplateColumns: `repeat(${shaker.length}, ${spalte}px)`,
            maxWidth: `${shaker.length * spalte + (shaker.length - 1) * 24}px`,
          }}
        >
          {shaker}
        </div>
      )}
    </div>
  );
}
