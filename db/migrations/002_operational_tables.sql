-- MeshLens Operational Tables
-- Sync logs, daily stats, health, schema changes, governance

CREATE TABLE IF NOT EXISTS sync_log (
  id              TEXT PRIMARY KEY,
  connection_id   TEXT NOT NULL REFERENCES connection(id),
  sync_id         TEXT NOT NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN ('INFO','WARNING','ERROR','SYNC_START','SYNC_END')),
  message         TEXT,
  rows_synced     INTEGER DEFAULT 0,
  bytes_synced    INTEGER DEFAULT 0,
  started_at      DATETIME,
  completed_at    DATETIME,
  duration_sec    REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sync_daily_stats (
  connection_id     TEXT NOT NULL REFERENCES connection(id),
  measured_date     DATE NOT NULL,
  syncs_completed   INTEGER DEFAULT 0,
  rows_synced       INTEGER DEFAULT 0,
  errors_count      INTEGER DEFAULT 0,
  avg_duration_sec  REAL DEFAULT 0,
  PRIMARY KEY (connection_id, measured_date)
);

CREATE TABLE IF NOT EXISTS pipeline_health (
  connection_id   TEXT NOT NULL REFERENCES connection(id),
  measured_at     DATETIME NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('HEALTHY','DEGRADED','DOWN')),
  last_success_at DATETIME,
  failure_streak  INTEGER DEFAULT 0,
  avg_latency_sec REAL DEFAULT 0,
  PRIMARY KEY (connection_id, measured_at)
);

CREATE TABLE IF NOT EXISTS schema_change (
  id              TEXT PRIMARY KEY,
  connection_id   TEXT NOT NULL REFERENCES connection(id),
  change_type     TEXT NOT NULL CHECK (change_type IN ('TABLE_ADDED','COLUMN_ADDED','COLUMN_REMOVED','TYPE_CHANGED')),
  schema_name     TEXT,
  table_name      TEXT,
  column_name     TEXT,
  detected_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS governance_policy (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  policy_type   TEXT NOT NULL CHECK (policy_type IN ('PII','RETENTION','ACCESS','QUALITY')),
  description   TEXT,
  scope         TEXT NOT NULL DEFAULT 'GLOBAL' CHECK (scope IN ('GLOBAL','DOMAIN')),
  domain_id     TEXT REFERENCES domain(id),
  enforced      BOOLEAN DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_sync_log_conn ON sync_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_time ON sync_log(started_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON sync_daily_stats(measured_date);
CREATE INDEX IF NOT EXISTS idx_health_conn ON pipeline_health(connection_id);
CREATE INDEX IF NOT EXISTS idx_schema_change_conn ON schema_change(connection_id);
