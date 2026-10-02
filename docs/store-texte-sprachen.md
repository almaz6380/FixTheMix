# Store-Texte in 18 weiteren Sprachen

Ergänzung zu `docs/store-eintrag.md`. Dort stehen die Texte auf Deutsch und Englisch,
hier dieselben Felder in 18 weiteren Sprachen — passend zu den Sprachdateien in
`src/i18n/locales/` (Wörter für Level, Tagesrätsel, Früchte usw. sind von dort übernommen).

**Wichtig:** Das sind **Maschinenübersetzungen ohne muttersprachliches Gegenlesen.**
Übersetzt wurde aus dem Englischen, mit dem Deutschen als Bezug für die Bedeutung.
Inhaltlich versprechen sie nichts, was die englische Fassung nicht auch verspricht —
aber Ton und Feinheiten hat niemand geprüft, der die Sprache als Erstsprache spricht.
Wer einen Fehler meldet, hat recht, bis das Gegenteil bewiesen ist.

## Wohin welches Feld gehört

| Feld | Grenze | Wo |
|---|---|---|
| Apple Untertitel | 30 | App Store Connect → App → Sprache wählen → App-Informationen → Untertitel |
| Apple Werbetext | 170 | App Store Connect → Version → Sprache → Werbetext (jederzeit änderbar, ohne neue Version) |
| Apple Keywords | 100 | App Store Connect → Version → Sprache → Schlüsselwörter (Komma, **keine** Leerzeichen) |
| Play Titel | 30 | Play Console → Store-Präsenz → Haupteintrag → Übersetzungen → App-Name |
| Play Kurzbeschreibung | 80 | ebenda → Kurzbeschreibung |
| Beschreibung | 4000 | Apple: Version → Sprache → Beschreibung · Play: Übersetzungen → Vollständige Beschreibung |
| ATT-Text | — | Nur zur Ansicht: die gültige Fassung steht in `src/i18n/locales/<code>.json` (`ios.tracking`) und kommt per `node tools/ios-sprachen.mjs` in die App — nichts von Hand eintragen |

Hinweise:

- **Name** bleibt überall `FixTheMix` und wird nicht übersetzt.
- Bei **Vietnamesisch** stehen die Keywords als einzelne Silben, weil mehrsilbige Wörter
  dort Leerzeichen bräuchten. Apple kombiniert Keywords ohnehin selbst.
- Bei **Thai, Japanisch, Koreanisch und Chinesisch** gibt es keine Großschreibung; die
  Zwischenüberschriften der Beschreibung stehen dort einfach als eigene Zeile.
- **Portugiesisch** ist bewusst neutral gehalten (lesbar in Portugal und Brasilien) und
  folgt beim Wort „partilhar" der App.
- Die Zeichenzahlen am Ende sind mit `[...text].length` gezählt (Unicode-Codepunkte).
  Bei Thai und Hindi zählen Vokalzeichen einzeln; die Store-Konsolen zählen teils anders,
  aber eher weniger.

## Spanisch (`es`)

**Apple Untertitel** (max. 30)

```
Puzzle de ordenar colores
```

**Apple Werbetext** (max. 170)

```
999 niveles, cada uno con la solución más corta demostrada: tres estrellas solo para el óptimo real. Y un reto nuevo cada día, el mismo para todos.
```

**Apple Keywords** (max. 100)

```
ordenar,puzzle,agua,vaso,colores,lógica,mente,relax,offline,zumo,jugo,bar,tubos,diario
```

**Play Titel** (max. 30)

```
FixTheMix — Puzzle de ordenar
```

**Play Kurzbeschreibung** (max. 80)

```
Vierte capa a capa hasta que cada vaso tenga un color. 999 niveles, reto diario.
```

**Beschreibung** (max. 4000)

```
Un bar de zumos, una barra llena de vasos, y en cada uno las capas están revueltas. Tu tarea: verter hasta que cada vaso tenga un solo color.

Una regla, nada más. El bloque superior de capas iguales pasa a un vaso vacío o encima del mismo color. Sin tutorial, sin reglas especiales, sin una segunda moneda que primero tengas que entender.

TRES ESTRELLAS SON DE VERDAD TRES ESTRELLAS
En cada uno de los 999 niveles, la solución más corta está demostrada, no estimada. Tres estrellas solo si igualas el óptimo movimiento a movimiento. Gánatelas.

UN RETO AL DÍA, EL MISMO PARA TODOS
Un tablero nuevo cada día, idéntico en todo el mundo. Pequeño el lunes, grande el domingo. Comparte tu resultado sin destripar nada: estrellas, movimientos y una barra, nunca los colores. Y una racha que solo cuenta si de verdad juegas cada día.

MODO DALTÓNICO DESDE EL PRIMER DÍA
Cada uno de los nueve colores lleva su propio símbolo dibujado: fresa, limón, arándano, naranja, manzana, uva, menta, coco, café. Contornos distintos, no solo tonos distintos: se distinguen incluso en escala de grises.

CUANDO TE QUEDAS SIN SALIDA
Puedes meterte en un callejón sin salida, y el juego te lo dice en vez de dejarte adivinar. Entonces tú decides: deshacer un movimiento con monedas, conseguir un vaso extra o empezar de nuevo. Reiniciar siempre es gratis: cada nivel sigue siendo jugable aunque no te queden monedas.

JUSTO, TAMBIÉN CON LA PUBLICIDAD
Nunca un anuncio en mitad de un nivel. Como mucho uno entre niveles, e incluso ese está limitado. Vídeos solo cuando tú los inicias. Y «Quitar la publicidad» es una compra única, no una suscripción.

SIN ALCOHOL
Zumos, batidos, siropes. Nada de cócteles con alcohol, para que la app siga abierta a jugadores más jóvenes.

Funciona sin conexión. Sin cuenta, sin registro, sin correo electrónico.
```

**ATT-Text**

```
Con tu permiso podemos mostrarte anuncios más relevantes. El juego en sí sigue exactamente igual.
```

## Französisch (`fr`)

**Apple Untertitel** (max. 30)

```
Puzzle de tri au bar à jus
```

**Apple Werbetext** (max. 170)

```
999 niveaux, chacun avec la solution la plus courte prouvée : trois étoiles seulement pour le vrai optimum. Et une nouvelle énigme chaque jour, la même pour tous.
```

**Apple Keywords** (max. 100)

```
tri,puzzle,eau,verre,couleurs,logique,cerveau,détente,offline,jus,bar,tubes,quotidien,casse-tête
```

**Play Titel** (max. 30)

```
FixTheMix — Puzzle de tri
```

**Play Kurzbeschreibung** (max. 80)

```
Versez jusqu’à ce que chaque verre soit uni. 999 niveaux, une énigme par jour.
```

**Beschreibung** (max. 4000)

```
Un bar à jus, un comptoir plein de verres, et dans chacun les couches sont en désordre. Votre mission : verser jusqu’à ce que chaque verre ne contienne plus qu’une seule couleur.

Une seule règle, c’est tout. Le bloc supérieur de couches identiques passe dans un verre vide ou sur la même couleur. Pas de tutoriel, pas de règles spéciales, pas de seconde monnaie à comprendre d’abord.

TROIS ÉTOILES, C’EST VRAIMENT TROIS ÉTOILES
Pour chacun des 999 niveaux, la solution la plus courte est prouvée, pas estimée. Trois étoiles seulement si vous égalez l’optimum coup pour coup. À vous de les mériter.

UNE ÉNIGME PAR JOUR, LA MÊME POUR TOUS
Un nouveau plateau chaque jour, identique dans le monde entier. Petit le lundi, grand le dimanche. Partagez votre résultat sans rien dévoiler : des étoiles, des coups et une barre, jamais les couleurs. Et une série qui ne compte que si vous jouez vraiment chaque jour.

MODE DALTONIEN DÈS LE PREMIER JOUR
Chacune des neuf couleurs porte son propre symbole dessiné : fraise, citron, myrtille, orange, pomme, raisin, menthe, coco, café. Des contours différents, pas seulement des teintes différentes : on les distingue même en niveaux de gris.

QUAND VOUS ÊTES BLOQUÉ
On peut se retrouver coincé, et le jeu vous le dit au lieu de vous laisser deviner. À vous de choisir : racheter un coup, prendre un verre supplémentaire ou recommencer. Recommencer est toujours gratuit : chaque niveau reste jouable, même sans pièces.

ÉQUITABLE, PUBLICITÉ COMPRISE
Jamais de publicité au milieu d’un niveau. Au plus une entre deux niveaux, et même celle-ci est limitée. Des vidéos uniquement quand vous les lancez vous-même. Et « Supprimer la publicité » est un achat unique, pas un abonnement.

SANS ALCOOL
Jus, smoothies, sirops. Pas de romantisme de cocktails, pour que l’app reste ouverte aux plus jeunes.

Fonctionne hors ligne. Pas de compte, pas d’inscription, pas d’adresse e-mail.
```

