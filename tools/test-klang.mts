// Prueft die Regeln der Bar-Geraeusche.
//
// WebAudio gibt es in node nicht, und ein Test, der einen Ton anhoert, waere
// ohnehin keiner. Geprueft wird deshalb wie bei der Werbebremse die REGEL:
// wie lange ein Guss klingt, welche Toene ein Sieg hat, und dass beides mit
// jedem Wert klarkommt, den die Oberflaeche hineinreichen kann.
//
// Klein, aber nicht umsonst: `gussDauer` haengt an der Menge, und die kommt
// aus der Engine. Liefe sie aus dem Ruder, liefe ein Guss in den naechsten Zug
// hinein — im Test liegen Antippen und Giessen 45 ms auseinander, und ein
// Mensch ist kaum langsamer.
//
// Aufruf: npx tsx tools/test-klang.mts
// Schneller: node tools/test-klang.mts
import { existsSync, readFileSync, statSync } from 'node:fs';
import { LAUTSTAERKE, gussDauer, gussTempo, siegToene } from '../src/lib/klangregeln.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

console.log('--- Die Dauer eines Gusses ---');
{
  // Mehr Schichten, laenger — das ist der ganze Grund, warum hier gerechnet
  // und keine Tondatei abgespielt wird.
  let vorher = 0;
  let steigt = true;
  for (let m = 1; m <= 8; m++) {
    const d = gussDauer(m);
    if (d <= vorher) steigt = false;
    vorher = d;
  }
  ok(steigt, 'die Dauer waechst mit der Menge');
  ok(gussDauer(1) >= 0.15, `ein Guss von einer Schicht ist hoerbar (${gussDauer(1).toFixed(2)} s)`);

  // Der Deckel ist kein Schoenheitswert: die Oberflaeche laesst zwischen zwei
  // Zuegen 45 ms; ueberlappende Guesse wuerden zu Matsch.
  ok(gussDauer(8) <= 0.7, `der groesste Guss bleibt kurz (${gussDauer(8).toFixed(2)} s)`);
  ok(gussDauer(99) === gussDauer(8), 'mehr als acht Schichten gibt es nicht — gedeckelt');

  // Was aus der Oberflaeche hereinkommt, ist nicht immer sauber.
  ok(gussDauer(0) === gussDauer(1), 'eine Menge von 0 klingt wie eine Schicht, nicht wie nichts');
  ok(gussDauer(-5) === gussDauer(1), 'auch eine negative Menge');
  ok(Number.isFinite(gussDauer(2.4)), 'gebrochene Mengen ergeben eine endliche Dauer');
  ok(gussDauer(2.4) === gussDauer(2), '... und werden gerundet');
}

console.log('\n--- Die Siegmelodie ---');
{
  ok(siegToene(1).length === 2, 'ein Stern: zwei Toene');
  ok(siegToene(2).length === 3, 'zwei Sterne: drei');
  ok(siegToene(3).length === 4, 'drei Sterne: vier — man hoert, wie gut es war');
  // Ein absteigender Dreiklang klaenge nach Niederlage.
  const t = siegToene(3);
  ok(t.every((f, i) => i === 0 || f > t[i - 1]!), 'die Toene steigen');
  ok(t.every((f) => f > 100 && f < 5000), 'alle im hoerbaren, nicht schrillen Bereich');
  ok(siegToene(0).length === 2 && siegToene(9).length === 4,
     'ausserhalb von 1..3 wird geklemmt statt geworfen');
}

console.log('\n--- Tonhoehe nach Fuellstand ---');
{
  // Ein volleres Glas klingt heller. Steigt das Tempo nicht, klingt jeder
  // Guss gleich; ist der Bereich zu weit, klingt es nach Zeichentrick.
  let steigt = true;
  for (let v = 0; v < 6; v++) if (gussTempo(v + 1, v + 2, 6) <= gussTempo(v, v + 1, 6)) steigt = false;
  ok(steigt, 'das Tempo steigt mit dem Fuellstand');
  ok(gussTempo(0, 1, 6) >= 0.9 && gussTempo(5, 6, 6) <= 1.15,
     `und bleibt im Rahmen (${gussTempo(0, 1, 6).toFixed(2)}–${gussTempo(5, 6, 6).toFixed(2)})`);
  ok(Number.isFinite(gussTempo(0, 0, 0)) && gussTempo(-3, 99, 6) <= 1.15,
     'unsinnige Werte werden geklemmt');
}

