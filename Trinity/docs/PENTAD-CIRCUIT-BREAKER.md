# Pentad circuit breaker

`src/pentad-circuit-breaker.js` is an integration-ready but currently unconnected provider guard. It does not change the active chat router.

## Routing contract

- Trinity chooses an ordered list of allowed providers.
- Each provider call has a bounded timeout and receives an `AbortSignal`.
- Three consecutive failures open the circuit for 60 seconds by default.
- During cooldown the provider is skipped without spending provider tokens.
- The first call after cooldown is a half-open probe. Success closes the circuit; failure reopens it.
- State keys are versioned as `circuit:v1:<provider>` and may be stored in an explicitly selected KV namespace.
- Returned failures contain only normalized reasons (`timeout`, `provider-error`, `circuit-open`); provider bodies, credentials and URLs are never persisted.

## Integration requirements

Before importing this module into `engine.js` or `services.js`, Antigravity must choose the exact KV binding, document ownership and TTL, and add provider-specific regression tests. Do not use the content cache as the circuit state store. Do not treat a closed circuit as proof that a provider account or personal chat is connected.

Recommended automatic order is `edge -> configured owner provider`; an explicit owner selection may put Gemini or Copilot first, but Workers AI remains the truthful fallback. Copilot must call the existing `copilotStudioAsk` adapter and return its real response or error, not a synthetic “accepted” sentence.
