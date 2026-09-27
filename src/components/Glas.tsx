// Ein Glas.
//
// Vier Lagen machen daraus ein Gefaess statt eines Rechtecks:
//
//  1. WANDUNG mit rundem Boden. Die Radien sind in Prozent angegeben, damit
//     das Glas bei jeder Breite dieselbe Form behaelt.
//  2. SCHICHTEN, jede mit einer hellen Kuppe an der Oberkante. Die Kuppe ist
//     ein radial-gradient IM Hintergrund der Schicht — dadurch kostet die
//     gewoelbte Oberflaeche kein einziges zusaetzliches Element. Sie ist das,
//     was aus einem Farbstreifen Fluessigkeit macht.
//  3. ZYLINDERLICHT: ein Verlauf quer ueber die Wandung, dunkle Kante,
//     Spitzlicht bei 25 %, Gegenlicht von rechts. Auf allen Glaesern gleich,
//     damit die Bar eine Lichtquelle hat und nicht sechs.
//  4. RAND als Ellipse und ein STANDSCHATTEN darunter. Ohne den Schatten
//     schwebt jedes Glas, egal wie gut der Rest gezeichnet ist.
//
// Die Blaeschen sind aus dem Glasindex gerechnet, nicht zufaellig: sie sollen
// beim Neuzeichnen an derselben Stelle bleiben.

import { farbeVon, idVon, LEER } from '../engine/farben.ts';
import type { Spielstand } from '../engine/typen.ts';
import Symbol from './Symbole.tsx';

/** Anteil der Hoehe, der oben frei bleibt — ein Glas ist nie randvoll. */
const KOPFRAUM = 0.15;
const FORM = '13% 13% 50% 50% / 4% 4% 23% 23%';

interface Eigenschaften {
  stand: Spielstand;
  glas: number;
  gewaehlt: boolean;
  kippt: boolean;
  /** Vom Tipp hervorgehoben. */
  tipp: boolean;
  symbole: boolean;
  onTap: () => void;
  beschriftung: string;
  /**
   * Wird von `Brett` gesetzt, um die Lage des Glases zu messen — daraus
   * entsteht der Giessstrahl. Bewusst eine Eigenschaft statt `forwardRef`:
   * gemessen wird genau EIN Element, und ein Weiterreichen von Refs waere
   * hier nur Zeremonie.
   */
  innerRef?: (el: HTMLButtonElement | null) => void;
}

