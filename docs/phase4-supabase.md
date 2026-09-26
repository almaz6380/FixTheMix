# Phase 4: Supabase aufsetzen

Alles, was ohne Datenbank geht, ist fertig und ausgeliefert: das Tagesrätsel
wird auf dem Gerät erzeugt, ist für alle Spieler dasselbe, hat Serie und
Teilen-Text. Was hier steht, ist der Rest — **Bestenliste und
Schummelschutz**, und der braucht ein Supabase-Projekt.

**Diese Dateien sind nie deployt worden.** In der Cloud-Sitzung gab es kein
Supabase-Projekt und keine Schlüssel. Geprüft ist die *Rechnung* darunter
(`src/engine/tagespruefung.ts`, 13 Zusicherungen in
`tools/test-tagesraetsel.mts`); ungeprüft ist die Verkabelung — also Deploy,
Auth und die SQL-Rechte gegen eine echte Datenbank.

## Was Josef tun muss

1. **Projekt anlegen** auf supabase.com. Region Frankfurt (`eu-central-1`) wie
   bei Anigosha, damit die Latenz für DE/AT stimmt.
2. **Anonyme Anmeldung einschalten** — Authentication → Providers → *Anonymous
   sign-ins*. Die Bestenliste braucht eine Spieler-ID, aber kein Konto: wer ein
   Tagesrätsel teilen will, soll sich nicht registrieren müssen.
   *Folge, die man kennen muss:* eine anonyme Kennung lebt im Gerät. Wer die App
   löscht, verliert seinen Platz in alten Bestenlisten. Das ist für Phase 4 in
   Ordnung; ein echtes Konto kommt, wenn es Duelle gibt (Version 1.1).
3. **Migration einspielen:** `supabase db push` oder den Inhalt von
   `supabase/migrations/0001_tagesraetsel.sql` im SQL-Editor ausführen.
4. **Edge Function ausrollen:** `supabase functions deploy pruefe-tag`.
   Die Funktion braucht `SUPABASE_URL`, `SUPABASE_ANON_KEY` und
   `SUPABASE_SERVICE_ROLE_KEY`; die setzt Supabase selbst, es ist nichts
   nachzutragen.
5. **Schlüssel für die App** in Vercel eintragen (Project → Settings →
   Environment Variables), **nicht** ins Repo:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   Der Service-Role-Schlüssel gehört **nie** in die App. Er steht nur
   serverseitig in der Edge Function.

## Was noch zu bauen ist, wenn das Projekt steht

- `src/lib/supabase.ts` — Client, nach dem Muster aus `anigosha`.
- Anmeldung beim ersten Start (`signInAnonymously`), Kennung im Speicher.
- Nach einem gelösten Tagesrätsel die Zugfolge an `pruefe-tag` schicken.
  Die Zugfolge liegt fertig bereit: `Partie.zuege` gibt sie als
  `{von, nach}`-Liste.
- Bestenliste anzeigen über die RPCs `tagesbestenliste(datum)` und
  `mein_tagesergebnis(datum)`.
- Fortschritt und Münzen zusätzlich in die Datenbank (der Kommentar in
  `src/lib/fortschritt.ts` sagt das seit Tag 1 voraus). Sobald Münzen aus
  Werbevideos kommen, ist `localStorage` allein nicht mehr tragfähig — es ist
  vom Spieler frei editierbar.

## Zwei Dinge, die beim Deploy schiefgehen können

**Der Import der Engine.** `supabase/functions/pruefe-tag/index.ts` importiert
`../../../src/engine/tagespruefung.ts`, also aus dem Repo heraus und nicht aus
`supabase/functions/`. Das ist genau der Weg, für den die Engine gebaut ist
(`.ts`-Endungen in allen Importen, keine Abhängigkeiten, keine Node- oder
Browser-APIs — siehe `src/engine/index.ts`). Sollte die Supabase-CLI sich
weigern, Dateien außerhalb von `supabase/` mitzunehmen, ist der Ausweg ein
Spiegel-Skript, das `src/engine/` vor dem Deploy nach
`supabase/functions/_shared/engine/` kopiert — **kein** zweiter, handgepflegter
Engine-Zweig. Zwei Kopien laufen auseinander, und dann gibt der Server für
dasselbe Brett ein anderes Urteil als der Client.

**Die Edge Function wird von `npm run build` nicht typgeprüft.** Sie liegt in
keinem `tsconfig`-Include, weil `Deno.serve` und `jsr:`-Importe in Node nicht
auflösen. Getippt wird sie erst beim `supabase functions deploy`. Wer sie
ändert, prüft also dort — oder verschiebt die Logik nach `src/engine/`, wo der
Test sie greift.

## Die Zeitzonen-Entscheidung, damit sie nicht in Vergessenheit gerät

Es gilt der **Ortstag des Spielers**, nicht UTC. Anigosha nimmt `current_date`
der Datenbank; damit wechselt das Rätsel in Hawaii um 14 Uhr und in Neuseeland
um 12 Uhr mittags — mitten am Tag. Ein Tagesrätsel ist ein Ritual, und ein
Wechsel am Nachmittag zerstört es.

Der Preis: die Bestenliste eines Tages umfasst weltweit rund 50 Stunden. Die
Edge Function lässt deshalb **einen Tag Abweichung** von ihrem eigenen
UTC-Datum zu (`DATUM_FENSTER` in `src/engine/tagespruefung.ts`) — das deckt
jede Zeitzone von UTC−12 bis UTC+14 ab, aber kein Rätsel von übermorgen.
