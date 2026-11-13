# Release in die Stores: einmal einrichten

Danach baut, signiert und veröffentlicht GitHub die App auf Knopfdruck — aus jeder
Claude-Sitzung, aus dem Browser, vom Handy.

Die Workflows liegen in `.github/workflows/ios-release.yml` und
`android-release.yml`. Sie starten **nur von Hand** (`workflow_dispatch`), nie
automatisch bei einem Push. Der Upload-Schalter steht bei beiden auf **aus** —
FixTheMix ist in keinem Store, hier wird zuerst gebaut und geprüft.

Muster aus `almaz6380/anigosha`. Was dort Wochen gekostet hat, steht als Kommentar
in den Dateien; wer etwas daran ändert, sollte sie vorher lesen.

## Womit man anfängt: `node tools/test-release.mts --release`

Das Skript ist die Liste dieser Seite in ausführbarer Form. Es sagt, was noch
fehlt, und die Release-Workflows rufen es als erstes auf — ein Build, bei dem
etwas davon offen ist, kommt gar nicht erst bis zum Signieren.

```
node tools/test-release.mts            # Stimmigkeit — läuft heute grün
node tools/test-release.mts --release  # Bereitschaft — zeigt, was fehlt
```

## Was es für FixTheMix noch gar nicht gibt

1. **AdMob-Anzeigenblöcke.** Die beiden **Apps** gibt es seit dem 26.09.2026,
   und ihre echten App-IDs stehen schon im Repo:

   | Plattform | App-ID | steht in |
   |---|---|---|
   | iOS | `ca-app-pub-8860791993288062~8461231878` | `ios/App/App/Info.plist` (`GADApplicationIdentifier`) |
   | Android | `ca-app-pub-8860791993288062~4290052573` | `android/app/src/main/AndroidManifest.xml` |

   **Die vier Anzeigenblöcke stehen seit dem 02.10.2026** unter `PROD` in
   `src/lib/werbung.ts` (je Plattform ein Interstitial- und ein Rewarded-Block).
   **Seit dem 03.10.2026 steht `TEST_ANZEIGEN` auf `false`**, die App liefert
   also echte Anzeigen aus. Zum Ausprobieren am Gerät das Gerät in AdMob als
   Testgerät eintragen — eigene Live-Anzeigen nie antippen.

   Eine **App-ID** (mit Tilde) sagt dem SDK nur, welches Konto die App ist;
   ausgeliefert wird nach den **Blöcken** (mit Schrägstrich). Eine echte
   App-ID mit Test-Blöcken ist harmlos, eine Beispiel-App-ID mit echten
   Blöcken liefert nichts aus.

   **Die AdMob-App lässt sich anlegen, bevor die App in einem Store ist** — bei
   „Ist die App in einem unterstützten App Store veröffentlicht?" wählt man *nein*
   und gibt Name und Plattform an. App-ID und Anzeigenblöcke gibt es sofort. Genau
   so ist es hier geschehen; beide Apps stehen daher auf „Genehmigungsstatus:
   Überprüfung nötig" und ohne Store-Eintrag. Später, wenn die App live ist, wird
   der Store-Eintrag verknüpft; solange das nicht geschehen ist, kann Google die
   Auslieferung begrenzen.

   **Niemals die eigenen Live-Anzeigen antippen** — an dem AdMob-Konto hängen
   auch Anigosha, MyPeak und WELLbooked.
2. **DSGVO-Einwilligungsnachricht** in AdMob erstellen **und veröffentlichen**.
   Ohne die Veröffentlichung erscheint gar kein Dialog, und dann fehlt die
   Einwilligung.
3. **RevenueCat**: Projekt anlegen, beide Plattformen verbinden, Produkt
   `fixthemix_no_ads` (Einmalkauf) in beiden Stores anlegen und im Entitlement
   `no_ads` verknüpfen.
