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
- **Tagesrätsel: es gilt der ORTSTAG des Spielers, nicht UTC** (entschieden am
  26.09.2026 — dieses Dokument hatte die Frage für Phase 4 ausdrücklich offengelassen).
  Anigosha nimmt `current_date` der Datenbank; damit wechselt das Rätsel in Hawaii um
  14 Uhr und in Neuseeland um 12 Uhr mittags, mitten am Tag. Ein Tagesrätsel ist ein
  Ritual, und ein Wechsel am Nachmittag zerstört es. Preis: die Bestenliste eines Tages
  umfasst weltweit rund 50 Stunden.
- **Extra-Glas ZUSÄTZLICH zum Münz-Rückkauf** (Josef, 26.09.2026). Es gibt damit zwei
  Rettungswege aus einer Sackgasse: ein Zug zurück für Münzen, oder ein leeres Glas für
  ein freiwilliges Werbevideo. Höchstens ein Extra-Glas je Partie, und es **deckelt die
  Wertung auf zwei Sterne** — das Optimum ist für das Brett ohne dieses Glas bewiesen.
- **Zwanzig Sprachen** (Josef, 02.10.2026: „alle großen Sprachen", vorher fünf seit dem
  26.09.): DE, EN, ES, FR, PT, IT, NL, PL, TR, RU, UK, AR, HI, ID, VI, TH, JA, KO,
  Chinesisch vereinfacht und traditionell. **Arabisch läuft von rechts nach links.** Die
  Rechtstexte bleiben bei DE und EN, weil sie gegengelesen werden müssen. Die
  Übersetzungen sind maschinell und **nicht** von Muttersprachlern gegengelesen.
- **Version 1.0 geht OHNE Bestenliste in den Store** (Josef, 26.09.2026). Damit gibt es
  keine Datenbank, keine anonyme Anmeldung und keine Duelle gegen Menschen — das
  Tagesrätsel läuft auf dem Gerät, der Duellgegner ist ein Bot. Die Folge ist keine
  Codeänderung, sondern eine **rechtliche**: der Abschnitt „Bestenliste und Tagesrätsel"
  ist aus der Datenschutzerklärung gelöscht, Supabase steht nicht mehr als Empfänger
  darin, und die Altersfreigabe-Antwort „Nutzer können interagieren" ist jetzt **nein**.
  Eine Datenschutzerklärung darf nichts behaupten, was nicht passiert — das ist derselbe
  Fehler wie etwas zu verschweigen, nur andersherum. Migration, Edge Functions und die
  Rückbau-Anleitung liegen im Repo; `tools/test-recht.mts` erzwingt die Übereinstimmung
  in **beide** Richtungen.
- **Farbsystem:** neun Farben, alle gleichberechtigt, keine Kategorien mehr —
  Erdbeere, Zitrone, Blaubeere, Orange, Apfel, Traube, Minze, Kokos, Kaffee. Jede trägt
  ein eigenes **gezeichnetes** Zeichen für den Farbenblind-Modus (vorher Emoji, die auf
  jedem Gerät anders aussehen und in Graustufen kaum zu trennen sind).

## Aktueller Stand

### Version 1.1.0 — knappe Münzen, Videos als Hilfe, Rechtsnachzug (04.10.2026)

Branch `claude/rechtspruefung-fixes`, iOS 1.1.0 (Build 2), Android 1.1.0 (vc2).
Noch nicht gebaut, nicht eingereicht.

**Die Ökonomie.** In 1.0 finanzierte jedes perfekte Level (25) mehr als einen Tipp
(15) — die Münzen waren wirkungslos, der Tipp wieder eine Lösungsmaschine. Jetzt:
Lohn 2/4/8, Tipp 60, Zug zurück 40, Start 100, Video 30. Ziel: **rund eine Hilfe je
acht bis zehn Level** aus eigener Kraft; wer öfter Hilfe will, sieht freiwillig ein
Video. `test-muenzen.mts` rechnet das nach (Level je Tipp 8–12, je Rückkauf 6–10).

**Videos als Hilfe** (`src/App.tsx`):
- **Tipp per Video:** Reichen die Münzen nicht, wird derselbe Knopf in der Fußzeile
  zu „Tipp · Video". Zwei Tipp-Knöpfe passen nicht in die Fußzeile. Erst rechnet der
  Löser, dann kommt das Video — für einen Tipp, der nichts liefert, gibt es kein Video.
- **Zug zurück per Video** im Festgefahren-Fenster, überall wie der Münz-Rückkauf
  (auch Tagesrätsel/Duell: ein Zug zurück ändert das nachspielbare Brett nicht). Er
  ersetzt dort das alte „Münzen per Video" — 30 Münzen reichten für 40 ohnehin nicht.
- **„Video für 30 Münzen"** (Einstellungen) ist auf **3 je Ortstag** gedeckelt:
  `videoKontingent()`/`zaehleVideo()` in `muenzen.ts`, eigener Schlüssel
  `fixthemix.muenzvideos.v1`. Tipp und Zug zurück per Video sind nicht gedeckelt —
  sie kosten genau ein Video je Hilfe.

**Werbung** (`src/lib/werbung.ts`):
- `zeigeBelohnungsVideo()` liefert `'earned' | 'aborted' | 'unavailable'` und hängt
  nicht mehr: das Plugin löst `showRewardVideoAd()` NUR bei verdienter Belohnung auf,
  ein Abbruch kam nie zurück. Muster aus Mahjong Royale (`requestReward`): Dismissed/
  FailedToShow abhören, harte Zeitgrenze, Doppeltipp-Sperre. Belohnt wird nur bei
  `'earned'`.
- **„Werbung entfernen" nimmt die Videos nicht weg**, nur die Interstitials. Ein
  werbefreier Spieler startet das SDK NICHT beim App-Start (kein Einwilligungsdialog
  für jemanden, der bezahlt hat); es startet beim ersten Video, das er selbst will.
  App.tsx prüft deshalb erst den Kaufstatus, dann die Werbung.
- **Einwilligung vor `initialize`** — mit einer Ausnahme, die im Plugin steckt: auf
  iOS setzt `@capacitor-community/admob` 8.1 die ViewController-Referenz des
  Consent-Teils nur in `initialize()`. Dort wird der STATUS vorher geholt, das
  FORMULAR direkt nach dem Start gezeigt; Anzeigen kommen in jedem Fall erst danach
  und nur bei `canRequestAds`. Android: alles vor dem Start.
- `public/app-ads.txt` (kontoweite Zeile). Wirkt nur, wenn in beiden Store-Konsolen
  als Website `https://fixthemix.almaz6380.workers.dev` steht — von Hand prüfen.

**Einstellungen** prüfen beim Öffnen den Kaufstatus (`werbefreiPruefen`) — vorher
stand nach einem Kauf beim nächsten Öffnen wieder der Kaufknopf da.

**Bewertung** (`src/lib/bewertung.ts`, `@capacitor-community/in-app-review` 8.0.0,
per `npx cap sync` sauber in Package.swift und Gradle eingetragen): ab dem 10.
gelösten Level, höchstens alle 90 Tage, nie im selben Moment wie ein Interstitial
(`vielleichtInterstitial()` meldet jetzt zurück, ob eine Anzeige lief), nie im
Browser, ohne Belohnung. Regel als reine Funktion in `test-werbung.mts` geprüft.
⚠ Am Gerät ungetestet.

**Recht:** Die Datenschutzerklärung (DE+EN, Stand 04.10.2026) sagt jetzt ehrlich,
dass die App **bei jedem Start** RevenueCat mit ihrer zufälligen Kennung fragt —
auch ohne Kauf (lit. b bzw. f). AdMob mit Google Ireland/Google LLC, Einwilligung
nach Art. 6 Abs. 1 lit. a DSGVO + § 165 Abs. 3 TKG, Speicherdauer nach Google, DPF/SCC.
`docs/store-eintrag.md` behauptete, die Kennung verlasse das Gerät nicht — falsch,
korrigiert; die Datenschutz-Formulare beider Stores müssen nachgezogen werden
(Kennung → App-Funktionalität). Danach im Repo `almaz6380.github.io`
`npm run erzeugen`, sonst zeigt der Store den alten Text.

**Versionshinweise 1.1.0** (Vorschlag):
- DE: „Neu: Tipp und Zug zurück jetzt auch per Video. Münzen sind wertvoller
  geworden — Hilfe gibt es seltener, dafür fairer. Kleine Verbesserungen und
  Fehlerbehebungen."
- EN: „New: get a hint or an undo by watching a video. Coins are now scarcer and
  worth more. Small improvements and fixes."

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
- [x] `src/engine/` vollständig, **332 Zusicherungen in neun Testskripten, alle grün**
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
- [x] **Der Aufbau stimmt** (27.09.2026, Josefs Entscheidung): Startbildschirm unter `/`,
      Spiel unter `/spiel`, Levelwahl unter `/level`, Tagesrätsel und Duell mit eigenen
      Adressen. Vorher öffnete die App mitten in einem Level, und die gesamte Navigation
      steckte in einem Fenster darüber. Siehe „Der Aufbau der App".
- [x] Bar-Look, Gläser skalieren mit der Spaltenbreite
- [x] Antippen = wählen, nochmal antippen = gießen. Bewusst kein Ziehen: mit dem
      Daumen über ein halbes Display zu ziehen ist unangenehm, und ein abgebrochener
      Zug ist schwer zu erkennen.
- [x] Der gewählte Lauf **leuchtet** (ein Lichtband zieht über ihn) — man sieht **vor**
      dem Gießen, was fließen würde. Ein Zug ohne diese Vorschau fühlt sich wie Raten an.
      *Bis zum 01.10.2026 hob er sich um 6 px; darunter klaffte eine dunkle Lücke im
      Glas, die wie ein Darstellungsfehler aussah.*
- [x] Undo, Neustart, Tipp (Löser mit knappem Budget), Sterne live in der Kopfzeile
- [x] Farbenblind-Modus mit Symbol auf jeder Schicht, Abnahme über einen
      Graustufen-Screenshot
- [x] Haptik über `navigator.vibrate` (Android-Browser; iOS ignoriert es still, in der
      Store-App übernimmt das später Capacitor Haptics)
- [x] Fortschritt und Einstellungen in `localStorage`, jeder Zugriff eingepackt
- [x] 999 vorgebaute Level (`tools/level-bauen.mts` → `src/levels/folge.json`) mit
      Levelwahl in Abschnitten
- [x] **Extra-Glas** — kam mit Phase 5 (siehe M8)
- [x] **Der Gießstrahl** (26.09.2026): ein Bogen von der Quelle ins Ziel, in der Farbe
      der Flüssigkeit, mit Lichtkante. Er ist **reine Zierde** — er hält nichts auf,
      fängt keinen Klick, und der Spielstand ist schon weitergezogen, bevor er beginnt.
- [x] **Bar-Geräusche** (26.09.2026): `src/lib/klang.ts`, **ohne eine einzige
      Tondatei** — alles wird im Browser erzeugt. Schalter in den Einstellungen.

### M4 Aussehen — FERTIG (25.09.2026)
- [x] **Nachtblau mit Fischschuppen** als Grund (`repeating-radial-gradient`, 46 px),
      dazu ein warmer Schein von oben. Josefs Wahl aus acht vorgelegten Mustern.
- [x] **Pint-Glas mit dickem Boden** (Josef, 02.10.2026): Nr. 3 aus vier Formen, die er
      in Gemini hat zeichnen lassen. Davor kurz ein bauchiges Cocktailglas, davor die
      Reagenzglas-Form vom 25.09. Oben volle Breite, unten 68 %, die Wand gerade, unten ein
      kurzer senkrechter Fuß — die Schichten bleiben fast gleich breit und gut zählbar.
      Der Boden (`BODEN`, 15 % der Höhe) ist massives Glas; die sechs Schichten teilen sich die Höhe darüber.
      Die Form ist **ein SVG-Pfad** (`UMRISS` in `Glas.tsx`), gestreckt ohne
      Seitenverhältnis — als Maske für alles im Glas, als Strich für die Kante.
      `border-radius` kann keine schräge Wand, und `clip-path: path()` rechnet in Pixeln.