**ATT-Text**

```
Avec votre autorisation, nous pouvons vous montrer des publicités plus pertinentes. Le jeu lui-même reste exactement le même.
```

## Portugiesisch (`pt`)

**Apple Untertitel** (max. 30)

```
Puzzle de ordenar no bar
```

**Apple Werbetext** (max. 170)

```
999 níveis, cada um com a solução mais curta comprovada: três estrelas só para o ótimo verdadeiro. E um desafio novo todos os dias, igual para todos.
```

**Apple Keywords** (max. 100)

```
ordenar,puzzle,água,copo,cores,lógica,cérebro,relaxar,offline,suco,sumo,bar,tubos,diário
```

**Play Titel** (max. 30)

```
FixTheMix — Puzzle de ordenar
```

**Play Kurzbeschreibung** (max. 80)

```
Despeje até cada copo ter uma só cor. 999 níveis e um desafio por dia.
```

**Beschreibung** (max. 4000)

```
Um bar de bebidas de fruta, um balcão cheio de copos, e em cada um as camadas estão todas misturadas. A sua missão: despejar até que cada copo tenha uma única cor.

Uma regra, mais nada. O bloco de cima com camadas iguais passa para um copo vazio ou para cima da mesma cor. Sem tutorial, sem regras especiais, sem uma segunda moeda que precise de entender primeiro.

TRÊS ESTRELAS SÃO MESMO TRÊS ESTRELAS
Em cada um dos 999 níveis, a solução mais curta está comprovada, não estimada. Três estrelas só se igualar o ótimo movimento a movimento. Faça por merecer.

UM DESAFIO POR DIA, IGUAL PARA TODOS
Um tabuleiro novo todos os dias, idêntico no mundo inteiro. Pequeno às segundas, grande aos domingos. Partilhe o seu resultado sem revelar a solução: estrelas, movimentos e uma barra, nunca as cores. E uma sequência que só conta se jogar mesmo todos os dias.

MODO PARA DALTONISMO DESDE O PRIMEIRO DIA
Cada uma das nove cores tem o seu próprio símbolo desenhado: morango, limão, mirtilo, laranja, maçã, uva, menta, coco, café. Contornos diferentes, não só tons diferentes: dá para distingui-las até em preto e branco.

QUANDO FICAR SEM SAÍDA
É possível ficar encurralado, e o jogo avisa, sem adivinhações. Aí a escolha é sua: comprar um movimento de volta, buscar um copo extra ou recomeçar. Recomeçar é sempre grátis: todos os níveis continuam jogáveis, mesmo sem moedas.

JUSTO, TAMBÉM NA PUBLICIDADE
Nunca um anúncio no meio de um nível. No máximo um entre níveis, e mesmo esse com limite. Vídeos só quando decidir vê-los. E «Remover a publicidade» é uma compra única, sem pagamentos recorrentes.

SEM ÁLCOOL
Bebidas de fruta, smoothies, xaropes. Nada de bebidas alcoólicas, para que o jogo continue aberto a jogadores mais jovens.

Funciona offline. Sem conta, sem login, sem e-mail.
```

**ATT-Text**

```
Com a sua permissão, podemos mostrar anúncios mais relevantes. O jogo em si continua exatamente igual.
```

## Italienisch (`it`)

**Apple Untertitel** (max. 30)

```
Ordina i succhi al bancone
```

**Apple Werbetext** (max. 170)

```
999 livelli, ognuno con la soluzione più breve dimostrata: tre stelle solo per il vero ottimo. E ogni giorno una nuova sfida, uguale per tutti.
```

**Apple Keywords** (max. 100)

```
ordina,puzzle,acqua,bicchiere,colori,logica,cervello,relax,offline,succo,bar,provette,giornaliero
```

**Play Titel** (max. 30)

```
FixTheMix — Puzzle a colori
```

**Play Kurzbeschreibung** (max. 80)

```
Versa strato dopo strato finché ogni bicchiere ha un solo colore. 999 livelli.
```

**Beschreibung** (max. 4000)

```
Un succo bar, un bancone pieno di bicchieri, e in ognuno gli strati sono tutti mescolati. Il tuo compito: versare finché ogni bicchiere ha un solo colore.

Una regola, nient'altro. Il blocco più in alto di strati uguali passa in un bicchiere vuoto o sullo stesso colore. Niente tutorial, niente regole speciali, nessuna seconda valuta da capire prima.

TRE STELLE SONO DAVVERO TRE STELLE
Per ognuno dei 999 livelli la soluzione più breve è dimostrata, non stimata. Tre stelle solo se eguagli l'ottimo mossa per mossa. Guadagnatele.

UNA SFIDA AL GIORNO, UGUALE PER TUTTI
Ogni giorno uno schema nuovo, identico in tutto il mondo. Piccolo il lunedì, grande la domenica. Condividi il tuo risultato senza spoiler: stelle, mosse e una barra, mai i colori. E una serie che conta solo se giochi davvero ogni giorno.

MODALITÀ DALTONICI DAL PRIMO GIORNO
Ognuno dei nove colori ha il suo simbolo disegnato: fragola, limone, mirtillo, arancia, mela, uva, menta, cocco, caffè. Contorni diversi, non solo tonalità diverse: si distinguono anche in scala di grigi.

QUANDO TI BLOCCHI
Puoi finire in un vicolo cieco, e il gioco te lo dice invece di lasciarti indovinare. Poi decidi tu: riprenderti una mossa con le monete, prendere un bicchiere extra o ricominciare. Ricominciare è sempre gratis: ogni livello resta giocabile anche senza monete.

CORRETTO, ANCHE CON LA PUBBLICITÀ
Mai una pubblicità a metà livello. Al massimo una tra un livello e l'altro, e anche quella con un limite. Video solo quando li avvii tu. E "Rimuovi pubblicità" è un acquisto unico, non un abbonamento.

ANALCOLICO
Succhi, frullati, sciroppi. Niente cocktail alcolici, così l'app resta aperta anche ai giocatori più giovani.

Funziona offline. Nessun account, nessuna registrazione, nessun indirizzo email.
```

**ATT-Text**

```
Con il tuo permesso possiamo mostrarti annunci più pertinenti. Il gioco resta esattamente lo stesso.
```

## Niederländisch (`nl`)

**Apple Untertitel** (max. 30)

```
Sorteerpuzzel in de sapbar
```

**Apple Werbetext** (max. 170)

```
999 levels, elk met een bewezen kortste oplossing: drie sterren alleen voor het echte optimum. Plus elke dag een nieuwe puzzel, voor iedereen dezelfde.
```

**Apple Keywords** (max. 100)

```
sorteren,puzzel,water,glas,kleuren,logica,brein,ontspannen,offline,sap,bar,buisjes,dagelijks
```

**Play Titel** (max. 30)

```
FixTheMix — Sorteerpuzzel
```

**Play Kurzbeschreibung** (max. 80)

```
Giet laag voor laag tot elk glas één kleur heeft. 999 levels en een dagpuzzel.
```

**Beschreibung** (max. 4000)

