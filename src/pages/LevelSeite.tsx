// Die Levelwahl als eigene Seite unter `/level`.
//
// Bis zum 27.09.2026 war sie ein Fenster ueber dem Spielbildschirm, und die
// gesamte Verdrahtung (25 Eigenschaften) stand in `App.tsx`. Diese Datei ist
// das, was davon uebrig bleibt: sie holt den Fortschritt, uebersetzt die Texte
// und reicht beides an die Anzeige weiter.
//
// Die Sperre wird HIER ein zweites Mal geprueft, nicht nur in der Anzeige.
// `istFrei` in src/lib/fortschritt.ts ist die einzige Quelle der Regel — eine
// Regel, die nur an einem `disabled` haengt, ist keine.

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Levelwahl from '../components/Levelwahl.tsx';
import { ANZAHL_LEVEL } from '../engine/kurve.ts';
import type { Level } from '../engine/typen.ts';
import { istFrei, ladeFortschritt, speichereFortschritt } from '../lib/fortschritt.ts';
import roheFolge from '../levels/folge.json';

const FOLGE = roheFolge as unknown as Level[];

export default function LevelSeite() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fortschritt = ladeFortschritt();
  const gesamtSterne = Object.values(fortschritt.sterne).reduce((a, b) => a + b, 0);
  const aktuell = Math.min(
    Math.max(fortschritt.zuletzt, 0),
    Math.max(fortschritt.hoechstes, 0),
    FOLGE.length - 1,
  );

  /**
   * Das gewaehlte Level wird im Fortschritt vermerkt und der Spielbildschirm
   * liest es beim Laden. Bewusst so und nicht ueber den Router-Zustand: damit
   * ueberlebt die Wahl ein Neuladen, und `/spiel` hat genau EINEN Weg, sein
   * Level zu bestimmen.
   */
  const waehle = (i: number) => {
    if (i < 0 || i >= FOLGE.length || !istFrei(fortschritt, i)) return;
    speichereFortschritt({ ...fortschritt, zuletzt: i });
    navigate('/spiel');
  };

  return (
    <Levelwahl
      level={FOLGE}
      aktuell={aktuell}
      sterne={fortschritt.sterne}
      hoechstes={fortschritt.hoechstes}
      onWahl={waehle}
      onZu={() => navigate('/')}
      titel={t('spiel.levelwahl')}
      schliessen={t('spiel.zurueck')}
      bilanz={t('spiel.sterneGesamt', { n: gesamtSterne, gesamt: ANZAHL_LEVEL * 3 })}
      abschnittTitel={(von, bis) => t('spiel.abschnitt', { von, bis })}
      kachelTitel={(nr, s, experte) =>
        t(experte ? 'spiel.kachelExperte' : 'spiel.kachel', { n: nr, sterne: s })}
      gesperrtTitel={(nr) => t('spiel.kachelGesperrt', { n: nr })}
      zurueck={t('spiel.abschnittZurueck')}
      vor={t('spiel.abschnittVor')}
      weiter={t('spiel.weiter')}
    />
  );
}
