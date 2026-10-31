-- Durable D1 audit ledger/outbox. Delivery remains pending until a real Queue consumer acknowledges it.
CREATE TABLE IF NOT EXISTS sovereign_events (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK(delivery_status IN ('pending','delivered','failed')),
  idempotency_key TEXT NOT NULL UNIQUE,
  occurred_at INTEGER NOT NULL,
  delivered_at INTEGER,
  error TEXT
);
CREATE INDEX IF NOT EXISTS idx_sovereign_events_pending ON sovereign_events(delivery_status,occurred_at);
CREATE INDEX IF NOT EXISTS idx_sovereign_events_aggregate ON sovereign_events(aggregate_type,aggregate_id,occurred_at);
