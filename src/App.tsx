// Der Spielbildschirm.
//
// Die Levelfolge ist VORGEBAUT (src/levels/folge.json, erzeugt von
// tools/level-bauen.mts). Im Browser zu erzeugen hiesse, den Loeser laufen zu
// lassen — mehrere Sekunden beim ersten Bild. Auf dem Geraet sucht niemand:
// das Optimum steht im Level, nur der Tipp rechnet, und der bekommt ein
// knappes Budget.
//
// `Partie` veraendert ihren Zustand an Ort und Stelle (die Engine arbeitet so,
// weil der Loeser Millionen Zustaende durchgeht). React sieht solche
// Aenderungen nicht — deshalb steht hinter jedem gelungenen Zug ein
// `neuZeichnen()`. Die Partie liegt dabei bewusst im State und nicht in einem
// Ref: aus einem Ref waehrend des Renderns zu lesen ist genau der Weg, auf dem
// Anzeige und Wahrheit auseinanderlaufen. Aus demselben Grund steht hier
// nirgends `useCallback` — alle Handler haengen an genau diesem
// veraenderlichen Objekt, eine Merkung waere bestenfalls wirkungslos.

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Brett from './components/Brett.tsx';
import Levelwahl from './components/Levelwahl.tsx';
import { Partie } from './engine/verlauf.ts';
import { festgefahren } from './engine/loeser.ts';
import { tagLevel, tagesNummer } from './engine/tagesraetsel.ts';
import type { Level, Zug } from './engine/typen.ts';
import {
  haptik, istFrei, ladeEinstellung, ladeFortschritt, merkeSterne,
  speichereEinstellung, speichereFortschritt,
} from './lib/fortschritt.ts';
import {
  KOSTEN_RUECKKAUF, KOSTEN_TIPP, ladeMuenzen, lohnFuer, reichtFuer, speichereMuenzen,
} from './lib/muenzen.ts';
import {
  heute, ladeTaeglich, merkeTag, serieLaeuft, speichereTaeglich,
} from './lib/serie.ts';
import { teilText } from './lib/teilen.ts';
import roheFolge from './levels/folge.json';

// Der JSON-Import kommt als weit gefasster Typ herein (`version: number`
// statt `3`). Die Datei stammt aus dem Generator und haelt die richtige Form —
// dafuer stehen tools/test-generator.mts und tools/test-folge.mts.
const FOLGE = roheFolge as unknown as Level[];

const start = ladeFortschritt();
// Doppelt geklemmt: an die Laenge der Folge UND an die Freischaltung. Ein
// Speicherstand aus einer laengeren Folge oder ein von Hand veraenderter darf
// nicht in ein gesperrtes Level starten.
const STARTLEVEL = Math.min(
  Math.max(start.zuletzt, 0),
  Math.max(start.hoechstes, 0),
  FOLGE.length - 1,
);

/**
 * Der heutige Tag wird EINMAL beim Laden festgehalten, nicht bei jedem Render.
 * Sonst wechselte das Raetsel einem Spieler, der um Mitternacht mitten in der
 * Partie sitzt, unter den Haenden weg.
 */
const HEUTE = heute();

