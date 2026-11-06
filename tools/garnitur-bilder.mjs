// Macht aus den Gemini-Vorlagen die Bilder der Garnitur.
//
// Josef hat am 02.10.2026 „schaerfere Grafiken" verlangt und den Strohhalm in
// Gemini zeichnen lassen. Die Vorlage liegt in tools/vorlagen/; dieses Skript
// macht daraus:
//
//   src/assets/garnitur/halm-<farbe>.webp  neun Strohhalme, Streifen umgefaerbt
//
// (Bis zum 02.10.2026 kamen hier auch neun Fruechte aus einem 3x3-Raster
// heraus. Josef hat sie wieder entfernt.)
//
// Einmal laufen lassen, das Ergebnis liegt im Repo — wie bei den Schriften.
// Aufruf: node tools/garnitur-bilder.mjs
//
// WARUM MAGENTA: Freigestellt wird per Farbschluessel, und dafuer braucht der
// Hintergrund eine Farbe, die im Bild nicht vorkommt. Der Halm ist rot-weiss —
// Weiss als Grund haette ihn halbiert.
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const wurzel = new URL('..', import.meta.url).pathname;
const ziel = join(wurzel, 'src/assets/garnitur');
mkdirSync(ziel, { recursive: true });

/** Die IDs aus farben.ts. */
const SORTEN = ['rot', 'gelb', 'blau', 'orange', 'gruen', 'lila', 'minze', 'kokos', 'kaffee'];
/** Streifenfarbe je Sorte — `tief` aus farben.ts. Kokos ist dort fast weiss; auf
    einem weissen Halm verschwaende der Streifen, deshalb ein dunkleres Beige. */
const STREIFEN = {
  rot: '#D60028', gelb: '#D4A800', blau: '#0040BE', orange: '#C95E00', gruen: '#3A9D00',
  lila: '#9500D1', minze: '#00AD8B', kokos: '#A88A5E', kaffee: '#642B00',
};

/*
  Freistellen. „Magenta-Anteil" m = min(R, B) - G: auf dem Hintergrund um 200,
  auf dem Halm nahe 0 oder darunter (Rot hat wenig Blau, Blau wenig Rot,
  Weiss hat viel Gruen). Zwischen UNTEN und OBEN laeuft der Alphakanal weich —
  JPEG-Kanten sind nie scharf.

  Dann die Kante ENTFAERBEN: ein halbdurchsichtiges Randpixel ist eine Mischung
  aus Halm und Magenta. Rechnet man den Hintergrund heraus
  (fg = (pix - (1 - a) * bg) / a), bleibt der Halm — sonst traegt er
  einen rosa Saum, der auf dem Nachtblau sofort auffaellt.
*/
const UNTEN = 55;
const OBEN = 130;
function freistellen(daten, breite, hoehe) {
  const aus = Buffer.alloc(breite * hoehe * 4);
  for (let i = 0; i < breite * hoehe; i++) {
    const r = daten[i * 3];
    const g = daten[i * 3 + 1];
    const b = daten[i * 3 + 2];
    const m = Math.min(r, b) - g;
    let a = m <= UNTEN ? 1 : m >= OBEN ? 0 : 1 - (m - UNTEN) / (OBEN - UNTEN);
    let [fr, fg, fb] = [r, g, b];
    if (a > 0 && a < 1) {
      // Der Hintergrund an dieser Stelle: Magenta in der Helligkeit des Pixels.
      const bg = [Math.max(r, b), Math.min(g, 40), Math.max(r, b)];
      fr = (r - (1 - a) * bg[0]) / a;
      fg = (g - (1 - a) * bg[1]) / a;
      fb = (b - (1 - a) * bg[2]) / a;
    }
    // Ein Rest Magenta-Stich bleibt trotzdem — im Saum UND in den deckenden
    // Pixeln direkt daneben (JPEG verschmiert die Farbe ueber die Kante).
    // Abgezogen wird nur der GEMEINSAME Teil von Rot und Blau ueber Gruen:
    // ein rotes oder blaues Pixel hat davon fast nichts und bleibt, wie es
    // ist; ein rosa Saumpixel verliert genau seinen Stich.
    const stich = Math.min(fr, fb) - fg;
    const schwelle = a < 1 ? 0 : 45;
    if (stich > schwelle) { fr -= stich - schwelle; fb -= stich - schwelle; }
    // Was nur noch zu einem Viertel deckt, ist Saum und kein Bild.
    if (a < 0.25) a = 0;
    aus[i * 4] = Math.max(0, Math.min(255, Math.round(fr)));
    aus[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(fg)));
    aus[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(fb)));
    aus[i * 4 + 3] = Math.round(a * 255);
  }
  return aus;
}

