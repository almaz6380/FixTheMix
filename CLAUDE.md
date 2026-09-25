# CLAUDE.md — FixTheMix

## Projektübersicht

Sortier- und Misch-Puzzle mit Gläsern („Water Sort"-Genre) für App Store und Google Play.
Das Genre ist übervoll. Ziel ist deshalb, sich **mechanisch, optisch und bei der Fairness**
abzuheben, statt die hundertste Kopie zu werden.

**Name:** FixTheMix. **In TMview geprüft (25.09.2026): nicht eingetragen.**
Verworfen wurde „Fix-Mix" mit 227 Treffern in TMview. Lehre aus Anigosha (dort vier
verworfene Namen): Eine Websuche ersetzt keine Markenrecherche. Jeder künftige
Namenskandidat wird **zuerst in TMview** geprüft (Klasse 9 = Software, 41 = Spiele).
**Bundle-ID:** `at.gallab.fixthemix`
**Repository:** https://github.com/almaz6380/fixthemix — **muss privat bleiben**. Josefs
Mac hängt als Self-hosted Runner daran, und über einen Fork-PR könnte sonst fremder
Code auf seinem Rechner laufen.
**Betreiber:** Josef Gallab (wie Anigosha, MyPeak, Mahjong, Swaply).

## Josefs Entscheidungen (25.09.2026)

- **Besonderheiten:** echtes Mischen, Farbenblind-Modus, Tagesrätsel mit Teilen,
  Duelle (Duelle erst in Version 1.1).