```
Een sapbar, een bar vol glazen, en in elk glas liggen de lagen door elkaar. Jouw taak: gieten tot elk glas één enkele kleur heeft.

Eén regel, meer niet. Het bovenste blok gelijke lagen gaat naar een leeg glas of op dezelfde kleur. Geen tutorial, geen speciale regels, geen tweede munteenheid die je eerst moet doorgronden.

DRIE STERREN BETEKENT ECHT DRIE STERREN
Voor elk van de 999 levels is de kortste oplossing bewezen, niet geschat. Drie sterren alleen als je het optimum zet voor zet evenaart. Verdien ze.

EEN PUZZEL PER DAG, VOOR IEDEREEN DEZELFDE
Elke dag een nieuw bord, wereldwijd identiek. Klein op maandag, groot op zondag. Deel je resultaat zonder iets te verklappen: sterren, zetten en een balk, nooit de kleuren. En een reeks die alleen telt als je echt elke dag speelt.

KLEURENBLINDMODUS VANAF DAG ÉÉN
Elk van de negen kleuren heeft een eigen getekend symbool: aardbei, citroen, bosbes, sinaasappel, appel, druif, munt, kokos, koffie. Verschillende vormen, niet alleen verschillende tinten: ook in grijstinten uit elkaar te houden.

ALS JE VASTLOOPT
Je kunt jezelf klem zetten, en de game zegt het je in plaats van je te laten raden. Dan kies jij: een zet terugkopen, een extra glas pakken of opnieuw beginnen. Opnieuw beginnen is altijd gratis: elk level blijft speelbaar, ook zonder munten.

EERLIJK, OOK MET RECLAME
Nooit een advertentie midden in een level. Hooguit één tussen levels, en ook die wordt afgeremd. Video's alleen als je ze zelf start. En "Advertenties weg" is een eenmalige aankoop, geen abonnement.

ALCOHOLVRIJ
Sappen, smoothies, siropen. Geen cocktailromantiek, zodat de app ook open blijft voor jongere spelers.

Werkt offline. Geen account, geen aanmelding, geen e-mailadres.
```

**ATT-Text**

```
Met je toestemming kunnen we je relevantere advertenties tonen. Het spel zelf blijft precies hetzelfde.
```

## Polnisch (`pl`)

**Apple Untertitel** (max. 30)

```
Sortowanie soków w barze
```

**Apple Werbetext** (max. 170)

```
999 poziomów, każdy z udowodnionym najkrótszym rozwiązaniem: trzy gwiazdki tylko za prawdziwe optimum. Do tego codziennie nowa zagadka, ta sama dla wszystkich.
```

**Apple Keywords** (max. 100)

```
sortowanie,puzzle,woda,szklanka,kolory,logika,łamigłówka,relaks,offline,sok,bar,probówki
```

**Play Titel** (max. 30)

```
FixTheMix — Sortowanie kolorów
```

**Play Kurzbeschreibung** (max. 80)

```
Przelewaj, aż każda szklanka będzie jednego koloru. 999 poziomów i zagadka dnia.
```

**Beschreibung** (max. 4000)

```
Bar z sokami, lada pełna szklanek, a w każdej warstwy są wymieszane. Twoje zadanie: przelewać, aż każda szklanka będzie miała jeden kolor.

Jedna zasada i tyle. Górny blok takich samych warstw trafia do pustej szklanki albo na ten sam kolor. Bez samouczka, bez specjalnych zasad, bez drugiej waluty, którą trzeba najpierw rozgryźć.

TRZY GWIAZDKI TO NAPRAWDĘ TRZY GWIAZDKI
Dla każdego z 999 poziomów najkrótsze rozwiązanie jest udowodnione, a nie oszacowane. Trzy gwiazdki tylko wtedy, gdy dorównasz optimum ruch w ruch. Zasłuż na nie.

JEDNA ZAGADKA DZIENNIE, TA SAMA DLA WSZYSTKICH
Codziennie nowa plansza, identyczna na całym świecie. W poniedziałek mała, w niedzielę duża. Udostępnij wynik bez zdradzania rozwiązania: gwiazdki, ruchy i pasek, nigdy kolory. I seria, która liczy się tylko wtedy, gdy naprawdę grasz codziennie.

TRYB DLA DALTONISTÓW OD PIERWSZEGO DNIA
Każdy z dziewięciu kolorów ma własny rysowany symbol: truskawka, cytryna, borówka, pomarańcza, jabłko, winogrono, mięta, kokos, kawa. Różne kształty, nie tylko różne odcienie: da się je odróżnić nawet w skali szarości.

GDY UTKNIESZ
Możesz zapędzić się w kozi róg, a gra powie ci o tym, zamiast kazać ci zgadywać. Wtedy wybór należy do ciebie: odkup ruch, weź dodatkową szklankę albo zacznij od nowa. Restart jest zawsze darmowy: każdy poziom pozostaje grywalny nawet z pustym portfelem.

UCZCIWIE, TAKŻE Z REKLAMAMI
Nigdy reklamy w środku poziomu. Najwyżej jedna między poziomami, i to z ograniczeniem. Filmy tylko wtedy, gdy sam je uruchomisz. A „Usuń reklamy” to jednorazowy zakup, a nie subskrypcja.

BEZ ALKOHOLU
Soki, smoothie, syropy. Żadnej koktajlowej romantyki z procentami, żeby gra była dostępna także dla młodszych graczy.

Działa offline. Bez konta, bez rejestracji, bez adresu e-mail.
```

**ATT-Text**

```
Za twoją zgodą możemy wyświetlać ci trafniejsze reklamy. Sama gra pozostaje dokładnie taka sama.
```

## Türkisch (`tr`)

**Apple Untertitel** (max. 30)

```
Meyve suyu barında sıralama
```

**Apple Werbetext** (max. 170)

```
999 seviye, her birinin en kısa çözümü kanıtlanmış: üç yıldız yalnızca gerçek optimuma. Üstelik her gün herkes için aynı yeni bir bulmaca.
```

**Apple Keywords** (max. 100)

```
sıralama,bulmaca,su,bardak,renk,mantık,zeka,rahatla,offline,meyvesuyu,bar,tüp,günlük
```

**Play Titel** (max. 30)

```
FixTheMix — Renk Sıralama
```

**Play Kurzbeschreibung** (max. 80)

```
Her bardak tek renk olana dek katman katman dök. 999 seviye, günlük bulmaca.
```

**Beschreibung** (max. 4000)

```
Bir meyve suyu barı, bardaklarla dolu bir tezgâh ve her birinde katmanlar birbirine karışmış. Görevin: her bardakta tek bir renk kalana kadar dökmek.

Tek kural, o kadar. En üstteki aynı renk katman bloğu boş bir bardağa ya da aynı rengin üstüne geçer. Eğitim yok, özel kural yok, önce çözmen gereken ikinci bir para birimi yok.

ÜÇ YILDIZ GERÇEKTEN ÜÇ YILDIZ DEMEK
999 seviyenin her birinde en kısa çözüm tahmin edilmedi, kanıtlandı. Üç yıldız yalnızca optimumu hamle hamle yakalarsan. Hak et.

GÜNDE BİR BULMACA, HERKES İÇİN AYNI
Her gün yeni bir tahta, tüm dünyada aynı. Pazartesi küçük, pazar büyük. Sonucunu çözümü ele vermeden paylaş: yıldızlar, hamleler ve bir çubuk, renkler asla. Ve yalnızca gerçekten her gün oynarsan sayılan bir seri.

İLK GÜNDEN RENK KÖRÜ MODU
Dokuz rengin her biri kendi çizilmiş sembolünü taşır: çilek, limon, yaban mersini, portakal, elma, üzüm, nane, hindistan cevizi, kahve. Sadece farklı tonlar değil, farklı şekiller: gri tonlamada bile ayırt edilebilir.

TAKILDIĞINDA
Kendini köşeye sıkıştırabilirsin ve oyun seni tahmin etmeye bırakmak yerine bunu sana söyler. Sonra karar senin: bir hamleyi geri satın al, ekstra bir bardak al ya da baştan başla. Yeniden başlamak her zaman ücretsiz: jetonun kalmasa bile her seviye oynanabilir kalır.

ADİL, REKLAMLAR DAHİL
Seviyenin ortasında asla reklam yok. Seviyeler arasında en fazla bir tane, o da sınırlı. Videolar yalnızca sen başlatırsan. Ve "Reklamları kaldır" tek seferlik bir satın alma, abonelik değil.

ALKOLSÜZ
Meyve suları, smoothie'ler, şuruplar. Kokteyl havası yok, böylece uygulama daha genç oyunculara da açık kalır.

Çevrimdışı çalışır. Hesap yok, kayıt yok, e-posta adresi yok.
```