export default function App() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(STARTLEVEL);
  const [modus, setModus] = useState<'folge' | 'tag'>('folge');
  const [tagBrett, setTagBrett] = useState<Level | null>(null);
  const [taeglich, setTaeglich] = useState(() => ladeTaeglich());
  const [tagLaedt, setTagLaedt] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [partie, setPartie] = useState(() => new Partie(FOLGE[STARTLEVEL]!));
  const [fortschritt, setFortschritt] = useState(start);
  const [symbole, setSymbole] = useState(() => ladeEinstellung('symbole', false));
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const [kippt, setKippt] = useState<number | null>(null);
  const [tippZiel, setTippZiel] = useState<number | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [wahlOffen, setWahlOffen] = useState(false);
  const [muenzen, setMuenzen] = useState(() => ladeMuenzen());
  // Ob das Brett tot ist, steht im State und wird NICHT bei jedem Render
  // gerechnet — sonst liefe der Loeser bei jeder Kleinigkeit mit.
  const [steckt, setSteckt] = useState(false);
  const [tippLeer, setTippLeer] = useState(false);
  const [gewinn, setGewinn] = useState(0);
  const [takt, setTakt] = useState(0);
  const neuZeichnen = () => setTakt((x) => x + 1);

  /** Nach jedem Zug: ist von hier aus ueberhaupt noch etwas zu holen? */
  const pruefeSackgasse = () => {
    // Erst zeichnen lassen, dann rechnen — wie beim Tipp. Die Pruefung kostet
    // gemessen 1–2 ms, aber sie laeuft synchron im selben Faden.
    window.setTimeout(() => setSteckt(festgefahren(partie.zustand)), 30);
  };

  const imTag = modus === 'tag' && tagBrett !== null;
  const level = imTag ? tagBrett! : FOLGE[index]!;
  const tagNummer = tagesNummer(HEUTE);
  const stand = partie.zustand;
  const geloest = partie.isSolved();
  const zuege = partie.zugzahl;
  const sterne = sterneFuer(level, zuege, geloest);

  const letztes = !imTag && index >= FOLGE.length - 1;
  const gesamtSterne = Object.values(fortschritt.sterne).reduce((a, b) => a + b, 0);

  const wechsle = (i: number) => {
    // Die Sperre wird hier ein zweites Mal geprueft, nicht nur in der
    // Levelwahl: sonst haengt die Regel an einem `disabled` in der Anzeige.
    if (i < 0 || i >= FOLGE.length || !istFrei(fortschritt, i)) return;
    setIndex(i);
    setPartie(new Partie(FOLGE[i]!));
    setGewaehlt(null);
    setTippZiel(null);
    setWahlOffen(false);
    setSteckt(false);
    setGewinn(0);
    // Auch das Springen merkt sich die App — vorher stand nach einem Neuladen
    // wieder das Level, in dem man zuletzt GEWONNEN hatte, nicht das, in dem
    // man gerade war.
    setFortschritt((f) => {
      if (f.zuletzt === i) return f;
      const neu = { ...f, zuletzt: i };
      speichereFortschritt(neu);
      return neu;
    });
  };

  /**
   * Ins Tagesraetsel wechseln. Das Brett wird HIER erzeugt, nicht vorgebaut:
   * es gibt unendlich viele kuenftige Tage, und eine Datei mit zwei Jahren
   * Vorrat waere in zwei Jahren still kaputt. Gemessen 1–584 ms, deshalb der
   * Ladezustand — auf einem Handy sind das bis zu zwei Sekunden.
   */
  const starteTag = () => {
    setTagLaedt(true);
    setWahlOffen(false);
    window.setTimeout(() => {
      const brett = tagLevel(HEUTE);
      setTagBrett(brett);
      setPartie(new Partie(brett));
      setModus('tag');
      setGewaehlt(null);
      setTippZiel(null);
      setSteckt(false);
      setGewinn(0);
      setKopiert(false);
      setTagLaedt(false);
    }, 30);
  };

  const zurFolge = () => {
    setModus('folge');
    setPartie(new Partie(FOLGE[index]!));
    setGewaehlt(null);
    setTippZiel(null);
    setSteckt(false);
    setGewinn(0);
    setWahlOffen(false);
  };

  const teilen = () => {
    const text = teilText(
      {
        nummer: tagNummer,
        zuege,
        optimum: level.optimalZuege,
        sterne: partie.sterne(),
        serie: taeglich.serie,
      },
      {
        zuege: t('spiel.wortZuege'),
        optimum: t('spiel.wortOptimum'),
        serie: t('spiel.wortSerie'),
      },
    );
    // Kein `navigator.share`: das gibt es auf dem Schreibtisch nicht und im
    // Browser nur ueber HTTPS mit Geste. Kopieren geht ueberall, und der
    // Spieler sieht, dass etwas passiert ist.
    navigator.clipboard?.writeText(text).then(
      () => {
        setKopiert(true);
        window.setTimeout(() => setKopiert(false), 2500);
      },
      () => {
        // Zwischenablage verweigert (alte Browser, kein sicherer Kontext).
        // Dann bleibt der Text wenigstens sichtbar.
        setKopiert(false);
      },
    );
  };

  const antippen = (b: number) => {
    if (geloest) return;
    setTippZiel(null);
    if (gewaehlt === null) {
      if (stand.fuell[b]! > 0) setGewaehlt(b);
      return;
    }
    if (gewaehlt === b) { setGewaehlt(null); return; }
    const quelle = gewaehlt;
    if (partie.pour(quelle, b).ok) {
      haptik(8);
      setKippt(quelle);
      window.setTimeout(() => setKippt(null), 200);
      setGewaehlt(null);
      neuZeichnen();
      if (partie.isSolved()) {
        haptik(40);
        // Muenzen NUR fuer die Verbesserung — sonst waere ein leichtes Level
        // (oder dasselbe Tagesraetsel) eine Quelle zum Wiederholen. Die Regel
        // steht in lib/muenzen.ts.
        const vorher = imTag
          ? taeglich.tage[HEUTE]?.sterne ?? 0
          : fortschritt.sterne[index] ?? 0;
        const verdient = lohnFuer(vorher, partie.sterne());
        setGewinn(verdient);
        if (verdient > 0) {
          setMuenzen((m) => {
            const neu = m + verdient;
            speichereMuenzen(neu);
            return neu;
          });
        }
        if (imTag) {
          setTaeglich((alt) => {
            const neu = merkeTag(alt, HEUTE, partie.zugzahl, partie.sterne());
            speichereTaeglich(neu);
            return neu;
          });
        } else {
          setFortschritt((f) => {
            // `merkeSterne` schaltet das naechste Level frei — das ist die
            // einzige Stelle, an der das passiert.
            const neu = merkeSterne(
              { ...f, zuletzt: Math.min(index + 1, FOLGE.length - 1) },
              index,
              partie.sterne(),
            );
            speichereFortschritt(neu);
            return neu;
          });
        }
      } else {
        pruefeSackgasse();
      }
    } else {
      // Fehlgriff: statt stumm abzuwaehlen die neue Quelle uebernehmen, wenn
      // dort ueberhaupt etwas drin ist. Das fuehlt sich fluessiger an.
      setGewaehlt(stand.fuell[b]! > 0 ? b : null);
    }
  };

  const tipp = () => {
    if (!reichtFuer(muenzen, KOSTEN_TIPP)) return;
    setRechnet(true);
    // Erst zeichnen lassen, dann rechnen — sonst haengt der Knopf, ohne dass
    // man sieht, dass ueberhaupt etwas passiert.
    window.setTimeout(() => {
      const zug: Zug | null = partie.tipp();
      setRechnet(false);
      if (!zug) {
        // ABGEBUCHT WIRD NUR, WENN DER TIPP ETWAS LIEFERT. `hint()` gibt auch
        // dann null zurueck, wenn nur das Budget alle war — fuer einen Tipp,
        // der nichts sagt, Geld zu nehmen, waere schlicht unfair.
        // Und statt wie frueher stumm zu bleiben, sagt die App jetzt, was los
        // ist: entweder bewiesen tot oder „ich weiss es nicht".
        if (festgefahren(partie.zustand)) setSteckt(true);
        else {
          setTippLeer(true);
          window.setTimeout(() => setTippLeer(false), 2500);
        }
        return;
      }
      const rest = muenzen - KOSTEN_TIPP;
      setMuenzen(rest);
      speichereMuenzen(rest);
      setGewaehlt(zug.von);
      setTippZiel(zug.nach);
      window.setTimeout(() => setTippZiel(null), 3000);
    }, 30);
  };

  /** Einen Zug zurueckkaufen. Je Rueckkauf genau ein Zug. */
  const rueckkauf = () => {
    if (!reichtFuer(muenzen, KOSTEN_RUECKKAUF) || !partie.kannUndo()) return;
    const rest = muenzen - KOSTEN_RUECKKAUF;
    setMuenzen(rest);
    speichereMuenzen(rest);
    partie.undo();
    setGewaehlt(null);
    setTippZiel(null);
    neuZeichnen();
    // Ein Zug zurueck reicht nicht immer: wer sich drei Zuege zu spaet
    // verrannt hat, zahlt dreimal. Der Preis waechst mit dem Fehler.
    setSteckt(festgefahren(partie.zustand));
  };

  const neustart = () => {
    partie.neustart();
    setGewaehlt(null);
    setTippZiel(null);
    setSteckt(false);
    neuZeichnen();
  };

  const zugFarbe = zuege <= level.sterne.drei
    ? 'text-zitrus'
    : zuege <= level.sterne.zwei ? 'text-creme' : 'text-rauch';

  return (
    <main className="flex min-h-dvh flex-col" data-takt={takt}>
      <header className="flex flex-shrink-0 items-center justify-between gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.9rem)] pb-2">
        <button
          type="button"
          onClick={() => setWahlOffen(true)}
          className="flex min-h-[44px] touch-manipulation items-center gap-2 rounded-full border-[1.5px] border-kante bg-theke/85 px-4 text-sm font-bold text-creme"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="text-rauch" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          {imTag ? t('spiel.tagNr', { n: tagNummer }) : t('spiel.level', { n: index + 1 })}
        </button>

        {/* Bewusst ein div und kein Knopf: der Oberflaechentest greift den
            Burger ueber `header button` first(), und das muss so bleiben. */}
        <div
          className="flex min-h-[44px] flex-shrink-0 items-center gap-1.5 px-1"
          data-muenzen={muenzen}
          aria-label={t('spiel.muenzen', { n: muenzen })}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="var(--color-zitrus)" />
            <circle cx="12" cy="12" r="5.6" fill="none" stroke="rgba(120,78,10,0.5)" strokeWidth="1.6" />
          </svg>
          <span className="text-sm leading-none font-bold text-zitrus tabular-nums">{muenzen}</span>
        </div>

        <div className="flex flex-col items-center">
          <div data-zuege={zuege} className={`font-anzeige text-3xl leading-none font-semibold tabular-nums ${zugFarbe}`}>{zuege}</div>
          <div className="text-[10.5px] font-bold tracking-[0.1em] text-rauch uppercase">
            {t('spiel.vonZuegen', { n: level.optimalZuege })}
          </div>
        </div>

        <div className="flex min-h-[44px] items-center gap-0.5" aria-label={t('spiel.sterne', { n: sterne })}>
          {[0, 1, 2].map((i) => (
            <svg key={i} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
              fill={i < sterne ? 'var(--color-zitrus)' : 'none'}
              stroke={i < sterne ? 'none' : '#2F4A6B'} strokeWidth="2.2" strokeLinejoin="round">
              <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
            </svg>
          ))}
        </div>
      </header>

      <div className="flex flex-grow items-center justify-center px-4 py-2">
        <Brett
          stand={stand}
          gewaehlt={gewaehlt}
          kippt={kippt}
          tippZiel={tippZiel}
          symbole={symbole}
          onTap={antippen}
          textGlas={(i) => t('spiel.glas', { n: i + 1 })}
        />
      </div>

      <footer className="flex flex-shrink-0 items-center gap-2.5 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <button type="button" aria-label={t('spiel.undo')} disabled={!partie.kannUndo() || geloest}
          onClick={() => { if (partie.undo()) { setGewaehlt(null); neuZeichnen(); } }}
          className="knopf w-[54px] flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h11a5.5 5.5 0 010 11H8" /><path d="M7 4L3 8l4 4" /></svg>
        </button>

        <button type="button" aria-label={t('spiel.neustart')} disabled={zuege === 0}
          onClick={neustart}
          className="knopf w-[54px] flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 11-2.6-5.9" /><path d="M20 4v5h-5" /></svg>
        </button>

        <button
          type="button"
          onClick={tipp}
          disabled={rechnet || geloest || !reichtFuer(muenzen, KOSTEN_TIPP)}
          className="knopf knopf-haupt flex-grow"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6" /><path d="M10 21.5h4" /><path d="M12 2.5a6.5 6.5 0 00-3.7 11.8c.5.4.7.9.7 1.4v.3h6v-.3c0-.5.2-1 .7-1.4A6.5 6.5 0 0012 2.5z" /></svg>
          {rechnet ? t('spiel.rechnet') : t('spiel.tippPreis', { n: KOSTEN_TIPP })}
        </button>

        <button type="button" aria-label={t('spiel.symbole')} aria-pressed={symbole}
          onClick={() => { const n = !symbole; setSymbole(n); speichereEinstellung('symbole', n); }}
          className={`knopf w-[54px] flex-shrink-0 ${symbole ? 'knopf-an' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="2.3" />
            <path d="M12 3.6a8.4 8.4 0 000 16.8z" fill="currentColor" />
          </svg>
        </button>
      </footer>

      {tagLaedt && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-nacht-tief/90 px-6">
          <p className="font-anzeige text-lg font-bold text-creme">{t('spiel.tagLaedt')}</p>
        </div>
      )}

      {kopiert && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex justify-center px-6">
          <p className="rounded-full border border-zitrus/50 bg-theke px-4 py-2 text-xs font-bold text-zitrus">
            {t('spiel.kopiert')}
          </p>
        </div>
      )}

      {tippLeer && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-10 flex justify-center px-6">
          <p className="rounded-full border border-kante bg-theke px-4 py-2 text-xs font-bold text-rauch">
            {t('spiel.tippNichts')}
          </p>
        </div>
      )}

      {/* Festgefahren. Gleiche Bauart wie das Siegfenster, aber mit Ausweg:
          ein Zug zurueck gegen Muenzen, oder der Neustart — der ist immer
          gratis, damit niemand mit leerem Guthaben im Nichts steht. */}
      {steckt && !geloest && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-nacht-tief/85 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl border border-kante bg-theke p-7 text-center" data-steckt="1">
            <svg width="46" height="46" viewBox="0 0 24 24" className="mx-auto text-rauch" fill="none"
              stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M8.2 8.2l7.6 7.6" />
            </svg>
            <h2 className="font-anzeige mt-4 text-3xl leading-tight font-bold">{t('spiel.festgefahren')}</h2>
            <p className="mt-2 text-sm text-rauch">{t('spiel.festgefahrenText')}</p>
            {!reichtFuer(muenzen, KOSTEN_RUECKKAUF) && (
              <p className="mt-1 text-xs text-rauch">{t('spiel.zuWenig')}</p>
            )}
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                className="knopf knopf-an"
                disabled={!partie.kannUndo() || !reichtFuer(muenzen, KOSTEN_RUECKKAUF)}
                onClick={rueckkauf}
              >
                {t('spiel.zurueckkaufen', { n: KOSTEN_RUECKKAUF })}
              </button>
              <button type="button" className="knopf" onClick={neustart}>
                {t('spiel.neustart')}
              </button>
            </div>
          </div>
        </div>
      )}

      {geloest && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-nacht-tief/85 px-6 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl border border-kante bg-theke p-7 text-center">
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <svg key={i} width={i === 1 ? 54 : 40} height={i === 1 ? 54 : 40} viewBox="0 0 24 24" aria-hidden="true"
                  fill={i < sterne ? 'var(--color-zitrus)' : 'none'}
                  stroke={i < sterne ? 'none' : '#2F4A6B'} strokeWidth="2.2" strokeLinejoin="round"
                  style={i < sterne ? { filter: 'drop-shadow(0 0 14px rgba(255,201,60,0.55))' } : undefined}>
                  <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
                </svg>
              ))}
            </div>
            <h2 className="font-anzeige mt-4 text-3xl leading-tight font-bold">
              {sterne === 3 ? t('spiel.perfekt') : t('spiel.gewonnen')}
            </h2>
            {letztes && (
              <p className="mt-2 text-sm font-bold text-zitrus">
                {t('spiel.durch', { n: gesamtSterne, gesamt: FOLGE.length * 3 })}
              </p>
            )}
            {imTag && (
              <p className="mt-2 text-sm font-bold text-zitrus" data-serie={taeglich.serie}>
                🔥 {t('spiel.serie', { n: taeglich.serie })}
              </p>
            )}
            <p className="mt-2 text-sm text-rauch">{t('spiel.bilanz', { zuege, optimum: level.optimalZuege })}</p>
            {gewinn > 0 && (
              <p className="mt-1 text-sm font-bold text-zitrus" data-gewinn={gewinn}>
                {t('spiel.gewinn', { n: gewinn })}
              </p>
            )}
            {sterne < 3 && (
              <p className="mt-1 text-xs text-rauch">{t('spiel.dreiSterne', { n: level.optimalZuege })}</p>
            )}
            <div className="mt-6 flex flex-col gap-2.5">
              {/* Beim letzten Level fuehrt der Hauptknopf in die Levelwahl.
                  Vorher stand hier ein abgeschalteter Knopf mit der Aufschrift
                  „Ende" — eine Sackgasse als Belohnung. */}
              {imTag ? (
                <button type="button" onClick={teilen} className="knopf knopf-an">
                  {t('spiel.teilen')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => (letztes ? setWahlOffen(true) : wechsle(index + 1))}
                  className="knopf knopf-an"
                >
                  {letztes ? t('spiel.levelwahl') : t('spiel.weiter')}
                </button>
              )}
              <div className="flex gap-2.5">
                <button type="button" className="knopf flex-grow" onClick={neustart}>
                  {t('spiel.nochmal')}
                </button>
                {imTag ? (
                  <button type="button" className="knopf flex-grow" onClick={zurFolge}>
                    {t('spiel.zurFolge')}
                  </button>
                ) : !letztes && (
                  <button type="button" className="knopf flex-grow" onClick={() => setWahlOffen(true)}>
                    {t('spiel.levelwahl')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {wahlOffen && (
        <Levelwahl
          level={FOLGE}
          aktuell={index}
          sterne={fortschritt.sterne}
          hoechstes={fortschritt.hoechstes}
          onWahl={wechsle}
          onZu={() => setWahlOffen(false)}
          titel={t('spiel.levelwahl')}
          schliessen={t('spiel.schliessen')}
          bilanz={t('spiel.sterneGesamt', { n: gesamtSterne, gesamt: FOLGE.length * 3 })}
          abschnittTitel={(von, bis) => t('spiel.abschnitt', { von, bis })}
          kachelTitel={(nr, s, experte) =>
            t(experte ? 'spiel.kachelExperte' : 'spiel.kachel', { n: nr, sterne: s })}
          gesperrtTitel={(nr) => t('spiel.kachelGesperrt', { n: nr })}
          zurueck={t('spiel.abschnittZurueck')}
          vor={t('spiel.abschnittVor')}
          tagTitel={t('spiel.tagesraetsel')}
          tagZeile={
            taeglich.tage[HEUTE]
              ? t('spiel.tagFertig', { zuege: taeglich.tage[HEUTE]!.zuege })
              : t('spiel.tagHeute', { n: tagNummer })
          }
          tagSerie={
            serieLaeuft(taeglich, HEUTE)
              ? t('spiel.serie', { n: taeglich.serie })
              : t('spiel.serieKeine')
          }
          tagSterne={taeglich.tage[HEUTE]?.sterne ?? 0}
          onTag={starteTag}
        />
      )}
    </main>
  );
}

/**
 * Sterne. Vor dem Sieg als Vorschau — man soll live sehen, was ein Zug
 * zu viel kostet, nicht erst im Ergebnisfenster.
 */
function sterneFuer(level: Level, zuege: number, geloest: boolean): number {
  if (geloest && zuege > level.sterne.zwei) return 1;
  if (zuege <= level.sterne.drei) return 3;
  if (zuege <= level.sterne.zwei) return 2;
  return 1;
}
