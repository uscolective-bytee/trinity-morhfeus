-- Owner/session-bound, short-lived, one-use OAuth transactions.
CREATE TABLE IF NOT EXISTS meta_oauth_transactions (
 state_hash TEXT PRIMARY KEY, owner_id TEXT NOT NULL, session_hash TEXT NOT NULL,
 redirect_uri TEXT NOT NULL, config_hash TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS meta_connections (
 owner_id TEXT PRIMARY KEY, secret_id TEXT NOT NULL, account_id TEXT NOT NULL,
 config_hash TEXT NOT NULL,
 account_name TEXT NOT NULL, scopes_json TEXT NOT NULL, pages_json TEXT NOT NULL,
 expires_at INTEGER, verified_at INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'connected_read_only'
);
