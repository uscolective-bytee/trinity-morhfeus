// Normalize one explicit model action. Mixed prose is not proof that a tool ran.
function invalid(message){throw new Error('Neplatné volanie nástroja od modelu: '+message);}
function argumentsObject(value){
  if(value===undefined)return {};
  if(typeof value==='string'){
    try{value=JSON.parse(value);}catch{invalid('argumenty nie sú platný JSON.');}
  }
  if(!value||typeof value!=='object'||Array.isArray(value))invalid('argumenty musia byť objekt.');
  return value;
}
function actionObject(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  if(Array.isArray(value.tool_calls)){
    if(value.tool_calls.length!==1)invalid('očakáva sa práve jedno volanie v jednom kroku.');
    return actionObject(value.tool_calls[0])||invalid('neznámy formát tool_calls.');
  }
  let name,args;
  if(Object.hasOwn(value,'tool')){name=value.tool;args=value.arguments;}
  else if(value.functionCall){name=value.functionCall.name;args=value.functionCall.args;}
  else if(value.type==='function'||value.function){
    const fn=value.function||value;name=fn.name;
    args=Object.hasOwn(fn,'arguments')?fn.arguments:fn.parameters;
  }
  else if(typeof value.answer==='string')return {answer:value.answer};
  else return null;
  if(typeof name!=='string'||!/^[A-Za-z_][A-Za-z0-9_-]{0,127}$/.test(name))invalid('chýba platný názov.');
  return {tool:name,arguments:argumentsObject(args)};
}
function containsCallShape(text){
  return /["'](?:tool|tool_calls|functionCall)["']\s*:/.test(text)
    || /["']type["']\s*:\s*["']function["']/.test(text)
    || /(?:^|\n)\s*(?:\*\*|\b)(?:nástroj|nastroj|tool)(?:\*\*|\b)\s*:\s*`?[a-z_][a-z0-9_-]*`?/i.test(text);
}
export function parseModelAction(input){
  if(typeof input!=='string'){
    const action=actionObject(input);
    if(action)return action;
    invalid('odpoveď nemá podporovaný textový ani štruktúrovaný formát.');
  }
  const trimmed=input.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  let value;
  try{value=JSON.parse(trimmed);}catch{
    if(containsCallShape(trimmed))invalid('volanie je neúplné alebo zmiešané s prózou; výsledok nie je overený.');
    return {answer:input};
  }
  return actionObject(value)||{answer:input};
}
