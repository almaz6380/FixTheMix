// Die Rueckwand der Bar: zwei Haengelampen und ein Regal mit Flaschen,
// Karaffen und einer Obstschale.
//
// Bis zum 01.10.2026 war ueber den Glaesern nur Fischschuppen — bei kleinen
// Brettern zwei Drittel des Schirms. Das Thema ist eine Saftbar, und zu sehen
// war davon nur der Tresen. Jetzt ist die Wand eine Wand.
//
// Drei Regeln, damit sie Kulisse bleibt und nicht mitspielt:
//
//  1. LEISE. Die Formen liegen kaum heller als der Grund (`#13223A` auf
//     `#0E1A2E`), und nur ihre Kanten fangen das Licht der Lampen. Die neun
//     Saefte sind das Lauteste auf dem Schirm — kein Ding an der Wand darf
//     ihnen eine Farbe streitig machen. Wo Farbe vorkommt (Sirup, Obst), ist
//     sie stark abgedunkelt.
//  2. HINTEN. `z-index: -1` legt sie hinter alles, ohne dass Kopfzeile oder
//     Brett eine eigene Position brauchen. Bei drei Reihen stehen die Glaeser
//     davor; das ist richtig so, eine Bar hat ihr Regal hinter den Glaesern.
//  3. EIN BILD. Kein Zustand, keine Bewegung, nichts zum Antippen
//     (`pointer-events: none`). Gezeichnet als SVG statt Bilddatei: null
//     Bytes Ladezeit, auf jedem Display scharf, offline sicher.

/**
 * `lampenX`: wo die beiden Lampen haengen, in Einheiten der 390 breiten
 * Zeichnung. Im Spiel ueber dem Brett (92/298), auf dem Startbildschirm ganz
 * aussen neben dem Titel — dort waeren sie sonst mitten im Schriftzug.
 */
