// Das Spielfeld.
//
// Bedienung bewusst zweistufig (antippen = waehlen, nochmal antippen =
// giessen) statt Ziehen: auf einem Handy ist Ziehen mit dem Daumen ueber ein
// halbes Display unangenehm, und ein abgebrochener Zug ist schwer erkennbar.
//
// Die Zeilen werden GERECHNET, nicht umgebrochen. Ein flex-wrap machte aus
// sieben Glaesern 6 + 1 — eine Zeile voll, eine mit einem einsamen Glas.
// Hier werden es 4 + 3.
//
// DER GIESSSTRAHL liegt als SVG ueber dem Brett und wird GEMESSEN, nicht
// gerechnet: die Glaeser stehen in einem Raster, dessen Pixelmasse von der
// Displaybreite abhaengen. Zwei `getBoundingClientRect` sind billiger und
// ehrlicher, als die Rasterarithmetik ein zweites Mal nachzubauen — und sie
// bleiben richtig, wenn jemand am Layout dreht.

import { useLayoutEffect, useRef, useState } from 'react';
import Glas from './Glas.tsx';
import { farbeVon } from '../engine/farben.ts';
import type { Spielstand } from '../engine/typen.ts';

/*
   Der Giesszug in Zahlen. Er ist absichtlich kein reiner Drehzug: ein Glas,
   das sich nur neigt, wackelt; eines, das sich anhebt, hinueberwandert und
   dann kippt, giesst.

   Das meiste erledigt der WINKEL, nicht die Wanderung. Bei einem Glas von
   rund 54 px Breite und 140 px Hoehe schiebt eine Drehung um 30 Grad die
   Oeffnung schon rund 50 px zur Seite — fast eine ganze Spalte. Die
   Wanderung darf deshalb klein bleiben; grosse Werte sahen aus, als haette
   jemand das Glas hochgehoben und daneben gestellt.
*/
/**
 * Die Wanderung ist der REST: sie bringt die Oeffnung genau dorthin, wo die
 * Drehung sie nicht schon hingeschoben hat. Ziel ist die Mitte des
 * Zielglases — das Glas haelt also wirklich ueber dem anderen, statt daneben
 * zu stehen und zu spucken (Josef, 27.09.2026).
 * `KIPP_MAX` deckelt das: bei einem Ziel fuenf Spalten weiter soll das Glas
 * nicht quer durch die Bar reisen. Dann uebernimmt der Strahl den Rest.
 */
const KIPP_MAX = 72;
/**
 * GRUNDhub nach oben, in Pixeln (negativ = hoch). Beim Giessen in eine hoehere
 * Reihe wird mehr daraus — siehe die Rechnung im Effekt: die Oeffnung der
 * Quelle muss ueber der des Ziels stehen, sonst fliesst es bergauf.
 */
const KIPP_HUB = -54;
/** Wie weit die Oeffnung der Quelle ueber der des Ziels steht. */
const KIPP_LUFT = 26;
/** Wie weit ein Glas ueber den Rand des Bretts hinausragen darf. */
const KIPP_UEBERHANG = 16;
const KIPP_WINKEL = 34;
/**
 * Abstand der Oeffnung vom Drehpunkt, in Glashoehen. Muss zum
 * `transform-origin: 50% 72%` von `.glas-koerper` passen.
 */
const KIPP_DREHARM = 0.72;
/**
 * Wie lange das Glas gekippt bleibt. Steht HIER und nicht in `App.tsx`,
 * damit Bewegung und Zeitgeber nicht auseinanderlaufen: der Strahl braucht
 * genauso lange (`guss-fliesst` in index.css), und ein Glas, das vorher
 * zurueckschnellt, giesst ins Nichts.
 */
export const KIPP_MS = 540;

/** Ein Guss, der gezeichnet werden soll. `nr` zaehlt hoch und startet die Bewegung neu. */
export interface Guss {
  von: number;
  nach: number;
  /** Farbcode der fliessenden Fluessigkeit. */
  farbe: number;
  menge: number;
  nr: number;
}

interface Eigenschaften {
  stand: Spielstand;
  gewaehlt: number | null;
  kippt: number | null;
  tippZiel: number | null;
  symbole: boolean;
  onTap: (b: number) => void;
  textGlas: (i: number) => string;
  guss: Guss | null;
}

