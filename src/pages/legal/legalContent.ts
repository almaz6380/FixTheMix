// ===========================================================================
//  Rechtstexte fuer FixTheMix (Impressum, Datenschutz, Nutzungsbedingungen,
//  Datenloeschung)
// ===========================================================================
//  Uebernommen aus `anigosha/src/pages/legal/legalContent.ts` und auf FixTheMix
//  ANGEPASST — nicht kopiert. Der Unterschied ist erheblich, und das ist der
//  Grund, warum eine Kopie hier falsch waere: Anigosha hat Konten mit
//  E-Mail-Adresse, Spielernamen, Avatare, Push-Nachrichten, Elo-Wertungen und
//  gemeldete Fragen. FixTheMix hat davon NICHTS. Was hier steht, ist deshalb
//  kuerzer — und stimmt.
//
//  WICHTIG: sorgfaeltige Entwuerfe, keine Rechtsberatung. Vor dem Store-Launch
//  gehoert ein Blick eines Anwalts oder der WKO darauf, besonders auf die
//  Datenschutzerklaerung — dort kommen Werbung, Auslandsuebermittlung und
//  Minderjaehrigenschutz zusammen.
//
//  Bei JEDER neuen Datenverarbeitung MUSS die Datenschutzerklaerung ergaenzt
//  werden, sonst stimmt sie nicht mehr.
//
//  ⚠ ZWEI DINGE SIND VOR DEM LAUNCH ZU PRUEFEN:
//
//  1. DIE E-MAIL-ADRESSE. `fixthemix@wellbooked.at` ist dem Muster von
//     Anigosha (`anigosha@wellbooked.at`) nachgebildet und muss es wirklich
//     GEBEN — an dieser Adresse haengen Auskunfts- und Loeschbegehren nach der
//     DSGVO. Anlegen oder hier korrigieren.
//  2. DIE BESTENLISTE IST DRAUSSEN (Josef, 26.09.2026). Sie kommt spaeter,
//     also darf die Datenschutzerklaerung sie jetzt nicht beschreiben — eine
//     Erklaerung, die eine Verarbeitung behauptet, die nicht stattfindet, ist
//     genauso falsch wie eine, die eine verschweigt. Entfernt wurden deshalb:
//     der Abschnitt „Bestenliste und Tagesraetsel", Supabase als Empfaenger,
//     die 90-Tage-Aufbewahrung der Tagesergebnisse und alle Saetze, die einen
//     Bestenlisteneintrag voraussetzen.
//
//     WAS BEIM EINSCHALTEN ZURUECKMUSS (siehe docs/phase4-supabase.md und den
//     Verlauf dieser Datei): ein Abschnitt ueber die anonyme Anmeldung und die
//     uebertragene Zugfolge, Supabase als Auftragsverarbeiter mit Serverstandort,
//     eine Aufbewahrungsfrist, und der Hinweis bei „Deine Rechte", dass fuer
//     eine Auskunft zur Bestenliste die Kennung noetig ist.
//     `tools/test-recht.mts` erzwingt das: es prueft, ob `src/lib/supabase.ts`
//     existiert, und verlangt Supabase in der Erklaerung GENAU DANN, wenn es
//     die Datei gibt. Wer die Datenbank anschliesst und die Erklaerung
//     vergisst, faellt sofort auf.
// ===========================================================================

export const BETREIBER = {
  name: 'Josef Gallab (Einzelunternehmen)',
  adresse: 'Oberhofenweg 21b',
  ort: '6380 St. Johann in Tirol, Österreich',
  email: 'fixthemix@wellbooked.at',
};

const bDE = `${BETREIBER.name}\n${BETREIBER.adresse}\n${BETREIBER.ort}\nE-Mail: ${BETREIBER.email}`;
const bEN = `${BETREIBER.name}\n${BETREIBER.adresse}\n${BETREIBER.ort}\nEmail: ${BETREIBER.email}`;

export const STAND = '26.09.2026';

