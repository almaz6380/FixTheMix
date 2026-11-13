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
import { istGeloest } from '../engine/zustand.ts';

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
 * Seit dem 13.11.2026 faehrt die Quelle dafuer auch weit (Josef: „sieht nicht
 * real aus" — vorher goss sie aus der Ferne, und der Strahl fiel quer ueber
 * andere Glaeser). `KIPP_MAX` ist nur noch ein Netz.
 */
const KIPP_MAX = 400;
/** Wie weit die Oeffnung der Quelle ueber der des Ziels steht. */
const KIPP_LUFT = 26;
/** Wie weit ein Glas ueber den Rand des Bretts hinausragen darf. */
const KIPP_UEBERHANG = 16;
/**
 * Wie weit das Glas kippt. Bis zum 13.11.2026 waren es 34 Grad — Josef: „sieht
 * nicht real aus". Bei 34 Grad laeuft aus einem echten Glas nichts heraus;
 * wer umleert, legt es fast waagrecht. Bei 65 Grad steht der Rand unten, und
 * der Saft faellt sichtbar ueber die Kante.
 */
const KIPP_WINKEL = 65;
/** Halbe Breite der Oeffnung, in Glasbreiten (der Becher fuellt das Bild fast aus). */
const KIPP_HALBBREIT = 0.36;
/**
 * Abstand der Oeffnung vom Drehpunkt, in Glashoehen. Muss zum
 * `transform-origin: 50% 72%` von `.glas-koerper` passen.
 */
const KIPP_DREHARM = 0.72;
/**
 * Wie lange ein Guss dauert — die EINE Zahl, an der alles haengt: der
 * Zeitgeber in `App.tsx`, die Bewegungen des Strahls (als `--guss-ms` an den
 * Strahl gereicht, `guss-*` in index.css) und das Steigen im Zielglas
 * (`GUSS_ANKUNFT`/`GUSS_FLIESST` in Glas.tsx).
 *
 * Bis zum 13.11.2026 waren es 540 ms, und der Strahl war davon nur rund
 * 290 ms zu sehen — Josef: „laeuft nicht schoen fluessig". Das las sich als
 * Aufblitzen, nicht als Giessen. Jetzt fliesst er gut eine halbe Sekunde, und seit das Glas
 * zum Ziel hinfaehrt (13.11.2026), dauert der ganze Zug 1,1 s.
 */
