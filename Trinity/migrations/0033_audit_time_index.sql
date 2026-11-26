-- Existing repo/time composite index already supports repository filtering.
-- The existing SHA index supports commit lookup. Use the actual ISO time column.
CREATE INDEX IF NOT EXISTS idx_ops_ci_audit_ts ON ops_ci_audit_log(ts DESC);
