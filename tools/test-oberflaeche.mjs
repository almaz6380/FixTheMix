// Prueft den Spielbildschirm im echten Browser: spielt ein Level mit
// der Loesung des Loesers durch und schaut nach, ob die Oberflaeche dasselbe
// erzaehlt wie die Engine.
//
// Braucht Playwright + Chromium, sonst kein Netz und keine Schluessel.
// Vorher `npm run build` — geprueft wird der AUSGELIEFERTE Stand aus dist/,
// nicht der Entwicklungsserver.
//
// Aufruf: node tools/test-oberflaeche.mjs
//
// Legt nebenbei Screenshots in .screenshots/ ab, darunter einen in
// GRAUSTUFEN. Der ist die Abnahme fuer den Farbenblind-Modus: dort muss jede
// Farbe am Symbol erkennbar bleiben, und das sieht man nur mit eigenen Augen.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { festgefahren, solve } from '../src/engine/loeser.ts';
import { istGeloest, klone, standAusLevel } from '../src/engine/zustand.ts';
import { anwenden, legaleZuege } from '../src/engine/zuege.ts';
import { zufall } from '../src/engine/zufall.ts';
import { tagLevel, tagesNummer } from '../src/engine/tagesraetsel.ts';
import { FOLGE_VERSION } from '../src/lib/fortschritt.ts';
import { KOSTEN_RUECKKAUF, KOSTEN_TIPP } from '../src/lib/muenzen.ts';
import { heute } from '../src/lib/serie.ts';

let fehler = 0;
const ok = (b, msg) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

const wurzel = new URL('..', import.meta.url).pathname;
const dist = join(wurzel, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  console.log(' FEHL  dist/ fehlt — bitte zuerst `npm run build`.');
  process.exit(1);
}
const bilder = join(wurzel, '.screenshots');
mkdirSync(bilder, { recursive: true });

const folge = JSON.parse(readFileSync(join(wurzel, 'src/levels/folge.json'), 'utf8'));
const TYPEN = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  let pfad = join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(pfad) || pfad.endsWith('/')) pfad = join(dist, 'index.html');
  res.writeHead(200, { 'content-type': TYPEN[extname(pfad)] ?? 'application/octet-stream' });
  res.end(readFileSync(pfad));
});
await new Promise((r) => server.listen(4602, r));

// Chromium liegt in Cloud-Sitzungen unter PLAYWRIGHT_BROWSERS_PATH; lokal
// findet Playwright ihn selbst.
const pfade = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];
const browser = await chromium.launch(
  pfade.filter(existsSync).length ? { executablePath: pfade.find(existsSync) } : {},
);
const seite = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  // DEUTSCH festnageln. Seit Phase 5 waehlt die App beim ersten Start die
  // GERAETESPRACHE, und Chromium meldet standardmaessig en-US — damit lief der
  // Test ploetzlich gegen die englische Oberflaeche und suchte „Zug
  // zuruecknehmen" vergeblich. Geprueft werden hier die deutschen Texte; fuer
  // die anderen vier Sprachen sorgt tools/test-recht.mts.
  locale: 'de-DE',
  // Fuer das Teilen des Tagesergebnisses: ohne diese Rechte lehnt Chromium
  // `navigator.clipboard.writeText` still ab, und der Test saehe nur, dass
  // nichts passiert.
  permissions: ['clipboard-read', 'clipboard-write'],
});
const konsole = [];
seite.on('pageerror', (e) => konsole.push(String(e)));
seite.on('console', (m) => { if (m.type() === 'error') konsole.push(m.text()); });

const NR = 10; // ein groesseres Brett aus der Mitte der Folge
const level = folge[NR];
const loesung = solve(standAusLevel(level));

console.log('--- Start ---');
await seite.goto('http://localhost:4602/', { waitUntil: 'networkidle' });
await seite.evaluate(() => localStorage.clear());
await seite.reload({ waitUntil: 'networkidle' });
await seite.waitForTimeout(300);
ok(konsole.length === 0, `kein Konsolenfehler beim Start${konsole.length ? `: ${konsole[0]}` : ''}`);
ok((await seite.locator('header').innerText()).includes('Level 1'), 'startet bei Level 1');
await seite.screenshot({ path: join(bilder, '01-start.png') });

