import {readdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
async function walk(dir,prefix=''){
  const result=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const name=prefix+entry.name;
    if(entry.isDirectory())result.push(...await walk(new URL(entry.name+'/',dir),name+'/'));
    else result.push(name);
  }
  return result.sort();
}
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:fileURLToPath(root),encoding:'utf8'}).trim();
const sections=[`# Trinity: úplný index zdrojových modulov\n\nGenerované zo zdrojov na commite \`${sha}\`. Pracovný strom môže obsahovať rozpracované úpravy; index nie je doklad nasadenia ani pripojenia služieb.\n\nSpusti znovu: \`node scripts/build-owner-reference.mjs\`. Zoznam exportov je statický index, nie zoznam povolených nástrojov. Aktuálne oprávnenia a schémy sa zisťujú cez autorizovaný katalóg.\n`];
for(const base of ['src','services']){
  sections.push(`## ${base}: každý zdrojový modul\n`);
  for(const name of (await walk(new URL(base+'/',root))).filter(n=>/\.(?:m?js|ts)$/.test(n))){
    const source=await readFile(new URL(base+'/'+name,root),'utf8');
    const names=[...source.matchAll(/export\s+(?:(?:async|default)\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g)].map(m=>m[1]);
    sections.push(`<details>\n<summary>${base}/${name}</summary>\n\n[Otvoriť zdroj](../${base}/${name})\n\nExportované rozhrania: ${names.length?names.map(n=>'`'+n+'`').join(', '):'modul bez priamo deklarovaného pomenovaného exportu; pozri zdroj a reexporty'}.\n\n</details>\n`);
  }
}
sections.push('## Databázové migrácie\n\nZoznam súborov nepotvrdzuje ich aplikovanie na produkčnú databázu.\n');
for(const name of await walk(new URL('migrations/',root)))sections.push(`- [${name}](../migrations/${name})`);
const index=await readFile(new URL('src/index.js',root),'utf8');
const routes=[...new Set([...index.matchAll(/path\s*===\s*(['"])(\/[^'"\n]+)\1/g)].map(m=>m[2]))].sort();
sections.push('\n## Doslovné cesty hlavného routera\n\nStatický výber z `src/index.js`; dynamické regex cesty a vnorené routery sú popísané v príslušných zdrojoch. Prítomnosť cesty nepotvrdzuje oprávnenie ani funkčnú integráciu.\n');
for(const route of routes)sections.push('- `'+route+'`');
await writeFile(new URL('docs/SOURCE_REFERENCE.md',root),sections.join('\n')+'\n');
console.log(JSON.stringify({source_commit:sha,routes:routes.length,output:'docs/SOURCE_REFERENCE.md'}));
