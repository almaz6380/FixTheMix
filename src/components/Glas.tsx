// Ein Glas.
//
// Seit dem 06.11.2026 ist das Glas GERENDERT (Josef: „Ich will 3D-Glaeser",
// gewaehlt: der Becher). Es besteht aus vier Lagen:
//
//  1. RUECKWAND als Bild (`glas-becher-hinten.webp`): Innenseite der hinteren
//     Wand und der Glasboden — liegt UNTER dem Saft.
//  2. SCHICHTEN, maskiert mit dem Innenumriss des Bechers. Jede traegt eine
//     helle Kuppe an der Oberkante; das macht aus einem Farbstreifen
//     Fluessigkeit.
//  3. FRONT als Bild (`glas-becher-vorn.webp`): Vorderwand, Rand, Spiegelungen
//     und Lichtkanten — liegt UEBER dem Saft. Durch sie sieht man ihn.
//  4. STANDSCHATTEN und farbiger LICHTFLECK darunter. Ohne den Schatten
//     schwebt jedes Glas, egal wie gut der Rest gezeichnet ist.
//
// Beide Bilder und der Umriss kommen aus `tools/glas-3d-rendern.mjs`: das
// Profil wird in three.js um die Achse gedreht und einmal gerendert. Der
// Umriss ist AUS DEM PROFIL GERECHNET, nicht geschaetzt — deshalb sitzt der
// Saft genau in der Innenwand. Echtzeit-3D im Spiel haette Giessen, Strahl und
// Tests neu verlangt und auf billigen Androids bei 14 Glaesern geruckelt.
// (Davor: ein Pint-Glas aus SVG-Pfad und CSS-Licht, 02.10.–06.11.2026.)
//
// Die Blaeschen sind aus einer Saat gerechnet, nicht zufaellig: sie sollen
// beim Neuzeichnen an derselben Stelle bleiben.
//
// ZWEI TEILE, und das ist der Punkt: `GlasKoerper` zeichnet, `Glas` macht
// daraus einen Knopf. Der Startbildschirm braucht Glaeser, die NICHT antippbar
// sind — er nimmt deshalb den Koerper allein. Zwei Zeichnungen desselben Dings
// laufen immer auseinander.

import { farbeVon, idVon, LEER } from '../engine/farben.ts';
import type { Spielstand } from '../engine/typen.ts';
import Symbol from './Symbole.tsx';
import Garnitur from './Garnitur.tsx';
import formen from '../assets/glas/formen.json';
import rueckwand from '../assets/glas/glas-becher-hinten.webp';
import front from '../assets/glas/glas-becher-vorn.webp';

/** Anteil der Hoehe, der oben frei bleibt — ein Glas ist nie randvoll. */
const KOPFRAUM = 0.15;
/**
 * Der Innenumriss des Bechers im 100x100-Feld, ohne Seitenverhaeltnis
 * gestreckt — als Maske fuer alles, was im Glas liegt. Warum eine Maske:
 * `clip-path: path()` rechnet in Pixeln und skaliert nicht mit.
 */
const MASKE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>`
  + `<path d='${formen.becher.umriss}' fill='black'/></svg>`,
)}") 0 0 / 100% 100% no-repeat`;
/**
 * Wo der Saft beginnt, in Prozent der Hoehe von unten: der tiefste Punkt des
 * vorderen Bogens ueber dem Glasboden. Die Schichten teilen sich die Hoehe
 * DARUEBER.
 */
const BODEN = formen.becher.boden;

/** Breite zu Hoehe. Wer den Koerper ohne Brett benutzt, gibt nur die Breite an. */
export const GLAS_SEITEN = '60 / 156';

interface KoerperEigenschaften {
  /** Farbcodes von UNTEN nach oben. Die Laenge ist der Fuellstand. */
  fuellung: readonly number[];
  /** Wie viele Schichten ins Glas passen. Bestimmt die Hoehe einer Schicht. */
  hoehe: number;
  /**
   * Ab diesem Index leuchtet der oberste Lauf auf — die Vorschau, die VOR dem
   * Giessen zeigt, was fliessen wuerde. `undefined` = keine.
   */
  laufAb?: number;
  /** Gewaehlt oder vom Tipp gezeigt: heller Rand und weicher Schein. */
  hervor?: boolean;
  /**
   * Das Brett ist geloest, und dieses Glas ist voll: es hebt sich kurz und
   * leuchtet in seiner eigenen Farbe. `index` staffelt die Glaeser, damit der
   * Jubel als Welle ueber die Bar laeuft statt als ein Schlag.
   */
  fertig?: { index: number };
  /** Farbenblind-Modus: ein Zeichen auf jeder Schicht. */
  symbole?: boolean;
  /** Streut die Blaeschen. Gleiche Saat heisst gleiche Stellen. */
  saat?: number;
  /** Laeuft gerade der Giesszug (siehe `.glas-kippt`). */
  kippt?: boolean;
  /**
   * Es wird gerade HIER HINEIN gegossen: die obersten `menge` Schichten
   * wachsen von null auf ihre Hoehe, eine nach der anderen. Ohne das ist die
   * Fluessigkeit einfach da, und kein Strahl der Welt macht daraus ein
   * Eingiessen. `nr` zaehlt je Guss hoch und startet die Bewegung neu.
   */
  fuellt?: { menge: number; nr: number };
}