console.log('\n--- Ein Zug, dann zurueck ---');
{
  const glaeser = seite.locator('button[aria-label^="Glas"]');
  const n = await glaeser.count();
  ok(n === folge[0].glaeser, `so viele Glaeser wie im Level (${n})`);
  await glaeser.nth(0).click();
  await seite.waitForTimeout(200);
  // Der Zaehler hat eine eigene Kennung. Am Text zu erkennen ging schief:
  // die Kopfzeile enthaelt auch „Level 1".
  const zaehler = seite.locator('[data-zuege]');
  let gezogen = false;
  for (let i = 1; i < n && !gezogen; i++) {
    await glaeser.nth(i).click();
    await seite.waitForTimeout(120);
    gezogen = (await zaehler.getAttribute('data-zuege')) === '1';
  }
  ok(gezogen, 'ein Giessvorgang laesst sich per Antippen ausloesen');
  await seite.getByRole('button', { name: 'Zug zurücknehmen' }).click();
  await seite.waitForTimeout(150);
  ok((await zaehler.getAttribute('data-zuege')) === '0', 'Zurück setzt den Zugzaehler auf 0');
}

console.log('\n--- Sperre ---');
{
  await seite.locator('header button').first().click();
  await seite.waitForTimeout(250);
  const zu = seite.getByRole('button', { name: /^Level 2, gesperrt/ });
  ok(await zu.count() === 1 && await zu.isDisabled(),
     'bei frischem Start ist Level 2 gesperrt');
  ok(await seite.getByRole('button', { name: /^Level 1,/ }).isEnabled(),
     '... und Level 1 offen');
  // Nicht `[aria-label^="Level "]`: darauf hoert auch der Neustart-Knopf
  // („Level neu starten"). Es muss eine Zahl folgen.
  const kacheln = await seite.getByRole('button', { name: /^Level \d+,/ }).count();
  ok(kacheln <= 20, `die Levelwahl zeigt nur einen Abschnitt (${kacheln} Kacheln, nicht ${folge.length})`);

  // Fuer den Rest des Durchlaufs wird bis Level NR+1 freigeschaltet. Sich
  // dorthin zu spielen waere reine Wartezeit — geprueft wird die Sperre, nicht
  // die Geduld.
  await seite.evaluate(
    ([h, v]) => localStorage.setItem(
      'fixthemix.fortschritt.v2',
      JSON.stringify({ folgeVersion: v, sterne: {}, zuletzt: 0, hoechstes: h }),
    ),
    [NR, FOLGE_VERSION],
  );
  await seite.reload({ waitUntil: 'networkidle' });
  await seite.waitForTimeout(350);
}

console.log('\n--- Farbenblind-Modus ---');
{
  await seite.getByRole('button', { name: /Symbole|symbols/i }).click();
  await seite.waitForTimeout(250);
  const symbole = await seite.locator('.brett svg').count();
  ok(symbole > 0, `im Symbolmodus tragen die Schichten ein Zeichen (${symbole} gefunden)`);
  await seite.screenshot({ path: join(bilder, '02-symbole.png') });
  // Graustufen: so sieht es jemand, der Rot und Gruen nicht trennen kann.
  await seite.addStyleTag({ content: 'html{filter:grayscale(1)!important}' });
  await seite.waitForTimeout(150);
  await seite.screenshot({ path: join(bilder, '03-graustufen.png') });
  await seite.evaluate(() => document.querySelectorAll('style').forEach((s) => {
    if (s.textContent?.includes('grayscale')) s.remove();
  }));
}

console.log(`\n--- Level ${NR + 1} durchspielen ---`);
{
  await seite.locator('header button').first().click();
  await seite.waitForTimeout(250);
  await seite.getByRole('button', { name: new RegExp(`^Level ${NR + 1},`) }).click();
  await seite.waitForTimeout(350);
  ok((await seite.locator('header').innerText()).includes(`Level ${NR + 1}`), `Levelwahl springt auf Level ${NR + 1}`);
  ok(loesung.status === 'optimal' && loesung.laenge === level.optimalZuege,
     `der Loeser bestaetigt das gespeicherte Optimum (${level.optimalZuege})`);

  const glaeser = seite.locator('button[aria-label^="Glas"]');
  for (const zug of loesung.zuege) {
    await glaeser.nth(zug.von).click();
    await seite.waitForTimeout(60);
    await glaeser.nth(zug.nach).click();
    await seite.waitForTimeout(60);
  }
  await seite.waitForTimeout(500);
  ok(await seite.locator('text=Perfekt sortiert').count() === 1, 'das Siegfenster erscheint');
  const karte = await seite.locator('.max-w-xs').innerText();
  ok(karte.includes(`${level.optimalZuege} Züge`), 'die Zugzahl im Siegfenster stimmt');
  await seite.screenshot({ path: join(bilder, '04-sieg.png') });
}

