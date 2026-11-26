CREATE TABLE IF NOT EXISTS ops_role_permissions (
  role TEXT NOT NULL CHECK(role IN ('owner','admin','user')),
  capability TEXT NOT NULL,
  allowed INTEGER NOT NULL DEFAULT 0 CHECK(allowed IN (0,1)),
  updated_by TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(role, capability)
);

CREATE TABLE IF NOT EXISTS ops_visual_workflows (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  definition_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ops_visual_workflows_owner
ON ops_visual_workflows(owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ops_incidents (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('info','warning','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
  title TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ops_incidents_status
ON ops_incidents(status, created_at DESC);

INSERT INTO ops_events(action,details)
VALUES('trinity_2_schema_ready','{"rbac":true,"visual_workflows":true,"incidents":true}');
