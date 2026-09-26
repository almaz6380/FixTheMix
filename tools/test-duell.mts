// Prueft die Duelle: Brett, Bot, Ausgang, Schummelschutz und die Bilanz.
//
// Drei Stellen, an denen ein Fehler nicht auffaellt, bis jemand sich zu Recht
// beschwert:
//
//  1. Das Brett. Bekaemen zwei Spieler desselben Duells verschiedene Bretter,
//     waeren die Zugzahlen nicht vergleichbar — und niemand koennte das
//     hinterher nachstellen. Deshalb wird hier geprueft, dass `duellLevel`
//     bitgenau bleibt, und zwar gegen eine feste Tabelle.
//  2. Der Bot. Er muss eine ECHTE Zugfolge liefern, die durch `replay()` geht,
//     und er muss auf jedem Geraet dieselbe spielen. Ein Bot, der einmal so
//     und einmal anders rechnet, zeigt zwei Spielern zwei Ergebnisse.
//  3. Der Ausgang. Ein Remis muss ein Remis bleiben — jedes Stechen waere
//     unfair (siehe duell.ts).
//
// Aufruf: npx tsx tools/test-duell.mts
// Schneller: node tools/test-duell.mts
import {
  DUELL_STUFE, botSpielt, duellLevel, duellSeed, duellSieger, naechsteStaerke,
  type Staerke,
} from '../src/engine/duell.ts';
import { pruefeDuell, werteDuell } from '../src/engine/duellpruefung.ts';
import { solve } from '../src/engine/loeser.ts';
import { MAX_ZUEGE, replay } from '../src/engine/wiedergabe.ts';
import { standAusLevel, pruefeInvariante, schluessel } from '../src/engine/zustand.ts';
import {
  ausgangZaehlen, BILANZ_LEER, naechsteNummer, type DuellBilanz,
} from '../src/lib/duell.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

const STAERKEN: Staerke[] = ['leicht', 'mittel', 'stark'];

console.log('--- Das Brett ---');
{
  const level = duellLevel(1);
  ok(level.version === 3, 'Format 3');
  ok(level.glaeser === DUELL_STUFE.glaeser && level.hoehe === DUELL_STUFE.hoehe,
     `${level.glaeser} Glaeser mit ${level.hoehe} Schichten`);
  ok(pruefeInvariante(standAusLevel(level)) === '', 'der Startstand ist in sich stimmig');
  ok(level.optimalZuege >= DUELL_STUFE.zuegeMin && level.optimalZuege <= DUELL_STUFE.zuegeMax,
     `das Optimum liegt im Band (${level.optimalZuege})`);

  // Das Optimum ist BEWIESEN, nicht geschaetzt — daran haengen die Sterne und
  // jetzt auch der Duellsieg.
  const l = solve(standAusLevel(level));
  ok(l.status === 'optimal' && l.laenge === level.optimalZuege,
     `und es ist bewiesen (Loeser: ${l.status}, ${l.laenge})`);

  // Bitgenau gleich, und zwar nicht nur „zweimal hintereinander": der
  // Schluessel wird gegen eine feste Tabelle gehalten. Eine Aenderung, die die
  // Nummer-zu-Brett-Abbildung verschiebt, entwertet jedes laufende Duell.
  const golden: Record<number, string> = {};
  for (const nr of [1, 2, 7, 42, 1000]) golden[nr] = schluessel(standAusLevel(duellLevel(nr)));
  let gleich = 0;
  for (const nr of [1, 2, 7, 42, 1000]) {
    if (schluessel(standAusLevel(duellLevel(nr))) === golden[nr]) gleich++;
  }
  ok(gleich === 5, `dieselbe Nummer ergibt dasselbe Brett (${gleich}/5)`);

  // Und verschiedene Nummern ergeben verschiedene Bretter — der Seed wird
  // gehasht und nicht durchgezaehlt, genau dafuer.
  const schluessel5 = new Set([1, 2, 3, 4, 5].map((n) => schluessel(standAusLevel(duellLevel(n)))));
  ok(schluessel5.size === 5, `fuenf Nummern, fuenf Bretter (${schluessel5.size})`);
  const seeds = new Set([1, 2, 3, 4, 5].map(duellSeed));
  ok(seeds.size === 5, 'und fuenf verschiedene Seeds');
  ok(duellSeed(1) !== 1 && Math.abs(duellSeed(1) - duellSeed(2)) > 1000,
     'benachbarte Nummern liegen weit auseinander');
}

