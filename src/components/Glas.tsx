// Ein Glas oder ein Shaker als SVG.
//
// Warum je Behaelter ein eigenes SVG statt eines grossen Spielfeld-SVG: die
// Glaeser sollen auf einem schmalen Handy umbrechen duerfen. Mit einem
// Flex-Container aus kleinen SVGs macht das der Browser; in einem einzigen
// SVG muesste man das Layout von Hand rechnen.
//
// Die Schichten liegen alle auf y = 0 und werden per CSS-`transform`
// verschoben. Nur so laesst sich die Bewegung ueberhaupt weich animieren —
// das SVG-Attribut `y` kennt keine CSS-Transition.

import { LEER, farbeVon } from '../engine/farben.ts';
import type { Spielstand } from '../engine/typen.ts';

const BREITE = 46;
const SCHICHT = 26;
const RAND = 3;

interface Eigenschaften {
  stand: Spielstand;
  behaelter: number;
  istShaker: boolean;
  gewaehlt: boolean;
  kippt: boolean;
  tipp: boolean;
  symbole: boolean;
  onTap: () => void;
  beschriftung: string;
}

export default function Glas({
  stand, behaelter, istShaker, gewaehlt, kippt, tipp, symbole, onTap, beschriftung,
}: Eigenschaften) {
  const hoehe = stand.hoehe;
  const innen = hoehe * SCHICHT;
  const gesamt = innen + RAND * 2;
  const fuell = stand.fuell[behaelter]!;
  const oberste = fuell > 0 ? stand.zellen[behaelter * hoehe + fuell - 1] : LEER;

  const schichten = [];
  for (let i = 0; i < fuell; i++) {
    const code = stand.zellen[behaelter * hoehe + i]!;
    const f = farbeVon(code);
    // Der oberste Lauf hebt sich an, wenn das Glas gewaehlt ist — so sieht
    // man vor dem Giessen, WAS fliessen wuerde.
    const gehoben = gewaehlt && code === oberste && istImOberenLauf(stand, behaelter, i);
    const y = RAND + innen - (i + 1) * SCHICHT - (gehoben ? 6 : 0);
    schichten.push(
      <g
        key={i}
        style={{ transform: `translateY(${y}px)`, transition: 'transform 180ms ease-out' }}
      >
        <rect x={RAND} y={0} width={BREITE - RAND * 2} height={SCHICHT} fill={f.ton} />
        {symbole && (
          <text
            x={BREITE / 2}
            y={SCHICHT / 2 + 6}
            textAnchor="middle"
            fontSize="15"
            aria-hidden="true"
          >
            {f.emoji}
          </text>
        )}
      </g>,
    );
  }

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={beschriftung}
      className={`w-full touch-manipulation appearance-none border-0 bg-transparent p-0 transition-transform duration-150 ${
        gewaehlt ? '-translate-y-2' : ''
      } ${kippt ? 'rotate-[-8deg]' : ''}`}
    >
      <svg
        viewBox={`0 0 ${BREITE} ${gesamt}`}
        role="img"
        className="h-auto w-full"
        style={{ maxHeight: `${gesamt * 1.9}px` }}
      >
        <defs>
          <clipPath id={`innen-${behaelter}`}>
            <rect
              x={RAND}
              y={RAND}
              width={BREITE - RAND * 2}
              height={innen}
              rx={istShaker ? 3 : 7}
            />
          </clipPath>
        </defs>
        <rect
          x={RAND}
          y={RAND}
          width={BREITE - RAND * 2}
          height={innen}
          rx={istShaker ? 3 : 7}
          fill="#0d0a08"
        />
        <g clipPath={`url(#innen-${behaelter})`}>{schichten}</g>
        {istShaker && (
          // Die Haelfte-Markierung. Sie ist nicht Zierde: je Farbe passt nur
          // die Haelfte in den Shaker, und genau das muss man sehen.
          <line
            x1={RAND}
            x2={BREITE - RAND}
            y1={RAND + innen / 2}
            y2={RAND + innen / 2}
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.7"
          />
        )}
        <rect
          x={RAND}
          y={RAND}
          width={BREITE - RAND * 2}
          height={innen}
          rx={istShaker ? 3 : 7}
          fill="none"
          stroke={gewaehlt || tipp ? '#fbbf24' : istShaker ? '#8a6a44' : '#6b5540'}
          strokeWidth={gewaehlt || tipp ? 2.5 : 2}
          strokeDasharray={tipp && !gewaehlt ? '5 4' : undefined}
        />
      </svg>
    </button>
  );
}

/** Gehoert Schicht i zum obersten zusammenhaengenden Lauf? */
function istImOberenLauf(stand: Spielstand, behaelter: number, i: number): boolean {
  const fuell = stand.fuell[behaelter]!;
  const basis = behaelter * stand.hoehe;
  const farbe = stand.zellen[basis + fuell - 1];
  for (let k = fuell - 1; k >= 0; k--) {
    if (stand.zellen[basis + k] !== farbe) return false;
    if (k === i) return true;
  }
  return false;
}
