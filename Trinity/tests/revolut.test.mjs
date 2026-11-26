import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 proPaymentUrl,
 proCatalogSchema,
 revolutProStatus,
 configureRevolutPro,
 handleRevolutProPublic,
 paypalPaymentUrl,
 paypalCatalogSchema,
 paypalStatus,
 configurePaypal,
 handlePaypalPublic,
 commerceStatus,
 configureCommerceAccounts,
 upsertCommerceProduct,
 deleteCommerceProduct,
 handleCommercePublic
} from '../src/revolut.js';

function environment(){const data=new Map();return {Mastermind:{async get(k){return data.get(k)??null;},async put(k,v){data.set(k,v);}}};}
const product=(extra={})=>({id:'service',name:'Služba',description:'Dohodnutá zákazka',amount_cents:2500,currency:'EUR',payment_url:'https://pay.revolut.com/example',active:true,expires_at:null,...extra});
const paypalProduct=(extra={})=>({id:'paypal-service',name:'PayPal Služba',description:'Medzinárodná objednávka',amount_cents:4900,currency:'EUR',payment_url:'https://www.paypal.com/paypalme/trinityowner/49',active:true,expires_at:null,...extra});
const request=path=>new Request('https://trinity.test'+path);

test('Pro uses live payment links, without inventing an account connection or a payment',async()=>{
 const e=environment(),before=await revolutProStatus(e);
 assert.equal(before.configured,false);assert.equal(before.mode,'live-payment-links');assert.equal(before.bank_account_connected,false);
 const saved=await configureRevolutPro(e,'owner',{products:[product()]});assert.equal(saved.configured,true);assert.equal(saved.automatic_payment_verification,false);assert.equal(saved.payment_status,'not_checked');
});
test('Pro accepts only exact official payment hosts and HTTPS',()=>{
 for(const value of ['http://pay.revolut.com/test','https://pay.revolut.com.evil.test/test','https://evil.test/pay','https://user:pass@pay.revolut.com/test','https://pay.revolut.com:8443/test','https://pay.revolut.com/','https://pay.revolut.com/test#secret','javascript:alert(1)'])assert.equal(proPaymentUrl.safeParse(value).success,false,value);
 for(const host of ['pay.revolut.com','checkout.revolut.com','revolut.me'])assert.equal(proPaymentUrl.safeParse('https://'+host+'/example').success,true);
});
test('Pro checkout redirects only to the saved link and never confirms payment',async()=>{
 const e=environment();await configureRevolutPro(e,'owner',{products:[product()]});
 const res=await handleRevolutProPublic(request('/pay/revolut-pro/service?url=https://evil.test'),e);
 assert.equal(res.status,302);assert.equal(res.headers.get('location'),product().payment_url);assert.equal(res.headers.get('cache-control'),'no-store');
 assert.equal((await revolutProStatus(e)).payment_status,'not_checked');
});
test('public catalog contains only available products and no configuration metadata',async()=>{
 const e=environment();await configureRevolutPro(e,'owner',{products:[product(),product({id:'disabled',active:false}),product({id:'expired',expires_at:'2020-01-01T00:00:00Z'})]});
 const result=await(await handleRevolutProPublic(request('/api/payments/revolut-pro'),e)).json();
 assert.equal(result.products.length,1);assert.equal(result.products[0].checkout_path,'/pay/revolut-pro/service');assert.equal('payment_url' in result.products[0],false);assert.equal(result.automatic_payment_verification,false);
 for(const id of ['disabled','expired','missing'])await assert.rejects(handleRevolutProPublic(request('/pay/revolut-pro/'+id),e),e=>e.status===404);
});
test('Pro rejects duplicate IDs, arbitrary fields and invalid price or currency',()=>{
 for(const extra of [{amount_cents:0},{amount_cents:25.5},{currency:'USD'},{paid:true}])assert.equal(proCatalogSchema.safeParse({products:[product(extra)]}).success,false);
 assert.equal(proCatalogSchema.safeParse({products:[product(),product()]}).success,false);
});
test('Pro missing storage fails closed on writes; no product is enabled by default',async()=>{
 await assert.rejects(configureRevolutPro({},'owner',{products:[product()]}),e=>e.status===503);
 assert.equal((await revolutProStatus({})).configured,false);
 assert.equal(await handleRevolutProPublic(request('/unrelated'),{}),null);
 const res=await handleRevolutProPublic(new Request('https://trinity.test/api/payments/revolut-pro',{method:'POST'}),{});assert.equal(res.status,405);
});
test('PayPal accepts only official PayPal HTTPS payment hosts and redirects safely',async()=>{
 for(const bad of ['http://paypal.me/test','https://paypal.com.evil.test/pay','https://paypal.me/','https://paypal.me/test#frag','https://user:pw@paypal.me/test'])assert.equal(paypalPaymentUrl.safeParse(bad).success,false,bad);
 for(const good of ['https://paypal.me/trinityowner','https://www.paypal.me/trinityowner/25','https://www.paypal.com/paypalme/trinityowner','https://www.paypal.com/ncp/payment/ABC123XYZ'])assert.equal(paypalPaymentUrl.safeParse(good).success,true,good);
 const e=environment();
 const saved=await configurePaypal(e,'owner',{products:[paypalProduct()]});
 assert.equal(saved.configured,true);
 assert.equal(saved.bank_account_connected,false);
 assert.equal(saved.automatic_payment_verification,false);
 const res=await handlePaypalPublic(request('/pay/paypal/paypal-service?redirect=https://evil.test'),e);
 assert.equal(res.status,302);
 assert.equal(res.headers.get('location'),paypalProduct().payment_url);
 assert.equal(paypalCatalogSchema.safeParse({products:[paypalProduct(),paypalProduct()]}).success,false);
});
test('Unified commerce manages Revolut & PayPal accounts, upserts/deletes offers, and serves public catalog',async()=>{
 const e=environment();
 await configureCommerceAccounts(e,'owner',{
  business_name:'Trinity Digital Studio',
  revolut_url:'https://revolut.me/trinitystudio',
  paypal_url:'https://paypal.me/trinitystudio',
  default_currency:'EUR',
  note:'Platba vopred na základe dohody.'
 });
 await upsertCommerceProduct(e,'owner',{provider:'revolut-pro',product:product({id:'web-audit',name:'Web Audit',amount_cents:9900})});
 await upsertCommerceProduct(e,'owner',{provider:'paypal',product:paypalProduct({id:'domain-lease',name:'Prenájom domény',amount_cents:4900})});
 const status=await commerceStatus(e);
 assert.equal(status.configured,true);
 assert.equal(status.bank_account_connected,false);
 assert.equal(status.automatic_payment_verification,false);
 assert.equal(status.summary.active_products,2);
 assert.equal(status.summary.total_catalog_eur,148);
 const pubRes=await handleCommercePublic(request('/api/payments/catalog'),e);
 const pub=await pubRes.json();
 assert.equal(pub.business_name,'Trinity Digital Studio');
 assert.equal(pub.products.length,2);
 assert.equal(pub.automatic_payment_verification,false);
 const afterDel=await deleteCommerceProduct(e,'owner','paypal','domain-lease');
 assert.equal(afterDel.summary.active_products,1);
});