export default function Glas({
  stand, glas, gewaehlt, kippt, tipp, symbole, onTap, beschriftung, innerRef,
}: Eigenschaften) {
  const hoehe = stand.hoehe;
  const fuell = stand.fuell[glas]!;
  // Bei sieben oder acht Schichten (den Experten-Leveln) ist eine Schicht nur
  // noch rund 16 px hoch — ein 16-px-Zeichen laege dann ueber der Kante.
  const zeichenGroesse = hoehe >= 7 ? 12 : 16;
  const schichtHoehe = `${((1 - KOPFRAUM) / hoehe) * 100}%`;
  const hervor = gewaehlt || tipp;

  // Der oberste zusammenhaengende Lauf hebt sich mit, wenn das Glas gewaehlt
  // ist — so sieht man vor dem Giessen, WAS fliessen wuerde.
  const obersteFarbe = fuell > 0 ? stand.zellen[glas * hoehe + fuell - 1]! : LEER;
  let laufAb = fuell;
  while (laufAb > 0 && stand.zellen[glas * hoehe + laufAb - 1] === obersteFarbe) laufAb--;

  const schichten = [];
  for (let i = 0; i < fuell; i++) {
    const code = stand.zellen[glas * hoehe + i]!;
    const f = farbeVon(code);
    const gehoben = gewaehlt && i >= laufAb;
    const istOben = i === fuell - 1;
    schichten.push(
      <div
        key={i}
        style={{
          position: 'relative',
          height: schichtHoehe,
          // DREI Toene ueber die Hoehe, nicht eine Flaeche mit Lichtstreifen:
          // Fluessigkeit ist unten tiefer und damit dunkler, oben faellt Licht
          // durch. Vorher war jede Schicht ein flacher Farbbalken mit einer
          // hellen Kante — genau das sah billig aus.
          background: [
            // QUER schattiert, und das ist der eigentliche Unterschied
            // zwischen einem Farbbalken und Fluessigkeit in einem Zylinder:
            // dunkel an beiden Raendern, ein Spitzlicht links, ein
            // Gegenlicht rechts. Nur von oben nach unten zu verlaufen hat
            // flach gewirkt, egal wie gut die Toene waren.
            'linear-gradient(90deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.13) 6%,'
              + ' rgba(255,255,255,0.30) 19%, rgba(255,255,255,0.07) 33%,'
              + ' rgba(255,255,255,0) 50%, rgba(0,0,0,0.11) 73%,'
              + ' rgba(255,255,255,0.16) 87%, rgba(0,0,0,0.36) 100%)',
            `linear-gradient(180deg, ${f.hell} 0%, ${f.ton} 28%, ${f.ton} 62%, ${f.tief} 100%)`,
          ].join(', '),
          // Die Grenze zwischen zwei Fluessigkeiten ist eine dunkle Linie,
          // keine Rasierklinge. Die oberste Schicht hat darueber nichts mehr.
          boxShadow: istOben ? undefined : 'inset 0 1px 0 rgba(12,20,34,0.24)',
          transform: gehoben ? 'translateY(-6px)' : undefined,
          transition: 'transform 160ms ease-out',
          display: symbole ? 'flex' : undefined,
          alignItems: symbole ? 'center' : undefined,
          justifyContent: symbole ? 'center' : undefined,
        }}
      >
        {/*
          Die Oberflaeche der obersten Schicht ist ein OVAL, kein Strich. In
          eine Roehre sieht man hinein — die hintere Kante der Fluessigkeit
          liegt hoeher als die vordere, deshalb ragt das Oval zur Haelfte
          ueber die Schicht hinaus. Vorher war es ein heller Farbverlauf mit
          gerader Oberkante, und genau daran sah man, dass das Glas flach ist.
        */}
        {istOben && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: '11px',
              transform: 'translateY(-50%)',
              borderRadius: '50%',
              background: `radial-gradient(64% 130% at 50% 14%, rgba(255,255,255,0.8) 0%,`
                + ` ${f.hell} 42%, ${f.ton} 100%)`,
              boxShadow: `inset 0 -1px 2px ${f.tief}`,
            }}
          />
        )}
        {symbole && <Symbol id={idVon(code)} groesse={zeichenGroesse} />}
      </div>,
    );
  }

  const blasen = [];
  if (fuell > 0) {
    for (let k = 0; k < 3; k++) {
      const h = (glas * 37 + k * 53) % 100;
      const hoch = 6 + ((glas * 29 + k * 41) % Math.max(1, Math.round(fuell * 12)));
      blasen.push(
        <div
          key={`b${k}`}
          style={{
            position: 'absolute',
            left: `${14 + (h % 60)}%`,
            bottom: `${hoch}%`,
            width: `${2 + (k % 3)}px`,
            height: `${2 + (k % 3)}px`,
            borderRadius: '50%',
            // Ein Blaeschen ist eine Hohlkugel: heller Rand, klarer Kern.
            // Vorher waren es drei satte weisse Punkte.
            background: 'radial-gradient(circle at 34% 30%, rgba(255,255,255,0.75) 0%,'
              + ' rgba(255,255,255,0.12) 55%, rgba(255,255,255,0.34) 100%)',
          }}
        />,
      );
    }
  }

  return (
    <button
      type="button"
      ref={innerRef}
      onClick={onTap}
      aria-label={beschriftung}
      className={`glas ${gewaehlt ? 'glas-gewaehlt' : ''} ${kippt ? 'glas-giesst' : ''}`}
    >
      {/*
        Der Kippzug liegt auf DIESEM Element und nicht auf dem Knopf darueber.
        Der Knopf ist die Trefferflaeche: wandert er waehrend des Giessens um
        vierzig Pixel zur Seite, zielt der naechste Tipp ins Leere oder auf den
        Nachbarn. Der Oberflaechentest tippt im Abstand von 45 ms, ein Mensch
        ist kaum langsamer. So bleibt der Knopf, wo er steht, und nur das Bild
        bewegt sich.
      */}
      <div
        className={`glas-koerper ${kippt ? 'glas-kippt' : ''}`}
        style={{ position: 'relative', width: '100%', aspectRatio: '60 / 156' }}
      >
        <div className="glas-schatten" />
        {hervor && <div className="glas-schein" />}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: FORM,
            // HELLER als der Grund, nicht dunkler. Vorher war der leere Teil
            // eines Glases fast schwarz — ein leeres Glas las sich als Loch
            // im Hintergrund statt als Glas. Milchig durchscheinend ist es
            // das, was es sein soll: ein Gefaess, durch das man die Bar sieht.
            background:
              'linear-gradient(100deg, rgba(190,220,255,0.30) 0%, rgba(190,220,255,0.15) 30%,'
              + ' rgba(190,220,255,0.11) 62%, rgba(190,220,255,0.24) 100%)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column-reverse',
          }}
        >
          {schichten}
          {blasen}
        </div>
        <div className="glas-licht" style={{ borderRadius: FORM }} />
        {/* Der Glanz. Zwei Lichter, wie an einem echten Glas: ein schmales
            hartes vorne links (die Lichtquelle selbst) und ein weiches am
            rechten Rand (das Licht, das sich um den Zylinder legt). Ohne die
            beiden bleibt das Glas eine getoente Flaeche. */}
        <div className="glas-glanz" aria-hidden="true" />
        <div className="glas-glanz-rand" aria-hidden="true" />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: FORM,
            border: `${hervor ? 3 : 2.5}px solid ${hervor ? 'var(--color-zitrus)' : 'var(--color-glasrand)'}`,
            borderTopColor: 'transparent',
            transition: 'border-color 140ms',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '-2px',
            height: '10%',
            borderRadius: '50%',
            border: `${hervor ? 3 : 2.5}px solid ${hervor ? 'var(--color-zitrus)' : 'var(--color-glasrand-hell)'}`,
            transition: 'border-color 140ms',
          }}
        />
      </div>
    </button>
  );
}

/**
 * Dieselbe Farbe mit Deckkraft 0. Nicht `transparent` verwenden: das ist
 * rgba(0,0,0,0) und kann im Verlauf einen dunklen Saum erzeugen.
 */
