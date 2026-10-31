CREATE TABLE IF NOT EXISTS core_agent_runs (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  input_hash TEXT NOT NULL,
  trace_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  context_json TEXT NOT NULL DEFAULT '{}',
  max_steps INTEGER NOT NULL DEFAULT 4 CHECK(max_steps BETWEEN 1 AND 5),
  status TEXT NOT NULL CHECK(status IN ('running','completed','failed')),
  answer TEXT,
  error TEXT,
  model TEXT,
  usage_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS core_tool_receipts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES core_agent_runs(id) ON DELETE CASCADE,
  step INTEGER NOT NULL,
  tool TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('completed','failed')),
  receipt_id TEXT NOT NULL UNIQUE,
  input_json TEXT NOT NULL,
  output_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(run_id,step)
);

CREATE INDEX IF NOT EXISTS idx_core_tool_receipts_run ON core_tool_receipts(run_id,step);

CREATE TABLE IF NOT EXISTS core_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS core_personality (
  trait TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS core_thoughts (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  output TEXT NOT NULL,
  model TEXT NOT NULL,
  usage_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS core_reflections (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  insight TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS core_brain_state (
  component TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  last_active TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
