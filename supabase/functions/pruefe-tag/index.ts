// Edge Function `pruefe-tag`: nimmt eine Zugfolge, spielt sie nach, schreibt
// das Ergebnis.
//
// ABSICHTLICH DUENN. Die ganze Rechnung steht in `src/engine/tagespruefung.ts`
// und wird dort von `tools/test-tagesraetsel.mts` mit node geprueft. Hier
// bleibt nur Verkabelung: JSON herein, `pruefeTag()`, Zeile in die Datenbank.
// Wer eine Regel aendern will, aendert sie in der Engine — sonst liegt Wahrheit
// an zwei Orten und weicht irgendwann ab.
//
// DAS PRINZIP: Dem Client wird nichts geglaubt. Er schickt sein Datum und seine
// Zuege. Das Brett baut der Server selbst (`tagLevel`), Zugzahl und Sterne
// kommen aus dem Nachspielen. Eine Einsendung „ich hatte drei Sterne" gibt es
// gar nicht.
//
// UNGETESTET AUSGELIEFERT: In dieser Sitzung gab es kein Supabase-Projekt, also
// ist diese Datei nie deployt und nie gegen eine echte Datenbank gelaufen. Die
// Schritte zum Ausrollen stehen in docs/phase4-supabase.md. Was geprueft IST,
// ist die Rechnung darunter.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { pruefeTag } from '../../../src/engine/tagespruefung.ts';
import type { Zug } from '../../../src/engine/typen.ts';

interface Anfrage {
  datum?: unknown;
  zuege?: unknown;
}

const KOPF = {
  'content-type': 'application/json',
  // Die App laeuft als Capacitor-Build (origin `capacitor://`) und als Web-App.
  // Eine Sternchen-Freigabe ist hier vertretbar, weil die Funktion ohne
  // gueltiges JWT nichts tut und nichts herausgibt.
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
};

function antwort(daten: unknown, status = 200): Response {
  return new Response(JSON.stringify(daten), { status, headers: KOPF });
}

/** Das UTC-Datum des Servers. Die einzige Uhr in diesem Ablauf. */
function heuteUtc(): string {
  return new Date().toISOString().slice(0, 10);
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
  if (typeof koerper.datum !== 'string' || zuege === null) {
    return antwort({ fehler: 'datum oder zuege fehlen' }, 400);
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

  let urteil;
  try {
    urteil = pruefeTag({ datum: koerper.datum, zuege }, heuteUtc());
  } catch (f) {
    return antwort({ fehler: f instanceof Error ? f.message : 'Pruefung fehlgeschlagen' }, 400);
  }

  if (!urteil.ok) {
    // Der Grund geht mit zurueck: der Client soll unterscheiden koennen
    // zwischen „dein Datum liegt zu weit weg" und „Zug 14 war unzulaessig".
    return antwort({
      ok: false,
      grund: urteil.grund,
      zugGrund: urteil.zugGrund,
      fehlerIndex: urteil.fehlerIndex,
    }, 200);
  }

  // Schreiben mit dem Service-Schluessel: die Tabelle hat keine Policy, kein
  // Client kommt an sie heran.
  const alsDienst = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Nur eintragen, wenn es BESSER ist. Sonst koennte ein zweiter, schlechterer
  // Lauf den guten ueberschreiben.
  const { data: bisher } = await alsDienst
    .from('tages_ergebnis')
    .select('zuege')
    .eq('spieler', nutzer.user.id)
    .eq('datum', koerper.datum)
    .maybeSingle();

  if (!bisher || urteil.zuege < bisher.zuege) {
    const { error } = await alsDienst.from('tages_ergebnis').upsert({
      spieler: nutzer.user.id,
      datum: koerper.datum,
      nummer: urteil.nummer,
      zuege: urteil.zuege,
      sterne: urteil.sterne,
      optimum: urteil.optimum,
      erstellt: new Date().toISOString(),
    }, { onConflict: 'spieler,datum' });
    if (error) return antwort({ fehler: error.message }, 500);
  }

  return antwort({
    ok: true,
    zuege: urteil.zuege,
    sterne: urteil.sterne,
    nummer: urteil.nummer,
    optimum: urteil.optimum,
    verbessert: !bisher || urteil.zuege < bisher.zuege,
  });
});
