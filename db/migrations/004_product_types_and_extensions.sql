-- Add product_type to data_product: SOURCE_ALIGNED, BUSINESS, CONSUMER_ALIGNED
ALTER TABLE data_product ADD COLUMN product_type TEXT NOT NULL DEFAULT 'SOURCE_ALIGNED' CHECK (product_type IN ('SOURCE_ALIGNED','BUSINESS','CONSUMER_ALIGNED'));

-- Add consumers table to track who uses consumer-aligned products
CREATE TABLE IF NOT EXISTS data_product_consumer (
  id              TEXT PRIMARY KEY,
  data_product_id TEXT NOT NULL REFERENCES data_product(id),
  consumer_name   TEXT NOT NULL,
  consumer_type   TEXT NOT NULL CHECK (consumer_type IN ('DASHBOARD','ML_MODEL','API','REPORT','APPLICATION','NOTEBOOK')),
  team            TEXT,
  access_frequency TEXT DEFAULT 'DAILY' CHECK (access_frequency IN ('REALTIME','HOURLY','DAILY','WEEKLY','MONTHLY')),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add cost tracking to connections
ALTER TABLE connection ADD COLUMN monthly_cost_usd REAL DEFAULT 0;
ALTER TABLE connection ADD COLUMN rows_per_sync_avg INTEGER DEFAULT 0;

-- Add SLA breach tracking
CREATE TABLE IF NOT EXISTS sla_breach (
  id              TEXT PRIMARY KEY,
  data_product_id TEXT NOT NULL REFERENCES data_product(id),
  breach_type     TEXT NOT NULL CHECK (breach_type IN ('FRESHNESS','QUALITY','AVAILABILITY')),
  expected_value  TEXT,
  actual_value    TEXT,
  detected_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at     DATETIME,
  severity        TEXT DEFAULT 'MEDIUM' CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_consumer_dp ON data_product_consumer(data_product_id);
CREATE INDEX IF NOT EXISTS idx_sla_dp ON sla_breach(data_product_id);
CREATE INDEX IF NOT EXISTS idx_sla_time ON sla_breach(detected_at);
