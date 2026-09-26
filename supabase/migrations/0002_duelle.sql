-- Duelle: Paarung, Frist, Ergebnis.
--
-- REGEL: beide bekommen dasselbe Brett, wer weniger Zuege braucht, gewinnt,
-- gleich viele sind ein Remis. Die Begruendung fuer das Remis steht in
-- src/engine/duell.ts — jedes Stechen (Zeit, Reihenfolge) waere unfair.
--
-- RECHTE-MUSTER wie in 0001 und in anigosha (Migration 0064): der Tabelle wird
-- ALLES entzogen, und nur die Client-RPCs werden fuer `authenticated`
-- freigegeben. Zugfolgen kommen ausschliesslich ueber die Edge Function
-- `duell-einreichen` herein, die sie nachspielt und mit dem
-- Service-Role-Schluessel schreibt. Ein Client, der eine Zugzahl direkt
-- eintragen will, kommt gar nicht an die Tabelle heran.
--
-- KEINE BOTS IN DER DATENBANK. Anigosha laesst Bots „lazy" in SQL ziehen, weil
-- eine Quizantwort eine Zahl ist. Hier muesste ein Bot ein Sortierpuzzle
-- spielen, und das kann nur die Engine. Ein Bot waere also entweder eine
-- Edge-Function-Aufgabe mit Cron oder eine Rechnung im Client — und die
-- zweite waere nicht pruefbar. Deshalb: die Datenbank paart nur MENSCHEN.
-- Findet sich keiner, laeuft das Duell ab, und der Client bietet stattdessen
-- ein Botduell an. Das braucht keine Datenbank (src/lib/duell.ts).
--
-- Idempotent.

-- ---------------------------------------------------------------------------
-- Partien
-- ---------------------------------------------------------------------------
create table if not exists public.duelle (
  id        uuid primary key default gen_random_uuid(),
  -- Bestimmt das Brett. `duellLevel(nummer)` in der Engine ist der EINE Weg
  -- dorthin; Client und Edge Function rufen dieselbe Funktion mit demselben
  -- Knotendeckel, sonst bekaemen die beiden Spieler verschiedene Bretter.
  nummer    integer     not null,
  spieler_a uuid        not null references auth.users (id) on delete cascade,
  spieler_b uuid        references auth.users (id) on delete cascade,
  -- Serverseitig nachgezaehlt, nie uebernommen. NULL heisst „noch nicht
  -- eingereicht" ODER „gueltig gespielt, aber nicht geloest" — welches von
  -- beiden, steht in `fertig_a`/`fertig_b`.
  zuege_a   integer     check (zuege_a is null or zuege_a > 0),
  zuege_b   integer     check (zuege_b is null or zuege_b > 0),
  fertig_a  boolean     not null default false,
  fertig_b  boolean     not null default false,
  status    text        not null default 'offen'
              check (status in ('offen', 'laeuft', 'fertig', 'abgelaufen')),
  ausgang   text        check (ausgang is null or ausgang in ('a', 'b', 'remis')),
  erstellt  timestamptz not null default now(),
  -- Bis wann gespielt werden muss. Wer die Frist verstreichen laesst, verliert
  -- gegen einen Gegner, der eingereicht hat.
  frist     timestamptz not null,
  beendet   timestamptz,
  check (spieler_b is null or spieler_a <> spieler_b)
);

create index if not exists duelle_offen_idx
  on public.duelle (status, erstellt) where status = 'offen';
create index if not exists duelle_a_idx on public.duelle (spieler_a, status);
create index if not exists duelle_b_idx on public.duelle (spieler_b, status);

alter table public.duelle enable row level security;
-- Absichtlich KEINE Policy: gelesen und geschrieben wird nur ueber die RPCs
-- unten und ueber die Edge Function.
revoke all on public.duelle from public;
revoke all on public.duelle from anon;
revoke all on public.duelle from authenticated;

-- Wie lange ein Duell laeuft, nachdem der zweite Spieler beigetreten ist, und
-- wie lange eine offene Partie auf einen Gegner wartet.
create or replace function public.duell_spielfrist() returns interval
language sql immutable as $$ select interval '48 hours' $$;

create or replace function public.duell_wartefrist() returns interval
language sql immutable as $$ select interval '10 minutes' $$;

-- ---------------------------------------------------------------------------
-- Abgelaufene Partien aufraeumen.
--
-- „Lazy" wie die Bots in anigosha: aufgeraeumt wird beim naechsten Zugriff,
-- nicht per Cron. Das spart eine ganze Cron-Infrastruktur und kann nicht
-- auseinanderlaufen — es gibt keinen Zustand, der zwischen zwei Laeufen
-- haengenbleibt.
-- ---------------------------------------------------------------------------
create or replace function public.duell_fristen_pruefen()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Offene Partien ohne Gegner: niemand hat gespielt, also kein Ergebnis.
  update public.duelle
     set status = 'abgelaufen', beendet = now()
   where status = 'offen' and erstellt < now() - duell_wartefrist();

  -- Laufende Partien ueber der Frist: wer eingereicht hat, gewinnt. Haben
  -- beide nichts eingereicht, ist es ein Remis — genau wie zwei Spieler, die
  -- beide nicht loesen.
  update public.duelle
     set status  = 'fertig',
         beendet = now(),
         ausgang = case
           when zuege_a is not null and zuege_b is null then 'a'
           when zuege_b is not null and zuege_a is null then 'b'
           when zuege_a is null and zuege_b is null      then 'remis'
           when zuege_a < zuege_b                        then 'a'
           when zuege_b < zuege_a                        then 'b'
           else 'remis'
         end
   where status = 'laeuft' and frist < now();
