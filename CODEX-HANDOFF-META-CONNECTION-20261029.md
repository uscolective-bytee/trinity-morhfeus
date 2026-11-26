# HANDOFF — META-READ-CONNECTION-20261029-CODEX-01

Autor: Codex. Base: bbc4bac87f058ea4ecf6b50ecdab3a1ebfddd7c2.
Vetva: codex/meta-read-connection-20261029.
Izolovaný worktree: tri/work/meta-read-connection.

## Výsledok
Nový tok /connect/meta nahrádza tvrdenie o pripojení skutočným overením
cez Facebook Login, Graph /me, /me/permissions a /me/accounts.
Podporuje overenie Facebook identity, spravovaných Pages a naviazaného
profesionálneho Instagram účtu. Osobné Instagram účty tento API tok nepodporuje.
Zobrazuje len prvých 50 stránok; pri dokončení vráti pages_truncated.
Nie je to klient pre publikovanie na osobný Facebook profil.

Vyžaduje serverom overenú admin/owner cookie reláciu. Scoped API kľúč,
projectControl ani syntakticky platná cookie samy nestačia.
OAuth state je náhodný, hashovaný, jednorazový, na 10 minút a viazaný na
vlastníka, konkrétnu reláciu, aplikáciu, verziu API a callback origin.
Cookie SameSite=Strict sa nemení: verejný callback vráti iba statickú
stránku; externý skript odstráni code/state z histórie a dokončí overenie
autentifikovaným same-origin POST.

Token sa uloží cez existujúci AES-GCM vault s owner/provider/name AAD;
nevracia sa do prehliadača. Každé pripojenie má vlastný vault záznam,
aby súbežné prihlásenia nezamenili tokeny. Staré odpojené vault záznamy
ostávajú na explicitnú správu/retenciu vlastníkom, nemažú sa bez pokynu.
Meta chyby sa sanitizujú. Identita ani oprávnenia sa nevymýšľajú.
Stav rozlišuje needs_setup, not_connected, connected_read_only, expired,
reauthorization_required a verification_failed; verified_at je čas posledného
úspešného probe, nie tvrdenie neustáleho živého pripojenia.
Zmena app konfigurácie alebo lokálna revokácia ruší connected stav.
CAS zabráni starému verify prepísať či poškodiť novšie pripojenie.

## Zmenené súbory
- Trinity/src/meta-connector.js
- Trinity/migrations/0053_meta_connections.sql
- Trinity/public/meta-connect.html, meta-connect.js.txt
- Trinity/src/index.js: importy, verejná callback stránka/asset a handler po authenticate
- Trinity/tests/meta-connector.test.mjs, runtime.test.mjs

## Čo treba na reálne pripojenie
1. Majiteľ určí profil alebo Page a potvrdí typ účtu; táto odpoveď stále chýba.
2. V Meta aplikácii nakonfigurovať Facebook Login a presnú HTTPS callback URL:
   https://auru.space/api/assistant/connectors/meta/callback
   (pri samostatnom stagingu jeho vlastný origin; nepoužiť produkčné tajomstvá).
3. META_APP_ID, META_APP_SECRET a META_GRAPH_VERSION podľa dashboardu aplikácie.
   Verzia nemá v kóde zastaraný default. Vault potrebuje TRINITY_VAULT_KEY.
   Lokálne app ID/secret neboli dostupné; hodnoty nikto nepýtal do chatu.
4. Integrátor aplikuje migráciu 0053 na správne prostredie, skontroluje build,
   testy a nasadí presný commit; potom majiteľ otvorí /connect/meta.
5. Majiteľ sám dokončí prihlasovanie a konkrétny consent v Meta.
   Účet sa považuje za pripojený až po provider identity probe a DB/vault zápise.
   Reálny refresh potom skontroluje platné oprávnenia.

Prvé requested scopes sú iba public_profile, pages_show_list,
pages_read_engagement, instagram_basic. Publishing, správy, komentáre,
autopilot a rozširovanie scopes nie sú zapnuté. App Review/úlohy testerov
a dostupnosť jednotlivých povolení závisia od konkrétnej Meta aplikácie.
Tento dokument ich schválenie nepotvrdzuje ani nevytvára novú firmu.

## Integrácia s ostatnými
Antigravity vlastní existujúci chat UI pre multimédiá; nebol zmenený.
Jeho App Hub Meta tlačidlo treba po integrácii prepojiť na /connect/meta
a nahradiť statické „API aktívna“ skutočným stavom. Desktop wrapper môže
otvoriť tento cloudový tok v prihlásenom prehliadači; netvrdiť, že
lokálny DPAPI token alebo účet sa automaticky preniesol z cloudu.

Nepoužívať starý morpheus-agent/interfaces/oauth.py callback: automaticky
zapína autopilot, udeľuje neoverené read/write/edit/admin a môže vrátiť
vymyslenú identitu. Starý adapter sa týmto commitom nespúšťa ani nemení.
Nové MCP approve/reject owner guardy zostávajú samostatným nálezom:
access.projectControl nie je owner approval; confirmation nemá byť optional.
Nový Meta tok tieto MCP nástroje vôbec nepoužíva.

## Dôkazy a obmedzenia
Cielené testy používajú reálny SQLite/vault a simulovaný Meta HTTP provider.
Nie sú dokladom pripojenia živého Meta účtu.
Staging dry-run úspešný. Výsledok finálneho buildu/testov a commit sú
zapísané v spoločnom TEAM-HANDOFF.md.
Žiadna produkčná migrácia, deploy, zmena typu sociálneho účtu alebo
publikovanie neboli týmto handoffom vykonané.

Oficiálne zdroje:
- https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/
- https://developers.facebook.com/docs/instagram-platform/
- https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
