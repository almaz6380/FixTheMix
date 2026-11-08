// Prueft, was ein Release kaputt machen kann — und was kein anderer Test sieht.
//
// Die Engine-Tests pruefen das Spiel. Hier geht es um die Verkabelung zu den
// Stores: Bundle-IDs, die zwischen fuenf Dateien auseinanderlaufen; Werbung,
// die versehentlich mit Googles Beispiel-IDs live geht; eine ATT-Abfrage, die
// an einer Stelle steht, an der iOS sie nie aufruft. Keiner dieser Fehler
// macht sich bemerkbar, bevor Apple oder Google ablehnen — und dann vergehen
// Tage.
//
// ZWEI BETRIEBSARTEN, und der Unterschied ist wichtig:
//
//   node tools/test-release.mts
//     Die STIMMIGKEIT. Laeuft immer gruen, auch heute, wo es noch gar keine
//     AdMob-App gibt. Geprueft wird der Zusammenhang: Wer Test-Anzeigen
//     ausliefert, muss auch die Beispiel-App-IDs eingetragen haben — und wer
//     echte Anzeigen ausliefert, darf keine Beispiel-ID mehr stehen haben.
//     Der gefaehrliche Zustand ist die Mischung, und genau die faellt hier auf.
//
//   node tools/test-release.mts --release
//     Die BEREITSCHAFT. Verlangt zusaetzlich, dass wirklich alles da ist:
//     echte Anzeigen, echte Anzeigenbloecke, echte App-IDs. Diese Fassung
//     rufen die beiden Release-Workflows auf; sie schlaegt heute absichtlich
//     fehl, und ihre Ausgabe ist die Liste dessen, was Josef noch anlegen muss.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { SPRACH_CODES } from '../src/i18n/sprachen.ts';

const wurzel = new URL('..', import.meta.url).pathname;
const lies = (...t: string[]) => readFileSync(join(wurzel, ...t), 'utf8');
const gibtEs = (...t: string[]) => existsSync(join(wurzel, ...t));

const RELEASE = process.argv.includes('--release');

let fehler = 0;
const ok = (b: boolean, msg: string) => {
  if (!b) fehler++;
  console.log(`${b ? '  OK  ' : ' FEHL '} ${msg}`);
};

/** Nur in der Release-Fassung eine Zusicherung; sonst ein Hinweis. */
const bereit = (b: boolean, msg: string) => {
  if (RELEASE) return ok(b, msg);
  console.log(`${b ? '  OK  ' : ' offen'} ${msg}`);
};

const BUNDLE = 'at.gallab.fixthemix';
/** Googles oeffentliche Beispiel-Kennung. Jede Test-ID beginnt damit. */
const BEISPIEL = 'ca-app-pub-3940256099942544';

const werbung = lies('src/lib/werbung.ts');
const infoPlist = lies('ios/App/App/Info.plist');
const pbxproj = lies('ios/App/App.xcodeproj/project.pbxproj');
const manifest = lies('android/app/src/main/AndroidManifest.xml');
const gradle = lies('android/app/build.gradle');
const iosYml = lies('.github/workflows/ios-release.yml');
const androidYml = lies('.github/workflows/android-release.yml');

