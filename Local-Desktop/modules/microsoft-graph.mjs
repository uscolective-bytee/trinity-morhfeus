/**
 * @module TRINITY_OMNI_CORE
 * @subsystem LOCAL_DESKTOP_UI
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul microsoft-graph.mjs (Local-Desktop/modules/microsoft-graph.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import { boundedJSON } from './http.mjs';

export const MICROSOFT_PROFILES = Object.freeze({
  entra_id: {
    id: 'entra_id',
    name: 'Entra ID Tenant',
    account: 'usc31@saboivan2008gmail.onmicrosoft.com',
    vaultKey: 'microsoft-tenant',
    type: 'tenant',
    environmentId: 'b2ffa450-7427-e2dd-89dd-7df6a8c0a149',
    botId: '767f155a-5b45-15fc-17b1-e4d712682945',
    servicePrincipalObjectId: 'd77169b1-e300-42da-88c3-e8df11b82604'
  },
  personal_msa: {
    id: 'personal_msa',
    name: 'Personal Microsoft Account',
    account: 'saboivan2008@gmail.com',
    vaultKey: 'microsoft-personal',
    type: 'personal'
  }
});

export const PROFILES = MICROSOFT_PROFILES;

const PROFILE_ALIASES = {
  entra_id: 'entra_id',
  tenant: 'entra_id',
  'microsoft-tenant': 'entra_id',
  'usc31@saboivan2008gmail.onmicrosoft.com': 'entra_id',
  personal_msa: 'personal_msa',
  personal: 'personal_msa',
  'microsoft-personal': 'personal_msa',
  'saboivan2008@gmail.com': 'personal_msa'
};

export const MUTATING_OPERATIONS = new Set([
  'send',
  'sendMail',
  'create',
  'createEvent',
  'upload',
  'uploadFile'
]);

export function resolveProfile(input) {
  const normalized = String(input || '').toLowerCase().trim();
  const targetKey = PROFILE_ALIASES[normalized];
  if (!targetKey || !MICROSOFT_PROFILES[targetKey]) {
    throw new Error(`Neznámy Microsoft profil: "${input}". Povolené profily: "entra_id", "personal_msa".`);
  }
  return MICROSOFT_PROFILES[targetKey];
}

export function isMutatingGraphOperation(service, operation) {
  return MUTATING_OPERATIONS.has(operation);
}

export async function executeGraphOperation({
  profile,
  service,
  operation,
  parameters = {},
  vault,
  env = 'development',
  fetcher = fetch,
  cloud = null
}) {
  const prof = resolveProfile(profile);
  const normalizedService = String(service || '').toLowerCase().trim();
  const normalizedOp = String(operation || '').trim();

  if (!['mail', 'calendar', 'storage'].includes(normalizedService)) {
    throw new Error(`Nepodporovaná Graph služba: "${service}". Povolené služby: "mail", "calendar", "storage".`);
  }

  // ── 1. GUARDED ACTION INTERCEPTION FOR MUTATING OPERATIONS ──
  if (isMutatingGraphOperation(normalizedService, normalizedOp)) {
    const actionId = crypto.randomUUID();
    let actionType = 'write';
    let target = 'unknown';

    if (normalizedService === 'mail') {
      actionType = 'share';
      const toVal = parameters.to || parameters.recipient;
      target = Array.isArray(toVal) ? toVal[0] || 'recipient' : (toVal || 'recipient');
    } else if (normalizedService === 'calendar') {
      actionType = 'write';
      target = parameters.subject || parameters.title || 'event';
    } else if (normalizedService === 'storage') {
      actionType = 'upload';
      target = parameters.path || parameters.fileName || parameters.filename || 'file';
    }

    const rationale = `Microsoft Graph (${prof.account}): ${normalizedService}.${normalizedOp} cieľ: ${target}`;
    const payload = {
      profile: prof.id,
      account: prof.account,
      service: normalizedService,
      operation: normalizedOp,
      ...parameters,
      parameters,
      intercepted_at: new Date().toISOString()
    };

    const proposal = {
      id: actionId,
      action: actionType,
      target,
      payload,
      rationale,
      status: 'proposed',
      approval: true,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60_000).toISOString()
    };

    // Forward proposal to Cloudflare ops_system_actions if cloud link is available
    if (cloud && typeof cloud.call === 'function') {
      try {
        await cloud.call('request_project_action', {
          action: actionType,
          payload,
          rationale
        });
      } catch (_e) {
        // Local proposal remains preserved even if cloud synchronization is offline
      }
    }

    return {
      ok: true,
      success: true,
      approval: true,
      status: 'proposed',
      id: actionId,
      action_id: actionId,
      action: actionType,
      target,
      rationale,
      payload,
      proposal,
      message: `Operácia ${normalizedService}.${normalizedOp} vyžaduje výslovné schválenie majiteľa (Guarded Action). Navrhnutá akcia ID: ${actionId}`
    };
  }

  // ── 2. READ OPERATIONS (APPROVAL: FALSE) ──
  if (!vault || typeof vault.get !== 'function') {
    throw new Error('Chýba vault pre overenie Microsoft poverenia.');
  }

  const rawSecret = await vault.get(prof.vaultKey);
  if (!rawSecret || !rawSecret.trim()) {
    throw new Error(`Poverenie (kľúč/token) pre profil ${prof.name} (${prof.account}) nie je nastavené vo Windows DPAPI úložisku.`);
  }

  let accessToken = rawSecret.trim();
  if (rawSecret.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawSecret);
      accessToken = parsed.token || parsed.accessToken || parsed.access_token || rawSecret;
    } catch (_e) {
      accessToken = rawSecret.trim();
    }
  }

  let endpoint = '';
  if (normalizedService === 'mail') {
    const top = Number(parameters.top) || 10;
    endpoint = `https://graph.microsoft.com/v1.0/me/messages?$top=${top}&$select=id,subject,from,receivedDateTime,bodyPreview,isRead`;
  } else if (normalizedService === 'calendar') {
    const top = Number(parameters.top) || 10;
    endpoint = `https://graph.microsoft.com/v1.0/me/calendar/events?$top=${top}&$select=id,subject,start,end,location,attendees,organizer`;
  } else if (normalizedService === 'storage') {
    const top = Number(parameters.top) || 20;
    const pathPart = parameters.path ? `/root:/${encodeURIComponent(parameters.path)}:/children` : '/root/children';
    endpoint = `https://graph.microsoft.com/v1.0/me/drive${pathPart}?$top=${top}&$select=id,name,size,webUrl,folder,file,lastModifiedDateTime`;
  }

  const response = await fetcher(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(15000),
    redirect: 'error'
  });

  let data;
  if (response && response.body) {
    data = await boundedJSON(response);
  } else if (response && typeof response.json === 'function') {
    data = await response.json();
  } else {
    data = response;
  }

  return {
    ok: true,
    success: true,
    approval: false,
    profile: prof.id,
    account: prof.account,
    service: normalizedService,
    operation: normalizedOp,
    data: data.value || data
  };
}

export async function checkMicrosoftHealth({ vault }) {
  let tenantKey = '';
  let personalKey = '';
  let copilotKey = '';

  if (vault && typeof vault.get === 'function') {
    try { tenantKey = (await vault.get('microsoft-tenant')) || ''; } catch (_e) {}
    try { personalKey = (await vault.get('microsoft-personal')) || ''; } catch (_e) {}
    try { copilotKey = (await vault.get('copilot-studio')) || ''; } catch (_e) {}
  }

  const tenantConfigured = typeof tenantKey === 'string' && tenantKey.trim().length > 0;
  const personalConfigured = typeof personalKey === 'string' && personalKey.trim().length > 0;
  const copilotConfigured = typeof copilotKey === 'string' && copilotKey.trim().length > 0;

  let status = 'needs_configuration';
  if (tenantConfigured && personalConfigured && copilotConfigured) {
    status = 'healthy';
  } else if (tenantConfigured || personalConfigured || copilotConfigured) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    tenant: {
      account: 'usc31@saboivan2008gmail.onmicrosoft.com',
      status: tenantConfigured ? 'configured' : 'not_configured'
    },
    personal: {
      account: 'saboivan2008@gmail.com',
      status: personalConfigured ? 'configured' : 'not_configured'
    },
    copilotStudio: {
      botId: '767f155a-5b45-15fc-17b1-e4d712682945',
      status: copilotConfigured ? 'active' : 'needs_configuration'
    },
    guardedActionPolicy: {
      enforced: true,
      writeOperationsBlockedWithoutApproval: true
    }
  };
}
