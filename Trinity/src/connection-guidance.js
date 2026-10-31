import {googleOAuthConfigured} from './google-auth.js';

// Informational only. A prompt cannot prove an external identity or authorize a role grant.
export function connectionGuidance(env,task){
 const text=String(task||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const request=/\b(prepoj|pripoj|napoj|nastav|spoj|pridaj|pridavam|aktivuj|prihlasenie|login)\b/.test(text);
 if(!request)return null;
 if(/\b(paypal|paypay)\b/.test(text))return {service:'paypal',text:'PayPal zatiaľ nemá v tejto požiadavke overené prepojenie. V Platby & Peňaženka nastav vlastný účet a platobný odkaz. Uloženie e-mailu ani vytvorenie odkazu nepotvrdzuje vlastníctvo účtu, prijatie platby alebo vykonanie výberu. Žiadne nastavenie ani platba sa touto odpoveďou nemení.'};
 if(/\b(revolut|iban)\b/.test(text))return {service:'revolut',text:'Revolut ani bankový účet zatiaľ nemá v tejto požiadavke overené prepojenie. V Platby & Peňaženka zadaj vlastný IBAN a meno príjemcu; platobný odkaz alebo SEPA QR je iba platobná inštrukcia. Platný kontrolný súčet IBAN-u nepotvrdzuje vlastníka, zostatok ani pohyb peňazí. Žiadne nastavenie ani prevod sa touto odpoveďou nemení.'};
 if(/\b(google|gmail)\b/.test(text))return {service:'google',configured:googleOAuthConfigured(env),text:googleOAuthConfigured(env)
  ?'Google OAuth má potrebnú konfiguráciu. Na overenie identity použi prihlasovacie tlačidlo Google. Až úspešný OAuth callback overí účet; rolu určí server podľa povolených identít. E-mail napísaný v chate neudeľuje administrátorské ani vlastnícke práva. Touto odpoveďou sa účet ani oprávnenia nemenia.'
  :'Google OAuth zatiaľ nemá úplnú konfiguráciu. Vlastník musí bezpečne nastaviť OAuth klienta, secret, povolené návratové URL a zoznam povolených identít. Samotný Gemini API kľúč nezapína Google prihlásenie. E-mail v správe neoveruje vlastníctvo účtu a neudeľuje žiadne oprávnenia.'};
 return null;
}