**ATT-Text**

```
İznin olursa sana daha ilgili reklamlar gösterebiliriz. Oyunun kendisi tamamen aynı kalır.
```

## Russisch (`ru`)

**Apple Untertitel** (max. 30)

```
Сортируй соки в баре
```

**Apple Werbetext** (max. 170)

```
999 уровней, у каждого доказано самое короткое решение: три звезды — только за настоящий оптимум. И каждый день новая головоломка, одна для всех.
```

**Apple Keywords** (max. 100)

```
сортировка,головоломка,вода,стакан,цвета,логика,мозг,релакс,офлайн,сок,бар,пробирки
```

**Play Titel** (max. 30)

```
FixTheMix — Сортировка цветов
```

**Play Kurzbeschreibung** (max. 80)

```
Переливай слой за слоем, пока каждый стакан не станет одного цвета. 999 уровней.
```

**Beschreibung** (max. 4000)

```
Бар соков, стойка, полная стаканов, и в каждом слои перемешаны. Твоя задача: переливать, пока в каждом стакане не останется один цвет.

Одно правило, и всё. Верхний блок одинаковых слоёв переходит в пустой стакан или на такой же цвет. Без обучения, без особых правил, без второй валюты, в которой надо сначала разбираться.

ТРИ ЗВЕЗДЫ — ЭТО ДЕЙСТВИТЕЛЬНО ТРИ ЗВЕЗДЫ
Для каждого из 999 уровней самое короткое решение доказано, а не оценено на глаз. Три звезды — только если повторишь оптимум ход в ход. Заслужи их.

ОДНА ГОЛОВОЛОМКА В ДЕНЬ, ОДНА ДЛЯ ВСЕХ
Каждый день новое поле, одинаковое во всём мире. В понедельник маленькое, в воскресенье большое. Делись результатом без спойлеров: звёзды, ходы и полоска, но никогда цвета. И серия, которая растёт, только если ты действительно играешь каждый день.

РЕЖИМ ДЛЯ ДАЛЬТОНИКОВ С ПЕРВОГО ДНЯ
У каждого из девяти цветов свой нарисованный символ: клубника, лимон, черника, апельсин, яблоко, виноград, мята, кокос, кофе. Разные формы, а не только разные оттенки: их можно различить даже в оттенках серого.

ЕСЛИ ЗАСТРЯЛ
Можно загнать себя в тупик, и игра скажет тебе об этом, а не заставит гадать. Дальше выбор за тобой: выкупить ход назад, взять дополнительный стакан или начать заново. Перезапуск всегда бесплатный: каждый уровень остаётся проходимым даже с пустым кошельком.

ЧЕСТНО, В ТОМ ЧИСЛЕ С РЕКЛАМОЙ
Никакой рекламы посреди уровня. Максимум одна между уровнями, и та ограничена. Видео — только когда ты сам их запускаешь. А «Убрать рекламу» — разовая покупка, а не подписка.

БЕЗ АЛКОГОЛЯ
Соки, смузи, сиропы. Никакой коктейльной романтики, чтобы игра оставалась доступной и для младших игроков.

Работает офлайн. Без аккаунта, без регистрации, без адреса электронной почты.
```

**ATT-Text**

```
С твоего разрешения мы можем показывать тебе более подходящую рекламу. Сама игра остаётся точно такой же.
```

## Ukrainisch (`uk`)

**Apple Untertitel** (max. 30)

```
Сортуй соки в барі
```

**Apple Werbetext** (max. 170)

```
999 рівнів, у кожного доведено найкоротший розв’язок: три зірки — лише за справжній оптимум. І щодня нова головоломка, одна для всіх.
```

**Apple Keywords** (max. 100)

```
сортування,головоломка,вода,склянка,кольори,логіка,мозок,релакс,офлайн,сік,бар,пробірки
```

**Play Titel** (max. 30)

```
FixTheMix — Сортування
```

**Play Kurzbeschreibung** (max. 80)

```
Переливай шар за шаром, доки кожна склянка не стане одного кольору. 999 рівнів.
```

**Beschreibung** (max. 4000)

```
Сік-бар, стійка, повна склянок, і в кожній шари перемішані. Твоє завдання: переливати, доки в кожній склянці не залишиться один колір.

Одне правило, і все. Верхній блок однакових шарів переходить у порожню склянку або на такий самий колір. Без навчання, без особливих правил, без другої валюти, в якій спершу треба розібратися.

ТРИ ЗІРКИ — ЦЕ СПРАВДІ ТРИ ЗІРКИ
Для кожного з 999 рівнів найкоротший розв’язок доведено, а не оцінено навмання. Три зірки — лише якщо повториш оптимум хід у хід. Заслужи їх.

ОДНА ГОЛОВОЛОМКА НА ДЕНЬ, ОДНА ДЛЯ ВСІХ
Щодня нове поле, однакове в усьому світі. У понеділок маленьке, у неділю велике. Ділися результатом без спойлерів: зірки, ходи й смужка, але ніколи кольори. І серія, яка рахується, лише якщо ти справді граєш щодня.

РЕЖИМ ДЛЯ ДАЛЬТОНІКІВ ІЗ ПЕРШОГО ДНЯ
Кожен із дев’яти кольорів має власний намальований символ: полуниця, лимон, чорниця, апельсин, яблуко, виноград, м’ята, кокос, кава. Різні обриси, а не лише різні відтінки: їх можна розрізнити навіть у відтінках сірого.

ЯКЩО ЗАСТРЯГ
Можна загнати себе в глухий кут, і гра скаже тобі про це, а не змусить вгадувати. Далі вибір за тобою: викупити хід назад, узяти додаткову склянку або почати знову. Перезапуск завжди безкоштовний: кожен рівень лишається прохідним навіть із порожнім гаманцем.

ЧЕСНО, ЗОКРЕМА З РЕКЛАМОЮ
Жодної реклами посеред рівня. Щонайбільше одна між рівнями, і та обмежена. Відео — лише коли ти сам їх запускаєш. А «Прибрати рекламу» — разова покупка, а не підписка.

БЕЗ АЛКОГОЛЮ
Соки, смузі, сиропи. Жодної коктейльної романтики, щоб гра залишалася доступною й для молодших гравців.

Працює офлайн. Без акаунта, без реєстрації, без адреси електронної пошти.
```

**ATT-Text**

```
З твого дозволу ми можемо показувати тобі доречнішу рекламу. Сама гра залишається точно такою самою.
```

## Arabisch (`ar`)

**Apple Untertitel** (max. 30)

```
لغز ترتيب العصائر في البار
```

**Apple Werbetext** (max. 170)

```
999 مستوى، لكل منها أقصر حل مُثبَت: ثلاث نجوم فقط للحل الأمثل الحقيقي. ومعها لغز جديد كل يوم، نفسه للجميع.
```

**Apple Keywords** (max. 100)

```
ترتيب,لغز,ألغاز,ماء,كأس,ألوان,منطق,ذكاء,استرخاء,عصير,بار,أنابيب,يومي,فرز
```

**Play Titel** (max. 30)

```
FixTheMix — لغز الترتيب
```

**Play Kurzbeschreibung** (max. 80)

```
اسكب طبقة تلو الأخرى حتى يصبح كل كأس بلون واحد. 999 مستوى ولغز كل يوم.
```

**Beschreibung** (max. 4000)

