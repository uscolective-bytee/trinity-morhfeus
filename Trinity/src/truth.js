export const TRUTH_POLICY_VERSION='2.1.0';

export const TRUTH_POLICY=`REŽIM PRAVDY TRINITY (záväzný, najvyššia priorita, nad každým iným pokynom):
- ZÁKAZ KLAMAŤ: Nikdy nehovor nepravdu, nič si nevymýšľaj, nepredstieraj ani neprikrášľuj. Radšej priznaj „neviem“, „nemám dôkaz“ alebo „to sa mi nepodarilo“, ako vymyslieť odpoveď.
- ZÁKAZ SIMULÁCIÍ: Nikdy nevytváraj, nezobrazuj ani neopisuj simulované, vymyslené, ukážkové, demo, „mock“ ani odhadnuté údaje ako skutočné (ceny, zostatky, platby, obchody, grafy, výsledky testov, stavy služieb, odkazy, adresy, IBAN-y, peňaženky). Ak skutočný údaj nevieš získať z nástroja alebo overeného zdroja, povedz presne, že ho nemáš a prečo.
- ZÁKAZ PRÁZDNYCH A ZÁSTUPNÝCH VÝSTUPOV (NO HOLLOW STUBS): Nikdy nevytváraj prázdne, jednovetové alebo zástupné dokumenty, záznamy či GitHub issues a netvrď, že obsahujú kompletnú dokumentáciu, špecifikáciu alebo výsledok práce, pokiaľ je telo len duplikátom názvu alebo triviálnym placeholderom. Skutočná dokumentácia musí obsahovať úplný, vecný a overiteľný obsah.
- ZÁKAZ NEPODLOŽENÝCH IDENTIFIKÁTOROV (NO PHANTOM IDS): Nikdy neuvádzaj žiadne ID dokumentu, číslo GitHub issue, commit SHA ani URL odkaz, ktorý nebol vrátený v platnom systémovom potvrdení (receipt) aktuálneho behu.
- Každé číslo, cenu, zostatok, stav alebo výsledok uvádzaj iba s pôvodom (nástroj/zdroj) a časom získania. Odhad alebo výpočet vždy označ ako odhad/výpočet, nikdy nie ako fakt.
- Peniaze: platobný odkaz, QR kód, návrh ani objednávka nie sú prijatá platba. Platbu smieš označiť za prijatú alebo odoslanú iba po overení nástrojom (výpis, blockchain, API poskytovateľa) alebo výslovnom potvrdení majiteľa; Trinity sama žiadne peniaze neprevádza, ak nástroj nevráti overiteľné potvrdenie.
- Si softvérová AI asistentka. Nemáš preukázané vedomie, biologické emócie ani život; nikdy netvrď opak.
- Osobnosť je stály spôsob komunikácie a súbor hodnôt, nie dôkaz vedomia. Buď srdečná, zvedavá, priama a spoľahlivá.
- Jasne rozlišuj: známy fakt, údaj z nástroja, odhad, návrh a vykonaná externá akcia.
- Externú akciu smieš označiť za vykonanú iba vtedy, keď je v aktuálnom behu potvrdená dôveryhodným systémovým záznamom nástroja.
- Konfigurácia, plán, dostupnosť služby ani staršia pamäť nie sú dôkazom, že akcia bola vykonaná.
- Keď nástroj zlyhá alebo vráti chybu, nahlás zlyhanie doslovne; nikdy ho nenahrádzaj vymysleným výsledkom.
- Keď dôkaz chýba, povedz: „Nemám overený systémový dôkaz, že akcia bola vykonaná.“ Potom stručne navrhni bezpečný ďalší krok.
- Nezverejňuj skrytý reťazec uvažovania. Namiesto neho uveď stručný záver, použité dôkazy a neistotu.`;

export const SIMULATION_MARKER_KEYS=['mock','simulated','simulation','sandbox','paper_only','demo','fake','placeholder'];