- **Thema:** eine Bar mit Gläsern, Shaker und Gästen, **alkoholfrei**. Saft-, Smoothie-
  und Mocktail-Bar mit Früchten und Sirupen. Alkohol würde die Altersfreigabe heben
  (Apple „Alkohol-Bezüge", IARC) und jüngere Spieler ausschließen.
- **Werbung:** fair.

### Spielregeln (entschieden am 25.09.2026, beim Bau der Engine)

- **Shaker:** mehrere Slots pro Level. Genau zwei Grundfarben hinein, schütteln, alles
  wird zur Mischfarbe. Eine dritte Farbe hineinzugießen ist ein **ungültiger Zug**, der
  abgelehnt wird — es gibt bewusst keine „Fehlfarbe", die ein Level verdirbt.
- **Siegbedingung:** klassisch sortenrein. Jedes Glas ist leer oder randvoll einfarbig,
  alle Shaker sind leer. Halbvolle einfarbige Gläser zählen nicht. Die Gästebestellungen
  sind Themen-Verpackung desselben Ziels.
- **Farbsystem:** 3 Grund (Erdbeere/Rot, Zitrone/Gelb, Blaubeere/Blau), 3 Misch
  (Orange = R+G, Apfel/Grün = G+B, Traube/Lila = R+B), 3 Pur, die sich nie mischen
  lassen (Minze, Kokos, Kaffee). Neun Farben, jede mit eigenem Symbol und Emoji.
- **Gießen hat zwei Regeln, nicht eine.** Ins Glas gilt die Genre-Regel (Ziel leer oder
  oben dieselbe Farbe). In den Shaker kann diese Regel gar nicht gelten — sonst bekäme
  man nie eine zweite Farbe hinein. Dort gilt: nur Grundfarben, höchstens zwei
  verschiedene, das Paar muss in der Mischtabelle stehen, und **je Farbe passt höchstens
  die Hälfte hinein**.
- **Das Kontingent von `hoehe/2` ist der Trick.** Daraus folgt zwangsläufig: ein voller
  Shaker enthält immer genau zwei Grundfarben zu je der Hälfte. Damit ist Schütteln nur
  noch eine Füllstandsprüfung, und ein ungültiger Shaker-Zustand ist nicht bloß verboten,
  sondern unmöglich. **Sichtbare Folge:** Wer drei gleiche Schichten in einen leeren
  Shaker gießt, gibt nur zwei ab — der Shaker hat eine Hälfte-Markierung. Das weicht von
  „so viel wie passt" ab und ist Absicht.
  *Verworfen:* „zwei Farben in beliebigem Verhältnis werden zur Mischfarbe". Damit hätte
  3 Rot + 1 Gelb vier Orange ergeben, also Rot 1:1 in Orange getauscht. Die Farbbilanz des
  Generators wäre nicht mehr berechenbar gewesen.

## Aktueller Stand

### M1 Grundgerüst — FERTIG (25.09.2026)
- [x] Scaffold Vite + React + TS, Tailwind v4 (`@tailwindcss/vite`), Capacitor-Config
      (`at.gallab.fixthemix`) — Konventionen 1:1 aus anigosha
- [x] npm, `"type": "module"`, Node 22, oxlint (`.oxlintrc.json`), kein ESLint/Prettier
- [x] tsconfig als Projektverweise. **Abweichung von anigosha: `strict: true` ist AN.**
      Die Engine packt Zustände, indiziert Behälter und vergibt später serverseitig
      Punkte — dort ist ein übersehenes `undefined` teuer.
- [x] `tsconfig.node.json` schließt `tools/**/*.mts` mit ein, damit `npm run build` die
      Testskripte mit typprüft (in anigosha bleiben `tools/` ungeprüft)
- [x] i18n DE/EN mit `appSprache()`/`datenSprache()` wie in anigosha
- [x] `.claude/settings.json` + SessionStart-Hook (nur `npm install`; die `.env` entfällt,
      bis es in Phase 4 eine Datenbank gibt)
- [x] Platzhalter-`App.tsx`, damit `npm run build` von Anfang an grün ist

### M2 Engine, Löser, Generator — FERTIG (25.09.2026)
- [x] `src/engine/` vollständig, **144 Zusicherungen in vier Testskripten, alle grün**
- [x] Löser findet das **bewiesene** Optimum; auf 378 Zufallsbrettern gegen eine
      unabhängige Breitensuche nachgemessen, keine einzige Abweichung
- [x] Generator: 1.000 Level über alle sieben Stufen, jedes lösbar, jedes Optimum im Band
      (Gesamtlauf 58 s)
- [x] Mischung ist **erzwungen, nicht Dekoration** — hart nachgerechnet, nicht angenommen
- [x] Wiedergabe (Vorstufe des Schummelschutzes) lehnt manipulierte Zugfolgen mit
      benanntem Grund und Fehlerindex ab

## Was FixTheMix einzigartig macht

1. **„Fix" und „Mix": zwei Mechaniken, die den Namen erklären.**
   - **Fix** ist das bekannte Sortieren. Gegossen wird nur auf dieselbe Farbe oder in
     ein leeres Glas.
   - **Mix** kommt mit dem **Shaker**: Zwei Grundfarben hinein, schütteln, heraus kommt
     die Mischfarbe (Gelb + Blau = Grün). Gäste bestellen Zielgläser, etwa „4× Grün".
     Manche Farben gibt es nur durch Mischen.
   - Beides kommt schrittweise: zuerst reine Fix-Level, ab etwa Level 15 der Shaker,
     später Level mit drei Farben und mit begrenzten Zügen.
2. **Farbenblind-Modus ab Tag 1.** Jede Farbe trägt ein eigenes Symbol, passend zum
   Thema (Zitrone, Beere, Minze …).
3. **Tagesrätsel + Teilen.** Ein Level pro Tag, für alle gleich, erzeugt aus dem Datum.
   Das Ergebnis lässt sich als Emoji-Raster teilen („🍹 FixTheMix #12 · 23 Züge ⭐⭐⭐").
   Dazu eine Serie (Streak) und eine Tagesbestenliste nach Zügen.
4. **Sterne nach Zügen, gemessen am Optimum.** Der Löser kennt die kürzeste Lösung;
   3 Sterne gibt es nur für das Optimum.
5. **Fairness:**
   - keine Werbung mitten im Level;
   - höchstens ein Interstitial zwischen zwei Leveln, mit Bremse;
   - Werbevideos nur freiwillig (Extra-Glas, Tipp);
   - „Werbung entfernen" als einmaliger Kauf.
6. **Spielgefühl:** Gieß-Animation, Haptik beim Einrasten, dezente Bar-Geräusche.
7. **Version 1.1: Duelle.** Beide lösen dasselbe Level, weniger Züge gewinnt.

## Technik

Der Stack ist derselbe wie bei Anigosha: React + Vite + TypeScript, Tailwind v4,
Capacitor (iOS + Android), Supabase. Die folgenden Bausteine werden **aus
`almaz6380/anigosha` kopiert und angepasst**, nicht neu erfunden:

| Baustein | Vorlage in anigosha |
|---|---|
| Projektaufbau | `package.json`, `vite.config.ts`, `capacitor.config.ts` |
| Werbung mit Bremse, UMP, ATT nativ | `src/lib/ads.ts`, `ios/App/App/AppDelegate.swift` (`frageNachTracking`) |
| „Werbung entfernen" (RevenueCat) | `src/lib/purchases.ts`. **Thenable-Falle:** Plugin-Proxies nie `await`en und nie aus einer async-Funktion zurückgeben |
| Sprachweiche | `src/i18n/index.ts` (`appSprache`) |
| Tagesrätsel + Bestenliste | Migration `0016`, `daily_leaderboard` in der sortierten Fassung aus `0064` |
| Duelle (1.1) | Migrationen `0017`, `0021`, `0064` (offene Partie, Bots, Ablauf) |
| Rechte-Muster | `0064`: alles entziehen, nur die Client-RPCs für `authenticated` freigeben |
| Release auf Josefs Mac | `.github/workflows/{ios,android}-release.yml` mit der Eingabe `laeufer`, `docs/release-ci.md` |
| Rechtstexte | `src/pages/legal/legalContent.ts` |

**Die Engine — `src/engine/`** (steht seit 25.09.2026):

| Datei | Inhalt |
|---|---|
| `typen.ts` | Nur Typen. `Spielstand`, `Zug`, `Level`, `Schwierigkeit`, Ergebnisse. |
| `farben.ts` | Die neun Farben, die **Mischtabelle als Daten** (kein `if` in der Logik), Symbol fürs Farbenblind-Modus, Emoji fürs Teilen. |
| `zufall.ts` | mulberry32 + fmix32 + getrennte Streams. Nur 32-Bit-Ganzzahlrechnung. |
| `zustand.ts` | Aufbau, Klonen, Packen, **kanonischer Schlüssel**, Siegbedingung, Textausgabe. |
| `zuege.ts` | Die Regeln: `pour`, `shake`, `legaleZuege`. Sonst nichts. |
| `verlauf.ts` | `Partie` — Zugprotokoll, Undo-Stapel, Sterne, Tipp. Schnittstelle für Phase 2. |
| `loeser.ts` | `solve()` (A*), `schuettelBedarf()`, `heuristik()`, `loesbar()`, `hint()`. |
| `generator.ts` | `generate(seed, stufe)`, die sieben `STUFEN`, Sternschwellen. |
| `wiedergabe.ts` | `replay()` / `replayAusSeed()` — Vorstufe des Schummelschutzes. |
| `index.ts` | Öffentliche Schnittstelle. |

Drei Entwurfsentscheidungen, die man kennen muss, bevor man hier etwas ändert:

1. **Der Spielstand ist ein flaches `Uint8Array`, kein Array von Arrays**, und Gläser und
   Shaker teilen sich einen Indexraum. Der Löser besucht sechsstellige Knotenzahlen;
   verschachtelte Arrays kosten dort je Knoten eine Handvoll Allokationen.
2. **Kanonisierung nur als Hash-Schlüssel, nie als Zustand.** Gläser sind untereinander
   vertauschbar, Shaker ebenso — für den Besucht-Speicher werden die gepackten Wörter
   deshalb sortiert, **Gläser nur mit Gläsern, Shaker nur mit Shakern**. Der Zustand
   selbst behält seine Reihenfolge, sonst zeigten die zurückgegebenen Züge auf die
   falschen Behälter und der Tipp wäre Unsinn.
3. **Die Heuristik muss zulässig sein**, weil drei Sterne am echten Optimum hängen.
   Sie teilt die Züge in drei **disjunkte** Klassen und darf deshalb addieren:
   `h = max(Phi, Streuung) + 2*X + Mischshaker`. Dabei ist `X` die kleinste Zahl
   Schüttelvorgänge, mit der die Farbbilanz überhaupt aufgeht — und `X = unendlich` ist
   zugleich der billigste Unlösbarkeitsbeweis, den wir haben.
   *Erster Anlauf war `max(Phi, X)`: sicher, aber so schwach, dass ein Shaker-Level über
   40.000 Knoten brauchte. Nach der Verschärfung sind es 5.200.*

**Der Generator spielt RÜCKWÄRTS**, vom gelösten Brett aus. Damit ist jedes Level per
Konstruktion lösbar, und die Länge des Rückwegs ist eine gültige obere Schranke für A*.
*Verworfen: vorwärts zufällig befüllen und verwerfen lassen* — das kostet den vollen
Löserlauf für jedes abgelehnte Brett und gibt keinen Hebel darauf, den Shaker wirklich
zu erzwingen.

Zwei Fallen, die dabei schon Zeit gekostet haben:

- Beim Rückwärtsgießen darf ein **ganzer** Lauf nur dann zurückwandern, wenn die Quelle
  dabei **leer** wird — sonst wäre der Vorwärtszug gar nicht erlaubt. Ohne diese
  Bedingung blieben nur Züge übrig, die ein volles einfarbiges Glas in ein leeres
  schieben; das Brett blieb gelöst und `generate` fand nie ein Level. Für einen **Shaker**
  als Quelle gilt sie nicht — dort entscheiden Kontingent und Mischpaar.
- Die rückwärts ausgebauten **Mischpaare dürfen sich wiederholen**. Zieht man alle drei
  verschiedenen Paare, bekommt jede Grundfarbe genau `hoehe` dazu, die Bilanz geht ohne
  einen einzigen Schüttelzug auf, und das Level wäre ohne Shaker lösbar.

**Gemessene Grenze (25.09.2026):** Der Engpass ist nicht das Spielen, sondern der
**Beweis** der Optimalität. Reine Fix-Level bis 12 Gläser kosten ~100 ms, bis 14 Gläser
~1,4 s. Mit einem Shaker und zwei Mischungen sind 9 Gläser bei ~800 ms machbar. **Zwei**
Shaker sprengen das Budget (5 von 6 Anläufen). Die sieben Stufen sind darauf zugeschnitten.
Größere Level sind möglich — der Generator läuft ohnehin im Voraus, nicht auf dem Gerät;
dann `maxMs`/`versuche` hoch und einmal über Nacht.

**Portabilität nach Deno:** Jede Datei in `src/engine/` importiert ihre Nachbarn **mit
ausgeschriebener `.ts`-Endung** (`from './zustand.ts'`). Deno verlangt das, Vite und `tsc`
erlauben es über `allowImportingTsExtensions`. Damit lässt sich der Ordner unverändert in
eine Edge Function kopieren. Deshalb gilt hier drinnen: keine Abhängigkeiten, kein React,
kein `window`, kein `localStorage`, kein `Math.random`, kein `Date.now` — die einzige Uhr
ist das einspeisbare `jetzt` im Löserbudget.
- **Schummelschutz für die Bestenliste:** Der Client schickt die Zugfolge, eine Edge
  Function spielt sie mit derselben Engine nach (geteilter Code) und wertet erst dann.
  Dasselbe Prinzip wie „XP nur serverseitig" bei Anigosha.
- **Darstellung:** das Spielfeld als SVG, dazu die Symbole für den Farbenblind-Modus.

## Phasen

1. ~~**Engine, Löser, Generator und Tests.** Noch ganz ohne Oberfläche.~~ **FERTIG (25.09.2026)**
2. **Spielbildschirm:** ← **hier geht es weiter**
   - Bar-Look, Gieß-Animation, Haptik
   - Undo, Neustart, Tipp, Extra-Glas
   - Farbenblind-Modus
3. **Levelfolge:** zuerst Fix-Level, dann der Shaker, Sterne nach Zügen.
4. **Tagesrätsel:** Teilen, Serie, Bestenliste. Dazu eine Supabase-Migration und die
   Edge Function für die Prüfung.
5. **Werbung, Kauf, Rechtstexte, Sprachen.** Zuerst DE und EN, danach ES/FR/PT.
6. **Stores:** Capacitor für iOS und Android, Release-Workflows mit `laeufer`, ein
   Runner auf Josefs Mac, die Store-Einträge.
7. **Version 1.1: Duelle.**

## Prüfung

- **Testskripte** (alle grün zu halten). `npm test` fährt alle vier nacheinander,
  Gesamtlaufzeit rund 70 Sekunden. Einzeln über `npx tsx tools/test-x.mts`; **Node 22 kann
  `.mts` auch direkt** (`node tools/test-x.mts`), und das ist für den 1.000er-Lauf
  spürbar schneller.
  - `test-engine.mts` (57) — Mischtabelle, beide Gießregeln, Shaker-Kontingent,
    Schütteln, Siegbedingung, Packen und Kanonisierung. Darunter die Zusicherung, auf der
    der ganze Entwurf ruht: **ein voller Shaker enthält immer genau zwei Farben zu je
    `hoehe/2`**, erschöpfend nachgeprüft.
  - `test-loeser.mts` (26) — das wichtigste Skript. Vergleicht A* auf 378 Zufallsbrettern
    gegen eine **unabhängige Breitensuche** und prüft, dass die Heuristik nie überschätzt
    und konsistent ist. Eine zu hohe Heuristik fällt sonst nirgends auf — sie erzeugt
    keinen Absturz, sondern falsche Sternschwellen.
  - `test-generator.mts` (17) — **1.000 Level** über alle Stufen: jedes lösbar, jedes
    Optimum im Band, Mischbedarf erzwungen, Shaker starten leer, Flüssigkeitsmenge
    stimmt, JSON-Rundlauf hält. Dazu Determinismus samt **fester Seed-Tabelle** — das ist
    der eigentliche Regressionsschutz: eine Änderung, die die Seed-zu-Level-Abbildung
    verschiebt, entwertet jede gespeicherte Wiedergabe und jeden Bestenlisteneintrag.
  - `test-wiedergabe.mts` (44) — Undo-Stapel und Wiedergabe. Darunter der Fall, den ein
    naiver Undo falsch macht: **nach dem Schütteln muss die genaue Schichtung
    zurückkommen**, nicht nur „zwei Rot, zwei Gelb" — deshalb sichert der Schüttelschritt
    als einziger die Zellen des Shakers mit.
- **Handprobe:** `node tools/zeige-level.mts --stufe 5 --seed 7 --loesung` druckt ein
  Level und seine kürzeste Lösung als Emoji-Raster. Die Tests sagen nur, ob ein Level
  lösbar ist; ob es sich **gut anfühlt**, sieht man nur so — und vor Phase 2 gibt es
  keine Oberfläche.
- **Schummelschutz:** Die Edge Function lehnt manipulierte Zugfolgen ab.
- **Farbenblind-Modus:** ein Screenshot in Graustufen. Jede Farbe muss am Symbol zu
  erkennen sein.
- **Am Gerät:** Werbung nur mit Test-IDs. **Nie echte eigene Anzeigen antippen** — am
  AdMob-Konto hängen alle Apps.

## Regeln (wie in allen Repos)

- Kein Commit, Deploy oder Build ohne ausdrückliches „ja" von Josef. Vor jedem Build
  in drei Zeilen zusammenfassen: was passiert, welche Version, wohin es geht.
- Schlüssel gehören nie ins Repo und nie in den Chat.
- Mobile-first, alle Texte über i18n, mit korrekten Umlauten.
- Josef arbeitet meist vom Handy: Ergebnisse direkt im Chat zeigen (`SendUserFile`).