interface Strahl {
  /** Das Band: oben breit, unten schmal. Eine Flaeche, kein Strich. */
  flaeche: string;
  /** Die Mittellinie — sie ist die Maske, die das Band fliessen laesst. */
  mitte: string;
  /** Deckung der Maske, etwas breiter als das Band. */
  maskeBreit: number;
  /** Bereich der Maske in Nutzerkoordinaten. */
  kasten: { x: number; y: number; w: number; h: number };
  /** Der Verlauf QUER zum Strahl — daher kommt die Rundung. */
  quer: { x1: number; y1: number; x2: number; y2: number };
  /** Wo der Strahl auftrifft, und wie gross der Spritzer wird. */
  ziel: { x: number; y: number; r: number };
  tief: string;
  ton: string;
  hell: string;
  /** Das Spitzlicht auf dem Strang — die Farbe, zu Weiss hin aufgehellt. */
  glanz: string;
  nr: number;
}

/**
 * Dieselbe Farbe, um `anteil` in Richtung Weiss gezogen. Gerechnet und nicht
 * `color-mix()`: das gibt es in aelteren WebViews nicht, und ein Verlauf, der
 * dort still auf die Grundfarbe zurueckfaellt, kostet genau das Glanzlicht,
 * um das es hier geht.
 */
function heller(hex: string, anteil: number): string {
  const n = parseInt(hex.slice(1), 16);
  const misch = (v: number) => Math.round(v + (255 - v) * anteil);
  const r = misch((n >> 16) & 255);
  const g = misch((n >> 8) & 255);
  const b = misch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Der Strahl als FLAECHE. Eine Linie mit fester Breite sieht gezogen aus, wie
 * mit einem Stift — das war Josefs „billig" am 27.09.2026. Fliessende
 * Fluessigkeit ist an der Oeffnung breit und wird nach unten duenner, weil
 * sie im Fallen schneller wird.
 *
 * Gebaut wird das Band, indem die Bezierkurve abgetastet und an jedem Punkt
 * die Normale abgetragen wird: die eine Kante hin, die andere zurueck.
 */
function band(
  x1: number, y1: number, cx: number, cy: number, x2: number, y2: number,
  wOben: number, wUnten: number,
): { d: string; minX: number; minY: number; maxX: number; maxY: number } {
  const N = 22;
  const links: string[] = [];
  const rechts: string[] = [];
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    const px = u * u * x1 + 2 * u * t * cx + t * t * x2;
    const py = u * u * y1 + 2 * u * t * cy + t * t * y2;
    // Ableitung der quadratischen Bezierkurve = die Richtung an dieser Stelle.
    const rx = 2 * u * (cx - x1) + 2 * t * (x2 - cx);
    const ry = 2 * u * (cy - y1) + 2 * t * (y2 - cy);
    const len = Math.hypot(rx, ry) || 1;
    // Die Verjuengung plus eine leichte Unruhe. Eine mathematisch gerade
    // Kante ist kein Saft, sondern ein Trichter — das Wellchen ist klein
    // genug, um nicht aufzufallen, und gross genug, dass die Kante lebt.
    const w = ((wOben * u + wUnten * t) * (1 + 0.07 * Math.sin(t * 9.4))) / 2;
    // Normale zur Richtung, mal halbe Breite.
    const ox = (-ry / len) * w;
    const oy = (rx / len) * w;
    for (const [qx, qy] of [[px + ox, py + oy], [px - ox, py - oy]] as const) {
      if (qx < minX) minX = qx;
      if (qx > maxX) maxX = qx;
      if (qy < minY) minY = qy;
      if (qy > maxY) maxY = qy;
    }
    links.push(`${(px + ox).toFixed(1)} ${(py + oy).toFixed(1)}`);
    rechts.push(`${(px - ox).toFixed(1)} ${(py - oy).toFixed(1)}`);
  }
  const kopf = rechts[rechts.length - 1]!;
  rechts.reverse();
  // Der Kopf ist RUND. Ein gerade abgeschnittenes Ende sieht aus wie ein
  // Schlauch, aus dem jemand den Stecker gezogen hat; fallende Fluessigkeit
  // endet in einem Tropfen.
  const r = (wUnten / 2).toFixed(1);
  return {
    d: `M ${links.join(' L ')} A ${r} ${r} 0 0 1 ${kopf} L ${rechts.slice(1).join(' L ')} Z`,
    minX, minY, maxX, maxY,
  };
}

