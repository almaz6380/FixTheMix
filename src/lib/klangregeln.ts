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
 * Wie lange Saft ins Zielglas laeuft, in Sekunden — so lange klingt der Guss.
 *
 * Haengt an der MENGE: wer vier Schichten auf einmal umschuettet, soll es
 * laenger hoeren als bei einer. Der Deckel von 0,5 s ist das Fenster, in dem
 * der Strahl im Ziel ankommt (46 % bis Ende von KIPP_MS = 900 ms in
 * Brett.tsx); laenger klaenge es nach, wenn laengst nichts mehr fliesst.
 * Acht Schichten (Experten-Level) liegen knapp darunter, damit auch sieben
 * und acht verschieden lang klingen — `test-klang.mts` prueft genau das.
 */
export function gussDauer(menge: number): number {
  const m = Math.max(1, Math.min(8, Math.round(menge)));
  return Math.min(0.5, 0.2 + m * 0.037);
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

/**
 * Abspieltempo der Giessaufnahme, je nach Fuellstand des ZIELglases.
 *
 * Ein Glas, das voller wird, klingt heller — die Luftsaeule darueber wird
 * kuerzer. Dasselbe Geraeusch etwas schneller abgespielt klingt genau so.
 * Gemessen wird an der Mitte des Gusses; der Bereich ist klein (0,92–1,12),
 * mehr klaenge nach Zeichentrick.
 */
export function gussTempo(vorher: number, nachher: number, hoehe: number): number {
  const h = Math.max(1, hoehe);
  const mitte = Math.max(0, Math.min(1, (vorher + nachher) / 2 / h));
  return 0.92 + 0.2 * mitte;
}
