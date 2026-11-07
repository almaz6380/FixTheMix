// Die Gaeste der Bar — zwei Silhouetten am Tresen des Startbildschirms.
//
// Das Thema ist seit dem ersten Tag „eine Bar mit Glaesern und Gaesten", und
// bis zum 03.11.2026 gab es keinen einzigen Gast. Hier sitzen jetzt zwei, links
// und rechts am Rand, halb aus dem Bild: man sieht Kopf und Schultern ueber der
// Platte, von der Seite, im Gegenlicht der Lampen.
//
// LEISE wie die Rueckwand: die Koerper liegen kaum heller als der Grund, nur
// eine warme Lichtkante zeichnet den Umriss. Die neun Saefte bleiben das
// Lauteste auf dem Schirm. Keine Gesichter — eine Silhouette altert nicht und
// hat kein Geschlecht, keine Hautfarbe und kein Alter, ueber das man streiten
// muesste.
//
// Reine Zierde, deshalb `aria-hidden` und `pointer-events: none`.

/** Ein Gast. `spiegeln` dreht ihn zur Mitte, egal auf welcher Seite er sitzt. */
function Gast({ spiegeln, haar }: { spiegeln: boolean; haar: 'dutt' | 'kappe' }) {
  return (
    <svg
      viewBox="0 0 120 170"
      className="h-full w-full"
      style={spiegeln ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`gast-koerper-${haar}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#101B2E" />
          <stop offset="70%" stopColor="#1A2943" />
          <stop offset="100%" stopColor="#223451" />
        </linearGradient>
      </defs>
      {/* Schultern und Oberkoerper, nach rechts (zur Mitte) geneigt. */}
      <path
        d="M4 170 C6 128 18 104 44 96 C52 93 62 92 72 94 C96 99 110 118 114 150 L116 170 Z"
        fill={`url(#gast-koerper-${haar})`}
      />
      {/* Hals */}
      <path d="M52 98 C54 88 56 82 58 76 L72 78 C72 86 72 92 74 98 Z" fill="#16233A" />
      {/* Kopf im Profil, Nase zur Mitte */}
      <path
        d="M44 52 C44 30 58 18 74 20 C90 22 98 36 96 50 C99 54 103 58 102 61 C101 63 98 63 97 64
           C98 68 96 70 95 72 C95 78 90 82 82 82 L66 82 C52 80 44 68 44 52 Z"
        fill="#1A2942"
      />
      {haar === 'dutt' ? (
        <>
          <path d="M42 50 C40 28 56 14 76 18 C88 20 96 30 96 40 C86 34 72 34 60 40 C54 44 50 52 50 62 C46 60 43 56 42 50 Z" fill="#0A1322" />
          <circle cx="50" cy="22" r="11" fill="#0A1322" />
        </>
      ) : (
        <path d="M40 40 C42 22 58 12 76 14 C90 16 98 26 98 36 L112 40 C112 44 104 44 96 42 C82 38 62 38 44 46 Z" fill="#0A1322" />
      )}
      {/* Die Lichtkante: das warme Licht der Lampe streift Stirn, Nase und
          Schulter. Ohne sie waere der Gast nur ein dunkler Fleck. */}
      <path
        d="M78 21 C90 23 98 36 96 50 C99 54 103 58 102 61 M95 72 C95 78 90 82 82 82
           M74 96 C96 100 110 118 114 150"
        fill="none" stroke="rgba(255, 214, 150, 0.45)" strokeWidth="2" strokeLinecap="round"
      />
    </svg>
  );
}

export default function Gaeste() {
  return (
    <div className="start-gaeste" aria-hidden="true">
      <div className="start-gast start-gast-links"><Gast spiegeln={false} haar="dutt" /></div>
      <div className="start-gast start-gast-rechts"><Gast spiegeln haar="kappe" /></div>
    </div>
  );
}
