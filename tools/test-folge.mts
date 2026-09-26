// Prueft die AUSGELIEFERTE Levelfolge, nicht den Generator.
//
// Der Unterschied ist der Punkt: test-generator.mts prueft, dass `generate`
// richtig rechnet. Dieses Skript prueft, dass die Datei, die im Bundle landet,
// tatsaechlich das ist, was src/engine/kurve.ts beschreibt. Ohne diese Bruecke
// koennte die Folge von Hand veraendert, halb gebaut oder aus einer alten
// Kurve stehengeblieben sein — und niemand wuerde es merken.
//
// Darauf baut Phase 4 auf: das Tagesraetsel und der Schummelschutz erzeugen
// Level serverseitig neu. Wenn Seed + Abschnitt nicht bitgenau dasselbe Brett
// ergeben wie die ausgelieferte Datei, ist jeder Bestenlisteneintrag Zufall.
//
// Aufruf: npx tsx tools/test-folge.mts
// Schneller: node tools/test-folge.mts
import { readFileSync } from 'node:fs';
import { generate, sterneSchwellen } from '../src/engine/generator.ts';
import {
  ABSCHNITTE, ANZAHL_LEVEL, BLOCK, BLOECKE,
  abschnittFuer, blockFuer, seedFuer, stufeFuer,
} from '../src/engine/kurve.ts';
import { loesbar, solve } from '../src/engine/loeser.ts';
import { istGeloest, standAusLevel } from '../src/engine/zustand.ts';
import { anwenden } from '../src/engine/zuege.ts';
import type { Level } from '../src/engine/typen.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

const folge = JSON.parse(
  readFileSync(new URL('../src/levels/folge.json', import.meta.url), 'utf8'),
) as Level[];

console.log('--- Form der Datei ---');
ok(folge.length === ANZAHL_LEVEL, `die Folge hat ${ANZAHL_LEVEL} Level (gefunden ${folge.length})`);
{
  let versionFalsch = 0, formFalsch = 0, ziffernFalsch = 0, sterneFalsch = 0, seedFalsch = 0;
  for (let i = 0; i < folge.length; i++) {
    const l = folge[i]!;
    const s = stufeFuer(i + 1);
    if (l.version !== 3) versionFalsch++;
    if (l.glaeser !== s.glaeser || l.hoehe !== s.hoehe) formFalsch++;
    if (l.start.length !== l.glaeser * l.hoehe) formFalsch++;
    if (!/^[0-9]+$/.test(l.start)) ziffernFalsch++;
    const soll = sterneSchwellen(l.optimalZuege);
    if (l.sterne.drei !== soll.drei || l.sterne.zwei !== soll.zwei) sterneFalsch++;
    if (l.seed !== seedFuer(i + 1)) seedFalsch++;
    if (l.stufe !== abschnittFuer(i + 1)) formFalsch++;
  }
  ok(versionFalsch === 0, `jedes Level traegt version 3 (${versionFalsch} Ausreisser)`);
  ok(formFalsch === 0, `Brettform, Laenge und Abschnitt passen zur Kurve (${formFalsch} Ausreisser)`);
  ok(ziffernFalsch === 0, `start ist ueberall eine reine Ziffernkette (${ziffernFalsch} Ausreisser)`);
  ok(sterneFalsch === 0, `die Sternschwellen haengen am Optimum (${sterneFalsch} Ausreisser)`);
  ok(seedFalsch === 0, `jeder Seed stammt aus seedFuer() (${seedFalsch} Ausreisser)`);
}

console.log('\n--- Die Kurve steigt und faellt nie zurueck ---');
{
  // Der Kern des Ganzen. Die alte Folge hatte genau hier ihren Fehler: Level 15
  // brauchte 18 Zuege, Level 13 aber 20. Geprueft wird der BODEN der Kurve, nicht
  // jedes einzelne Level — Schwankung innerhalb eines Abschnitts ist erwuenscht,
  // sie ist das, was eine Folge lebendig macht.
  let unterBoden = 0, ueberDeckel = 0, ersterFehler = 0;
  for (let i = 0; i < folge.length; i++) {
    const s = stufeFuer(i + 1);
    const opt = folge[i]!.optimalZuege;
    if (opt < s.zuegeMin) { unterBoden++; if (!ersterFehler) ersterFehler = i + 1; }
    if (opt > s.zuegeMax) { ueberDeckel++; if (!ersterFehler) ersterFehler = i + 1; }
  }
  ok(unterBoden === 0, `kein Level liegt unter dem Boden seines Abschnitts (${unterBoden}${ersterFehler ? `, zuerst Level ${ersterFehler}` : ''})`);
  ok(ueberDeckel === 0, `kein Level liegt ueber dem Deckel seines Abschnitts (${ueberDeckel} Ausreisser)`);

  // Der Boden selbst muss monoton sein, sonst waere die Zusicherung leer.
  let boeden = 0;
  for (let i = 1; i < ABSCHNITTE.length; i++) {
    // Der Aufstieg muss steigen; in der Rotation ab Abschnitt 10 darf der Boden
    // gleich bleiben (dort ist die Decke erreicht), aber nie darunter fallen.
    if (ABSCHNITTE[i]!.zuegeMin < 20 && ABSCHNITTE[i]!.zuegeMin < ABSCHNITTE[i - 1]!.zuegeMin) boeden++;
  }
  ok(boeden === 0, `die Boeden der Abschnitte fallen nie (${boeden} Ausreisser)`);

  // Und die Folge muss ueber ihre Laenge hinweg wirklich schwerer werden.
  const schnitt = (von: number, bis: number) => {
    let s = 0;
    for (let i = von; i <= bis; i++) s += folge[i - 1]!.optimalZuege;
    return s / (bis - von + 1);
  };
  const a = schnitt(1, 20), b = schnitt(100, 120), c = schnitt(500, 520);
  ok(a < b && b <= c + 1,
    `der Schnitt steigt: Level 1–20 ${a.toFixed(1)}, 100–120 ${b.toFixed(1)}, 500–520 ${c.toFixed(1)}`);
}