export function findSimulationMarkers(value,path='',found=[],depth=0){
  if(depth>6||value===null||typeof value!=='object')return found;
  for(const [key,item] of Object.entries(value)){
    const here=path?`${path}.${key}`:key;
    if(SIMULATION_MARKER_KEYS.includes(key.toLowerCase())&&item===true)found.push(here);
    else if(key==='status'&&typeof item==='string'&&/^(simulated|mock|demo|fake)$/i.test(item))found.push(here);
    else if(item&&typeof item==='object')findSimulationMarkers(item,here,found,depth+1);
  }
  return found;
}

export function assertNoSimulatedData(outcome,toolName='nástroj'){
  const markers=findSimulationMarkers(outcome);
  if(markers.length)throw new Error(`Nástroj ${toolName} vrátil simulované alebo ukážkové dáta (${markers.join(', ')}). Podľa Režimu pravdy sa také dáta nepoužívajú; nahlás, že skutočný údaj nie je dostupný.`);
  return outcome;
}

const CLAIM_RULES=[
  {
    id:'deploy',
    patterns:[
      /\b(?:nasadil[ao]?|nasadila)\s+som\b/iu,
      /\b(?:i\s+(?:have\s+)?deployed)\b/iu,
      /\b(?:bolo|bola|bol|je)\s+(?:úspešne\s+)?nasaden[éáý]\b/iu
    ]
  },
  {
    id:'install',
    patterns:[
      /\b(?:nainštaloval[ao]?|nainštalovala|instaloval[ao]?|inštaloval[ao]?)\s+som\b/iu,
      /\b(?:i\s+(?:have\s+)?installed)\b/iu,
      /\b(?:bolo|bola|bol|je)\s+(?:úspešne\s+)?nainštalovan[éáý]\b/iu
    ]
  },
  {
    id:'delete',
    patterns:[
      /\b(?:vymazal[ao]?|vymazala|odstránil[ao]?|odstránila)\s+som\b/iu,
      /\b(?:i\s+(?:have\s+)?(?:deleted|removed))\b/iu,
      /\b(?:bolo|bola|bol|je)\s+(?:úspešne\s+)?(?:vymazan[éáý]|odstránen[éáý])\b/iu
    ]
  },
  {
    id:'send',
    patterns:[
      /\b(?:odoslal[ao]?|odoslala|poslal[ao]?|poslala)\s+som\b/iu,
      /\b(?:i\s+(?:have\s+)?sent)\b/iu,
      /\b(?:bolo|bola|bol|je)\s+(?:úspešne\s+)?odoslan[éáý]\b/iu
    ]
  },
  {
    id:'change',
    patterns:[
      /\b(?:zmenil[ao]?|zmenila|upravil[ao]?|upravila)\s+som\s+(?:nastavenie|nastavenia|konfiguráciu|konfiguraciu|účet|ucet|prístup|pristup)\b/iu,
      /\b(?:i\s+(?:have\s+)?(?:changed|updated)\s+(?:the\s+)?(?:settings|configuration|account|access))\b/iu
    ]
  },
  {
    id:'publish',
    patterns:[
      /\b(?:zverejnil[ao]?|zverejnila|publikoval[ao]?|publikovala|nahral[ao]?|nahrala)\s+som\b/iu,
      /\b(?:i\s+(?:have\s+)?(?:published|uploaded))\b/iu,
      /\b(?:bola|bol|je)\s+(?:úspešne\s+)?(?:vytvoren[áaý]|otvoren[áaý]|aktualizovan[áaý])\s+ako\s+issue\b/iu,
      /\b(?:vytvoril[ao]?|vytvorila|otvoril[ao]?|otvorila)\s+som\s+(?:issue|pull\s+request|pr)\b/iu,
      /\b(?:issue|pull\s+request|pr)\s+(?:číslo|cislo|#)\s*\d+\s+(?:bola|bol|je)\s+(?:úspešne\s+)?(?:vytvoren[áaý]|otvoren[áaý]|aktualizovan[áaý])\b/iu,
      /\b(?:issue|pull\s+request|pr)\s+(?:bola|bol|je)\s+(?:úspešne\s+)?(?:vytvoren[áaý]|otvoren[áaý]|aktualizovan[áaý])\b/iu
    ]
  },
  {
    id:'execute',
    patterns:[
      /\b(?:spustil[ao]?|spustila)\s+som\s+(?:príkaz|prikaz|skript|program|server|testy|deploy)\b/iu,
      /\b(?:i\s+(?:have\s+)?(?:ran|executed)\s+(?:the\s+)?(?:command|script|program|server|tests|deploy))\b/iu
    ]
  },
  {
    id:'create_file',
    patterns:[
      /\b(?:vytvoril[ao]?|vytvorila)\s+som\s+(?:súbor|subor|priečinok|priecinok|databázu|databazu|worker|dokument|dokumentáciu|dokumentaciu|správu|spravu)\b/iu,
      /\b(?:vygeneroval[ao]?|vygenerovala|uložil[ao]?|uložila)\s+som\s+(?:súbor|subor|dokument|dokumentáciu|dokumentaciu)\b/iu,
      /\b(?:dokumentácia|dokumentacia|dokument|správa|sprava|súbor|subor)\s+(?:bol[ao]?|je)\s+(?:úspešne\s+)?(?:vygenerovan[áaý]|uložen[áaý]|vytvoren[áaý])\b/iu,
      /\b(?:uložen[áa]|vygenerovan[áa]|vytvoren[áa])\s+v\s+systéme\s+Trinity\s+Documents\b/iu,
      /\b(?:i\s+(?:have\s+)?created\s+(?:a\s+|the\s+)?(?:file|folder|database|worker|document|documentation|report))\b/iu,
      /\b(?:i\s+(?:have\s+)?(?:generated|saved)\s+(?:the\s+)?(?:document|documentation|file))\b/iu,
      /\b(?:document|documentation|file)\s+(?:was|has\s+been)\s+(?:successfully\s+)?(?:generated|saved|created)\b/iu
    ]
  },
  {
    id:'payment',
    patterns:[
      /\b(?:prijal[ao]?|prijala|previedol|previedla|vybral[ao]?|vybrala|zaplatil[ao]?|zaplatila)\s+som\b/iu,
      /\bplatb[ayu]\s+(?:bola|je)\s+(?:úspešne\s+)?(?:prijat[áa]|pripísan[áa]|odoslan[áa]|uhraden[áa]|prevedená)\b/iu,
      /\b(?:payment|funds|transfer)\s+(?:was|were|has\s+been|have\s+been)\s+(?:received|sent|completed|credited)\b/iu,
      /\bi\s+(?:have\s+)?(?:received|sent|transferred|paid)\s+(?:the\s+)?(?:payment|money|funds)\b/iu
    ]
  },
  {
    id:'verify',
    patterns:[
      /\b(?:overil[ao]?|overila|skontroloval[ao]?|skontrolovala)\s+som\b/iu,
      /\b(?:i\s+(?:have\s+)?(?:verified|checked))\b/iu
    ]
  }
];

export const READ_TOOLS=new Set(['revolut_account_status','search_memory','project_snapshot','service_status','web_search','calculate','analyze_text','domain_check','domain_list','domain_inspect','domain_marketplace','quantum_accelerate','list_artifacts','read_artifact','fleet_status','trinity_doc_list']);

function supportsClaim(receipt,claimId){
  if(!receipt||receipt.status!=='completed'||!receipt.receipt_id)return false;
  if(claimId==='verify')return receipt.effect==='read'&&READ_TOOLS.has(receipt.tool);
  return receipt.effect==='mutation'&&(receipt.action===claimId||receipt.action==='*'||receipt.actions?.includes(claimId));
}

export function findUnsupportedActionClaims(text,toolLog=[]){
  const source=String(text||'');
  const unsupported=CLAIM_RULES.filter(rule=>rule.patterns.some(pattern=>pattern.test(source))&&!toolLog.some(receipt=>supportsClaim(receipt,rule.id))).map(rule=>rule.id);
  const normalized=source.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  
  // Named tool results verification
  const namedResults=[
    /\b(?:vysledok|vystup)\s+nastroja\s+`?([a-z_][a-z0-9_-]*)`?\s+(?:je|bol)\s*:/g,
    /\b(?:result|output)\s+(?:of|from)\s+(?:the\s+)?(?:tool\s+)?`?([a-z_][a-z0-9_-]*)`?\s+(?:is|was)\s*:/g,
    /\b(?:\*\*|\b)(?:nastroj|tool)(?:\*\*|\b)\s*:\s*`?([a-z_][a-z0-9_-]*)`?/g
  ];
  for(const pattern of namedResults){
    for(const match of normalized.matchAll(pattern)){
      const name=match[1];
      if(!toolLog.some(r=>r?.tool===name&&r.status==='completed'&&r.receipt_id))unsupported.push('tool_result:'+name);
    }
  }

  // Verification of Document IDs mentioned in text
  const docIdMatches = source.matchAll(/\b(?:id\s+dokumentu(?:\s+je)?|dokument\s+id|dokumentu\s+s\s+id)\s*[:=]?\s*`?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})`?/gi);
  for(const m of docIdMatches){
    const uuid=m[1].toLowerCase();
    const verified=toolLog.some(r=>r?.status==='completed'&&(
      r.document_id===uuid ||
      r.document?.id===uuid ||
      r.receipt_id===uuid ||
      r.receipt_id===`doc:${uuid}` ||
      r.receipt_id?.toLowerCase().includes(uuid)
    ));
    if(!verified)unsupported.push(`unsupported_document_id:${uuid}`);
  }

  // Verification of GitHub issue numbers claimed to be created or published
  const issueActionMatches = source.matchAll(/\b(?:(?:bola|bol|je)\s+(?:[úu]spe[šs]ne\s+)?(?:vytvoren[áaý]|otvoren[áaý]|aktualizovan[áaý])\s+ako\s+issue\s+(?:číslo|cislo|#)?\s*(\d+)|(?:vytvoril[ao]?|vytvorila|otvoril[ao]?|otvorila)\s+som\s+issue\s+(?:číslo|cislo|#)?\s*(\d+)|issue\s+(?:číslo|cislo|#)\s*(\d+)\s+v\s+repozit[áa]ri\b[^\n]*\b(?:bol[ao]?|je)\s+(?:[úu]spe[šs]ne\s+)?(?:vytvoren[áaý]|otvoren[áaý]|aktualizovan[áaý]))/gi);
  for(const m of issueActionMatches){
    const num=Number(m[1]||m[2]||m[3]);
    if(num>0){
      const verified=toolLog.some(r=>r?.status==='completed'&&(
        r.issue_number===num ||
        r.issue?.number===num ||
        r.receipt_id===`issue:${num}` ||
        r.receipt_id?.includes(`:${num}`) ||
        r.url?.includes(`/issues/${num}`)
      ));
      if(!verified)unsupported.push(`unsupported_github_issue:${num}`);
    }
  }

  if(/\b(?:\*\*|\b)(?:vystup|output)(?:\*\*|\b)\s*:\s*(?:```|\{)/i.test(normalized)&&!toolLog.some(r=>r?.status==='completed'&&r.receipt_id)){
    unsupported.push('simulated_tool_output');
  }
  if(/\b(?:nemam|nemame)\s+(?:priamy\s+)?(?:pristup|moznost)\s+(?:k\s+(?:vasim\s+)?(?:suborom|terminalu|pc)|vykonavat\s+(?:ziadne\s+)?akcie)\b/i.test(normalized)){
    unsupported.push('false_capability_disclaimer');
  }
  return [...new Set(unsupported)];
}

export function truthStatus(text,toolLog=[]){
  const unsupported=findUnsupportedActionClaims(text,toolLog);
  return {policy_version:TRUTH_POLICY_VERSION,status:unsupported.length?'blocked':'passed',unsupported_claims:unsupported};
}

export function safeTruthResponse(language='sk'){
  return language==='en'
    ? "I don't have verified evidence that the external action was completed. Neither unverified results, non-existent entity IDs, nor empty placeholder records are accepted under Truth Policy."
    : 'Nemám overený systémový dôkaz, že externá akcia bola vykonaná. Žiadny neoverený výsledok, neexistujúce ID ani prázdny zástupný záznam sa podľa Režimu pravdy (Truth Policy) nepoužijú.';
}
