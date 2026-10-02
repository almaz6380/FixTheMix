// Traegt die Uebersetzungen des iOS-Tracking-Dialogs (ATT) ins Xcode-Projekt ein —
// OHNE Xcode (Josef, 02.10.2026: „nein ohne xcode!!!! du machst es alles!").
//
// iOS liest den Text des Dialogs „Darf die App dich verfolgen?" aus
// `NSUserTrackingUsageDescription`. In der Info.plist steht er nur einmal, auf
// Deutsch. Uebersetzt wird er ueber je eine Datei `<code>.lproj/InfoPlist.strings`
// — die aber nur in die App kommt, wenn sie in der project.pbxproj steht: als
// Variantengruppe `InfoPlist.strings`, in der Ressourcen-Phase des App-Targets,
// und jede Sprache in `knownRegions`. Genau das macht dieses Werkzeug.
//
// DIE TEXTE stehen bei den anderen Uebersetzungen: `ios.tracking` in jeder
// src/i18n/locales/<code>.json. Damit prueft test-recht.mts sie mit (alle
// Sprachen, kein leerer Text), und test-release.mts prueft die Verkabelung.
//
// Geschrieben wird mit der Bibliothek `xcode` — dieselbe, mit der Capacitor die
// Projektdatei selbst schreibt (sie kommt mit @capacitor/cli). Danach wird die
// Datei NEU eingelesen: eine kaputte project.pbxproj merkt man sonst erst im
// Release-Build auf dem Mac.
//
// Idempotent: ein zweiter Lauf schreibt dieselben Texte und aendert am Projekt
// nichts. Eine neue Sprache: Code in src/i18n/sprachen.ts, Datei in locales/,
// dann dieses Werkzeug laufen lassen.
//
// Aufruf: node tools/ios-sprachen.mjs
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SPRACH_CODES } from '../src/i18n/sprachen.ts';

const require = createRequire(import.meta.url);
const xcode = require('xcode');

const wurzel = new URL('..', import.meta.url).pathname;
const APP = join(wurzel, 'ios/App/App');
const PBX = join(wurzel, 'ios/App/App.xcodeproj/project.pbxproj');
const GRUPPE = 'InfoPlist.strings';

/** Ein Wert fuer die pbxproj: mit Anfuehrungszeichen, sobald er etwas anderes
    als Buchstaben, Ziffern und _$/:. enthaelt — so schreibt es auch Xcode
    (`"zh-Hans"`, `"<group>"`). */
const pbxWert = (s) => (/^[A-Za-z0-9_$/:.]+$/.test(s) ? s : `"${s}"`);
/** Ein Wert fuer eine .strings-Datei. */
const stringsWert = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

// --- 1. Die Dateien -------------------------------------------------------
let geschrieben = 0;
for (const code of SPRACH_CODES) {
  const sprache = JSON.parse(readFileSync(join(wurzel, `src/i18n/locales/${code}.json`), 'utf8'));
  const text = sprache.ios?.tracking;
  if (!text || !text.trim()) throw new Error(`${code}.json: ios.tracking fehlt`);
  const ordner = join(APP, `${code}.lproj`);
  mkdirSync(ordner, { recursive: true });
  const inhalt =
    `/* Erzeugt von tools/ios-sprachen.mjs aus src/i18n/locales/${code}.json (ios.tracking).\n` +
    `   Nicht von Hand aendern — dort aendern und das Werkzeug laufen lassen. */\n` +
    `"NSUserTrackingUsageDescription" = "${stringsWert(text)}";\n`;
  const pfad = join(ordner, 'InfoPlist.strings');
  if (!existsSync(pfad) || readFileSync(pfad, 'utf8') !== inhalt) {
    writeFileSync(pfad, inhalt);
    geschrieben++;
  }
}
console.log(`InfoPlist.strings: ${SPRACH_CODES.length} Sprachen, ${geschrieben} neu oder geaendert`);

// --- 2. Das Projekt -------------------------------------------------------
const projekt = xcode.project(PBX);
projekt.parseSync();
const objekte = projekt.hash.project.objects;

