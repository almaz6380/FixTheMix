// Prueft Rechtstexte und Sprachdateien.
//
// Beides sind Stellen, an denen ein Fehler NICHT auffaellt, bis es zu spaet ist:
// ein fehlender Textschluessel zeigt einem spanischen Spieler eine deutsche
// Zeile, und ein Rechtstext mit einem uebrig gebliebenen Platzhalter geht so in
// den Store. Apple und Google pruefen das nicht — die pruefen nur, ob die Seite
// erreichbar ist.
//
// Aufruf: npx tsx tools/test-recht.mts
// Schneller: node tools/test-recht.mts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { BETREIBER, RECHTS_PFADE, STAND, rechtsTexte } from '../src/pages/legal/legalContent.ts';
import type { RechtsSchluessel } from '../src/pages/legal/legalContent.ts';

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

const SCHLUESSEL: RechtsSchluessel[] = ['impressum', 'datenschutz', 'nutzung', 'loeschen'];

console.log('--- Die vier Rechtstexte ---');
for (const k of SCHLUESSEL) {
  for (const sprache of ['de', 'en'] as const) {
    const d = rechtsTexte[k][sprache];
    ok(d.titel.length > 0 && d.abschnitte.length >= 4,
       `${k}/${sprache}: Titel und ${d.abschnitte.length} Abschnitte`);
    const leer = d.abschnitte.filter((a) => a.titel.trim() === '' || a.text.trim().length < 20);
    ok(leer.length === 0, `${k}/${sprache}: kein leerer oder halber Abschnitt (${leer.length})`);
  }
}

console.log('\n--- Nichts vergessen ---');
{
  const alles = SCHLUESSEL.flatMap((k) =>
    (['de', 'en'] as const).flatMap((s) =>
      rechtsTexte[k][s].abschnitte.map((a) => `${a.titel}\n${a.text}`)))
    .join('\n');

  // Platzhalter, die im Store peinlich waeren.
  for (const wort of ['AUSFUELLEN', 'TODO', 'XXX', 'Lorem', 'PLATZHALTER', '{{']) {
    ok(!alles.includes(wort), `kein „${wort}" in den Texten`);
  }

  // Und kein Rest von Anigosha — die Texte sind von dort uebernommen, und genau
  // solche Reste sind der wahrscheinlichste Fehler bei einer Uebernahme.
  //
  // „Spielername" und „Avatar" stehen NICHT auf dieser Liste, obwohl sie aus
  // Anigosha stammen: die Datenschutzerklaerung sagt ausdruecklich, dass es
  // beides hier NICHT gibt („keine E-Mail-Adresse, keinen Spielernamen"). Ein
  // Verbot haette also den richtigen Satz verboten — der erste Lauf dieses
  // Tests hat genau das getan.
  //
  // „Duell" stand bis Phase 7 ebenfalls auf der Liste, und zu Recht: damals
  // konnte es nur ein Rest aus Anigosha sein. Seit es in FixTheMix wirklich
  // Duelle gibt, ist dasselbe Wort ein richtiger Satz — dieselbe Falle wie bei
  // „Spielername", nur ein Jahr spaeter. Eine Verbotsliste veraltet mit dem
  // Projekt; wer hier ein Wort eintraegt, sollte dazuschreiben, warum es in
  // DIESER App nicht vorkommen kann.
  for (const wort of ['Anigosha', 'anigosha', 'Elo-', 'Quizfrage']) {
    ok(!alles.includes(wort), `kein Rest von Anigosha: „${wort}"`);
  }
}

