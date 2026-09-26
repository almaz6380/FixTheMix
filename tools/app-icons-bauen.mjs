// Macht aus public/favicon.svg die App-Symbole und Startbilder der beiden
// nativen Projekte.
//
// WARUM ES DAS GEBEN MUSS: `npx cap add` legt die Capacitor-Logos an. Wer das
// nicht ersetzt, laedt eine App mit fremdem Logo in den Store hoch — und merkt
// es erst, wenn sie auf dem Homescreen liegt.
//
// EINE QUELLE: public/favicon.svg. Fuer den Vordergrund des Android-Symbols
// wird daraus der Hintergrund-Rechteck entfernt, statt die Zeichnung ein
// zweites Mal zu pflegen — zwei Fassungen desselben Logos laufen sonst
// auseinander, und man sieht es erst am Geraet.
//
// Aufruf: node tools/app-icons-bauen.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const wurzel = new URL('..', import.meta.url).pathname;
const p = (...t) => join(wurzel, ...t);

const svgText = readFileSync(p('public/favicon.svg'), 'utf8');
const svg = Buffer.from(svgText);

// Dasselbe Logo ohne die abgerundete Grundflaeche. Android legt den
// Vordergrund selbst auf seinen Hintergrund; bliebe das Rechteck drin, saehe
// man auf runden Startbildschirmen ein Quadrat im Kreis.
const nurGlas = Buffer.from(svgText.replace(/\s*<rect width="64" height="64"[^/]*\/>/, ''));

/** Der Grundton der Bar — derselbe Wert wie in capacitor.config.ts. */
const GRUND = { r: 0x0e, g: 0x1a, b: 0x2e, alpha: 1 };

const rendern = (quelle, px) => sharp(quelle, { density: 1024 }).resize(px, px);

console.log('--- iOS: App-Symbol ---');
{
  // 1024x1024 und OHNE Alphakanal: App Store Connect lehnt ein App-Symbol mit
  // Transparenz ab, und zwar erst beim Upload, nach dem ganzen Build.
  const ziel = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
  await rendern(svg, 1024).flatten({ background: GRUND }).png().toFile(p(ziel));
  const m = await sharp(p(ziel)).metadata();
  console.log(`  ${ziel}  ${m.width}x${m.height}  Alpha: ${m.hasAlpha}`);
}

console.log('\n--- Android: Start-Symbole ---');
{
  const DICHTEN = [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]];
  for (const [dichte, px] of DICHTEN) {
    const ordner = `android/app/src/main/res/mipmap-${dichte}`;
    mkdirSync(p(ordner), { recursive: true });

    await rendern(svg, px).png().toFile(p(ordner, 'ic_launcher.png'));

    // Die runde Fassung: dasselbe Bild durch eine Kreismaske. Aeltere Launcher
    // nehmen ic_launcher_round, neuere das adaptive Symbol darunter.
    const maske = Buffer.from(
      `<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`,
    );
    await rendern(svg, px)
      .composite([{ input: maske, blend: 'dest-in' }])
      .png().toFile(p(ordner, 'ic_launcher_round.png'));

    // Adaptives Symbol: die Flaeche ist 108dp, sichtbar sind aber nur die
    // inneren 72dp — der Launcher darf beschneiden, wie er will. Das Glas
    // bekommt deshalb 66 % und steht mittig; alles darueber hinaus kann auf
    // irgendeinem Geraet abgeschnitten werden.
    const flaeche = Math.round(px * (108 / 48));
    const innen = Math.round(flaeche * 0.66);
    const rand = Math.round((flaeche - innen) / 2);
    const glas = await rendern(nurGlas, innen).png().toBuffer();
    await sharp({
      create: { width: flaeche, height: flaeche, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: glas, top: rand, left: rand }])
      .png().toFile(p(ordner, 'ic_launcher_foreground.png'));

    console.log(`  mipmap-${dichte}  ${px}px, adaptiv ${flaeche}px`);
  }

  // Der Hintergrund des adaptiven Symbols kommt aus einer Farbe, nicht aus
  // einem Bild. Die Vorlage setzt Weiss — auf einem weissen Startbildschirm
  // verschwindet das Glas darin.
  writeFileSync(p('android/app/src/main/res/values/ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0E1A2E</color>
</resources>
`);
  console.log('  ic_launcher_background  #0E1A2E');
}

console.log('\n--- Startbilder ---');
{
  // Ein Startbild ist kein Symbol: es fuellt den ganzen Bildschirm, und das
  // Logo steht klein in der Mitte. Der Rest ist der Grundton der Bar, damit
  // der Uebergang ins Spiel nicht blitzt.
  const startbild = async (breite, hoehe, ziel) => {
    const logo = Math.round(Math.min(breite, hoehe) * 0.3);
    const bild = await rendern(nurGlas, logo).png().toBuffer();
    await sharp({ create: { width: breite, height: hoehe, channels: 4, background: GRUND } })
      .composite([{ input: bild, gravity: 'centre' }])
      .png().toFile(p(ziel));
  };

  for (const datei of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    await startbild(2732, 2732, `ios/App/App/Assets.xcassets/Splash.imageset/${datei}`);
  }
  console.log('  iOS  3x 2732x2732');

  // Android haelt Hoch- und Querformat getrennt. Quer wird nie zu sehen sein
  // (die App ist im Manifest auf portrait festgenagelt), die Dateien muessen
  // aber da sein — sonst zeigt der Launcher in dem einen Moment, in dem das
  // Geraet quer gehalten wird, ein leeres Feld.
  const ANDROID = [['mdpi', 320, 480], ['hdpi', 480, 800], ['xhdpi', 720, 1280],
                   ['xxhdpi', 960, 1600], ['xxxhdpi', 1280, 1920]];
  for (const [dichte, b, h] of ANDROID) {
    await startbild(b, h, `android/app/src/main/res/drawable-port-${dichte}/splash.png`);
    await startbild(h, b, `android/app/src/main/res/drawable-land-${dichte}/splash.png`);
  }
  await startbild(480, 320, 'android/app/src/main/res/drawable/splash.png');
  console.log('  Android  5 Dichten, hoch und quer');
}

console.log('\nFertig. Danach `npx cap sync` ist NICHT noetig — die Dateien liegen');
console.log('bereits in den nativen Projekten.');
