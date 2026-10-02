// Store-Bilder: Screenshots in den Groessen, die Apple und Google verlangen,
// dazu die Feature-Grafik und das 512er-Symbol fuer Play.
//
// WARUM ES DAS GEBEN MUSS: `tools/test-oberflaeche.mjs` legt zwar Screenshots
// ab, aber in 390x844 — das ist die Groesse, in der geprueft wird, nicht die,
// die ein Store annimmt. Apple weist 6,7-Zoll-Bilder ab, die nicht 1290x2796
// sind, und zwar erst beim Hochladen.
//
// Aufgenommen wird aus dem ECHTEN Bundle (`dist/`), nicht aus einem Entwurf:
// was hier zu sehen ist, ist genau das, was der Spieler bekommt. Ein
// aufgehuebschter Store-Screenshot ist bei Apple ausserdem ein Ablehnungsgrund.
//
// Aufruf: npm run build && node tools/store-bilder.mjs
// Ergebnis: .store/<sprache>/ (gitignored — das sind Erzeugnisse, keine Quellen)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { extname, join } from 'node:path';
import sharp from 'sharp';
import { solve } from '../src/engine/loeser.ts';
import { standAusLevel } from '../src/engine/zustand.ts';
import { FOLGE_VERSION } from '../src/lib/fortschritt.ts';

const wurzel = new URL('..', import.meta.url).pathname;
const dist = join(wurzel, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  console.log('dist/ fehlt — bitte zuerst `npm run build`.');
  process.exit(1);
}
// GELEERT, nicht ueberschrieben. Die Namen tragen eine laufende Nummer
// (`1-start`, `2-spiel`, …), und die verschiebt sich, sobald ein Bild
// dazukommt: der Lauf vom 26.09. hiess `1-spiel`, der vom 27.09. `2-spiel`.
// Ein blosses Ueberschreiben liess damit beide liegen, und Josef haette ein
// Gemisch aus zwei Staenden in den Store geladen — ohne dass etwas warnt.
//
// Je Sprache ein eigener Ordner (`.store/de/`, `.store/ja/` …), seit es
// zwanzig Sprachen gibt: `node tools/store-bilder.mjs --sprache ja`. Ohne
// Angabe Deutsch. Der Wert geht als `locale` an den Browser, und die App
// waehlt daraus ihre Sprache wie auf einem Geraet.
const argIndex = process.argv.indexOf('--sprache');
const SPRACHE = argIndex > 0 ? process.argv[argIndex + 1] : 'de';
if (!SPRACHE) {
  console.log('--sprache braucht einen Code, z. B. --sprache ja');
  process.exit(1);
}
const ziel = join(wurzel, '.store', SPRACHE);
rmSync(ziel, { recursive: true, force: true });
mkdirSync(ziel, { recursive: true });

const folge = JSON.parse(readFileSync(join(wurzel, 'src/levels/folge.json'), 'utf8'));

const TYPEN = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2',
};
const server = createServer((req, res) => {
  let pfad = join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(pfad) || pfad.endsWith('/')) pfad = join(dist, 'index.html');
  res.writeHead(200, { 'content-type': TYPEN[extname(pfad)] ?? 'application/octet-stream' });
  res.end(readFileSync(pfad));
});
await new Promise((r) => server.listen(4620, r));

const pfade = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];
const browser = await chromium.launch(
  pfade.filter(existsSync).length ? { executablePath: pfade.find(existsSync) } : {},
);

/**
 * Die Geraete. Angegeben ist die CSS-Groesse mal dem Pixelverhaeltnis — so
 * rendert die App in ihrer echten Groesse und das Bild hat trotzdem die
 * Pixelmasse, die der Store will. Ein 1290 breites Fenster mit Verhaeltnis 1
 * saehe aus wie ein Tablet.
 */