export default function Rueckwand({ lampenX = [92, 298] }: { lampenX?: readonly number[] }) {
  return (
    <svg
      className="rueckwand"
      viewBox="0 0 390 330"
      preserveAspectRatio="xMidYMin meet"
      aria-hidden="true"
    >
      <defs>
        {/* Der Lichtkegel einer Lampe — warm, nach unten weich auslaufend. */}
        <radialGradient id="ftm-lampe-kegel" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
          <stop offset="0%" stopColor="#FFC93C" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#FFC93C" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#FFC93C" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ftm-lampe-gluehen" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE7A8" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#FFC93C" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#FFC93C" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ftm-schirm" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B2B1A" />
          <stop offset="38%" stopColor="#7A5A2C" />
          <stop offset="62%" stopColor="#4A3620" />
          <stop offset="100%" stopColor="#24190F" />
        </linearGradient>
        {/* Die Regalplatte: oben eine Lichtkante, vorne Holz. */}
        <linearGradient id="ftm-regal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A3426" />
          <stop offset="30%" stopColor="#2E1F18" />
          <stop offset="100%" stopColor="#1B120E" />
        </linearGradient>
        <linearGradient id="ftm-regal-licht" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8B04B" stopOpacity="0" />
          <stop offset="20%" stopColor="#E8B04B" stopOpacity="0.35" />
          <stop offset="80%" stopColor="#E8B04B" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#E8B04B" stopOpacity="0" />
        </linearGradient>
        {/* Eine Flasche im Gegenlicht: links eine schmale Lichtkante. */}
        <linearGradient id="ftm-flasche" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2A3D5C" />
          <stop offset="18%" stopColor="#1A2B45" />
          <stop offset="70%" stopColor="#13223A" />
          <stop offset="100%" stopColor="#0F1C30" />
        </linearGradient>
      </defs>

      {/* Lichtkegel zuerst — sie liegen hinter allem anderen. */}
      {lampenX.map((x) => (
        <path key={x} d={`M ${x} 92 L ${x - 74} 330 L ${x + 74} 330 Z`} fill="url(#ftm-lampe-kegel)" />
      ))}

      {/* --- Das Regal --- */}
      <g>
        {/* Sirupflasche, hoch und schlank */}
        <path d="M 40 238 L 40 196 Q 40 186 47 181 L 47 164 L 55 164 L 55 181 Q 62 186 62 196 L 62 238 Z"
          fill="url(#ftm-flasche)" />
        <rect x="46" y="159" width="10" height="6" rx="1.5" fill="#3B2B1A" />
        <rect x="42" y="206" width="18" height="22" rx="2" fill="#5A1D2A" opacity="0.55" />

        {/* Bauchige Karaffe mit Orangensaft */}
        <path d="M 74 238 Q 66 222 72 208 Q 78 198 80 190 L 80 180 L 92 180 L 92 190 Q 94 198 100 208 Q 106 222 98 238 Z"
          fill="url(#ftm-flasche)" />
        <path d="M 71 222 Q 70 230 74 238 L 98 238 Q 102 230 101 222 Z" fill="#7A4410" opacity="0.6" />

        {/* Glas mit Strohhalm */}
        <path d="M 112 238 L 109 212 L 129 212 L 126 238 Z" fill="url(#ftm-flasche)" />
        <path d="M 110 222 L 128 222 L 126 238 L 112 238 Z" fill="#2B5A22" opacity="0.55" />
        <path d="M 123 214 L 132 194" stroke="#6B2A35" strokeWidth="2.2" strokeLinecap="round" />

        {/* Obstschale: Zitrone, Orange, Apfel */}
        <circle cx="160" cy="222" r="9" fill="#6B5A1E" opacity="0.75" />
        <circle cx="176" cy="219" r="10" fill="#6E3F12" opacity="0.75" />
        <circle cx="191" cy="223" r="8.5" fill="#355A18" opacity="0.75" />
        <path d="M 145 226 Q 168 246 205 226 Z" fill="url(#ftm-flasche)" />
        <path d="M 145 226 L 205 226" stroke="#2A3D5C" strokeWidth="1.5" />

        {/* Zwei kleine Sirupflaschen */}
        <path d="M 218 238 L 218 214 Q 218 207 223 204 L 223 194 L 229 194 L 229 204 Q 234 207 234 214 L 234 238 Z"
          fill="url(#ftm-flasche)" />
        <rect x="219" y="220" width="14" height="12" rx="1.5" fill="#3E2160" opacity="0.6" />
        <path d="M 240 238 L 240 218 Q 240 212 244 209 L 244 200 L 250 200 L 250 209 Q 254 212 254 218 L 254 238 Z"
          fill="url(#ftm-flasche)" />
        <rect x="241" y="222" width="12" height="10" rx="1.5" fill="#0E4A3E" opacity="0.65" />

        {/* Einmachglas mit Beeren */}
        <rect x="266" y="204" width="30" height="34" rx="5" fill="url(#ftm-flasche)" />
        <rect x="264" y="198" width="34" height="7" rx="2" fill="#3B2B1A" />
        <circle cx="274" cy="229" r="3.4" fill="#1C2E6B" opacity="0.8" />
        <circle cx="282" cy="231" r="3.4" fill="#1C2E6B" opacity="0.8" />
        <circle cx="289" cy="228" r="3.4" fill="#1C2E6B" opacity="0.8" />
        <circle cx="278" cy="223" r="3.4" fill="#1C2E6B" opacity="0.8" />
        <circle cx="286" cy="221" r="3.4" fill="#1C2E6B" opacity="0.8" />

        {/* Hohe Flasche rechts */}
        <path d="M 312 238 L 312 192 Q 312 182 319 177 L 319 158 L 327 158 L 327 177 Q 334 182 334 192 L 334 238 Z"
          fill="url(#ftm-flasche)" />
        <rect x="318" y="153" width="10" height="6" rx="1.5" fill="#3B2B1A" />
        <rect x="314" y="204" width="18" height="20" rx="2" fill="#6B5A1E" opacity="0.5" />

        {/* Kleiner Krug */}
        <path d="M 344 238 L 342 214 L 362 214 L 360 238 Z" fill="url(#ftm-flasche)" />
        <path d="M 362 218 Q 371 222 361 232" fill="none" stroke="#1A2B45" strokeWidth="3" />

        {/* Lichtkanten links an den Flaschen: das Licht der Lampen. */}
        <g stroke="#FFDC7A" strokeOpacity="0.22" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M 41.5 236 L 41.5 196 Q 41.5 188 48 183" />
          <path d="M 73 228 Q 69 218 74 208" />
          <path d="M 219.5 236 L 219.5 214" />
          <path d="M 313.5 236 L 313.5 192 Q 313.5 184 320 179" />
          <path d="M 267.5 236 L 267.5 208" />
        </g>
      </g>

      {/* Die Regalplatte selbst */}
      <rect x="10" y="238" width="370" height="9" rx="1.5" fill="url(#ftm-regal)" />
      <rect x="10" y="238" width="370" height="1.4" fill="url(#ftm-regal-licht)" />
      <rect x="10" y="247" width="370" height="10" fill="#000" opacity="0.22" />

      {/* --- Die Lampen, zuletzt: sie haengen vor dem Regal --- */}
      {lampenX.map((x) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="70" stroke="#2A2218" strokeWidth="1.6" />
          <circle cx={x} cy="96" r="30" fill="url(#ftm-lampe-gluehen)" />
          <path d={`M ${x - 7} 70 L ${x + 7} 70 L ${x + 19} 90 L ${x - 19} 90 Z`} fill="url(#ftm-schirm)" />
          <ellipse cx={x} cy="90" rx="19" ry="2.6" fill="#FFE7A8" opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}
