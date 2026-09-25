// Prueft den Spielbildschirm im echten Browser: spielt ein Shaker-Level mit
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
import { solve } from '../src/engine/loeser.ts';
import { standAusLevel } from '../src/engine/zustand.ts';

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
const seite = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const konsole = [];
seite.on('pageerror', (e) => konsole.push(String(e)));
seite.on('console', (m) => { if (m.type() === 'error') konsole.push(m.text()); });

const NR = 5; // erstes Shaker-Level der Folge
const level = folge[NR];
const loesung = solve(standAusLevel(level));

console.log('--- Start ---');
await seite.goto('http://localhost:4602/', { waitUntil: 'networkidle' });
await seite.evaluate(() => localStorage.clear());
await seite.reload({ waitUntil: 'networkidle' });
await seite.waitForTimeout(300);
ok(konsole.length === 0, `kein Konsolenfehler beim Start${konsole.length ? `: ${konsole[0]}` : ''}`);
ok((await seite.locator('header').innerText()).includes('Level 1/'), 'startet bei Level 1');
await seite.screenshot({ path: join(bilder, '01-start.png') });

console.log('\n--- Ein Zug, dann zurueck ---');
{
  const glaeser = seite.locator('button[aria-label^="Glas"]');
  const n = await glaeser.count();
  ok(n === folge[0].glaeser, `so viele Glaeser wie im Level (${n})`);
  await glaeser.nth(0).click();
  await seite.waitForTimeout(200);
  let gezogen = false;
  for (let i = 1; i < n && !gezogen; i++) {
    await glaeser.nth(i).click();
    await seite.waitForTimeout(120);
    gezogen = /1 Züge/.test(await seite.locator('header').innerText());
  }
  ok(gezogen, 'ein Giessvorgang laesst sich per Antippen ausloesen');
  await seite.getByRole('button', { name: 'Zurück', exact: true }).click();
  await seite.waitForTimeout(150);
  ok(/0 Züge/.test(await seite.locator('header').innerText()), 'Zurück setzt den Zugzaehler auf 0');
}

console.log('\n--- Farbenblind-Modus ---');
{
  await seite.getByRole('button', { name: 'Symbole', exact: true }).click();
  await seite.waitForTimeout(250);
  const symbole = await seite.locator('main svg text').count();
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

console.log(`\n--- Level ${NR + 1} (Shaker) durchspielen ---`);
{
  await seite.locator('header button').first().click();
  await seite.waitForTimeout(250);
  await seite.locator(`button:has-text("${NR + 1}")`).first().click();
  await seite.waitForTimeout(350);
  ok((await seite.locator('header').innerText()).includes(`Level ${NR + 1}/`), `Levelwahl springt auf Level ${NR + 1}`);
  ok(await seite.getByRole('button', { name: 'Shaker 1' }).count() === 1, 'das Shaker-Level zeigt einen Shaker');
  ok(loesung.status === 'optimal' && loesung.laenge === level.optimalZuege,
     `der Loeser bestaetigt das gespeicherte Optimum (${level.optimalZuege})`);

  const tippe = async (b) => {
    const name = b < level.glaeser ? `Glas ${b + 1}` : `Shaker ${b - level.glaeser + 1}`;
    await seite.getByRole('button', { name, exact: true }).click();
    await seite.waitForTimeout(70);
  };
  let geschuettelt = 0;
  for (const zug of loesung.zuege) {
    if (zug.art === 'schuetteln') {
      await seite.getByRole('button', { name: 'Schütteln', exact: true }).click();
      geschuettelt++;
    } else {
      await tippe(zug.von);
      await tippe(zug.nach);
    }
    await seite.waitForTimeout(60);
  }
  await seite.waitForTimeout(500);
  ok(geschuettelt >= 1, `die Loesung brauchte den Shaker (${geschuettelt}x geschuettelt)`);
  ok(await seite.locator('text=Geschafft!').count() === 1, 'das Siegfenster erscheint');
  const karte = await seite.locator('.max-w-xs').innerText();
  ok(karte.includes('★★★'), 'die optimale Loesung gibt drei Sterne');
  ok(karte.includes(`${level.optimalZuege} Züge`), 'die Zugzahl im Siegfenster stimmt');
  await seite.screenshot({ path: join(bilder, '04-sieg.png') });
}

console.log('\n--- Weiter und Fortschritt ---');
{
  await seite.getByRole('button', { name: 'Weiter', exact: true }).click();
  await seite.waitForTimeout(350);
  ok((await seite.locator('header').innerText()).includes(`Level ${NR + 2}/`), '"Weiter" geht ins naechste Level');
  await seite.locator('header button').first().click();
  await seite.waitForTimeout(250);
  const sterne = await seite.locator(`button:has-text("${NR + 1}")`).first().innerText();
  ok(sterne.includes('★★★'), 'die Levelliste merkt sich die drei Sterne');
  await seite.screenshot({ path: join(bilder, '05-levelwahl.png') });
  await seite.reload({ waitUntil: 'networkidle' });
  await seite.waitForTimeout(400);
  ok((await seite.locator('header').innerText()).includes(`Level ${NR + 2}/`),
     'nach dem Neuladen steht man wieder im richtigen Level');
}

ok(konsole.length === 0, `keine Konsolenfehler im ganzen Durchlauf${konsole.length ? `: ${konsole.join(' | ')}` : ''}`);
console.log(`\nScreenshots in .screenshots/ — 03-graustufen.png ist die Abnahme fuer den Farbenblind-Modus.`);
await browser.close();
server.close();
console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
process.exit(fehler === 0 ? 0 : 1);
