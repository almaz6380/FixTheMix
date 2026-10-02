// Die Garnitur auf einem fertigen Drink: ein Strohhalm mit Streifen in der
// Farbe der Sorte.
//
// Das Bild kommt aus Gemini (Josef, 02.10.2026: „ich will schaerfere
// Grafiken"). Erzeugt werden die neun Fassungen in src/assets/garnitur/ mit
// `node tools/garnitur-bilder.mjs` aus der Vorlage in tools/vorlagen/:
// freigestellt, gekuerzt und die Streifen umgefaerbt. Sie liegen IM Bundle
// (Vite-Import, gehasht) und nicht im Netz — die Store-App laeuft offline.
//
// Bis zum 02.10.2026 steckte dazu eine Frucht der Sorte an der linken
// Glaskante. Josef hat sie wieder entfernt; der Strohhalm allein reicht.
//
// DER HALM ENDET AN DER OBERFLAECHE. Saft ist nicht durchsichtig — ein Halm,
// der durch die Fluessigkeit hindurch zu sehen ist, sieht aufgeklebt aus,
// nicht eingesteckt (Josef: „nur da sichtbar, wo die Fluessigkeit aufhoert").
// Abgeschnitten wird per `clip-path`; die Kante ist waagrecht und liegt genau
// auf dem Spiegel. Wo der liegt, rechnet `Glas.tsx` und gibt es herein.

import type { Farbe, FarbId } from '../engine/farben.ts';
import rot from '../assets/garnitur/halm-rot.webp';
import gelb from '../assets/garnitur/halm-gelb.webp';
import blau from '../assets/garnitur/halm-blau.webp';
import orange from '../assets/garnitur/halm-orange.webp';
import gruen from '../assets/garnitur/halm-gruen.webp';
import lila from '../assets/garnitur/halm-lila.webp';
import minze from '../assets/garnitur/halm-minze.webp';
import kokos from '../assets/garnitur/halm-kokos.webp';
import kaffee from '../assets/garnitur/halm-kaffee.webp';

const HALM: Record<FarbId, string> = {
  rot, gelb, blau, orange, gruen, lila, minze, kokos, kaffee,
};

/** Oberkante des Halms, in Prozent der Glashoehe. Er ragt eine halbe
    Glasbreite ueber den Rand (0,5 / 2,6 ≈ 19 %) — hoeher stuende er im Glas
    der Reihe darueber. */
const HALM_OBEN = -19;
/** Laenge des Bildes, in Prozent der Glashoehe. Der Teil unter dem Spiegel
    wird abgeschnitten; er muss nur lang genug sein, um ihn sicher zu
    erreichen. */
const HALM_HOEHE = 44;

/**
 * Der Strohhalm. Faengt keinen Klick — das Glas darunter bleibt antippbar.
 * `spiegel`: Oberflaeche der Fluessigkeit, in Prozent der Glashoehe von oben.
 */
export default function Garnitur({ farbe, spiegel }: { farbe: Farbe; spiegel: number }) {
  const weg = Math.max(0, ((HALM_OBEN + HALM_HOEHE - spiegel) / HALM_HOEHE) * 100);
  return (
    <div className="garnitur" aria-hidden="true" data-sorte={farbe.id}>
      <img
        className="garnitur-halm"
        src={HALM[farbe.id]}
        alt=""
        draggable={false}
        style={{
          top: `${HALM_OBEN}%`,
          height: `${HALM_HOEHE}%`,
          clipPath: `inset(0 0 ${weg.toFixed(2)}% 0)`,
        }}
      />
    </div>
  );
}
