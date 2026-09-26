-- Tagesraetsel: Ergebnisse und Bestenliste.
--
-- RECHTE-MUSTER wie in anigosha (Migration 0064): der Tabelle wird ALLES
-- entzogen, und nur die beiden Client-RPCs werden fuer `authenticated`
-- freigegeben. Geschrieben wird ausschliesslich von der Edge Function
-- `pruefe-tag` mit dem Service-Role-Schluessel, nachdem sie die Zugfolge
-- nachgespielt hat. Ein Client, der direkt in die Tabelle schreiben will,
-- kommt gar nicht an sie heran — das ist der Unterschied zwischen „wir
-- pruefen" und „man kann nicht anders".

create table if not exists public.tages_ergebnis (
  spieler   uuid        not null references auth.users (id) on delete cascade,
  -- Der ORTSTAG des Spielers, nicht der UTC-Tag des Servers. Die Begruendung
  -- steht in src/engine/tagesraetsel.ts: ein Tagesraetsel, das mittags
  -- wechselt, ist kein Ritual mehr. Die Edge Function laesst einen Tag
  -- Abweichung von ihrem eigenen UTC-Datum zu, mehr nicht.
  datum     date        not null,
  nummer    integer     not null,
  -- Alles hier ist SERVERSEITIG nachgerechnet. Der Client schickt nur seine
  -- Zugfolge; Zugzahl und Sterne kommen aus dem Nachspielen.
  zuege     integer     not null check (zuege > 0),
  sterne    smallint    not null check (sterne between 1 and 3),
  optimum   integer     not null check (optimum > 0),
  erstellt  timestamptz not null default now(),
  primary key (spieler, datum)
);

-- Die Bestenliste sortiert nach Zuegen und dann nach Zeitpunkt: bei gleicher
-- Zugzahl ist vorn, wer es zuerst hatte.
create index if not exists tages_ergebnis_rangliste
  on public.tages_ergebnis (datum, zuege asc, erstellt asc);

alter table public.tages_ergebnis enable row level security;
-- Absichtlich KEINE Policy: damit kommt ueber die Client-Schluessel niemand an
-- die Tabelle, weder lesend noch schreibend. Der Service-Role-Schluessel der
-- Edge Function umgeht RLS.

revoke all on public.tages_ergebnis from public;
revoke all on public.tages_ergebnis from anon;
revoke all on public.tages_ergebnis from authenticated;

-- ---------------------------------------------------------------------------
-- Die beiden Client-RPCs. `security definer`, damit sie an die Tabelle
-- kommen, und mit festem `search_path` — ohne den koennte ein Aufrufer mit
-- eigenem Schema eine Funktion unterschieben.
-- ---------------------------------------------------------------------------

-- Die Liste ist ANONYM. Es gibt (noch) keine Namen in diesem Projekt, und
-- solange es keine gibt, wird auch keine Spieler-ID herausgegeben: eine uuid
-- je Zeile waere ein Wiedererkennungsmerkmal ohne jeden Nutzen fuers Spiel.
create or replace function public.tagesbestenliste(p_datum date)
returns table (rang bigint, zuege integer, sterne smallint)
language sql
stable
security definer
set search_path = public
as $$
  select row_number() over (order by e.zuege asc, e.erstellt asc) as rang,
         e.zuege,
         e.sterne
  from public.tages_ergebnis e
  where e.datum = p_datum
  order by e.zuege asc, e.erstellt asc
  limit 100;
$$;

-- Der eigene Platz, auch wenn er jenseits der ersten hundert liegt.
create or replace function public.mein_tagesergebnis(p_datum date)
returns table (rang bigint, zuege integer, sterne smallint, von bigint)
language sql
stable
security definer
set search_path = public
as $$
  with alle as (
    select e.spieler,
           e.zuege,
           e.sterne,
           row_number() over (order by e.zuege asc, e.erstellt asc) as rang,
           count(*) over () as von
    from public.tages_ergebnis e
    where e.datum = p_datum
  )
  select a.rang, a.zuege, a.sterne, a.von
  from alle a
  where a.spieler = auth.uid();
$$;

revoke all on function public.tagesbestenliste(date) from public;
revoke all on function public.mein_tagesergebnis(date) from public;
grant execute on function public.tagesbestenliste(date) to authenticated;
grant execute on function public.mein_tagesergebnis(date) to authenticated;
