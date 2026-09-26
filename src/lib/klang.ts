// Die Bar-Geraeusche.
//
// KEINE TONDATEIEN. Alles hier wird im Browser erzeugt — Rauschen durch einen
// Filter fuer das Giessen, ein paar Sinustoene fuer den Rest. Das hat drei
// Gruende, und der dritte ist der wichtigste:
//
//  1. Null Bytes im Bundle. Ein brauchbarer Gieß-Sound als .mp3 waere 20–40 KB,
//     fuenf Geraeusche also schnell 150 KB — mehr als die halbe Levelfolge.
//  2. Offline sicher. Die Store-App laedt nichts nach; eine fehlende Tondatei
//     waere ein stummer Fehler, genau wie bei den Schriften.
//  3. Die Laenge richtet sich nach dem ZUG. Ein Guss von vier Schichten klingt
//     laenger als einer von einer — mit einer festen Datei ginge das nicht,
//     ohne sie abzuschneiden.
//
// LAUTSTAERKE: bewusst leise. Ein Sortierspiel wird nebenher gespielt, oft in
// der Bahn. Wer es zu laut findet, schaltet es ab — der Schalter steht in den
// Einstellungen, und AUS bleibt AUS (der Wert liegt in `localStorage`).
//
// DIE AUTOPLAY-REGEL: Browser lassen einen AudioContext erst laufen, nachdem
// der Benutzer etwas angetippt hat. Deshalb wird er hier LAZY angelegt — beim
// ersten Geraeusch, und das kommt immer aus einer Geste. Ein Context, der beim
// Laden der Seite entsteht, bleibt in `suspended` haengen und gibt bis zum
// Neuladen keinen Ton.
//
// Jeder Zugriff ist eingepackt: WebAudio fehlt in alten Browsern, ist in
// manchen eingebetteten Ansichten gesperrt, und ein Spiel darf daran nicht
// scheitern. Eine Ausnahme hier waere ausserdem eine Zeile in der Konsole —
// und der Oberflaechentest zaehlt die.

import { ladeEinstellung } from './fortschritt.ts';
import { LAUTSTAERKE, gussDauer, siegToene } from './klangregeln.ts';

// Die Regeln (`gussDauer`, `siegToene`, `LAUTSTAERKE`) stehen in
// `klangregeln.ts` — dort sind sie ohne DOM-Typen und damit in node pruefbar.
// Hier steht nur, WIE es klingt.

// ---------------------------------------------------------------------------
// Der Klangteil. Ab hier ist alles browserabhaengig und still, wenn es nicht
// geht.
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;
let summe: GainNode | null = null;
let rauschen: AudioBuffer | null = null;
let an = true;

/** Den Schalter setzen. Wird von den Einstellungen und beim Start gerufen. */
export function setzeTon(wert: boolean): void {
  an = wert;
}

/** Den gespeicherten Schalter lesen. Ton ist von Haus aus AN. */
export function tonGeladen(): boolean {
  return ladeEinstellung('ton', true);
}

/**
 * Den Context holen oder anlegen. Gibt `null` zurueck, wenn WebAudio nicht
 * verfuegbar ist — jeder Aufrufer prueft das und tut dann eben nichts.
 */