const GERAETE = [
  { name: 'ios-6.7', breite: 430, hoehe: 932, dpr: 3 }, // 1290x2796
  { name: 'ios-6.5', breite: 414, hoehe: 896, dpr: 3 }, // 1242x2688
  // Play: 2:1, das laengste Format, das Play annimmt (laengere Kante hoechstens
  // doppelt so lang wie die kuerzere). Vorher 360x640 (16:9) — darin fehlten
  // Tresen und Fusszeile, und der Strohhalm der oberen Reihe stach in die Kopfzeile.
  // 432 breit statt 360: bei 360 ist ein Brett mit drei Reihen hoeher als das
  // Fenster, und das Bild verliert oben die Kopfzeile. 432 ist ein heutiges
  // grosses Android-Telefon.
  { name: 'play', breite: 432, hoehe: 864, dpr: 2.5 }, //  1080x2160
];

/** Ein Brett aus der Mitte der Folge, halb gespielt — kein leeres Startbrett. */
const NR = 120;

async function bilderFuer(geraet) {
  const seite = await browser.newPage({
    viewport: { width: geraet.breite, height: geraet.hoehe },
    deviceScaleFactor: geraet.dpr,
    // Die Sprache festnageln: die App waehlt sonst die Geraetesprache, und
    // Chromium meldet en-US. Siehe `--sprache` oben.
    locale: SPRACHE,
  });
  const schuss = async (nummer, name) => {
    await seite.screenshot({ path: join(ziel, `${geraet.name}-${nummer}-${name}.png`) });
  };

  await seite.goto('http://localhost:4620/', { waitUntil: 'networkidle' });
  // Fortschritt setzen: ohne ihn zeigt die Levelwahl 999 Schloesser, und das
  // ist das unattraktivste Bild, das diese App hergibt. Gesetzt wird hier —
  // die einzige Stelle ausser dem Oberflaechentest, an der ein Werkzeug den
  // Speicher schreibt.
  const sterne = {};
  for (let i = 0; i < NR; i++) sterne[i] = 3 - (i % 4 === 3 ? 1 : 0);
  await seite.evaluate(
    ([nr, v, s]) => {
      localStorage.setItem('fixthemix.fortschritt.v2',
        JSON.stringify({ folgeVersion: v, sterne: s, zuletzt: nr, hoechstes: nr }));
      localStorage.setItem('fixthemix.muenzen.v1', '240');
      localStorage.setItem('fixthemix.duelle.v1', JSON.stringify({
        siege: 7, niederlagen: 3, remis: 1, gespielt: 11, staerke: 'stark', basis: 4711,
      }));
    },
    [NR, FOLGE_VERSION, sterne],
  );
  await seite.reload({ waitUntil: 'networkidle' });
  await seite.waitForTimeout(500);

  // 1 — der Startbildschirm. Er sagt in einem Bild, was die App IST; die
  //     Spielbilder sagen, was man darin tut. Seit dem Umbau am 27.09.2026
  //     gibt es ihn, und er gehoert nach vorn.
  await schuss(1, 'start');

  // 2 — mitten im Spiel, mit gewaehltem Lauf. Das Bild, das zeigt, worum es
  //     geht.
  await seite.goto('http://localhost:4620/spiel', { waitUntil: 'networkidle' });
  await seite.waitForTimeout(500);
  const level = folge[NR];
  const loesung = solve(standAusLevel(level));
  const glaeser = seite.locator('button[data-glas]');
  for (const zug of loesung.zuege.slice(0, Math.floor(loesung.zuege.length / 2))) {
    await glaeser.nth(zug.von).click();
    await seite.waitForTimeout(30);
    await glaeser.nth(zug.nach).click();
    await seite.waitForTimeout(30);
  }
  // Einen Lauf auswaehlen, aber NICHT giessen — so sieht man die Vorschau,
  // die das Spiel von den meisten Mitbewerbern unterscheidet.
  const naechster = loesung.zuege[Math.floor(loesung.zuege.length / 2)];
  if (naechster) await glaeser.nth(naechster.von).click();
  await seite.waitForTimeout(500);
  await schuss(2, 'spiel');

  // 3 — Farbenblind-Modus. Ein Verkaufsargument, das man sehen muss.
  await seite.locator('button[data-symbole]').click();
  await seite.waitForTimeout(450);
  await schuss(3, 'farbenblind');
  await seite.locator('button[data-symbole]').click();
  await seite.waitForTimeout(250);

  // 4 — die Levelwahl mit Sternen. Sie zeigt den Umfang: 999 Level.
  await seite.goto('http://localhost:4620/level', { waitUntil: 'networkidle' });
  await seite.waitForTimeout(500);
  await schuss(4, 'levelwahl');

  // 5 — das Tagesraetsel.
  await seite.goto('http://localhost:4620/tagesraetsel', { waitUntil: 'networkidle' });
  await seite.waitForTimeout(3000);
  await schuss(5, 'tagesraetsel');

  await seite.close();
  console.log(`  ${geraet.name}: fuenf Bilder ${geraet.breite * geraet.dpr}x${geraet.hoehe * geraet.dpr}`);
}