4. **Upload-Keystore** (einmal erzeugen, danach für immer aufheben — geht er
   verloren, kann die App nie wieder aktualisiert werden):
   ```bash
   keytool -genkey -v -keystore android/upload-keystore.jks -keyalg RSA \
     -keysize 2048 -validity 10000 -alias upload
   ```
   Sicherungskopie an einen zweiten Ort. Die Datei ist gitignored, ebenso
   `android/keystore.properties`.
5. **App in der Play Console anlegen** (Paketname `at.gallab.fixthemix`) und dem
   Dienstkonto `play-upload@wellbooked-501311` dort Rechte geben, sonst antwortet
   die API mit `403 PERMISSION_DENIED`.
6. **App-Record in App Store Connect** + Distributions-Zertifikat und
   App-Store-Provisioning-Profil für `at.gallab.fixthemix`. Das Profil muss
   **`FixTheMix AppStore`** heißen — so steht es im `PROVISIONING_PROFILE_SPECIFIER`
   des Xcode-Projekts und in den `ExportOptions` des Workflows, und `test-release.mts`
   prüft, dass beide dasselbe sagen.

   **Das Profil muss das Zertifikat enthalten, das als `.p12` im Secret liegt.** Gibt
   es am Konto mehrere Distributions-Zertifikate, wählt man leicht das falsche. Dann
   bricht das Archivieren ab mit „Provisioning profile … doesn't include signing
   certificate“ (so geschehen am 03.10.2026). Gegenprobe am Mac: die SHA-1 aus
   `security find-identity -v -p codesigning` mit der aus dem Profil vergleichen:
   ```bash
   security cms -D -i FixTheMix_AppStore.mobileprovision | plutil -extract DeveloperCertificates.0 raw -o - - | base64 -d | shasum
   ```
7. ~~Die E-Mail-Adresse anlegen~~ — **erledigt (Josef, 26.09.2026).** Die
   Rechtstexte nennen jetzt `63almaz80@gmail.com`, eine Adresse, die es wirklich
   gibt. Das war der letzte Punkt dieser Liste, der ohne Konto scheiterte: eine
   Datenschutzerklärung, die auf ein totes Postfach zeigt, ist schlimmer als gar
   keine — an dieser Adresse hängen Auskunfts- und Löschbegehren **mit Fristen**.
   Wer später auf eine eigene Domain umzieht, ändert genau eine Zeile:
   `BETREIBER.email` in `src/pages/legal/legalContent.ts`.

## Wo die Secrets hinkommen

GitHub → Repo `almaz6380/fixthemix` → **Settings → Secrets and variables → Actions →
New repository secret**.

### Android (5)

| Name | Wert |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `android/upload-keystore.jks` als Base64 |
| `ANDROID_KEYSTORE_PASSWORD` | Passwort des Keystores |
| `ANDROID_KEY_ALIAS` | Alias (oben: `upload`) |
| `ANDROID_KEY_PASSWORD` | Passwort des Schlüssels |
| `PLAY_SERVICE_ACCOUNT_JSON` | **Inhalt** des Dienstkonto-Keys |

### iOS (4 + 2 Klartext)

| Name | Wert |
|---|---|
| `IOS_CERT_P12_BASE64` | Distributions-Zertifikat + privater Schlüssel als `.p12`, Base64 |
| `IOS_CERT_PASSWORD` | das beim Export vergebene Passwort |
| `IOS_PROVISIONING_PROFILE_BASE64` | App-Store-Profil für `at.gallab.fixthemix`, Base64 |
| `ASC_KEY_P8_BASE64` | ASC-API-Key `.p8`, Base64 |
| `ASC_KEY_ID` | z. B. `VGHCB8Z8Q2` |
| `ASC_ISSUER_ID` | z. B. `0d4e473b-2807-4c66-9857-6b0eb78e62ce` |

### Build-Zeit-Variablen (Vite backt sie ins Bundle)

| Name | Wert |
|---|---|
| `VITE_REVENUECAT_IOS_KEY` | öffentlicher SDK-Schlüssel (`appl_…`) |
| `VITE_REVENUECAT_ANDROID_KEY` | öffentlicher SDK-Schlüssel (`goog_…`) |
| `VITE_SUPABASE_URL` | aus dem Supabase-Projekt (Phase 4, siehe `phase4-supabase.md`) |
| `VITE_SUPABASE_ANON_KEY` | der **Anon**-Key, niemals der Service-Role-Key |