console.log('\n--- Leise genug ---');
{
  // Ein Sortierspiel wird nebenher gespielt, oft in der Bahn. Volle
  // Aussteuerung waere hier der sicherste Weg, abgeschaltet zu werden.
  ok(LAUTSTAERKE > 0 && LAUTSTAERKE <= 0.25,
     `die Grundlautstaerke ist gedaempft (${LAUTSTAERKE})`);
}

console.log('\n--- Genau eine Tondatei, und die liegt im Bundle ---');
{
  // Bis zum 13.11.2026 galt: KEINE Tondateien, alles wird im Browser erzeugt.
  // Fuer das Giessen ist das gefallen — Josef hat den berechneten Klang
  // zweimal abgelehnt und eine echte Aufnahme gewaehlt. Was bleibt, ist der
  // Grund der alten Regel: offline darf nichts fehlen. Also genau EINE Datei,
  // gebuendelt aus src/assets/ton/, und nichts aus dem Netz.
  const quelle = readFileSync(new URL('../src/lib/klang.ts', import.meta.url), 'utf8');
  const importe = [...quelle.matchAll(/from\s+['"]([^'"]+\.(?:mp3|ogg|wav|m4a|aac))['"]/g)].map((m) => m[1]);
  ok(importe.length === 1 && importe[0] === '../assets/ton/giessen.m4a',
     `genau eine gebuendelte Tondatei (${importe.join(', ') || 'keine'})`);
  ok(!/https?:\/\//.test(quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')),
     '... und nichts aus dem Netz');
  ok(!/new\s+Audio\s*\(/.test(quelle), '... ohne <audio>-Element (das liesse sich nicht mischen)');
  const datei = statSync(new URL('../src/assets/ton/giessen.m4a', import.meta.url));
  ok(datei.size > 1000 && datei.size < 20000, `die Datei ist klein (${datei.size} Bytes)`);
  ok(existsSync(new URL('../src/assets/ton/QUELLE.md', import.meta.url)),
     '... und ihre Herkunft steht daneben');
  ok(quelle.includes('createOscillator'), 'die uebrigen Geraeusche erzeugt klang.ts weiter selbst');

  // Und jeder Zugriff ist eingepackt: WebAudio fehlt in alten Browsern und ist
  // in manchen eingebetteten Ansichten gesperrt. Eine Ausnahme waere eine
  // Zeile in der Konsole — und der Oberflaechentest zaehlt die.
  const oeffentlich = (quelle.match(/export function klang\w+/g) ?? []).length;
  const faenge = (quelle.match(/catch \{ \/\* still \*\/ \}/g) ?? []).length;
  ok(oeffentlich >= 5, `${oeffentlich} Geraeusche`);
  ok(faenge === oeffentlich, `... und jedes einzelne faengt seine Fehler (${faenge})`);
}

console.log('\n--- Die Trennung, die diesen Test moeglich macht ---');
{
  // `klang.ts` braucht `AudioContext` und kann deshalb nie in das
  // Node-Projekt (tsconfig.node.json hat bewusst KEINE DOM-Typen — das ist
  // der Schutz, der die Engine nach Deno portierbar haelt). Die Regeln liegen
  // darum in `klangregeln.ts`. Wandern sie zurueck, laesst sich dieser Test
  // nicht mehr ausfuehren, und `npm run build` faellt mit „Cannot find name
  // AudioContext" — genau das ist hier beim ersten Anlauf passiert.
  const regeln = readFileSync(new URL('../src/lib/klangregeln.ts', import.meta.url), 'utf8');
  // Kommentare erst weg: der Kopf der Datei ERKLAERT, warum sie kein
  // `AudioContext` benutzt, und ein Test, der die Begruendung verbietet, ist
  // keiner. Genau dieselbe Falle wie eine Zeile darueber bei den Tondateien —
  // zweimal in einem Test ist eine Lehre wert.
  const ohneKommentare = regeln
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  ok(!/AudioContext|window\.|document\.|localStorage/.test(ohneKommentare),
     'klangregeln.ts kommt ohne Browser-Globale aus');
  ok(!/^import /m.test(ohneKommentare), '... und ohne Importe');
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
