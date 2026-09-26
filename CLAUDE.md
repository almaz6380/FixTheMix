# CLAUDE.md — FixTheMix

## Projektübersicht

Sortierpuzzle mit Gläsern („Water Sort"-Genre) für App Store und Google Play.
Das Genre ist übervoll. Ziel ist deshalb, sich **optisch, bei der Fairness und bei der
Sauberkeit der Level** abzuheben, statt die hundertste Kopie zu werden. (Bis zum
25.09.2026 sollte das Mischen der mechanische Unterschied sein — siehe „Kein Shaker".)

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

- **Besonderheiten:** Farbenblind-Modus, Tagesrätsel mit Teilen, Duelle (Duelle erst in
  Version 1.1). *Das Mischen war bis zum 25.09.2026 die erste Besonderheit — siehe die
  Entscheidung „Shaker raus" unten.*
- **Thema:** eine Bar mit Gläsern und Gästen, **alkoholfrei**. Saft-, Smoothie-
  und Mocktail-Bar mit Früchten und Sirupen. Alkohol würde die Altersfreigabe heben
  (Apple „Alkohol-Bezüge", IARC) und jüngere Spieler ausschließen.
- **Werbung:** fair.

### Spielregeln (entschieden am 25.09.2026, beim Bau der Engine)

- **Kein Shaker. Reines Sortieren.** Am 25.09.2026 hat Josef den Shaker **komplett**
  gestrichen: keine Mischfarben, keine Mischtabelle, kein Schüttelzug. Es gibt nur noch
  einen Zug — Gießen.
  *Was das kostet, steht hier ehrlich:* Das Mischen war die Besonderheit, die FixTheMix
  von den anderen Sortierspielen unterschied, und es erklärte die Hälfte des Namens.
  Josef hat das gewusst und sich trotzdem dafür entschieden. Wer das zurückdreht, kann
  im Verlauf `git log -- src/engine/` nachsehen: Mischtabelle, `schuetteln()`,
  `schuettelBedarf()` und die Shaker-Heuristik sind dort vollständig erhalten.
  *Was es bringt:* Die Regeln passen in einen Satz, der Löser ist rund achtmal
  schlanker (5.200 → ~700 Knoten je Level), und der Einstieg braucht keine Erklärung.
- **Gießen hat genau eine Regel.** Der oberste zusammenhängende Block gleicher Farbe
  wandert so weit, wie ins Ziel passt. Das Ziel muss leer sein oder oben **dieselbe**
  Farbe tragen. Genre-Standard, keine Ausnahme.
- **Siegbedingung:** klassisch sortenrein. Jedes Glas ist leer oder randvoll einfarbig.
  Halbvolle einfarbige Gläser zählen nicht.
- **Sechs Schichten je Glas** (vorher vier). Ein Glas ist damit sichtbar ein Glas und
  nicht ein Stapel Bauklötze; die Level werden dichter, ohne dass mehr Gläser aufs
  Display müssen.
- **999 Level, der Reihe nach freigeschaltet** (Josef, 26.09.2026). Gelöste Level plus
  das nächste sind offen, der Rest ist gesperrt. Die Levelwahl zeigt Abschnitte
  („Level 621–640") statt eines Rasters mit 999 Kacheln.
- **Sackgassen bleiben möglich, und das Spiel sagt es jetzt** (Josef, 26.09.2026).
  Wer sich festfährt, kann **einen Zug gegen Münzen zurückkaufen**; der Neustart ist
  immer gratis.
- **Der Tipp kostet Münzen.** Er verrät nicht irgendeinen Zug, sondern den ersten Zug
  der beweisbar kürzesten Lösung — gratis und unbegrenzt war er eine Lösungsmaschine,
  und damit war jede Arbeit an der Schwierigkeit umsonst.
- **Münzen kommen aus Sternen und (ab Phase 5) aus freiwilligen Werbevideos.**
- **Ein paar Experten-Level mit hohen Gläsern:** jedes 25. Level ab 225 hat 7 oder 8
  Schichten. Sechs bleiben die Regel — die hohen Gläser sind das einzige Mittel, über
  die Decke von rund 26 Zügen zu kommen.
- **Farbsystem:** neun Farben, alle gleichberechtigt, keine Kategorien mehr —
  Erdbeere, Zitrone, Blaubeere, Orange, Apfel, Traube, Minze, Kokos, Kaffee. Jede trägt
  ein eigenes **gezeichnetes** Zeichen für den Farbenblind-Modus (vorher Emoji, die auf
  jedem Gerät anders aussehen und in Graustufen kaum zu trennen sind).

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
- [x] `src/engine/` vollständig, **171 Zusicherungen in sechs Testskripten, alle grün**
- [x] Löser findet das **bewiesene** Optimum; auf 477 Zufallsbrettern gegen eine
      unabhängige Breitensuche nachgemessen, keine einzige Abweichung — und keine
      Verletzung von Zulässigkeit oder Konsistenz
- [x] Generator: 1.000 Level über alle sechs Stufen, jedes lösbar, jedes Optimum im Band
      (Gesamtlauf 148 s)
- [x] Wiedergabe (Vorstufe des Schummelschutzes) lehnt manipulierte Zugfolgen mit
      benanntem Grund und Fehlerindex ab
- [x] **Shaker am 25.09.2026 wieder ausgebaut** — Engine, Löser, Generator, Oberfläche
      und Tests tragen keine Spur mehr davon

### M3 Spielbildschirm — GRÖSSTENTEILS FERTIG (25.09.2026)
- [x] Bar-Look, Gläser skalieren mit der Spaltenbreite
- [x] Antippen = wählen, nochmal antippen = gießen. Bewusst kein Ziehen: mit dem
      Daumen über ein halbes Display zu ziehen ist unangenehm, und ein abgebrochener
      Zug ist schwer zu erkennen.
- [x] Der gewählte Lauf hebt sich um 6 px an — man sieht **vor** dem Gießen, was fließen
      würde. Ein Zug ohne diese Vorschau fühlt sich wie Raten an.
- [x] Undo, Neustart, Tipp (Löser mit knappem Budget), Sterne live in der Kopfzeile
- [x] Farbenblind-Modus mit Symbol auf jeder Schicht, Abnahme über einen
      Graustufen-Screenshot
- [x] Haptik über `navigator.vibrate` (Android-Browser; iOS ignoriert es still, in der
      Store-App übernimmt das später Capacitor Haptics)
- [x] Fortschritt und Einstellungen in `localStorage`, jeder Zugriff eingepackt
- [x] 999 vorgebaute Level (`tools/level-bauen.mts` → `src/levels/folge.json`) mit
      Levelwahl in Abschnitten
- [ ] **Extra-Glas** — hängt an der Werbung und kommt mit Phase 5
- [ ] Die Gieß-Animation ist bisher ein Kippen der Quelle plus weiches Einrasten der
      Schichten, noch kein fließender Strahl
- [ ] Bar-Geräusche

### M4 Aussehen — FERTIG (25.09.2026)
- [x] **Nachtblau mit Fischschuppen** als Grund (`repeating-radial-gradient`, 46 px),
      dazu ein warmer Schein von oben. Josefs Wahl aus acht vorgelegten Mustern.
- [x] **Gläser mit rundem Boden** (Reagenzglas-Form, Radien in Prozent, damit die Form
      bei jeder Breite gleich bleibt). Josefs Wahl aus vier Varianten.
      *Der erste Entwurf wurde verworfen — Zitat: „zu ernst, kein Spiel". Beanstandet
      waren die Gläser und der Gesamteindruck, ausdrücklich **nicht** die Farben.*
- [x] Jede Schicht trägt eine helle Kuppe an der Oberkante (`radial-gradient` im
      Hintergrund der Schicht, kostet kein zusätzliches Element). Das ist der Unterschied
      zwischen einem Farbstreifen und Flüssigkeit.
- [x] Eine Lichtquelle für die ganze Bar: Zylinderlicht, Randellipse, Standschatten.
      Ohne den Schatten schwebt jedes Glas, egal wie gut der Rest gezeichnet ist.
- [x] Schriften **Fredoka** (Anzeige) und **Nunito** (Text), als `.woff2` **im Repo**
      unter `public/fonts/`. Kein Google-Host: die Store-App läuft offline, und der
      Oberflächentest zählt Konsolenfehler. Nachladen mit `node tools/fonts-holen.mjs`.
- [x] Gezeichnete SVG-Zeichen statt Emoji (`src/components/Symbole.tsx`). Jede Farbe
      bekommt einen **anderen Umriss**, damit sie auch ohne Farbe erkennbar bleibt.
      Kaffee ist die einzige Farbe mit hellem Zeichen — dunkel darauf sind nur 2,2:1.
- [x] `@media (prefers-reduced-motion: reduce)` schaltet die Bewegungen ab

### M5 Levelfolge — FERTIG (26.09.2026)
- [x] **Die Kurve ist eine Funktion** (`src/engine/kurve.ts`), keine Liste mehr. Vorher
      standen 20 Stufenindizes von Hand in `tools/level-bauen.mts` — und mit ihnen die
      Schwierigkeitskurve an der falschen Stelle.
- [x] **999 Level**, alle mit bewiesenem Optimum, in `src/levels/folge.json`
- [x] Aufstieg über die ersten 185 Level in zehn Abschnitten, danach eine Rotation über
      zwölf Aufbauten. Der Boden (`zuegeMin`) wächst und fällt nie zurück — damit ist
      der Fehler der alten Folge behoben, in der Level 20 leichter war als Level 10.
- [x] Freischaltung der Reihe nach, entschieden an **einer** Stelle
      (`istFrei()` in `src/lib/fortschritt.ts`)
- [x] Levelwahl in Abschnitten von 20 mit Sternebilanz; nie mehr als 20 Kacheln im DOM
- [x] Abschluss statt Sackgasse: beim letzten Level führte der Hauptknopf vorher als
      abgeschalteter Knopf mit der Aufschrift „Ende" ins Nichts
- [x] `tools/test-folge.mts` prüft die **ausgelieferte Datei** gegen die Kurve
- [ ] Die Rotation ab Level 186 variiert die Form, nicht die Schwierigkeit — mehr geht
      bei sechs Schichten nicht, siehe „Die Decke" unten

### M6 Härte — FERTIG (26.09.2026)
- [x] **`festgefahren()`** in `src/engine/loeser.ts`: erkennt ein totes Brett. Nur
      `solve()`-Status `unloesbar` zählt — `budget` heißt „weiß nicht", und ein falscher
      Alarm triebe den Spieler in einen Neustart, der nicht nötig war.
- [x] Fenster „Festgefahren" mit **Rückkauf gegen Münzen** (je Rückkauf ein Zug) und
      kostenlosem Neustart
- [x] **`src/lib/muenzen.ts`**: Startguthaben 100, Tipp 15, Rückkauf 10, Lohn nach
      Sternen 5/12/25 — und **nur die Verbesserung** wird gezahlt
- [x] Münz-Chip in der Kopfzeile, Preis auf dem Tipp-Knopf
- [x] 31 Experten-Level mit 7 oder 8 Schichten, Optima 24–30 (statt 20–27)
- [x] Der Tipp schweigt nicht mehr, wenn er nichts findet: entweder „festgefahren"
      (bewiesen) oder eine Meldung
- [ ] Das **Werbevideo** für Münzen kommt mit Phase 5 (`src/lib/ads.ts` gibt es noch
      nicht). Der Haken dafür steht kommentiert in `muenzen.ts`.

## Was FixTheMix einzigartig macht

1. **Eine Regel, sechs Schichten, kein Tutorial.** Gegossen wird nur auf dieselbe Farbe
   oder ins Leere. Die Schwierigkeit kommt aus dem Brett, nicht aus Sonderregeln: der
   stärkste Regler ist die Zahl der **leeren** Gläser — eines weniger wiegt schwerer als
   zwei Farben mehr.
   *Der Shaker (zwei Grundfarben hinein, schütteln, Mischfarbe heraus) war bis zum
   25.09.2026 der Punkt, der den Namen erklärte. Er ist auf Josefs Entscheidung
   ausgebaut; die Begründung steht oben bei den Spielregeln.*
2. **Farbenblind-Modus ab Tag 1.** Jede Farbe trägt ein eigenes Symbol, passend zum
   Thema (Zitrone, Beere, Minze …).
3. **Tagesrätsel + Teilen.** Ein Level pro Tag, für alle gleich, erzeugt aus dem Datum.
   Das Ergebnis lässt sich als Emoji-Raster teilen („🍹 FixTheMix #12 · 23 Züge ⭐⭐⭐").
   Dazu eine Serie (Streak) und eine Tagesbestenliste nach Zügen.
4. **Sterne nach Zügen, gemessen am Optimum.** Der Löser kennt die kürzeste Lösung;
   3 Sterne gibt es nur für das Optimum. Bei allen 999 Leveln ist dieses Optimum
   **bewiesen**, nicht geschätzt — das ist der Unterschied zu den meisten Mitbewerbern,
   deren Sternschwellen geraten sind.
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
| `farben.ts` | Die neun Farben: Ton und Aufhellung für die Oberfläche, Symbolname fürs Farbenblind-Modus, Emoji fürs Teilen. Keine Kategorien, keine Mischtabelle mehr. |
| `zufall.ts` | mulberry32 + fmix32 + getrennte Streams. Nur 32-Bit-Ganzzahlrechnung. |
| `zustand.ts` | Aufbau, Klonen, Packen, **kanonischer Schlüssel**, Siegbedingung, Textausgabe. |
| `zuege.ts` | Die eine Regel: `pour`, `giessenZurueck`, `legaleZuege`. Sonst nichts. |
| `verlauf.ts` | `Partie` — Zugprotokoll, Undo-Stapel, Sterne, Tipp. Schnittstelle für Phase 2. |
| `loeser.ts` | `solve()` (A*), `heuristik()`, `bilanzStimmt()`, `loesbar()`, `hint()`, `festgefahren()`. |
| `generator.ts` | `generate(seed, stufe)`, die sechs `STUFEN`, Sternschwellen. |
| `kurve.ts` | Die ausgelieferte Levelfolge: `ANZAHL_LEVEL`, `stufeFuer(nr)`, `seedFuer(nr)`, `ABSCHNITTE`, `blockFuer(nr)`, `istExperte(nr)`. |
| `wiedergabe.ts` | `replay()` / `replayAusSeed()` — Vorstufe des Schummelschutzes. |
| `index.ts` | Öffentliche Schnittstelle. |

Darüber liegt die Oberfläche: `src/App.tsx` (Spielbildschirm), `src/components/`
(`Brett`, `Glas`, `Symbole`, `Levelwahl`), `src/lib/fortschritt.ts` (localStorage,
Haptik, **Freischaltung**).
**Die Sperre hat genau eine Quelle:** `istFrei()` in `fortschritt.ts`. Die Levelwahl
zeichnet sie (`disabled` plus Schloss), `wechsle()` in `App.tsx` prüft sie ein zweites
Mal — eine Regel, die nur an einem `disabled` in der Anzeige hängt, ist keine Regel.
**Fortschritt ist Format v2** (`fixthemix.fortschritt.v2`): `folgeVersion`, `sterne`,
`zuletzt`, `hoechstes`. Das neue `folgeVersion` ist der Grund für den Bruch — v1 legte
Sterne unter dem Levelindex ab, ohne festzuhalten, zu welcher Folge dieser Index gehört.
Als die Folge von 20 auf 999 Level wuchs, hieß derselbe Index ein anderes Brett. Passt
`folgeVersion` nicht, wird der Stand **verworfen statt umgedeutet**; der alte v1-Stand
ist damit weg, und das ist richtig so.
**Die `Partie` liegt im State, nicht in einem Ref** — aus einem Ref während des
Renderns zu lesen ist genau der Weg, auf dem Anzeige und Wahrheit auseinanderlaufen.
Weil die Engine ihre Zustände an Ort und Stelle ändert, steht hinter jedem gelungenen
Zug ein `neuZeichnen()`; `useCallback` ist in `App.tsx` bewusst nirgends im Einsatz, da
alle Handler an genau diesem veränderlichen Objekt hängen.

Drei Entwurfsentscheidungen, die man kennen muss, bevor man hier etwas ändert:

1. **Der Spielstand ist ein flaches `Uint8Array`, kein Array von Arrays.** Der Löser
   besucht sechsstellige Knotenzahlen; verschachtelte Arrays kosten dort je Knoten eine
   Handvoll Allokationen. Dazu ein `fuell`-Zwischenspeicher, damit der Füllstand nicht
   bei jedem Zugriff gezählt werden muss.
2. **Kanonisierung nur als Hash-Schlüssel, nie als Zustand.** Gläser sind untereinander
   vertauschbar — für den Besucht-Speicher werden die gepackten Wörter deshalb sortiert
   (4 Bit je Schicht, ein uint32 je Glas, daher das Maximum von 8 Schichten). Der
   Zustand selbst behält seine Reihenfolge, sonst zeigten die zurückgegebenen Züge auf
   die falschen Gläser und der Tipp wäre Unsinn.
3. **Die Heuristik muss zulässig sein**, weil drei Sterne am echten Optimum hängen.
   Es sind zwei untere Schranken, und genommen wird das **Maximum**, nicht die Summe —
   beide zählen dieselben Züge, addiert wäre die Schranke nicht mehr zulässig:
   `h = max(Segmentsumme, Streuung)`.
   - *Segmentsumme:* Zahl der zusammenhängenden Blöcke minus Zahl der Farben. Ein
     Gießzug senkt sie um höchstens 1.
   - *Streuung:* für jede Farbe die Zahl der Gläser, in denen sie liegt, minus die Zahl
     der Gläser, die sie am Ende braucht. Fasst Farben, die über viele Gläser verteilt
     sind, schärfer als die Segmentsumme.
   Dazu `bilanzStimmt()` als billiger Unlösbarkeitsbeweis: geht die Menge einer Farbe
   nicht ohne Rest durch `hoehe` auf, kann das Brett nie sortenrein werden. Das kostet
   einen Durchlauf und spart eine ganze Suche.

**Der Generator spielt RÜCKWÄRTS**, vom gelösten Brett aus. Damit ist jedes Level per
Konstruktion lösbar, und die Länge des Rückwegs ist eine gültige obere Schranke für A*
(`schranke`) — der größte einzelne Geschwindigkeitsgewinn im ganzen Generator.
*Verworfen: vorwärts zufällig befüllen und verwerfen lassen* — das kostet den vollen
Löserlauf für jedes abgelehnte Brett, und die Ablehnungsquote steigt genau dort steil an,
wo die Level interessant werden (wenige leere Gläser).

Zwei Fallen, die dabei schon Zeit gekostet haben:

- Beim Rückwärtsgießen darf ein **ganzer** Lauf nur dann zurückwandern, wenn die Quelle
  dabei **leer** wird — sonst wäre der Vorwärtszug gar nicht erlaubt. Ohne diese
  Bedingung blieben nur Züge übrig, die ein volles einfarbiges Glas in ein leeres
  schieben; das Brett blieb gelöst und `generate` fand nie ein Level.
- **Der Löser darf im Generator keinen Zeitdeckel haben.** `generate` läuft mit
  `maxMs: 0`; die Schranke ist allein `maxKnoten`. Ein Zeitdeckel macht das Ergebnis von
  der Tagesform der Maschine abhängig: derselbe Seed liefert dann mal das eine, mal das
  andere Level. Genau das hat `test-generator.mts` gefangen — „gleicher Seed ergibt
  bitgenau dasselbe Level" schlug mit einer Abweichung fehl. Eine Zählschranke ist
  reproduzierbar, eine Uhr nie.

**Gemessene Grenze (25.09.2026, ohne Shaker):** Der Engpass ist nicht das Spielen,
sondern der **Beweis** der Optimalität — den braucht es, weil drei Sterne am echten
Optimum hängen. Bei sechs Schichten je Glas kosten 5–6 Gläser unter 1 ms, 8 Gläser
~45 ms, 10 Gläser ~310 ms, 12 Gläser ~1,9 s und 14 Gläser ~5,7 s je Level. Der
1.000er-Lauf über alle sechs Stufen braucht rund **148 s**. Die Stufen sind darauf
zugeschnitten. Größere Level sind möglich — der Generator läuft ohnehin im Voraus, nicht
auf dem Gerät; dann `maxKnoten`/`versuche` hoch und einmal über Nacht.

### Das Levelformat — `version: 3`

999 Level wären im alten Format rund **700 KB** (gemessen: 487 Bytes je Level). Mit
`start` als **Ziffernkette** statt Zahlenliste sind es 174 Bytes je Level. Möglich ist
das, weil es genau zehn Farbcodes gibt — `0` ist die leere Schicht, `1`–`9` die neun
Farben, also ist eine Schicht genau eine Ziffer. `standAusLevel()` und `startAusStand()`
in `zustand.ts` sind der einzige Ein- und Ausgang; sonst ändert sich nichts.
Die Versionen: 1 hatte Shaker, 2 hatte `start` als Zahlenliste, 3 hat die Ziffernkette.
Es gibt **kein** „akzeptiert beides".

### Zwei Leitern — und warum das kein Versehen ist

- **`STUFEN` in `generator.ts`** ist die grobe Leiter für Tests und Handproben
  (`test-generator.mts` mit seiner goldenen Seed-Tabelle, `zeige-level.mts --stufe`).
  Dort **steigt `leer` mit der Stufe** (2 → 3 → 4). Das ist ein Überbleibsel aus der
  Shaker-Zeit und für die Spieler bedeutungslos, weil die ausgelieferte Folge nicht von
  hier kommt. Ein Umbau würde die goldene Tabelle entwerten, ohne dass ein Spieler etwas
  davon merkt — deshalb bleibt sie, wie sie ist.
- **`kurve.ts`** ist die ausgelieferte Folge. Sie macht es richtig: `leer` **sinkt**,
  wenn es schwerer werden soll.

### Die Decke — gemessen am 26.09.2026

| Aufbau (Gläser/Farben/leer, schritte) | Kosten je Level | erreichte Optima |
|---|---|---|
| 8 / 5 / **leer 2**, 18 | 68 ms | 12–17 |
| 8 / 5 / **leer 1**, 18 | **12 ms** | 11–17 |
| 10 / 6 / **leer 2**, 20 | 393 ms | 18–19 |
| 10 / 6 / **leer 1**, 20 | **39 ms** | 18–20 |
| 14 / 8 / leer 1, **24** | **109 ms** | 20–24 |
| 14 / 8 / leer 1, **30** | 1849 ms | 25–27 |
| 14 / 8 / leer 1, **60** | 1739 ms | **25–27 (unverändert)** |
| 14 / 8 / **leer 2**, 24 | 5129 ms | 24 |
| 13 / 9 / **leer 2**, 24 | **275 ms** | 23–24 |

Drei Befunde, die den Entwurf der Kurve bestimmen:

1. **Ein leeres Glas weniger macht das Erzeugen fünf- bis zehnmal BILLIGER.** Weniger
   leere Gläser heißt weniger legale Züge heißt ein schmalerer Suchbaum. Der stärkste
   Schwierigkeitsregler ist also auch der günstigste — deshalb steigt die Kurve unten
   über `leer` und nicht über die Gläserzahl.
2. **Mehr `schritte` bringen ab etwa 30 nichts.** Bei 45 und 60 Schritten kommen
   bitgenau dieselben Optima heraus wie bei 30: das Rückwärtsspiel sättigt. Und der Weg
   von 24 auf 30 kostet das 17-fache für drei Züge. In der Rotation steht `schritte: 30`
   deshalb genau einmal.
3. **Viele Farben sind billiger als viel Luft.** 13 Gläser mit 9 Farben und `leer: 2`
   kosten 275 ms, 14 Gläser mit 8 Farben und `leer: 2` kosten 5,1 s — bei praktisch
   gleichem Optimum. Die beiden „luftigen" Aufbauten der Rotation sind darum die
   farbreichen.

**Die Decke:** Bei sechs Schichten und höchstens 14 Gläsern (mehr passt nicht aufs
Handy — `Brett.tsx` deckelt auf fünf Spalten je Reihe) liegt das härteste bezahlbare
Level bei **rund 26 Zügen**. Die Folge kann also bis Level 185 wirklich steigen; danach
kommt die Abwechslung aus der **Form** des Bretts, nicht aus mehr Schwierigkeit. Das
steht hier so deutlich, weil die Versuchung groß ist, 800 Level als „immer schwerer" zu
verkaufen. Der einzige Hebel, der die Decke heben würde, sind **sieben oder acht
Schichten** (`MAX_HOEHE` ist 8, wegen 4 Bit je Schicht) — und sechs sind Josefs
Entscheidung vom 25.09.2026.

### Sackgassen — und warum sie bleiben

Im Genre kann man sich festfahren: wer eine einzelne Schicht in sein letztes leeres Glas
gießt, verbaut sich den Weg. **Gemessen am 26.09.2026** (zwölf zufällige Züge, 40 Läufe
je Level): Level 10 endet in 3 % der Fälle unrettbar, Level 300 in 28 %, Level 700 in
**40 %**. Auf Level 301 genügten im Test **zwei** Züge — unabhängig mit einer
Breitensuche nachgeprüft, die vom toten Brett aus nur noch zwei erreichbare Zustände
fand.

`festgefahren()` in `loeser.ts` erkennt das. Zwei Regeln sind dort nicht verhandelbar:

1. **Nur `unloesbar` zählt.** `budget` heißt „weiß nicht". Ein falscher Alarm wäre
   schlimmer als gar keiner — er triebe den Spieler in einen Neustart, der nicht nötig
   war. `loesbar()` ist dafür ebenfalls untauglich (sein `false` heißt „nicht gefunden").
   `test-loeser.mts` sichert genau das ab: mit drei Knoten Budget gibt der Löser auf, und
   `festgefahren()` meldet **trotzdem** keine Sackgasse.
2. **Kein Zeitdeckel, nur ein Knotendeckel.** Eine Uhr hat die Engine nicht (außer dem
   einspeisbaren `jetzt`), und eine Zählschranke ist reproduzierbar — dieselbe Lehre wie
   beim Generator.

Billig ist es trotzdem: ein totes Brett hat kaum Suchraum, gemessen 1–2 ms im Schnitt,
10 ms im schlimmsten Fall. Geprüft wird nach jedem Zug, im `setTimeout`-Muster des Tipps
(erst zeichnen, dann rechnen).

### Die Münzen — `src/lib/muenzen.ts`

| Posten | Wert |
|---|---|
| Startguthaben | 100 |
| Tipp | 15 |
| Ein Zug zurück aus der Sackgasse | 10 |
| Lohn für 1 / 2 / 3 Sterne | 5 / 12 / 25 |

Vier Entscheidungen, die man kennen muss:

1. **Gezahlt wird nur die VERBESSERUNG.** Ohne das wäre ein einmal gelöstes leichtes
   Level eine Münzquelle zum Wiederholen. Wer sich von einem auf drei Sterne verbessert,
   bekommt die Differenz.
2. **Eigener Speicherschlüssel `fixthemix.muenzen.v1`, nicht im Fortschritt.**
   `ladeFortschritt()` verwirft den gesamten Stand, sobald `folgeVersion` nicht passt —
   bei Sternen ist das richtig, bei Münzen, für die jemand ein Werbevideo gesehen hat,
   wäre es ein Support-Fall. (Genau das ist mit dieser Änderung passiert:
   `FOLGE_VERSION` steht jetzt auf **2**, weil die Experten-Level die Folge verändern.)
3. **Der Tipp bucht nur ab, wenn er etwas liefert.** `hint()` gibt auch dann `null`
   zurück, wenn bloß das Budget alle war. Für einen Tipp, der nichts sagt, Geld zu
   nehmen, wäre unfair.
4. **Der Neustart ist immer gratis.** Damit bleibt das Spiel in jeder Lage spielbar,
   auch mit leerem Guthaben — das ist die Bedingung dafür, dass die Sackgasse eine
   Entscheidung ist und keine Wand.

Der Tipp kostet **mehr** als ein Zug zurück, und das ist Absicht: der Rückkauf behebt
einen Fehler, der Tipp nimmt die Aufgabe ab.

**Offene Spannung, in Phase 5 zu entscheiden:** Als Rettung aus derselben Lage sieht
dieses Dokument seit dem ersten Tag das **Extra-Glas** vor, gekoppelt an ein freiwilliges
Werbevideo. Mit den Münzen gibt es nun zwei Rettungswege. Der Münz-Rückkauf war ungleich
billiger zu bauen — ein Extra-Glas bräuchte einen neuen Spielstand, weil
`Spielstand.glaeser` und `Level.glaeser` fest sind, und es würde Undo-Stapel und
Sternwertung berühren.

### Experten-Level

Jedes **25. Level ab 225** (31 Stück) hat hohe Gläser: abwechselnd 12 Gläser mit **7**
Schichten und 14 Gläser mit **8**. Gemessene Optima 24–30 statt 20–27 — das ist der
einzige Hebel, der über die Decke der Sechser hinausführt. Mehr als acht Schichten gehen
nicht (`MAX_HOEHE`, vier Bit je Schicht).

Umsetzung: die Experten-Level liegen **über** der Rotation, nicht **in** ihr. Würden sie
eingeschoben, verschöbe sich die Phase von `(nr - 186) % 12`, und alle 800 Level ab 186
wären andere. So ändern sich genau die 31 — nachgebaut wurden sie einzeln mit
`--von N --bis N`.
Das Farbenblind-Zeichen schrumpft bei `hoehe >= 7` auf 12 px; bei acht Schichten ist eine
Schicht nur noch rund 16 px hoch. In der Levelwahl trägt eine Experten-Kachel einen
kleinen Punkt, damit ein plötzlich viel schwereres Level nicht wie ein Fehler wirkt.

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
2. **Spielbildschirm:** weitgehend fertig (siehe „Aktueller Stand"); offen bleiben
   Extra-Glas, der fließende Gießstrahl und die Bar-Geräusche.
   - Bar-Look, Gieß-Animation, Haptik
   - Undo, Neustart, Tipp, Extra-Glas
   - Farbenblind-Modus
3. ~~**Levelfolge:** sanfter Einstieg, dann mehr Farben und weniger leere Gläser,
   Sterne nach Zügen.~~ **FERTIG (26.09.2026)** — 999 Level aus `src/engine/kurve.ts`,
   der Reihe nach freigeschaltet.
4. **Tagesrätsel:** Teilen, Serie, Bestenliste. Dazu eine Supabase-Migration und die
   Edge Function für die Prüfung.
   ← **hier geht es weiter.** `kurve.ts` ist dafür schon vorbereitet: Datum → Seed →
   `stufeFuer()`, und die Edge Function baut dasselbe Brett neu.
5. **Werbung, Kauf, Rechtstexte, Sprachen.** Zuerst DE und EN, danach ES/FR/PT.
6. **Stores:** Capacitor für iOS und Android, Release-Workflows mit `laeufer`, ein
   Runner auf Josefs Mac, die Store-Einträge.
7. **Version 1.1: Duelle.**

## Prüfung

- **Testskripte** (alle grün zu halten). `npm test` fährt alle sechs nacheinander,
  Gesamtlaufzeit rund 4 Minuten — davon entfallen 148 s auf den 1.000er-Lauf des
  Generators und 21 s auf die Prüfung der ausgelieferten Folge. Einzeln über `npx tsx tools/test-x.mts`; **Node 22 kann
  `.mts` auch direkt** (`node tools/test-x.mts`), und das ist für den 1.000er-Lauf
  spürbar schneller.
  - `test-engine.mts` (42) — die Gießregel in allen Randfällen, Siegbedingung, Packen
    und Kanonisierung. Darunter: mehr als 8 Schichten werden abgelehnt (4 Bit je
    Schicht), und zwei vertauschte gleiche Gläser ergeben denselben Schlüssel, zwei
    verschiedene nie.
  - `test-loeser.mts` (32) — das wichtigste Skript. Vergleicht A* auf 477 Zufallsbrettern
    gegen eine **unabhängige Breitensuche** und prüft, dass die Heuristik nie überschätzt
    und konsistent ist. Eine zu hohe Heuristik fällt sonst nirgends auf — sie erzeugt
    keinen Absturz, sondern falsche Sternschwellen.
  - `test-generator.mts` (16) — **1.000 Level** über alle Stufen: jedes lösbar, jedes
    Optimum im Band, Flüssigkeitsmenge stimmt, keines startet gelöst, JSON-Rundlauf hält.
    Dazu Determinismus samt **fester Seed-Tabelle** — das ist der eigentliche
    Regressionsschutz: eine Änderung, die die Seed-zu-Level-Abbildung verschiebt,
    entwertet jede gespeicherte Wiedergabe und jeden Bestenlisteneintrag. Genau hier fiel
    auf, dass ein Zeitdeckel im Generator die Erzeugung von der Uhr abhängig macht.
  - `test-folge.mts` (23) — prüft die **ausgelieferte** `src/levels/folge.json` gegen
    `kurve.ts`: 999 Einträge, Version 3, Form und Abschnitt passen, jedes Optimum liegt
    im Band seines Abschnitts, kein Level fällt unter den Boden, und eine Stichprobe von
    31 Leveln wird aus `seedFuer()` + `stufeFuer()` **bitgenau nachgebaut**. Das ist die
    Brücke zu Phase 4: Tagesrätsel und Schummelschutz bauen Level serverseitig neu, und
    wenn die Datei nicht zur Kurve gehört, ist jeder Bestenlisteneintrag Zufall.
    *Hier ist auch eine Falle aufgeflogen:* `loesbar()` ist eine Tiefensuche mit
    Knotendeckel, und ihr `false` heißt **„nicht gefunden"**, nicht „unmöglich". Mit dem
    Standardbudget von 60.000 Knoten gab sie bei fünf der großen Level auf. Wer ein
    belastbares Nein braucht, nimmt `solve()` — dessen `unloesbar` ist bewiesen.
  - `test-muenzen.mts` (21) — die Münzregeln. Klein, aber hier hängt die Balance dran:
    zahlt ein Level mehrfach, lässt sich die Währung farmen, und dann ist der Preis für
    den Tipp wirkungslos — und mit ihm die ganze Arbeit an der Schwierigkeitskurve.
    Läuft bewusst **ohne** `localStorage` (Node hat keins) und prüft damit genau den
    Fall, den die App im privaten Fenster erlebt.
  - `test-wiedergabe.mts` (37) — Undo-Stapel und Wiedergabe. Der Undo speichert nur den
    **Unterschied** (von, nach, Menge), nicht den ganzen Stand — bei 14 Gläsern und
    60 Zügen ist das der Unterschied zwischen ein paar hundert Bytes und ein paar
    Kilobyte je Partie.
  - `test-oberflaeche.mjs` (25, braucht Playwright + Chromium, sonst kein Netz und
    keine Schlüssel) — spielt ein Level im echten Browser mit der Lösung des
    Lösers durch und vergleicht, ob die Oberfläche dasselbe erzählt wie die Engine.
    Prüft auch die Sperre: bei frischem Start ist Level 2 zu, ein Sieg öffnet genau ein
    Level weiter. Weil er dafür nicht elf Level durchspielen will, setzt er
    `fixthemix.fortschritt.v2` von Hand — das ist die einzige Stelle, an der ein Test
    den Speicher schreibt, und sie ist im Skript so kommentiert.
    Dazu Münzen und **die Sackgasse im echten Browser**: das Skript sucht sich mit der
    Engine eine Zugfolge, die Level 301 nachweislich tötet (gefunden: zwei Züge), spielt
    sie, und prüft, dass das Fenster erscheint und der Rückkauf genau 10 Münzen kostet.
    Läuft gegen **`dist/`**, also vorher `npm run build`; ist nicht in `npm test`, weil
    es einen Build voraussetzt. Legt Screenshots in `.screenshots/` ab, darunter
    `03-graustufen.png` — das ist die Abnahme für den Farbenblind-Modus.
- **Handprobe:** `node tools/zeige-level.mts --level 120 --loesung` druckt Level 120 der
  ausgelieferten Folge und seine kürzeste Lösung als Emoji-Raster; `--stufe 4 --seed 7`
  nimmt stattdessen die grobe `STUFEN`-Leiter. Die Tests sagen nur, ob ein Level lösbar
  ist; ob es sich **gut anfühlt**, sieht man nur so.
- **Levelfolge bauen:** `node tools/level-bauen.mts` baut alle 999 Level (gemessen
  **307 s**), `--von N --bis M` nur einen Bereich, `--neu` verwirft den Bestand.
  Geschrieben wird nach **jedem Block von 20** — ein Abbruch kostet höchstens 20 Level.
  Die Datei ist immer ein lückenloser Anfang der Folge; ein `--von`, das eine Lücke
  ließe, wird abgelehnt.
- **Schummelschutz:** Die Edge Function lehnt manipulierte Zugfolgen ab.
- **Farbenblind-Modus:** ein Screenshot in Graustufen. Jede Farbe muss am Symbol zu
  erkennen sein.
- **Web-App:** https://fixthemix.vercel.app — Vercel-Projekt `fixthemix` im Konto
  `almaz6380`, Vite automatisch erkannt, mit `almaz6380/FixTheMix` verknüpft.
  Ausgeliefert wird nur `dist/`; der Quellcode bleibt im privaten Repo.
- **Der Deploy-Schutz ist bewusst AUS** (25.09.2026, Josefs Entscheidung). Vercel
  schützt neue Projekte standardmäßig mit einer Anmeldepflicht — damit wäre die
  Adresse nicht von überall erreichbar gewesen. Wieder einschaltbar unter
  Project → Settings → Deployment Protection.
- **Testaufbau am Handy über claude.ai:** Der Build lässt sich auch als private Seite
  dort veröffentlichen. Zwei Fallen: die Seite darf kein eigenes `<html>`/`<head>`
  mitbringen (der Rahmen setzt das selbst), und die Sicherheitsabstände für Notch und
  Home-Leiste müssen **vom Rahmen** kommen — `env(safe-area-inset-*)` liefert
  innerhalb des Rahmens 0.
- **Am Gerät:** Werbung nur mit Test-IDs. **Nie echte eigene Anzeigen antippen** — am
  AdMob-Konto hängen alle Apps.

## Auslieferung auf Vercel

`vercel.json` schreibt alles, was nicht nach Datei aussieht, auf `index.html` um —
ohne das gibt ein Neuladen auf einer Unterseite 404, weil die Routen erst der Browser
kennt. Muster aus `anigosha/vercel.json`.

**`npx vercel deploy` schlägt aus einer Cloud-Sitzung fehl.** Die Meldung ist
`fetch failed`; dahinter steckt der Agent-Proxy, der die lange Verbindung zu
`api.vercel.com` mittendrin kappt (`ws_closed_mid_exchange`). Vier Anläufe mit
wachsendem Abstand haben nicht geholfen. Der Weg, der **funktioniert**, ist ein
einzelner kurzer API-Aufruf — Vercel baut dann selbst aus dem Repo, es wird nichts
hochgeladen:

```bash
curl -X POST -H "Authorization: Bearer $Vercel_CLI" -H "Content-Type: application/json" \
  -d '{"name":"fixthemix","target":"production",
       "gitSource":{"type":"github","repoId":1388002138,"ref":"<zweig>"}}' \
  https://api.vercel.com/v13/deployments
```

Danach den Zustand pollen, bis `readyState` auf `READY` steht.

**Der Produktionszweig ist `main`.** Ein Push auf einen Feature-Zweig erzeugt also
höchstens eine Vorschau. `"target": "production"` im Aufruf oben hebt das auf und
hängt `fixthemix.vercel.app` an genau diesen Stand — praktisch zum Testen, aber es
heißt auch: was auf der Produktionsadresse liegt, muss nicht in `main` stehen.

**Schriften:** `node tools/fonts-holen.mjs` lädt die `.woff2` von Google nach
`public/fonts/` und druckt die `@font-face`-Regeln, die oben in `src/index.css` gehören.
Einmalig gelaufen; das Ergebnis liegt im Repo. Es gibt **keinen** Netz-Fallback — fehlt
eine Datei, fällt die Schrift still auf `system-ui` zurück.

**Icons:** `node tools/icons-bauen.mjs` erzeugt aus `public/favicon.svg` die
PNG-Größen. Nur SVG reicht nicht — iOS nimmt für „Zum Home-Bildschirm hinzufügen"
ausschließlich `apple-touch-icon.png`, und der Android-Manifest will PNG.

## Regeln (wie in allen Repos)

- Kein Commit, Deploy oder Build ohne ausdrückliches „ja" von Josef. Vor jedem Build
  in drei Zeilen zusammenfassen: was passiert, welche Version, wohin es geht.
- Schlüssel gehören nie ins Repo und nie in den Chat.
- Mobile-first, alle Texte über i18n, mit korrekten Umlauten.
- Josef arbeitet meist vom Handy: Ergebnisse direkt im Chat zeigen (`SendUserFile`).