console.log('--- Die Bundle-ID steht an sechs Stellen ---');
{
  // Laeuft eine davon weg, baut alles weiter und der Upload scheitert ganz am
  // Ende — nach 25 Minuten macOS-Laufzeit.
  const stellen: [string, boolean][] = [
    ['capacitor.config.ts', lies('capacitor.config.ts').includes(`appId: '${BUNDLE}'`)],
    ['android/app/build.gradle (applicationId)', gradle.includes(`applicationId "${BUNDLE}"`)],
    ['android/app/build.gradle (namespace)', gradle.includes(`namespace = "${BUNDLE}"`)],
    ['android strings.xml', lies('android/app/src/main/res/values/strings.xml').includes(BUNDLE)],
    ['ios project.pbxproj', pbxproj.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE};`)],
    ['ios-release.yml (ExportOptions)', iosYml.includes(`<key>${BUNDLE}</key>`)],
    ['scripts/play-upload.py', lies('scripts/play-upload.py').includes(`'${BUNDLE}'`)],
  ];
  for (const [wo, stimmt] of stellen) ok(stimmt, `${wo} nennt ${BUNDLE}`);
}

console.log('\n--- Version ---');
{
  const vName = /versionName "([^"]+)"/.exec(gradle)?.[1] ?? '';
  const vMarket = /MARKETING_VERSION = ([^;]+);/.exec(pbxproj)?.[1]?.trim() ?? '';
  ok(/^\d+\.\d+\.\d+$/.test(vName), `Android versionName ist dreiteilig (${vName})`);
  ok(vName === vMarket, `iOS und Android tragen dieselbe Version (${vMarket} / ${vName})`);

  const vCode = Number(/versionCode (\d+)/.exec(gradle)?.[1] ?? 0);
  const vBuild = Number(/CURRENT_PROJECT_VERSION = (\d+);/.exec(pbxproj)?.[1] ?? 0);
  ok(vCode >= 1, `Android versionCode ist gesetzt (${vCode})`);
  ok(vBuild >= 1, `iOS Build-Nummer ist gesetzt (${vBuild})`);
}

console.log('\n--- Werbung: Test und Produktion duerfen sich nicht mischen ---');
{
  const testAn = /const TEST_ANZEIGEN = (true|false)/.exec(werbung)?.[1] === 'true';
  console.log(`       TEST_ANZEIGEN = ${testAn}`);

  const iosApp = /<key>GADApplicationIdentifier<\/key>\s*<string>([^<]+)<\/string>/.exec(infoPlist)?.[1] ?? '';
  const andApp = /com\.google\.android\.gms\.ads\.APPLICATION_ID"\s*\n?\s*android:value="([^"]+)"/.exec(manifest)?.[1] ?? '';
  ok(iosApp.startsWith('ca-app-pub-'), `iOS hat eine AdMob-App-ID (${iosApp})`);
  ok(andApp.startsWith('ca-app-pub-'), `Android hat eine AdMob-App-ID (${andApp})`);

  // Die Anzeigenbloecke aus beiden Abschnitten.
  const testBlock = /const TEST = \{([\s\S]*?)\n\};/.exec(werbung)?.[1] ?? '';
  const TEST_BLOCK = [...testBlock.matchAll(/'(ca-app-pub-[^']*)'/g)].map((m) => m[1]!);
  const prodBlock = /const PROD = \{([\s\S]*?)\n\};/.exec(werbung)?.[1] ?? '';
  const prodIds = [...prodBlock.matchAll(/'(ca-app-pub-[^']*)'/g)].map((m) => m[1]!);
  const prodLeer = /interstitial: ''/.test(prodBlock) || /rewarded: ''/.test(prodBlock);

  if (testAn) {
    // HIER STAND EINE ZU STRENGE REGEL, und sie ist am 26.09.2026 gefallen.
    //
    // Verlangt wurde, dass bei Test-Anzeigen AUCH die App-IDs Googles
    // Beispiel-Kennung tragen — begruendet damit, eine echte App-ID wuerde
    // die AdMob-Statistik mit Scheinabrufen fuellen. Das stimmt nicht:
    // Googles Test-Anzeigenbloecke gehoeren GOOGLE, nicht uns. Abrufe darauf
    // erreichen das eigene Konto gar nicht, egal welche App-ID danebensteht.
    //
    // Die Regel verbot damit ausgerechnet den nuetzlichsten Zwischenstand:
    // die AdMob-App ist angelegt, die echten App-IDs stehen in Info.plist und
    // Manifest, ausgeliefert werden aber weiter Test-Anzeigen. Genau so
    // entwickelt man vor dem Launch — und genau danach hat Josef gefragt.
    //
    // Was WIRKLICH gefaehrlich ist, bleibt geprueft (im `else`-Zweig): echte
    // Anzeigen mit einer Beispiel-App-ID liefern gar nichts aus, und ein
    // Release mit Test-Anzeigen verdient nichts.
    ok(TEST_BLOCK.length >= 4 && TEST_BLOCK.every((i) => i.startsWith(BEISPIEL)),
       `bei Test-Anzeigen sind alle vier Bloecke Googles Test-IDs (${TEST_BLOCK.length})`);
    const echt = !iosApp.startsWith(BEISPIEL) && !andApp.startsWith(BEISPIEL);
    console.log(`       App-IDs: ${echt ? 'echt (AdMob-App angelegt)' : 'noch Googles Beispiel'}`);
  } else {
    ok(!iosApp.startsWith(BEISPIEL), 'bei echten Anzeigen ist die iOS-App-ID keine Beispiel-ID mehr');
    ok(!andApp.startsWith(BEISPIEL), '... und die Android-App-ID auch nicht');
    ok(prodIds.length >= 4 && !prodLeer, `alle vier Anzeigenbloecke sind eingetragen (${prodIds.length})`);
    ok(!prodIds.some((i) => i.startsWith(BEISPIEL)), '... und keiner davon ist eine Test-ID');
  }

  bereit(!testAn, 'TEST_ANZEIGEN steht auf false');
  bereit(!iosApp.startsWith(BEISPIEL) && !andApp.startsWith(BEISPIEL),
         'beide AdMob-App-IDs sind echt');
  bereit(prodIds.length >= 4 && !prodLeer, 'die vier Anzeigenbloecke sind eingetragen');
}

console.log('\n--- iOS: die drei Dinge, an denen Apples Ablehnung 2.1 haengt ---');
{
  const szene = lies('ios/App/App/SceneDelegate.swift');
  const appDelegate = lies('ios/App/App/AppDelegate.swift');

  ok(infoPlist.includes('<key>NSUserTrackingUsageDescription</key>'),
     '1. die Info.plist hat den Begleittext fuer den ATT-Dialog');
  ok(szene.includes('ATTrackingManager.requestTrackingAuthorization'),
     '2. die ATT-Abfrage steht nativ im Code');

  // Und sie steht an der Stelle, an der iOS sie auch aufruft. Capacitor 8 legt
  // ein Scene-Manifest an; ab da ruft iOS `applicationDidBecomeActive` auf dem
  // AppDelegate NICHT mehr auf. Eine Uebernahme aus Anigosha (wo die Abfrage
  // genau dort steht) waere stumm geblieben — kein Fehler, kein Dialog, und
  // die Ablehnung kaeme erst von Apple.
  const hatSzenenManifest = infoPlist.includes('UIApplicationSceneManifest');
  ok(hatSzenenManifest, '   das Projekt benutzt den Scene-Lebenszyklus');
  ok(szene.includes('func sceneDidBecomeActive'),
     '   ... und die Abfrage haengt an sceneDidBecomeActive');
  ok(!appDelegate.includes('ATTrackingManager'),
     '   ... nicht im AppDelegate, wo iOS sie nie aufrufen wuerde');

  // Der Dialog darf nur im aktiven Zustand und auf dem Hauptthread kommen —
  // sonst zeigt iOS nichts und antwortet still mit notDetermined.
  ok(szene.includes('applicationState == .active'), '   nur wenn die App aktiv ist');
  ok(szene.includes('DispatchQueue.main'), '   und auf dem Hauptthread');

  // Punkt 3 ist die Angabe in App Store Connect und laesst sich von hier aus
  // nicht pruefen — sie steht deshalb in docs/release-ci.md.
  ok(lies('docs/release-ci.md').includes('Tracking'),
     '3. die Angabe in App Store Connect steht in der Anleitung');
}

console.log('\n--- iOS: der Tracking-Dialog in jeder Sprache ---');
{
  // Ohne diese Dateien zeigt iOS den Dialog in jeder Sprache auf Deutsch (dem
  // Text aus der Info.plist). Erzeugt und ins Projekt eingetragen werden sie
  // von tools/ios-sprachen.mjs — ohne Xcode (Josef, 02.10.2026). Eine Datei,
  // die nicht in der project.pbxproj steht, kommt nicht in die App, und das
  // merkt man erst am Geraet. Darum hier beides.
  const pbx = lies('ios/App/App.xcodeproj/project.pbxproj');
  const fehlen: string[] = [];
  const leer: string[] = [];
  const nichtImProjekt: string[] = [];
  for (const code of SPRACH_CODES) {
    const pfad = `ios/App/App/${code}.lproj/InfoPlist.strings`;
    if (!existsSync(join(wurzel, pfad))) { fehlen.push(code); continue; }
    const m = lies(pfad).match(/"NSUserTrackingUsageDescription"\s*=\s*"((?:[^"\\]|\\.)*)";/);
    if (!m || !m[1]!.trim()) leer.push(code);
    const q = code.includes('-') ? `"${code}.lproj/InfoPlist.strings"` : `${code}.lproj/InfoPlist.strings`;
    if (!pbx.includes(`path = ${q};`)) nichtImProjekt.push(code);
  }
  ok(fehlen.length === 0, `jede der ${SPRACH_CODES.length} Sprachen hat ein InfoPlist.strings (${fehlen.join(', ') || 'alle da'})`);
  ok(leer.length === 0, `... mit einem Tracking-Text (${leer.join(', ') || 'keiner leer'})`);
  ok(nichtImProjekt.length === 0, `... und steht in der project.pbxproj (${nichtImProjekt.join(', ') || 'alle'})`);

  // Mit der Bibliothek lesen, die auch Capacitor benutzt: laesst sich die Datei
  // parsen, und haengt die Variantengruppe in der Ressourcen-Phase des Targets?
  const xcode = createRequire(import.meta.url)('xcode');
  let gelesen = false;
  let inPhase = false;
  let regionen: string[] = [];
  try {
    const projekt = xcode.project(join(wurzel, 'ios/App/App.xcodeproj/project.pbxproj'));
    projekt.parseSync();
    gelesen = true;
    const objekte = projekt.hash.project.objects;
    const vg = Object.keys(objekte.PBXVariantGroup ?? {})
      .find((k) => objekte.PBXVariantGroup[k]?.name === 'InfoPlist.strings');
    const phase = projekt.getFirstTarget().firstTarget.buildPhases
      .find((p: { comment: string }) => p.comment === 'Resources');
    const dateien = objekte.PBXResourcesBuildPhase[phase.value].files as { value: string }[];
    inPhase = !!vg && dateien.some((f) => objekte.PBXBuildFile[f.value]?.fileRef === vg);
    regionen = (projekt.pbxProjectSection()[projekt.getFirstProject().uuid].knownRegions as string[])
      .map((r) => r.replace(/"/g, ''));
  } catch (e) {
    console.log(`        ${String(e)}`);
  }
  ok(gelesen, 'die project.pbxproj laesst sich parsen');
  ok(inPhase, 'InfoPlist.strings haengt in der Ressourcen-Phase des App-Targets');
  const ohneRegion = SPRACH_CODES.filter((c) => !regionen.includes(c));
  ok(ohneRegion.length === 0, `jede Sprache steht in knownRegions (${ohneRegion.join(', ') || 'alle'})`);
}

console.log('\n--- iOS: Info.plist und Signierung ---');
{
  ok(infoPlist.includes('<key>ITSAppUsesNonExemptEncryption</key>'),
     'die Exportbestimmung ist beantwortet (sonst fragt ASC bei jedem Upload)');
  ok(infoPlist.includes('<string>FixTheMix</string>'), 'der Anzeigename steht drin');
  ok((infoPlist.match(/SKAdNetworkIdentifier/g) ?? []).length >= 50,
     `die SKAdNetwork-Kennungen sind eingetragen (${(infoPlist.match(/SKAdNetworkIdentifier/g) ?? []).length})`);

  // Hochformat: das Brett ist eine Spalte aus hoechstens fuenf Glaesern je
  // Reihe. Quer stuenden sie winzig oder halb ausserhalb.
  const hoch = /<key>UISupportedInterfaceOrientations<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(infoPlist)?.[1] ?? '';
  ok(!hoch.includes('Landscape'), 'iPhone laeuft nur im Hochformat');
  ok(manifest.includes('android:screenOrientation="portrait"'), 'Android ebenso');
  // Ohne UIRequiresFullScreen verlangt Apple fuer iPad-Multitasking alle vier
  // Ausrichtungen und lehnt den Upload ab (Fehler 90474, gesehen am 03.10.2026).
  ok(/<key>UIRequiresFullScreen<\/key>\s*<true\/>/.test(infoPlist), 'iPad: Vollbild, sonst lehnt Apple Hochformat ab (90474)');

  // Die Signierung steht in der Release-Konfiguration des App-Targets und
  // nicht auf der Kommandozeile — sonst brechen die Swift-Pakete ab.
  ok(pbxproj.includes('CODE_SIGN_STYLE = Manual;'), 'Release signiert manuell');
  ok(pbxproj.includes('CODE_SIGN_STYLE = Automatic;'), '... Debug weiterhin automatisch');
  const profil = /PROVISIONING_PROFILE_SPECIFIER = "([^"]+)"/.exec(pbxproj)?.[1] ?? '';
  ok(profil.length > 0, `ein Profilname ist eingetragen (${profil})`);
  ok(iosYml.includes(`<string>${profil}</string>`),
     '... und der Workflow exportiert mit genau diesem Profil');
}

console.log('\n--- Android: Manifest ---');
{
  ok(manifest.includes('android.permission.INTERNET'), 'INTERNET ist erlaubt');
  // Ohne AD_ID liefert das SDK ab Android 13 nur nicht-personalisierte
  // Anzeigen — der halbe bis dreiviertel eCPM, und nichts protokolliert es.
  ok(manifest.includes('com.google.android.gms.permission.AD_ID'), 'die Werbe-ID ist angefordert');
  ok(manifest.includes('com.google.android.gms.ads.APPLICATION_ID'),
     'die AdMob-App-ID steht im Manifest (fehlt sie, stuerzt das SDK beim Start ab)');
}

console.log('\n--- Symbole und Startbilder ---');
{
  // Eine PNG-Kopfzeile lesen, ohne eine Abhaengigkeit dafuer zu holen:
  // Breite und Hoehe stehen ab Byte 16, der Farbtyp in Byte 25 (6 = mit Alpha).
  const png = (...t: string[]) => {
    const b = readFileSync(join(wurzel, ...t));
    return { breite: b.readUInt32BE(16), hoehe: b.readUInt32BE(20), alpha: (b[25]! & 4) !== 0 };
  };

  const symbol = png('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  ok(symbol.breite === 1024 && symbol.hoehe === 1024,
     `das iOS-Symbol ist 1024x1024 (${symbol.breite}x${symbol.hoehe})`);
  // App Store Connect lehnt ein App-Symbol mit Transparenz ab — und zwar erst
  // beim Upload, nach dem ganzen Build.
  ok(!symbol.alpha, '... und ohne Alphakanal');

  for (const [dichte, px] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]] as const) {
    const o = `android/app/src/main/res/mipmap-${dichte}`;
    const a = png(o, 'ic_launcher.png');
    const v = png(o, 'ic_launcher_foreground.png');
    ok(a.breite === px, `mipmap-${dichte}/ic_launcher.png ist ${px}px (${a.breite})`);
    ok(v.breite === Math.round(px * (108 / 48)),
       `... und der adaptive Vordergrund ${Math.round(px * (108 / 48))}px (${v.breite})`);
  }

  // Der Hintergrund des adaptiven Symbols: die Capacitor-Vorlage setzt Weiss,
  // auf weissem Startbildschirm verschwindet das Glas darin.
  const grund = lies('android/app/src/main/res/values/ic_launcher_background.xml');
  ok(!/#FFFFFF/i.test(grund), 'der adaptive Hintergrund ist nicht mehr das weisse Original');
  ok(grund.includes('#0E1A2E'), '... sondern das Nachtblau der Bar');
  // Seit dem 07.11.2026 beginnt die App mit dem Studio-Intro auf #020814 —
  // native Grundfarbe, Startbild und Intro muessen dieselbe Farbe tragen.
  ok(lies('capacitor.config.ts').includes("backgroundColor: '#020814'"),
     'und der native Hintergrund passt zum Studio-Intro (sonst blitzt es beim Start)');
  ok(lies('src/index.css').includes('background: #020814'),
     '... und das Intro selbst steht auf demselben Grund');

  for (const d of ['port', 'land']) {
    ok(gibtEs(`android/app/src/main/res/drawable-${d}-xxxhdpi/splash.png`),
       `Startbild ${d} vorhanden`);
  }
}

console.log('\n--- Schluessel duerfen nie ins Repo ---');
{
  const ignore = lies('.gitignore');
  // Der Android-Workflow schreibt beide Dateien in den Arbeitsordner. Wer
  // lokal einmal ein Release baut, haette sie sonst im naechsten Commit.
  for (const muster of ['keystore.properties', '*.jks', '*.keystore']) {
    ok(ignore.includes(muster), `.gitignore deckt ${muster} ab`);
  }
  ok(!gibtEs('android/keystore.properties') && !gibtEs('android/upload-keystore.jks'),
     'und es liegt gerade keiner davon herum');
}

console.log('\n--- Jedes Secret der Workflows steht in der Anleitung ---');
{
  // Ein Workflow, der ein Secret liest, das niemand angelegt hat, scheitert
  // erst im Lauf — und die Meldung sagt dann nur „leer".
  const doku = lies('docs/release-ci.md');
  const genannt = new Set<string>();
  for (const yml of [iosYml, androidYml]) {
    for (const m of yml.matchAll(/secrets\.([A-Z0-9_]+)/g)) genannt.add(m[1]!);
  }
  ok(genannt.size >= 10, `${genannt.size} verschiedene Secrets in den Workflows`);
  const fehlend = [...genannt].filter((s) => !doku.includes(s)).sort();
  ok(fehlend.length === 0,
     `alle stehen in docs/release-ci.md${fehlend.length ? `: ${fehlend.join(', ')}` : ''}`);
}

console.log('\n--- Die Workflows selbst ---');
{
  for (const [name, yml] of [['ios', iosYml], ['android', androidYml]] as const) {
    ok(yml.includes('workflow_dispatch'), `${name}: startet nur von Hand`);
    ok(/laeufer:/.test(yml) && yml.includes("'mac'"), `${name}: hat die Eingabe laeufer mit „mac"`);
    ok(yml.includes('npm run test:release'), `${name}: laeuft nicht ohne die Release-Pruefungen`);
    ok(yml.includes('if: always()'), `${name}: raeumt die Schluessel auch nach einem Abbruch weg`);
  }
  // Der Android-Workflow liest versionCode und versionName mit grep aus der
  // build.gradle. Aendert sich dort die Schreibweise, liest er still eine
  // leere Zeichenkette.
  ok(/grep -m1 versionCode/.test(androidYml) && /versionCode \d+/.test(gradle),
     'der Android-Workflow findet den versionCode, den build.gradle wirklich schreibt');
  ok(/grep -m1 CURRENT_PROJECT_VERSION/.test(iosYml) && /CURRENT_PROJECT_VERSION = \d+;/.test(pbxproj),
     'der iOS-Workflow findet die Build-Nummer, die das pbxproj wirklich schreibt');
}

console.log('\n--- Und das Spiel selbst ist wirklich dabei ---');
{
  // Die RevenueCat-Schluessel pruefen die Workflows selbst, direkt aus den
  // Secrets — hier waeren sie nicht zu sehen, und ein Test, der eine
  // Umgebungsvariable erwartet, die nur in der CI gesetzt ist, meldet lokal
  // einen Fehler, den es nicht gibt.
  const gross = statSync(join(wurzel, 'src/levels/folge.json')).size;
  ok(gross > 100_000, `die Levelfolge liegt im Repo (${Math.round(gross / 1024)} KB)`);
}

console.log(fehler === 0 ? '\nAlles gruen.' : `\n${fehler} Fehler.`);
if (!RELEASE && fehler === 0) {
  console.log('Hinweis: `node tools/test-release.mts --release` zeigt, was fuer einen');
  console.log('echten Store-Upload noch fehlt.');
}
process.exit(fehler === 0 ? 0 : 1);