console.log('\n--- Der Bot spielt wirklich ---');
{
  const level = duellLevel(3);
  for (const s of STAERKEN) {
    const b = botSpielt(level, s, 77);
    ok(b.zugzahl !== null, `${s}: loest das Brett (${b.zugzahl} Zuege)`);
    ok(b.zuege.length === b.zugzahl, `${s}: Zugzahl und Zugliste passen zusammen`);

    // Der Kern: die Zugfolge des Bots muss durch dieselbe Pruefung gehen wie
    // die eines Menschen. Ein Bot mit einer erfundenen Zahl waere nicht
    // nachspielbar — und damit serverseitig nicht auswertbar.
    const w = replay(level, b.zuege);
    ok(w.gueltig && w.geloest, `${s}: die Zugfolge ist nachspielbar und loest`);
    ok(w.zuege === b.zugzahl, `${s}: und der Server zaehlt dieselbe Zahl`);
    ok(b.zugzahl! >= level.optimalZuege, `${s}: nie besser als das bewiesene Optimum`);
  }

  // Deterministisch. Ohne das saehe derselbe Gegner auf zwei Geraeten anders
  // aus — und ein Duell waere nicht nachpruefbar.
  const a = botSpielt(level, 'mittel', 5);
  const b = botSpielt(level, 'mittel', 5);
  ok(a.zugzahl === b.zugzahl && JSON.stringify(a.zuege) === JSON.stringify(b.zuege),
     'gleicher Seed, bitgenau dieselbe Partie');
  const c = botSpielt(level, 'mittel', 6);
  ok(JSON.stringify(a.zuege) !== JSON.stringify(c.zuege),
     'anderer Seed, andere Partie');
}

console.log('\n--- Die Staerken sind wirklich verschieden ---');
{
  // Ohne diese Messung waere die Leiter eine Behauptung. Genau hier ist beim
  // ersten Anlauf ein Fehler aufgefallen: „leicht" spielte auf manchen
  // Brettern das Optimum, weil ein Zug, der vom Plan abweicht, noch lange kein
  // Fehler ist — viele Bretter haben mehrere gleich gute erste Zuege. Gezaehlt
  // wird jetzt nur ein Zug, der die Partie wirklich verlaengert.
  const zuschlag: Record<Staerke, number[]> = { leicht: [], mittel: [], stark: [] };
  let langsamster = 0;
  for (let nr = 10; nr < 22; nr++) {
    const level = duellLevel(nr);
    for (const s of STAERKEN) {
      const t = Date.now();
      const b = botSpielt(level, s, nr * 31);
      langsamster = Math.max(langsamster, Date.now() - t);
      if (b.zugzahl === null) { fehler++; console.log(` FEHL  ${s} gab auf (Duell ${nr})`); continue; }
      zuschlag[s]!.push(b.zugzahl - level.optimalZuege);
    }
  }
  const schnitt = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const sL = schnitt(zuschlag.leicht), sM = schnitt(zuschlag.mittel), sS = schnitt(zuschlag.stark);
  console.log(`       Zuschlag im Schnitt: leicht +${sL.toFixed(1)}, mittel +${sM.toFixed(1)}, stark +${sS.toFixed(1)}`);
  ok(sL > sM && sM > sS, 'die Leiter stimmt: leicht braucht mehr Zuege als mittel als stark');
  ok(sL - sS >= 4, `und der Abstand ist spuerbar (${(sL - sS).toFixed(1)} Zuege)`);

  // Die oberste Stufe muss SCHLAGBAR bleiben — sonst ist sie keine Aufgabe,
  // sondern eine Wand. Genau ein Umweg heisst: die perfekte Partie gewinnt.
  ok(Math.min(...zuschlag.stark!) >= 1,
     `„stark" spielt nie das Optimum, ist also mit einer perfekten Partie zu schlagen (min +${Math.min(...zuschlag.stark!)})`);
  ok(langsamster < 2000, `der langsamste Botlauf bleibt unter zwei Sekunden (${langsamster} ms)`);
}

