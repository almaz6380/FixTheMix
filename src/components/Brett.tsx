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

/*
   Der Giesszug in Zahlen. Er ist absichtlich kein reiner Drehzug: ein Glas,
   das sich nur neigt, wackelt; eines, das sich anhebt, hinueberwandert und
   dann kippt, giesst.

   Das meiste erledigt der WINKEL, nicht die Wanderung. Bei einem Glas von
   rund 54 px Breite und 140 px Hoehe schiebt eine Drehung um 30 Grad die
   Oeffnung schon rund 50 px zur Seite — fast eine ganze Spalte. Die
   Wanderung darf deshalb klein bleiben; grosse Werte sahen aus, als haette
   jemand das Glas hochgehoben und daneben gestellt.
*/
/** Wie weit die Quelle zum Ziel wandert, als Anteil des Abstands. */
const KIPP_ANTEIL = 0.22;
/** ... hoechstens aber so viele Pixel. Sonst reist ein Glas quer durch die Bar. */
const KIPP_MAX = 34;
/** Hub nach oben, in Pixeln (negativ = hoch). */
const KIPP_HUB = -26;
const KIPP_WINKEL = 30;
/**
 * Abstand der Oeffnung vom Drehpunkt, in Glashoehen. Muss zum
 * `transform-origin: 50% 72%` von `.glas-koerper` passen.
 */
const KIPP_DREHARM = 0.72;
/**
 * Wie lange das Glas gekippt bleibt. Steht HIER und nicht in `App.tsx`,
 * damit Bewegung und Zeitgeber nicht auseinanderlaufen: der Strahl braucht
 * genauso lange (`guss-fliesst` in index.css), und ein Glas, das vorher
 * zurueckschnellt, giesst ins Nichts.
 */
export const KIPP_MS = 430;

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

    // Der Kippzug. Wohin das Glas sich neigt, kann nur hier entschieden
    // werden: `Glas` kennt seine eigene Lage nicht, und das Raster haengt an
    // der Displaybreite. Uebergeben wird es als CSS-Variablen auf dem Knopf,
    // von wo sie der Glaskoerper erbt — das kostet kein Neuzeichnen, und die
    // Werte stehen vor dem ersten Bild (`useLayoutEffect`).
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    const rechts = dx >= 0;
    const kippX = Math.max(-KIPP_MAX, Math.min(KIPP_MAX, dx * KIPP_ANTEIL));
    const winkel = rechts ? KIPP_WINKEL : -KIPP_WINKEL;
    const quelle = glasRefs.current[guss.von];
    quelle?.style.setProperty('--kipp-x', `${kippX}px`);
    quelle?.style.setProperty('--kipp-y', `${KIPP_HUB}px`);
    quelle?.style.setProperty('--kipp-winkel', `${winkel}deg`);

    // Startpunkt ist die Oeffnung des GEKIPPTEN Glases, nicht seine Kante im
    // Stand. Das Glas dreht um `transform-origin: 50% 72%`; die Oeffnung
    // liegt 0,72 Glashoehen darueber und beschreibt damit einen Bogen, den
    // der Strahl mitmachen muss — sonst haengt er in der Luft neben dem Glas.
    const bog = (winkel * Math.PI) / 180;
    const x1 = a.left - kasten.left + a.width * 0.5
      + a.height * KIPP_DREHARM * Math.sin(bog) + kippX;
    const y1 = a.top - kasten.top
      + a.height * KIPP_DREHARM * (1 - Math.cos(bog)) + KIPP_HUB;
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
