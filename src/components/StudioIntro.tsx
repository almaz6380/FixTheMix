// Das Studio-Intro: das WellApps-Logo beim Oeffnen der App.
//
// Josef, 07.11.2026: „erscheint nicht mein WellApps-Logo wie bei Mountain Ride,
// wenn man die App oeffnet". Uebernommen aus `almaz6380/Mountain-Ride`
// (`#intro` in dessen index.html), mit demselben Bild und demselben Ablauf:
//
//   0,25 s  das „W" wird als Neonlinie gezeichnet (1,15 s)
//   1,45 s  das ganze Logo blendet ein
//   2,90 s  das Intro blendet aus
//   3,45 s  es ist weg
//
// NUR in der Store-App (oder mit `?intro` zum Ausprobieren im Browser). Wer die
// Web-App oder einen Rechtstext-Link oeffnet, soll nicht drei Sekunden auf ein
// Logo warten — die Datenschutz-URL muss sofort lesbar sein.
//
// Das native Startbild (`tools/app-icons-bauen.mjs`) ist deshalb nur noch der
// dunkle Grund `#020814`, derselbe wie hier: kein Glas-Symbol, das kurz
// aufblitzt und dann vom Intro ersetzt wird.
//
// Antippen ueberspringt es — ein Intro, das man bei jedem Start absitzen muss,
// nervt ab dem zehnten Mal.

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import bild from '../assets/wellapps-intro.jpg';

type Phase = 'zeichnet' | 'logo' | 'aus' | 'weg';

/** Beim Laden einmal entschieden: Store-App oder `?intro`. */
const ZEIGEN = (() => {
  try {
    return Capacitor.isNativePlatform() || /[?&]intro\b/.test(globalThis.location?.search ?? '');
  } catch {
    return false;
  }
})();

export default function StudioIntro() {
  const [phase, setPhase] = useState<Phase>(ZEIGEN ? 'zeichnet' : 'weg');

  useEffect(() => {
    if (!ZEIGEN) return;
    const t = [
      setTimeout(() => setPhase('logo'), 1450),
      setTimeout(() => setPhase('aus'), 2900),
      setTimeout(() => setPhase('weg'), 3450),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  if (phase === 'weg') return null;

  return (
    <div
      className={`studio-intro ${phase !== 'zeichnet' ? 'studio-intro-logo' : ''} ${phase === 'aus' ? 'studio-intro-aus' : ''}`}
      aria-hidden="true"
      onClick={() => setPhase('aus')}
    >
      <img src={bild} alt="" draggable={false} />
      {/* Die Linie liegt auf dem „W" im Bild (768 x 1376, `slice` wie das
          Bild selbst mit `object-fit: cover`). */}
      <svg viewBox="0 0 768 1376" preserveAspectRatio="xMidYMid slice">
        <path pathLength={1} d="M260 535 L325 690 L385 557 L442 690 L507 535" />
      </svg>
    </div>
  );
}
