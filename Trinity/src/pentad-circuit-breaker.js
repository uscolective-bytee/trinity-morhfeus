const DEFAULTS = Object.freeze({
  failureThreshold: 3,
  openMs: 60_000,
  timeoutMs: 15_000,
  stateTtlSeconds: 86_400
});

const safeProviderName = value => {
  const name = String(value || '').toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(name)) throw new TypeError('Invalid provider name.');
  return name;
};

const initialState = provider => ({
  provider,
  status: 'closed',
  failures: 0,
  opened_at: null,
  retry_at: null,
  updated_at: null
});

const normalizeState = (provider, value) => {
  if (!value || typeof value !== 'object') return initialState(provider);
  return {
    provider,
    status: ['closed', 'open', 'half-open'].includes(value.status) ? value.status : 'closed',
    failures: Math.max(0, Number(value.failures) || 0),
    opened_at: Number.isFinite(Number(value.opened_at)) ? Number(value.opened_at) : null,
    retry_at: Number.isFinite(Number(value.retry_at)) ? Number(value.retry_at) : null,
    updated_at: Number.isFinite(Number(value.updated_at)) ? Number(value.updated_at) : null
  };
};

const stateKey = provider => `circuit:v1:${safeProviderName(provider)}`;

async function readState(store, provider) {
  if (!store?.get) return initialState(provider);
  const value = await store.get(stateKey(provider), {type: 'json'}).catch(() => null);
  return normalizeState(provider, value);
}

async function writeState(store, state, ttlSeconds) {
  if (!store?.put) return;
  await store.put(stateKey(state.provider), JSON.stringify(state), {
    expirationTtl: ttlSeconds
  });
}

function sanitizedFailure(error) {
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return 'timeout';
  return 'provider-error';
}

export async function executeWithCircuitBreaker({
  provider,
  invoke,
  store,
  now = () => Date.now(),
  failureThreshold = DEFAULTS.failureThreshold,
  openMs = DEFAULTS.openMs,
  timeoutMs = DEFAULTS.timeoutMs,
  stateTtlSeconds = DEFAULTS.stateTtlSeconds
}) {
  const name = safeProviderName(provider);
  if (typeof invoke !== 'function') throw new TypeError('Provider invoke function is required.');
  if (!Number.isInteger(failureThreshold) || failureThreshold < 1) throw new TypeError('failureThreshold must be a positive integer.');
  if (!Number.isFinite(openMs) || openMs < 1 || !Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new TypeError('Circuit timings must be positive numbers.');
  }

  const startedAt = now();
  const previous = await readState(store, name);
  if (previous.status === 'open' && previous.retry_at && startedAt < previous.retry_at) {
    return {
      ok: false,
      provider: name,
      skipped: true,
      reason: 'circuit-open',
      retry_at: previous.retry_at,
      elapsed_ms: 0
    };
  }

  const probe = previous.status === 'open' || previous.status === 'half-open';
  if (probe) {
    await writeState(store, {...previous, status: 'half-open', updated_at: startedAt}, stateTtlSeconds);
  }

  try {
    const signal = AbortSignal.timeout(timeoutMs);
    const value = await invoke({signal, provider: name, probe});
    if (value === undefined || value === null) throw new Error('Provider returned no value.');
    const completedAt = now();
    await writeState(store, {
      ...initialState(name),
      updated_at: completedAt
    }, stateTtlSeconds);
    return {
      ok: true,
      provider: name,
      skipped: false,
      value,
      elapsed_ms: Math.max(0, completedAt - startedAt)
    };
  } catch (error) {
    const completedAt = now();
    const failures = previous.failures + 1;
    const shouldOpen = probe || failures >= failureThreshold;
    const next = {
      provider: name,
      status: shouldOpen ? 'open' : 'closed',
      failures,
      opened_at: shouldOpen ? completedAt : null,
      retry_at: shouldOpen ? completedAt + openMs : null,
      updated_at: completedAt
    };
    await writeState(store, next, stateTtlSeconds);
    return {
      ok: false,
      provider: name,
      skipped: false,
      reason: sanitizedFailure(error),
      retry_at: next.retry_at,
      elapsed_ms: Math.max(0, completedAt - startedAt)
    };
  }
}

export async function routeWithCircuitBreakers({
  order,
  providers,
  store,
  options = {}
}) {
  if (!Array.isArray(order) || order.length === 0) throw new TypeError('Provider order is required.');
  const attempts = [];
  for (const provider of order) {
    const name = safeProviderName(provider);
    const invoke = providers?.[name];
    if (typeof invoke !== 'function') {
      attempts.push({provider: name, ok: false, skipped: true, reason: 'not-configured'});
      continue;
    }
    const result = await executeWithCircuitBreaker({provider: name, invoke, store, ...options});
    attempts.push({...result, value: undefined});
    if (result.ok) return {ok: true, provider: name, value: result.value, attempts};
  }
  return {ok: false, provider: null, value: null, attempts};
}