```
بار عصائر، ومنضدة مليئة بالكؤوس، وفي كل كأس طبقات مختلطة. مهمتك: أن تسكب حتى يحمل كل كأس لونًا واحدًا فقط.

قاعدة واحدة، لا أكثر. الكتلة العلوية من الطبقات المتشابهة تنتقل إلى كأس فارغة أو فوق اللون نفسه. لا درس تعليمي، ولا قواعد خاصة، ولا عملة ثانية عليك أن تفهمها أولًا.

ثلاث نجوم تعني فعلًا ثلاث نجوم
في كل مستوى من المستويات الـ999 أقصر حل مُثبَت، لا مُقدَّر. ثلاث نجوم فقط إذا طابقت الحل الأمثل حركة بحركة. استحقها.

لغز واحد كل يوم، نفسه للجميع
لوحة جديدة كل يوم، متطابقة في العالم كله. صغيرة يوم الاثنين، كبيرة يوم الأحد. شارك نتيجتك دون أن تكشف الحل: نجوم وحركات وشريط، ولا ألوان أبدًا. وسلسلة لا تُحسب إلا إذا لعبت فعلًا كل يوم.

وضع عمى الألوان من اليوم الأول
كل لون من الألوان التسعة يحمل رمزًا مرسومًا خاصًا به: فراولة، ليمون، توت أزرق، برتقال، تفاح، عنب، نعناع، جوز الهند، قهوة. أشكال مختلفة، لا درجات مختلفة فحسب: يمكنك التمييز بينها حتى بالأبيض والأسود.

عندما تعلق
قد تحشر نفسك في طريق مسدود، واللعبة تخبرك بذلك بدل أن تتركك تخمّن. والقرار لك: استرجع حركة مقابل العملات، أو احصل على كأس إضافية، أو ابدأ من جديد. البدء من جديد مجاني دائمًا: كل مستوى يبقى قابلًا للعب حتى برصيد فارغ.

عادلة، حتى في الإعلانات
لا إعلانات أبدًا في منتصف المستوى. إعلان واحد على الأكثر بين المستويات، وحتى هذا محدود. الفيديوهات فقط عندما تشغّلها بنفسك. و«إزالة الإعلانات» شراء لمرة واحدة، وليس اشتراكًا.

خالية من الكحول
عصائر، سموذي، شراب فواكه. لا أجواء كوكتيلات، لكي تبقى اللعبة متاحة للاعبين الأصغر سنًا.

تعمل دون إنترنت. لا حساب، ولا تسجيل، ولا بريد إلكتروني.
```

**ATT-Text**

```
بإذنك يمكننا أن نعرض لك إعلانات أكثر ملاءمة. اللعبة نفسها تبقى كما هي تمامًا.
```

## Hindi (`hi`)

**Apple Untertitel** (max. 30)

```
जूस बार में रंग छाँटो
```

**Apple Werbetext** (max. 170)

```
999 लेवल, हर एक का सबसे छोटा हल साबित: तीन स्टार सिर्फ़ असली बेस्ट पर। साथ में हर दिन एक नई पहेली, सबके लिए एक जैसी।
```

**Apple Keywords** (max. 100)

```
सॉर्ट,पहेली,पानी,गिलास,रंग,लॉजिक,दिमाग,आराम,ऑफ़लाइन,जूस,बार,sort,puzzle
```

**Play Titel** (max. 30)

```
FixTheMix — सॉर्ट पहेली
```

**Play Kurzbeschreibung** (max. 80)

```
परत दर परत उड़ेलो, जब तक हर गिलास एक रंग का न हो। 999 लेवल, रोज़ पहेली।
```

**Beschreibung** (max. 4000)

```
एक जूस बार, गिलासों से भरा काउंटर, और हर गिलास में परतें आपस में मिली हुई हैं। तुम्हारा काम: तब तक उड़ेलते रहो जब तक हर गिलास में सिर्फ़ एक रंग न रह जाए।

बस एक नियम। ऊपर का एक जैसी परतों वाला हिस्सा किसी खाली गिलास में या उसी रंग के ऊपर जाता है। कोई ट्यूटोरियल नहीं, कोई ख़ास नियम नहीं, कोई दूसरी करेंसी नहीं जिसे पहले समझना पड़े।

तीन स्टार का मतलब सच में तीन स्टार
999 में से हर लेवल का सबसे छोटा हल साबित किया गया है, अंदाज़ा नहीं लगाया गया। तीन स्टार सिर्फ़ तब, जब तुम चाल-दर-चाल बेस्ट हल की बराबरी करो। कमाकर दिखाओ।

रोज़ एक पहेली, सबके लिए एक जैसी
हर दिन एक नया बोर्ड, पूरी दुनिया में एक जैसा। सोमवार को छोटा, रविवार को बड़ा। अपना नतीजा शेयर करो, हल बताए बिना: स्टार, चालें और एक पट्टी, रंग कभी नहीं। और एक स्ट्रीक जो तभी गिनी जाती है जब तुम सच में रोज़ खेलो।

पहले दिन से कलर-ब्लाइंड मोड
नौ में से हर रंग का अपना बना हुआ चिह्न है: स्ट्रॉबेरी, नींबू, ब्लूबेरी, संतरा, सेब, अंगूर, पुदीना, नारियल, कॉफ़ी। अलग-अलग आकार, सिर्फ़ अलग शेड नहीं: ग्रेस्केल में भी पहचाने जा सकते हैं।

जब फँस जाओ
तुम ख़ुद को ऐसी जगह फँसा सकते हो जहाँ से रास्ता न हो, और गेम तुम्हें अंदाज़ा लगाने के लिए छोड़ने के बजाय बता देता है। फिर फ़ैसला तुम्हारा: सिक्कों से एक चाल वापस लो, एक एक्स्ट्रा गिलास लो, या फिर से शुरू करो। दोबारा शुरू करना हमेशा मुफ़्त है: ख़ाली जेब के साथ भी हर लेवल खेला जा सकता है।

ईमानदार, विज्ञापनों में भी
लेवल के बीच में कभी विज्ञापन नहीं। दो लेवल के बीच ज़्यादा से ज़्यादा एक, और वह भी सीमित। वीडियो सिर्फ़ तब, जब तुम ख़ुद चलाओ। और "विज्ञापन हटाओ" एक बार की ख़रीद है, सब्सक्रिप्शन नहीं।

बिना शराब
जूस, स्मूदी, सिरप। कोई कॉकटेल वाला माहौल नहीं, ताकि ऐप छोटे खिलाड़ियों के लिए भी खुला रहे।

ऑफ़लाइन चलता है। कोई अकाउंट नहीं, कोई साइन-अप नहीं, कोई ईमेल पता नहीं।
```

**ATT-Text**

```
तुम्हारी अनुमति से हम तुम्हें ज़्यादा काम के विज्ञापन दिखा सकते हैं। गेम ख़ुद बिल्कुल वैसा ही रहता है।
```

## Indonesisch (`id`)

**Apple Untertitel** (max. 30)

```
Puzzle sortir di bar jus
```

**Apple Werbetext** (max. 170)

```
999 level, masing-masing dengan solusi terpendek yang terbukti: tiga bintang hanya untuk optimum sejati. Plus teka-teki baru setiap hari, sama untuk semua.
```

**Apple Keywords** (max. 100)

```
sortir,puzzle,air,gelas,warna,logika,otak,santai,offline,jus,bar,tabung,harian,tekateki
```

**Play Titel** (max. 30)

```
FixTheMix — Puzzle Sortir
```

**Play Kurzbeschreibung** (max. 80)

```
Tuang sampai tiap gelas hanya berisi satu warna. 999 level dan teka-teki harian.
```

**Beschreibung** (max. 4000)