console.log('\n--- Die Angaben, an denen Pflichten haengen ---');
{
  ok(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(BETREIBER.email),
     `die Kontaktadresse ist eine E-Mail-Adresse (${BETREIBER.email})`);
  // Frueher stand hier `includes('fixthemix')`. Das ging, solange die Adresse
  // dem Muster von Anigosha folgte — seit sie eine private Gmail ist (Josef,
  // 26.09.2026), waere es falsch. Geprueft wird deshalb, was wirklich schuetzt:
  // dass hier NICHT versehentlich die Adresse einer der anderen Apps steht.
  // Genau das waere der wahrscheinliche Fehler bei einer Uebernahme, und er
  // liefe darauf hinaus, dass Loeschbegehren fuer FixTheMix im falschen
  // Postfach landen.
  for (const fremd of ['anigosha', 'mypeak', 'swaply', 'mahjong']) {
    ok(!BETREIBER.email.includes(fremd),
       `... und gehoert nicht zu „${fremd}"`);
  }
  ok(BETREIBER.name.length > 3 && BETREIBER.adresse.length > 3 && BETREIBER.ort.length > 3,
     'Name, Adresse und Ort sind ausgefuellt');
  ok(/^\d{2}\.\d{2}\.\d{4}$/.test(STAND), `der Stand ist ein Datum (${STAND})`);

  // Die E-Mail-Adresse MUSS in Datenschutz und Loeschseite stehen: dort haengen
  // Auskunfts- und Loeschbegehren dran.
  for (const k of ['datenschutz', 'loeschen'] as const) {
    for (const s of ['de', 'en'] as const) {
      const text = rechtsTexte[k][s].abschnitte.map((a) => a.text).join('\n');
      ok(text.includes(BETREIBER.email), `${k}/${s} nennt die Kontaktadresse`);
    }
  }

  // Und die Datenschutzerklaerung muss jeden Empfaenger nennen, an den wirklich
  // Daten gehen. Faellt einer weg, ist die Erklaerung unvollstaendig.
  const ds = rechtsTexte.datenschutz.de.abschnitte.map((a) => a.text).join('\n');
  for (const empfaenger of ['Cloudflare', 'AdMob', 'RevenueCat']) {
    ok(ds.includes(empfaenger), `die Datenschutzerklaerung nennt ${empfaenger}`);
  }
  ok(ds.includes('DSGVO'), '... und die Rechtsgrundlagen');

  // SUPABASE IST DER SONDERFALL, und deshalb steht er hier eigens.
  //
  // Eine Datenschutzerklaerung darf nicht nur nichts verschweigen — sie darf
  // auch nichts BEHAUPTEN, was nicht passiert. Am 26.09.2026 hat Josef
  // entschieden, ohne Bestenliste in den Store zu gehen; damit gehen keine
  // Daten an Supabase, und Supabase darf dort nicht als Empfaenger stehen.
  //
  // Geprueft wird deshalb die Uebereinstimmung mit der Wirklichkeit, nicht ein
  // fester Wortlaut: gibt es einen Supabase-Client in der App, MUSS er genannt
  // werden; gibt es keinen, darf er NICHT genannt werden. Wer die Datenbank
  // anschliesst und die Erklaerung vergisst, faellt hier sofort auf — und wer
  // sie wieder abschaltet, ebenso.
  const redetMitSupabase = existsSync(new URL('../src/lib/supabase.ts', import.meta.url));
  const alleTexte = SCHLUESSEL.flatMap((k) =>
    (['de', 'en'] as const).flatMap((sp) =>
      rechtsTexte[k][sp].abschnitte.map((a) => `${a.titel}\n${a.text}`))).join('\n');
  if (redetMitSupabase) {
    ok(ds.includes('Supabase'),
       'die App spricht mit Supabase — also steht es als Empfaenger in der Erklaerung');
  } else {
    ok(!alleTexte.includes('Supabase'),
       'ohne Supabase-Client wird Supabase auch nicht als Empfaenger behauptet');
    // Dasselbe fuer die Bestenliste: sie darf nur als VERNEINUNG vorkommen
    // („es gibt derzeit keine"), nie als beschriebene Verarbeitung.
    for (const satz of ['in der Bestenliste erscheinen', 'meldet die App dich anonym',
                        'appear in the daily puzzle leaderboard', 'signs you in anonymously']) {
      ok(!alleTexte.includes(satz), `kein Rest der Bestenlisten-Beschreibung: „${satz}"`);
    }
  }
}

