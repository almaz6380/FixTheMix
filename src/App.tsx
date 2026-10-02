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

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Brett, { KIPP_MS, type Guss } from './components/Brett.tsx';
import Rueckwand from './components/Rueckwand.tsx';
import { Partie } from './engine/verlauf.ts';
import { festgefahren } from './engine/loeser.ts';
import { tagLevel, tagesNummer } from './engine/tagesraetsel.ts';
import { botSpielt, duellLevel, duellSieger, type Ausgang, type BotPartie } from './engine/duell.ts';
import type { Level, Zug } from './engine/typen.ts';
import { FARBEN } from './engine/farben.ts';
import {
  haptik, istFrei, ladeEinstellung, ladeFortschritt, merkeSterne,
  speichereEinstellung, speichereFortschritt,
} from './lib/fortschritt.ts';
import {
  KOSTEN_RUECKKAUF, KOSTEN_TIPP, ladeMuenzen, lohnFuer, reichtFuer, speichereMuenzen,
} from './lib/muenzen.ts';
import {
  heute, ladeTaeglich, merkeTag, speichereTaeglich,
} from './lib/serie.ts';
import { teilText } from './lib/teilen.ts';
import {
  klangDaneben, klangGuss, klangMuenze, klangSieg, klangSteckt, klangWahl,
  setzeTon, tonGeladen,
} from './lib/klang.ts';
import {
  ausgangZaehlen, ladeBilanz, naechsteNummer, speichereBilanz,
} from './lib/duell.ts';
import { BELOHNUNG_VIDEO } from './lib/muenzen.ts';
import { werbefreiPruefen } from './lib/kauf.ts';
import {
  belohnungMoeglich, starteWerbung, vielleichtInterstitial, zeigeBelohnungsVideo,
} from './lib/werbung.ts';
import roheFolge from './levels/folge.json';

// Der JSON-Import kommt als weit gefasster Typ herein (`version: number`
// statt `3`). Die Datei stammt aus dem Generator und haelt die richtige Form —
// dafuer stehen tools/test-generator.mts und tools/test-folge.mts.
const FOLGE = roheFolge as unknown as Level[];

/**
 * Mit welchem Level `/spiel` aufgeht.
 *
 * Eine FUNKTION und keine Konstante, und das ist seit dem Umbau auf Routen
 * kein Geschmack mehr: eine Konstante auf Modulebene wird genau einmal
 * gerechnet, naemlich beim Import. Solange `/` der einzige Einstieg war, hiess
 * das „bei jedem Seitenaufruf". Mit dem Router wechselt man von `/level` nach
 * `/spiel`, ohne dass das Modul neu geladen wird — die Konstante stand dann
 * noch auf dem Level von vorhin, und die Levelwahl sprang ins Leere.
 * Genau das hat der Oberflaechentest gefangen.
 *
 * Doppelt geklemmt: an die Laenge der Folge UND an die Freischaltung. Ein
 * Speicherstand aus einer laengeren Folge oder ein von Hand veraenderter darf
 * nicht in ein gesperrtes Level starten.
 */
function startLevel(f: ReturnType<typeof ladeFortschritt>): number {
  return Math.min(
    Math.max(f.zuletzt, 0),
    Math.max(f.hoechstes, 0),
    FOLGE.length - 1,
  );
}

/**
 * Der heutige Tag wird EINMAL beim Laden festgehalten, nicht bei jedem Render.
 * Sonst wechselte das Raetsel einem Spieler, der um Mitternacht mitten in der
 * Partie sitzt, unter den Haenden weg.
 */
const HEUTE = heute();

interface Eigenschaften {
  /**
   * Welcher Modus gespielt wird — entschieden von der ROUTE, nicht von einem
   * Knopf im Spielbildschirm. `/spiel` ist die Levelfolge, `/tagesraetsel`
   * das Raetsel des Tages, `/duell` ein Duell.
   *
   * Vor dem 27.09.2026 gab es nur `/`, und der Modus wurde aus einem Fenster
   * ueber dem Spiel heraus umgeschaltet. Damit hatte weder das Tagesraetsel
   * noch ein Duell eine Adresse, und ein Neuladen warf einen zurueck in die
   * Levelfolge.
   */
  startModus?: 'folge' | 'tag' | 'duell';
}