console.log('\n--- Wer gewinnt ---');
{
  ok(duellSieger(17, 19) === 'a', 'weniger Zuege gewinnt');
  ok(duellSieger(19, 17) === 'b', '... in beide Richtungen');
  // Kein Stechen ueber Zeit oder Reihenfolge: das eine belohnt das schnellere
  // Telefon, das andere die guenstigere Zeitzone.
  ok(duellSieger(18, 18) === 'remis', 'gleich viele Zuege sind ein Remis');
  ok(duellSieger(null, 25) === 'b', 'wer nicht loest, verliert');
  ok(duellSieger(25, null) === 'a', '... auch andersherum');
  ok(duellSieger(null, null) === 'remis', 'wenn beide nicht loesen, ist es ein Remis');
  ok(duellSieger(0, 1) === 'a', 'auch bei kleinen Zahlen');
}

console.log('\n--- Die Staerke passt sich an ---');
{
  ok(naechsteStaerke('leicht', 'a') === 'mittel', 'ein Sieg macht den naechsten Gegner haerter');
  ok(naechsteStaerke('mittel', 'a') === 'stark', '... noch einmal');
  ok(naechsteStaerke('stark', 'a') === 'stark', '... aber nicht ueber die oberste Stufe hinaus');
  ok(naechsteStaerke('stark', 'b') === 'mittel', 'eine Niederlage macht ihn leichter');
  ok(naechsteStaerke('leicht', 'b') === 'leicht', '... aber nicht unter die unterste');
  // Ein Remis heisst „gleich gut" — das ist kein Grund, etwas zu aendern.
  ok(naechsteStaerke('mittel', 'remis') === 'mittel', 'ein Remis laesst die Staerke stehen');
  ok(naechsteStaerke('mittel', null) === 'mittel', 'und ohne Vorgeschichte auch');
}

console.log('\n--- Der Schummelschutz rechnet, er glaubt nicht ---');
{
  const nummer = 4;
  const level = duellLevel(nummer);
  const loesung = solve(standAusLevel(level));

  const gut = pruefeDuell({ nummer, zuege: loesung.zuege });
  ok(gut.ok && gut.zuege === level.optimalZuege,
     `die perfekte Partie wird angenommen (${gut.zuege} Zuege)`);
  ok(gut.optimum === level.optimalZuege, 'und das Optimum kommt vom Server, nicht vom Client');

  // Ein Zug zu viel am Ende: ungueltig, weil das Brett dann schon geloest war.
  const zuLang = pruefeDuell({ nummer, zuege: [...loesung.zuege, { von: 0, nach: 1 }] });
  ok(!zuLang.ok || zuLang.zuege !== level.optimalZuege,
     'eine manipulierte Zugfolge kommt nicht als perfekte Partie durch');

  // Ein erfundener Glasindex.
  const falsch = pruefeDuell({ nummer, zuege: [{ von: 0, nach: 99 }] });
  ok(!falsch.ok && falsch.grund === 'ungueltiger-zug',
     `ein Glas, das es nicht gibt, wird abgewiesen (${falsch.grund}/${falsch.zugGrund})`);
  ok(falsch.fehlerIndex === 0, '... mit dem Index des ersten falschen Zuges');

  // Halbe Partie: KEIN Betrug, sondern eine Niederlage. Wer sich festfaehrt,
  // darf nicht abgewiesen werden.
  const halb = pruefeDuell({ nummer, zuege: loesung.zuege.slice(0, 3) });
  ok(halb.ok && halb.grund === 'nicht-geloest' && halb.zuege === null,
     'eine nicht beendete Partie ist ein Ergebnis, kein Fehler');

  // Muell aus dem Netz.
  ok(pruefeDuell({ nummer: -1, zuege: [] }).grund === 'nummer-form', 'negative Nummer abgewiesen');
  ok(pruefeDuell({ nummer: 1.5, zuege: [] }).grund === 'nummer-form', 'gebrochene Nummer abgewiesen');
  ok(pruefeDuell({ nummer, zuege: null as unknown as [] }).grund === 'ungueltiger-zug',
     'keine Liste abgewiesen');
  const vieleZuege = Array.from({ length: MAX_ZUEGE + 1 }, () => ({ von: 0, nach: 1 }));
  ok(pruefeDuell({ nummer, zuege: vieleZuege }).grund === 'zu-viele-zuege',
     `mehr als ${MAX_ZUEGE} Zuege werden abgewiesen, BEVOR nachgespielt wird`);
}

