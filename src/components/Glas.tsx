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
}

export default function Glas({
  stand, glas, gewaehlt, kippt, tipp, symbole, onTap, beschriftung,
}: Eigenschaften) {
  const hoehe = stand.hoehe;
  const fuell = stand.fuell[glas]!;
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
    schichten.push(
      <div
        key={i}
        style={{
          height: schichtHoehe,
          background: `radial-gradient(50% 9px at 50% 0, ${f.hell} 0%, ${f.hell} 66%, ${ohneDeckkraft(f.hell)} 100%), ${f.ton}`,
          transform: gehoben ? 'translateY(-6px)' : undefined,
          transition: 'transform 160ms ease-out',
          display: symbole ? 'flex' : undefined,
          alignItems: symbole ? 'center' : undefined,
          justifyContent: symbole ? 'center' : undefined,
        }}
      >
        {symbole && <Symbol id={idVon(code)} groesse={16} />}
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
            width: `${4 + (k % 3)}px`,
            height: `${4 + (k % 3)}px`,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.45)',
          }}
        />,
      );
    }
  }

  return (
    <button
      type="button"
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
            background: 'rgba(8,14,26,0.86)',
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
function ohneDeckkraft(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0)`;
}
