// Die REGELN der Bar-Geraeusche — ohne eine Zeile WebAudio.
//
// Warum das eine eigene Datei ist und nicht oben in `klang.ts` steht: das
// Node-Projekt (`tsconfig.node.json`) hat bewusst **keine DOM-Typen**. Das ist
// kein Versehen, sondern der Schutz, der die Engine nach Deno portierbar haelt
// — wer dort `window` benutzt, faellt beim Bauen auf. `klang.ts` braucht aber
// `AudioContext`, kann also nie in dieses Projekt.
//
// Damit die Regeln trotzdem pruefbar sind, liegen sie hier: keine Importe,
// keine Globalen, reine Rechnung. `tools/test-klang.mts` prueft sie mit node,
// `klang.ts` benutzt sie. Dasselbe Muster wie bei der Werbebremse — geprueft
// wird die Regel, nicht das SDK.

/** Grundlautstaerke. Alles andere ist ein Bruchteil davon. */
export const LAUTSTAERKE = 0.16;

/**
 * Wie lange ein Guss klingt, in Sekunden.
 *
 * Haengt an der MENGE, nicht am Zufall: wer vier Schichten auf einmal
 * umschuettet, soll es laenger hoeren als bei einer. Der Faktor ist so
 * gewaehlt, dass acht Schichten (das Maximum der Experten-Level) noch UNTER
 * dem Deckel liegen. Mit 0,07 lagen sieben und acht beide auf 0,62 — zwei
 * verschieden grosse Guesse klangen gleich lang, und `test-klang.mts` hat
 * genau das gefangen. Der Deckel bleibt als Netz stehen: zwischen zwei Zuegen
 * liegen im Test 45 ms, und ein Mensch ist kaum langsamer.
 */
export function gussDauer(menge: number): number {
  const m = Math.max(1, Math.min(8, Math.round(menge)));
  return Math.min(0.62, 0.16 + m * 0.055);
}

/**
 * Die Toene der Siegmelodie, in Hertz.
 *
 * Ein Dur-Dreiklang, und er waechst mit den Sternen: ein Stern ist ein
 * einzelner Ton plus Grundton, drei Sterne sind vier — man hoert am Klang, wie
 * gut es war, bevor man das Fenster gelesen hat.
 */
export function siegToene(sterne: number): number[] {
  const alle = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const n = Math.max(1, Math.min(3, Math.round(sterne)));
  return alle.slice(0, n + 1);
}
