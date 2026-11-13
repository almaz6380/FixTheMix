// Schneidet das Giessgeraeusch aus der Rohaufnahme zu (braucht ffmpeg).
//
// Josef, 13.11.2026: der im Browser berechnete Klang war zweimal „nicht gut".
// Gewaehlt hat er aus drei echten Aufnahmen „Ton 2": Saft aus der Flasche in
// einen Becher, gemeinfrei (Quelle in src/assets/ton/QUELLE.md).
//
// Rohdatei:  tools/vorlagen/giessen-roh.ogg (2 s um den Guss herum)
// Ergebnis:  src/assets/ton/giessen.m4a — AAC mono, spielt in iOS- und
//            Android-WebView; Ogg kann Safari nicht zuverlaessig.
// Aufruf:    node tools/giess-ton.mjs
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

const VON = 0.4;    // = 6,9 s in der Originalaufnahme
const DAUER = 0.75;
const aus = 'src/assets/ton/giessen.m4a';
execFileSync('ffmpeg', [
  '-loglevel', 'error', '-y', '-ss', String(VON), '-t', String(DAUER),
  '-i', 'tools/vorlagen/giessen-roh.ogg',
  // Hochpass: in der Aufnahme brummt durchgehend etwas bei ~400 Hz.
  '-af', `highpass=f=650,lowpass=f=9000,afade=t=in:d=0.03,afade=t=out:st=${DAUER - 0.12}:d=0.12,`
    + 'loudnorm=I=-16:TP=-1.5,aresample=44100',
  '-ac', '1', '-c:a', 'aac', '-b:a', '64k', aus,
], { stdio: 'inherit' });
console.log(`${aus}: ${statSync(aus).size} Bytes`);
