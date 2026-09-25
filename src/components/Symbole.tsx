// Die Zeichen fuer den Farbenblind-Modus.
//
// Vorher standen hier Emoji. Die sehen auf jedem Geraet anders aus, wirken
// billig und sind in Graustufen kaum zu trennen. Diese neun sind gezeichnet:
// jede Farbe bekommt einen ANDEREN UMRISS, damit sie auch dann erkennbar
// bleibt, wenn die Farbe wegfaellt. Die Abnahme ist der Graustufen-Screenshot
// aus tools/test-oberflaeche.mjs.
//
// Bewusst gefuellte Silhouetten statt Strichzeichnungen: bei 16 Pixeln auf
// einer farbigen Flaeche traegt nur die Flaeche.

import type { FarbId } from '../engine/farben.ts';

const PFADE: Record<FarbId, React.ReactNode> = {
  rot: (
    <>
      <path d="M12 20.8c-3.7-1.9-6.6-5.8-6.6-9.3 0-2.9 3-5 6.6-5s6.6 2.1 6.6 5c0 3.5-2.9 7.4-6.6 9.3z" />
      <path d="M12 6.4c-.7-2.1-2.8-3.3-4.9-2.8.6 2 2.6 3.1 4.9 2.8z" />
      <path d="M12 6.4c.7-2.1 2.8-3.3 4.9-2.8-.6 2-2.6 3.1-4.9 2.8z" />
    </>
  ),
  gelb: <ellipse cx="12" cy="12" rx="8.6" ry="5.9" transform="rotate(-30 12 12)" />,
  blau: (
    <>
      <circle cx="12" cy="13.8" r="6.7" />
      <path d="M12 5.2l1.6 2.5 2.8-.6-1.5 2.5H9.1L7.6 7.1l2.8.6z" />
    </>
  ),
  orange: (
    <>
      <path d="M12 4.2A7.8 7.8 0 0119.8 12H4.2A7.8 7.8 0 0112 4.2z" />
      <rect x="4.2" y="14.2" width="15.6" height="2.6" rx="1.3" />
    </>
  ),
  gruen: (
    <>
      <path d="M12 7.6c1.7-1.5 4.1-1.7 5.7-.2 1.9 1.7 2 5.5.4 8.5-1.1 2.1-2.8 4-4.5 4-.6 0-1-.2-1.6-.4-.6.2-1 .4-1.6.4-1.7 0-3.4-1.9-4.5-4-1.6-3-1.5-6.8.4-8.5 1.6-1.5 4-1.3 5.7.2z" />
      <path d="M11.1 6.6c-.3-2 .7-3.6 2.6-4.2.4 2-.6 3.6-2.6 4.2z" />
    </>
  ),
  lila: (
    <>
      <circle cx="12" cy="4.4" r="2.2" />
      <circle cx="8.3" cy="10.2" r="3.1" />
      <circle cx="15.7" cy="10.2" r="3.1" />
      <circle cx="12" cy="16" r="3.1" />
    </>
  ),
  minze: <path d="M12.6 20.6c-5.1-1.7-7.9-6.2-7.9-10.8 0-2.1.4-4 1.2-5.6 1.6.8 3.2 1.5 4.6 2.6 2.7 2 4.2 5.2 4.2 8.9 0 1.7-.6 3.4-2.1 4.9z" />,
  kokos: (
    <path
      fillRule="evenodd"
      d="M12 3.8a8.2 8.2 0 100 16.4 8.2 8.2 0 000-16.4zm0 4.8a3.4 3.4 0 110 6.8 3.4 3.4 0 010-6.8z"
    />
  ),
  kaffee: (
    <>
      <path d="M11.2 4c-4 .4-7 3.9-7 8.1 0 4.2 3 7.6 7 8-1.6-2.3-2.4-5-2.4-8s.8-5.7 2.4-8.1z" />
      <path d="M12.8 4c4 .4 7 3.9 7 8.1 0 4.2-3 7.6-7 8 1.6-2.3 2.4-5 2.4-8s-.8-5.7-2.4-8.1z" />
    </>
  ),
};

/**
 * Kaffee ist so dunkel, dass ein dunkles Zeichen darauf untergeht (2,2:1).
 * Es bekommt als einzige Farbe ein helles. Alle anderen tragen Tinte.
 */
const HELLE_TINTE: ReadonlySet<FarbId> = new Set<FarbId>(['kaffee']);

export default function Symbol({ id, groesse }: { id: FarbId; groesse: number }) {
  return (
    <svg
      width={groesse}
      height={groesse}
      viewBox="0 0 24 24"
      fill={HELLE_TINTE.has(id) ? 'rgba(244,235,222,0.88)' : 'rgba(18,14,10,0.68)'}
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      {PFADE[id]}
    </svg>
  );
}