export default function Brett({
  stand, gewaehlt, kippt, tippZiel, symbole, onTap, textGlas, guss,
}: Eigenschaften) {
  // Hoehere Glaeser brauchen mehr Platz nach unten, also lieber breitere
  // Zeilen als viele: bis 5 Glaeser eine Zeile, darueber gleichmaessig teilen.
  const reihen = Math.ceil(stand.glaeser / 5);
  const proReihe = Math.ceil(stand.glaeser / reihen);
  const breite = Math.min(proReihe * 74, 340);

  const rahmen = useRef<HTMLDivElement | null>(null);
  const glasRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [strahl, setStrahl] = useState<Strahl | null>(null);

  // `useLayoutEffect` und nicht `useEffect`: gemessen wird, BEVOR der Browser
  // zeichnet. Sonst blitzt der Strahl einen Bildwechsel lang an der Stelle des
  // vorigen Gusses auf.
  // Messen IST der Ausnahmefall, den `set-state-in-effect` meint: die Lage der
  // Glaeser steht erst fest, wenn der Browser das Raster gerechnet hat. Sie
  // laesst sich weder beim Rendern ableiten noch aus dem Ereignis mitgeben —
  // das entsteht in App.tsx, wo es die Glaeser gar nicht gibt. Die Alternative
  // waere, ein Ref waehrend des Renderns zu lesen, und genau davon raet die
  // CLAUDE.md ab.
  useLayoutEffect(() => {
    // Kein Zuruecksetzen auf `null`, wenn gerade nichts fliesst: gezeichnet
    // wird unten nur, wenn die gemessene Nummer zur aktuellen passt. Das
    // spart nicht nur einen Zustandswechsel, es verhindert auch, dass fuer
    // ein Bild lang der Strahl des VORIGEN Zuges ueber dem neuen Brett steht.
    if (!guss) return;
    const kasten = rahmen.current?.getBoundingClientRect();
    const a = glasRefs.current[guss.von]?.getBoundingClientRect();
    const b = glasRefs.current[guss.nach]?.getBoundingClientRect();
    if (!kasten || !a || !b) return;

    // Der Kippzug. Wohin das Glas sich neigt, kann nur hier entschieden
    // werden: `Glas` kennt seine eigene Lage nicht, und das Raster haengt an
    // der Displaybreite. Uebergeben wird es als CSS-Variablen auf dem Knopf,
    // von wo sie der Glaskoerper erbt — das kostet kein Neuzeichnen, und die
    // Werte stehen vor dem ersten Bild (`useLayoutEffect`).
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    const winkel = dx >= 0 ? KIPP_WINKEL : -KIPP_WINKEL;
    const bogen = (winkel * Math.PI) / 180;
    // Was die Drehung allein schon schafft: die Oeffnung sitzt 0,72
    // Glashoehen ueber dem Drehpunkt und beschreibt beim Kippen einen Bogen.
    // Bei 54 x 140 px sind das rund 56 px — fast eine ganze Spalte.
    const schwung = a.height * KIPP_DREHARM * Math.sin(bogen);
    // Also wandert das Glas nur noch den REST bis ueber die Mitte des Ziels.
    const wunsch = Math.max(-KIPP_MAX, Math.min(KIPP_MAX, dx - schwung));
    /*
      ... aber nur so weit, wie das Brett reicht. `<main>` schneidet ab, was
      darueber hinausragt (das braucht der Tresen), und ein Glas in der
      AEUSSERSTEN Spalte wanderte dort hinein: beim Giessen von ganz links
      nach ganz links unten ist `dx` null, der Schwung schiebt die Oeffnung
      aber nach rechts, also muss der Koerper nach links — und wurde am Rand
      abgeschnitten. Ein Stueck Ueberhang ist in Ordnung, das Brett ist
      schmaler als der Schirm; ein halbes Glas ist es nicht.
    */
    const linksRaum = (a.left - kasten.left) + KIPP_UEBERHANG;
    const rechtsRaum = (kasten.width - (a.left - kasten.left + a.width)) + KIPP_UEBERHANG;
    const kippX = Math.max(-linksRaum, Math.min(rechtsRaum, wunsch));

    // Wohin der Strahl faellt: die Oeffnung des Zielglases.
    const x2 = b.left - kasten.left + b.width * 0.5;
    const y2 = b.top - kasten.top + b.height * 0.1;

    /*
      DER HUB IST GERECHNET, NICHT FEST. Wo die Oeffnung der Quelle nach dem
      Kippen laege, wenn das Glas nicht stiege — von dort aus muss sie UEBER
      die Oeffnung des Ziels.

      Ein fester Hub war der Fehler: beim Giessen aus der unteren in die obere
      Reihe hob sich das Glas um 54 px, das Ziel lag aber 220 px hoeher. Der
      Strahl lief damit bergauf. Josef hat es sofort gesehen; kein Test konnte
      es melden, weil im DOM alles stimmte.
    */
    const muendungRuhe = (a.top - kasten.top) + a.height * KIPP_DREHARM * (1 - Math.cos(bogen));
    // Nie weniger als der Grundhub, nie so hoch, dass das Glas aus dem Brett
    // faellt — darueber liegt die Rueckwand, ein Stueck davon ist in Ordnung.
    const hub = Math.max(
      -(a.top - kasten.top) - a.height * 0.35,
      Math.min(KIPP_HUB, y2 - KIPP_LUFT - muendungRuhe),
    );

    const quelle = glasRefs.current[guss.von];
    quelle?.style.setProperty('--kipp-x', `${kippX}px`);
    quelle?.style.setProperty('--kipp-y', `${hub}px`);
    quelle?.style.setProperty('--kipp-winkel', `${winkel}deg`);

    // Startpunkt ist die Oeffnung des GEKIPPTEN Glases, nicht seine Kante im
    // Stand. Das Glas dreht um `transform-origin: 50% 72%`; die Oeffnung
    // liegt 0,72 Glashoehen darueber und beschreibt damit einen Bogen, den
    // der Strahl mitmachen muss — sonst haengt er in der Luft neben dem Glas.
    const x1 = a.left - kasten.left + a.width * 0.5 + schwung + kippX;
    const y1 = muendungRuhe + hub;
    // Der Bogen. Er richtet sich nach dem SEITLICHEN Abstand: steht das Glas
    // fast senkrecht ueber dem Ziel, faellt die Fluessigkeit auch senkrecht,
    // und ein hoher Steuerpunkt machte daraus eine unsinnige Ausbuchtung.
    const cx = (x1 + x2) / 2;
    const cy = Math.min(y1, y2) - Math.min(26, Math.max(4, Math.abs(x2 - x1) * 0.35));

    // Die Breite des Strahls. Sie haengt an der MENGE — vier Schichten auf
    // einmal sind ein Schwall, eine einzelne ein Rinnsal —, ist aber vor
    // allem eines: BREIT. Mit gut zehn Pixeln auf einer Bahn von 250 sah das
    // Ganze wieder aus wie ein Strich, und genau das hat Josef beanstandet.
    // Ein Glas, das man umleert, gibt seinen Inhalt fast in voller Breite der
    // Oeffnung ab.
    const wOben = a.width * Math.min(0.62, 0.34 + 0.05 * guss.menge);
    // Schmaler unten: fallende Fluessigkeit wird schneller, und was schneller
    // wird, wird duenner.
    const wUnten = wOben * 0.5;
    const b1 = band(x1, y1, cx, cy, x2, y2, wOben, wUnten);

    // Der Verlauf liegt QUER zum Strahl, nicht laengs — daher kommt die
    // Rundung: dunkel an beiden Kanten, ein Lichtstreifen etwas links der
    // Mitte, genau wie am Glas. Die Normale wird nach links gedreht, damit
    // das Licht immer von derselben Seite kommt wie in der ganzen Bar.
    const sx = x2 - x1;
    const sy = y2 - y1;
    const sl = Math.hypot(sx, sy) || 1;
    let nx = -sy / sl;
    let ny = sx / sl;
    if (nx > 0) { nx = -nx; ny = -ny; }
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const halb = wOben / 2;

    const f = farbeVon(guss.farbe);
    setStrahl({
      flaeche: b1.d,
      mitte: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
      maskeBreit: wOben + 8,
      kasten: {
        x: b1.minX - wOben - 12,
        y: b1.minY - wOben - 12,
        w: (b1.maxX - b1.minX) + 2 * wOben + 24,
        h: (b1.maxY - b1.minY) + 2 * wOben + 24,
      },
      quer: {
        x1: mx + nx * halb, y1: my + ny * halb,
        x2: mx - nx * halb, y2: my - ny * halb,
      },
      ziel: { x: x2, y: y2, r: wUnten * 0.9 },
      tief: f.tief,
      ton: f.ton,
      hell: f.hell,
      glanz: heller(f.hell, 0.62),
      nr: guss.nr,
    });
  }, [guss]);

  // Die Glaeser werden reihenweise ausgegeben, damit jede Reihe eine eigene
  // Leiste bekommt, auf der sie steht. Jede Reihe traegt dasselbe
  // Spaltenraster — eine halb gefuellte letzte Reihe bleibt damit
  // linksbuendig, genau wie im frueheren Ein-Gitter-Aufbau.
  const zeilen = [];
  for (let r = 0; r < reihen; r++) {
    const von = r * proReihe;
    const bis = Math.min(von + proReihe, stand.glaeser);
    const glaeser = [];
    for (let b = von; b < bis; b++) {
      const i = b;
      glaeser.push(
        <Glas
          key={b}
          stand={stand}
          glas={b}
          gewaehlt={gewaehlt === b}
          kippt={kippt === b}
          tipp={tippZiel === b}
          symbole={symbole}
          onTap={() => onTap(b)}
          beschriftung={textGlas(b)}
          innerRef={(el) => { glasRefs.current[i] = el; }}
          {...(guss && guss.nach === b
            ? { fuellt: { menge: guss.menge, nr: guss.nr } }
            : {})}
        />,
      );
    }
    zeilen.push(
      <div
        key={r}
        className="brett-reihe"
        style={{ gridTemplateColumns: `repeat(${proReihe}, minmax(0, 1fr))` }}
      >
        {glaeser}
        {/* Die vorderste Reihe steht auf dem Tresen, dessen Messingkante ihre
            Leiste ist — sonst laegen dort zwei Kanten uebereinander. */}
        {r < reihen - 1 && <div className="brett-leiste" aria-hidden="true" />}
      </div>,
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: `${breite}px` }} ref={rahmen}>
      <div className="brett">
        {/* Zuerst im DOM und damit hinter den Glaesern. Haengt an der
            Unterkante des Bretts, nicht an einer festen Hoehe. */}
        <div className="theke" aria-hidden="true" />
        {zeilen}
      </div>

      {guss && strahl && strahl.nr === guss.nr && (
        // `key` erzwingt ein neues Element je Guss — eine CSS-Bewegung laeuft
        // sonst nicht noch einmal los, wenn zweimal dasselbe gegossen wird.
        <svg
          key={strahl.nr}
          className="guss"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            {/* Quer zum Strahl, nicht laengs: dunkle Kanten, ein Lichtstreifen
                links der Mitte. Das macht aus dem flachen Band einen runden
                Fluessigkeitsstrang. */}
            <linearGradient
              id={`ftm-guss-v${strahl.nr}`}
              gradientUnits="userSpaceOnUse"
              x1={strahl.quer.x1} y1={strahl.quer.y1}
              x2={strahl.quer.x2} y2={strahl.quer.y2}
            >
              <stop offset="0%" stopColor={strahl.tief} />
              <stop offset="20%" stopColor={strahl.ton} />
              <stop offset="34%" stopColor={strahl.hell} />
              <stop offset="42%" stopColor={strahl.glanz} />
              <stop offset="52%" stopColor={strahl.hell} />
              <stop offset="74%" stopColor={strahl.ton} />
              <stop offset="100%" stopColor={strahl.tief} />
            </linearGradient>
            {/*
              Die Maske laesst den Strahl FLIESSEN. Ein Band, das als Ganzes
              erscheint und wieder verblasst, sieht aus wie ein Bild, das
              ein- und ausgeblendet wird — das war der zweite Grund fuer
              „billig". Hier laeuft erst der Kopf nach unten, dann hebt der
              Schwanz ab und der Rest faellt ins Glas. Kein Verblassen.
            */}
            <mask
              id={`ftm-guss-m${strahl.nr}`}
              maskUnits="userSpaceOnUse"
              x={strahl.kasten.x} y={strahl.kasten.y}
              width={strahl.kasten.w} height={strahl.kasten.h}
            >
              <path
                className="guss-maske"
                d={strahl.mitte}
                pathLength={1}
                fill="none"
                stroke="#fff"
                strokeWidth={strahl.maskeBreit}
                strokeLinecap="round"
              />
            </mask>
          </defs>
          <path
            d={strahl.flaeche}
            fill={`url(#ftm-guss-v${strahl.nr})`}
            mask={`url(#ftm-guss-m${strahl.nr})`}
          />
          {/* Der Aufschlag. Ohne ihn endet der Strahl im Nichts, statt
              irgendwo anzukommen. */}
          <ellipse
            className="guss-platscher"
            cx={strahl.ziel.x}
            cy={strahl.ziel.y}
            rx={strahl.ziel.r}
            ry={strahl.ziel.r * 0.42}
            fill={strahl.hell}
          />
        </svg>
      )}
    </div>
  );
}
