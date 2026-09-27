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
          height: schichtHoehe,
          // DREI Toene ueber die Hoehe, nicht eine Flaeche mit Lichtstreifen:
          // Fluessigkeit ist unten tiefer und damit dunkler, oben faellt Licht
          // durch. Vorher war jede Schicht ein flacher Farbbalken mit einer
          // hellen Kante — genau das sah billig aus.
          background: [
            // Die OBERSTE Schicht ist die einzige mit einer echten
            // Oberflaeche. Nur sie bekommt den Meniskus; auf den Schichten
            // darunter waere er eine Kante, die es gar nicht gibt.
            ...(istOben
              ? [`radial-gradient(62% 11px at 50% 0, rgba(255,255,255,0.5) 0%,`
                 + ` rgba(255,255,255,0.14) 58%, rgba(255,255,255,0) 100%)`]
              : []),
            `linear-gradient(180deg, ${f.hell} 0%, ${f.ton} 26%, ${f.ton} 60%, ${f.tief} 100%)`,
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
      className={`glas ${gewaehlt ? 'glas-gewaehlt' : ''} ${kippt ? 'glas-kippt' : ''}`}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '60 / 156' }}>
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
