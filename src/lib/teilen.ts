// Der Text zum Teilen.
//
// SPOILERFREI, und das ist die eigentliche Anforderung. Wer sein Ergebnis in
// eine Gruppe schickt, darf das Raetsel damit nicht verraten — sonst teilt es
// niemand ein zweites Mal. Geteilt wird deshalb die LEISTUNG, nicht das Brett:
// Sterne, Zugzahl, Optimum und ein Balken, der beides vergleichbar macht. Das
// ist die Lehre aus Wordle, und sie ist der Grund, warum das Teilen dort
// funktioniert hat.
//
// Kein i18n-Import hier: die Worte kommen von aussen herein, damit diese Datei
// rein bleibt und im Test ohne React und ohne i18next laeuft.

/** Wie viele Felder der Balken hat. */
const FELDER = 10;

export interface TeilDaten {
  /** Fortlaufende Nummer des Tagesraetsels. */
  nummer: number;
  zuege: number;
  optimum: number;
  /** 0..3 */
  sterne: number;
  /** Laufende Serie in Tagen. 0 blendet die Zeile aus. */
  serie: number;
}

export interface TeilWorte {
  /** „Züge" / „moves" */
  zuege: string;
  /** „Optimum" / „best" */
  optimum: string;
  /** „Tage Serie" / „day streak" */
  serie: string;
}

/**
 * Baut den Balken: je effizienter gespielt, desto mehr gefuellte Felder.
 *
 * `optimum / zuege` und nicht die Differenz — damit ein Level mit 8 Zuegen und
 * eines mit 28 denselben Maßstab haben. Ein perfekter Lauf gibt zehn Felder,
 * der doppelte Weg fuenf.
 */
export function balken(zuege: number, optimum: number): string {
  if (!Number.isFinite(zuege) || zuege <= 0) return '⬜'.repeat(FELDER);
  const anteil = Math.max(0, Math.min(1, optimum / zuege));
  // Aufrunden, aber nie auf zehn, solange nicht wirklich perfekt gespielt
  // wurde: zehn gefuellte Felder sind das Versprechen „Optimum".
  const voll = anteil >= 1 ? FELDER : Math.min(FELDER - 1, Math.ceil(anteil * FELDER));
  return '🟩'.repeat(voll) + '⬜'.repeat(FELDER - voll);
}

export function teilText(d: TeilDaten, w: TeilWorte): string {
  const sterne = '⭐'.repeat(d.sterne) + '·'.repeat(Math.max(0, 3 - d.sterne));
  const zeilen = [
    `🍹 FixTheMix #${d.nummer}  ${sterne}`,
    `${d.zuege} ${w.zuege} · ${w.optimum} ${d.optimum}`,
    balken(d.zuege, d.optimum),
  ];
  if (d.serie > 1) zeilen.push(`🔥 ${d.serie} ${w.serie}`);
  zeilen.push('fixthemix.almaz6380.workers.dev');
  return zeilen.join('\n');
}
