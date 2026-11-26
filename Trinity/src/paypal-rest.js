/**
 * @module TRINITY_OMNI_CORE
 * @subsystem CORE_RUNTIME
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul paypal-rest.js (Trinity/src/paypal-rest.js) v ekosystéme TRINITY OMNI-CORE.
 */
/**
 * PayPal REST API v2 Live Engine for Trinity
 * Implements production PayPal checkout, order creation, and capture.
 * Credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) are read exclusively on the backend.
 */
import { HttpError } from './security.js';
import { resolveProviderSecret } from './secret-vault.js';

const PAYPAL_LIVE_API = 'https://api-m.paypal.com';
const PAYPAL_SANDBOX_API = 'https://api-m.sandbox.paypal.com';

export function getPayPalBaseUrl(env) {
  return (env?.PAYPAL_MODE || 'live').toLowerCase() === 'sandbox' ? PAYPAL_SANDBOX_API : PAYPAL_LIVE_API;
}

export function isPayPalConfigured(env) {
  return Boolean(env?.PAYPAL_CLIENT_ID && env?.PAYPAL_CLIENT_SECRET);
}

export async function resolvePayPalCredentials(env) {
  let clientId = env?.PAYPAL_CLIENT_ID || null;
  let clientSecret = env?.PAYPAL_CLIENT_SECRET || null;

  if (!clientSecret) {
    try {
      const secret = await resolveProviderSecret(env, 'paypal');
      if (secret) {
        if (secret.includes(':') && !clientId) {
          const parts = secret.split(':');
          clientId = parts[0].trim();
          clientSecret = parts.slice(1).join(':').trim();
        } else {
          clientSecret = secret;
        }
      }
    } catch {}
  }

  if (!clientId && env?.DB?.prepare && typeof env?.TRINITY_VAULT_KEY === 'string') {
    try {
      const row = await env.DB.prepare("SELECT * FROM ops_secret_vault WHERE provider='custom' AND status!='revoked' AND lower(name) LIKE '%paypal_client_id%' ORDER BY updated_at DESC LIMIT 1").first();
      if (row) {
        const { decrypt } = await import('./secret-vault.js');
        clientId = await decrypt(env, row);
      }
    } catch {}
  }

  return { clientId, clientSecret };
}

export async function getPayPalAccessToken(env) {
  const { clientId, clientSecret } = await resolvePayPalCredentials(env);
  if (!clientId || !clientSecret) {
    throw new HttpError(503, 'PayPal REST API nie je nakonfigurované. Zadaj PAYPAL_CLIENT_ID a PAYPAL_CLIENT_SECRET do backendových Secrets.');
  }

  const baseUrl = getPayPalBaseUrl(env);
  const auth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new HttpError(response.status, `PayPal autentifikácia zlyhala: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(env, { amountEur, description, referenceId, returnUrl, cancelUrl, cart } = {}) {
  let amount = Number(amountEur);
  if (!Number.isFinite(amount) || amount <= 0) {
    if (Array.isArray(cart) && cart.length > 0) {
      amount = cart.reduce((acc, item) => {
        const itemVal = Number(item.unit_amount?.value || item.amount || item.price || 0) * Number(item.quantity || 1);
        return acc + (Number.isFinite(itemVal) ? itemVal : 0);
      }, 0);
    }
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, 'Neplatná suma v EUR.');
  }

  const token = await getPayPalAccessToken(env);
  const baseUrl = getPayPalBaseUrl(env);

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: referenceId || crypto.randomUUID(),
        description: (description || 'Trinity Platform Order').slice(0, 120),
        amount: {
          currency_code: 'EUR',
          value: amount.toFixed(2)
        }
      }
    ],
    application_context: {
      brand_name: 'Trinity Basterix',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      ...(returnUrl ? { return_url: returnUrl } : {}),
      ...(cancelUrl ? { cancel_url: cancelUrl } : {})
    }
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new HttpError(response.status, `Vytvorenie PayPal objednávky zlyhalo: ${err.slice(0, 200)}`);
  }

  const order = await response.json();
  const approveLink = order.links?.find(l => l.rel === 'approve')?.href || null;

  return {
    id: order.id,
    order_id: order.id,
    status: order.status,
    amount_eur: amount,
    currency: 'EUR',
    approve_url: approveLink,
    links: order.links || [],
    mode: (env?.PAYPAL_MODE || 'live').toLowerCase(),
    created_at: new Date().toISOString()
  };
}

export async function capturePayPalOrder(env, orderId) {
  if (!orderId || typeof orderId !== 'string') {
    throw new HttpError(400, 'Zadaj platné PayPal Order ID.');
  }

  const token = await getPayPalAccessToken(env);
  const baseUrl = getPayPalBaseUrl(env);

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const err = await response.text();
    throw new HttpError(response.status, `Zachytenie PayPal platby zlyhalo: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const captureUnit = data.purchase_units?.[0]?.payments?.captures?.[0];
  const amountEur = captureUnit?.amount?.value ? Number(captureUnit.amount.value) : null;
  const isCompleted = data.status === 'COMPLETED';

  // Automatically record verified payment in ops_wallet_ledger if DB is present
  if (isCompleted && env?.DB?.prepare) {
    try {
      const entryId = crypto.randomUUID();
      const amountCents = Math.round((amountEur || 0) * 100);
      await env.DB.prepare(`INSERT OR IGNORE INTO ops_wallet_ledger(id, owner_id, kind, amount_cents, currency, channel, ref_id, evidence_type, evidence_ref, note)
        VALUES(?, 'admin', 'received', ?, 'EUR', 'paypal', ?, 'paypal_capture', ?, ?)`).bind(
        entryId,
        amountCents,
        data.id,
        captureUnit?.id || data.id,
        `PayPal capture: ${data.payer?.email_address || 'Verified Payer'}`
      ).run();
    } catch (e) {
      console.error('Failed to log PayPal capture to ledger:', e);
    }
  }

  return {
    id: data.id,
    order_id: data.id,
    status: data.status, // e.g. "COMPLETED"
    capture_id: captureUnit?.id || null,
    amount_eur: amountEur,
    currency: captureUnit?.amount?.currency_code || 'EUR',
    payer: data.payer ? { email: data.payer.email_address, name: data.payer.name?.given_name } : null,
    completed: isCompleted,
    verified_at: new Date().toISOString()
  };
}

export async function getPayPalOrderStatus(env, orderId) {
  if (!orderId || typeof orderId !== 'string') {
    throw new HttpError(400, 'Zadaj platné PayPal Order ID.');
  }

  const token = await getPayPalAccessToken(env);
  const baseUrl = getPayPalBaseUrl(env);

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new HttpError(response.status, `Kontrola PayPal objednávky zlyhala.`);
  }

  const order = await response.json();
  const approveLink = order.links?.find(l => l.rel === 'approve')?.href || null;

  return {
    id: order.id,
    order_id: order.id,
    status: order.status,
    amount_eur: order.purchase_units?.[0]?.amount?.value ? Number(order.purchase_units[0].amount.value) : null,
    approve_url: approveLink
  };
}