console.log('--- Screenshots ---');
for (const g of GERAETE) await bilderFuer(g);

// ---------------------------------------------------------------------------
// Die Feature-Grafik. 1024x500, PFLICHT bei Google Play, und das einzige Bild,
// das dort ueber der Beschreibung steht.
//
// Gebaut wird sie im BROWSER und nicht mit sharp: nur so kommen die echten
// Schriften aus public/fonts/ zum Einsatz. Ein mit sharp gesetzter SVG-Text
// haengt an den Schriften des Systems und saehe auf jedem Rechner anders aus.
// ---------------------------------------------------------------------------
console.log('\n--- Feature-Grafik ---');
// Ihr Text ist deutsch und von Hand gesetzt — fuer andere Sprachen gibt es
// sie noch nicht; Play zeigt dort die deutsche (bzw. die Standardsprache).
if (SPRACHE === 'de') {
  const seite = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  // Auf der App-Seite laden, damit Schriften und Farbtoken schon da sind.
  await seite.goto('http://localhost:4620/', { waitUntil: 'networkidle' });
  await seite.evaluate(() => {
    // Der Hintergrund bleibt DURCHSICHTIG, damit die Fischschuppen des `body`
    // durchscheinen — dasselbe Muster wie im Spiel. Ein flaches Nachtblau sah
    // im ersten Anlauf aus wie eine leere Folie, und das Symbol verschwand
    // darin, weil sein eigener Grund denselben Ton hat.
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;display:flex;align-items:center;gap:56px;
                  padding:0 72px;overflow:hidden">
        <img src="/icons/icon-512.png" width="240" height="240"
             style="flex:0 0 auto;border-radius:52px;box-shadow:0 18px 50px rgba(0,0,0,.55)">
        <div style="min-width:0">
          <div style="font-family:Fredoka,system-ui;font-weight:700;font-size:74px;
                      line-height:1.02;color:var(--color-creme)">FixTheMix</div>
          <div style="font-family:Nunito,system-ui;font-weight:700;font-size:29px;
                      line-height:1.3;margin-top:16px;color:var(--color-zitrus)">
            Sortieren an der Saftbar
          </div>
          <div style="font-family:Nunito,system-ui;font-weight:600;font-size:22px;
                      line-height:1.45;margin-top:14px;color:var(--color-rauch)">
            999 Level mit bewiesen kürzester Lösung ·<br>
            Tagesrätsel · Farbenblind-Modus
          </div>
        </div>
      </div>`;
  });
  await seite.waitForTimeout(600);
  await seite.screenshot({ path: join(ziel, 'play-feature-1024x500.png') });
  await seite.close();
  console.log('  play-feature-1024x500.png');
}

await browser.close();
server.close();

// ---------------------------------------------------------------------------
// Das 512er-Symbol fuer Play. Ohne Alphakanal, wie das iOS-Symbol: Play nimmt
// zwar Transparenz an, stellt sie aber auf wechselnden Hintergruenden dar.
// ---------------------------------------------------------------------------
console.log('\n--- Symbol ---');
{
  await sharp(join(wurzel, 'tools/vorlagen/app-symbol.jpg')).resize(512, 512)
    .flatten({ background: { r: 0x0e, g: 0x1a, b: 0x2e, alpha: 1 } })
    .png().toFile(join(ziel, 'play-icon-512.png'));
  console.log('  play-icon-512.png');
}

console.log(`\nFertig — alles in .store/${SPRACHE}/`);
console.log('Die Texte fuer die Store-Formulare stehen in docs/store-eintrag.md.');