function hol(): AudioContext | null {
  if (!an) return null;
  try {
    if (!ctx) {
      const Klasse = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Klasse) return null;
      ctx = new Klasse();
      summe = ctx.createGain();
      summe.gain.value = LAUTSTAERKE;
      summe.connect(ctx.destination);
    }
    // Nach einem Wechsel in den Hintergrund steht der Context oft auf
    // `suspended`. Das Versprechen interessiert nicht — wenn es nicht klappt,
    // bleibt es eben still.
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** Ein Sekunde weisses Rauschen, einmal erzeugt und danach wiederverwendet. */
function holRauschen(c: AudioContext): AudioBuffer {
  if (!rauschen) {
    rauschen = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const daten = rauschen.getChannelData(0);
    // Kein Math.random-Verbot hier: das ist die Oberflaeche, nicht die Engine.
    // Ein Rauschen MUSS zufaellig sein, sonst ist es ein Ton.
    for (let i = 0; i < daten.length; i++) daten[i] = Math.random() * 2 - 1;
  }
  return rauschen;
}

/** Ein einzelner Ton mit weicher Huellkurve. */
function ton(
  c: AudioContext,
  frequenz: number,
  start: number,
  dauer: number,
  staerke: number,
  form: OscillatorType = 'sine',
): void {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = form;
  o.frequency.setValueAtTime(frequenz, start);
  // Rampen statt harter Spruenge: ein abrupt abgeschalteter Oszillator knackt,
  // und ein Knacken hoert man staerker als den Ton selbst.
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(staerke, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
  o.connect(g);
  g.connect(summe!);
  o.start(start);
  o.stop(start + dauer + 0.02);
}

/** Ein Glas antippen: ein kurzer, heller Klick an der Wandung. */
export function klangWahl(): void {
  const c = hol();
  if (!c) return;
  try {
    ton(c, 880, c.currentTime, 0.055, 0.35, 'triangle');
  } catch { /* still */ }
}

/** Ein Fehlgriff: dumpf und kurz, damit er nicht bestraft klingt. */
export function klangDaneben(): void {
  const c = hol();
  if (!c) return;
  try {
    ton(c, 160, c.currentTime, 0.09, 0.28, 'sine');
  } catch { /* still */ }
}

/**
 * Giessen: gefiltertes Rauschen mit fallender Tonhoehe.
 *
 * Das Bandpassfilter macht aus weissem Rauschen etwas, das nach Fluessigkeit
 * klingt; die fallende Mittenfrequenz ist der Trick, der es nach „laeuft in
 * ein Glas" klingen laesst statt nach Regen. Dazu ein leiser Ton, der mit dem
 * Fuellstand STEIGT — genau das hoert man an einem Glas, das voll wird.
 */
export function klangGuss(menge: number): void {
  const c = hol();
  if (!c) return;
  try {
    const jetzt = c.currentTime;
    const dauer = gussDauer(menge);

    const quelle = c.createBufferSource();
    quelle.buffer = holRauschen(c);
    quelle.loop = true;

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(1500, jetzt);
    filter.frequency.exponentialRampToValueAtTime(520, jetzt + dauer);

    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, jetzt);
    g.gain.exponentialRampToValueAtTime(0.5, jetzt + 0.05);
    g.gain.setValueAtTime(0.5, jetzt + dauer * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, jetzt + dauer);

    quelle.connect(filter);
    filter.connect(g);
    g.connect(summe!);
    quelle.start(jetzt);
    quelle.stop(jetzt + dauer + 0.02);

    // Der steigende Ton: das Glas fuellt sich.
    const o = c.createOscillator();
    const og = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(300, jetzt);
    o.frequency.exponentialRampToValueAtTime(430, jetzt + dauer);
    og.gain.setValueAtTime(0.0001, jetzt);
    og.gain.exponentialRampToValueAtTime(0.16, jetzt + 0.08);
    og.gain.exponentialRampToValueAtTime(0.0001, jetzt + dauer);
    o.connect(og);
    og.connect(summe!);
    o.start(jetzt);
    o.stop(jetzt + dauer + 0.02);
  } catch { /* still */ }
}

/** Sieg: ein Dreiklang, der mit den Sternen waechst. */
export function klangSieg(sterne: number): void {
  const c = hol();
  if (!c) return;
  try {
    const jetzt = c.currentTime;
    siegToene(sterne).forEach((f, i) => {
      ton(c, f, jetzt + i * 0.11, 0.34, 0.3, 'triangle');
    });
  } catch { /* still */ }
}

/** Muenzen: zwei helle Toene dicht hintereinander. */
export function klangMuenze(): void {
  const c = hol();
  if (!c) return;
  try {
    const jetzt = c.currentTime;
    ton(c, 1318.5, jetzt, 0.1, 0.24, 'triangle');
    ton(c, 1975.5, jetzt + 0.06, 0.14, 0.18, 'triangle');
  } catch { /* still */ }
}

/** Festgefahren: ein absteigender Zweiklang, leise und ohne Drama. */
export function klangSteckt(): void {
  const c = hol();
  if (!c) return;
  try {
    const jetzt = c.currentTime;
    ton(c, 330, jetzt, 0.2, 0.26, 'sine');
    ton(c, 247, jetzt + 0.14, 0.3, 0.24, 'sine');
  } catch { /* still */ }
}