console.log('\n--- Weiter und Fortschritt ---');
{
  await seite.getByRole('button', { name: 'Weiter', exact: true }).click();
  await seite.waitForTimeout(350);
  ok((await seite.locator('header').innerText()).includes(`Level ${NR + 2}`), '"Weiter" geht ins naechste Level');
  await seite.locator('header button').first().click();
  await seite.waitForTimeout(250);
  const gemerkt = await seite.getByRole('button', { name: new RegExp(`^Level ${NR + 1},`) }).getAttribute('aria-label');
  ok(gemerkt?.includes('3 von 3'), `die Levelliste merkt sich die drei Sterne (${gemerkt})`);
  // Der Sieg schaltet genau EIN Level frei, nicht den Rest der Folge.
  ok(await seite.getByRole('button', { name: new RegExp(`^Level ${NR + 2},`) }).isEnabled(),
     `der Sieg schaltet Level ${NR + 2} frei`);
  ok(await seite.getByRole('button', { name: new RegExp(`^Level ${NR + 3}, gesperrt`) }).isDisabled(),
     `... und Level ${NR + 3} bleibt gesperrt`);
  await seite.screenshot({ path: join(bilder, '05-levelwahl.png') });
  await seite.reload({ waitUntil: 'networkidle' });
  await seite.waitForTimeout(400);
  ok((await seite.locator('header').innerText()).includes(`Level ${NR + 2}`),
     'nach dem Neuladen steht man wieder im richtigen Level');
}

console.log('\n--- Muenzen und Tipp ---');
{
  const muenzen = seite.locator('[data-muenzen]');
  const vorher = Number(await muenzen.getAttribute('data-muenzen'));
  ok(vorher > 0, `die Kopfzeile zeigt ein Guthaben (${vorher})`);
  await seite.getByRole('button', { name: new RegExp(`${KOSTEN_TIPP}`) }).click();
  await seite.waitForTimeout(600);
  const nachher = Number(await muenzen.getAttribute('data-muenzen'));
  ok(nachher === vorher - KOSTEN_TIPP,
     `ein Tipp kostet ${KOSTEN_TIPP} Muenzen (${vorher} -> ${nachher})`);
}

console.log('\n--- Sackgasse ---');
{
  // Ein grosses Level freischalten und direkt hineinspringen — auf den kleinen
  // Brettern am Anfang der Folge sind Sackgassen selten.
  const TOT = 300; // Index, also Level 301
  const level = folge[TOT];

  // Die Todesfolge wird HIER mit der Engine gesucht, mit gesetztem Zufall.
  // Damit prueft der Test bei jedem Lauf dieselbe Folge, und er behauptet nie,
  // ein Brett sei tot, ohne dass der Loeser es bewiesen hat.
  const r = zufall(20260926, 5);
  let todesfolge = null;
  for (let versuch = 0; versuch < 400 && !todesfolge; versuch++) {
    const z = standAusLevel(level);
    const zuege = [];
    for (let t = 0; t < 14; t++) {
      const moeglich = legaleZuege(z);
      if (moeglich.length === 0) break;
      const zug = r.zieh(moeglich);
      anwenden(z, zug);
      zuege.push(zug);
      if (istGeloest(z)) break;
      if (festgefahren(klone(z))) { todesfolge = zuege.slice(); break; }
    }
  }
  ok(todesfolge !== null, `eine Zugfolge gefunden, die Level ${TOT + 1} nachweislich toetet (${todesfolge?.length} Zuege)`);

  if (todesfolge) {
    await seite.evaluate(
      ([i, v]) => localStorage.setItem(
        'fixthemix.fortschritt.v2',
        JSON.stringify({ folgeVersion: v, sterne: {}, zuletzt: i, hoechstes: i }),
      ),
      [TOT, FOLGE_VERSION],
    );
    await seite.reload({ waitUntil: 'networkidle' });
    await seite.waitForTimeout(400);
    ok((await seite.locator('header').innerText()).includes(`Level ${TOT + 1}`),
       `springt in Level ${TOT + 1}`);

    const glaeser = seite.locator('button[aria-label^="Glas"]');
    for (const zug of todesfolge) {
      await glaeser.nth(zug.von).click();
      await seite.waitForTimeout(50);
      await glaeser.nth(zug.nach).click();
      await seite.waitForTimeout(50);
    }
    await seite.waitForTimeout(700);
    ok(await seite.locator('[data-steckt]').count() === 1, 'das Fenster „Festgefahren" erscheint');
    await seite.screenshot({ path: join(bilder, '06-festgefahren.png') });

    const muenzen = seite.locator('[data-muenzen]');
    const vorher = Number(await muenzen.getAttribute('data-muenzen'));
    // Nicht ueber den Text suchen: „Zug zurueck · 10" kollidiert mit „Glas 10".
    await seite.locator('[data-steckt] button').first().click();
    await seite.waitForTimeout(500);
    const nachher = Number(await muenzen.getAttribute('data-muenzen'));
    ok(nachher === vorher - KOSTEN_RUECKKAUF,
       `ein Zug zurueck kostet ${KOSTEN_RUECKKAUF} Muenzen (${vorher} -> ${nachher})`);
  }
}