// Die App-Gruppe (path = App) und die Ressourcen-Phase des App-Targets.
const gruppen = objekte.PBXGroup;
const appGruppe = Object.keys(gruppen).find((k) => !k.endsWith('_comment') && gruppen[k].path === 'App');
if (!appGruppe) throw new Error('Gruppe „App" nicht gefunden');
const target = projekt.getFirstTarget().firstTarget;
const phaseRef = target.buildPhases.find((p) => p.comment === 'Resources');
if (!phaseRef) throw new Error('Ressourcen-Phase nicht gefunden');
const phase = objekte.PBXResourcesBuildPhase[phaseRef.value];

// Die Variantengruppe — einmal anlegen, danach wiederfinden.
objekte.PBXVariantGroup ??= {};
const varianten = objekte.PBXVariantGroup;
let vg = Object.keys(varianten).find((k) => !k.endsWith('_comment') && varianten[k].name === GRUPPE);
let neu = 0;
if (!vg) {
  vg = projekt.generateUuid();
  varianten[vg] = { isa: 'PBXVariantGroup', children: [], name: GRUPPE, sourceTree: '"<group>"' };
  varianten[`${vg}_comment`] = GRUPPE;
  gruppen[appGruppe].children.push({ value: vg, comment: GRUPPE });
  const bf = projekt.generateUuid();
  objekte.PBXBuildFile[bf] = { isa: 'PBXBuildFile', fileRef: vg, fileRef_comment: GRUPPE };
  objekte.PBXBuildFile[`${bf}_comment`] = `${GRUPPE} in Resources`;
  phase.files.push({ value: bf, comment: `${GRUPPE} in Resources` });
  neu++;
}

// Je Sprache eine Dateireferenz in der Gruppe und ein Eintrag in knownRegions.
const refs = objekte.PBXFileReference;
for (const code of SPRACH_CODES) {
  const pfad = `${code}.lproj/${GRUPPE}`;
  const schon = varianten[vg].children.some((c) => {
    const r = refs[c.value];
    return r && r.path?.replace(/"/g, '') === pfad;
  });
  if (!schon) {
    const ref = projekt.generateUuid();
    refs[ref] = {
      isa: 'PBXFileReference',
      lastKnownFileType: 'text.plist.strings',
      name: pbxWert(code),
      path: pbxWert(pfad),
      sourceTree: '"<group>"',
    };
    refs[`${ref}_comment`] = code;
    varianten[vg].children.push({ value: ref, comment: code });
    neu++;
  }
  const regionen = projekt.pbxProjectSection()[projekt.getFirstProject().uuid].knownRegions;
  if (!regionen.some((r) => r.replace(/"/g, '') === code)) {
    regionen.push(pbxWert(code));
    neu++;
  }
}

if (neu > 0) {
  // Die Bibliothek liest Zahlen als Zahlen und schreibt `LastUpgradeCheck = 0920`
  // als `920` zurueck. Xcode stoert das nicht, aber es waere eine Aenderung, die
  // niemand bestellt hat — die Werte von vorher werden wortgleich zurueckgesetzt.
  const vorher = readFileSync(PBX, 'utf8');
  let text = projekt.writeSync();
  for (const schluessel of ['LastSwiftUpdateCheck', 'LastUpgradeCheck']) {
    const alt = vorher.match(new RegExp(`${schluessel} = ([^;]+);`));
    if (alt) text = text.replace(new RegExp(`${schluessel} = [^;]+;`), `${schluessel} = ${alt[1]};`);
  }
  writeFileSync(PBX, text);
  console.log(`project.pbxproj: ${neu} Eintraege ergaenzt`);
} else {
  console.log('project.pbxproj: schon vollstaendig, nichts geaendert');
}

// --- 3. Gegenprobe: laesst sich die Datei wieder lesen? --------------------
const probe = xcode.project(PBX);
probe.parseSync();
const vgProbe = Object.values(probe.hash.project.objects.PBXVariantGroup)
  .find((g) => typeof g === 'object' && g.name === GRUPPE);
console.log(`Gegenprobe: liest sich, ${vgProbe?.children.length ?? 0} Sprachen in ${GRUPPE}`);
