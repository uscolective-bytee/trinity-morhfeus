-- Trinity Sovereign Ledger v3, Truth Assertion & State Replay
-- Epics: EP-14 (Ledger v3), EP-15 (Truth Assertion), EP-16 (Provenance), EP-17 (Replay)

-- 1. Sovereign Ledger v3 (Cryptographically Chained, Append-Only)
CREATE TABLE IF NOT EXISTS ops_sovereign_ledger_v3 (
  block_index INTEGER PRIMARY KEY,
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  block_hash TEXT NOT NULL UNIQUE,
  rollback_ref TEXT,
  receipt TEXT NOT NULL,
  payload_json TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_slv3_actor ON ops_sovereign_ledger_v3(actor, timestamp);
CREATE INDEX IF NOT EXISTS idx_slv3_action ON ops_sovereign_ledger_v3(action, timestamp);
CREATE INDEX IF NOT EXISTS idx_slv3_block_hash ON ops_sovereign_ledger_v3(block_hash);

CREATE TRIGGER IF NOT EXISTS slv3_no_update BEFORE UPDATE ON ops_sovereign_ledger_v3 BEGIN SELECT RAISE(ABORT, 'ops_sovereign_ledger_v3 is strictly append-only'); END;

CREATE TRIGGER IF NOT EXISTS slv3_no_delete BEFORE DELETE ON ops_sovereign_ledger_v3 BEGIN SELECT RAISE(ABORT, 'ops_sovereign_ledger_v3 is strictly append-only'); END;

-- 2. Truth Assertions (Verifiable Execution Proofs)
CREATE TABLE IF NOT EXISTS ops_truth_assertions (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  evidence_receipt TEXT NOT NULL,
  exit_code INTEGER,
  stdout_hash TEXT,
  stderr_hash TEXT,
  block_hash TEXT,
  verified_at TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_truth_action ON ops_truth_assertions(action, verified_at);

-- 3. Code Provenance Tracking
CREATE TABLE IF NOT EXISTS ops_code_provenance (
  provenance_hash TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  git_commit_sha TEXT NOT NULL,
  author_did TEXT NOT NULL,
  reason TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  machine_fingerprint TEXT NOT NULL,
  ast_hash TEXT,
  recorded_at TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_prov_file ON ops_code_provenance(file_path, git_commit_sha);

-- 4. State Replay & Deterministic Verification
CREATE TABLE IF NOT EXISTS ops_state_replay (
  execution_id TEXT PRIMARY KEY,
  captured_at TEXT NOT NULL,
  state_snapshot_json TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  result_hash TEXT NOT NULL,
  provenance_hash TEXT,
  receipt TEXT NOT NULL,
  replayed_at TEXT,
  replay_match INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_replay_exec ON ops_state_replay(execution_id);

-- 5. Durable Atomic Nonce Store (Anti-Replay for Ring 0 Consent Envelopes)
CREATE TABLE IF NOT EXISTS ops_consumed_nonces (
  nonce TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  operation TEXT NOT NULL,
  diff_sha256 TEXT NOT NULL,
  consumed_at TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TRIGGER IF NOT EXISTS nonces_no_update BEFORE UPDATE ON ops_consumed_nonces BEGIN SELECT RAISE(ABORT, 'ops_consumed_nonces is strictly immutable'); END;

CREATE TRIGGER IF NOT EXISTS nonces_no_delete BEFORE DELETE ON ops_consumed_nonces BEGIN SELECT RAISE(ABORT, 'ops_consumed_nonces is strictly append-only'); END;

