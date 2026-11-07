// Macht aus tools/vorlagen/app-symbol.jpg die App-Symbole und Startbilder der
// beiden nativen Projekte.
//
// WARUM ES DAS GEBEN MUSS: `npx cap add` legt die Capacitor-Logos an. Wer das
// nicht ersetzt, laedt eine App mit fremdem Logo in den Store hoch — und merkt
// es erst, wenn sie auf dem Homescreen liegt.
//
// EINE QUELLE: tools/vorlagen/app-symbol.jpg, gezeichnet in Gemini (Josef,
// 02.10.2026): zwei Glaeser, links gemischt, rechts fertig mit Strohhalm.
// Gemini hatte einen dunkleren Kasten INS Bild gemalt; die Datei ist schon auf
// diesen Kasten zugeschnitten (sonst stuende ein Rahmen im Symbol). Bis dahin war die Quelle ein von Hand gezeichnetes SVG
// (public/favicon.svg) — erst das Reagenzglas in der alten Neon-Palette, dann
// ein SVG-Entwurf der zwei Glaeser, den Josef „haesslich" fand, dann ein
// erstes Gemini-Bild mit Barlampe, das dem moderneren weichen musste. Auch
// tools/icons-bauen.mjs und tools/store-bilder.mjs lesen dieselbe Datei; zwei
// Fassungen desselben Logos laufen sonst auseinander, und man sieht es erst
// am Geraet.
//
// Aufruf: node tools/app-icons-bauen.mjs
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const wurzel = new URL('..', import.meta.url).pathname;
const p = (...t) => join(wurzel, ...t);

const QUELLE = p('tools/vorlagen/app-symbol.jpg');
const svg = await sharp(QUELLE).resize(1024, 1024).png().toBuffer();

/*
  Dasselbe Bild mit WEICH AUSLAUFENDEM RAND, fuer alles, was das Symbol auf
  eine Flaeche legt: den Vordergrund des adaptiven Android-Symbols und die
  Startbilder. Der Grund des Bildes ist fast, aber nicht genau das Nachtblau
  der App (#081525 gegen #0E1A2E) — ohne den Verlauf saehe man ein Quadrat
  auf dem Quadrat. Ein Rechteck mit runden Ecken, weichgezeichnet, und nicht
  ein Kreis: die Spitze des Strohhalms steht fast in der Bildecke, ein
  runder Verlauf haette sie ausgeblendet.
*/
const rand = Buffer.from(
  '<svg width="1024" height="1024"><rect x="90" y="90" width="844" height="844" rx="220" fill="#fff"/></svg>',
);
const randMaske = await sharp(rand).blur(70).png().toBuffer();
const nurGlas = await sharp(svg).ensureAlpha()
  .composite([{ input: randMaske, blend: 'dest-in' }]).png().toBuffer();

/** Der Grundton der Bar — derselbe Wert wie in capacitor.config.ts. */
const GRUND = { r: 0x0e, g: 0x1a, b: 0x2e, alpha: 1 };

const rendern = (quelle, px) => sharp(quelle).resize(px, px, { kernel: 'lanczos3' });

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

    // Adaptives Symbol: die Flaeche ist 108dp, sicher sichtbar ist aber nur
    // ein Kreis von 66dp — der Launcher darf beschneiden, wie er will. Das
    // Bild bekommt deshalb 60 %: so liegt sein entferntester Punkt, die
    // Spitze des Strohhalms (knapp 50 % der Bildbreite von der Mitte), noch
    // im Kreis (0,60 · 0,496 ≈ 0,298 < 33/108 ≈ 0,306).
    const flaeche = Math.round(px * (108 / 48));
    const innen = Math.round(flaeche * 0.6);
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
  // Das native Startbild ist seit dem 07.11.2026 nur noch der dunkle Grund
  // #020814 — derselbe wie im Studio-Intro (src/components/StudioIntro.tsx),
  // das gleich danach das WellApps-Logo zeichnet. Stuende hier das
  // Glas-Symbol, blitzte es kurz auf und wuerde dann vom Intro ersetzt. Muster
  // aus Mountain Ride.
  const INTRO_GRUND = { r: 2, g: 8, b: 20, alpha: 1 };
  const startbild = async (breite, hoehe, ziel) => {
    await sharp({ create: { width: breite, height: hoehe, channels: 4, background: INTRO_GRUND } })
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