end $$;

-- ---------------------------------------------------------------------------
-- Einen Gegner suchen.
--
-- Erst in eine offene Partie eines ANDEREN einsteigen, sonst eine eigene
-- aufmachen. `for update skip locked` ist hier nicht Kosmetik: ohne das
-- koennten zwei gleichzeitige Aufrufe derselben offenen Partie beitreten, und
-- einer der beiden verschwaende seinen Zug.
-- ---------------------------------------------------------------------------
create or replace function public.duell_suchen()
returns table (id uuid, nummer integer, status text, gegner boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_id     uuid;
  v_nummer integer;
begin
  if auth.uid() is null then raise exception 'nicht angemeldet'; end if;
  perform duell_fristen_pruefen();

  -- Laeuft schon eine eigene Partie? Dann die, statt eine zweite aufzumachen.
  select d.id, d.nummer into v_id, v_nummer
    from public.duelle d
   where d.status in ('offen', 'laeuft')
     and (d.spieler_a = auth.uid() or d.spieler_b = auth.uid())
   order by d.erstellt desc
   limit 1;
  if found then
    return query
      select d.id, d.nummer, d.status, d.spieler_b is not null
        from public.duelle d where d.id = v_id;
    return;
  end if;

  -- Einer offenen Partie beitreten.
  select d.id into v_id
    from public.duelle d
   where d.status = 'offen' and d.spieler_a <> auth.uid()
     and d.erstellt >= now() - duell_wartefrist()
   order by d.erstellt asc
   limit 1
     for update skip locked;

  if found then
    update public.duelle
       set spieler_b = auth.uid(),
           status    = 'laeuft',
           frist     = now() + duell_spielfrist()
     where duelle.id = v_id;
    return query
      select d.id, d.nummer, d.status, true from public.duelle d where d.id = v_id;
    return;
  end if;

  -- Sonst selbst eine aufmachen. Die Nummer ist zufaellig und nicht
  -- durchgezaehlt: aus einer laufenden Nummer liesse sich ablesen, wie viele
  -- Duelle es insgesamt gibt, und benachbarte Bretter saehen sich aehnlich
  -- (der Seed wird in der Engine gehasht, aber die Nummer waere trotzdem
  -- verraeterisch).
  insert into public.duelle (nummer, spieler_a, frist)
  values ((random() * 2147483000)::integer + 1, auth.uid(), now() + duell_wartefrist())
  returning duelle.id, duelle.nummer into v_id, v_nummer;

  return query select v_id, v_nummer, 'offen'::text, false;
end $$;

-- ---------------------------------------------------------------------------
-- Den Stand einer eigenen Partie lesen.
--
-- Die Zugzahl des Gegners wird NUR herausgegeben, wenn die Partie fertig ist.
-- Sonst wuesste man vorher, wie viele Zuege zum Sieg reichen — und das Duell
-- waere keines mehr.
-- ---------------------------------------------------------------------------
create or replace function public.duell_stand(p_id uuid)
returns table (
  nummer integer, status text, ausgang text,
  meine_zuege integer, gegner_zuege integer,
  ich_bin_a boolean, gegner boolean, frist timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'nicht angemeldet'; end if;
  perform duell_fristen_pruefen();

  return query
    select d.nummer,
           d.status,
           d.ausgang,
           case when d.spieler_a = auth.uid() then d.zuege_a else d.zuege_b end,
           case when d.status = 'fertig'
                then case when d.spieler_a = auth.uid() then d.zuege_b else d.zuege_a end
                else null end,
           d.spieler_a = auth.uid(),
           d.spieler_b is not null,
           d.frist
      from public.duelle d
     where d.id = p_id
       and (d.spieler_a = auth.uid() or d.spieler_b = auth.uid());
end $$;

-- ---------------------------------------------------------------------------
-- Die eigene Bilanz. Anonym wie die Tagesbestenliste: es gibt keine Namen in
-- diesem Projekt, also wird auch keine fremde Spieler-ID herausgegeben.
-- ---------------------------------------------------------------------------
create or replace function public.duell_bilanz()
returns table (siege bigint, niederlagen bigint, remis bigint)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where (d.spieler_a = auth.uid() and d.ausgang = 'a')
                        or (d.spieler_b = auth.uid() and d.ausgang = 'b')),
    count(*) filter (where (d.spieler_a = auth.uid() and d.ausgang = 'b')
                        or (d.spieler_b = auth.uid() and d.ausgang = 'a')),
    count(*) filter (where d.ausgang = 'remis')
  from public.duelle d
 where d.status = 'fertig'
   and (d.spieler_a = auth.uid() or d.spieler_b = auth.uid());
$$;

revoke all on function public.duell_suchen() from public, anon;
revoke all on function public.duell_stand(uuid) from public, anon;
revoke all on function public.duell_bilanz() from public, anon;
revoke all on function public.duell_fristen_pruefen() from public, anon, authenticated;

grant execute on function public.duell_suchen() to authenticated;
grant execute on function public.duell_stand(uuid) to authenticated;
grant execute on function public.duell_bilanz() to authenticated;