export function GlasKoerper({
  fuellung, hoehe, laufAb, hervor = false, symbole = false, saat = 0, kippt = false,
  fuellt, fertig,
}: KoerperEigenschaften) {
  const fuell = fuellung.length;
  // Bei sieben oder acht Schichten (den Experten-Leveln) ist eine Schicht nur
  // noch rund 16 px hoch — ein 16-px-Zeichen laege dann ueber der Kante.
  const zeichenGroesse = hoehe >= 7 ? 12 : 16;
  /** Anteil der Glashoehe, den EINE Schicht einnimmt, in Prozent. */
  const schichtAnteil = ((1 - KOPFRAUM) / hoehe) * 100;

  // Ab dieser Schicht kommt gerade etwas an.
  const abFuellt = fuellt ? Math.max(0, fuell - fuellt.menge) : fuell;

  /*
    LAEUFE, NICHT SCHICHTEN. Vier gleiche Schichten uebereinander wurden bis
    zum 27.09.2026 als vier Bloecke mit drei dunklen Trennlinien gezeichnet —
    und jeder trug denselben Verlauf hell->tief noch einmal. Das las sich als
    Stapel Baukloetze, und genau das war Josefs „sieht noch billig aus".
    Fluessigkeit derselben Farbe ist EIN Koerper: ein Verlauf ueber die ganze
    Hoehe, eine Oberflaeche, keine Naht.

    Zaehlen muss man sie trotzdem koennen — ob ein Glas zwei oder drei einer
    Farbe hat, entscheidet den naechsten Zug. Dafuer traegt ein Lauf ein
    hauchduennes helles Haerchen je Schichtgrenze (`repeating-linear-gradient`
    mit `calc(100% / n)`, Deckkraft 0,07). Sichtbar genug zum Zaehlen, zu
    schwach, um zu trennen.
  */
  const laeufe: { code: number; von: number; anzahl: number }[] = [];
  for (let i = 0; i < fuell; i++) {
    const code = fuellung[i]!;
    const letzter = laeufe[laeufe.length - 1];
    if (letzter && letzter.code === code) letzter.anzahl++;
    else laeufe.push({ code, von: i, anzahl: 1 });
  }

  const schichten = laeufe.map((lauf, k) => {
    const f = farbeVon(lauf.code);
    const istOben = k === laeufe.length - 1;
    const n = lauf.anzahl;
    // Hervorgehoben wird nur der OBERSTE Lauf — das ist genau der, der
    // fliessen wuerde, und `laufAb` markiert seinen Anfang.
    const gehoben = laufAb !== undefined && lauf.von >= laufAb;
    // Es kommt immer nur EINE Farbe an, also waechst genau ein Lauf. Er
    // steigt in einem Zug von seiner alten auf seine neue Hoehe — vier
    // Schichten, die einzeln nacheinander aufpoppen, waren wieder Bloecke.
    const kommtAn = fuellt !== undefined && lauf.von + n > abFuellt;
    const vorher = kommtAn ? Math.max(0, abFuellt - lauf.von) : n;

    return (
      <div
        // Der Schluessel traegt die Gussnummer mit, DAMIT die Bewegung neu
        // laeuft: React nimmt sonst dasselbe Element wieder her, und eine
        // CSS-Bewegung, die schon gelaufen ist, laeuft an einem bestehenden
        // Element kein zweites Mal los.
        key={kommtAn ? `${lauf.von}-${fuellt!.nr}` : lauf.von}
        className={kommtAn ? 'schicht-fuellt' : undefined}
        style={{
          position: 'relative',
          height: `${schichtAnteil * n}%`,
          // Von wo aus der Lauf waechst. Steht als Variable da, weil die
          // Keyframes nur ein `from` haben — die Zielhoehe ist die, die das
          // Element ohnehin hat.
          ...(kommtAn
            ? {
              ['--von' as string]: `${schichtAnteil * vorher}%`,
              // 350 ms ist der Moment, in dem der Kopf des Strahls ankommt
              // (66 % von KIPP_MS). Laufen die Zahlen auseinander, fuellt
              // sich das Glas, bevor etwas fliesst — oder erst danach.
              animationDelay: '350ms',
              // Ein Schwall braucht laenger zum Steigen als ein Schluck.
              animationDuration: `${190 + 55 * (n - vorher)}ms`,
            }
            : {}),
          background: [
            // QUER schattiert, und das ist der eigentliche Unterschied
            // zwischen einem Farbbalken und Fluessigkeit in einem Zylinder:
            // dunkel an beiden Raendern, ein Spitzlicht links, ein
            // Gegenlicht rechts.
            // Weniger Weiss und weniger Schwarz als bis zum 05.11.2026
              // (0,30/0,34): der Schleier wusch die Farben aus — Josef wollte
              // sie kraeftiger. Die Woelbung bleibt, nur leiser.
            'linear-gradient(90deg, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0.08) 6%,'
                + ' rgba(255,255,255,0.20) 19%, rgba(255,255,255,0.04) 33%,'
                + ' rgba(255,255,255,0) 50%, rgba(0,0,0,0.07) 73%,'
                + ' rgba(255,255,255,0.10) 87%, rgba(0,0,0,0.28) 100%)',
            // Die Haerchen zum Zaehlen — nur, wenn es etwas zu zaehlen gibt.
            ...(n > 1
              ? [`repeating-linear-gradient(180deg, rgba(255,255,255,0) 0,`
                + ` rgba(255,255,255,0) calc(100% / ${n} - 1px),`
                + ` rgba(255,255,255,0.07) calc(100% / ${n} - 1px),`
                + ` rgba(255,255,255,0.07) calc(100% / ${n}))`]
              : []),
            // EIN Verlauf ueber den ganzen Lauf, nicht einer je Schicht:
            // Fluessigkeit ist unten tiefer und damit dunkler.
            `linear-gradient(180deg, ${f.hell} 0%, ${f.ton} 22%, ${f.ton} 62%, ${f.tief} 100%)`,
          ].join(', '),
          // Die Grenze zwischen zwei VERSCHIEDENEN Fluessigkeiten ist eine
          // dunkle Linie. Innerhalb eines Laufes gibt es keine.
          boxShadow: istOben ? undefined : 'inset 0 1px 0 rgba(12,20,34,0.24)',
          overflow: 'hidden',
        }}
      >
        {/*
          Die Vorschau dessen, was fliessen wuerde. Bis zum 01.10.2026 hob
          sich der Lauf dafuer um 6 px — darunter klaffte dann eine dunkle
          Luecke im Glas, die sich wie ein Darstellungsfehler las. Jetzt
          LEUCHTET er: ein Lichtband laeuft langsam ueber ihn hinweg. Man sieht
          genauso vor dem Giessen, was fliesst, und die Fluessigkeit bleibt
          ein Koerper.
        */}
        {gehoben && <div className="lauf-leuchtet" aria-hidden="true" />}
        {/*
          Die Oberflaeche des obersten Laufes ist ein OVAL, kein Strich. In
          eine Roehre sieht man hinein — die hintere Kante der Fluessigkeit
          liegt hoeher als die vordere, deshalb ragt das Oval zur Haelfte
          ueber den Lauf hinaus.
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
        {/* Das Farbenblind-Zeichen gehoert auf jede SCHICHT, nicht auf jeden
            Lauf — sonst traegt ein Lauf aus vier Schichten nur ein Zeichen,
            und der Modus zaehlt nicht mehr mit. */}
        {symbole && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {Array.from({ length: n }, (_, z) => (
              <div
                key={z}
                style={{
                  flex: '1 1 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Symbol id={idVon(lauf.code)} groesse={zeichenGroesse} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  });

  const blasen = [];
  if (fuell > 0) {
    for (let k = 0; k < 3; k++) {
      const h = (saat * 37 + k * 53) % 100;
      const hoch = 6 + ((saat * 29 + k * 41) % Math.max(1, Math.round(fuell * 12)));
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

  // Der Jubel leuchtet in der Farbe des Glases — ein volles Glas ist
  // einfarbig, also genuegt die unterste Schicht.
  const jubelFarbe = fertig && fuell > 0 ? farbeVon(fuellung[0]!).hell : null;
  // Fertig gemixt: randvoll und eine Sorte. Dann ist es ein DRINK und
  // bekommt einen Strohhalm — schon waehrend der Partie, nicht
  // erst beim Sieg. Man sieht so auf einen Blick, was erledigt ist.
  const drink = fuell === hoehe && laeufe.length === 1 ? farbeVon(fuellung[0]!) : null;
  const bodenTon = fuell > 0 ? farbeVon(fuellung[0]!).ton : null;

  return (
    <div
      className={`glas-koerper ${hervor ? 'glas-hervor' : ''} ${kippt ? 'glas-kippt' : ''} ${jubelFarbe ? 'glas-fertig' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: GLAS_SEITEN,
        ...(jubelFarbe ? { ['--i' as string]: fertig!.index } : {}),
      }}
    >
      <div className="glas-schatten" />
      {/* Licht, das durch die Fluessigkeit faellt, legt einen farbigen Fleck
          auf die Platte — wie ein Saftglas unter einer Barlampe. Nur bei
          einem Glas mit Inhalt, in der Farbe der untersten Schicht. */}
      {bodenTon && <div className="glas-lichtfleck" style={{ background: `radial-gradient(50% 50% at 50% 50%, ${bodenTon} 0%, transparent 70%)` }} />}
      {hervor && <div className="glas-schein" />}
      {jubelFarbe && (
        <div
          className="glas-jubel"
          aria-hidden="true"
          style={{
            background: `radial-gradient(56% 50% at 50% 55%, ${jubelFarbe} 0%, transparent 72%)`,
          }}
        />
      )}
      {/* Rueckwand unter dem Saft, Front darueber; der Saft sitzt in einer
          Huelle mit dem Innenumriss als Maske. */}
      <img className="glas-3d-bild" src={rueckwand} alt="" draggable={false} />
      <div className="glas-form" style={{ WebkitMask: MASKE, mask: MASKE }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: `${BODEN}%`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column-reverse',
          }}
        >
          {schichten}
          {blasen}
        </div>
      </div>
      <img className="glas-3d-bild" src={front} alt="" draggable={false} />
      {drink && <Garnitur farbe={drink} spiegel={KOPFRAUM * (100 - BODEN)} />}
    </div>
  );
}

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
  /** Es wird gerade hier hinein gegossen — siehe `GlasKoerper`. */
  fuellt?: { menge: number; nr: number };
  /** Das Brett ist geloest — siehe `GlasKoerper`. */
  fertig?: { index: number };
  /**
   * Wird von `Brett` gesetzt, um die Lage des Glases zu messen — daraus
   * entsteht der Giessstrahl. Bewusst eine Eigenschaft statt `forwardRef`:
   * gemessen wird genau EIN Element, und ein Weiterreichen von Refs waere
   * hier nur Zeremonie.
   */
  innerRef?: (el: HTMLButtonElement | null) => void;
}

export default function Glas({
  stand, glas, gewaehlt, kippt, tipp, symbole, onTap, beschriftung, innerRef, fuellt, fertig,
}: Eigenschaften) {
  const hoehe = stand.hoehe;
  const fuell = stand.fuell[glas]!;

  const fuellung = [];
  for (let i = 0; i < fuell; i++) fuellung.push(stand.zellen[glas * hoehe + i]!);

  // Der oberste zusammenhaengende Lauf hebt sich mit, wenn das Glas gewaehlt
  // ist — so sieht man vor dem Giessen, WAS fliessen wuerde.
  const obersteFarbe = fuell > 0 ? stand.zellen[glas * hoehe + fuell - 1]! : LEER;
  let laufAb = fuell;
  while (laufAb > 0 && stand.zellen[glas * hoehe + laufAb - 1] === obersteFarbe) laufAb--;

  return (
    <button
      type="button"
      ref={innerRef}
      onClick={onTap}
      aria-label={beschriftung}
      data-glas
      className={`glas ${gewaehlt ? 'glas-gewaehlt' : ''} ${kippt ? 'glas-giesst' : ''}`}
    >
      {/*
        Der Kippzug liegt auf dem Koerper und nicht auf diesem Knopf. Der Knopf
        ist die Trefferflaeche: wandert er waehrend des Giessens um vierzig
        Pixel zur Seite, zielt der naechste Tipp ins Leere oder auf den
        Nachbarn. Der Oberflaechentest tippt im Abstand von 45 ms, ein Mensch
        ist kaum langsamer. So bleibt der Knopf, wo er steht, und nur das Bild
        bewegt sich.
      */}
      <GlasKoerper
        fuellung={fuellung}
        hoehe={hoehe}
        {...(gewaehlt ? { laufAb } : {})}
        hervor={gewaehlt || tipp}
        symbole={symbole}
        saat={glas}
        kippt={kippt}
        {...(fuellt ? { fuellt } : {})}
        {...(fertig ? { fertig } : {})}
      />
    </button>
  );
}