export async function handlePayPalCheckoutApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. GET /api/paypal/setup or /api/paypal/client-id
  if (path === '/api/paypal/setup' || path === '/api/paypal/client-id') {
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
    const { clientId } = await resolvePayPalCredentials(env);
    return Response.json({
      configured: Boolean(clientId),
      client_id: clientId,
      mode: (env?.PAYPAL_MODE || 'live').toLowerCase(),
      currency: 'EUR'
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json'
      }
    });
  }

  // 2. POST /api/orders
  if (path === '/api/orders') {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    try {
      const body = await request.json().catch(() => ({}));
      const amountEur = body.amountEur || body.amount || body.value;
      const order = await createPayPalOrder(env, {
        amountEur,
        description: body.description || body.purpose,
        referenceId: body.referenceId || body.reference_id,
        returnUrl: body.returnUrl || body.return_url,
        cancelUrl: body.cancelUrl || body.cancel_url,
        cart: body.cart
      });
      return Response.json(order, {
        status: 201,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    } catch (err) {
      const status = err.status || 500;
      return Response.json({ error: err.message || 'Chyba pri vytváraní PayPal objednávky' }, {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }
  }

  // 3. POST /api/orders/:orderID/capture
  const captureMatch = path.match(/^\/api\/orders\/([A-Za-z0-9_-]+)\/capture$/);
  if (captureMatch) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    try {
      const orderId = captureMatch[1];
      const captureResult = await capturePayPalOrder(env, orderId);
      return Response.json(captureResult, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    } catch (err) {
      const status = err.status || 500;
      return Response.json({ error: err.message || 'Chyba pri spracovaní PayPal platby' }, {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }
  }

  // 4. GET /api/orders/:orderID
  const orderMatch = path.match(/^\/api\/orders\/([A-Za-z0-9_-]+)$/);
  if (orderMatch) {
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
    try {
      const orderId = orderMatch[1];
      const statusResult = await getPayPalOrderStatus(env, orderId);
      return Response.json(statusResult, {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    } catch (err) {
      const status = err.status || 500;
      return Response.json({ error: err.message || 'Chyba pri kontrole PayPal objednávky' }, {
        status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }
  }

  return null;
}

export function paypalDiagnostics(env) {
  const configured = isPayPalConfigured(env);
  const clientId = env?.PAYPAL_CLIENT_ID || null;
  const maskedClientId = clientId ? `${clientId.slice(0, 6)}...${clientId.slice(-4)}` : null;

  return {
    configured,
    mode: (env?.PAYPAL_MODE || 'live').toLowerCase(),
    api_endpoint: getPayPalBaseUrl(env),
    client_id_configured: Boolean(clientId),
    client_id_masked: maskedClientId,
    secret_configured: Boolean(env?.PAYPAL_CLIENT_SECRET),
    real_money: true,
    simulation_disabled: true
  };
}
