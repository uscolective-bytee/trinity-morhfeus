# Trinity na mobilnom telefóne

Mobilná etapa používa existujúce cloudové jadro a prihlásený účet. Notebook nemusí bežať na cloudový chat; jeho vlastné súborové akcie vyžadujú zapnutý PC Bridge. Dokumentácia neprehlasuje telefón za už spárovaný, pokiaľ to neprebehlo na skutočnom zariadení.

## Použitie

1. Na telefóne otvoriť `https://auru.space` a prihlásiť sa vlastným existujúcim spôsobom.
2. V prehliadači Androidu použiť Inštalovať aplikáciu alebo Pridať na plochu. Na iPhone použiť Zdieľať a Pridať na plochu. Konkrétna možnosť závisí od prehliadača.
3. Tlačidlo Telefón otvorí panel aktuálnych schopností a návod na inštaláciu. Údaj o sieti opisuje stav prehliadača, nie garantovanú dostupnosť modelu.
4. Vybrať fotografiu otvorí existujúci vstup obrázka v Trinity s preferovanou zadnou kamerou. Používateľ vyberá obsah; aplikácia nezapína kameru pri načítaní.
5. Použiť hlas vyvolá existujúce nahrávanie Trinity, ak je podporované a relácia nie je hosťovská. Skutočné povolenie mikrofónu spravuje prehliadač. Prítomnosť tlačidla neprehlasuje prepis hlasu za overený.

Rozloženie používa dostupnú výšku obrazovky aj pri otvorenej klávesnici. Zachováva garážový podklad, čitateľné písanie, bezpečné okraje telefónu a väčšie dotykové ciele. Zväčšenie stránky sa nesmie násilne rušiť.

## Rozsah oprávnení

Inštalácia webovej aplikácie nedáva plný prístup k SMS, kontaktom, iným aplikáciám, celej pamäti alebo nepretržitej práci na pozadí. Taký rozsah vyžaduje osobitnú sprievodnú aplikáciu a overené párovanie podľa operačného systému telefónu. Žiadne nové zariadenie ani nové trvalé tajomstvo sa nevytvára iba z načítania tejto stránky.

API a súkromné rozhovory sa nesmú ukladať do offline service worker cache. Po strate siete sa zápisy automaticky neopakujú. Úspešnú inštaláciu možno oznámiť až na základe udalosti prehliadača alebo skutočnej kontroly na telefóne.

## Autonómia a synchronizácia (11.0.0)

Prihlásený vlastník (Sabo Ivan / Basterix) má na mobilnom zariadení rovnaké plné autonómne práva:
- Úlohy a požiadavky zadané cez mobilný webový chat sú spracované v `owner_mode: true`.
- Netreba zadávať potvrdzujúce frázy `SCHVÁĽ` – Trinity vykonáva schválené kroky autonómne.
- Všetkých 19 suverénnych skillov je prístupných priamo z mobilného rozhrania cez cloudové jadro Trinity.

## Overenie

`node --test tests/mobile-device.test.mjs` testuje povolenia bez automatického spúšťania médií, hosťovskú reláciu, zmeny výšky pri klávesnici, inštalačný tok a neprehrávanie úloh pri obnovení siete. Tieto lokálne testy nenahrádzajú skúšku na fyzickom telefóne.

Po integrácii treba overiť manifest, rozmer ikon, správne servírovanie service workera a telefón s otvorenou klávesnicou. Inštalácia, fotografia a mikrofón sa skúšajú osobitne. Stav routera alebo telefónne číslo nie sú dôkazom týchto schopností.

Referencie: [inštalácia PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [povolenie mikrofónu a kamery](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
