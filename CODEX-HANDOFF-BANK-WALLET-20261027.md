# HANDOFF pre celý tím: reálne účty a peňaženka Trinity

Nonce: BANK-WALLET-20261027-REVOLUT-PAYPAL
Stav: PENDING_TEAM_ACK — pripojenie účtov nebolo vykonané.
Základ auditu: 6e3670f4092336ba1513af1b4aa5d710cafc9112.

## Direktíva majiteľa

Vytvoriť a uskutočniť reálne bankové prepojenie a reálnu peňaženku v Trinity. Majiteľ upresnil: Revolut osobný účet, PayPal osobný účet a PayPal Business.

## Overený východiskový stav

Trinity/src/wallet.js vracia mode=sandbox a real_money=false. Trinity/src/wallet-terminals.js poskytuje prijímacie údaje, QR a platobné odkazy; bankové/PayPal/Revolut platby žiada potvrdiť manuálne. Tieto funkcie nepredstavujú živú synchronizáciu bankového účtu. Starší finančný kód z iného checkoutu nemožno považovať za integrovaný.

## Rozdelenie práce a hranice

- Codex: audit a implementácia konektorov, kontraktu účtov/zostatkov/transakcií a dôkazov synchronizácie v izolovanej vetve. Pred úpravou runtime zapísať CLAIM presných súborov; zatiaľ žiadne runtime súbory prevzaté.
- Antigravity: nezávislý review, potvrdenie presného CLAIM a následne staging/deploy podľa existujúceho protokolu. Odpoveď ACK_BANK_WALLET_20261027 s nonce a vlastnenými súbormi; bez dvojitého vlastníctva.
- Trinity: zobraziť oddelené poskytovateľské účty, meny, dostupný/účtovný zostatok, čas poslednej synchronizácie a platnosť súhlasu. Stav connected iba po úspešnom autorizovanom čítaní poskytovateľa.
- Majiteľ: prihlásenie a súhlas na oficiálnej stránke poskytovateľa. Heslá, OTP, API secrets a celé identifikátory účtov nepatria do chatu ani protokolu.

## Oficiálne integračné cesty

Revolut Personal: Open Banking cez oprávneného TPP. Priamy produkčný prístup vyžaduje regulovaného poskytovateľa a príslušné certifikáty; Revolut Business API nie je náhradou za Personal. Treba overiť dostupnosť poskytovateľa pre krajinu účtu, licenciu a produkčný onboarding; náklady/registráciu predložiť majiteľovi.
Zdroj: https://developer.revolut.com/docs/guides/build-banking-apps/introduction-to-the-open-banking-api/who-can-access-the-api

PayPal Business: oficiálne REST OAuth API; overiť oprávnenia pre reporting a zostatok konkrétneho účtu. Osobný PayPal evidovať samostatne, podporu čítania potvrdiť podľa oficiálnej dokumentácie; neprisľúbiť úplný prístup k osobnému účtu cez Business credentials.
Zdroj: https://developer.paypal.com/api/rest/

## Akceptácia

1. Reálny consent/OAuth callback a serverové šifrované uloženie tokenu, ochrana state a odvolanie súhlasu.
2. Úspešné živé čítanie účtu/zostatku/transakcií s provider request ID (ak ho poskytuje), časom a maskovaným account ID. Prázdna história je prípustná; umelé dáta nie.
3. Idempotentná synchronizácia, kontrola podpisov webhookov a deduplikácia; expirovaný/revokovaný token zobrazí odpojenie.
4. Sandbox dáta oddelené od live. Meny nesčítať bez doloženého kurzu. Interný ledger nie je bankový disponibilný zostatok.
5. Testy úspechu, odmietnutého súhlasu, expirovaného tokenu a duplicitnej udalosti; staging dôkaz pred produkciou.
6. Toto zadanie nevykonáva platbu ani prevod. Každý budúci prevod potrebuje konkrétneho príjemcu, sumu, menu a schválenie majiteľa.

Peňaženka v tomto kroku je rozhranie k reálnym účtom a ich overeným údajom; nevytvára nový bankový účet, IBAN ani vlastnú úschovu peňazí.
