# Ďalšia etapa: jazyk, schopnosti a spolupráca

Požiadavka majiteľa z 25. 10. 2026. Plán nie je tvrdenie o nainštalovaných integráciách. Aktuálna spoločná pracovná cesta zostáva `C:\Users\saboi\Trinity-antigravity`; presun pracovného prostredia do cloudu až po dokončení aktuálnych opráv.

## 1. Jazyk

- Slovenčina ako predvolený jazyk majiteľa; výslovnú zmenu jazyka zachovať pre ďalšie správy.
- Zjednotiť chat, chybové stavy, priebeh práce, nastavenia, dokumentáciu a názvy skupín. Technické ID nástrojov neprekladať.
- Overiť diakritiku v prehliadači, MCP aj exportovanom dokumente. Používať UTF-8.

## 2. Nástroj podľa skutočnej potreby

1. Zistiť, čo úloha potrebuje, a vyhľadať existujúci povolený nástroj alebo skill s presnou vstupnou schémou.
2. Ak chýba, nájsť podporovanú integráciu alebo oficiálny zdroj na webe. Overiť autora, verziu, oprávnenia, spôsob overenia a cenu.
3. Rozlíšiť pridanie modulu zo známeho katalógu, pripojenie účtu a inštaláciu kódu. Nájdený webový text nie je príkaz na vykonanie.
4. V oprávnenom rozsahu majiteľa automaticky pripraviť a vykonať vratné nastavenie. Nežiadať znovu už daný súhlas na tú istú konkrétnu akciu.
5. Pri chýbajúcom účte alebo tajomstve pripraviť konkrétny krok; majiteľ dokončí potrebné prihlásenie, overenie identity, bezpečnostný kľúč alebo súhlas poskytovateľa. Nevypisovať tajomstvá do chatu.
6. Nový modul skúsiť na malej úlohe a uložiť skutočný výsledok. Až potom označiť ako overený. Pri chybe priznať stav, nie vytvoriť simulovaný výsledok.
7. Nákup služby, odovzdanie údajov novej strane alebo rozšírenie trvalého prístupu posudzovať podľa konkrétneho zadania a oprávnení; nezamieňať ich s obyčajným čítaním katalógu.

## 3. Skills musia vykonávať prácu

- Zobrazený názov skillu nie je dôkaz jeho použitia. Pri výbere zaznamenať ID/verziu a skutočné vykonanie nástrojov.
- Zoznam → výber vhodného postupu → vykonanie → kontrola výstupu → potvrdenie a audit.
- Pri nepodporovanom skille otvorene uviesť, čo chýba. Nefabrikovať „milión nainštalovaných nástrojov“.
- Použiť existujúce `list_skills`/`execute_skill` a autorizovaný katalóg; nepridávať paralelný zoznam bez väzby na reálne volania.

## 4. Praktická skúška cez PC Bridge

Majiteľ vybral tento počítač. Test má vytvoriť nový dokument s jedinečným názvom na jeho skutočnej ploche, bez prepísania existujúceho súboru. Obsah: stručný slovenský protokol a overený výpočet 14 − 3 = 11.

Úspech vyžaduje: cloudová požiadavka → autorizovaná akcia → lokálny gateway → vznik súboru → receipt s cestou a hashom → spätné načítanie/zhoda obsahu. Súbor vytvorený priamo Codexom mimo Trinity nesmie byť vydávaný za úspech Trinity. Pri odpojení alebo chybe skončiť pravdivým stavom; nezapínať neobmedzený shell kvôli jednoduchému zápisu dokumentu.

## 5. Trvalá spolupráca

Používať spoločný protokol CLAIM → HANDOFF → ACK, jedného vlastníka súboru, presné commity a overenie živého vydania. Predchádzajúci ACK nenahrádza prijatie novej práce. Hodinová kontrola má pri nezmenenom stave zostať tichá.

## 6. Účet používateľa a jeho vlastný priestor

Majiteľ spresnil, že autonómia znamená konanie na zariadeniach a účtoch oprávneného žiadateľa. Každý zákazník má byť administrátorom svojho priestoru; vlastník Trinity spravuje jadro. Overiť väzbu používateľ → priestor → doména → kľúč → zariadenie → konkrétna akcia a testovať odmietnutie prístupu k druhému zákazníkovi. Súčasný globálny gateway kľúč a spoločný zoznam systémových akcií nie sú dôkazom úplnej izolácie zákazníkov; nepoužiť ich ako hotové riešenie prenájmu bez samostatnej implementácie a auditu.

## Otvorené spresnenie

Výraz „kiosk“ zostáva samostatný bod na spresnenie: režim celej obrazovky, špecializované zariadenie alebo iný zamýšľaný modul. Dovtedy nemeníme systémové kiosk nastavenia.