console.log('\n--- Tagesraetsel ---');
{
  // Der Test rechnet das Raetsel des heutigen Tages selbst aus. Browser und
  // Skript laufen im selben Container, haben also denselben Ortstag — genau
  // diese Uebereinstimmung ist es, die spaeter die Edge Function braucht.
  const iso = heute();
  const nummer = tagesNummer(iso);
  const brett = tagLevel(iso);
  const loesung = solve(standAusLevel(brett));
  ok(loesung.status === 'optimal', `das Raetsel von ${iso} ist loesbar (Optimum ${loesung.laenge})`);

  await seite.locator('header button').first().click();
  await seite.waitForTimeout(250);
  await seite.getByRole('button', { name: new RegExp('Tagesr', 'i') }).click();
  // Das Brett wird auf dem Geraet erzeugt — dem Ladezustand Zeit lassen.
  await seite.waitForTimeout(2500);
  ok((await seite.locator('header').innerText()).includes(`#${nummer}`),
     `die Kopfzeile zeigt Raetsel #${nummer}`);

  const glaeser = seite.locator('button[aria-label^="Glas"]');
  ok(await glaeser.count() === brett.glaeser,
     `so viele Glaeser wie im Tagesraetsel (${brett.glaeser})`);

  for (const zug of loesung.zuege) {
    await glaeser.nth(zug.von).click();
    await seite.waitForTimeout(45);
    await glaeser.nth(zug.nach).click();
    await seite.waitForTimeout(45);
  }
  await seite.waitForTimeout(600);
  ok(await seite.locator('[data-serie]').count() === 1, 'das Siegfenster zeigt die Serie');
  ok(await seite.locator('[data-serie]').getAttribute('data-serie') === '1',
     'der erste geloeste Tag ergibt Serie 1');
  await seite.screenshot({ path: join(bilder, '07-tagesraetsel.png') });

  await seite.getByRole('button', { name: /teilen|share/i }).click();
  await seite.waitForTimeout(500);
  const text = await seite.evaluate(() => navigator.clipboard.readText());
  ok(text.includes(`#${nummer}`), 'der geteilte Text traegt die Tagesnummer');
  ok(text.includes('🟩') || text.includes('⬜'), '... und den Balken');
  ok(!/[🍓🍋🫐🍊🍏🍇🌿🥥☕]/u.test(text),
     '... aber KEINE Farben — der Teiltext verraet das Raetsel nicht');
}