console.log('\n--- Die Adressen fuer die Store-Formulare ---');
{
  const pfade = Object.values(RECHTS_PFADE);
  ok(pfade.length === SCHLUESSEL.length, `${pfade.length} Adressen`);
  ok(pfade.every((p) => p.startsWith('/')), 'alle absolut');
  ok(new Set(pfade).size === pfade.length, 'alle verschieden');
  // Google Play verlangt eine eigene Seite fuer den Weg zur Datenloeschung.
  ok(RECHTS_PFADE.loeschen === '/daten-loeschen',
     `die Loeschseite hat eine eigene Adresse (${RECHTS_PFADE.loeschen})`);
}

console.log('\n--- Die fuenf Sprachdateien ---');
{
  const ordner = new URL('../src/i18n/locales/', import.meta.url);
  const dateien = readdirSync(ordner).filter((d) => d.endsWith('.json')).sort();
  ok(dateien.length === 5, `fuenf Sprachen (${dateien.join(', ')})`);

  type Baum = Record<string, Record<string, string>>;
  const geladen: Record<string, Baum> = {};
  for (const d of dateien) {
    geladen[d.replace('.json', '')] = JSON.parse(
      readFileSync(new URL(d, ordner), 'utf8'),
    ) as Baum;
  }

  const flach = (b: Baum): string[] => {
    const raus: string[] = [];
    for (const bereich of Object.keys(b)) {
      for (const k of Object.keys(b[bereich]!)) raus.push(`${bereich}.${k}`);
    }
    return raus.sort();
  };

  const vorbild = flach(geladen.de!);
  ok(vorbild.length >= 60, `${vorbild.length} Schluessel in de.json`);
  for (const code of Object.keys(geladen)) {
    if (code === 'de') continue;
    const hier = flach(geladen[code]!);
    const fehlt = vorbild.filter((k) => !hier.includes(k));
    const zuviel = hier.filter((k) => !vorbild.includes(k));
    ok(fehlt.length === 0, `${code}.json hat alle Schluessel (${fehlt.length} fehlen${fehlt.length ? `: ${fehlt.slice(0, 3).join(', ')}` : ''})`);
    ok(zuviel.length === 0, `${code}.json hat keine ueberzaehligen (${zuviel.length})`);
  }

  // Platzhalter muessen in JEDER Sprache dieselben sein — eine Uebersetzung, die
  // `{{n}}` verschluckt, zeigt dem Spieler einen Satz ohne Zahl.
  let platzhalterFalsch = 0;
  const platzhalter = (t: string) => (t.match(/{{\s*\w+\s*}}/g) ?? []).sort().join(',');
  for (const k of Object.keys(geladen.de!.spiel!)) {
    const soll = platzhalter(geladen.de!.spiel![k]!);
    for (const code of Object.keys(geladen)) {
      const ist = platzhalter(geladen[code]!.spiel![k] ?? '');
      if (ist !== soll) {
        platzhalterFalsch++;
        console.log(`        ${code}.spiel.${k}: „${ist}" statt „${soll}"`);
      }
    }
  }
  ok(platzhalterFalsch === 0, `alle Platzhalter stimmen ueberein (${platzhalterFalsch} Abweichungen)`);

  // Und kein Text darf leer sein oder noch deutsch in einer fremden Datei
  // stehen — der haeufigste Fehler beim Nachtragen einer Sprache.
  let leer = 0, unuebersetzt = 0;
  for (const code of Object.keys(geladen)) {
    if (code === 'de') continue;
    for (const k of Object.keys(geladen.de!.spiel!)) {
      const de = geladen.de!.spiel![k]!;
      const hier = geladen[code]!.spiel![k] ?? '';
      if (hier.trim() === '') leer++;
      // Kurze und rein technische Zeilen duerfen gleich sein („…", „Level {{n}}").
      if (hier === de && de.length > 12 && !/^[^a-zA-Z]*$/.test(de)) unuebersetzt++;
    }
  }
  ok(leer === 0, `keine leeren Texte (${leer})`);
  ok(unuebersetzt <= 2, `kaum unuebersetzte Zeilen (${unuebersetzt})`);
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