console.log('\n--- Beide Seiten auswerten ---');
{
  const nummer = 5;
  const level = duellLevel(nummer);
  const perfekt = solve(standAusLevel(level)).zuege;
  const bot = botSpielt(level, 'mittel', 3);

  const e = werteDuell({ nummer, zuege: perfekt }, { nummer, zuege: bot.zuege });
  ok(e.a.zuege === level.optimalZuege && e.b.zuege === bot.zugzahl,
     `beide Zugzahlen selbst nachgezaehlt (${e.a.zuege} : ${e.b.zuege})`);
  ok(e.ausgang === 'a', 'die perfekte Partie gewinnt gegen „mittel"');

  const remis = werteDuell({ nummer, zuege: perfekt }, { nummer, zuege: perfekt });
  ok(remis.ausgang === 'remis', 'zwei perfekte Partien enden remis');

  // Manipulation darf sich nicht lohnen — und dem Gegner auch keinen Sieg
  // schenken, den er nicht gespielt hat.
  const betrug = werteDuell(
    { nummer, zuege: [{ von: 0, nach: 99 }] },
    { nummer, zuege: bot.zuege },
  );
  ok(!betrug.a.ok && betrug.ausgang === 'b', 'eine abgewiesene Einsendung verliert');
}

console.log('\n--- Die Bilanz auf dem Geraet ---');
{
  ok(BILANZ_LEER.siege === 0 && BILANZ_LEER.niederlagen === 0 && BILANZ_LEER.remis === 0,
     'eine frische Bilanz steht auf null');
  ok(BILANZ_LEER.staerke === 'leicht', 'und der erste Gegner ist der leichte');

  let b: DuellBilanz = BILANZ_LEER;
  b = ausgangZaehlen(b, 'a');
  ok(b.siege === 1 && b.staerke === 'mittel', 'ein Sieg zaehlt und hebt die Staerke');
  b = ausgangZaehlen(b, 'a');
  ok(b.siege === 2 && b.staerke === 'stark', 'zwei Siege, oberste Stufe');
  b = ausgangZaehlen(b, 'b');
  ok(b.niederlagen === 1 && b.staerke === 'mittel', 'eine Niederlage senkt sie wieder');
  b = ausgangZaehlen(b, 'remis');
  ok(b.remis === 1 && b.staerke === 'mittel', 'ein Remis zaehlt, aendert aber nichts');
  ok(b.siege === 2 && b.niederlagen === 1, '... und laesst die anderen Zahlen stehen');

  // Die Duellnummer zaehlt hoch und wiederholt sich nicht — sonst bekaeme
  // jemand zweimal dasselbe Brett.
  ok(naechsteNummer(BILANZ_LEER) !== naechsteNummer({ ...BILANZ_LEER, gespielt: 1 }),
     'zwei Partien bekommen verschiedene Nummern');
  ok(b.gespielt === 4, `die Zahl der Partien stimmt (${b.gespielt})`);
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
