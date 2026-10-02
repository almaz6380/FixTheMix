// Ein Glas.
//
// Vier Lagen machen daraus ein Gefaess statt eines Rechtecks:
//
//  1. WANDUNG als Pint-Glas mit dickem Boden (`UMRISS`, `BODEN`). Die Form ist EIN Pfad
//     in einem 100x100-Feld, der ohne Seitenverhaeltnis gestreckt wird —
//     als Maske fuer alles, was im Glas liegt, und als Strich fuer die
//     Kante. So bleibt sie bei jeder Breite dieselbe.
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
// Die Blaeschen sind aus einer Saat gerechnet, nicht zufaellig: sie sollen
// beim Neuzeichnen an derselben Stelle bleiben.
//
// ZWEI TEILE, und das ist der Punkt: `GlasKoerper` zeichnet, `Glas` macht
// daraus einen Knopf. Der Startbildschirm braucht Glaeser, die NICHT antippbar
// sind — er nimmt deshalb den Koerper allein. Vorher waren sie dort von Hand
// nachgebaut, mit eigenen Farben und eigener Form, und sind beim Umbau der
// echten Glaeser am 27.09.2026 schlicht stehengeblieben. Josef hat es sofort
// gesehen. Zwei Zeichnungen desselben Dings laufen immer auseinander.

import { farbeVon, idVon, LEER } from '../engine/farben.ts';
import type { Spielstand } from '../engine/typen.ts';
import Symbol from './Symbole.tsx';
import Garnitur from './Garnitur.tsx';

/** Anteil der Hoehe, der oben frei bleibt — ein Glas ist nie randvoll. */
const KOPFRAUM = 0.15;
/*
  Die Glasform: ein Pint-Glas mit dickem Boden — Nr. 3 aus vier Formen, die
  Josef am 02.10.2026 in Gemini hat zeichnen lassen. Davor kurz ein bauchiges
  Cocktailglas, davor das Reagenzglas vom 25.09.

  Oben volle Breite, unten rund 68 % davon, die Wand gerade, unten ein
  kurzer senkrechter Fuss. Weil sie gerade
  bleibt, sind alle Schichten fast gleich breit und gut zu zaehlen — anders
  als bei einem Glas mit Bauch.

  Warum eine Maske und kein `border-radius`: eine schraege Wand laesst sich
  mit Radien nicht zeichnen. `clip-path: path()` rechnet in Pixeln und
  skaliert nicht mit — die Maske mit `preserveAspectRatio="none"` schon.
*/
// Die Wand laeuft schraeg bis 80 %, dort geht sie in einen kurzen geraden
// Fuss ueber — genau wie in der Vorlage; ein durchgehend schraeges Glas sah
// daneben wie ein Plastikbecher aus.
const UMRISS = 'M2 0 L98 0 L84 79 Q83.2 83 83.6 87 L84 96 Q84 100 80 100'
  + ' L20 100 Q16 100 16 96 L16.4 87 Q16.8 83 16 79 Z';
const MASKE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>`
  + `<path d='${UMRISS}' fill='black'/></svg>`,
)}") 0 0 / 100% 100% no-repeat`;
/** Wo der Rand sitzt, in Prozent der Breite von jeder Seite. */
const HALS = 2;
/**
 * Der dicke Glasboden, in Prozent der Hoehe. Massives Glas, keine
 * Fluessigkeit: die sechs Schichten teilen sich die Hoehe DARUEBER.
 * Ohne ihn steht die Fluessigkeit direkt auf dem Tresen, und das Glas wirkt
 * wie ein Rohr — der Boden ist das, was aus einem Becher ein Barglas macht.
 */
const BODEN = 15;
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
            'linear-gradient(90deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.13) 6%,'
              + ' rgba(255,255,255,0.30) 19%, rgba(255,255,255,0.07) 33%,'
              + ' rgba(255,255,255,0) 50%, rgba(0,0,0,0.11) 73%,'
              + ' rgba(255,255,255,0.16) 87%, rgba(0,0,0,0.36) 100%)',
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

  return (
    <div
      className={`glas-koerper ${kippt ? 'glas-kippt' : ''} ${jubelFarbe ? 'glas-fertig' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: GLAS_SEITEN,
        ...(jubelFarbe ? { ['--i' as string]: fertig!.index } : {}),
      }}
    >
      <div className="glas-schatten" />
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
      {/* Alles, was IM Glas liegt, sitzt in einer Huelle mit der Form als
          Maske: Fluessigkeit, Zylinderlicht, Glanz. Was darueber
          hinausragte, waere neben dem Glas zu sehen. */}
      <div className="glas-form" style={{ WebkitMask: MASKE, mask: MASKE }}>
        <div className="glas-boden" style={{ height: `${BODEN}%` }} aria-hidden="true" />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: `${BODEN}%`,
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
        <div className="glas-licht" />
        {/* Der Glanz. Zwei Lichter, wie an einem echten Glas: ein schmales
            hartes vorne links (die Lichtquelle selbst) und ein weiches am
            rechten Rand (das Licht, das sich um den Zylinder legt). Ohne die
            beiden bleibt das Glas eine getoente Flaeche. */}
        <div className="glas-glanz" aria-hidden="true" />
        <div className="glas-glanz-rand" aria-hidden="true" />
        {/* Die dunkle Innenkante folgt der FORM, nicht dem Kasten. Das
            Zylinderlicht oben dunkelt nur die Raender des Kastens ab — an
            der Taille liegt das Glas aber ein Viertel weiter innen. Ein
            breiter dunkler Strich auf dem Umriss, von der Maske halbiert,
            gibt dem Glas dort seine Dicke. */}
        <svg className="glas-umriss" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={UMRISS} fill="none" stroke="rgba(10,20,36,0.42)" strokeWidth={7}
            vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      {/* Die Kante. Gewaehlt heisst: das Glas faengt Licht — die Kante wird
          warm und hell, den Rest macht der Schein dahinter (bis zum
          01.10.2026 war es ein drei Pixel dicker Zitrus-Rahmen). */}
      <svg className="glas-umriss" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={UMRISS} fill="none"
          stroke={hervor ? 'var(--color-glasrand-warm)' : 'var(--color-glasrand)'}
          strokeWidth={2.5} vectorEffect="non-scaling-stroke"
          style={{ transition: 'stroke 140ms' }} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: `${HALS}%`,
          right: `${HALS}%`,
          top: '-2px',
          height: '7%',
          borderRadius: '50%',
          border: `2.5px solid ${hervor ? 'var(--color-glasrand-warm)' : 'var(--color-glasrand-hell)'}`,
          transition: 'border-color 140ms',
        }}
      />
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
