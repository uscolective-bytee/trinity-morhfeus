import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dailyPlanSchema,createDailyPlan} from '../src/daily-planner.js';
const sample=()=>({date:'2026-10-22',tasks:[{title:'Dokončiť rozpočet',minutes:60,priority:'high'}],available_minutes:90,idempotency_key:crypto.randomUUID()});
test('daily plan rejects invalid dates, unbounded work and extra fields',()=>{
  for(const extra of [{date:'2026-02-30'},{available_minutes:0},{tasks:[]},{tasks:[{title:'X',minutes:481}]},{tasks:Array(21).fill({title:'X',minutes:5})},{owner_mode:true},{idempotency_key:'not-a-uuid'},{provider:'copilot'}])assert.equal(dailyPlanSchema.safeParse({...sample(),...extra}).success,false);
});
test('daily plan preserves supplied data, provider and request identity in a single planner job',async()=>{
  let stored,created;
  const env={DB:{prepare(sql){return {bind(...args){if(sql.startsWith('INSERT'))stored=args;return {async run(){},async first(){return {id:stored[0]};}};}};}},OPS_WORKFLOW:{async create(args){created=args;}}};
  const input={...sample(),provider:'gemini'};
  const job=await createDailyPlan(env,input);
  assert.equal(stored[4],'gemini');assert.equal(stored[5],input.idempotency_key);
  assert.deepEqual(JSON.parse(stored[3]),['planner']);
  const data=JSON.parse(stored[2].split('\nINPUT_JSON\n')[1]);
  assert.equal(data.timezone,'Europe/Bratislava');assert.deepEqual(data.tasks,input.tasks);
  assert.equal(created.params.job_id,job.id);assert.equal(job.status,'queued');
});
