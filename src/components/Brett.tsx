// Das Spielfeld.
//
// Bedienung bewusst zweistufig (antippen = waehlen, nochmal antippen =
// giessen) statt Ziehen: auf einem Handy ist Ziehen mit dem Daumen ueber ein
// halbes Display unangenehm, und ein abgebrochener Zug ist schwer erkennbar.
//
// Die Zeilen werden GERECHNET, nicht umgebrochen. Ein flex-wrap machte aus
// sieben Glaesern 6 + 1 — eine Zeile voll, eine mit einem einsamen Glas.
// Hier werden es 4 + 3.
//
// DER GIESSSTRAHL liegt als SVG ueber dem Brett und wird GEMESSEN, nicht
// gerechnet: die Glaeser stehen in einem Raster, dessen Pixelmasse von der
// Displaybreite abhaengen. Zwei `getBoundingClientRect` sind billiger und
// ehrlicher, als die Rasterarithmetik ein zweites Mal nachzubauen — und sie
// bleiben richtig, wenn jemand am Layout dreht.

import { useLayoutEffect, useRef, useState } from 'react';
import Glas from './Glas.tsx';
import { farbeVon } from '../engine/farben.ts';
import type { Spielstand } from '../engine/typen.ts';

/** Ein Guss, der gezeichnet werden soll. `nr` zaehlt hoch und startet die Bewegung neu. */
export interface Guss {
  von: number;
  nach: number;
  /** Farbcode der fliessenden Fluessigkeit. */
  farbe: number;
  menge: number;
  nr: number;
}

interface Eigenschaften {
  stand: Spielstand;
  gewaehlt: number | null;
  kippt: number | null;
  tippZiel: number | null;
  symbole: boolean;
  onTap: (b: number) => void;
  textGlas: (i: number) => string;
  guss: Guss | null;
}

interface Strahl {
  d: string;
  farbe: string;
  hell: string;
  nr: number;
}

export default function Brett({
  stand, gewaehlt, kippt, tippZiel, symbole, onTap, textGlas, guss,
}: Eigenschaften) {
  // Hoehere Glaeser brauchen mehr Platz nach unten, also lieber breitere
  // Zeilen als viele: bis 5 Glaeser eine Zeile, darueber gleichmaessig teilen.
  const reihen = Math.ceil(stand.glaeser / 5);
  const proReihe = Math.ceil(stand.glaeser / reihen);
  const breite = Math.min(proReihe * 74, 340);

  const rahmen = useRef<HTMLDivElement | null>(null);
  const glasRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [strahl, setStrahl] = useState<Strahl | null>(null);

  // `useLayoutEffect` und nicht `useEffect`: gemessen wird, BEVOR der Browser
  // zeichnet. Sonst blitzt der Strahl einen Bildwechsel lang an der Stelle des
  // vorigen Gusses auf.
  // Messen IST der Ausnahmefall, den `set-state-in-effect` meint: die Lage der
  // Glaeser steht erst fest, wenn der Browser das Raster gerechnet hat. Sie
  // laesst sich weder beim Rendern ableiten noch aus dem Ereignis mitgeben —
  // das entsteht in App.tsx, wo es die Glaeser gar nicht gibt. Die Alternative
  // waere, ein Ref waehrend des Renderns zu lesen, und genau davon raet die
  // CLAUDE.md ab.
  useLayoutEffect(() => {
    // Kein Zuruecksetzen auf `null`, wenn gerade nichts fliesst: gezeichnet
    // wird unten nur, wenn die gemessene Nummer zur aktuellen passt. Das
    // spart nicht nur einen Zustandswechsel, es verhindert auch, dass fuer
    // ein Bild lang der Strahl des VORIGEN Zuges ueber dem neuen Brett steht.
    if (!guss) return;
    const kasten = rahmen.current?.getBoundingClientRect();
    const a = glasRefs.current[guss.von]?.getBoundingClientRect();
    const b = glasRefs.current[guss.nach]?.getBoundingClientRect();
    if (!kasten || !a || !b) return;

    // Startpunkt ist die Kante der Quelle, die zum Ziel zeigt — ein Glas
    // kippt beim Giessen, und der Strahl soll nicht aus der Mitte kommen.
    const nachRechts = b.left > a.left;
    const x1 = a.left - kasten.left + a.width * (nachRechts ? 0.78 : 0.22);
    const y1 = a.top - kasten.top + a.height * 0.06;
    const x2 = b.left - kasten.left + b.width * 0.5;
    const y2 = b.top - kasten.top + b.height * 0.1;
    // Der Bogen: der Steuerpunkt liegt ueber BEIDEN Glaesern, sonst laeuft die
    // Kurve bei Glaesern in derselben Reihe schnurgerade.
    const cx = (x1 + x2) / 2;
    const cy = Math.min(y1, y2) - 26;

    const f = farbeVon(guss.farbe);
    setStrahl({ d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, farbe: f.ton, hell: f.hell, nr: guss.nr });
  }, [guss]);

  // Die Glaeser werden reihenweise ausgegeben, damit jede Reihe eine eigene
  // Leiste bekommt, auf der sie steht. Jede Reihe traegt dasselbe
  // Spaltenraster — eine halb gefuellte letzte Reihe bleibt damit
  // linksbuendig, genau wie im frueheren Ein-Gitter-Aufbau.
  const zeilen = [];
  for (let r = 0; r < reihen; r++) {
    const von = r * proReihe;
    const bis = Math.min(von + proReihe, stand.glaeser);
    const glaeser = [];
    for (let b = von; b < bis; b++) {
      const i = b;
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
          innerRef={(el) => { glasRefs.current[i] = el; }}
        />,
      );
    }
    zeilen.push(
      <div
        key={r}
        className="brett-reihe"
        style={{ gridTemplateColumns: `repeat(${proReihe}, minmax(0, 1fr))` }}
      >
        {glaeser}
        {/* Die vorderste Reihe steht auf dem Tresen, dessen Messingkante ihre
            Leiste ist — sonst laegen dort zwei Kanten uebereinander. */}
        {r < reihen - 1 && <div className="brett-leiste" aria-hidden="true" />}
      </div>,
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: `${breite}px` }} ref={rahmen}>
      <div className="brett">
        {/* Zuerst im DOM und damit hinter den Glaesern. Haengt an der
            Unterkante des Bretts, nicht an einer festen Hoehe. */}
        <div className="theke" aria-hidden="true" />
        {zeilen}
      </div>

      {guss && strahl && strahl.nr === guss.nr && (
        // `key` erzwingt ein neues Element je Guss — eine CSS-Bewegung laeuft
        // sonst nicht noch einmal los, wenn zweimal dasselbe gegossen wird.
        <svg
          key={strahl.nr}
          className="guss"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          {/* Zwei Linien uebereinander: die breite ist die Fluessigkeit, die
              schmale die Lichtkante darauf. Ohne sie sieht der Strahl aus wie
              ein gezogener Stift. */}
          <path d={strahl.d} pathLength={1} fill="none" strokeLinecap="round"
            stroke={strahl.farbe} strokeWidth={7} />
          <path d={strahl.d} pathLength={1} fill="none" strokeLinecap="round"
            stroke={strahl.hell} strokeWidth={2.5} opacity={0.85} />
        </svg>
      )}
    </div>
  );
}
