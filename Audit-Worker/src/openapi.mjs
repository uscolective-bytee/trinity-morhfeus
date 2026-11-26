export default {
  openapi:'3.0.3',
  info:{title:'Trinity CI Audit',version:'0.1.0'},
  paths:{
    '/health':{get:{summary:'Configuration readiness, not a database connectivity probe',responses:{200:{description:'Required bindings configured'},503:{description:'Configuration incomplete'}}}},
    '/v1/audit':{post:{summary:'Store an allowlisted, signed CI receipt',security:[{auditSignature:[],auditTimestamp:[]}],
      description:'Maximum 4096 UTF-8 bytes. Signature is sha256=<hex HMAC-SHA256(timestamp + dot + exact raw JSON)>; timestamp is Unix seconds within five minutes. event_id is an idempotency key.',
      requestBody:{required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/Audit'}}}},
      responses:{200:{description:'Identical event already stored'},201:{description:'Stored'},400:{description:'Invalid payload'},401:{description:'Missing, expired or invalid signature'},409:{description:'event_id reused with different payload'},413:{description:'Payload too large'},415:{description:'Expected JSON'},503:{description:'Unavailable or persistence failed'}}}}
  },
  components:{securitySchemes:{
    auditSignature:{type:'apiKey',in:'header',name:'X-Trinity-Audit-Signature'},
    auditTimestamp:{type:'apiKey',in:'header',name:'X-Trinity-Audit-Timestamp'}
  },schemas:{Audit:{type:'object',required:['event_id','repo','sha','status','trigger'],properties:{
    event_id:{type:'string',format:'uuid'},repo:{type:'string',description:'Must match the configured repository allowlist'},
    sha:{type:'string',pattern:'^[0-9a-fA-F]{40}([0-9a-fA-F]{24})?$'},
    status:{type:'string',enum:['pending','success','failure','cancelled','blocked','approved','deployed']},
    trigger:{type:'string',enum:['push','pull_request','workflow_dispatch','schedule','manual','deployment']},
    actor:{type:'string',maxLength:80,nullable:true},branch:{type:'string',maxLength:130,nullable:true},
    environment:{type:'string',enum:['staging','production','development'],nullable:true},
    duration_ms:{type:'integer',minimum:0,maximum:86400000,nullable:true}
  }}}}
};
