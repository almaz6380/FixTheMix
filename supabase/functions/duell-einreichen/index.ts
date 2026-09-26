// Edge Function `duell-einreichen`: nimmt eine Zugfolge, spielt sie nach,
// schreibt das Ergebnis und schliesst das Duell ab, wenn beide fertig sind.
//
// ABSICHTLICH DUENN, wie `pruefe-tag`. Die ganze Rechnung steht in
// `src/engine/duellpruefung.ts` und wird dort von `tools/test-duell.mts` mit
// node geprueft. Hier bleibt nur Verkabelung. Wer eine Regel aendern will,
// aendert sie in der Engine — sonst liegt Wahrheit an zwei Orten und weicht
// irgendwann ab.
//
// DAS PRINZIP: Dem Client wird nichts geglaubt. Er schickt die Duell-ID und
// seine Zuege. Die Nummer — und damit das Brett — holt der Server aus der
// Datenbank, nicht aus der Anfrage: sonst koennte jemand die Zugfolge eines
// leichten Bretts zu einem schweren Duell einreichen.
//
// UNGETESTET AUSGELIEFERT: In dieser Sitzung gab es kein Supabase-Projekt,
// also ist diese Datei nie deployt und nie gegen eine echte Datenbank
// gelaufen. Die Schritte stehen in docs/phase4-supabase.md. Was geprueft IST,
// ist die Rechnung darunter.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { pruefeDuell } from '../../../src/engine/duellpruefung.ts';
import { duellSieger } from '../../../src/engine/duell.ts';
import type { Zug } from '../../../src/engine/typen.ts';

interface Anfrage {
  duell?: unknown;
  zuege?: unknown;
}

const KOPF = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
};

function antwort(daten: unknown, status = 200): Response {
  return new Response(JSON.stringify(daten), { status, headers: KOPF });
}

/**
 * Zuege aus dem Netz in die Form bringen, die die Engine erwartet — und dabei
 * alles wegwerfen, was nicht danach aussieht. `replay()` prueft jeden Zug
 * ohnehin gegen die Regeln, aber es soll keine halb geparste Struktur
 * hineinlaufen.
 */
function alsZuege(roh: unknown): Zug[] | null {
  if (!Array.isArray(roh)) return null;
  const raus: Zug[] = [];
  for (const z of roh) {
    if (typeof z !== 'object' || z === null) return null;
    const { von, nach } = z as Record<string, unknown>;
    if (!Number.isInteger(von) || !Number.isInteger(nach)) return null;
    raus.push({ von: von as number, nach: nach as number });
  }
  return raus;
}

Deno.serve(async (anfrage: Request) => {
  if (anfrage.method === 'OPTIONS') return new Response('ok', { headers: KOPF });
  if (anfrage.method !== 'POST') return antwort({ fehler: 'nur POST' }, 405);

  const jwt = anfrage.headers.get('authorization');
  if (!jwt) return antwort({ fehler: 'nicht angemeldet' }, 401);

  let koerper: Anfrage;
  try {
    koerper = await anfrage.json() as Anfrage;
  } catch {
    return antwort({ fehler: 'kein JSON' }, 400);
  }

  const zuege = alsZuege(koerper.zuege);
  if (typeof koerper.duell !== 'string' || zuege === null) {
    return antwort({ fehler: 'duell oder zuege fehlen' }, 400);
  }

  // Wer schickt? Mit dem JWT des Aufrufers, nicht mit dem Service-Schluessel —
  // sonst koennte jemand ein Ergebnis fuer einen fremden Spieler eintragen.
  const alsSpieler = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { authorization: jwt } } },
  );
  const { data: nutzer, error: authFehler } = await alsSpieler.auth.getUser();
  if (authFehler || !nutzer?.user) return antwort({ fehler: 'nicht angemeldet' }, 401);

  const alsDienst = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: duell, error: leseFehler } = await alsDienst
    .from('duelle')
    .select('id, nummer, spieler_a, spieler_b, zuege_a, zuege_b, fertig_a, fertig_b, status, frist')
    .eq('id', koerper.duell)
    .maybeSingle();

  if (leseFehler) return antwort({ fehler: leseFehler.message }, 500);
  if (!duell) return antwort({ fehler: 'unbekanntes Duell' }, 404);

  const istA = duell.spieler_a === nutzer.user.id;
  const istB = duell.spieler_b === nutzer.user.id;
  if (!istA && !istB) return antwort({ fehler: 'nicht dein Duell' }, 403);
  if (duell.status === 'fertig' || duell.status === 'abgelaufen') {
    return antwort({ fehler: 'Duell ist schon beendet' }, 409);
  }
  // Nur EINE Einsendung je Spieler. Ohne das koennte jemand so lange
  // nachreichen, bis das Ergebnis passt.
  if ((istA && duell.fertig_a) || (istB && duell.fertig_b)) {
    return antwort({ fehler: 'schon eingereicht' }, 409);
  }
  if (new Date(duell.frist).getTime() < Date.now()) {
    return antwort({ fehler: 'Frist abgelaufen' }, 409);
  }

  // Die Nummer kommt aus der DATENBANK, nicht aus der Anfrage. Sonst liesse
  // sich die Zugfolge eines leichten Bretts zu einem schweren Duell
  // einreichen.
  let urteil;
  try {
    urteil = pruefeDuell({ nummer: duell.nummer, zuege });
  } catch (f) {
    return antwort({ fehler: f instanceof Error ? f.message : 'Pruefung fehlgeschlagen' }, 400);
  }

  if (!urteil.ok) {
    // Abgewiesen heisst: so kann nicht gespielt worden sein. Das ist etwas
    // anderes als „nicht geloest" — das kommt als ok mit zuege: null.
    return antwort({
      ok: false,
      grund: urteil.grund,
      zugGrund: urteil.zugGrund,
      fehlerIndex: urteil.fehlerIndex,
    }, 200);
  }

  const meine = urteil.zuege;
  const andere = istA ? duell.zuege_b : duell.zuege_a;
  const andereFertig = istA ? duell.fertig_b : duell.fertig_a;

  const neu: Record<string, unknown> = istA
    ? { zuege_a: meine, fertig_a: true }
    : { zuege_b: meine, fertig_b: true };

  if (andereFertig) {
    // Beide durch: auswerten. `duellSieger` ist dieselbe Funktion, die der
    // Client benutzt — die Regel steht nur an einer Stelle.
    const ausgang = istA
      ? duellSieger(meine, andere as number | null)
      : duellSieger(andere as number | null, meine);
    neu.status = 'fertig';
    neu.ausgang = ausgang;
    neu.beendet = new Date().toISOString();
  }

  const { error: schreibFehler } = await alsDienst
    .from('duelle').update(neu).eq('id', duell.id);
  if (schreibFehler) return antwort({ fehler: schreibFehler.message }, 500);

  return antwort({
    ok: true,
    zuege: meine,
    optimum: urteil.optimum,
    fertig: Boolean(neu.status),
    ausgang: neu.ausgang ?? null,
    // Die Zugzahl des Gegners erst, wenn die Partie durch ist — vorher wuesste
    // man, wie viele Zuege zum Sieg reichen.
    gegnerZuege: neu.status ? andere : null,
  });
});
