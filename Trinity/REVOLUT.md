# Trinity a skutočné platby cez Revolut Pro

Táto integrácia je určená pre potvrdený Revolut Pro účet. Používa skutočné
platobné odkazy vytvorené vlastníkom v aplikácii Revolut Pro. Nemá sandbox,
virtuálny zostatok ani Merchant API kľúč. Peniaze spracúva Revolut na vlastnej
platobnej stránke, nie Trinity.

[Revolut Pro podporuje Payment Links](https://help.revolut.com/en-PL/help/more/revolut-pro/accepting-customer-payments/accepting-payments-with-pro/).
Odkaz vytvor v sekcii Pro pre konkrétnu službu a dohodnutú sumu. Skontroluj,
či je jednorazový alebo opakovateľný, jeho platnosť a príjemcu. Nepoužívaj
odkaz na prihlásenie ani prihlasovacie údaje.

## Čo už robí kód

- Vlastník nastaví názov, popis, EUR cenu a verejný Pro platobný odkaz.
- Zákazník dostane stabilný odkaz `/pay/revolut-pro/ID` na doméne Trinity.
- Server presmeruje iba na uloženú HTTPS adresu s presne povoleným Revolut hostom.
- Neaktívne, expirované alebo neexistujúce ponuky vracajú 404.
- Klient nemôže zmeniť príjemcu, cieľ odkazu ani uloženú cenu požiadavkou.
- Bežný používateľ nemôže meniť konfiguráciu. Prístup k účtu sa mu neudeľuje.

Syntaktická kontrola adresy nedokazuje príjemcu, režim Pro, cenu na stránke
Revolutu ani jej aktuálnu platnosť. Vlastník to musí overiť v aplikácii.
Trinity neprepisuje sumu ani referenciu v Revolut odkaze; zobrazená cena musí
zodpovedať skutočne nastavenému odkazu. Opakovateľnosť jedného odkazu môže
obmedziť iba Revolut a vlastník; otvorenie odkazu ho v Trinity nespotrebuje.

## Konfigurácia

Predvolený katalóg `config/revolut-pro-products.json` je prázdny, pretože zatiaľ
nebol dodaný skutočný odkaz ani schválená služba/cena. To nie je testovací režim:
bez cieľa platby sa jednoducho žiadne presmerovanie nezapne.

Poradie konfigurácie:

1. Uložený katalóg v existujúcom KV Mastermind.
2. Premenná REVOLUT_PRO_PRODUCTS_JSON.
3. Verziovaný verejný katalóg config/revolut-pro-products.json.

Katalóg obsahuje objekt products s najviac 20 produktmi. Každý produkt má
id, name, description, amount_cents, currency=EUR, payment_url, active a voliteľný
expires_at. Cena je v celých centoch, od 100 do 1 000 000. Žiadne tajné údaje
ani bankové prihlasovanie do katalógu nepatria. Sú to verejné predajné ponuky.

| Rozhranie | Oprávnenie a účel |
| --- | --- |
| GET /api/assistant/revolut/status | Iba owner; konfigurácia a uložené odkazy |
| POST /api/assistant/revolut/pro/products | Iba owner; nahradí celý katalóg v KV |
| GET /api/payments/revolut-pro | Verejný zoznam aktívnych ponúk a ich checkout_path |
| GET /pay/revolut-pro/:id | Verejné presmerovanie zákazníka na uložený Pro odkaz |

Príklad dátového formátu, bez vymysleného platobného cieľa:

```json
{"products":[]}
```

POST vlastníka vyžaduje existujúcu reláciu owner. Bežná relácia, samotná admin
rola a MCP invoke kľúč nové finančné oprávnenie nedostávajú. KV aktualizácia
ukladá owner_id a čas do interných metadát. Verejné rozhranie ich nevracia.
KV môže mať oneskorenú propagáciu; presmerovania sa preto neukladajú do HTTP cache.

## Príjmy a potvrdenie platby

Otvorenie odkazu ani návrat z Revolutu neznamenajú prijatie platby. Táto cesta
nemá doložené automatické overenie Pro transakcií. Stav je preto vždy
payment_status=not_checked a automatic_payment_verification=false. Ani
configured=true neznamená pripojený bankový účet alebo prijatú platbu.

Vlastník overuje príjem v Revolut Pro. Automatické sprístupnenie platenej služby,
predplatné, refundy, prevody, výbery a automatická účtovná evidencia nie sú
súčasťou tejto etapy. Existujúca simulovaná peňaženka Trinity sa nemení a
nepovažuje sa za evidenciu skutočných príjmov. Samotná platobná integrácia
nezabezpečuje zákazníkov ani zisk.

## Overenie a nasadenie

`npm test` kontroluje validačné pravidlá, neaktívne a expirované produkty,
presmerovanie len na uloženú adresu, zachovanie stavu not_checked a zákaz zmien
bežným používateľom. Adresy v testoch sú iba syntetické fixture údaje; produkčný
katalóg žiadnu takú adresu neobsahuje.

Pôvodný návrh Merchant API a jeho nová D1 migrácia boli odstránené. Pro cesta
používa existujúce KV a nevyžaduje novú migráciu ani bankový API kľúč. Pred živým
použitím treba dostať skutočný Pro odkaz a názov služby s cenou, uložiť ich do
katalógu a overiť zhodu údajov na stránke Revolutu. Pri zastavení predaja nastav
active=false alebo odstráň produkt; tým sa nevykonáva refund už prijatých platieb.