Alle vier landen im ausgelieferten Bundle und sind damit ohnehin öffentlich; sie
liegen trotzdem als Secrets, damit sie an einer Stelle gepflegt werden.

Fehlt der RevenueCat-Schlüssel, bleibt „Werbung entfernen" in der gebauten App
**unsichtbar — ohne jede Fehlermeldung**. Das ist der unangenehmste Fehler dieser
Liste, weil er wie eine bewusste Entscheidung aussieht. Beide Workflows brechen
deshalb ab, wenn der Schlüssel leer ist, und sie prüfen auch das Präfix: ein
iOS-Schlüssel im Android-Build ergibt `CONFIGURATION_ERROR` (RevenueCat-Code 23),
sichtbar erst am Gerät als Kaufknopf ohne Preis.

## App Store Connect: drei Angaben von Hand

Sie lassen sich aus keinem Workflow setzen, und ohne sie kommt die Ablehnung.

1. **Datenschutz → Tracking: ja.** Die App fragt nach ATT und benutzt die IDFA
   für Werbung. Nur mit der Rolle Admin oder Account Holder änderbar. Fehlt die
   Angabe, ist es Apples Richtlinie 2.1 — genau daran ist Anigosha 1.0
   gescheitert.
2. **Datenschutz-URL:** `https://almaz6380.github.io/fixthemix/datenschutz.html`
3. **Altersfreigabe:** kein Alkohol, kein Glücksspiel, keine Gewalt. Die Bar ist
   alkoholfrei, und das war der Grund für diese Entscheidung.

Google Play braucht dazu die eigene Adresse für den Weg zur Datenlöschung:
`https://almaz6380.github.io/fixthemix/daten-loeschen.html`

## Der ATT-Text in allen Sprachen — ohne Xcode

Der Text des Dialogs „Darf die App dich verfolgen?" (`NSUserTrackingUsageDescription`)
steht seit dem 02.10.2026 in **allen zwanzig Sprachen** der App. Die `Info.plist`
behält ihren deutschen Text nur als Rückfall.

- **Die Texte** stehen bei den anderen Übersetzungen: `ios.tracking` in jeder
  `src/i18n/locales/<code>.json`. `tools/test-recht.mts` prüft, dass keiner fehlt.
- **`node tools/ios-sprachen.mjs`** schreibt daraus je Sprache
  `ios/App/App/<code>.lproj/InfoPlist.strings` und trägt alles in die
  `project.pbxproj` ein: Variantengruppe `InfoPlist.strings`, Ressourcen-Phase des
  App-Targets, `knownRegions`. Es benutzt dieselbe Bibliothek wie Capacitor (`xcode`),
  liest die Datei danach zur Probe neu ein und ändert bei einem zweiten Lauf nichts.
