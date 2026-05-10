-- Add pipeline failure cascade: edge_status on lineage_edge + product_pipeline_run table

ALTER TABLE lineage_edge ADD COLUMN edge_status TEXT NOT NULL DEFAULT 'HEALTHY'
  CHECK (edge_status IN ('HEALTHY','BROKEN','WARNING'));
ALTER TABLE lineage_edge ADD COLUMN status_reason TEXT;

-- Orchestration DAG runs for every data product (replaces synthetic client-side generation)
CREATE TABLE IF NOT EXISTS product_pipeline_run (
  id              TEXT PRIMARY KEY,
  data_product_id TEXT NOT NULL REFERENCES data_product(id),
  run_id          TEXT NOT NULL,
  stage           TEXT NOT NULL CHECK (stage IN ('CONNECTOR','STAGING','MART')),
  model_name      TEXT NOT NULL,
  orchestrator    TEXT NOT NULL DEFAULT 'airflow' CHECK (orchestrator IN ('airflow','prefect','dbt','spark','custom')),
  status          TEXT NOT NULL CHECK (status IN ('COMPLETED','FAILED','RUNNING','SKIPPED')),
  started_at      DATETIME,
  completed_at    DATETIME,
  duration_sec    REAL DEFAULT 0,
  rows_processed  INTEGER DEFAULT 0,
  log_message     TEXT,
  error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_ppr_product ON product_pipeline_run(data_product_id);
CREATE INDEX IF NOT EXISTS idx_ppr_status ON product_pipeline_run(status);

-- Rollup view: per-product pipeline status
CREATE VIEW IF NOT EXISTS v_product_pipeline_status AS
SELECT
  dp.id AS product_id,
  dp.name AS product_name,
  dp.product_type,
  dp.domain_id,
  d.name AS domain_name,
  d.color_hex,
  COUNT(ppr.id) AS total_runs,
  SUM(CASE WHEN ppr.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
  SUM(CASE WHEN ppr.status = 'FAILED' THEN 1 ELSE 0 END) AS failed,
  SUM(CASE WHEN ppr.status = 'RUNNING' THEN 1 ELSE 0 END) AS running,
  SUM(CASE WHEN ppr.status = 'SKIPPED' THEN 1 ELSE 0 END) AS skipped,
  MAX(CASE WHEN ppr.status = 'FAILED' THEN ppr.error_message END) AS last_error,
  MAX(ppr.started_at) AS last_run_at
FROM data_product dp
JOIN domain d ON d.id = dp.domain_id
LEFT JOIN product_pipeline_run ppr ON ppr.data_product_id = dp.id
GROUP BY dp.id;