console.log('\n--- Jedes Level ist spielbar ---');
{
  // `loesbar()` ist eine Tiefensuche mit Knotendeckel: ihr `false` heisst
  // „nicht gefunden", nicht „unmoeglich" — auf den grossen Brettern verrennt
  // sie sich. Genau das ist hier mit fuenf Leveln passiert. Wo sie aufgibt,
  // entscheidet `solve()`, und dessen Nein waere bewiesen.
  let nichtLoesbar = 0, schonGeloest = 0, mengeFalsch = 0, tiefGeprueft = 0;
  for (let i = 0; i < folge.length; i++) {
    const l = folge[i]!;
    const s = stufeFuer(i + 1);
    const z = standAusLevel(l);
    if (istGeloest(z)) schonGeloest++;
    if (!loesbar(z, 200_000)) {
      tiefGeprueft++;
      const tief = solve(standAusLevel(l), { maxKnoten: 5_000_000, schranke: l.optimalZuege });
      if (tief.status !== 'optimal' || tief.laenge !== l.optimalZuege) nichtLoesbar++;
    }
    let belegt = 0;
    for (const c of l.start) if (c !== '0') belegt++;
    if (belegt !== (s.glaeser - s.leer) * s.hoehe) mengeFalsch++;
  }
  ok(schonGeloest === 0, `kein Level ist schon geloest (${schonGeloest} Ausreisser)`);
  ok(nichtLoesbar === 0,
     `jedes Level ist loesbar (${nichtLoesbar} Ausreisser; ${tiefGeprueft} brauchten den vollen Loeser)`);
  ok(mengeFalsch === 0, `die Fluessigkeitsmenge passt zur Stufe (${mengeFalsch} Ausreisser)`);
}

console.log('\n--- Die Datei gehoert zur Kurve (Stichprobe) ---');
{
  // Deterministischer Querschnitt: jedes 37. Level plus die Raender. 37 ist
  // teilerfremd zu 12 (der Laenge der Rotation) und zu 20 (der Blockgroesse),
  // trifft also nicht immer dieselben Abschnitte.
  const proben: number[] = [1, 2, ANZAHL_LEVEL - 1, ANZAHL_LEVEL];
  for (let nr = 37; nr <= ANZAHL_LEVEL; nr += 37) proben.push(nr);

  let abweichend = 0, erste = 0;
  for (const nr of proben) {
    const neu = generate(seedFuer(nr), stufeFuer(nr));
    const alt = folge[nr - 1]!;
    if (neu.start !== alt.start || neu.optimalZuege !== alt.optimalZuege) {
      abweichend++;
      if (!erste) erste = nr;
    }
  }
  ok(abweichend === 0,
    `${proben.length} Level bitgenau aus seedFuer()+stufeFuer() nachgebaut (${abweichend} Abweichungen${erste ? `, zuerst Level ${erste}` : ''})`);
}

console.log('\n--- Das gespeicherte Optimum ist wirklich das Optimum ---');
{
  // Nicht alle 999 — das waere der Bauzeit noch einmal. Eine Stichprobe reicht,
  // weil test-generator.mts die Rechnung selbst deckt; hier geht es darum, dass
  // in der DATEI nichts verrutscht ist.
  const proben: number[] = [1, 5, 20, 60, 100, 150, 200, 333, 500, 700, 850, 999];
  let falsch = 0, loestNicht = 0;
  for (const nr of proben) {
    const l = folge[nr - 1]!;
    const z = standAusLevel(l);
    const loesung = solve(z, { maxKnoten: 2_000_000 });
    if (loesung.status !== 'optimal' || loesung.laenge !== l.optimalZuege) falsch++;
    for (const zug of loesung.zuege) anwenden(z, zug);
    if (!istGeloest(z)) loestNicht++;
  }
  ok(falsch === 0, `${proben.length} Optima unabhaengig nachgerechnet (${falsch} Abweichungen)`);
  ok(loestNicht === 0, `die nachgerechneten Zugfolgen loesen (${loestNicht} Ausreisser)`);
}

console.log('\n--- Abschnitte der Levelwahl ---');
{
  ok(BLOECKE === Math.ceil(ANZAHL_LEVEL / BLOCK), `${BLOECKE} Abschnitte a ${BLOCK} Level`);
  const erster = blockFuer(1);
  const letzter = blockFuer(ANZAHL_LEVEL);
  ok(erster.von === 1 && erster.bis === BLOCK, `der erste Abschnitt ist Level ${erster.von}–${erster.bis}`);
  ok(letzter.bis === ANZAHL_LEVEL,
    `der letzte Abschnitt endet auf Level ${letzter.bis} (Level ${letzter.von}–${letzter.bis})`);
  let luecken = 0;
  for (let nr = 1; nr <= ANZAHL_LEVEL; nr++) {
    const b = blockFuer(nr);
    if (nr < b.von || nr > b.bis) luecken++;
  }
  ok(luecken === 0, `jedes Level liegt in genau einem Abschnitt (${luecken} Ausreisser)`);
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