- **Xcode braucht es dafür nicht** (Josef: „nein ohne xcode"). `tools/test-release.mts`
  prüft, dass jede Sprache ihre Datei hat, dass sie im Projekt steht und dass die
  Gruppe in der Ressourcen-Phase hängt — eine Datei, die nicht im Projekt steht, käme
  still nicht in die App.

Nach einer Textänderung oder einer neuen Sprache: `node tools/ios-sprachen.mjs`.
*Ob der Dialog am Gerät übersetzt erscheint, zeigt erst der erste Build auf dem Mac-Runner
bzw. in TestFlight — von hier aus lässt sich nur die Verkabelung prüfen.*

## Vor jedem Release

- Android: `versionCode` in `android/app/build.gradle` erhöhen (aktuell **1**)
- iOS: `CURRENT_PROJECT_VERSION` im pbxproj erhöhen (**zwei** Stellen, aktuell **1**)
- Beide `versionName`/`MARKETING_VERSION` gleich halten — `test-release.mts` prüft das
- Symbole neu bauen, falls `tools/vorlagen/app-symbol.jpg` sich geändert hat:
  `node tools/app-icons-bauen.mjs && node tools/icons-bauen.mjs`
- DSGVO-Einwilligungsnachricht in AdMob muss **veröffentlicht** sein

## Eigener Mac als Läufer (keine GitHub-Minuten)

Beide Release-Workflows haben die Eingabe **`laeufer`**: `github` (Standard, kostet
Minuten — macOS zählt zehnfach, ein iOS-Build also ~150–250 Minuten) oder `mac`
(Josefs Mac als *Self-hosted Runner*, kostenlos und unbegrenzt).

### Einmal einrichten (~20 Minuten, am Mac)

1. **Xcode 26 oder neuer** — der iOS-Lauf prüft das und bricht sonst ab.
2. **Android Studio** installieren und einmal starten. Der Einrichtungsassistent legt
   das Android-SDK unter `~/Library/Android/sdk` an; der Workflow findet es dort selbst.
   Danach muss Android Studio nie wieder geöffnet werden.
3. GitHub → Repo `fixthemix` → **Settings → Actions → Runners → New self-hosted runner**
   → **macOS**. Die angezeigten Befehle im Terminal ausführen. Die Rückfragen mit
   Enter bestätigen — die Standard-Labels `self-hosted` und `macOS` sind genau die,
   die die Workflows erwarten.
4. Als Dienst einrichten, damit er mit dem Mac startet:
   `./svc.sh install && ./svc.sh start`
5. Unter Settings → Actions → Runners steht der Mac jetzt als **Idle**.

Hängt an `anigosha` schon ein Runner, kann derselbe Mac zusätzlich für dieses Repo
angemeldet werden — ein Runner gehört immer zu genau einem Repo.

### Im Betrieb

- **Der Mac muss an sein und darf nicht schlafen**, solange gebaut wird. Ist er aus,
  wartet der Auftrag, bis er wieder erreichbar ist.
- Der Lauf fasst nichts Eigenes an: Zertifikat in einem Wegwerf-Schlüsselbund (die
  Suchliste wird danach wiederhergestellt), Profil als `fixthemix-ci.mobileprovision`
  (wird gelöscht), API- und Play-Schlüssel nur unter `$RUNNER_TEMP`.
- ⚠ **Das Repo darf nie öffentlich werden**, solange der Runner angemeldet ist: Jeder
  Workflow-Lauf führt Code aus dem Repo auf dem Mac aus. Über einen Fork-PR liefe
  sonst fremder Code auf Josefs Rechner.
- Abmelden: Runner-Ordner → `./svc.sh stop && ./svc.sh uninstall`, dann auf GitHub
  unter Runners entfernen.

## Bekannte Meldung: `npm audit`

`npm audit` meldet drei mittlere Funde in `@capacitor/cli` → `xcode` → `uuid@7.0.3`.
`npm audit fix` ändert daran **nichts** — es gibt in der 8er-Reihe keine Fassung
ohne diese Kette, und `xcode@3.0.1` pinnt `uuid` fest. Der Fund betrifft nur die
Baukette: `xcode` schreibt die `project.pbxproj` und landet nie im Bundle, und die
verwundbare Stelle (`uuid.v3`/`v5` mit eigenem Puffer) wird dort nicht benutzt.
Ein `overrides`-Eintrag wäre möglich, hebelt aber ausgerechnet das Werkzeug aus,
das die Xcode-Projektdatei erzeugt — das Risiko steht in keinem Verhältnis.

## Store-Bilder (`store-bilder.yml`)

Actions → „Store-Bilder" → Run workflow. `ziel`: beide/android/ios, `hochladen`: aus = nur
aufnehmen (Bilder als Artefakt „store-bilder"), an = in die Stores. Braucht dieselben
Secrets wie die Release-Workflows (`PLAY_SERVICE_ACCOUNT_JSON`, `ASC_KEY_ID`,
`ASC_ISSUER_ID`, `ASC_KEY_P8_BASE64`). iOS-Bilder gehen an die bearbeitbare Version, sonst
an eine neu angelegte nächste Version.