console.log('\n--- Einstellungen und Rechtstexte ---');
{
  // Erst das Siegfenster des Tagesraetsels verlassen — es liegt als Overlay
  // ueber allem und faengt sonst jeden Klick ab.
  await seite.getByRole('button', { name: 'Zur Levelfolge' }).click();
  await seite.waitForTimeout(400);

  // Der Weg dorthin fuehrt ueber die Levelwahl, nicht ueber die Kopfzeile: die
  // ist voll, und der Burger muss das erste Button im header bleiben.
  await seite.locator('header button').first().click();
  await seite.waitForTimeout(250);
  await seite.getByRole('button', { name: 'Einstellungen' }).click();
  await seite.waitForTimeout(400);
  ok(seite.url().endsWith('/einstellungen'), `die Einstellungen haben eine Adresse (${new URL(seite.url()).pathname})`);
  ok(await seite.getByRole('button', { name: 'Deutsch' }).count() === 1, 'die Sprachwahl ist da');
  const stand = await seite.locator('[data-muenzstand]').getAttribute('data-muenzstand');
  ok(Number(stand) >= 0, `der Muenzstand steht drin (${stand})`);
  const kennung = (await seite.locator('[data-kennung]').innerText()).trim();
  ok(kennung.startsWith('ftm-'), `die Kennung fuer Auskunft und Loeschung steht drin (${kennung.slice(0, 12)}…)`);
  await seite.screenshot({ path: join(bilder, '08-einstellungen.png') });

  // Die vier Rechtstexte. Sie MUESSEN eigene Adressen haben und ohne Anmeldung
  // aufrufbar sein — Apple und Google verlangen genau das.
  for (const [pfad, ueberschrift] of [
    ['/impressum', 'Impressum'],
    ['/datenschutz', 'Datenschutzerklärung'],
    ['/nutzungsbedingungen', 'Nutzungsbedingungen'],
    ['/daten-loeschen', 'Daten löschen'],
  ]) {
    await seite.goto(`http://localhost:4602${pfad}`, { waitUntil: 'networkidle' });
    await seite.waitForTimeout(250);
    const h1 = await seite.locator('h1').innerText();
    ok(h1.trim() === ueberschrift, `${pfad} zeigt „${h1.trim()}"`);
  }
  // Und der Datenschutz muss die Empfaenger nennen — eine Seite, die nur eine
  // Ueberschrift hat, waere im Store wertlos.
  await seite.goto('http://localhost:4602/datenschutz', { waitUntil: 'networkidle' });
  const text = await seite.locator('main').innerText();
  ok(text.includes('AdMob') && text.includes('RevenueCat') && text.includes('DSGVO'),
     'die Datenschutzseite nennt Empfaenger und Rechtsgrundlagen');
  await seite.screenshot({ path: join(bilder, '09-datenschutz.png') });

  // Daten loeschen: danach steht der Fortschritt wieder auf Level 1.
  await seite.goto('http://localhost:4602/einstellungen', { waitUntil: 'networkidle' });
  await seite.waitForTimeout(300);
  await seite.getByRole('button', { name: 'Daten löschen' }).click();
  await seite.waitForTimeout(200);
  await seite.getByRole('button', { name: 'Daten löschen' }).click();
  await seite.waitForTimeout(700);
  const rest = await seite.evaluate(() => Object.keys(localStorage).filter(
    (k) => k.startsWith('fixthemix.') && !k.startsWith('fixthemix.kennung')).length);
  ok(rest === 0, `Fortschritt, Muenzen und Serie sind weg (${rest} Schluessel uebrig)`);
  // Die Kennung ist ebenfalls geloescht — aber die App legt beim naechsten
  // Start sofort eine NEUE an, weil sie eine braucht. Geprueft wird deshalb,
  // dass es nicht mehr dieselbe ist: die alte Kennung ist das, worauf sich ein
  // Loeschbegehren zur Bestenliste bezieht.
  const neueKennung = await seite.evaluate(() => localStorage.getItem('fixthemix.kennung.v1'));
  ok(neueKennung !== kennung,
     `die alte Kennung ist weg (${kennung.slice(0, 10)}… -> ${(neueKennung ?? 'keine').slice(0, 10)}…)`);
  ok((await seite.locator('header').innerText()).includes('Level 1'),
     '... und das Spiel startet wieder bei Level 1');
}

ok(konsole.length === 0, `keine Konsolenfehler im ganzen Durchlauf${konsole.length ? `: ${konsole.join(' | ')}` : ''}`);
console.log(`\nScreenshots in .screenshots/ — 03-graustufen.png ist die Abnahme fuer den Farbenblind-Modus.`);
await browser.close();
server.close();
console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