export const KIPP_MS = 1100;
/** Anteil von KIPP_MS, an dem der Saft den Rand der Quelle verlaesst (30 % in `guss-fliesst`). */
export const GUSS_LOS = 0.3;
/** Anteil von KIPP_MS, an dem der Kopf des Strahls im Zielglas ankommt (46 % in `guss-fliesst`). */
export const GUSS_ANKUNFT = 0.46;
/** Anteil von KIPP_MS, an dem das Ende des Strahls abreisst (72 % in `guss-fliesst`). */
export const GUSS_ABRISS = 0.72;

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
  /** Wohin die Glanzlinien von der Mitte weg zur Lichtseite ruecken. */
  glanzVersatz: { x: number; y: number };
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
  /*
    Kleine Bretter bekommen GROESSERE Glaeser. Mit festen 74 px je Spalte
    standen auf Level 1 vier schmale Glaeser unten auf dem Tresen, und darueber
    war zwei Drittel des Schirms leere Wand. Bis zwei Reihen ist Platz genug
    (gemessen: 2 x 4 bei 340 px Breite sind 410 px hoch); ab drei Reihen bleibt
    es bei 74, denn dort liegt mit 539 px die Decke (siehe CLAUDE.md, „Die Bar
    als Ort").
  */
  const breite = Math.min(proReihe * (reihen <= 2 ? 88 : 74), 340);
  // Geloest: die vollen Glaeser jubeln, eines nach dem anderen.
  const geloest = istGeloest(stand);

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
    const richtung = dx >= 0 ? 1 : -1;
    const halbBreit = a.width * KIPP_HALBBREIT;
    const arm = a.height * KIPP_DREHARM;

    // Wohin der Strahl faellt: die Oeffnung des Zielglases.
    const x2 = b.left - kasten.left + b.width * 0.5;
    const y2 = b.top - kasten.top + b.height * 0.1;
    const drehX = a.left - kasten.left + a.width * 0.5;
    /*
      Wie viel Platz das Glas zur Seite hat. `<main>` schneidet ab, was ueber
      das Brett hinausragt (das braucht der Tresen); ein Stueck Ueberhang ist
      in Ordnung, ein halbes Glas nicht.
    */
    const linksRaum = (a.left - kasten.left) + KIPP_UEBERHANG;
    const rechtsRaum = (kasten.width - (a.left - kasten.left + a.width)) + KIPP_UEBERHANG;

    /*
      SO STEIL WIE DER PLATZ ERLAUBT. Bei 65 Grad liegt der Rand rund eine
      Glashoehe neben der Mitte — fuer das Nachbarglas muesste die Quelle
      dafuer weit zuruecktreten, und am Rand des Bretts geht das nicht. Dann
      kippt sie eben weniger, in Schritten von 5 Grad bis 35.

      Wo der Saft das Glas verlaesst: die UNTERE Ecke der Oeffnung, nicht ihre
      Mitte. Das Glas dreht um `transform-origin: 50% 72%`; die Oeffnung liegt
      `arm` ueber dem Drehpunkt, ihre Ecke `halbBreit` daneben. Nach der
      Drehung zum Ziel hin liegt sie
        seitlich: halbBreit * cos + arm * sin
        hoch:     halbBreit * sin - arm * cos   (relativ zum Drehpunkt)
      Der Saft verlaesst den Rand mit Schwung zur Seite und landet weiter
      vorn — der Rand steht also kurz VOR der Mitte des Ziels.
    */
    let grad = KIPP_WINKEL;
    let schwung = 0;
    let kippX = 0;
    for (; grad >= 35; grad -= 5) {
      const bg = (grad * Math.PI) / 180;
      schwung = halbBreit * Math.cos(bg) + arm * Math.sin(bg);
      const wunsch = (x2 - richtung * b.width * 0.28) - (drehX + richtung * schwung);
      kippX = Math.max(-KIPP_MAX, Math.min(KIPP_MAX, wunsch));
      if (kippX >= -linksRaum && kippX <= rechtsRaum) break;
    }
    grad = Math.max(35, grad);
    kippX = Math.max(-linksRaum, Math.min(rechtsRaum, kippX));
    const bogen = (grad * Math.PI) / 180;
    const winkel = richtung * grad;
    const randTief = halbBreit * Math.sin(bogen) - arm * Math.cos(bogen);

    /*
      DER HUB IST GERECHNET, NICHT FEST. Wo der Rand der Quelle nach dem
      Kippen laege, wenn das Glas nicht stiege — von dort aus muss er UEBER
      die Oeffnung des Ziels. Ein fester Hub liess den Strahl beim Giessen in
      eine hoehere Reihe bergauf laufen (Josef, 27.09.2026).
    */
    const muendungRuhe = (a.top - kasten.top) + arm + randTief;
    // Auch NACH UNTEN (13.11.2026): beim Giessen in eine tiefere Reihe fiel
    // der Strahl vorher quer durch die Reihe dazwischen. Wer echt umleert,
    // bringt das Glas ueber das Ziel — also faehrt die Quelle hin.
    const hub = Math.max(
      -(a.top - kasten.top) - a.height * 0.35,
      y2 - KIPP_LUFT - muendungRuhe,
    );

    const quelle = glasRefs.current[guss.von];
    quelle?.style.setProperty('--kipp-x', `${kippX}px`);
    quelle?.style.setProperty('--kipp-y', `${hub}px`);
    quelle?.style.setProperty('--kipp-winkel', `${winkel}deg`);
    quelle?.style.setProperty('--guss-ms', `${KIPP_MS}ms`);

    const x1 = drehX + richtung * schwung + kippX;
    const y1 = muendungRuhe + hub;
    /*
      EINE WURFPARABEL, KEIN BOGEN (13.11.2026). Vorher lag der Steuerpunkt
      UEBER beiden Enden — der Saft stieg erst und fiel dann, wie ein
      geworfener Ball. Fluessigkeit verlaesst den Rand aber fast waagrecht und
      faellt dann immer steiler. Eine quadratische Kurve mit dem Steuerpunkt
      auf halbem Weg in Hoehe des Startes IST genau diese Parabel: waagrecht
      los, senkrecht werdend.
    */
    const cx = (x1 + x2) / 2;
    const cy = y1 + (y2 - y1) * 0.12;

    // Die Breite des Strahls. Sie haengt an der MENGE — vier Schichten auf
    // einmal sind ein Schwall, eine einzelne ein Rinnsal —, ist aber vor
    // allem eines: BREIT. Mit gut zehn Pixeln auf einer Bahn von 250 sah das
    // Ganze wieder aus wie ein Strich, und genau das hat Josef beanstandet.
    // Ein Glas, das man umleert, gibt seinen Inhalt fast in voller Breite der
    // Oeffnung ab.
    // Am Rand schmaler als die ganze Oeffnung: der Saft laeuft ueber die Ecke.
    const wOben = a.width * Math.min(0.46, 0.2 + 0.045 * guss.menge);
    // Schmaler unten: fallende Fluessigkeit wird schneller, und was schneller
    // wird, wird duenner.
    const wUnten = wOben * 0.62;
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
      // Die Glanzlinien liegen etwas zur Lichtseite hin, wie der Streifen im Verlauf.
      glanzVersatz: { x: nx * halb * 0.3, y: ny * halb * 0.3 },
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
      const voll = geloest && stand.fuell[b] === stand.hoehe;
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
          {...(guss && guss.von === b && kippt === b
            ? { leert: { farbe: guss.farbe, menge: guss.menge, nr: guss.nr } }
            : {})}
          {...(voll ? { fertig: { index: b } } : {})}
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
    // dir="ltr" auch unter Arabisch: Kipp-Bahn, Strahl, Spiegelung und
    // Strohhalm sind links-rechts gerechnet, und die Reihenfolge der Glaeser
    // ist keine Leserichtung. Gespiegelt wird nur die Oberflaeche darum herum.
    <div dir="ltr" style={{ position: 'relative', width: '100%', maxWidth: `${breite}px` }} ref={rahmen}>
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
          style={{
            position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none',
            // Die eine Zahl fuer alle Bewegungen des Strahls (siehe KIPP_MS).
            ['--guss-ms' as string]: `${KIPP_MS}ms`,
          }}
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
          <g mask={`url(#ftm-guss-m${strahl.nr})`}>
            <path d={strahl.flaeche} fill={`url(#ftm-guss-v${strahl.nr})`} />
            {/* BEWEGUNG IM STRAHL (13.11.2026). Vorher war er ein starres
                Bild, das eine Maske aufdeckte — fliessender Saft hat aber
                Glanzlichter, die nach unten wandern. Zwei gestrichelte Linien
                auf der Mittellinie, deren Muster mit dem Strahl faellt. */}
            <path
              className="guss-glanz"
              d={strahl.mitte}
              pathLength={1}
              fill="none"
              stroke={strahl.glanz}
              strokeWidth={Math.max(1.5, strahl.maskeBreit * 0.14)}
              strokeLinecap="round"
              transform={`translate(${strahl.glanzVersatz.x} ${strahl.glanzVersatz.y})`}
            />
            <path
              className="guss-glanz guss-glanz-2"
              d={strahl.mitte}
              pathLength={1}
              fill="none"
              stroke="#ffffff"
              strokeWidth={Math.max(1, strahl.maskeBreit * 0.06)}
              strokeLinecap="round"
              transform={`translate(${strahl.glanzVersatz.x * 1.4} ${strahl.glanzVersatz.y * 1.4})`}
            />
          </g>
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
          {/* Spritzer: ein paar Tropfen springen beim Auftreffen hoch und
              fallen zurueck. Klein und kurz — sonst sieht es nach Unfall aus. */}
          {[[-1, 1], [1, 0.8], [-0.5, 1.5], [0.6, 1.3]].map(([dx, dy], k) => (
            <circle
              key={k}
              className="guss-tropfen"
              cx={strahl.ziel.x}
              cy={strahl.ziel.y}
              r={Math.max(1.5, strahl.ziel.r * (k < 2 ? 0.22 : 0.15))}
              fill={k % 2 ? strahl.hell : strahl.ton}
              style={{
                ['--dx' as string]: `${dx! * strahl.ziel.r * 1.6}px`,
                ['--dy' as string]: `${-dy! * strahl.ziel.r * 1.7}px`,
                animationDelay: `${k * 18}ms`,
              }}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