```
Sebuah bar jus, meja penuh gelas, dan lapisan di setiap gelas campur aduk. Tugasmu: tuang sampai setiap gelas hanya berisi satu warna.

Satu aturan, itu saja. Blok teratas dari lapisan yang sama pindah ke gelas kosong atau ke atas warna yang sama. Tanpa tutorial, tanpa aturan khusus, tanpa mata uang kedua yang harus kamu pahami dulu.

TIGA BINTANG BENAR-BENAR TIGA BINTANG
Untuk setiap dari 999 level, solusi terpendeknya terbukti, bukan perkiraan. Tiga bintang hanya jika kamu menyamai optimum langkah demi langkah. Raih dengan usaha.

SATU TEKA-TEKI SEHARI, SAMA UNTUK SEMUA
Papan baru setiap hari, sama di seluruh dunia. Kecil di hari Senin, besar di hari Minggu. Bagikan hasilmu tanpa membocorkan apa pun: bintang, langkah, dan satu bilah, tidak pernah warnanya. Dan rentetan hari yang hanya bertambah kalau kamu benar-benar main setiap hari.

MODE BUTA WARNA SEJAK HARI PERTAMA
Masing-masing dari sembilan warna punya simbol gambar sendiri: stroberi, lemon, blueberry, jeruk, apel, anggur, mint, kelapa, kopi. Bentuk yang berbeda, bukan cuma nuansa yang berbeda: tetap bisa dibedakan dalam skala abu-abu.

KALAU KAMU BUNTU
Kamu bisa terjebak sendiri, dan game ini memberitahumu alih-alih membiarkanmu menebak. Lalu kamu yang pilih: beli kembali satu langkah, ambil gelas ekstra, atau mulai lagi. Mulai ulang selalu gratis: setiap level tetap bisa dimainkan meski koinmu habis.

ADIL, TERMASUK SOAL IKLAN
Tidak pernah ada iklan di tengah level. Paling banyak satu di antara level, dan itu pun dibatasi. Video hanya kalau kamu sendiri yang memulainya. Dan "Hapus iklan" adalah pembelian sekali, bukan langganan.

BEBAS ALKOHOL
Jus, smoothie, sirup. Tanpa nuansa koktail, supaya aplikasi ini tetap terbuka untuk pemain yang lebih muda.

Bisa dimainkan offline. Tanpa akun, tanpa pendaftaran, tanpa alamat email.
```

**ATT-Text**

```
Dengan izinmu, kami bisa menampilkan iklan yang lebih relevan. Game-nya sendiri tetap sama persis.
```

## Vietnamesisch (`vi`)

**Apple Untertitel** (max. 30)

```
Xếp màu nước ép tại quầy bar
```

**Apple Werbetext** (max. 170)

```
999 màn, mỗi màn có lời giải ngắn nhất đã được chứng minh: ba sao chỉ dành cho nước đi tối ưu thật sự. Thêm câu đố mới mỗi ngày, giống nhau cho mọi người.
```

**Apple Keywords** (max. 100)

```
xếp,màu,sắp,đố,ly,nước,ép,logic,trí,tuệ,thư,giãn,offline,bar,ống,ngày,puzzle,sort
```

**Play Titel** (max. 30)

```
FixTheMix — Đố xếp màu
```

**Play Kurzbeschreibung** (max. 80)

```
Rót từng lớp đến khi mỗi ly chỉ còn một màu. 999 màn, mỗi ngày một câu đố.
```

**Beschreibung** (max. 4000)

```
Một quầy bar nước ép, một quầy đầy ly, và trong mỗi ly các lớp đều lẫn lộn. Nhiệm vụ của bạn: rót cho đến khi mỗi ly chỉ còn một màu.

Chỉ một luật, vậy thôi. Khối các lớp cùng màu trên cùng sẽ chuyển sang một ly trống hoặc lên trên đúng màu đó. Không hướng dẫn, không luật đặc biệt, không có loại tiền thứ hai phải tìm hiểu trước.

BA SAO THẬT SỰ LÀ BA SAO
Với mỗi màn trong 999 màn, lời giải ngắn nhất đã được chứng minh, không phải ước đoán. Ba sao chỉ khi bạn bằng đúng số nước tối ưu, từng nước một. Hãy giành lấy chúng.

MỖI NGÀY MỘT CÂU ĐỐ, GIỐNG NHAU CHO TẤT CẢ
Mỗi ngày một bàn chơi mới, giống hệt nhau trên toàn thế giới. Thứ Hai nhỏ, Chủ Nhật lớn. Chia sẻ kết quả mà không tiết lộ lời giải: số sao, số nước đi và một thanh, không bao giờ có màu. Và một chuỗi ngày chỉ được tính khi bạn thật sự chơi mỗi ngày.

CHẾ ĐỘ MÙ MÀU NGAY TỪ NGÀY ĐẦU
Mỗi màu trong chín màu đều có ký hiệu được vẽ riêng: dâu tây, chanh vàng, việt quất, cam, táo, nho, bạc hà, dừa, cà phê. Hình dạng khác nhau, không chỉ sắc độ khác nhau: vẫn phân biệt được ở thang độ xám.

KHI BẠN BẾ TẮC
Bạn có thể tự dồn mình vào ngõ cụt, và trò chơi sẽ báo cho bạn thay vì để bạn đoán. Rồi bạn quyết định: mua lại một nước đi, lấy thêm một ly, hoặc chơi lại từ đầu. Chơi lại luôn miễn phí: mọi màn vẫn chơi được kể cả khi hết xu.

CÔNG BẰNG, KỂ CẢ QUẢNG CÁO
Không bao giờ có quảng cáo giữa màn. Tối đa một quảng cáo giữa các màn, và cả nó cũng bị giới hạn. Video chỉ khi chính bạn bấm xem. Và "Xóa quảng cáo" là mua một lần, không phải gói đăng ký.

KHÔNG CỒN
Nước ép, sinh tố, siro. Không có không khí cocktail, để ứng dụng vẫn phù hợp với người chơi nhỏ tuổi hơn.

Chơi được ngoại tuyến. Không tài khoản, không đăng ký, không địa chỉ email.
```

**ATT-Text**

```
Nếu bạn cho phép, chúng tôi có thể hiển thị quảng cáo phù hợp hơn với bạn. Bản thân trò chơi vẫn giữ nguyên hoàn toàn.
```

## Thailändisch (`th`)

**Apple Untertitel** (max. 30)

```
เกมเรียงสีในบาร์น้ำผลไม้
```

**Apple Werbetext** (max. 170)

```
999 ด่าน ทุกด่านมีวิธีแก้ที่สั้นที่สุดซึ่งพิสูจน์แล้ว สามดาวให้เฉพาะการเล่นที่ดีที่สุดจริงๆ และยังมีปริศนาใหม่ทุกวัน เหมือนกันสำหรับทุกคน
```

**Apple Keywords** (max. 100)

```
เรียงสี,ปริศนา,น้ำ,แก้ว,สี,ตรรกะ,ฝึกสมอง,ผ่อนคลาย,ออฟไลน์,น้ำผลไม้,บาร์,หลอด,รายวัน
```

**Play Titel** (max. 30)

```
FixTheMix — เกมเรียงสี
```

**Play Kurzbeschreibung** (max. 80)

```
เททีละชั้นจนทุกแก้วเหลือสีเดียว 999 ด่าน ปริศนาใหม่ทุกวัน
```

**Beschreibung** (max. 4000)