export interface RechtsAbschnitt {
  titel: string;
  text: string;
}

export interface RechtsText {
  titel: string;
  abschnitte: RechtsAbschnitt[];
}

export type RechtsSchluessel = 'impressum' | 'datenschutz' | 'nutzung' | 'loeschen';

/**
 * Die Adressen der vier Seiten. Stehen HIER und nicht in der Komponente, damit
 * sie ohne React lesbar sind — die Store-Formulare brauchen sie als Text, und
 * `tools/test-recht.mts` prueft sie.
 */
export const RECHTS_PFADE: Record<RechtsSchluessel, string> = {
  impressum: '/impressum',
  datenschutz: '/datenschutz',
  nutzung: '/nutzungsbedingungen',
  loeschen: '/daten-loeschen',
};

export const rechtsTexte: Record<RechtsSchluessel, { de: RechtsText; en: RechtsText }> = {
  // -------------------------------------------------------------------------
  impressum: {
    de: {
      titel: 'Impressum',
      abschnitte: [
        { titel: 'Angaben gemäß § 5 ECG und § 25 MedienG', text: bDE },
        {
          titel: 'Unternehmensgegenstand',
          text: 'Entwicklung und Betrieb von Software und mobilen Anwendungen.',
        },
        {
          titel: 'Gewerbe und berufsrechtliche Angaben',
          text:
            'Freies Gewerbe: „Dienstleistungen in der automatischen Datenverarbeitung und Informationstechnik"\n' +
            'GISA-Zahl: 39801937\n' +
            'Mitglied der Wirtschaftskammer Tirol (Bezirksstelle Kitzbühel)\n' +
            'Aufsichts- und Gewerbebehörde: Bezirkshauptmannschaft Kitzbühel\n' +
            'Anwendbare Rechtsvorschrift: Gewerbeordnung (GewO), abrufbar unter ris.bka.gv.at\n' +
            'Umsatzsteuer: Kleinunternehmer gemäß § 6 Abs. 1 Z 27 UStG (keine UID-Nummer, kein Steuerausweis)',
        },
        {
          titel: 'Anwendbares Recht',
          text: 'Es gilt österreichisches Recht. Zuständig ist das sachlich zuständige Gericht am Sitz des Betreibers.',
        },
        {
          titel: 'Verbraucherstreitbeilegung',
          text: 'Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Die frühere EU-Plattform zur Online-Streitbeilegung wurde am 20. Juli 2025 eingestellt.',
        },
        {
          titel: 'Zum Spiel',
          text:
            'Alle Level werden maschinell erzeugt. Für jedes einzelne ist die kürzeste Lösung berechnet und bewiesen — die drei Sterne hängen daran und sind nicht geschätzt.\n\n' +
            'Die Fruchtnamen (Erdbeere, Zitrone, Blaubeere …) beschreiben ausschließlich die Farben der Flüssigkeiten. Eine Verbindung zu Marken oder Herstellern besteht nicht.',
        },
      ],
    },
    en: {
      titel: 'Legal Notice',
      abschnitte: [
        { titel: 'Provider', text: bEN },
        {
          titel: 'Business purpose',
          text: 'Development and operation of software and mobile applications.',
        },
        {
          titel: 'Trade and regulatory information',
          text:
            'Licensed trade: services in automatic data processing and information technology\n' +
            'Austrian trade register (GISA) number: 39801937\n' +
            'Member of the Austrian Economic Chamber, Tyrol (Kitzbühel district office)\n' +
            'Supervisory and licensing authority: District Administration Kitzbühel\n' +
            'Applicable legislation: Austrian Trade Act (GewO), available at ris.bka.gv.at\n' +
            'VAT: small business under sec. 6(1)(27) of the Austrian VAT Act (no VAT ID, no VAT shown)',
        },
        {
          titel: 'Applicable law',
          text: 'Austrian law applies. The competent court at the provider’s registered office has jurisdiction.',
        },
        {
          titel: 'Consumer dispute resolution',
          text: 'We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board. The former EU online dispute resolution platform was discontinued on 20 July 2025.',
        },
        {
          titel: 'About the game',
          text:
            'All levels are generated by machine. For every single one the shortest solution has been computed and proven — the three stars depend on it and are not estimated.\n\n' +
            'The fruit names (strawberry, lemon, blueberry …) describe the colours of the liquids and nothing else. There is no affiliation with any brand or manufacturer.',
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  datenschutz: {
    de: {
      titel: 'Datenschutzerklärung',
      abschnitte: [
        { titel: 'Verantwortlicher', text: bDE },
        {
          titel: 'Das Wichtigste zuerst',
          text:
            'FixTheMix braucht kein Konto. Es gibt keine Registrierung, keine E-Mail-Adresse, keinen Spielernamen und kein Passwort.\n\n' +
            'Dein Spielstand liegt auf deinem Gerät: erreichte Level, Sterne, Münzen, deine Tagesserie und deine Einstellungen. Diese Daten verlassen dein Gerät nicht — sie werden im Speicher der App abgelegt und nicht an uns übertragen.\n\n' +
            'Wir erheben keinen Namen, keine Adresse, kein Geburtsdatum und keinen Standort.',
        },
        {
          titel: 'Tagesrätsel und Duelle',
          text:
            'Das Tagesrätsel wird auf deinem Gerät erzeugt, nicht bei uns abgerufen: aus dem Datum entsteht überall dasselbe Rätsel. Dein Ergebnis, deine Serie und deine Duellbilanz bleiben ebenfalls auf dem Gerät.\n\n' +
            'Es gibt derzeit keine Bestenliste und keine Duelle gegen andere Spieler. Deine Gegner im Duell rechnet die App selbst aus. Deshalb wird dabei nichts an uns übertragen — auch nicht anonym.\n\n' +
            'Wenn du dein Ergebnis teilst, entsteht ein Text auf deinem Gerät, den du selbst weitergibst. Wir erfahren davon nichts.',
        },
        {
          titel: 'Empfänger deiner Daten',
          text:
            'Vercel: Auslieferung der Web-App unter fixthemix.vercel.app. Dabei fallen technisch bedingt Serverprotokolle mit IP-Adresse an.\n\n' +
            'Google AdMob: Werbung in den mobilen Apps. Google kann dabei Gerätekennungen verarbeiten. Ohne deine Einwilligung wird nur nicht personalisierte Werbung ausgeliefert.\n\n' +
            'RevenueCat (Auftragsverarbeiter, USA): Abwicklung und Wiederherstellung des Kaufs „Werbung entfernen", sofern du ihn tätigst.\n\n' +
            'Eine Übermittlung in Drittstaaten (insbesondere USA) findet bei Google und RevenueCat statt und stützt sich auf die Standardvertragsklauseln der EU-Kommission.',
        },
        {
          titel: 'Werbung und deine Einwilligung',
          text:
            'Die mobilen Apps zeigen Werbung. Vor der ersten Anzeige fragen wir über Googles Einwilligungsdialog (UMP), ob du personalisierte Werbung möchtest. Du kannst diese Entscheidung jederzeit in den Einstellungen der App ändern.\n\n' +
            'Lehnst du ab, siehst du weiterhin Werbung, aber ohne Personalisierung. Auf iOS fragen wir zusätzlich über Apples Dialog zur App-Tracking-Transparenz.\n\n' +
            'Wir zeigen keine Werbung mitten in einem Level. Zwischen zwei Leveln erscheint höchstens eine Anzeige, und auch das nur mit Abstand. Videos gibt es ausschließlich freiwillig — du startest sie selbst, um Münzen oder ein Extra-Glas zu erhalten.\n\n' +
            'Die Web-App unter fixthemix.vercel.app zeigt keine Werbung.',
        },
        {
          titel: 'In-App-Kauf',
          text:
            'In der App kannst du einmalig „Werbung entfernen" kaufen. Der Kauf selbst wird von Apple bzw. Google abgewickelt — Zahlungsdaten wie Kreditkartennummern erhalten wir zu keinem Zeitpunkt und können sie auch nicht einsehen.\n\n' +
            'Zur Verwaltung des Kaufs setzen wir RevenueCat ein. Übermittelt werden eine zufällige Kennung deines Geräts und die Kaufbestätigung des jeweiligen Stores; RevenueCat verarbeitet zusätzlich technische Angaben zu Gerät und App-Version. Als Kennung dient bewusst keine E-Mail-Adresse.\n\n' +
            'Zweck ist die Erfüllung des Kaufvertrags (Art. 6 Abs. 1 lit. b DSGVO) — ohne diese Übermittlung ließe sich die Werbefreiheit weder freischalten noch auf einem neuen Gerät wiederherstellen.',
        },
        {
          titel: 'Speicherdauer',
          text:
            'Die Daten auf deinem Gerät bleiben, bis du sie löschst — entweder in den Einstellungen der App oder indem du die App entfernst.\n\n' +
            'Bei uns liegen keine Spielstände, weil keine zu uns gelangen. Was RevenueCat zum Kauf speichert, bleibt so lange gespeichert, wie die Wiederherstellung des Kaufs möglich sein muss.',
        },
        {
          titel: 'Deine Rechte',
          text:
            'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Erteilte Einwilligungen kannst du jederzeit mit Wirkung für die Zukunft widerrufen.\n\n' +
            'Weil wir dich nicht kennen, brauchen wir für eine Auskunft oder Löschung zum Kauf die zufällige Kennung deines Geräts. Du findest sie in den Einstellungen der App. Schreib uns damit an ' + BETREIBER.email + '.\n\n' +
            'Du hast außerdem das Recht, dich bei der Österreichischen Datenschutzbehörde zu beschweren (dsb.gv.at).',
        },
        {
          titel: 'Kinder und Jugendliche',
          text:
            'Das Spiel selbst ist für jedes Alter geeignet. Die Einwilligung in personalisierte Werbung kann man in Österreich allerdings erst ab 14 Jahren selbst erteilen (§ 4 Abs. 4 DSG), in Deutschland erst ab 16; Jüngere brauchen die Zustimmung der Erziehungsberechtigten.\n\n' +
            'Wir erheben wissentlich keine Daten von Kindern. Erziehungsberechtigte können sich jederzeit an uns wenden — auch wegen der Einwilligung in personalisierte Werbung.',
        },
        {
          titel: 'Änderungen',
          text: `Stand dieser Erklärung: ${STAND}. Kommt eine neue Datenverarbeitung dazu, aktualisieren wir diese Erklärung und weisen in der App darauf hin.`,
        },
      ],
    },
    en: {
      titel: 'Privacy Policy',
      abschnitte: [
        { titel: 'Controller', text: bEN },
        {
          titel: 'The most important part first',
          text:
            'FixTheMix does not need an account. There is no sign-up, no email address, no player name and no password.\n\n' +
            'Your progress stays on your device: levels reached, stars, coins, your daily streak and your settings. This data does not leave your device — it is stored by the app and never transmitted to us.\n\n' +
            'We collect no name, no address, no date of birth and no location.',
        },
        {
          titel: 'Daily puzzle and duels',
          text:
            'The daily puzzle is generated on your device rather than fetched from us: the date produces the same puzzle everywhere. Your result, your streak and your duel record stay on the device as well.\n\n' +
            'There is currently no leaderboard and there are no duels against other players. Your duel opponent is computed by the app itself. Nothing is transmitted to us in the process — not even anonymously.\n\n' +
            'When you share a result, the text is created on your device and you pass it on yourself. We learn nothing about it.',
        },
        {
          titel: 'Recipients of your data',
          text:
            'Vercel: delivery of the web app at fixthemix.vercel.app. This technically produces server logs containing the IP address.\n\n' +
            'Google AdMob: advertising in the mobile apps. Google may process device identifiers. Without your consent, only non-personalised advertising is served.\n\n' +
            'RevenueCat (processor, USA): handling and restoring the “Remove ads” purchase, if you make it.\n\n' +
            'Transfers to third countries (in particular the USA) take place with Google and RevenueCat and rely on the European Commission’s standard contractual clauses.',
        },
        {
          titel: 'Advertising and your consent',
          text:
            'The mobile apps show advertising. Before the first ad we ask via Google’s consent dialog (UMP) whether you want personalised advertising. You can change that decision at any time in the app’s settings.\n\n' +
            'If you decline, you still see advertising, but without personalisation. On iOS we additionally ask via Apple’s App Tracking Transparency dialog.\n\n' +
            'We show no advertising in the middle of a level. Between two levels there is at most one ad, and only with a gap. Videos are always voluntary — you start them yourself to receive coins or an extra glass.\n\n' +
            'The web app at fixthemix.vercel.app shows no advertising.',
        },
        {
          titel: 'In-app purchase',
          text:
            'You can buy “Remove ads” once in the app. The purchase itself is handled by Apple or Google — we never receive payment data such as card numbers and cannot access it.\n\n' +
            'We use RevenueCat to manage the purchase. A random identifier for your device and the store’s purchase receipt are transmitted; RevenueCat additionally processes technical details about device and app version. Deliberately, no email address is used as the identifier.\n\n' +
            'The purpose is performance of the purchase contract (Art. 6(1)(b) GDPR) — without this transmission the ad-free status could neither be unlocked nor restored on a new device.',
        },
        {
          titel: 'Retention',
          text:
            'The data on your device stays until you delete it — either in the app’s settings or by removing the app.\n\n' +
            'We hold no game data, because none reaches us. What RevenueCat stores about the purchase is kept for as long as restoring that purchase has to remain possible.',
        },
        {
          titel: 'Your rights',
          text:
            'You have the right to access, rectification, erasure, restriction of processing, data portability and objection. Consent given can be withdrawn at any time with effect for the future.\n\n' +
            'Because we do not know who you are, a request about the purchase needs your device’s random identifier. You will find it in the app’s settings. Email us with it at ' + BETREIBER.email + '.\n\n' +
            'You also have the right to lodge a complaint with the Austrian Data Protection Authority (dsb.gv.at).',
        },
        {
          titel: 'Children and young people',
          text:
            'The game itself is suitable for any age. Consent to personalised advertising, however, can only be given from the age of 14 in Austria (sec. 4(4) DSG) and from 16 in Germany; younger people need their guardians’ approval.\n\n' +
            'We do not knowingly collect data from children. Guardians can contact us at any time — including about consent to personalised advertising.',
        },
        {
          titel: 'Changes',
          text: `Last updated: ${STAND}. If a new kind of processing is added, we will update this policy and point it out in the app.`,
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  nutzung: {
    de: {
      titel: 'Nutzungsbedingungen',
      abschnitte: [
        {
          titel: 'Worum es geht',
          text: 'FixTheMix ist ein Sortierpuzzle. Diese Bedingungen gelten zwischen dir und dem im Impressum genannten Betreiber für die Nutzung der App und der Web-App.',
        },
        {
          titel: 'Nutzung',
          text:
            'Die Nutzung ist kostenlos. Du darfst die App für dich privat nutzen.\n\n' +
            'Nicht erlaubt ist, die App oder ihre Inhalte zu verändern, nachzubauen oder automatisiert zu bedienen.',
        },
        {
          titel: 'Münzen, Videos und Extra-Glas',
          text:
            'Münzen sind eine Zahl in deinem Gerät, keine Währung und kein Guthaben. Sie lassen sich nicht auszahlen, nicht übertragen und nicht zurückgeben.\n\n' +
            'Videos sind immer freiwillig: du startest sie selbst. Wird ein Video nicht vollständig gesehen, gibt es keine Belohnung — das entscheidet Googles Anzeigen-SDK, nicht wir.\n\n' +
            'Löschst du die App oder die Daten, sind die Münzen weg. Ein Anspruch auf Wiederherstellung besteht nicht.',
        },
        {
          titel: 'Kauf „Werbung entfernen"',
          text:
            'Der Kauf erfolgt über Apple bzw. Google und richtet sich nach deren Bedingungen. Er gilt einmalig für das jeweilige Store-Konto und lässt sich über „Kauf wiederherstellen" auf weiteren Geräten desselben Kontos aktivieren.\n\n' +
            'Rücktritt und Erstattung richten sich nach den Regeln des jeweiligen Stores; dort ist auch der Weg dafür beschrieben. Wir können Zahlungen weder einsehen noch erstatten.',
        },
        {
          titel: 'Verfügbarkeit',
          text: 'Wir bemühen uns um einen störungsfreien Betrieb, schulden aber keine bestimmte Verfügbarkeit. Das Spiel selbst funktioniert vollständig ohne Netzverbindung — Level, Tagesrätsel und Duelle brauchen keine.',
        },
        {
          titel: 'Haftung',
          text: 'Wir haften nach den gesetzlichen Bestimmungen für Vorsatz und grobe Fahrlässigkeit sowie für Schäden an Leben, Körper und Gesundheit. Im Übrigen ist die Haftung auf den vorhersehbaren, vertragstypischen Schaden begrenzt. Zwingende Verbraucherrechte bleiben unberührt.',
        },
        {
          titel: 'Änderungen und Ende',
          text:
            'Wir können diese Bedingungen ändern, wenn es sachlich nötig ist; wesentliche Änderungen weisen wir in der App aus.\n\n' +
            `Du kannst die Nutzung jederzeit beenden, indem du die App entfernst. Fragen an ${BETREIBER.email}.`,
        },
      ],
    },
    en: {
      titel: 'Terms of Use',
      abschnitte: [
        {
          titel: 'What this covers',
          text: 'FixTheMix is a sorting puzzle. These terms apply between you and the provider named in the legal notice for the use of the app and the web app.',
        },
        {
          titel: 'Use',
          text:
            'Use is free of charge. You may use the app privately.\n\n' +
            'You may not modify or reproduce the app or its content, or operate it automatically.',
        },
        {
          titel: 'Coins, videos and the extra glass',
          text:
            'Coins are a number on your device, not a currency and not credit. They cannot be paid out, transferred or returned.\n\n' +
            'Videos are always voluntary: you start them yourself. If a video is not watched to the end there is no reward — that is decided by Google’s ad SDK, not by us.\n\n' +
            'If you delete the app or its data, the coins are gone. There is no claim to restoration.',
        },
        {
          titel: '“Remove ads” purchase',
          text:
            'The purchase is made through Apple or Google and is governed by their terms. It applies once per store account and can be activated on further devices of the same account via “Restore purchase”.\n\n' +
            'Withdrawal and refunds follow the rules of the respective store, which also describes how to request them. We can neither view nor refund payments.',
        },
        {
          titel: 'Availability',
          text: 'We aim for undisturbed operation but do not owe any particular availability. The game itself works entirely without a network connection — levels, the daily puzzle and duels need none.',
        },
        {
          titel: 'Liability',
          text: 'We are liable under statutory provisions for intent and gross negligence as well as for damage to life, body and health. Otherwise liability is limited to foreseeable damage typical for this kind of contract. Mandatory consumer rights remain unaffected.',
        },
        {
          titel: 'Changes and termination',
          text:
            'We may change these terms where objectively necessary; material changes will be pointed out in the app.\n\n' +
            `You can stop using the app at any time by removing it. Questions to ${BETREIBER.email}.`,
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  //  Google Play verlangt eine oeffentlich erreichbare Seite, die den Weg zur
  //  Datenloeschung zeigt — erreichbar OHNE App und OHNE Anmeldung.
  loeschen: {
    de: {
      titel: 'Daten löschen',
      abschnitte: [
        {
          titel: 'In der App löschen',
          text:
            'Dein ganzer Spielstand liegt auf deinem Gerät. Du löschst ihn selbst, ohne uns zu kontaktieren:\n\n' +
            '1. FixTheMix öffnen\n' +
            '2. oben auf „Alle Level" und dann auf „Einstellungen" tippen\n' +
            '3. ganz unten auf „Daten löschen" tippen\n' +
            '4. die Sicherheitsabfrage bestätigen\n\n' +
            'Die Löschung wird sofort ausgeführt. Alternativ genügt es, die App vom Gerät zu entfernen.',
        },
        {
          titel: 'Was dabei gelöscht wird',
          text:
            'Vollständig und unwiderruflich:\n\n' +
            '• erreichte Level und Sterne\n' +
            '• Münzen\n' +
            '• Tagesserie und die Ergebnisse der letzten Tage\n' +
            '• Einstellungen (Sprache, Symbole für Farbenblinde)\n' +
            '• die zufällige Kennung, die der Kauf braucht',
        },
        {
          titel: 'Was bei uns liegt',
          text:
            'Nichts. FixTheMix führt keine Konten, keine Bestenliste und keine Spielstände auf unseren Servern — dein Fortschritt, deine Tagesserie und deine Duellbilanz liegen ausschließlich auf deinem Gerät. Deshalb gibt es bei uns auch nichts zu löschen.\n\n' +
            'Bleibt eine Frage offen, schreib uns an ' + BETREIBER.email + '. Nenne dabei die zufällige Kennung aus den Einstellungen — wir kennen keine Namen und keine E-Mail-Adressen und können eine Anfrage sonst nicht zuordnen.',
        },
        {
          titel: 'Der Kauf „Werbung entfernen"',
          text: 'Der Kaufbeleg liegt bei Apple bzw. Google, nicht bei uns. Dort gelten deren gesetzliche Aufbewahrungsfristen; auf diese Daten haben wir keinen Zugriff. Löschst du deine Daten in der App, bleibt der Kauf über „Kauf wiederherstellen" nutzbar.',
        },
        {
          titel: 'Kein Zurück',
          text: 'Die Löschung ist endgültig. Level, Sterne, Münzen und Serie lassen sich danach nicht wiederherstellen.',
        },
      ],
    },
    en: {
      titel: 'Delete data',
      abschnitte: [
        {
          titel: 'Delete in the app',
          text:
            'All your progress is stored on your device. You delete it yourself, without contacting us:\n\n' +
            '1. Open FixTheMix\n' +
            '2. Tap “All levels” at the top, then “Settings”\n' +
            '3. Tap “Delete data” at the bottom\n' +
            '4. Confirm the safety prompt\n\n' +
            'Deletion happens immediately. Alternatively, simply remove the app from your device.',
        },
        {
          titel: 'What is deleted',
          text:
            'Completely and irreversibly:\n\n' +
            '• levels reached and stars\n' +
            '• coins\n' +
            '• daily streak and the results of recent days\n' +
            '• settings (language, colour-blind symbols)\n' +
            '• the random identifier the purchase needs',
        },
        {
          titel: 'What we hold',
          text:
            'Nothing. FixTheMix keeps no accounts, no leaderboard and no saved games on our servers — your progress, your streak and your duel record live solely on your device. There is therefore nothing for us to delete.\n\n' +
            'If a question remains, email us at ' + BETREIBER.email + '. Please state the random identifier from the settings — we know no names and no email addresses and cannot otherwise match a request.',
        },
        {
          titel: 'The “Remove ads” purchase',
          text: 'The purchase receipt is held by Apple or Google, not by us. Their statutory retention periods apply and we have no access to that data. If you delete your data in the app, the purchase remains usable via “Restore purchase”.',
        },
        {
          titel: 'No way back',
          text: 'Deletion is final. Levels, stars, coins and streak cannot be restored afterwards.',
        },
      ],
    },
  },
};