export default function App({ startModus = 'folge' }: Eigenschaften = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Beim Betreten der Route EINMAL aus dem Speicher gelesen — danach fuehrt
  // der State das Spiel. `useState` mit Funktion, damit das nicht bei jedem
  // Neuzeichnen passiert.
  const [fortschritt, setFortschritt] = useState(ladeFortschritt);
  const [index, setIndex] = useState(() => startLevel(ladeFortschritt()));
  const [modus, setModus] = useState<'folge' | 'tag' | 'duell'>('folge');
  const [tagBrett, setTagBrett] = useState<Level | null>(null);
  // Das Duell (Version 1.1). Brett, Gegner und Ausgang liegen zusammen im
  // State: ein Duell ohne seinen Gegner waere ein halber Zustand.
  const [duellBrett, setDuellBrett] = useState<Level | null>(null);
  const [duellNummer, setDuellNummer] = useState(0);
  const [gegner, setGegner] = useState<BotPartie | null>(null);
  const [duellAusgang, setDuellAusgang] = useState<Ausgang | null>(null);
  const [duellBilanz, setDuellBilanz] = useState(() => ladeBilanz());
  const [duellLaedt, setDuellLaedt] = useState(false);
  const [taeglich, setTaeglich] = useState(() => ladeTaeglich());
  const [tagLaedt, setTagLaedt] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [videoLaeuft, setVideoLaeuft] = useState(false);
  const [videoLeer, setVideoLeer] = useState(false);
  const [partie, setPartie] = useState(() => new Partie(FOLGE[startLevel(ladeFortschritt())]!));
  const [symbole, setSymbole] = useState(() => ladeEinstellung('symbole', false));
  // Der Giessstrahl. `nr` zaehlt hoch, damit zweimal derselbe Zug auch zweimal
  // fliesst — ohne das liefe die CSS-Bewegung nur beim ersten Mal.
  const [guss, setGuss] = useState<Guss | null>(null);
  const [gewaehlt, setGewaehlt] = useState<number | null>(null);
  const [kippt, setKippt] = useState<number | null>(null);
  const kippUhr = useRef<number | undefined>(undefined);

  /**
   * Raeumt weg, was auf das ALTE Brett zeigt: den Strahl und das gekippte
   * Glas. Beides haengt an Glasindizes. Bleibt es stehen, waehrend Undo,
   * Neustart, Rueckkauf oder ein Levelwechsel das Brett tauschen, neigt sich
   * ploetzlich ein Glas, das nie gegossen hat. Beim Strahl ist genau das
   * schon einmal passiert und vom Oberflaechentest gefangen worden — der
   * Rueckkauf raeumte ihn weg, der normale Undo-Knopf nicht.
   */
  const raeumeGuss = () => {
    setGuss(null);
    window.clearTimeout(kippUhr.current);
    setKippt(null);
  };
  const [tippZiel, setTippZiel] = useState<number | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [muenzen, setMuenzen] = useState(() => ladeMuenzen());
  // Ob das Brett tot ist, steht im State und wird NICHT bei jedem Render
  // gerechnet — sonst liefe der Loeser bei jeder Kleinigkeit mit.
  const [steckt, setSteckt] = useState(false);
  const [tippLeer, setTippLeer] = useState(false);
  const [gewinn, setGewinn] = useState(0);
  const [takt, setTakt] = useState(0);
  const neuZeichnen = () => setTakt((x) => x + 1);

  /*
    Tagesraetsel und Duell werden beim Betreten der Route erzeugt. Beides
    kostet Zeit (Raetsel 1–584 ms, Duell samt Botpartie bis ~250 ms), deshalb
    laufen sie durch dieselben Starter wie vorher — mit Ladezustand.

    Die Abhaengigkeitsliste ist absichtlich leer: das soll genau EINMAL beim
    Betreten passieren. Liefe es erneut, bekaeme der Spieler mitten in der
    Partie ein frisches Brett.
  */
  useEffect(() => {
    if (startModus === 'tag') starteTag();
    else if (startModus === 'duell') starteDuell();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Werbung und Kaufstatus einmal beim Start. Im Browser tut beides nichts —
  // die Funktionen pruefen das selbst und kehren still zurueck.
  useEffect(() => {
    void (async () => {
      await starteWerbung();
      await werbefreiPruefen();
    })();
    // Der gespeicherte Ton-Schalter. Gelesen wird er hier und nicht im
    // Klangmodul selbst: `localStorage` gehoert nicht in eine Datei, die sonst
    // nur mit WebAudio zu tun hat.
    setzeTon(tonGeladen());
  }, []);

  /** Nach jedem Zug: ist von hier aus ueberhaupt noch etwas zu holen? */
  const pruefeSackgasse = () => {
    // Erst zeichnen lassen, dann rechnen — wie beim Tipp. Die Pruefung kostet
    // gemessen 1–2 ms, aber sie laeuft synchron im selben Faden.
    window.setTimeout(() => {
      const tot = festgefahren(partie.zustand);
      setSteckt(tot);
      if (tot) klangSteckt();
    }, 30);
  };

  const imTag = modus === 'tag' && tagBrett !== null;
  const imDuell = modus === 'duell' && duellBrett !== null;
  const level = imTag ? tagBrett! : imDuell ? duellBrett! : FOLGE[index]!;
  const tagNummer = tagesNummer(HEUTE);
  const stand = partie.zustand;
  const geloest = partie.isSolved();
  const zuege = partie.zugzahl;
  const sterne = sterneFuer(level, zuege, geloest);

  const letztes = !imTag && !imDuell && index >= FOLGE.length - 1;
  const gesamtSterne = Object.values(fortschritt.sterne).reduce((a, b) => a + b, 0);

  const wechsle = (i: number) => {
    // Die Sperre wird hier ein zweites Mal geprueft, nicht nur in der
    // Levelwahl: sonst haengt die Regel an einem `disabled` in der Anzeige.
    if (i < 0 || i >= FOLGE.length || !istFrei(fortschritt, i)) return;
    raeumeGuss();
    setIndex(i);
    setPartie(new Partie(FOLGE[i]!));
    setGewaehlt(null);
    setTippZiel(null);
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
    window.setTimeout(() => {
      raeumeGuss();
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

  /**
   * Zurueck in die Levelfolge. Seit dem Umbau ist das ein ROUTENWECHSEL und
   * kein Umschalten im selben Bildschirm — `/spiel` baut sich frisch auf und
   * holt sein Level aus dem Fortschritt.
   */
  const zurFolge = () => navigate('/spiel');

  /**
   * Ein Duell starten. Brett und Gegner entstehen HIER, nicht vorgebaut —
   * dasselbe Argument wie beim Tagesraetsel, und hier kommt noch dazu, dass
   * der Gegner das Brett wirklich durchspielt. Gemessen: Brett bis ~75 ms,
   * Botpartie bis ~170 ms. Zusammen unter einer halben Sekunde auf dem
   * Bauserver, auf einem Handy gut eine — deshalb der Ladezustand.
   *
   * Der Gegner ist ein Bot. Ein Duell gegen einen MENSCHEN braucht die
   * Datenbank aus Phase 4, und die steht noch nicht; Migration und Edge
   * Function liegen fertig im Repo. Die Auswertung aendert sich dadurch
   * nicht — sie steht in der Engine und wird von beiden Seiten gerufen.
   */
  const starteDuell = () => {
    setDuellLaedt(true);
    window.setTimeout(() => {
      raeumeGuss();
      const nummer = naechsteNummer(duellBilanz);
      const brett = duellLevel(nummer);
      setDuellNummer(nummer);
      setDuellBrett(brett);
      setGegner(botSpielt(brett, duellBilanz.staerke, nummer));
      setPartie(new Partie(brett));
      setModus('duell');
      setGewaehlt(null);
      setTippZiel(null);
      setSteckt(false);
      setGewinn(0);
      setDuellAusgang(null);
      setDuellLaedt(false);
    }, 30);
  };

  /**
   * Ein Duell abschliessen. `meine` ist `null`, wenn aufgegeben wurde — wer
   * sich festfaehrt, verliert, wird aber nicht abgewiesen (dieselbe Regel wie
   * serverseitig in `pruefeDuell`).
   *
   * Duelle zahlen KEINE Muenzen, und das ist Absicht: ein Duellbrett gehoert
   * zu keinem Level, also gaebe es kein „nur die Verbesserung" — jede Partie
   * wuerde zahlen, und die Waehrung waere farmbar. Der Lohn ist die Bilanz.
   */
  const duellEnde = (meine: number | null) => {
    const ausgang = duellSieger(meine, gegner?.zugzahl ?? null);
    setDuellAusgang(ausgang);
    setDuellBilanz((b) => {
      const neuB = ausgangZaehlen(b, ausgang);
      speichereBilanz(neuB);
      return neuB;
    });
    haptik(ausgang === 'a' ? 40 : 12);
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
      if (stand.fuell[b]! > 0) { setGewaehlt(b); klangWahl(); }
      return;
    }
    if (gewaehlt === b) { setGewaehlt(null); return; }
    const quelle = gewaehlt;
    const e = partie.pour(quelle, b);
    if (e.ok) {
      haptik(8);
      klangGuss(e.menge);
      setKippt(quelle);
      // Der Zeitgeber wird ERSETZT, nicht gestapelt. Zwei Guesse kurz
      // hintereinander liessen sonst den ersten Zeitgeber das zweite Glas
      // aufrichten, mitten im Zug — sichtbar als Zucken bei schnellem Spiel.
      window.clearTimeout(kippUhr.current);
      kippUhr.current = window.setTimeout(() => setKippt(null), KIPP_MS);
      // Der Strahl wird HIER angestossen, nach dem Zug: gezeichnet wird er
      // gegen den neuen Stand, und aufhalten darf er nichts.
      setGuss((alt) => ({ von: quelle, nach: b, farbe: e.farbe, menge: e.menge, nr: (alt?.nr ?? 0) + 1 }));
      setGewaehlt(null);
      neuZeichnen();
      if (partie.isSolved()) {
        haptik(40);
        klangSieg(partie.sterne());
        // Muenzen NUR fuer die Verbesserung — sonst waere ein leichtes Level
        // (oder dasselbe Tagesraetsel) eine Quelle zum Wiederholen. Die Regel
        // steht in lib/muenzen.ts.
        const vorher = imTag
          ? taeglich.tage[HEUTE]?.sterne ?? 0
          : fortschritt.sterne[index] ?? 0;
        // Im Duell gibt es keine Muenzen — siehe `duellEnde`.
        const verdient = imDuell ? 0 : lohnFuer(vorher, partie.sterne());
        setGewinn(verdient);
        if (verdient > 0) {
          klangMuenze();
          setMuenzen((m) => {
            const neu = m + verdient;
            speichereMuenzen(neu);
            return neu;
          });
        }
        // Die Bremse entscheidet, ob wirklich eine Anzeige kommt: jedes dritte
        // Level und nie oefter als alle zwei Minuten. Das Tagesraetsel zaehlt
        // MIT, bekommt aber keine eigene Gelegenheit — nach dem einen Raetsel
        // am Tag zuverlaessig Werbung waere die unangenehmste Stelle im Spiel.
        if (!imTag) void vielleichtInterstitial();
        if (imDuell) {
          duellEnde(partie.zugzahl);
        } else if (imTag) {
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
      if (stand.fuell[b]! > 0) { setGewaehlt(b); klangWahl(); }
      else { setGewaehlt(null); klangDaneben(); }
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
    raeumeGuss();
    setGewaehlt(null);
    setTippZiel(null);
    neuZeichnen();
    // Ein Zug zurueck reicht nicht immer: wer sich drei Zuege zu spaet
    // verrannt hat, zahlt dreimal. Der Preis waechst mit dem Fehler.
    setSteckt(festgefahren(partie.zustand));
  };

  /**
   * Ein leeres Glas gegen ein freiwilliges Werbevideo.
   *
   * Hoechstens eines je Partie, und es kostet die dritte Sterne: das Optimum
   * ist fuer das Brett OHNE dieses Glas bewiesen (`Partie.sterne()` deckelt auf
   * zwei). Ohne diesen Deckel waere die Zusicherung „drei Sterne nur fuer die
   * kuerzeste Loesung" hinfaellig, und die ist der Kern der ganzen Wertung.
   */
  const holeExtraGlas = () => {
    setVideoLaeuft(true);
    window.setTimeout(() => {
      void (async () => {
        const gesehen = await zeigeBelohnungsVideo();
        setVideoLaeuft(false);
        if (!gesehen) {
          setVideoLeer(true);
          window.setTimeout(() => setVideoLeer(false), 2500);
          return;
        }
        if (!partie.extraGlas()) return;
        setGewaehlt(null);
        setTippZiel(null);
        neuZeichnen();
        // Mit einem Glas mehr ist das Brett fast immer wieder loesbar — aber
        // eben nur fast. Also nachrechnen statt hoffen.
        setSteckt(festgefahren(partie.zustand));
      })();
    }, 30);
  };

  const holeMuenzen = () => {
    setVideoLaeuft(true);
    window.setTimeout(() => {
      void (async () => {
        const gesehen = await zeigeBelohnungsVideo();
        setVideoLaeuft(false);
        if (!gesehen) {
          setVideoLeer(true);
          window.setTimeout(() => setVideoLeer(false), 2500);
          return;
        }
        klangMuenze();
        setMuenzen((m) => {
          const neu = m + BELOHNUNG_VIDEO;
          speichereMuenzen(neu);
          return neu;
        });
      })();
    }, 30);
  };

  const neustart = () => {
    // Ein stehengebliebener Strahl zeigt auf Glaeser eines Bretts, das es so
    // nicht mehr gibt.
    raeumeGuss();
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
    /* `.buehne` schneidet ab: der Tresen laeuft bewusst ueber die Brettbreite
       und bis unter den Bildrand hinaus (siehe `.theke`). Die Fenster darueber sind `fixed` und bleiben davon
       unberuehrt — die haengen am Bildschirm, nicht an <main>. */
    <main className="buehne flex min-h-dvh flex-col" data-takt={takt}
      /* Die volle Duellnummer, nicht die gekuerzte aus der Kopfzeile:
         der Oberflaechentest baut daraus Brett und Gegner selbst nach
         und prueft, ob die App dasselbe Ergebnis zeigt wie die Engine. */
      data-duell-nummer={imDuell ? duellNummer : undefined}>
      <Rueckwand />
      <header className="flex flex-shrink-0 items-center justify-between gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.9rem)] pb-2">
        <button
          type="button"
          onClick={() => navigate(imTag || imDuell ? '/' : '/level')}
          className="flex min-h-[44px] touch-manipulation items-center gap-2 rounded-full border-[1.5px] border-kante bg-theke/85 px-4 text-sm font-bold text-creme"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="text-rauch" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          {imTag
            ? t('spiel.tagNr', { n: tagNummer })
            : imDuell
              ? t('spiel.duellNr', { n: duellNummer % 10000 })
              : t('spiel.level', { n: index + 1 })}
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

        <div className="flex-grow" />

        {/*
          Rechts steht das ZIEL: die Sterne gross, der Zugzaehler klein
          darunter. Vorher war der Zaehler die groesste Zahl auf dem ganzen
          Schirm — und er ist die unwichtigste Angabe darauf. Dazu stand er
          in Zitrusgelb, neben einem gelben Muenzchip und drei gelben
          Sternen: vier gelbe Dinge in einer Zeile, und keines davon ist
          eine Spielfarbe gewesen.
        */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-0.5" aria-label={t('spiel.sterne', { n: sterne })}>
            {[0, 1, 2].map((i) => (
              <svg key={i} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
                fill={i < sterne ? 'var(--color-zitrus)' : 'none'}
                stroke={i < sterne ? 'none' : '#2F4A6B'} strokeWidth="2.2" strokeLinejoin="round">
                <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
              </svg>
            ))}
          </div>
          <div
            data-zuege={zuege}
            className={`text-[10.5px] leading-none font-bold tracking-[0.09em] uppercase tabular-nums ${zugFarbe}`}
          >
            {partie.hatExtraGlas
              ? t('spiel.extraGlas')
              : `${zuege} ${t('spiel.vonZuegen', { n: level.optimalZuege })}`}
          </div>
        </div>
      </header>

      {/* Dass das Extra-Glas auf zwei Sterne deckelt, stand bisher nur im
          Siegfenster — also erst, wenn es zu spaet war, sich anders zu
          entscheiden. Jetzt steht es waehrend der Partie da. */}
      {partie.hatExtraGlas && (
        <div className="mx-4 mb-1 flex flex-shrink-0 items-center gap-2 rounded-full border border-zitrus/25 bg-zitrus/10 px-3.5 py-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" className="flex-shrink-0 text-zitrus" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16.2v.1" />
          </svg>
          <span className="text-[11px] leading-tight font-bold text-zitrus">{t('spiel.extraGlasZwei')}</span>
        </div>
      )}

      {/* `items-end` und nicht `items-center`: die Glaeser stehen auf dem
          Tresen, und der ist unten. Das `pb` ist seine Hoehe — konstant, damit
          eine Bar nicht bei jedem Level eine andere Theke hat. Der Platz
          darueber ist die Rueckwand. */}
      <div className="flex flex-grow items-end justify-center px-4 pt-2 pb-[96px]">
        <Brett
          guss={guss}
          stand={stand}
          gewaehlt={gewaehlt}
          kippt={kippt}
          tippZiel={tippZiel}
          symbole={symbole}
          onTap={antippen}
          textGlas={(i) => t('spiel.glas', { n: i + 1 })}
        />
      </div>

      {/* `relative`: ohne eine eigene Position wuerde der Tresen die Knoepfe
          uebermalen — ein absolut positioniertes Element zeichnet ueber den
          statischen Inhalt spaeterer Geschwister. Genau das ist beim Umbau
          passiert und im Screenshot aufgefallen. */}
      <footer className="relative flex flex-shrink-0 items-center gap-2.5 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <button type="button" aria-label={t('spiel.undo')} disabled={!partie.kannUndo() || geloest}
          onClick={() => { if (partie.undo()) { raeumeGuss(); setGewaehlt(null); neuZeichnen(); } }}
          className="knopf knopf-bar w-[54px] flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="pfeil" aria-hidden="true"><path d="M3 8h11a5.5 5.5 0 010 11H8" /><path d="M7 4L3 8l4 4" /></svg>
        </button>

        <button type="button" aria-label={t('spiel.neustart')} disabled={zuege === 0}
          onClick={neustart}
          className="knopf knopf-bar w-[54px] flex-shrink-0">
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

        <button type="button" aria-label={t('spiel.symbole')} aria-pressed={symbole} data-symbole
          onClick={() => { const n = !symbole; setSymbole(n); speichereEinstellung('symbole', n); }}
          className={`knopf knopf-bar w-[54px] flex-shrink-0 ${symbole ? 'knopf-an' : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="2.3" />
            <path d="M12 3.6a8.4 8.4 0 000 16.8z" fill="currentColor" />
          </svg>
        </button>
      </footer>

      {(tagLaedt || duellLaedt) && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-nacht-tief/90 px-6">
          <p className="font-anzeige text-lg font-bold text-creme">
            {duellLaedt ? t('spiel.duellLaedt') : t('spiel.tagLaedt')}
          </p>
        </div>
      )}

      {kopiert && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex justify-center px-6">
          <p className="rounded-full border border-zitrus/50 bg-theke px-4 py-2 text-xs font-bold text-zitrus">
            {t('spiel.kopiert')}
          </p>
        </div>
      )}

      {videoLeer && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 flex justify-center px-6">
          <p className="rounded-full border border-kante bg-theke px-4 py-2 text-xs font-bold text-rauch">
            {t('spiel.videoNichts')}
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
      {steckt && !geloest && duellAusgang === null && (
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
              {/* Das Extra-Glas ist die zweite Rettung, und es gibt sie GENAU
                  HIER: ein leeres Glas macht aus einer Sackgasse fast immer
                  wieder ein loesbares Brett. Nicht im Tagesraetsel — der Server
                  baut das Brett ohne dieses Glas nach, eine Zugfolge damit waere
                  nicht pruefbar und in einer Bestenliste nicht vergleichbar. */}
              {!imTag && !imDuell && !partie.hatExtraGlas && belohnungMoeglich() && (
                <button type="button" className="knopf" disabled={videoLaeuft} onClick={holeExtraGlas}>
                  {t('spiel.extraGlasHolen')}
                </button>
              )}
              {!reichtFuer(muenzen, KOSTEN_RUECKKAUF) && belohnungMoeglich() && (
                <button type="button" className="knopf" disabled={videoLaeuft} onClick={holeMuenzen}>
                  {t('spiel.muenzenVideo', { n: BELOHNUNG_VIDEO })}
                </button>
              )}
              <button type="button" className="knopf" onClick={neustart}>
                {t('spiel.neustart')}
              </button>
              {/* Im Duell ist der Neustart kein voller Ausweg: der Gegner hat
                  seine Zugzahl schon. Wer nicht weiterkommt, soll die Partie
                  beenden koennen, statt sie liegen zu lassen — serverseitig
                  ist „gueltig gespielt, aber nicht geloest" genauso ein
                  Ergebnis (siehe pruefeDuell). */}
              {imDuell && (
                <button type="button" className="knopf" onClick={() => duellEnde(null)}>
                  {t('spiel.duellAufgeben')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {(geloest || duellAusgang !== null) && (
        /* Unten verankert und OHNE Unschaerfe: das geloeste Brett bleibt oben
           sichtbar. Vorher lag es mittig hinter einem dunklen, verwischten
           Schleier, und man sah nie, was man geschafft hatte. Die Abfolge —
           erst jubeln die Glaeser, dann kommt die Karte — steht in index.css
           unter „Der Sieg". */
        <div className="fixed inset-0 z-10 flex items-end justify-center px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="sieg-schleier absolute inset-0 bg-[linear-gradient(0deg,rgba(10,18,32,0.97)_0%,rgba(10,18,32,0.82)_36%,rgba(10,18,32,0.12)_62%,rgba(10,18,32,0)_100%)]" />
          {geloest && !imDuell && sterne === 3 && <Funken />}
          <div className="sieg-karte relative w-full max-w-xs rounded-3xl border border-messing/30 bg-theke p-7 text-center shadow-[0_-10px_40px_rgba(0,0,0,0.45)]"
            data-duell-ausgang={duellAusgang ?? undefined}>
            <div className="flex items-end justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <svg key={i} width={i === 1 ? 54 : 40} height={i === 1 ? 54 : 40} viewBox="0 0 24 24" aria-hidden="true"
                  className={i < sterne ? 'sieg-stern' : undefined}
                  fill={i < sterne ? 'var(--color-zitrus)' : 'none'}
                  stroke={i < sterne ? 'none' : '#2F4A6B'} strokeWidth="2.2" strokeLinejoin="round"
                  style={i < sterne
                    ? { filter: 'drop-shadow(0 0 14px rgba(255,201,60,0.55))', animationDelay: `${1250 + i * 160}ms` }
                    : undefined}>
                  <path d="M12 2.4l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5 6.1 20.6l1.2-6.6L2.5 9.4l6.6-.9z" />
                </svg>
              ))}
            </div>
            <h2 className="font-anzeige mt-4 text-3xl leading-tight font-bold">
              {duellAusgang === 'a' ? t('spiel.duellGewonnen')
                : duellAusgang === 'b' ? t('spiel.duellVerloren')
                : duellAusgang === 'remis' ? t('spiel.duellRemis')
                : sterne === 3 ? t('spiel.perfekt') : t('spiel.gewonnen')}
            </h2>
            {letztes && (
              <p className="mt-2 text-sm font-bold text-zitrus">
                {t('spiel.durch', { n: gesamtSterne, gesamt: FOLGE.length * 3 })}
              </p>
            )}
            {/* Gezeichnete Flamme statt 🔥 — dasselbe wie beim Glas in der
                Levelwahl. Im GETEILTEN Text bleiben Emoji, dort sind sie der
                Inhalt; in der Oberflaeche haben sie nichts verloren. */}
            {imTag && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-bold text-zitrus"
                data-serie={taeglich.serie}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.8 2.2c.3 2.6-.7 4-2 5.3-1.4 1.4-3 2.9-3 5.9a6.2 6.2 0 1012.4 0c0-2-.8-3.6-1.9-4.9-.3 1-.9 1.8-1.7 2.2.3-2.9-1-6.2-3.8-8.5z" />
                </svg>
                {t('spiel.serie', { n: taeglich.serie })}
              </p>
            )}
            {imDuell ? (
              <div className="mt-3 flex flex-col gap-0.5">
                <p className="text-sm font-bold text-creme" data-duell-du={geloest ? zuege : -1}>
                  {geloest ? t('spiel.duellDu', { n: zuege }) : t('spiel.duellDuOhne')}
                </p>
                <p className="text-sm font-bold text-rauch" data-duell-gegner={gegner?.zugzahl ?? -1}>
                  {t('spiel.duellGegnerZuege', { n: gegner?.zugzahl ?? 0 })}
                </p>
                <p className="mt-1 text-xs text-rauch">
                  {t('spiel.duellOptimum', { n: level.optimalZuege })}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-rauch">{t('spiel.bilanz', { zuege, optimum: level.optimalZuege })}</p>
            )}
            {/* Der Muenzgewinn als eigener Chip und nicht als weitere Zeile:
                er ist das einzige hier, was man MITNIMMT — die Zugzahl und
                die Sterne gehoeren zum Level, die Muenzen zum Spieler. */}
            {gewinn > 0 && (
              <div className="mt-3 flex justify-center" data-gewinn={gewinn}>
                <span className="flex items-center gap-1.5 rounded-full border border-zitrus/30 bg-zitrus/10 px-3.5 py-1.5 text-sm font-bold text-zitrus tabular-nums">
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" fill="var(--color-zitrus)" />
                    <circle cx="12" cy="12" r="5.6" fill="none" stroke="rgba(120,78,10,0.5)" strokeWidth="1.6" />
                  </svg>
                  {t('spiel.gewinn', { n: gewinn })}
                </span>
              </div>
            )}
            {!imDuell && sterne < 3 && (
              <p className="mt-1 text-xs text-rauch">
                {partie.hatExtraGlas ? t('spiel.extraGlasZwei') : t('spiel.dreiSterne', { n: level.optimalZuege })}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2.5">
              {/* Beim letzten Level fuehrt der Hauptknopf in die Levelwahl.
                  Vorher stand hier ein abgeschalteter Knopf mit der Aufschrift
                  „Ende" — eine Sackgasse als Belohnung. */}
              {imDuell ? (
                <button type="button" onClick={starteDuell} className="knopf knopf-an">
                  {t('spiel.duellNochmal')}
                </button>
              ) : imTag ? (
                <button type="button" onClick={teilen} className="knopf knopf-an">
                  {t('spiel.teilen')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => (letztes ? navigate('/level') : wechsle(index + 1))}
                  className="knopf knopf-an"
                >
                  {letztes ? t('spiel.levelwahl') : t('spiel.weiter')}
                </button>
              )}
              <div className="flex gap-2.5">
                {/* Im Duell gibt es kein „Nochmal" auf demselben Brett: der
                    Gegner hat seine Zugzahl bereits, ein zweiter Anlauf waere
                    also gegen einen Gegner, der nicht mehr mitspielt. */}
                {!imDuell && (
                  <button type="button" className="knopf flex-grow" onClick={neustart}>
                    {t('spiel.nochmal')}
                  </button>
                )}
                {imTag || imDuell ? (
                  <button type="button" className="knopf flex-grow" onClick={zurFolge}>
                    {t('spiel.zurFolge')}
                  </button>
                ) : !letztes && (
                  <button type="button" className="knopf flex-grow" onClick={() => navigate('/level')}>
                    {t('spiel.levelwahl')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
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

/**
 * Funken beim perfekten Sieg: 28 Stueckchen in den Farben der Saefte.
 * Nur bei drei Sternen — sonst waere der Unterschied zwischen „geschafft"
 * und „perfekt" nur noch ein Wort.
 *
 * Die Bahnen sind aus einer festen Saat gerechnet, nicht `Math.random`:
 * zwei Siege sehen gleich aus, und ein Neuzeichnen laesst sie nicht springen.
 */
function Funken() {
  const stuecke = [];
  for (let k = 0; k < 28; k++) {
    const winkel = (k / 28) * Math.PI * 2 + ((k * 7) % 5) * 0.09;
    const weite = 90 + ((k * 37) % 70);
    const f = FARBEN[k % FARBEN.length]!;
    stuecke.push(
      <span
        key={k}
        className="funke"
        style={{
          background: f.ton,
          ['--fx' as string]: `${Math.cos(winkel) * weite}px`,
          ['--fy' as string]: `${Math.sin(winkel) * weite * 0.8 - 90}px`,
          ['--dreh' as string]: `${((k * 53) % 360) - 180}deg`,
          animationDelay: `${780 + (k % 4) * 40}ms`,
        }}
      />,
    );
  }
  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">{stuecke}</div>;
}