```
บาร์น้ำผลไม้ เคาน์เตอร์ที่เต็มไปด้วยแก้ว และในทุกแก้วชั้นสีปนกันยุ่งเหยิง หน้าที่ของคุณคือเทไปเรื่อยๆ จนแต่ละแก้วเหลือเพียงสีเดียว

กติกาเดียว แค่นั้นเอง ชั้นสีเดียวกันที่อยู่บนสุดจะย้ายไปยังแก้วเปล่าหรือไปวางบนสีเดียวกัน ไม่มีบทสอน ไม่มีกติกาพิเศษ ไม่มีเงินสกุลที่สองที่ต้องมานั่งทำความเข้าใจก่อน

สามดาวหมายถึงสามดาวจริงๆ
ทั้ง 999 ด่านมีวิธีแก้ที่สั้นที่สุดซึ่งพิสูจน์แล้ว ไม่ใช่การประมาณ สามดาวจะได้ก็ต่อเมื่อคุณใช้จำนวนตาเท่ากับวิธีที่ดีที่สุดแบบตาต่อตา ต้องใช้ฝีมือล้วนๆ

ปริศนาวันละข้อ เหมือนกันสำหรับทุกคน
กระดานใหม่ทุกวัน เหมือนกันทั่วโลก วันจันทร์เล็ก วันอาทิตย์ใหญ่ แชร์ผลของคุณได้โดยไม่เฉลย มีแค่ดาว จำนวนตา และแถบหนึ่งแถบ ไม่มีสีเด็ดขาด และสถิติต่อเนื่องที่นับเฉพาะเมื่อคุณเล่นทุกวันจริงๆ

โหมดตาบอดสีตั้งแต่วันแรก
ทั้งเก้าสีมีสัญลักษณ์วาดเฉพาะของตัวเอง: สตรอว์เบอร์รี เลมอน บลูเบอร์รี ส้ม แอปเปิล องุ่น มินต์ มะพร้าว กาแฟ รูปทรงต่างกัน ไม่ใช่แค่โทนสีต่างกัน แยกออกได้แม้ในภาพขาวดำ

เมื่อคุณติดทางตัน
คุณอาจพาตัวเองเข้าทางตันได้ และเกมจะบอกคุณ แทนที่จะปล่อยให้เดา จากนั้นคุณเลือกเองได้: ใช้เหรียญย้อนกลับหนึ่งตา รับแก้วเสริม หรือเริ่มใหม่ การเริ่มใหม่ฟรีเสมอ ทุกด่านยังเล่นได้แม้เหรียญหมด

ยุติธรรม รวมถึงเรื่องโฆษณา
ไม่มีโฆษณากลางด่านเด็ดขาด อย่างมากหนึ่งครั้งระหว่างด่าน และยังถูกจำกัดความถี่ด้วย วิดีโอจะเล่นเฉพาะเมื่อคุณกดเองเท่านั้น และ "ลบโฆษณา" เป็นการซื้อครั้งเดียว ไม่ใช่การสมัครสมาชิก

ไม่มีแอลกอฮอล์
น้ำผลไม้ สมูทตี้ ไซรัป ไม่มีบรรยากาศค็อกเทล เพื่อให้แอปเปิดกว้างสำหรับผู้เล่นที่อายุน้อยกว่าด้วย

เล่นแบบออฟไลน์ได้ ไม่ต้องมีบัญชี ไม่ต้องสมัคร ไม่ต้องใช้อีเมล
```

**ATT-Text**

```
หากคุณอนุญาต เราจะแสดงโฆษณาที่ตรงกับความสนใจของคุณมากขึ้นได้ ตัวเกมยังคงเหมือนเดิมทุกประการ
```

## Japanisch (`ja`)

**Apple Untertitel** (max. 30)

```
ジュースバーの色分けパズル
```

**Apple Werbetext** (max. 170)

```
全999レベル、すべて最短手順が証明済み。星3つは本当の最適解だけ。さらに毎日、みんな共通の新しいパズルが登場！
```

**Apple Keywords** (max. 100)

```
ソート,パズル,水,グラス,色,ロジック,脳トレ,リラックス,オフライン,ジュース,バー,試験管,デイリー,仕分け
```

**Play Titel** (max. 30)

```
FixTheMix — 色分けパズル
```

**Play Kurzbeschreibung** (max. 80)

```
一層ずつ注いで、全部のグラスを一色にそろえよう。999レベル＆毎日パズル。
```

**Beschreibung** (max. 4000)

```
ジュースバーのカウンターにはグラスがずらり。でも、どのグラスも層がぐちゃぐちゃ。あなたの仕事は、すべてのグラスが一色になるまで注ぎ分けること。

ルールはひとつだけ。いちばん上にある同じ色のかたまりを、空のグラスか同じ色の上に移せます。チュートリアルなし、特殊ルールなし、覚えなきゃいけない第二の通貨もなし。

星3つは本当に星3つ
999レベルすべてで、最短手順は推定ではなく証明済み。星3つがもらえるのは、最適解と同じ手数でクリアしたときだけ。実力でつかみ取ろう。

1日1問、みんな同じパズル
毎日新しい盤面、世界中どこでも同じ。月曜は小さく、日曜は大きく。結果はネタバレなしでシェアできます。載るのは星・手数・バーだけで、色は一切なし。連続記録は、本当に毎日プレイしたときだけ伸びます。

初日から色覚サポートモード
9色それぞれに専用のイラストマークがついています：イチゴ、レモン、ブルーベリー、オレンジ、リンゴ、ブドウ、ミント、ココナッツ、コーヒー。色合いだけでなく形も違うので、白黒でも見分けられます。

手詰まりになったら
自分で行き詰まってしまうこともあります。そんなときはゲームが教えてくれるので、当てずっぽうで迷う必要はありません。あとはあなた次第：コインで1手もどす、追加グラスをもらう、最初からやり直す。やり直しはいつでも無料。コインがゼロでも、どのレベルも遊べます。

広告もフェアに
レベルの途中で広告が出ることはありません。レベルの間に出るのも最大1回、それも回数を制限しています。動画はあなたが自分で再生したときだけ。「広告を削除」は買い切りで、サブスクではありません。

ノンアルコール
ジュース、スムージー、シロップ。お酒の雰囲気はなし。だから年齢の低いプレイヤーも安心して遊べます。

オフラインで遊べます。アカウント不要、登録不要、メールアドレスも不要。
```

**ATT-Text**

```
許可していただくと、より関心に合った広告を表示できます。ゲームの内容はまったく変わりません。
```

## Koreanisch (`ko`)

**Apple Untertitel** (max. 30)

```
주스 바 색깔 정렬 퍼즐
```

**Apple Werbetext** (max. 170)

```
999개 레벨, 모두 최단 해법이 증명되어 있어요. 별 3개는 진짜 최적해에만! 매일 모두에게 똑같은 새 퍼즐도 나와요.
```

**Apple Keywords** (max. 100)

```
정렬,퍼즐,물,유리잔,색깔,논리,두뇌,힐링,오프라인,주스,바,시험관,데일리,물정렬
```

**Play Titel** (max. 30)

```
FixTheMix — 색깔 정렬 퍼즐
```

**Play Kurzbeschreibung** (max. 80)

```
한 층씩 부어서 모든 잔을 한 가지 색으로! 999개 레벨, 매일 새로운 퍼즐.
```

**Beschreibung** (max. 4000)

```
주스 바, 잔이 가득한 카운터, 그리고 잔마다 뒤죽박죽 섞인 층들. 여러분의 임무는 모든 잔이 한 가지 색만 담을 때까지 붓는 거예요.

규칙은 딱 하나예요. 맨 위에 있는 같은 색 층 덩어리가 빈 잔이나 같은 색 위로 옮겨져요. 튜토리얼도, 특별 규칙도, 먼저 익혀야 하는 두 번째 화폐도 없어요.

별 3개는 정말 별 3개예요
999개 레벨 모두 최단 해법이 추정이 아니라 증명되어 있어요. 최적해와 수 하나하나까지 똑같이 맞춰야만 별 3개를 받아요. 실력으로 따내세요.

하루 한 문제, 모두에게 똑같이
매일 새로운 판, 전 세계 어디서나 똑같아요. 월요일엔 작게, 일요일엔 크게. 결과는 스포일러 없이 공유할 수 있어요. 별, 수, 막대 하나만 담기고 색깔은 절대 담기지 않아요. 연속 기록은 정말 매일 플레이할 때만 이어져요.

첫날부터 색약 모드
아홉 가지 색마다 직접 그린 고유 기호가 있어요: 딸기, 레몬, 블루베리, 오렌지, 사과, 포도, 민트, 코코넛, 커피. 색조만 다른 게 아니라 모양이 달라서 흑백에서도 구분할 수 있어요.

막혔을 때
스스로 막다른 길에 빠질 수도 있어요. 그럴 땐 게임이 추측하게 두지 않고 알려 줘요. 그다음은 여러분의 선택: 코인으로 한 수 무르기, 추가 잔 받기, 처음부터 다시 하기. 다시 시작은 언제나 무료라서 코인이 하나도 없어도 모든 레벨을 플레이할 수 있어요.

광고도 공정하게
레벨 중간에 광고는 절대 없어요. 레벨 사이에도 최대 한 번, 그마저도 횟수를 제한해요. 동영상은 직접 시작할 때만 나와요. 그리고 "광고 제거"는 구독이 아니라 한 번만 사면 되는 구매예요.

무알코올
주스, 스무디, 시럽. 칵테일 분위기는 없어요. 그래서 어린 플레이어도 함께 즐길 수 있어요.

오프라인으로 플레이할 수 있어요. 계정도, 가입도, 이메일 주소도 필요 없어요.
```

