-- Trinity Sovereign Ledger (Single Source of Truth)
CREATE TABLE IF NOT EXISTS sovereign_ledger (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  agent TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'AGENT',
  event_type TEXT,
  type TEXT,
  status TEXT NOT NULL CHECK(status IN ('planned','running','completed','failed','acknowledged')),
  task_id TEXT,
  task TEXT,
  claim_id TEXT,
  parent_id TEXT,
  message TEXT,
  evidence TEXT,
  metadata_json TEXT,
  principal TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  input_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_sovereign_ledger_agent ON sovereign_ledger(agent, timestamp);
CREATE INDEX IF NOT EXISTS idx_sovereign_ledger_event_type ON sovereign_ledger(event_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_sovereign_ledger_type ON sovereign_ledger(type, timestamp);
CREATE INDEX IF NOT EXISTS idx_sovereign_ledger_status ON sovereign_ledger(status, timestamp);
CREATE INDEX IF NOT EXISTS idx_sovereign_ledger_task ON sovereign_ledger(task_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_sovereign_ledger_principal ON sovereign_ledger(principal, timestamp);

CREATE TRIGGER IF NOT EXISTS sovereign_ledger_no_update BEFORE UPDATE ON sovereign_ledger BEGIN SELECT RAISE(ABORT, 'sovereign_ledger is append-only'); END;

CREATE TRIGGER IF NOT EXISTS sovereign_ledger_no_delete BEFORE DELETE ON sovereign_ledger BEGIN SELECT RAISE(ABORT, 'sovereign_ledger is append-only'); END;
