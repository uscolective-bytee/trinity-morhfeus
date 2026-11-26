import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPayPalBaseUrl, isPayPalConfigured, paypalDiagnostics, createPayPalOrder, capturePayPalOrder, handlePayPalCheckoutApi, resolvePayPalCredentials } from '../src/paypal-rest.js';

test('PayPal REST: detects live vs sandbox base URL correctly', () => {
  assert.equal(getPayPalBaseUrl({ PAYPAL_MODE: 'live' }), 'https://api-m.paypal.com');
  assert.equal(getPayPalBaseUrl({}), 'https://api-m.paypal.com');
  assert.equal(getPayPalBaseUrl({ PAYPAL_MODE: 'sandbox' }), 'https://api-m.sandbox.paypal.com');
});

test('PayPal REST: reports unconfigured state when secrets are missing without crashing', () => {
  const env = {};
  assert.equal(isPayPalConfigured(env), false);
  const diag = paypalDiagnostics(env);
  assert.equal(diag.configured, false);
  assert.equal(diag.client_id_configured, false);
  assert.equal(diag.secret_configured, false);
  assert.equal(diag.real_money, true);
  assert.equal(diag.simulation_disabled, true);
});

test('PayPal REST: masks client id securely in diagnostics', () => {
  const env = {
    PAYPAL_CLIENT_ID: 'AX1234567890ABCDEF1234',
    PAYPAL_CLIENT_SECRET: 'SECRET_XYZ'
  };
  assert.equal(isPayPalConfigured(env), true);
  const diag = paypalDiagnostics(env);
  assert.equal(diag.configured, true);
  assert.equal(diag.client_id_configured, true);
  assert.equal(diag.secret_configured, true);
  assert.equal(diag.client_id_masked, 'AX1234...1234');
});

test('PayPal REST: createPayPalOrder rejects non-positive or invalid amounts', async () => {
  await assert.rejects(
    async () => createPayPalOrder({}, { amountEur: -10 }),
    /Neplatná suma v EUR/
  );
  await assert.rejects(
    async () => createPayPalOrder({}, { amountEur: 0 }),
    /Neplatná suma v EUR/
  );
  await assert.rejects(
    async () => createPayPalOrder({}, { amountEur: 'abc' }),
    /Neplatná suma v EUR/
  );
});

test('PayPal REST: createPayPalOrder fails closed when credentials missing', async () => {
  await assert.rejects(
    async () => createPayPalOrder({}, { amountEur: 50 }),
    /PayPal REST API nie je nakonfigurované/
  );
});

test('PayPal REST: capturePayPalOrder validates orderId and fails closed', async () => {
  await assert.rejects(
    async () => capturePayPalOrder({}, null),
    /Zadaj platné PayPal Order ID/
  );
  await assert.rejects(
    async () => capturePayPalOrder({}, ''),
    /Zadaj platné PayPal Order ID/
  );
});

test('PayPal REST: resolvePayPalCredentials extracts credentials from env and secret vault', async () => {
  const creds1 = await resolvePayPalCredentials({ PAYPAL_CLIENT_ID: 'cid', PAYPAL_CLIENT_SECRET: 'csec' });
  assert.equal(creds1.clientId, 'cid');
  assert.equal(creds1.clientSecret, 'csec');

  const creds2 = await resolvePayPalCredentials({});
  assert.equal(creds2.clientId, null);
  assert.equal(creds2.clientSecret, null);
});

test('PayPal REST: handlePayPalCheckoutApi provides setup and handles invalid requests cleanly', async () => {
  const env = { PAYPAL_CLIENT_ID: 'test_client_id_123', PAYPAL_MODE: 'sandbox' };

  // GET /api/paypal/setup
  const setupReq = new Request('https://auru.space/api/paypal/setup', { method: 'GET' });
  const setupRes = await handlePayPalCheckoutApi(setupReq, env);
  assert.equal(setupRes.status, 200);
  const setupData = await setupRes.json();
  assert.equal(setupData.configured, true);
  assert.equal(setupData.client_id, 'test_client_id_123');
  assert.equal(setupData.mode, 'sandbox');

  // POST /api/orders with invalid amount
  const orderReq = new Request('https://auru.space/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountEur: -5 })
  });
  const orderRes = await handlePayPalCheckoutApi(orderReq, env);
  assert.equal(orderRes.status, 400);
  const orderData = await orderRes.json();
  assert.match(orderData.error, /Neplatná suma v EUR/);

  // POST /api/orders/:orderID/capture fails closed without valid credentials
  const capReq = new Request('https://auru.space/api/orders/ORDER123/capture', {
    method: 'POST'
  });
  const capRes = await handlePayPalCheckoutApi(capReq, env);
  assert.equal(capRes.status, 503);
  const capData = await capRes.json();
  assert.match(capData.error, /PayPal REST API nie je nakonfigurované/);

  // Unrelated path returns null
  const otherReq = new Request('https://auru.space/api/other', { method: 'GET' });
  const otherRes = await handlePayPalCheckoutApi(otherReq, env);
  assert.equal(otherRes, null);
});
