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

**Neu zu bauen:**

- **`src/engine/`**, reines TypeScript ohne React:
  - Zustand: Gläser als Arrays von Schichten, dazu der Shaker.
  - Züge: `pour()`, `shake()`, `isSolved()`, ein Undo-Stapel.
  - `solve()`: A* mit Hash über den Zustand. Liefert die optimale Zugzahl und dient
    zugleich als Tipp.
  - `generate(seed, schwierigkeit)`: erzeugt nur Level, die der Löser als lösbar
    bestätigt.
  - Alles deterministisch aus dem Seed, damit Tagesrätsel und Duelle für alle gleich
    sind.
- **Schummelschutz für die Bestenliste:** Der Client schickt die Zugfolge, eine Edge
  Function spielt sie mit derselben Engine nach (geteilter Code) und wertet erst dann.
  Dasselbe Prinzip wie „XP nur serverseitig" bei Anigosha.
- **Darstellung:** das Spielfeld als SVG, dazu die Symbole für den Farbenblind-Modus.

## Phasen

1. **Engine, Löser, Generator und Tests.** Noch ganz ohne Oberfläche. ← **Hier geht's los**
2. **Spielbildschirm:**
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

- **Engine-Tests** (`npx tsx`):
  - 1.000 generierte Level, jedes davon löst der Löser.
  - Eine nachgespielte Zugfolge endet im gelösten Zustand.
  - Ungültige Züge werden abgelehnt.
  - Die Mischregeln stimmen.
  - Gleicher Seed ergibt dasselbe Level.
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
