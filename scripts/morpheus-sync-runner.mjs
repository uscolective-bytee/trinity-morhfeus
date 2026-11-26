#!/usr/bin/env node
/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul morpheus-sync-runner.mjs (scripts/morpheus-sync-runner.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
// One-way Morpheus -> canonical Trinity synchronization. The legacy
// repository is always read-only; never force-push, rewrite main or
// bypass checks. GitHub Actions GITHUB_TOKEN handles archival and PRs.
import {spawnSync} from 'node:child_process';
import {requiresHumanReview,approvedCheckRuns} from './morpheus-sync-policy.mjs';

const DEST='uscolective-byte/Trinity-antigravity';
const SOURCE='uscolective-byte/trinity-morhfeus';
const BRANCH='sync/morpheus-main';
const SOURCE_MAIN='refs/remotes/morpheus/main';
const CHECK_WORKFLOWS=['webpack.yml','integrations-check.yml','dependency-security.yml','codeql.yml'];

function invoke(bin,args,{allowFailure=false,timeout=120000}={}){
  const result=spawnSync(bin,args,{encoding:'utf8',timeout,
    maxBuffer:2*1024*1024,env:process.env});
  if(result.error||result.status!==0){
    if(allowFailure)return {ok:false,text:(result.stdout||'').trim()};
    throw new Error(`${bin} ${args.slice(0,2).join(' ')} failed. Sensitive command output was suppressed.`);
  }
  return {ok:true,text:(result.stdout||'').trim()};
}
const git=(...args)=>invoke('git',args).text;
const gh=(...args)=>invoke('gh',args).text;
const gitOk=(...args)=>invoke('git',args,{allowFailure:true}).ok;

function refs(namespace){
  const raw=git('for-each-ref','--format=%(refname) %(objectname)',namespace);
  return new Map(raw.split('\n').filter(Boolean).map(line=>{
    const split=line.lastIndexOf(' ');
    return [line.slice(0,split),line.slice(split+1)];
  }));
}
function createIssue(title,body){
  const existing=JSON.parse(gh('issue','list','--repo',DEST,'--state','open',
    '--limit','100','--json','title'));
  if(!existing.some(issue=>issue.title===title)){
    gh('issue','create','--repo',DEST,'--title',title,'--body',body);
  }
}
function conflict(kind,paths,sha){
  const title=`Morpheus sync conflict: ${kind}`;
  const body=[
    'Automatická synchronizácia zastavená bez prepísania dát.',
    `Source: ${SOURCE} @ ${sha}`,
    `Destination: ${DEST}`,
    `Konflikt: ${paths.slice(0,25).join(', ')||'(no paths)'}`,
    'Vyžaduje sa kontrola; nepoužiť --force ani automatické ours/theirs.'
  ].join('\n\n');
  createIssue(title,body);
}
function archiveBranches(){
  const src=refs('refs/remotes/morpheus/');
  const dest=refs('refs/remotes/origin/mirror/morpheus/');
  if(src.size<1||src.size>200)throw new Error('Unexpected source branch count.');
  let created=0,advanced=0,rewrites=0;
  for(const [sourceRef,sha] of src){
    const name=sourceRef.replace(/^refs\/remotes\/morpheus\//,'');
    if(name==='HEAD')continue;
    if(!gitOk('check-ref-format','--branch',name))throw new Error('Invalid source branch.');
    const target=`refs/heads/mirror/morpheus/${name}`;
    const old=dest.get(`refs/remotes/origin/mirror/morpheus/${name}`);
    if(old===sha)continue;
    if(old&&!gitOk('merge-base','--is-ancestor',old,sha)){
      const snap=`refs/heads/mirror/morpheus-rewrites/${name}/${sha.slice(0,12)}`;
      const snapshotExists=gitOk('ls-remote','--exit-code','origin',snap);
      if(!snapshotExists)git('push','origin',`${sha}:${snap}`);
      conflict(`rewritten branch ${name}`,[name],sha);
      rewrites++;
      continue;
    }
    git('push','origin',`${sha}:${target}`); // strictly fast-forward
    old?advanced++:created++;
  }
  console.log(`Morpheus branch archive: new=${created}, updated=${advanced}, rewritten=${rewrites}`);
  return {created,advanced,rewrites};
}
function archiveTags(){
  const src=refs('refs/remotes/morpheus-tags/');
  const remote=git('ls-remote','--tags','--refs','origin');
  const existing=new Map(remote.split('\n').filter(Boolean).map(line=>{
    const parts=line.split('\t');
    return [parts[1],parts[0]];
  }));
  let created=0,retargeted=0;
  for(const [ref,sha] of src){
    const name=ref.replace(/^refs\/remotes\/morpheus-tags\//,'');
    const dest=`refs/tags/morpheus/${name}`;
    const previous=existing.get(dest);
    if(previous===sha)continue;
    if(previous&&previous!==sha){
      const snapshot=`refs/tags/morpheus-rewrites/${name}/${sha.slice(0,12)}`;
      if(!existing.has(snapshot))git('push','origin',`${sha}:${snapshot}`);
      conflict(`retargeted tag ${name}`,[name],sha);
      retargeted++;
      continue;
    }
    git('push','origin',`${sha}:${dest}`);
    created++;
  }
  console.log(`Morpheus tag archive: new=${created}, retargeted=${retargeted}`);
}
function dispatchChecks(){
  for(const name of CHECK_WORKFLOWS)
    gh('workflow','run',name,'--repo',DEST,'--ref',BRANCH);
  console.log('Four explicit GitHub checks dispatched; this is NOT a passed test result.');
}
function syncMain(){
  const sourceSha=git('rev-parse',SOURCE_MAIN);
  if(gitOk('merge-base','--is-ancestor',sourceSha,'refs/remotes/origin/main')){
    console.log('Morpheus main is already contained in canonical main.');
    return;
  }
  const branchExists=gitOk('show-ref','--verify','--quiet',
    'refs/remotes/origin/sync/morpheus-main');
  git('switch','-C',BRANCH,branchExists?
    'refs/remotes/origin/sync/morpheus-main':'refs/remotes/origin/main');
  let updated=false;
  if(!gitOk('merge-base','--is-ancestor',sourceSha,'HEAD')){
    if(!gitOk('merge','--no-ff','--no-edit',SOURCE_MAIN)){
      const files=git('diff','--name-only','--diff-filter=U').split('\n').filter(Boolean);
      invoke('git',['merge','--abort'],{allowFailure:true});
      conflict('main merge',files,sourceSha);
      throw new Error(`Morpheus main merge blocked: ${files.length} conflicts. No overwrite performed.`);
    }
    git('push','origin',`HEAD:refs/heads/${BRANCH}`);
    updated=true;
  }
  const changed=git('diff','--name-only','refs/remotes/origin/main...HEAD')
    .split('\n').filter(Boolean);
  if(!changed.length){
    console.log('No changes to apply to main; source history is archived.');
    return;
  }
  const humanReview=requiresHumanReview(changed);
  const head=git('rev-parse','HEAD');
  const body=[
    `Automatický jednosmerný merge z ${SOURCE}/main do ${DEST}/main.`,
    `Source SHA: \`${sourceSha}\`. Sync SHA: \`${head}\`.`,
    `Files: ${changed.length}. ${humanReview?
      '**Kód alebo konfigurácia — vyžaduje ľudské review.**':
      '**Len dokumentácia — automatický merge až po zelených kontrolách.**'}`,
    'GitHub Actions GITHUB_TOKEN-created PR events do not start CI automatically; four workflows are explicitly dispatched.',
    'Žiadny force push, žiadny priamy zápis do main ani obídenie bezpečnostných kontrol.'
  ].join('\n\n');
  let number=gh('pr','list','--repo',DEST,'--state','open','--head',BRANCH,
    '--json','number','--jq','.[0].number // empty');
  if(!number){
    gh('pr','create','--repo',DEST,'--base','main','--head',BRANCH,
      '--title','sync(morpheus): guarded import into canonical Trinity','--body',body);
    number=gh('pr','list','--repo',DEST,'--state','open','--head',BRANCH,
      '--json','number','--jq','.[0].number // empty');
  }else if(updated){
    gh('pr','edit',number,'--repo',DEST,'--body',body);
  }
  if(!number)throw new Error('Cannot open sync PR. Check GitHub Actions PR creation permission.');
  console.log(`Sync PR #${number}; files=${changed.length}; review=${humanReview}`);
  if(updated)dispatchChecks();
  if(humanReview){
    console.log('Source includes code/config; PR remains open for review.');
    return;
  }
  const checkData=JSON.parse(gh('api',
    `repos/${DEST}/commits/${head}/check-runs?per_page=100`));
  if(checkData.total_count>100||!approvedCheckRuns(checkData.check_runs)){
    console.log('Required workflow checks not green; merge blocked.');
    return;
  }
  const status=JSON.parse(gh('api',`repos/${DEST}/commits/${head}/status`));
  if(['failure','error','pending'].includes(status.state)){
    console.log('Other commit statuses not green; merge blocked.');
    return;
  }
  const state=JSON.parse(gh('pr','view',number,'--repo',DEST,
    '--json','isDraft,mergeStateStatus,headRefOid,reviewDecision'));
  if(state.isDraft||state.headRefOid!==head||
    state.reviewDecision==='CHANGES_REQUESTED'||state.mergeStateStatus!=='CLEAN'){
    console.log('PR is not clean or was modified; merge blocked.');
    return;
  }
  gh('pr','merge',number,'--repo',DEST,'--merge','--delete-branch');
  console.log(`Documentation-only sync PR #${number} merged after checks.`);
}
function main(){
  if(process.env.GITHUB_REPOSITORY!==DEST||
    process.env.GITHUB_REF!=='refs/heads/main')
    throw new Error('Sync may only run in canonical GitHub main.');
  if(!process.env.GH_TOKEN)throw new Error('GH_TOKEN unavailable.');
  git('config','user.name','trinity-morpheus-sync[bot]');
  git('config','user.email','41898282+github-actions[bot]@users.noreply.github.com');
  git('remote','add','morpheus',`https://github.com/${SOURCE}.git`);
  git('fetch','--no-tags','origin','+refs/heads/*:refs/remotes/origin/*');
  git('fetch','--no-tags','morpheus','+refs/heads/*:refs/remotes/morpheus/*');
  git('fetch','--no-tags','morpheus','+refs/tags/*:refs/remotes/morpheus-tags/*');
  const archive=archiveBranches();
  archiveTags();
  // A source history rewrite needs human review even when only markdown files
  // changed. Preserve snapshots, but never reconcile rewritten main blindly.
  if(archive.rewrites>0){
    console.log('Source history was rewritten; canonical main sync is paused for review.');
    return;
  }
  syncMain();
}
try{main();}catch(error){
  console.error('Morpheus sync safely stopped: '+error.message);
  process.exitCode=1;
}