**ATT-Text**

```
허용하시면 더 관련성 높은 광고를 보여 드릴 수 있어요. 게임 자체는 완전히 그대로예요.
```

## Chinesisch, vereinfacht (`zh-Hans`)

**Apple Untertitel** (max. 30)

```
果汁吧倒水排序益智游戏
```

**Apple Werbetext** (max. 170)

```
999 个关卡，每关的最短解法都经过证明：三星只给真正的最优解。另外每天还有一道新谜题，所有人都一样。
```

**Apple Keywords** (max. 100)

```
排序,益智,倒水,水排序,杯子,颜色,逻辑,烧脑,休闲,离线,果汁,饮品,试管,每日
```

**Play Titel** (max. 30)

```
FixTheMix — 倒水排序
```

**Play Kurzbeschreibung** (max. 80)

```
一层层倒，直到每个杯子只剩一种颜色。999 个关卡，每天一道谜题。
```

**Beschreibung** (max. 4000)

```
一家果汁吧，一排摆满杯子的吧台，每个杯子里的颜色层都乱成一团。你的任务：不断倒来倒去，直到每个杯子只剩一种颜色。

规则只有一条。最上面一段相同颜色的层，可以倒进空杯子，或者倒在同样的颜色上。没有教程，没有特殊规则，也没有需要先弄懂的第二种货币。

三星就是真正的三星
999 个关卡，每一关的最短解法都经过证明，而不是估算。只有步数和最优解完全一致，才能拿到三星。凭实力拿下吧。

每天一道谜题，人人相同
每天一个新盘面，全世界都一样。周一小，周日大。分享成绩不剧透：只有星星、步数和一条进度条，绝不显示颜色。连续天数只有在你真的每天都玩时才会增加。

第一天起就有色盲模式
九种颜色各有一个专属的图形符号：草莓、柠檬、蓝莓、橙子、苹果、葡萄、薄荷、椰子、咖啡。不只是色调不同，形状也不同：就算是黑白画面也能分清。

卡住的时候
你可能会把自己逼进死胡同，游戏会直接告诉你，而不是让你瞎猜。接下来你来决定：用金币撤销一步、拿一个额外杯子，或者重新开始。重新开始永远免费：就算金币用光，每一关也都能继续玩。

公平，广告也一样
关卡中途绝不出现广告。两关之间最多一次，而且还有频率限制。视频只在你自己点开时才播放。“去除广告”是一次性购买，不是订阅。

无酒精
果汁、奶昔、糖浆。没有鸡尾酒氛围，让更年轻的玩家也能放心玩。

支持离线游玩。无需账号，无需注册，无需邮箱地址。
```

**ATT-Text**

```
经你允许，我们可以为你展示更相关的广告。游戏本身完全不变。
```

## Chinesisch, traditionell (`zh-Hant`)

**Apple Untertitel** (max. 30)

```
果汁吧倒水排序益智遊戲
```

**Apple Werbetext** (max. 170)

```
999 個關卡，每關的最短解法都經過證明：三星只給真正的最佳解。另外每天還有一道新謎題，所有人都一樣。
```

**Apple Keywords** (max. 100)

```
排序,益智,倒水,水排序,杯子,顏色,邏輯,燒腦,休閒,離線,果汁,飲料,試管,每日
```

**Play Titel** (max. 30)

```
FixTheMix — 倒水排序
```

**Play Kurzbeschreibung** (max. 80)

```
一層層倒，直到每個杯子只剩一種顏色。999 個關卡，每天一道謎題。
```

**Beschreibung** (max. 4000)

```
一家果汁吧，一排擺滿杯子的吧檯，每個杯子裡的顏色層都亂成一團。你的任務：不斷倒來倒去，直到每個杯子只剩一種顏色。

規則只有一條。最上面一段相同顏色的層，可以倒進空杯子，或者倒在同樣的顏色上。沒有教學，沒有特殊規則，也沒有需要先搞懂的第二種貨幣。

三星就是真正的三星
999 個關卡，每一關的最短解法都經過證明，而不是估算。只有步數和最佳解完全一致，才能拿到三星。憑實力拿下吧。

每天一道謎題，人人相同
每天一個新盤面，全世界都一樣。週一小，週日大。分享成績不爆雷：只有星星、步數和一條進度條，絕不顯示顏色。連續天數只有在你真的每天都玩時才會增加。

第一天起就有色盲模式
九種顏色各有一個專屬的圖形符號：草莓、檸檬、藍莓、柳橙、蘋果、葡萄、薄荷、椰子、咖啡。不只是色調不同，形狀也不同：就算是黑白畫面也能分清楚。

卡關的時候
你可能會把自己逼進死胡同，遊戲會直接告訴你，而不是讓你亂猜。接下來由你決定：用金幣退回一步、拿一個額外杯子，或者重新開始。重新開始永遠免費：就算金幣用光，每一關也都能繼續玩。

公平，廣告也一樣
關卡中途絕不出現廣告。兩關之間最多一次，而且還有頻率限制。影片只在你自己點開時才播放。「移除廣告」是一次性購買，不是訂閱。

無酒精
果汁、奶昔、糖漿。沒有雞尾酒氛圍，讓更年輕的玩家也能安心玩。

支援離線遊玩。不需要帳號，不需要註冊，不需要電子郵件地址。
```

**ATT-Text**

```
經你允許，我們可以為你顯示更相關的廣告。遊戲本身完全不變。
```

## Zeichenzahlen

Gezählt mit `[...text].length` auf dem Inhalt des Codeblocks (getrimmt). Grenzen: Untertitel 30, Werbetext 170, Keywords 100, Titel 30, Kurz 80, Beschreibung 4000.

| Sprache | Untertitel | Werbetext | Keywords | Titel | Kurz | Beschreibung |
|---|---|---|---|---|---|---|
| Spanisch (`es`) | 25 | 147 | 86 | 29 | 80 | 1824 |
| Französisch (`fr`) | 26 | 162 | 96 | 25 | 78 | 1913 |
| Portugiesisch (`pt`) | 24 | 149 | 88 | 29 | 70 | 1786 |
| Italienisch (`it`) | 26 | 143 | 97 | 27 | 78 | 1770 |
| Niederländisch (`nl`) | 26 | 151 | 92 | 25 | 78 | 1717 |
| Polnisch (`pl`) | 24 | 159 | 88 | 30 | 80 | 1770 |
| Türkisch (`tr`) | 27 | 138 | 84 | 25 | 76 | 1672 |
| Russisch (`ru`) | 20 | 145 | 83 | 29 | 80 | 1728 |
| Ukrainisch (`uk`) | 18 | 133 | 87 | 22 | 79 | 1679 |
| Arabisch (`ar`) | 26 | 106 | 72 | 23 | 70 | 1460 |
| Hindi (`hi`) | 21 | 116 | 71 | 23 | 71 | 1666 |
| Indonesisch (`id`) | 24 | 155 | 87 | 25 | 80 | 1815 |
| Vietnamesisch (`vi`) | 28 | 154 | 81 | 22 | 74 | 1713 |
| Thailändisch (`th`) | 24 | 137 | 83 | 22 | 57 | 1482 |
| Japanisch (`ja`) | 13 | 56 | 57 | 18 | 37 | 798 |
| Koreanisch (`ko`) | 13 | 67 | 45 | 20 | 44 | 904 |
| Chinesisch, vereinfacht (`zh-Hans`) | 11 | 51 | 42 | 16 | 33 | 587 |
| Chinesisch, traditionell (`zh-Hant`) | 11 | 51 | 42 | 16 | 33 | 593 |