- [x] **Fertige Drinks bekommen einen Strohhalm** (02.10.2026): randvoll und einfarbig
      heißt Strohhalm mit Streifen im `tief`-Ton der Sorte. Schon während der Partie,
      nicht erst beim Sieg.
      **Der Halm endet am Flüssigkeitsspiegel** (Josef: „nur da sichtbar, wo die
      Flüssigkeit aufhört"). Saft ist nicht durchsichtig; ein Halm, den man durch die
      Flüssigkeit sieht, wirkt aufgeklebt. `Glas.tsx` reicht den Spiegel
      (`KOPFRAUM · (100 − BODEN)`, ≈ 12,75 % von oben) herein, `Garnitur.tsx` schneidet
      per `clip-path` waagrecht ab — die Zahl steht nirgends von Hand.
      **Das Bild kommt aus Gemini** (Josef: „ich will schärfere Grafiken"): Vorlage in
      `tools/vorlagen/`, verarbeitet mit `node tools/garnitur-bilder.mjs` zu
      `src/assets/garnitur/halm-*.webp` (neunmal rund 7 KB, im Bundle, offline sicher).
      Das Werkzeug stellt per **Farbschlüssel auf Magenta** frei, rechnet den rosa Saum
      aus den Kanten und färbt die Streifen neunmal um.
      *Dazu steckte kurz eine Frucht der Sorte an der linken Glaskante, erst von Hand
      als SVG, dann aus Gemini. Josef hat sie am selben Tag wieder entfernt, noch bevor
      sie committet war — es gibt sie also auch im Verlauf nicht.*
      Der Halm ragt nur knapp über den Rand, sonst stünde er im Glas der Reihe darüber.
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
      Welche Tinte ein Zeichen trägt, steht in `farben.ts` und ist **gerechnet**:
      es gewinnt die bessere der beiden, Mindestkontrast 3:1. Seit dem 27.09.2026
      brauchen **Kaffee und Blaubeere** helle Tinte.
- [x] `@media (prefers-reduced-motion: reduce)` schaltet die Bewegungen ab
- [x] **Die Bar ist ein Ort** (27.09.2026, Josefs Entscheidung): jede Glasreihe steht auf
      einer Messingleiste, die vorderste auf einer Holztheke; die Fußzeile liegt auf der
      Theke. Vorher schwebten die Gläser frei in der Mitte des Schirms. Siehe „Die Bar
      als Ort" unten.
- [x] **Das Glas ist heller als der Grund**, nicht dunkler. Der leere Teil war
      `rgba(8,14,26,0.86)` — ein leeres Glas las sich als Loch im Hintergrund.
- [x] **Feinschliff am 01.10.2026** (Josef: „noch billig"), siehe „Der Feinschliff"
      unten: Rückwand mit Lampen und Regal, Tresen aus Holz mit Spiegelung, größere
      Gläser auf kleinen Brettern, gewähltes Glas im Licht statt im Rahmen, Siegmoment
      mit Welle, Funken und Karte von unten.
- [x] **Die Fischschuppen blenden nach unten aus.** Sie liefen mit vollem Kontrast bis
      unter die Gläser durch und stritten dort mit der Flüssigkeit. Jetzt sind sie die
      Rückwand und verschwinden, bevor das Brett beginnt.
- [x] **Neuer Startbildschirm** (Josef, 03.10.2026: Gemini-Entwurf „oben links“ aus
      vier): Titel mittig, zwei Lampen ganz außen (`Rueckwand lampenX`), drei große
      Gläser auf einem Holztresen bis ganz unten (`.start-tresen`) mit Messingreling
      (`.start-reling`), darauf ein goldener Hauptknopf und dunkle Glaskacheln
      (`.start-kachel`) für Level, Münzen, Tagesrätsel und Duell.
- [x] **`<html>` trägt Holz** (`#1D1310`), damit unter dem Tresen kein Nachtblau
      hervorschaut, dazu `overscroll-behavior: none`. *Die Falle dabei:* hat `<html>`
      einen eigenen Grund, malt `<body>` seinen Nachtgrund selbst — und ohne eigenen
      Stapelkontext **über** alles mit `z-index: -1`. Lampen und Regal waren im Spiel
      weg. Deshalb `isolation: isolate` auf `<body>`.
- [x] **Der Streifen unten in der Home-Bildschirm-Web-App (iOS, ~59 pt):** liegt
      **außerhalb der Seite** — iOS malt ihn selbst, und die Seite kann nur seine
      **Farbe** bestimmen, nie ein Muster. Belegt durch fünf Versuche (03.–07.10.):
      `theme-color` (#37) und Manifest `background_color` (#38) änderten nichts;
      die **Grundfarbe von `<body>`** (#41: Holz `#1d1310`, das Nachtblau liegt als
      deckende Bildlage darüber) machte ihn braun. Ein fester Holzstreifen (#42)
      und ein Startbildschirm, der per `position: fixed` tiefer reicht (#43),
      kamen dort **nicht** an — beide wieder entfernt; #43 hätte sogar Inhalt in
      den unsichtbaren Bereich geschoben. **Lösung:** die Bretter von
      `.start-tresen` laufen unten in genau `#1d1310` aus, der Streifen hat damit
      keine Kante mehr. *Lehre: erst messen, dann bauen — hier wurde fünfmal
      geraten.*
- [x] **Die Gläser sind 3D** (Josef, 06.11.2026: „Ich will 3D-Gläser", gewählt
      der **Becher** aus sechs gerenderten Formen — Pint, Tumbler, Becher,
      Highball, Smoothie, Kelch). `tools/glas-3d-rendern.mjs` dreht ein Profil in
      three.js um die Achse (`LatheGeometry`), rendert es einmal im Chromium und
      zerlegt es in **zwei Bildebenen**: `glas-becher-hinten.webp` (Rückwand und
      Boden, UNTER dem Saft) und `glas-becher-vorn.webp` (Vorderwand, Rand,
      Spiegelungen, DARÜBER), zusammen 41 KB. Dazu `formen.json` mit dem
      **Innenumriss**, aus dem Profil gerechnet — er ist die Maske des Safts.
      Gießen, Kippen, Strahl, Strohhalm und Farbenblind-Modus bleiben, wie sie
      waren; das Pint aus SVG-Pfad und CSS-Licht ist weg.
      *Warum Bilder und kein Echtzeit-3D:* WebGL im Spiel hätte Saft, Gießen,
      Strahl und Tests neu verlangt und auf billigen Androids bei 14 Gläsern
      geruckelt. *Warum ein Profil und kein Tripo-Netz:* ein KI-Netz ist leicht
      schief, dann passt keine Maske; das Profil liefert den Umriss exakt.
      *Warum ein eigener Shader statt `transmission`:* Transmission bricht, was
      hinter dem Glas liegt — vor durchsichtigem Grund ist das Schwarz. Die
      Deckkraft ist Fresnel plus die Spiegelung zweier Lichtleisten und einer
      Lampe oben links. `three` ist nur devDependency.
      Form wechseln: Profil in `FORMEN` wählen, `node tools/glas-3d-rendern.mjs
      --nur <form>`, Importe in `Glas.tsx` umstellen.
- [x] **Startbildschirm mit Leuchtschild und Gästen** (03.11.2026): „FixThe" in
      Zitrus-, „Mix" in Erdbeer-Neon auf einer Tafel an zwei Ketten, zwei leise
      SVG-Silhouetten am Tresen (`Gaeste.tsx`, ohne Gesichter), Bläschen in den
      Gläsern, Münzen oben als Anzeige statt als Knopf, drei gleich große
      Kacheln, Punkt „heute offen" am Tagesrätsel, Sternbalken.
- [x] **Einstellungen mit echten Schaltern** (03.11.2026): `role="switch"` mit
      sichtbarem Zustand statt Knöpfen „… ein- oder ausschalten"; Karten,
      Rechtstexte als Liste, „Alle Daten löschen" rot. Neue Schlüssel
      `spiel.symboleKurz`/`spiel.tonKurz` in allen zwanzig Sprachen (maschinell).

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
- [x] **`src/lib/muenzen.ts`** (Werte von 1.0, seit 1.1.0 knapper — siehe oben): Startguthaben 100, Tipp 15, Rückkauf 10, Lohn nach
      Sternen 5/12/25 — und **nur die Verbesserung** wird gezahlt
- [x] Münz-Chip in der Kopfzeile, Preis auf dem Tipp-Knopf
- [x] 31 Experten-Level mit 7 oder 8 Schichten, Optima 24–30 (statt 20–27)
- [x] Der Tipp schweigt nicht mehr, wenn er nichts findet: entweder „festgefahren"
      (bewiesen) oder eine Meldung
- [x] Das **Werbevideo** für Münzen kam mit Phase 5 (`src/lib/werbung.ts`)

### M7 Tagesrätsel — FERTIG bis auf die Datenbank (26.09.2026)
- [x] **`src/engine/tagesraetsel.ts`**: Datum → Seed → Schwierigkeit, `tagLevel(iso)` als
      der **eine** Weg zum Brett des Tages. Ohne `Date`, sogar zum Parsen — die
      Datumsrechnung ist selbst gerechnet.
- [x] **Wochenleiter**: montags 6 Gläser, sonntags 14 mit 9 Farben. Der Boden fällt über
      die Woche nie.
- [x] Das Rätsel wird **auf dem Gerät** erzeugt (1–584 ms gemessen, deshalb ein
      Ladezustand). Vorgebaut wird nichts: es gibt unendlich viele künftige Tage, und
      eine Datei mit zwei Jahren Vorrat wäre in zwei Jahren still kaputt.
- [x] **Serie** (`src/lib/serie.ts`) mit eigenem Speicherschlüssel, beste Serie wird
      behalten, ein wiederholter Tag zählt sie nicht hoch
- [x] **Teilen** (`src/lib/teilen.ts`): spoilerfrei — Sterne, Zugzahl, Optimum und ein
      Balken, **keine Farben**. Der Test prüft das ausdrücklich.
- [x] **Schummelschutz-Rechnung** (`src/engine/tagespruefung.ts`): der Server baut das
      Brett selbst und rechnet Zugzahl und Sterne aus dem Nachspielen. Datumsfenster von
      einem Tag für die Zeitzonen.
- [x] `supabase/migrations/0001_tagesraetsel.sql` und
      `supabase/functions/pruefe-tag/index.ts` liegen fertig im Repo
- [ ] **Nicht deployt und nicht gegen eine echte Datenbank gelaufen** — es gab in der
      Sitzung kein Supabase-Projekt. Die Schritte stehen in `docs/phase4-supabase.md`.
- [ ] Bestenliste in der Oberfläche, anonyme Anmeldung, Fortschritt in der Datenbank

### M8 Werbung, Kauf, Recht, Sprachen — FERTIG bis auf die Store-Konten (26.09.2026)
- [x] **`src/lib/werbung.ts`** (aus `anigosha/src/lib/ads.ts`): AdMob mit UMP-Einwilligung
      und ATT-Warteschleife. **Echte Anzeigen seit dem 03.10.2026**
      (`TEST_ANZEIGEN = false`), direkt vor dem ersten Release-Build.
- [x] **Die Bremse als reine Funktion** (`darfInterstitial`): jedes dritte Level, nie
      öfter als alle zwei Minuten. Dreißig Level in einer Stunde ergeben zehn Anzeigen,
      dreißig Level in zehn Minuten nur fünf — beides im Test nachgerechnet.
- [x] **`src/lib/kauf.ts`** (aus `anigosha/src/lib/purchases.ts`): „Werbung entfernen"
      über RevenueCat, samt der **Thenable-Falle** und Zeitlimits auf jedem Aufruf.
      Ohne Schlüssel bleibt alles stumm.
- [x] **Extra-Glas** gegen ein freiwilliges Werbevideo, angeboten im
      Festgefahren-Fenster — dort, wo es etwas rettet
- [x] **Werbevideo für Münzen** (30, in den Einstellungen und im Festgefahren-Fenster)
- [x] **Einstellungen** (`/einstellungen`): Sprache, Farbenblind-Modus, Kauf,
      Wiederherstellung, Werbe-Einwilligung, Münzstand, Kennung, Daten löschen
- [x] **Vier Rechtstexte** mit eigenen Adressen: `/impressum`, `/datenschutz`,
      `/nutzungsbedingungen`, `/daten-loeschen`
- [x] **Zwanzig Sprachen** (seit 02.10.2026, vorher fünf), alle Schlüssel vollständig;
      beim ersten Start entscheidet die Gerätesprache. Siehe „Sprachen".
- [x] **Die beiden AdMob-Apps sind angelegt** (Josef, 26.09.2026), und ihre echten
      App-IDs stehen im Repo: iOS `…8860791993288062~8461231878` in der `Info.plist`,
      Android `…~4290052573` im Manifest. `TEST_ANZEIGEN` bleibt trotzdem `true` —
      warum das kein halber Zustand ist, steht unter „Die Beispiel-IDs".
- [x] **Die vier Anzeigenblöcke stehen** (Josef, 02.10.2026) unter `PROD` in
      `src/lib/werbung.ts`: iOS `…/3646198515` (Interstitial) und `…/2333116848`
      (Rewarded), Android `…/5015120505` und `…/3574046320`. Seit dem
      03.10.2026 steht `TEST_ANZEIGEN` auf `false`, und `test-release.mts --release`
      ist grün.
- [ ] **RevenueCat-Schlüssel und die Store-Produkte fehlen** —
      dafür braucht es Konten und Store-Einträge. Kommt mit Phase 6.
- [x] **Die Kontaktadresse steht und existiert:** `63almaz80@gmail.com`
      (Josef, 26.09.2026). Der erste Entwurf trug `fixthemix@wellbooked.at`, dem
      Muster von Anigosha nachgebildet — die hätte aber erst angelegt werden
      müssen.

### M9 Stores — FERTIG bis auf die Konten (26.09.2026)
- [x] **Native Projekte** für iOS und Android (`npx cap add`), beide im Repo:
      Bundle-ID `at.gallab.fixthemix`, Version 1.0.0, `versionCode`/Build-Nummer 1
- [x] **Nur Hochformat**, auf beiden Plattformen. Das Brett ist eine Spalte aus
      höchstens fünf Gläsern je Reihe; quer stünden sie winzig oder halb außerhalb.
- [x] **ATT nativ** — und zwar im **`SceneDelegate`**, nicht im AppDelegate. Siehe
      „Die ATT-Falle, die Anigosha nicht hatte" unten. Dazu
      `NSUserTrackingUsageDescription`, 59 SKAdNetwork-Kennungen,
      `ITSAppUsesNonExemptEncryption`.
- [x] **Signierung im Projekt**, nicht auf der Kommandozeile: `CODE_SIGN_STYLE = Manual`
      nur in der Release-Konfiguration des App-Targets. Debug bleibt automatisch, damit
      lokales Bauen in Xcode bequem bleibt.
- [x] **Android:** `keystore.properties`-Signierung, AdMob-App-ID im Manifest,
      `AD_ID`-Berechtigung (ohne sie liefert das SDK ab Android 13 nur
      nicht-personalisierte Anzeigen — und nichts protokolliert es)
- [x] **App-Symbole und Startbilder** aus `tools/vorlagen/app-symbol.jpg`
      (`tools/app-icons-bauen.mjs`): iOS 1024 ohne Alphakanal, Android fünf Dichten
      als Quadrat, rund und adaptiv. Ohne das lädt man eine App mit dem
      **Capacitor-Logo** in den Store.
- [x] **Das Symbol neu gezeichnet.** Es war noch aus der Zeit vor M4: brauner Grund
      `#1b1410`, ein Cocktailglas, Tailwind-Standardfarben. Jetzt Nachtblau,
      Reagenzglas-Form und die echten Töne aus `farben.ts`. Derselbe Fehler steckte in
      `capacitor.config.ts` — der native Hintergrund war braun, die App ist nachtblau,
      also hätte es beim Start gefarbblitzt.
- [x] **Das Symbol kommt aus Gemini** (Josef, 02.10.2026): zwei Gläser, links
      gemischt, rechts fertig mit Strohhalm, ruhig und modern auf Nachtblau. Davor
      verworfen: ein SVG-Entwurf desselben Motivs („hässlich") und ein erstes
      Gemini-Bild mit Barlampe. Gemini hatte einen dunkleren Kasten **ins** Bild
      gemalt; die Vorlage ist auf diesen Kasten zugeschnitten, sonst stünde ein
      Rahmen im Symbol. Die **eine Quelle** ist jetzt
      `tools/vorlagen/app-symbol.jpg`; `public/favicon.svg` ist gelöscht, der
      Browser-Tab bekommt `public/favicon.png`. Alle drei Werkzeuge
      (`app-icons-bauen.mjs`, `icons-bauen.mjs`, `store-bilder.mjs`) lesen dieselbe
      Datei.
      Für das adaptive Android-Symbol und die Startbilder läuft der Rand des Bildes
      **weich aus** — sein Grund ist #081525, nicht ganz das Nachtblau #0E1A2E der
      App, und ohne Verlauf stünde ein Quadrat auf dem Quadrat. Es nimmt 60 % der
      Fläche ein, damit die Spitze des Strohhalms im sicheren Kreis bleibt.
      *Dabei aufgefallen:* `manifest.webmanifest` trug noch das Braun von vor M4
      (`theme_color: #1b1410`) — jetzt auch dort Nachtblau.
- [x] **Release-Workflows** `ios-release.yml` und `android-release.yml` mit der Eingabe
      `laeufer` (`github` oder Josefs Mac), Upload-Schalter standardmäßig **aus**
- [x] **`tools/test-release.mts`** — die Store-Verkabelung als Test, siehe unten
- [x] **`docs/release-ci.md`** (Secrets, Mac-Runner, die drei Angaben von Hand) und
      **`docs/store-eintrag.md`** (Texte, Altersfreigabe, Datensicherheit, Bilder)
- [x] **Anzeigenblöcke, RevenueCat-Schlüssel, Store-Produkte, Keystore, Zertifikat** —
      alles erledigt (02./03.10.2026). Siehe „Erste Einreichung“ unten.
- [x] **Eingereicht am 03.10.2026:** iOS 1.0 (Build 1) samt In-App-Kauf
      `fixthemix_no_ads` (2,99 €) wartet auf Apples Prüfung, Android 1.0 (vc1) liegt
      in Produktion zur Prüfung bei Google, derselbe Kauf ist dort aktiv.
- [x] **RevenueCat Android:** Die Dienstkonto-JSON (`revenuecat@wellbooked-501311`)
      ist hinterlegt und seit dem 06.10.2026 **„Valid credentials“**.

#### Erste Einreichung — vier Fallen (03.10.2026)

1. **Fehler 90474 beim Upload:** Eine App nur im Hochformat muss auf dem iPad
   `UIRequiresFullScreen` setzen, sonst verlangt Apple alle vier Ausrichtungen
   (iPad-Multitasking). Steht jetzt in der `Info.plist`, `test-release.mts` prüft es.
2. **Profil und Zertifikat müssen zusammenpassen.** Am Konto gibt es zwei
   Distributions-Zertifikate. Das auf Josefs Mac läuft am **22.06.2027** ab (SHA-1
   beginnt mit `81C6A157`), und genau dieses muss im Profil `FixTheMix AppStore`
   stecken. Die Fehlermeldung beim Archivieren ist „Provisioning profile … doesn't
   include signing certificate“. Prüfbefehl siehe `docs/release-ci.md`.
3. **iPad-Screenshots sind Pflicht** (13″, 2064×2752), weil die App auch aufs iPad
   geht. `store-bilder.mjs` nimmt sie seitdem mit auf. Englisch reicht, die anderen
   Sprachen übernehmen die Bilder der Primärsprache.
4. **Die Datenschutz-URL gilt je Lokalisierung.** In App Store Connect unter
   „App-Datenschutz“ muss sie in jeder Sprache einzeln eingetragen sein.

### M10 Duelle (Version 1.1) — FERTIG gegen Bots (26.09.2026)
- [x] **`src/engine/duell.ts`**: `duellLevel(nummer)` als der **eine** Weg zum Brett,
      `duellSieger()` für den Ausgang, `botSpielt()` für den Gegner.
      **Gleich viele Züge sind ein Remis** — jedes Stechen wäre unfair, siehe unten.
- [x] **Der Bot spielt wirklich.** Keine erfundene Zahl: er folgt der kürzesten Lösung
      und biegt an wenigen Stellen ab. Seine Zugfolge geht durch `replay()` wie die
      eines Menschen. Gemessen: leicht +7,8 Züge über dem Optimum, mittel +3,1,
      stark +1,8; langsamster Lauf 32 ms.
- [x] **Drei Stufen, die sich anpassen** (`naechsteStaerke`): ein Sieg macht den
      nächsten Gegner härter, eine Niederlage leichter, ein Remis lässt ihn stehen.
      **„stark" spielt nie das Optimum** — damit gewinnt genau die perfekte Partie.
- [x] **`src/engine/duellpruefung.ts`**: `pruefeDuell()` und `werteDuell()`, dieselbe
      Bauart wie `tagespruefung.ts`. Eine nicht gelöste Partie ist ein **Ergebnis**,
      kein Fehler.
- [x] **`src/lib/duell.ts`**: Bilanz unter eigenem Schlüssel `fixthemix.duelle.v1`,
      Duellnummern mit gerätespezifischer Basis
- [x] Duell-Karte in der Levelwahl, Duellmodus im Spielbildschirm, Aufgeben aus dem
      Festgefahren-Fenster, **fünf Sprachen**
- [x] `supabase/migrations/0002_duelle.sql` und
      `supabase/functions/duell-einreichen/index.ts` liegen fertig im Repo
- [ ] **Menschliche Gegner** brauchen die Datenbank aus Phase 4 — nicht deployt. Bis
      dahin ist der Gegner immer ein Bot.

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
7. **Duelle.** Beide lösen dasselbe Level, weniger Züge gewinnt, gleich viele sind
   ein Remis. Der Gegner ist kein Zahlengenerator, sondern spielt das Brett wirklich —
   und die oberste Stufe verliert genau gegen die perfekte Partie.

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
| `farben.ts` | Die neun Farben: **drei** Töne je Farbe (`tief`/`ton`/`hell`), die Tinte des Farbenblind-Zeichens, Symbolname, Emoji fürs Teilen. Keine Kategorien, keine Mischtabelle mehr. Siehe „Die Farben". |
| `zufall.ts` | mulberry32 + fmix32 + getrennte Streams. Nur 32-Bit-Ganzzahlrechnung. |
| `zustand.ts` | Aufbau, Klonen, Packen, **kanonischer Schlüssel**, Siegbedingung, Textausgabe. |
| `zuege.ts` | Die eine Regel: `pour`, `giessenZurueck`, `legaleZuege`. Sonst nichts. |
| `verlauf.ts` | `Partie` — Zugprotokoll, Undo-Stapel, Sterne, Tipp. Schnittstelle für Phase 2. |
| `loeser.ts` | `solve()` (A*), `heuristik()`, `bilanzStimmt()`, `loesbar()`, `hint()`, `festgefahren()`. |
| `generator.ts` | `generate(seed, stufe)`, die sechs `STUFEN`, Sternschwellen. |
| `kurve.ts` | Die ausgelieferte Levelfolge: `ANZAHL_LEVEL`, `stufeFuer(nr)`, `seedFuer(nr)`, `ABSCHNITTE`, `blockFuer(nr)`, `istExperte(nr)`. |
| `tagesraetsel.ts` | Das Tagesrätsel: `tagLevel(iso)`, `tagesNummer`, `wochentag`, `tagDavor`/`tagDanach`, Datumsrechnung ohne `Date`. |
| `tagespruefung.ts` | `pruefeTag()` — die Rechnung des Schummelschutzes, ohne Netz und ohne Uhr. |
| `duell.ts` | Duelle: `duellLevel(nummer)`, `duellSieger()`, `botSpielt()`, `naechsteStaerke()`. |
| `duellpruefung.ts` | `pruefeDuell()` / `werteDuell()` — der Schummelschutz der Duelle. |
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
| Tipp | 60 (bis 1.0: 15) |
| Ein Zug zurück aus der Sackgasse | 40 (bis 1.0: 10) |
| Lohn für 1 / 2 / 3 Sterne | 2 / 4 / 8 (bis 1.0: 5 / 12 / 25) |
| Video für Münzen | 30, höchstens 3 je Ortstag |

Seit 1.1.0 knapp — siehe „Version 1.1.0" unter „Aktueller Stand".

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

### Das Tagesrätsel

Ein Level pro Tag, für alle Spieler dasselbe, erzeugt aus dem Datum:
`tagLevel(iso)` ist der **eine** Weg dorthin. Client und Edge Function rufen
dieselbe Funktion — würden sie den Löser mit verschiedenen Budgets aufrufen,
bekäme derselbe Tag zwei verschiedene Bretter, und die Bestenliste wäre Unsinn.
Deshalb steht `TAG_KNOTEN` in der Engine und nicht beim Aufrufer.

**Kein `Date` in `tagesraetsel.ts`, nicht einmal zum Parsen.** `new Date('2026-10-05')`
liest die Zeichenkette als UTC, `new Date('2026-10-05T00:00')` als Ortszeit — ein
Unterschied, der sich an einem Tag im Jahr zeigt und dann für eine ganze Zeitzone das
falsche Rätsel liefert. Die Umrechnung Kalenderdatum ↔ Tageszahl ist deshalb selbst
gerechnet (zwanzig Zeilen, keine Kanten) und im Test über 4.000 Tage und beide
Schaltjahresregeln nachgeprüft — auch 2100, das **kein** Schaltjahr ist.

Die zweite Zeitzonenfalle liegt in `src/lib/serie.ts`: `heute()` setzt das Datum aus
`getFullYear/getMonth/getDate` zusammen und **nicht** aus
`toISOString().slice(0, 10)`. Letzteres wäre UTC und läge für jeden östlich von
Greenwich am Abend einen Tag zurück. Das ist der häufigste Zeitzonenfehler überhaupt,
und der Test prüft ihn mit 23:30 Ortszeit.

**Erzeugt wird auf dem Gerät.** Gemessen über zehn Wochen: im Schnitt 1 ms (Montag) bis
198 ms (Samstag), im schlimmsten Einzelfall 584 ms (ein Freitag) — auf einem Handy also
bis zu zwei Sekunden, deshalb der Ladezustand. Die Zeit steckt nicht in einem zähen
Löserlauf, sondern in der **Summe** der Anläufe, die das Zugband verpassen; die Bänder
der Wochenleiter sind darum bewusst breiter als in `kurve.ts`. Vorgebaut wird nichts: es
gibt unendlich viele künftige Tage, und eine Datei mit zwei Jahren Vorrat wäre in zwei
Jahren still kaputt.

**Der Teiltext ist spoilerfrei.** Geteilt werden Sterne, Zugzahl, Optimum und ein Balken
aus `optimum / zuege` — **keine Farben**. Wer sein Ergebnis in eine Gruppe schickt, darf
das Rätsel damit nicht verraten, sonst teilt es niemand ein zweites Mal. Das ist die
Lehre aus Wordle, und `test-tagesraetsel.mts` prüft ausdrücklich, dass kein Frucht-Emoji
im Text landet.

**Der Schummelschutz rechnet, er glaubt nicht.** Der Client schickt Datum und Zugfolge,
nichts sonst. Der Server baut das Brett selbst, spielt nach und rechnet Zugzahl und
Sterne aus dem Ergebnis. Eine Einsendung „ich hatte drei Sterne" gibt es gar nicht.
Die Rechnung steht in `src/engine/tagespruefung.ts` und ist mit node geprüft; die Edge
Function ist nur Verkabelung.

### Werbung, Kauf und Extra-Glas

**Seit dem 03.10.2026 sind die Anzeigen echt** (`TEST_ANZEIGEN = false` in
`src/lib/werbung.ts`), direkt vor dem ersten Release-Build. Im Browser zeigt die App
weiter nichts — dort fehlt das Plugin. Eigene Live-Anzeigen anzusehen
oder anzuklicken ist ein Richtlinienverstoß — an Josefs AdMob-Konto hängen auch Anigosha,
MyPeak und WELLbooked. Die fünf Schritte vor dem ersten Release-Build stehen im Kopf der
Datei.

**Die Bremse** ist eine reine Funktion (`darfInterstitial`), damit sie ohne AdMob, ohne
Capacitor und ohne Browser prüfbar ist: jedes dritte beendete Level, Mindestabstand zwei
Minuten. Beide Bremsen wirken unabhängig — wer drei Level in zwei Minuten durchspielt,
bekommt trotzdem nur eine Anzeige. Das Tagesrätsel zählt mit, bekommt aber **keine eigene
Gelegenheit**: nach dem einen Rätsel am Tag zuverlässig Werbung wäre die unangenehmste
Stelle im ganzen Spiel.

**Zwei Fallen aus Anigosha sind mitgewandert**, weil sie dort Wochen gekostet haben:

1. **ATT wird nicht von hier gefragt.** Capacitor führt Plugin-Aufrufe auf einer
   Hintergrund-Warteschlange aus, und `ATTrackingManager` zeigt dort nichts an. Gefragt
   wird nativ im AppDelegate; `werbung.ts` *wartet* nur auf die Antwort (mit sechs
   Sekunden Deckel). Genau daran ist Anigosha 1.0 an Apples Richtlinie 2.1 gescheitert.
2. **Die Thenable-Falle** in `kauf.ts`. `Purchases` ist ein Capacitor-Proxy, der jeden
   Eigenschaftszugriff in einen Plugin-Aufruf verwandelt — auch `.then`. Das Objekt ist
   damit ein falsches „Thenable": `await` oder `return` aus einer async-Funktion ruft
   `Purchases.then(...)`, und die Promise löst **nie** auf. Deshalb wird es nur in der
   Hülle `SdkZugang` weitergereicht. In Anigosha war das der „Kauf hängt auf iOS"-Fehler,
   zehn Builds lang.

**Das Extra-Glas** hängt am `Spielstand`, und dort war es nicht vorgesehen — `glaeser` ist
fest. `mitExtraGlas()` baut deshalb einen neuen Stand mit einem leeren Glas **am Ende**.
Angehängt und nicht eingeschoben, und das ist der ganze Trick: alle bestehenden
Glasindizes bleiben gültig, damit bleibt der Undo-Stapel brauchbar (er merkt sich
Indizes).

Drei Folgen, die zusammenhängen:

- **Höchstens ein Extra-Glas je Partie.** Zwei machten aus fast jedem Brett eine
  Fingerübung, und die 999 Level wären umsonst gebaut.
- **Es deckelt die Wertung auf zwei Sterne.** Das Optimum ist für das Brett *ohne* dieses
  Glas bewiesen. Drei Sterne dafür zu vergeben würde die Zusicherung entwerten, auf der
  die ganze Sternwertung ruht.
- **Im Tagesrätsel gibt es kein Extra-Glas.** `replay()` baut das Brett aus dem Level,
  also ohne das zusätzliche Glas; eine Zugfolge, die es benutzt, ist serverseitig nicht
  nachspielbar (`grund: 'index'`). Eine Bestenliste muss vergleichbar bleiben.
- **Der Neustart behält das Extra-Glas.** Wer dafür ein Werbevideo gesehen hat, soll es
  nicht durch einen Neustart verlieren — sonst wird aus der Hilfe eine Falle.

### Die Farben — gemessen, nicht gewählt

Josefs Urteil am 27.09.2026: **„die Gläser und die Farben sehen billig aus."** Das
ließ sich nachrechnen, und die Zahlen gaben ihm recht:

| | vorher | jetzt |
|---|---|---|
| Chroma | 0,14–**0,76**, sieben von neun über 0,5 | 0,14–0,56 |
| L\*-Spanne | 43–91 | 38–91 |
| engster Abstand zweier Farben | **2,8 L\*** | 5,1 L\* |

**Chroma über 0,5 ist die Neon-Palette, die jeder Gratis-Klon benutzt.** Und ein
Abstand von 2,8 L\* heißt: in Graustufen sind die beiden Farben dasselbe. Das war der
eigentliche Grund, warum der Farbenblind-Modus so schwer arbeiten musste.

Die neue Leiter folgt dem, was der Saft **wirklich** ist — Kaffee dunkel (L\* 38),
Kokos hell (91), und **Blaubeere ist endlich tief statt Himmelblau** (48 statt 67).
Gesetzt wurden die Werte nicht nach Gefühl, sondern gesucht: zu Farbton, Ziel-Helligkeit
und Ziel-Chroma den passenden Hexwert.

**Drei Töne je Farbe statt zwei.** `tief` ist neu und trägt den Fuß jeder Schicht:
Flüssigkeit ist unten tiefer und damit dunkler. Vorher war eine Schicht eine flache
Fläche mit einem hellen Streifen obendrauf — der zweite Grund für „billig".

**Kräftiger, am 05.11.2026** (Josef: „Ich will kräftigere Farben"). Das Chroma
aller Töne ist in OKLCH um bis zu 35 % gehoben, die **Helligkeit unverändert** —
so bleiben die Graustufen-Abstände, an denen der Farbenblind-Modus hängt (engster
Abstand jetzt 5,6 L\*). Rot und Orange lagen schon am Rand von sRGB und gewinnen
kaum; Blau, Gelb, Lila, Minze und Grün deutlich. Kokos bleibt, Kaffee +15 %.
Dazu ist der Quer-Schleier über dem Saft (Weiß 0,30 → 0,20, Schwarz 0,34 → 0,26)
leiser. Die Strohhalm-Streifen in `tools/garnitur-bilder.mjs` tragen die neuen
`tief`-Töne. Mehr ginge nur mit Display-P3.

### Läufe, nicht Schichten (27.09.2026)

Josefs Urteil nach der dritten Runde: **„es geht in die richtige richtung aber
sieht noch billig aus"** und **„es soll smoother sein"**. Die Bewegung war da
schon in Ordnung — das Problem saß in der Flüssigkeit selbst.

Vier gleiche Schichten übereinander wurden als **vier Blöcke mit drei dunklen
Trennlinien** gezeichnet, und jeder trug denselben Verlauf hell→tief noch
einmal. Das ist ein Stapel Bauklötze, kein Saft. Aufeinanderfolgende gleiche
Farben sind jetzt **ein Körper**: ein Verlauf über die ganze Höhe, eine
Oberfläche, keine Naht. Die dunkle Linie bleibt genau dort, wo sie hingehört —
zwischen zwei **verschiedenen** Flüssigkeiten.

*Zählen muss man sie trotzdem können* — ob ein Glas zwei oder drei einer Farbe
hat, entscheidet den nächsten Zug. Dafür trägt ein Lauf ein hauchdünnes helles
Härchen je Schichtgrenze (`repeating-linear-gradient` mit `calc(100% / n)`,
Deckkraft 0,07): sichtbar genug zum Zählen, zu schwach, um zu trennen.

Zwei Folgen, die daran hängen:

- **Das Farbenblind-Zeichen gehört auf jede SCHICHT, nicht auf jeden Lauf.**
  Sonst trüge ein Lauf aus vier Schichten nur ein Zeichen, und der Modus zählte
  nicht mehr mit. Der Lauf enthält deshalb eine Spalte aus `n` gleich hohen
  Fächern.
- **Beim Eingießen steigt EIN Lauf**, nicht vier Schichten nacheinander.
  Gegossen wird immer nur eine Farbe, und gleiche Farben sind ein Körper: er
  wächst in einem Zug von seiner alten auf seine neue Höhe (`--von` im Stil,
  Keyframes mit nur einem `from`). Goss man Lila auf Lila, fiel er vorher erst
  auf null zusammen und baute sich neu auf.

Dazu drei Dinge in `Glas.tsx`:

1. **Der Meniskus liegt nur auf dem OBERSTEN Lauf.** Nur sie hat eine echte
   Oberfläche; auf den Schichten darunter wäre er eine Kante, die es nicht gibt.
2. **Die Grenze zwischen zwei Flüssigkeiten ist eine dunkle Linie**, keine Rasierklinge
   (`inset 0 1px 0`) — und nur zwischen **verschiedenen** Farben, siehe oben.
3. **Die Gläschen sind Hohlkugeln** — heller Rand, klarer Kern. Vorher drei satte weiße
   Punkte, die sich als Flecken lasen.

Und in `.glas-licht`: die Kanten sind **kein Schwarz** mehr, sondern ein sehr dunkles
Blau — reines Schwarz auf farbiger Flüssigkeit liest sich als Schmutz. Außen liegt je
eine hauchdünne **helle** Linie; eine Glaskante fängt Licht, ohne sie endet das Glas im
Nichts. Das war der Unterschied zwischen Plastikrohr und Glas.

**Vier Zusicherungen in `test-engine.mts` halten das fest**, und das ist der Punkt:
Mindestkontrast 3:1 je Zeichen, die eingetragene Tinte muss die bessere der beiden sein,
keine zwei Farben enger als 4 L\*, und `tief < ton < hell`. Vorher stand der
Kontrast als **Kommentar** in dieser Datei („2,2:1") und die Tinte als Liste von Hand in
`Symbole.tsx`. Ein Kommentar hält niemanden auf — beim Neusetzen der Töne brauchte
plötzlich auch Blaubeere helle Tinte, und das hätte man wieder nur im Screenshot
gesehen.

### Die Bar als Ort — `.brett-reihe`, `.brett-leiste`, `.theke`

Bis zum 27.09.2026 stand das Brett mittig in einer leeren Fläche: oben Fischschuppen,
unten Fischschuppen, dazwischen schwebende Gläser. Das Thema ist eine **Bar** — also
bekommt das Brett eine.

**Das Brett ist keine eine Gitterfläche mehr, sondern eine Spalte aus Reihen.** Jede
Reihe trägt dasselbe Spaltenraster (`repeat(proReihe, minmax(0,1fr))`), damit eine halb
gefüllte letzte Reihe weiter linksbündig steht wie vorher — und damit sie eine **eigene
Leiste** bekommen kann, auf der sie steht.

**Der Tresen hängt an der Unterkante des Bretts** (`top: 100%` auf `.theke`), nicht an
einer festen Höhe. Das ist keine Kosmetik, sondern genau der Fall, für den er gebaut
ist: das **Extra-Glas** kann aus zwei Reihen drei machen. Gemessen bei 390×844:

| Gläser | Raster | Bretthöhe | Luft |
|---|---|---|---|
| 6 | 2×3 | 352 px | reichlich |
| 10 | 2×5 | 317 px | reichlich |
| **11 = 10 + Extra-Glas** | **3×4** | **539 px** | **63 px** |
| 12 | 3×4 | 539 px | 63 px |
| 13 / 14 / 15 | 3×5 | 487 px | 115 px |

**539 px ist die Decke, und 332 der 999 Level stoßen heute schon dagegen.** Elf Gläser
haben exakt dasselbe Raster wie zwölf — das Extra-Glas erzeugt also **keinen** neuen
schlimmsten Fall. Zwei Übergänge kosten eine ganze Reihe (`reihen = ceil(n/5)`):
10 → 11 (+222 px, 40 Level) und 5 → 6 (+210 px, 5 Level, die ersten). Überall sonst
ändert sich nichts oder das Brett wird kürzer.

**Das Brett ist unten ausgerichtet**, nicht mittig (`items-end` plus `pb-[96px]`). Die
96 px sind die Höhe des Tresens, und sie ist **konstant** — eine Bar hat nicht bei jedem
Level eine andere Theke. Der Platz darüber ist die Rückwand.

*Eine Falle, die beim Umbau sofort zugeschnappt ist:* Der Tresen ist absolut
positioniert und **übermalte die Fußzeile**. Ein absolut positioniertes Element zeichnet
über den statischen Inhalt späterer Geschwister — der Tipp-Knopf war im Screenshot
schlicht weg, ohne Fehler, ohne Konsolenzeile. Die Fußzeile trägt deshalb `relative`.
Gefunden nur, weil ein Screenshot angesehen wurde; kein Test hätte das gemeldet, denn
im DOM war alles da und an der richtigen Stelle (nachgemessen: alle vier Knöpfe bei
y 774, 54 px hoch).

`overflow-hidden` auf `<main>` schneidet ab, was Tresen (`left/right: -50vw`,
`height: 100vh`) über den Rand hinaus zeichnen. Die Fenster darüber sind `fixed` und
bleiben davon unberührt — die hängen am Bildschirm, nicht an `<main>`.

### Der Feinschliff — 01.10.2026

Josefs Wahl aus vier vorgelegten Baustellen: alle vier.

1. **Die Rückwand** (`src/components/Rueckwand.tsx`): zwei Hängelampen mit Lichtkegel
   und ein Regal mit Flaschen, Karaffe, Obstschale und Beerenglas. Vorher war bei
   kleinen Brettern zwei Drittel des Schirms leere Fischschuppen. Ein SVG, `z-index: -1`,
   **leise** — die Formen liegen kaum heller als der Grund, Farbe nur stark abgedunkelt.
   Die neun Säfte bleiben das Lauteste auf dem Schirm.
2. **Größere Gläser auf kleinen Brettern:** bis zwei Reihen 88 px je Spalte statt 74
   (Deckel weiter 340 px). Ab drei Reihen bleibt es bei 74 — dort liegt die Decke von
   539 px.
3. **Der Tresen ist Holz:** Platte mit Maserung und Glanz, Kante mit Lichtlinie, Front
   aus senkrechten Brettern — alles Verläufe, keine Bilddatei. Die vorderste Glasreihe
   **spiegelt sich** darin (`-webkit-box-reflect`, gibt es in WebKit und Chromium, also
   auf beiden Store-Plattformen). Nicht beim Kippen: die Spiegelung dreht sich mit.
4. **Das gewählte Glas fängt Licht** statt einen Zitrus-Rahmen zu tragen: warme Kante
   (`--color-glasrand-warm`), weicher Schein, Federn beim Anheben (14 px).
5. **Der Sieg in drei Takten**, alles CSS mit Verzögerung, kein Zeitgeber in JS (der
   Oberflächentest liest das Fenster nach 500 ms — es steht sofort im DOM, nur noch
   unsichtbar): ab 560 ms (das Ende des letzten Gusses) hebt sich jedes volle Glas
   kurz an und leuchtet in **seiner** Farbe, als Welle; bei drei Sternen Funken in den
   Saftfarben; ab 1000 ms kommt die Karte **von unten**, die Sterne springen einzeln.
   Kein Unschärfe-Schleier mehr — das gelöste Brett bleibt oben sichtbar.

*Eine Falle, die dabei aufgeflogen ist:* `<main>` trug `overflow: hidden`, und ein
solches Element ist trotzdem ein **Scrollbehälter**. Beim Durchspielen stand das ganze
Brett plötzlich 465 px höher und 63 px weiter links — ohne dass irgendwer gescrollt
hatte. Unter dem alten Schleier fiel das nie auf. Jetzt `overflow: clip` (Klasse
`.buehne`, mit `hidden` davor für alte WebViews): schneidet ab, scrollt nie.

### Wo Gelb erlaubt ist

Die neun Säfte sind das Lauteste auf dem Schirm; alles andere hat leise zu sein. In der
alten Kopfzeile standen **vier gelbe Dinge nebeneinander** — Münzchip, Zugzähler, drei
Sterne, dazu Zitrone als Spielfarbe. Und die **größte Zahl auf dem ganzen Schirm war der
Zugzähler**, die unwichtigste Angabe darauf.

Jetzt: links, wo ich bin und was ich habe (Level, Münzen); rechts das Ziel (Sterne groß,
Zugzahl klein darunter). Zwei Gelbtöne, und sie bedeuten Verschiedenes:

- **`--color-zitrus` `#FFC93C` ist Licht** — Sterne, Werte, Münzen.
- **`--color-messing` `#E8B04B` ist Metall** — Leisten, Tresenkante, der Rand der
  runden Knöpfe. In einem Ton wären beide im selben Gelb verschwunden.

Der **Hauptknopf ist der einzige gefüllte Knopf** auf dem Spielbildschirm. Vorher war er
ein blauer Kasten mit gelber Schrift und von den beiden runden Nebenknöpfen kaum zu
unterscheiden — welcher der drei der Hauptweg ist, stand nur in der Breite.

Die runden Knöpfe der Fußzeile stehen seit dem Umbau auf **Holz** und tragen deshalb
`knopf-bar`: warme Kante, hellere Füllung. Die blaue Kante verschwand dort fast.

**Der Deckel des Extra-Glases steht jetzt während der Partie da**, nicht erst im
Siegfenster — also nicht erst, wenn es zu spät ist, sich anders zu entscheiden.

### Emoji in der Oberfläche

Es gab noch zwei: 🍹 auf der Tagesrätsel-Karte und 🔥 in der Serienzeile. Beide sind
gezeichnet ersetzt, aus demselben Grund wie die Farbzeichen in `Symbole.tsx` — ein Emoji
sieht auf jedem Gerät anders aus, und auf manchen gar nicht.

**Im geteilten Text bleiben Emoji.** Dort sind sie der Inhalt, nicht die Oberfläche.

### Der Giesszug — das Glas hebt sich und kippt

Bis zum 27.09.2026 drehte sich die Quelle um **acht Grad auf der Stelle**
(`.glas-kippt`, 200 ms). Das las sich als Wackeln, nicht als Gießen. Josefs
Ansage: das Glas soll *aufgehoben und umgeleert* werden. Jetzt hebt es sich
26 px an, wandert ein Stück zum Ziel und kippt ihm die Öffnung entgegen.

Fünf Dinge daran sind Entscheidungen, keine Zahlen:

1. **Die Bewegung liegt auf dem Glaskörper, nicht auf dem Knopf.** Der Knopf
   ist die Trefferfläche. Wandert er während des Gießens vierzig Pixel zur
   Seite, zielt der nächste Tipp ins Leere oder auf den Nachbarn — und der
   Oberflächentest tippt im Abstand von 45 ms, ein Mensch ist kaum langsamer.
   So bleibt der Knopf stehen und nur das Bild bewegt sich.
2. **Der HUB ist gerechnet, nicht fest** (27.09.2026). Ein fester Hub war ein
   echter Fehler: beim Gießen aus der unteren in die obere Reihe hob sich das
   Glas um 54 px, das Ziel lag aber 220 px höher — **der Strahl lief bergauf.**
   Josefs Meldung: „wenn ich von der unteren reihe etwas in die obere reihe
   fülle, bewegt sich das glas nicht hoch genug". Gerechnet wird jetzt, wo die
   Öffnung nach dem Kippen *ohne* Hub läge, und von dort aus muss sie
   `KIPP_LUFT` (26 px) über die Öffnung des Ziels. Gemessen über alle 21
   legalen Züge auf Level 121: bei einem Zug nach oben springt der Hub von
   −54 auf −213 px.
3. **Die Wanderung ist der REST.** Bei 54 × 140 px und
   `transform-origin: 50% 72%` schiebt eine Drehung um 34 Grad die Öffnung
   schon rund 56 px zur Seite — fast eine ganze Spalte. Das Glas wandert
   deshalb nur noch `dx − Schwung`, also genau so weit, dass die Öffnung über
   der **Mitte des Zielglases** steht: es hält wirklich darüber, statt daneben
   zu stehen und zu spucken (Josef, 27.09.2026). `KIPP_MAX` (72 px) deckelt
   das — bei einem Ziel fünf Spalten weiter soll kein Glas quer durch die Bar
   reisen; dort übernimmt der Strahl den Rest.
   *Der erste Anlauf nahm stattdessen einen festen Anteil des Abstands (22 %,
   höchstens 34 px) und hob nur 26 px. Josefs Urteil: „nicht schlecht, aber
   könnte besser sein" — das Glas neigte sich neben dem Ziel, statt darüber zu
   gehen. Der Hub steht jetzt auf 54 px.*
4. **Wohin, entscheidet `Brett.tsx`**, und zwar in dem `useLayoutEffect`, das
   ohnehin beide Gläser misst — `Glas` kennt seine eigene Lage nicht. Übergeben
   wird es als drei CSS-Variablen auf dem Knopf (`--kipp-x`, `--kipp-y`,
   `--kipp-winkel`); der Körper erbt sie. Das kostet kein Neuzeichnen, und weil
   `useLayoutEffect` vor dem Zeichnen läuft, stehen die Werte, bevor die Klasse
   zum ersten Mal wirkt.
5. **Der Strahl beginnt an der Öffnung des gekippten Glases**, nicht an der
   Kante des stehenden: `0,72 · Höhe · sin(Winkel)` zur Seite,
   `0,72 · Höhe · (1 − cos(Winkel))` nach unten, plus Hub und Wanderung. Und
   die ersten **46 %** von `guss-fliesst` sind leer — genau die 230 ms, die das
   Glas zum Kippen braucht. Ohne das hing der Strahl ein paar Bilder lang neben
   einem Glas, das noch gerade stand.

**Die Stapelordnung sitzt auf dem Knopf** (`.glas-giesst`), nicht auf dem
Körper: das kippende Glas ragt weit über seinen Nachbarn, und auf dem Körper
verschwand es hinter dem nächsten Glas.

`KIPP_MS` (540 ms) steht in `Brett.tsx` **neben** der Bahn und nicht in
`App.tsx`, wo der Zeitgeber läuft: Bewegung und Zeitgeber müssen dieselbe Zahl
sehen, sonst richtet sich das Glas auf, während der Strahl noch fließt.
`raeumeGuss()` in `App.tsx` löscht Strahl **und** Kippung zusammen — beide
zeigen auf Glasindizes, und bei Undo, Neustart, Rückkauf oder Levelwechsel
neigte sich sonst ein Glas, das nie gegossen hat.

*Aufnehmen lässt sich das nicht mit einem Screenshot* — die Bewegung dauert
500 ms, eine Aufnahme länger. Wer sie prüfen will, schaltet den Übergang per
`addStyleTag` ab (`transition: none`, `animation: none`, `stroke-dashoffset: 0`)
und tippt; dann steht die Endstellung sofort und fällt noch in die 500 ms, in
denen die Stapelordnung gilt. Ein bloßes *Bremsen* reicht nicht: der Zeitgeber
ist JavaScript und lässt sich von CSS nicht aufhalten.

Die Flüssigkeit dreht sich mit dem Glas, statt waagrecht zu bleiben. Das ist
physikalisch falsch und bleibt trotzdem: die Schichten sind gestapelte
Elemente, eine Gegendrehung würde sie scheren. Bei 500 ms sieht es niemand.

### Gießstrahl und Bar-Geräusche

**Der Strahl** (`Brett.tsx` plus `.guss-maske` in `index.css`) wird **gemessen, nicht
gerechnet**: die Gläser stehen in einem Raster, dessen Pixelmaße von der Displaybreite
abhängen. Zwei `getBoundingClientRect` sind billiger und ehrlicher, als die
Rasterarithmetik ein zweites Mal nachzubauen — und sie bleiben richtig, wenn jemand am
Layout dreht.

**Er ist eine FLÄCHE, kein Strich** (27.09.2026). Josefs Urteil zur ersten Fassung:
„Es sieht billig aus. Es soll mehr danach aussehen als würde man eine Flüssigkeit
reinleeren." Beides stimmte, und es waren zwei verschiedene Fehler:

1. **Ein Strich hat überall dieselbe Breite** und sieht damit gezogen aus, nicht
   gegossen. `band()` tastet die Bézierkurve an 20 Stellen ab und trägt an jeder die
   Normale ab — oben `0,15 + 0,045 · menge` der Glasbreite, unten **45 %** davon.
   Fallende Flüssigkeit wird schneller und damit dünner, und die Menge entscheidet
   mit: vier Schichten sind ein Schwall, eine ein Rinnsal.
2. **Quer, nicht längs schattiert.** Der Verlauf liegt auf der Normalen der Sehne:
   `tief` an beiden Kanten, `ton`, `hell`, und bei 42 % ein **Spitzlicht** aus
   `heller(hell, 0,62)`. Ohne das ist der Strang ein flaches Rohr in einer Farbe.
   Die Aufhellung ist **gerechnet und nicht `color-mix()`** — das gibt es in älteren
   WebViews nicht, und ein Verlauf, der dort still auf die Grundfarbe zurückfällt,
   kostet genau das Glanzlicht, um das es geht.

**Fließen lässt ihn eine MASKE.** Ein Strich auf der Mittellinie, dessen sichtbares
Stück erst wächst (der Kopf läuft nach unten) und dann nach vorne wegrutscht (der
Schwanz hebt ab, der Rest fällt ins Glas) — `stroke-dasharray` von `0 2` auf `1 2` und
zurück auf `0 2` bei `stroke-dashoffset: -1`. **Kein Verblassen:** ein Strahl, der
ausgeblendet wird, sieht aus wie ein Bild, das verschwindet; einer, der ausläuft, sieht
aus wie Flüssigkeit, die alle ist.

**Und das Wichtigste: das ZIELGLAS füllt sich.** Vorher war die Flüssigkeit schon da,
bevor der Strahl losging — der Strahl zeigte auf ein Ergebnis, das es bereits gab, und
kein noch so schöner Strahl macht daraus ein Eingießen. `Brett` reicht dem Zielglas
`fuellt: { menge, nr }` durch; der oberste **Lauf** wächst von seiner alten auf seine neue Höhe
(`.schicht-fuellt`, siehe „Läufe, nicht Schichten"). Drei Feinheiten:

- Der Schlüssel der Schicht trägt die **Gussnummer** mit. Ohne das nimmt React dasselbe
  Element wieder her, und eine CSS-Bewegung, die schon gelaufen ist, läuft an einem
  bestehenden Element kein zweites Mal los.
- `animation-fill-mode: backwards`. Sonst blitzt der Lauf in voller Höhe auf, bevor
  seine Verzögerung abläuft.
- Die Keyframes haben **nur ein `from`**. Die Zielhöhe ist die, die das Element ohnehin
  hat — sie steht als Prozentwert im Stil und hängt an der Zahl der Schichten.

Die **350 ms** Verzögerung stehen in `Glas.tsx` und entsprechen den 66 % in
`guss-fliesst`, wo der Kopf des Strahls ankommt. Laufen die beiden Zahlen auseinander,
füllt sich das Glas, bevor etwas fließt — oder erst, wenn längst nichts mehr fließt.

Drei Dinge, die dabei nicht verhandelbar sind:

1. **Er hält nichts auf.** `pointer-events: none`, und der Zug ist längst gespielt,
   wenn die Bewegung beginnt. Ein Strahl, auf den das Spiel warten müsste, wäre bei
   einer Folge schneller Züge eine Bremse — der Oberflächentest tippt im Abstand von
   45 ms, ein Mensch ist kaum langsamer.
2. **Er verschwindet mit dem Brett.** Undo, Neustart, Levelwechsel, Tagesrätsel, Duell:
   überall räumt `raeumeGuss()` ihn weg. Sonst zeigte er auf Gläser eines Bretts, das es
   nicht mehr gibt. *Genau das ist beim Einbau passiert und vom Test gefangen worden* —
   der Rückkauf räumte ihn weg, der normale Undo-Knopf nicht.
3. **`pathLength="1"`.** Damit laufen die Dash-Werte in Anteilen der Bahn statt in
   gemessenen Pixeln, und ein `key` je Guss sorgt dafür, dass zweimal derselbe Zug auch
   zweimal fließt.

*Eine Falle beim Aufnehmen, die zweimal zugeschnappt ist:* Ein Screenshot zeigt die
Bewegung nicht — sie dauert 500 ms, eine Aufnahme länger. Beim ersten Anlauf wurden die
CSS-Bewegungen über `document.getAnimations()` angehalten, **der JS-Zeitgeber für das
Kippen aber nicht**: im Bild floss ein Strahl aus einem Glas, das längst wieder gerade
stand. Beim zweiten summierten sich die Wartezeiten, statt absolut zu sein, und die
Bilder lagen hinter dem Ende. Was funktioniert: alle Bewegungen per `addStyleTag` um
denselben Faktor strecken, die Kippstellung über die auf dem Quellglas
stehengebliebenen CSS-Variablen festhalten, und ab dem Guss **absolut** messen.

**Die Geräusche** (`src/lib/klang.ts`) kommen **ohne Tondateien** aus: gefiltertes
Rauschen für das Gießen, ein paar Sinustöne für den Rest. Drei Gründe, der dritte ist
der wichtigste:

1. Null Bytes im Bundle. Fünf brauchbare `.mp3` wären schnell 150 KB — mehr als die
   halbe Levelfolge.
2. Offline sicher. Eine fehlende Tondatei wäre ein stummer Fehler, genau wie bei den
   Schriften.
3. **Die Länge richtet sich nach dem Zug.** Ein Guss von vier Schichten klingt länger
   als einer von einer; mit einer festen Datei ginge das nur durch Abschneiden.

**Die Regeln liegen in `klangregeln.ts`, nicht in `klang.ts`** — und dieser Schnitt hat
einen handfesten Grund: `tsconfig.node.json` hat bewusst **keine DOM-Typen**, weil das
der Schutz ist, der die Engine nach Deno portierbar hält. `klang.ts` braucht
`AudioContext` und kann deshalb nie in dieses Projekt; die reine Rechnung
(`gussDauer`, `siegToene`) schon. `test-klang.mts` prüft die Trennung ausdrücklich mit,
sonst wandert sie beim nächsten Umbau zurück und `npm run build` fällt mit „Cannot find
name AudioContext".

*Zwei Fehler sind beim Bauen des Tests aufgeflogen, und beide sind derselbe:* Eine
Zusicherung verbot das Wort `.mp3` in `klang.ts` — und fiel über den eigenen Kommentar,
der erklärt, warum es keine `.mp3` gibt. Dieselbe Falle ein zweites Mal bei
`AudioContext` in `klangregeln.ts`. **Ein Test, der die Begründung verbietet, ist
keiner.** Geprüft wird jetzt das Laden bzw. der Code ohne Kommentare.

**Die Autoplay-Regel:** der `AudioContext` entsteht **lazy**, beim ersten Geräusch — und
das kommt immer aus einer Geste. Ein Context, der beim Laden der Seite angelegt wird,
bleibt in `suspended` hängen und gibt bis zum Neuladen keinen Ton.

### Duelle — `src/engine/duell.ts`

Beide bekommen dasselbe Brett, wer weniger Züge braucht, gewinnt. Gespielt wird
**zeitversetzt**, nicht gleichzeitig: ein Echtzeit-Duell braucht eine offene
Verbindung, und die zerbricht auf dem Handy bei jedem Wechsel in den Hintergrund.

Wie beim Tagesrätsel ist `duellLevel(nummer)` der **eine** Weg zum Brett, und
`DUELL_KNOTEN` steht in der Engine statt beim Aufrufer — zwei verschiedene
Knotendeckel ergäben für dasselbe Duell zwei verschiedene Bretter.

**Gleich viele Züge sind ein Remis, und das bleibt so.** Naheliegend wäre ein Stechen
über die Zeit oder über „wer zuerst eingereicht hat". Das erste belohnt das schnellere
Telefon, das zweite die günstigere Zeitzone. Und bei einem Brett, dessen Optimum
bewiesen ist, heißt gleich viele Züge wirklich gleich gut gespielt.

**Der Bot spielt das Brett wirklich durch.** Naheliegend wäre gewesen, ihm eine Zahl zu
geben („Optimum plus vier"). Drei Nachteile: die Zahl ließe sich nicht nachspielen, sie
könnte unerreichbar sein, und man müsste erklären, warum der Gegner keine Züge hat. So
entsteht eine echte Zugfolge, die durch `replay()` geht — und damit auch serverseitig
auswertbar wäre.

Billig ist es trotzdem: der Bot folgt der kürzesten Lösung und biegt nur an wenigen
Stellen ab; nach jedem Umweg rechnet er **einmal** neu. Ein Bot, der bei jedem Zug den
Löser fragte, bräuchte zwanzig Löserläufe statt fünf. Gemessen: langsamster Lauf 32 ms.

*Hier ist ein Fehler aufgeflogen, der es wert ist, aufgeschrieben zu werden:* Gezählt
wurde zunächst jeder Zug, der von `plan.zuege[0]` abwich. Viele Bretter haben aber
**mehrere gleich gute erste Züge** — ein anderer Zug ist also noch lange kein Fehler.
„leicht" spielte damit auf manchen Brettern das Optimum. Gezählt wird jetzt nur ein Zug,
der die Partie wirklich verlängert (`neu.zuege.length >= plan.zuege.length`).

| Stufe | Zuschlag über dem Optimum (gemessen über 12 Bretter) |
|---|---|
| leicht | +7,8 |
| mittel | +3,1 |
| stark | +1,8 |

**„stark" spielt nie das Optimum** (`UMWEGE.stark = [1, 2]`, nicht `[0, 0]`). Ein Bot,
der immer die kürzeste Lösung spielt, wäre unschlagbar — bestenfalls Remis, und damit
wäre die oberste Stufe keine Aufgabe, sondern eine Wand. So gewinnt genau die perfekte
Partie, und der Duellsieg hängt an derselben Zusicherung wie die drei Sterne.

**Duelle zahlen keine Münzen.** Ein Duellbrett gehört zu keinem Level, also gäbe es kein
„nur die Verbesserung" — jede Partie würde zahlen, und die Währung wäre farmbar. Der
Lohn ist die Bilanz. Aus demselben Grund gibt es im Duell **kein Extra-Glas** und kein
„Nochmal" auf demselben Brett: der Gegner hat seine Zugzahl bereits.

**Wer sich festfährt, kann aufgeben** statt die Partie liegen zu lassen. Serverseitig ist
„gültig gespielt, aber nicht gelöst" genauso ein Ergebnis — `pruefeDuell` weist es nicht
ab, es zählt als Niederlage.

**Menschliche Gegner brauchen die Datenbank.** `supabase/migrations/0002_duelle.sql`
paart nur Menschen und hat **keine Bots in SQL**: Anigosha lässt Bots „lazy" in SQL
ziehen, weil eine Quizantwort eine Zahl ist — hier müsste ein Bot ein Sortierpuzzle
spielen, und das kann nur die Engine. Findet sich in zehn Minuten kein Gegner, läuft das
Duell ab, und der Client bietet ein Botduell an. Das braucht keine Datenbank.

### Die nativen Projekte — `ios/` und `android/`

Beide liegen **im Repo** und werden getrackt; nur die Build-Artefakte sind
gitignored (`.gitignore` deckt jetzt auch `*.jks` und `android/keystore.properties`
ab — der Release-Workflow schreibt beide in den Arbeitsordner, und der
Upload-Schlüssel ist unersetzlich).

Nach jeder Änderung am Web-Teil: `npm run build && npx cap sync`. Nach einer
Änderung an `tools/vorlagen/app-symbol.jpg`: `node tools/app-icons-bauen.mjs` und
`node tools/icons-bauen.mjs`.

#### Die ATT-Falle, die Anigosha nicht hatte

Die ATT-Abfrage ist wortgetreich aus `anigosha/ios/App/App/AppDelegate.swift`
übernommen — **außer der Stelle, an der sie steht**, und das ist der ganze Punkt.

Capacitor 8 legt für neue Projekte einen `SceneDelegate` an und trägt ein
`UIApplicationSceneManifest` in die `Info.plist` ein. Ab da ruft iOS
`applicationDidBecomeActive` auf dem AppDelegate **nicht mehr auf**. Genau dort
steht die Abfrage in Anigosha (dessen Projekt mit einer älteren Capacitor-Fassung
angelegt wurde und kein Scene-Manifest hat). Eine wörtliche Übernahme wäre hier
also toter Code gewesen: kein Dialog, kein Fehler, keine Zeile in der Konsole —
und die Rückmeldung wäre Apples Ablehnung nach Richtlinie 2.1 gekommen, dieselbe,
die Anigosha 1.0 zehn Builds gekostet hat. Sie hängt jetzt an
`sceneDidBecomeActive`, und `test-release.mts` prüft beides: dass sie dort steht,
und dass sie **nicht** im AppDelegate steht.

Die drei Dinge, die für iOS zusammenstimmen müssen, bleiben dieselben:
`NSUserTrackingUsageDescription` in der `Info.plist`, die native Abfrage, und in
App Store Connect „Tracking: ja" (nur von Hand, Rolle Admin/Account Holder).

#### Die Beispiel-IDs, und warum sie gefährlicher sind als keine

**Seit dem 26.09.2026 sind die App-IDs echt** — die beiden AdMob-Apps „FixTheMix"
sind angelegt:

| Plattform | App-ID | steht in |
|---|---|---|
| iOS | `ca-app-pub-8860791993288062~8461231878` | `ios/App/App/Info.plist` |
| Android | `ca-app-pub-8860791993288062~4290052573` | `android/app/src/main/AndroidManifest.xml` |

Seit dem 03.10.2026 stehen auch die vier echten **Anzeigenblöcke** im Spiel
(`TEST_ANZEIGEN = false`). Bis dahin liefen Googles Test-Blöcke neben den echten
App-IDs — kein halber Zustand: eine **App-ID** (mit Tilde) sagt dem SDK nur, welches
Konto die App ist, ausgeliefert wird nach den **Blöcken** (mit Schrägstrich).

Weglassen ging in keinem Zustand: fehlt die App-ID, stürzt das AdMob-SDK beim Start
ab, mit einer Meldung, die nicht nach AdMob klingt. Deshalb standen dort bis heute
**Googles öffentliche Beispiel-App-IDs** (`ca-app-pub-3940256099942544~…`).

Der gefährliche Zustand ist **echte Anzeigen mit einer Beispiel-App-ID**: das SDK
startet gegen eine fremde Kennung und liefert gar nichts aus. `test-release.mts` prüft
deshalb nicht „ist es echt", sondern „passt es zusammen" — und läuft damit in beiden
Zuständen grün.

*Hier stand bis zum 26.09.2026 eine zu strenge Regel, und Josefs Frage hat sie
aufgedeckt* („Kann ich AdMob schon anlegen, obwohl nichts eingereicht ist?"). Verlangt
wurde, dass bei Test-Anzeigen **auch** die App-IDs Googles Beispiel-Kennung tragen —
begründet damit, eine echte App-ID würde die AdMob-Statistik mit Scheinabrufen füllen.
**Das stimmt nicht:** Googles Test-Anzeigenblöcke gehören Google, Abrufe darauf
erreichen das eigene Konto gar nicht, egal welche App-ID danebensteht.

Die Regel verbot damit ausgerechnet den nützlichsten Zwischenstand: AdMob-App angelegt,
echte App-IDs in `Info.plist` und `AndroidManifest.xml`, ausgeliefert werden weiter
Test-Anzeigen. Genau so entwickelt man vor dem Launch. Geprüft wird jetzt nur noch, was
wirklich schadet — und dass bei Test-Anzeigen alle vier Blöcke Googles Test-IDs sind.

#### `tools/test-release.mts` — zwei Betriebsarten

| Aufruf | Prüft | Heute |
|---|---|---|
| `node tools/test-release.mts` | **Stimmigkeit**: Bundle-ID an sieben Stellen, Versionen gleich, Test/Produktion passen zusammen, ATT an der richtigen Stelle, Symbolgrößen, Schlüssel im `.gitignore`, jedes Secret der Workflows in der Anleitung | grün |
| `node tools/test-release.mts --release` | zusätzlich die **Bereitschaft**: `TEST_ANZEIGEN = false`, echte App-IDs, vier gefüllte Anzeigenblöcke | grün seit dem 03.10.2026; vorher war die Ausgabe die Liste dessen, was noch fehlte |

Die zweite Fassung ruft `npm run test:release` auf, und das ist der erste Schritt
beider Release-Workflows. Ein Build mit Test-Anzeigen kommt damit gar nicht erst
bis zum Signieren. Der 1.000er-Lauf des Generators bleibt aus `test:release`
bewusst draußen: 148 s, und er hängt an nichts, was ein Release-Build ändert.

Zwei Prüfungen darin sind Selbstkontrollen der Werkzeuge, und die sind mehr wert,
als sie aussehen: die Workflows lesen `versionCode` und `CURRENT_PROJECT_VERSION`
mit `grep` aus den Projektdateien — ändert sich dort die Schreibweise, lesen sie
still eine leere Zeichenkette. Und jedes `secrets.X` aus beiden Workflows muss in
`docs/release-ci.md` stehen, sonst legt niemand es an und der Lauf scheitert
später mit „leer".

### Der Aufbau der App — Routen statt Fenster

Seit Phase 5 hat die App einen Router, und zwar nicht aus Schönheit: **Apple und Google
verlangen eine öffentlich erreichbare Datenschutz-URL**, Google Play zusätzlich eine
Adresse für den Weg zur Datenlöschung. Beides muss ohne App und ohne Anmeldung aufrufbar
sein — ein Fenster über dem Spiel hat keine Adresse, die man in ein Store-Formular
eintragen kann. Dass Cloudflare alles auf `index.html` umleitet (`wrangler.jsonc`), ist dafür die
Voraussetzung.

**Am 27.09.2026 ist daraus ein richtiger Aufbau geworden** (Josefs Entscheidung):

| Adresse | Was |
|---|---|
| `/` | **Startbildschirm** (`src/pages/Start.tsx`) — die Haustür |
| `/spiel` | Die Levelfolge |
| `/tagesraetsel` | Das Rätsel des Tages |
| `/duell` | Ein Duell |
| `/level` | Die Levelwahl (`src/pages/LevelSeite.tsx`) |
| `/einstellungen`, `/impressum`, `/datenschutz`, `/nutzungsbedingungen`, `/daten-loeschen` | wie bisher |

**Vorher lag unter `/` sofort ein Level**, und Levelwahl, Tagesrätsel, Duelle und
Einstellungen steckten alle in **einem Fenster über dem Spiel**, erreichbar nur über den
Burger in der Kopfzeile. Die gesamte Navigation hing damit an einem Knopf innerhalb des
einzigen Bildschirms, den es gab. Drei Folgen, alle unangenehm:

1. **Nichts davon hatte eine Adresse.** Ein Neuladen im Tagesrätsel landete in der
   Levelfolge.
2. **Die App öffnete mitten in einer Partie**, ohne Anfang, ohne Titel.
3. **Der Modus war ein Zustand statt eines Ortes** — „ich bin im Duell" stand in einem
   `useState`, nicht in der URL.

Jetzt entscheidet die **Route** den Modus: `App.tsx` nimmt `startModus` als Eigenschaft
und erzeugt Tagesrätsel bzw. Duellbrett in einem Effekt beim Betreten. Der Knopf in der
Kopfzeile führt **eine Stufe nach oben** — aus der Folge in die Levelwahl, aus
Tagesrätsel und Duell an den Anfang. Er bleibt das erste `button` im `<header>`, daran
hängt weiterhin der Oberflächentest.

*Hier ist ein Fehler aufgeflogen, den es ohne Routen gar nicht geben konnte:*
`STARTLEVEL` war eine **Konstante auf Modulebene** und wurde damit genau einmal
gerechnet — beim Import. Solange `/` der einzige Einstieg war, hieß das „bei jedem
Seitenaufruf", und es stimmte. Mit dem Router wechselt man von `/level` nach `/spiel`,
ohne dass das Modul neu geladen wird: die Konstante stand dann noch auf dem Level von
vorhin, und **die Levelwahl sprang ins Leere**. Sie ist jetzt die Funktion
`startLevel(f)`, aufgerufen aus den `useState`-Initialisierern. Gefangen hat das der
Oberflächentest.

**Die Levelwahl reicht ihre Wahl über den Fortschritt weiter**, nicht über den
Router-Zustand: sie schreibt `zuletzt` und navigiert nach `/spiel`, das sein Level von
dort holt. Damit überlebt die Wahl ein Neuladen, und `/spiel` hat genau **einen** Weg,
sein Level zu bestimmen. Die Sperre wird auch dort ein zweites Mal geprüft (`istFrei`) —
eine Regel, die nur an einem `disabled` hängt, ist keine.

**Tagesrätsel und Duell sind aus der Levelwahl ausgezogen** und stehen auf dem
Startbildschirm. Beides ist kein Level; in einer Liste von Leveln zu stehen war schon
vorher falsch, hinter dem Spielbildschirm zu liegen erst recht. `Levelwahl.tsx` ist
dadurch von 25 auf 15 Eigenschaften geschrumpft und macht jetzt, was sein Name sagt.

**Der Tresen gibt es in zwei Fassungen:** `.theke` hängt an der Unterkante des Bretts
(Spielbildschirm, siehe „Die Bar als Ort"), `.theke-fest` steht fest am unteren Rand —
für Bildschirme ohne Brett, an denen er sonst nichts hätte, woran er hängen könnte. Auf
dem Startbildschirm sind die Gläser ein **Bild**, kein Brett: keine Zustände, kein
Antippen. Ein halbes Spielbrett, das nichts tut, wäre eine Einladung, darauf zu tippen.

**Gezeichnet werden sie aber vom SELBEN Teil wie im Spiel** — `GlasKoerper` aus
`Glas.tsx`, das seit dem 27.09.2026 vom Knopf getrennt ist. `Glas` ist nur noch
der Knopf darum herum. *Davor waren die fünf Gläser dort von Hand nachgebaut: eigene
Form (`border-radius: 8px 8px 22px 22px` statt der Reagenzglas-Radien) und eigene
Hexwerte (`#3FA9F5`, `#FF4D6D`, `#4ED16A` …) — die alte Neon-Palette. Als die echten
Gläser neu gezeichnet und die Farben neu gemessen wurden, blieben diese stehen, und die
Haustür zeigte ein anderes Spiel als das Spiel. Josef hat es sofort gesehen.* Die
Farben kommen jetzt über `codeVon()` aus `farben.ts`, und `.start-glas` ist nur noch
ein Maßrahmen: die verschiedenen **Breiten** (38–64 px) geben die verschiedenen Höhen,
weil der Körper sein Seitenverhältnis hält.

### Sprachen

**Zwanzig Sprachen seit dem 02.10.2026** (vorher fünf): Dateien in
`src/i18n/locales/`, alle mit demselben Schlüsselsatz. Welche es gibt und wie aus einer
Gerätesprache eine davon wird, steht in **`src/i18n/sprachen.ts`** — eine eigene Datei
ohne DOM, damit `tools/test-recht.mts` die Weiche in node prüfen kann. `index.ts` lädt
die Dateien per `import.meta.glob`; eine Datei, die es gibt, ist damit auch geladen.
`test-recht.mts` prüft Schlüssel, Platzhalter, unübersetzte Zeilen **und** dass Codes und
Dateien zusammenpassen (keine Sprache ohne Datei, keine Datei ohne Code).

**Beim ersten Start entscheidet die Gerätesprache**, nicht Deutsch — ein Spieler in
Madrid sah vorher eine deutsche App, obwohl es Spanisch gibt.

**Chinesisch ist die Falle der Weiche.** `slice(0, 2)` machte aus jedem Tag ein `zh`,
das es nicht gibt. `spracheFuer()` liest die Schrift (`zh-Hant…`/`zh-Hans…`) und sonst
die Region: Taiwan, Hongkong und Macau → traditionell, alles andere → vereinfacht. Ein
Spieler in Taipeh, der vereinfachte Zeichen bekommt, meldet das nicht — er löscht die
App. Der Test geht jede Variante einzeln durch.

**`<html lang>` wird gesetzt**, und das ist keine Zierde: an `lang` wählt das Gerät für
dieselben Han-Zeichen die japanische, chinesische oder koreanische Glyphe.

**Arabisch: die Oberfläche spiegelt sich, das Brett nicht.** `dir="rtl"` auf `<html>`;
Kopfzeile, Karten und Einstellungen drehen sich über Flex/Grid von selbst. **`Brett`
trägt `dir="ltr"`**: Kipp-Bahn, Strahl, Spiegelung und Strohhalm sind links-rechts
gerechnet, und die Reihenfolge der Gläser ist keine Leserichtung. Pfeile mit Richtung
(zurück, Abschnitt vor/zurück, Undo) tragen die Klasse `pfeil` und werden unter
`[dir=rtl]` gespiegelt; Symbole ohne Richtung bleiben.

**Mengen ohne Pluralfalle.** Die App hat keine Pluralschlüssel. Russisch, Ukrainisch,
Polnisch und Arabisch haben mehrere Pluralformen, darum stehen dort Formen wie
„Монеты: {{n}}" statt „{{n}} монет", und nach einer Zahl Abkürzungen („ход.").

**Schriften:** Fredoka und Nunito lagen nur als Latin-Grundblock vor — Polnisch (ł),
Türkisch (ş ğ ı) und Vietnamesisch fielen mitten im Wort auf die Systemschrift zurück.
`tools/fonts-holen.mjs` holt jetzt auch `latin-ext`, `vietnamese` und `cyrillic(-ext)`,
jede Datei mit `unicode-range`. Japanisch, Koreanisch, Chinesisch, Thai, Hindi und
Arabisch nehmen **bewusst die Systemschrift**: eine CJK-Schrift wäre mehrere MB.

**Die Sprachwahl ist ein `<select>`** mit dem Eigennamen jeder Sprache („日本語", nicht
„Japanisch") — wer die App nicht lesen kann, sucht seine Sprache in seiner Schrift.

**Die Übersetzungen sind nicht gegengelesen.** Die Store-Texte für alle Sprachen stehen
in `docs/store-texte-sprachen.md`, ebenfalls ungeprüft.

**Der iOS-Tracking-Dialog (ATT) spricht alle zwanzig Sprachen — ohne Xcode** (Josef,
02.10.2026: „nein ohne xcode!!!! du machst es alles!"). Der Text steht als `ios.tracking`
in jeder `locales/*.json`; `node tools/ios-sprachen.mjs` schreibt daraus
`ios/App/App/<code>.lproj/InfoPlist.strings` und trägt sie mit der Bibliothek `xcode`
(dieselbe, die Capacitor benutzt) in die `project.pbxproj` ein: Variantengruppe,
Ressourcen-Phase, `knownRegions`. Idempotent, mit Gegenprobe. Eine Falle der Bibliothek:
sie schreibt `LastUpgradeCheck = 0920` als `920` zurück — das Werkzeug setzt den alten
Wortlaut wieder ein, damit der Diff nur aus Ergänzungen besteht. `test-release.mts`
prüft Dateien, Projekteinträge und Ressourcen-Phase; ob der Dialog am Gerät übersetzt
erscheint, zeigt erst ein Build auf dem Mac.

*Hier ist ein Fehler aufgeflogen, der es wert ist, aufgeschrieben zu werden:* Die
Funktion `geraeteSprache()` stand zunächst **unter** ihrer Verwendung. Bei `const` greift
dann die temporale Todeszone, der Zugriff auf `SPRACHEN` wirft — und ein zu weit
gefasstes `catch` hat den Fehler verschluckt und einfach Englisch geliefert. Die App war
damit auf jedem deutschen Gerät englisch, ohne eine Zeile in der Konsole. Gefunden hat es
der Oberflächentest, weil er nach deutschen Knopftexten sucht. Das `catch` fängt jetzt nur
noch, ob es `navigator` überhaupt gibt.

### Die Rechtstexte

`src/pages/legal/legalContent.ts`, aus `anigosha/src/pages/legal/legalContent.ts`
**angepasst, nicht kopiert** — der Unterschied ist erheblich: Anigosha hat Konten mit
E-Mail-Adresse, Spielernamen, Avatare, Push, Elo und gemeldete Fragen. FixTheMix hat
davon nichts. Die Texte sind darum kürzer, und sie stimmen.

Zwei Dinge sind vor dem Launch zu prüfen, und beide stehen auch im Kopf der Datei:

1. ~~Die E-Mail-Adresse muss es geben.~~ **Erledigt (Josef, 26.09.2026):**
   `63almaz80@gmail.com`. Der erste Entwurf trug `fixthemix@wellbooked.at` nach dem
   Muster von Anigosha — eine Adresse, die es noch nicht gab. Eine
   Datenschutzerklärung, die auf ein totes Postfach zeigt, ist schlimmer als gar
   keine: an ihr hängen Auskunfts- und Löschbegehren **mit Fristen**.
   Der Preis ist bewusst bezahlt: die Adresse steht öffentlich im Impressum und wird
   von Bots abgegriffen. Ein Umzug auf eine eigene Domain ist genau **eine Zeile** —
   `BETREIBER.email`; alle vier Rechtstexte setzen sie ein, keiner schreibt sie aus.
   *Im Test stand dafür `includes('fixthemix')` — das ging nur, solange die Adresse
   dem Anigosha-Muster folgte. Geprüft wird jetzt, was wirklich schützt: dass hier
   nicht versehentlich die Adresse einer der anderen Apps steht.*
2. ~~Der Abschnitt „Bestenliste und Tagesrätsel"~~ **ist am 26.09.2026 gelöscht worden**,
   weil Version 1.0 ohne Bestenliste in den Store geht. Mit ihm sind Supabase als
   Empfänger, die 90-Tage-Aufbewahrung und alle Sätze verschwunden, die einen
   Bestenlisteneintrag voraussetzen. Was beim Einschalten zurückmuss, steht im Kopf von
   `legalContent.ts` und in `docs/phase4-supabase.md`.

`tools/test-recht.mts` prüft, dass keine Platzhalter übrig sind, dass kein Rest von
Anigosha stehengeblieben ist, dass jeder Empfänger genannt wird (Vercel, AdMob,
RevenueCat) und dass die Kontaktadresse in Datenschutz und Löschseite steht.

**Supabase ist dort der Sonderfall**, und die Prüfung läuft in beide Richtungen: gibt es
einen Client (`src/lib/supabase.ts`), **muss** Supabase in der Erklärung stehen; gibt es
keinen, darf es **nicht** darin stehen. Wer die Datenbank anschließt und die Erklärung
vergisst, fällt sofort auf — und wer sie wieder abschaltet, ebenso.

*Eine zweite Lehre steckt in derselben Datei:* „Duell" stand bis Phase 7 auf der
Verbotsliste der Anigosha-Reste, und zu Recht — damals konnte es nur ein Rest sein. Seit
es in FixTheMix wirklich Duelle gibt, ist dasselbe Wort ein richtiger Satz. Eine
Verbotsliste veraltet mit dem Projekt; genau dasselbe war vorher schon mit „Spielername"
passiert.

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
4. **Tagesrätsel:** Teilen und Serie sind **FERTIG (26.09.2026)** und laufen ohne
   Datenbank. Migration und Edge Function liegen im Repo, sind aber **nicht deployt** —
   dafür braucht es ein Supabase-Projekt. Schritte: `docs/phase4-supabase.md`.
   ← **hier geht es weiter**, sobald das Projekt steht: anonyme Anmeldung, Bestenliste in
   der Oberfläche, Fortschritt und Münzen in die Datenbank.
5. **Werbung, Kauf, Rechtstexte, Sprachen.** **FERTIG (26.09.2026)**, soweit es ohne
   Store-Konten geht: Werbung läuft mit Test-IDs, der Kauf bleibt ohne Schlüssel stumm,
   die vier Rechtstexte stehen, zwanzig Sprachen sind vollständig (seit 02.10.2026). Was fehlt, braucht Konten
   — AdMob-Anzeigenblöcke, RevenueCat-Schlüssel, Store-Produkte — und kommt mit Phase 6.
6. **Stores:** **EINGEREICHT (03.10.2026)**, iOS und Android, beide mit dem Kauf
   „Werbung entfernen“ (2,99 €). Gebaut wird über die Release-Workflows auf Josefs
   Mac (`laeufer: mac`). Offen ist nur noch die RevenueCat-Validierung der
   Android-JSON. Die Fallen der ersten Einreichung stehen unter M9.
7. **Version 1.1: Duelle.** **FERTIG gegen Bots (26.09.2026).** Gleiches Brett,
   weniger Züge gewinnt, gleich viele sind ein Remis. Der Gegner spielt das Brett
   wirklich durch und passt sich an. Migration und Edge Function für menschliche
   Gegner liegen im Repo und warten auf das Supabase-Projekt aus Phase 4.

## Prüfung

- **Testskripte** (alle grün zu halten). `npm test` fährt alle **zwölf** nacheinander,
  **495 Zusicherungen**, Gesamtlaufzeit rund 5 Minuten — davon entfallen 148 s auf den
  1.000er-Lauf des
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
  - `test-tagesraetsel.mts` (65) — Datumsrechnung, Wochenleiter, Serie, Teiltext und die
    Rechnung des Schummelschutzes. Das größte Skript, und zwar aus einem Grund: die
    Datumsrechnung ist der Teil, der **still** falsch wird. Ein Fehler am Schaltjahr oder
    an der Zeitzone zeigt sich an einem Tag im Jahr, trifft dann alle Spieler
    gleichzeitig, und niemand kann ihn hinterher nachstellen. Also wird über 4.000 Tage
    gerechnet, beide Schaltjahresregeln (2100 ist keines, 2000 war eines) und 23:30
    Ortszeit geprüft — und dass kein Frucht-Emoji in den Teiltext gerät.
  - `test-werbung.mts` (39) — die Werbebremse und das Extra-Glas. Beides lässt sich am
    Gerät nicht ausprobieren, ohne echte Anzeigen anzusehen — und genau das ist verboten.
    Also wird die **Regel** geprüft, nicht das SDK: wie viele Anzeigen dreißig Level in
    einer Stunde ergeben, dass das Extra-Glas angehängt und nicht eingeschoben wird, dass
    es auf zwei Sterne deckelt, und dass eine Zugfolge mit Extra-Glas serverseitig
    **nicht** nachspielbar ist.
    *Ein Anlauf war hier falsch:* Die Zusicherung „mit Extra-Glas nicht nachspielbar"
    schlug fehl, weil die kürzeste Lösung das zusätzliche Glas gar nicht anfasste. Jetzt
    erzwingt der Test einen Zug hinein — sonst prüfte er nichts.
  - `test-recht.mts` (57) — Rechtstexte und Sprachdateien. Zwei Stellen, an denen ein
    Fehler nicht auffällt, bis es zu spät ist: ein fehlender Textschlüssel zeigt einem
    spanischen Spieler eine deutsche Zeile, und ein Rechtstext mit einem übrig gebliebenen
    Platzhalter geht so in den Store. Apple und Google prüfen das nicht — die prüfen nur,
    ob die Seite erreichbar ist.
  - `test-wiedergabe.mts` (37) — Undo-Stapel und Wiedergabe. Der Undo speichert nur den
    **Unterschied** (von, nach, Menge), nicht den ganzen Stand — bei 14 Gläsern und
    60 Zügen ist das der Unterschied zwischen ein paar hundert Bytes und ein paar
    Kilobyte je Partie.
  - `test-duell.mts` (67) — Duelle. Drei Stellen, an denen ein Fehler nicht auffaellt,
    bis sich jemand zu Recht beschwert: das Brett (zwei Spieler mit verschiedenen
    Brettern koennten ihre Zugzahlen nicht vergleichen — deshalb eine feste
    Schluesseltabelle), der Bot (er muss eine ECHTE, nachspielbare Zugfolge liefern und
    auf jedem Geraet dieselbe) und der Ausgang (ein Remis muss ein Remis bleiben).
    Misst ausserdem die Staerkeleiter nach, statt sie zu behaupten — genau dort fiel
    auf, dass „leicht" das Optimum spielen konnte.
  - `test-klang.mts` (24) — die Regeln der Bar-Geräusche. WebAudio gibt es in node
    nicht, und ein Test, der einen Ton anhört, wäre ohnehin keiner — geprüft wird wie
    bei der Werbebremse die **Regel**: dass die Gussdauer mit der Menge wächst und unter
    dem Deckel bleibt, dass die Siegmelodie steigt, dass nichts nachgeladen wird und
    dass `klangregeln.ts` ohne Browser-Globale auskommt.
  - `test-release.mts` (69) — die Verkabelung zu den Stores. Prüft nichts am Spiel,
    sondern das, was keinen Test hat und trotzdem ein Release kippt: die Bundle-ID an
    sieben Stellen, gleiche Versionen auf beiden Plattformen, dass bei
    `TEST_ANZEIGEN = true` **alle vier Anzeigenblöcke** Googles Test-Blöcke sind (die
    App-IDs dürfen echt sein, siehe „Die Beispiel-IDs"), dass die ATT-Abfrage an der Stelle steht,
    an der iOS sie auch aufruft, dass das iOS-Symbol 1024 groß und **ohne Alphakanal**
    ist, dass `*.jks` im `.gitignore` steht, und dass jedes `secrets.X` aus den
    Workflows in `docs/release-ci.md` erklärt ist. Mit `--release` verlangt es
    zusätzlich die Bereitschaft (echte Anzeigen, echte IDs) — diese Fassung schlägt
    heute absichtlich fehl und ist damit die Liste dessen, was noch fehlt.
  - `test-oberflaeche.mjs` (67, braucht Playwright + Chromium, sonst kein Netz und
    keine Schlüssel) — spielt ein Level im echten Browser mit der Lösung des
    Lösers durch und vergleicht, ob die Oberfläche dasselbe erzählt wie die Engine.
    Prüft auch die Sperre: bei frischem Start ist Level 2 zu, ein Sieg öffnet genau ein
    Level weiter. Weil er dafür nicht elf Level durchspielen will, setzt er
    `fixthemix.fortschritt.v2` von Hand — das ist die einzige Stelle, an der ein Test
    den Speicher schreibt, und sie ist im Skript so kommentiert.
    Dazu Münzen und **die Sackgasse im echten Browser**: das Skript sucht sich mit der
    Engine eine Zugfolge, die Level 301 nachweislich tötet (gefunden: zwei Züge), spielt
    sie, und prüft, dass das Fenster erscheint und der Rückkauf genau 10 Münzen kostet.
    Zuletzt das **Tagesrätsel**: das Skript rechnet das Rätsel des heutigen Tages selbst
    aus, spielt es mit der Lösung des Lösers durch, und liest den geteilten Text aus der
    Zwischenablage — inklusive der Prüfung, dass keine Farbe darin steht.
    Dazu **die Geometrie des Gießzugs**, und die steht dort, weil Josef einen
    Fehler gefunden hat, den kein Test melden konnte: für jeden legalen Zug auf
    Level 121 (drei Reihen) wird nachgerechnet, dass die Öffnung der Quelle
    nach dem Kippen über der des Ziels steht und dass das Glas nicht aus dem
    Brett wandert. Im DOM stimmte vorher alles — sichtbar war der bergauf
    laufende Strahl nur am Gerät.
    Zuletzt **Einstellungen und Rechtstexte**: alle vier Adressen werden aufgerufen und
    ihre Überschrift geprüft, und „Daten löschen" muss den Speicher wirklich leeren.
    Der Test läuft mit `locale: 'de-DE'`, weil die App seit Phase 5 die Gerätesprache
    wählt; ohne das prüfte er plötzlich die englische Oberfläche.
    Dazu **fünf weitere Sprachen** in je einer frischen Seite (ar, ja, ru, hi, zh-TW):
    dass die Gerätesprache greift (auch zh-TW → traditionell), dass `<html>` `lang` und
    `dir` trägt, dass Arabisch `rtl` ist, das Brett aber `ltr`, und dass keine Sprache
    einen Konsolenfehler wirft. Screenshots `sprache-<code>-start/spiel.png`.
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
- **Schummelschutz:** `pruefeTag()` lehnt manipulierte Zugfolgen ab — geprüft mit node
  in `test-tagesraetsel.mts`. Die Edge Function darüber ist nur Verkabelung und in dieser
  Sitzung **nie deployt worden**; sie wird auch von `npm run build` nicht typgeprüft,
  weil `Deno.serve` und `jsr:`-Importe in Node nicht auflösen. Siehe
  `docs/phase4-supabase.md`.
- **Farbenblind-Modus:** ein Screenshot in Graustufen. Jede Farbe muss am Symbol zu
  erkennen sein.
- **Web-App:** https://fixthemix.almaz6380.workers.dev (seit 01.10.2026) — Cloudflare
  Workers, nur statische Dateien aus `dist/`. Cloudflare baut selbst aus diesem Repo
  (Workers Builds, Zweig `main`); Konfiguration in `wrangler.jsonc`. Bis 28.09.2026 lag
  sie auf Vercel (`fixthemix.vercel.app`), bis Vercel den Account pausiert hat.
- **Rechtsseiten für die Stores:** https://almaz6380.github.io/fixthemix/ (seit
  01.10.2026). `fixthemix.vercel.app` ist offline, weil Vercel am 28.09.2026 den ganzen
  Account pausiert hat. Die Seiten entstehen im öffentlichen Repo `almaz6380.github.io`
  per `npm run erzeugen` aus `src/pages/legal/legalContent.ts`. **Nach jeder Änderung
  an einem Rechtstext dort neu erzeugen.** Adressen: `datenschutz.html`,
  `daten-loeschen.html`, `impressum.html`, `nutzungsbedingungen.html` (englisch
  `privacy`, `delete-data`, `imprint`, `terms`). Die In-App-Routen bleiben, wie sie sind.
- **Testaufbau am Handy über claude.ai:** Der Build lässt sich auch als private Seite
  dort veröffentlichen. Zwei Fallen: die Seite darf kein eigenes `<html>`/`<head>`
  mitbringen (der Rahmen setzt das selbst), und die Sicherheitsabstände für Notch und
  Home-Leiste müssen **vom Rahmen** kommen — `env(safe-area-inset-*)` liefert
  innerhalb des Rahmens 0.
- **Am Gerät:** Werbung nur mit Test-IDs. **Nie echte eigene Anzeigen antippen** — am
  AdMob-Konto hängen alle Apps.
- **`npm audit` meldet drei mittlere Funde** in `@capacitor/cli` → `xcode` →
  `uuid@7.0.3`. *In Phase 6 nachgesehen, und die frühere Notiz hier war falsch:*
  `npm audit fix` ändert daran **nichts**. In der 8er-Reihe gibt es keine Fassung ohne
  diese Kette, und `xcode@3.0.1` pinnt `uuid` fest; erst eine Capacitor-9-Alpha käme
  ohne aus. Der Fund betrifft nur die Baukette — `xcode` schreibt die
  `project.pbxproj` und landet nie im Bundle, und die verwundbare Stelle
  (`uuid.v3`/`v5` mit eigenem Puffer) wird dort nicht benutzt. Ein
  `overrides`-Eintrag wäre möglich, hebelte aber ausgerechnet das Werkzeug aus, das
  die Xcode-Projektdatei erzeugt. Bleibt also stehen, bewusst.

## Auslieferung auf Cloudflare

`wrangler.jsonc` legt fest, dass Cloudflare für alles, was keine Datei ist,
`index.html` ausliefert (`not_found_handling: single-page-application`) — ohne das gibt
ein Neuladen auf einer Unterseite 404, weil die Routen erst der Browser kennt.

Gebaut wird **bei Cloudflare**, nicht in GitHub Actions (das Repo ist privat, Actions
sind dort gesperrt): Workers & Pages → Projekt `fixthemix` → mit `almaz6380/FixTheMix`
verknüpft, Build `npm run build`, Deploy `npx wrangler deploy`. Jeder Push auf `main`
geht damit live. Prüfen vor dem Push: `npx wrangler deploy --dry-run` liest `dist/`.

**Zwei Fallen, aufgeflogen an PR #26 (02.10.2026):** Für jeden Zweig außer `main`
ruft Cloudflare `npx wrangler preview` auf, und das bricht ohne einen `previews`-Block
in `wrangler.jsonc` ab („missing a `previews` block"). Und im Dashboard stand als
Build-Befehl **„None"** — `dist/` ist gitignored, also gäbe es nichts hochzuladen.
Deshalb trägt `wrangler.jsonc` jetzt beides selbst: `"previews": {}` und
`"build": { "command": "npm run build" }`. Wrangler baut damit vor `deploy` **und**
vor `preview` selbst; das Repo hängt nicht mehr an einer Einstellung im Dashboard, die
man nicht sieht. `npx wrangler deploy --dry-run` zeigt die Zeilen `[custom build]`.

**Schriften:** `node tools/fonts-holen.mjs` lädt die `.woff2` von Google nach
`public/fonts/` und druckt die `@font-face`-Regeln, die oben in `src/index.css` gehören.
Einmalig gelaufen; das Ergebnis liegt im Repo. Es gibt **keinen** Netz-Fallback — fehlt
eine Datei, fällt die Schrift still auf `system-ui` zurück.

**Store-Bilder:** `node tools/store-bilder.mjs` (nach `npm run build`) nimmt **fünf**
Screenshots je Gerät auf — Startbildschirm, Spiel mit gewähltem Lauf, Farbenblind-Modus,
Levelwahl, Tagesrätsel — in den Größen, die Apple und Google verlangen: 1290×2796,
1242×2688, **2064×2752 (iPad 13″, seit 03.10.2026 Pflicht)** und 1080×2160 (Play,
2:1 — mit 16:9 fehlten Tresen und Fußzeile). Dazu die **Feature-Grafik** 1024×500 und das 512er-Symbol für
Play. Das Skript fährt die Routen direkt an (`/`, `/spiel`, `/level`, `/tagesraetsel`);
vor dem 27.09.2026 klickte es sich über den Burger durch das Fenster über dem Spiel.
Ergebnis in `.store/<sprache>/`, gitignored; `--sprache ja` nimmt die Bilder in einer
anderen Sprache auf (ohne Angabe Deutsch). **Die Feature-Grafik gibt es seit dem 03.10.2026 in
jeder Sprache**: ihr Text steht als `store.feature` in jeder `locales/<code>.json` und wird
damit von `test-recht.mts` mitgeprüft; unter Arabisch steht das Symbol rechts. *Für die
Aufnahme* braucht der Container Noto-Schriften (`apt-get install fonts-noto-core
fonts-noto-cjk`), sonst landen Hindi und Arabisch in FreeSans/DejaVu — am Handy sähe das
anders aus. Die App selbst bleibt bei der Systemschrift.
Gläser und Symbolknopf findet das Skript über `data-glas`/`data-symbole`, nicht über
deutsche Beschriftungen — sonst lief es in jeder anderen Sprache in eine Zeitüberschreitung. Aufgenommen wird aus dem **echten Bundle**, nicht aus
einem Entwurf: ein aufgehübschter Store-Screenshot ist bei Apple ein Ablehnungsgrund.
Die Feature-Grafik entsteht im Browser und nicht mit sharp — nur so kommen die echten
Schriften aus `public/fonts/` zum Einsatz. Die Screenshots des Oberflächentests taugen
dafür **nicht**: die sind 390×844, und Apple weist zu kleine Bilder erst beim Hochladen
ab.

**Icons:** `node tools/icons-bauen.mjs` erzeugt aus `tools/vorlagen/app-symbol.jpg`
das Favicon (`public/favicon.png`) und die PNG-Größen. iOS nimmt für „Zum
Home-Bildschirm hinzufügen" ausschließlich `apple-touch-icon.png`, und das
Web-Manifest will PNG.

## Regeln (wie in allen Repos)

- Kein Commit, Deploy oder Build ohne ausdrückliches „ja" von Josef. Vor jedem Build
  in drei Zeilen zusammenfassen: was passiert, welche Version, wohin es geht.
- Schlüssel gehören nie ins Repo und nie in den Chat.
- Mobile-first, alle Texte über i18n, mit korrekten Umlauten.
- Josef arbeitet meist vom Handy: Ergebnisse direkt im Chat zeigen (`SendUserFile`).
