// Das Spielfeld.
//
// Bedienung bewusst zweistufig (antippen = waehlen, nochmal antippen =
// giessen) statt Ziehen: auf einem Handy ist Ziehen mit dem Daumen ueber ein
// halbes Display unangenehm, und ein abgebrochener Zug ist schwer erkennbar.
//
// Die Zeilen werden GERECHNET, nicht umgebrochen. Ein flex-wrap machte aus
// sieben Glaesern 6 + 1 — eine Zeile voll, eine mit einem einsamen Glas.
// Hier werden es 4 + 3.

import Glas from './Glas.tsx';
import type { Spielstand } from '../engine/typen.ts';

interface Eigenschaften {
  stand: Spielstand;
  gewaehlt: number | null;
  kippt: number | null;
  tippZiel: number | null;
  symbole: boolean;
  onTap: (b: number) => void;
  textGlas: (i: number) => string;
}

export default function Brett({
  stand, gewaehlt, kippt, tippZiel, symbole, onTap, textGlas,
}: Eigenschaften) {
  // Hoehere Glaeser brauchen mehr Platz nach unten, also lieber breitere
  // Zeilen als viele: bis 5 Glaeser eine Zeile, darueber gleichmaessig teilen.
  const reihen = Math.ceil(stand.glaeser / 5);
  const proReihe = Math.ceil(stand.glaeser / reihen);
  const breite = Math.min(proReihe * 74, 340);

  const glaeser = [];
  for (let b = 0; b < stand.glaeser; b++) {
    glaeser.push(
      <Glas
        key={b}
        stand={stand}
        glas={b}
        gewaehlt={gewaehlt === b}
        kippt={kippt === b}
        tipp={tippZiel === b}
        symbole={symbole}
        onTap={() => onTap(b)}
        beschriftung={textGlas(b)}
      />,
    );
  }

  return (
    <div
      className="brett"
      style={{
        gridTemplateColumns: `repeat(${proReihe}, minmax(0, 1fr))`,
        maxWidth: `${breite}px`,
      }}
    >
      {glaeser}
    </div>
  );
}