async function rohbild(datei) {
  const bild = sharp(datei).removeAlpha();
  const { data, info } = await bild.raw().toBuffer({ resolveWithObject: true });
  return { daten: freistellen(data, info.width, info.height), breite: info.width, hoehe: info.height };
}

const alsBild = ({ daten, breite, hoehe }) => sharp(daten, { raw: { width: breite, height: hoehe, channels: 4 } });

async function speichern(bild, name, max) {
  // Auf den Inhalt zuschneiden, dann so verkleinern, dass die laengere Kante
  // `max` ist. 288 px reichen fuer den Halm bei dreifacher Pixeldichte.
  const knapp = await bild.png().toBuffer().then((b) => sharp(b).trim({ threshold: 1 }).toBuffer());
  const pfad = join(ziel, `${name}.webp`);
  await sharp(knapp)
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(pfad);
  console.log(`  ${name}.webp  ${(statSync(pfad).size / 1024).toFixed(1)} KB`);
}

/*
  Der Strohhalm. Er liegt in der Vorlage um rund 15 Grad schraeg — genau die
  Neigung, mit der er im Glas stehen soll. Er wird deshalb NICHT gedreht,
  nur freigestellt und auf seine obere Haelfte gekuerzt: in voller Laenge
  staende er hoeher als das Glas selbst.
*/
console.log('Strohhalm:');
const halm = await rohbild(join(wurzel, 'tools/vorlagen/garnitur-halm.jpg'));
const halmKnapp = await alsBild(halm).png().toBuffer()
  .then((b) => sharp(b).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true }));
const halmBreite = halmKnapp.info.width;
const halmLaenge = Math.round(halmKnapp.info.height * 0.55);
// Die obere Haelfte, und zwar bis zur Mitte des Halms — ein Schnitt mitten
// durch die Schraege laesst unten eine schraege Kante; die steckt spaeter
// im Glas und ist nicht zu sehen.
const halmRoh = await sharp(halmKnapp.data)
  .extract({ left: 0, top: 0, width: halmBreite, height: halmLaenge })
  .raw().toBuffer();

/** Hex in Farbton/Saettigung/Helligkeit, alles 0..1. */
function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
  return [h, s, l];
}
function rgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p);
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}

for (const id of SORTEN) {
  const [zh, zs, zl] = hsl(...[1, 3, 5].map((i) => parseInt(STREIFEN[id].slice(i, i + 2), 16)));
  const buf = Buffer.from(halmRoh);
  for (let i = 0; i < buf.length; i += 4) {
    const [h, s, l] = hsl(buf[i], buf[i + 1], buf[i + 2]);
    // Nur die ROTEN Streifen; Weiss und die Glanzlichter bleiben.
    if (s > 0.3 && (h < 0.08 || h > 0.92)) {
      // Die Helligkeit folgt dem Original, verschoben auf den Zielton — so
      // bleiben Schatten und Glanz auf dem Streifen erhalten.
      const [r, g, b] = rgb(zh, Math.min(1, zs), Math.max(0.05, Math.min(0.95, zl + (l - 0.5))));
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
    }
  }
  await speichern(sharp(buf, { raw: { width: halmBreite, height: halmLaenge, channels: 4 } }), `halm-${id}`, 288);
}
