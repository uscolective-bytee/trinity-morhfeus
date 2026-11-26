-- 0047_vault_providers_expansion.sql
-- Allow all modern AI and cloud providers in ops_secret_vault and ops_ai_provider_settings
PRAGMA foreign_keys = OFF;

CREATE TABLE ops_secret_vault_new (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  secret_ciphertext TEXT NOT NULL,
  secret_iv TEXT NOT NULL,
  secret_hint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stored' CHECK(status IN ('stored','verified','failed','revoked')),
  verification_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_verified_at TEXT,
  revoked_at TEXT,
  UNIQUE(owner_id,provider,name)
);

INSERT INTO ops_secret_vault_new SELECT * FROM ops_secret_vault;
DROP TABLE ops_secret_vault;
ALTER TABLE ops_secret_vault_new RENAME TO ops_secret_vault;
CREATE INDEX IF NOT EXISTS idx_secret_vault_owner ON ops_secret_vault(owner_id,created_at DESC);

CREATE TABLE ops_ai_provider_settings_new (
  owner_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  secret_id TEXT NOT NULL,
  model TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  project_control INTEGER NOT NULL DEFAULT 0 CHECK(project_control IN (0,1)),
  PRIMARY KEY(owner_id,provider),
  FOREIGN KEY(secret_id) REFERENCES ops_secret_vault(id)
);

INSERT INTO ops_ai_provider_settings_new SELECT * FROM ops_ai_provider_settings;
DROP TABLE ops_ai_provider_settings;
ALTER TABLE ops_ai_provider_settings_new RENAME TO ops_ai_provider_settings;

PRAGMA foreign_keys = ON;
