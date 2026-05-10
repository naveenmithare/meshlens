-- MeshLens Analytical Views
-- Power the dashboards and visualization layer

CREATE VIEW IF NOT EXISTS v_mesh_overview AS
SELECT
  (SELECT COUNT(*) FROM domain) AS domain_count,
  (SELECT COUNT(*) FROM application) AS app_count,
  (SELECT COUNT(*) FROM data_product) AS product_count,
  (SELECT COUNT(*) FROM connection) AS connection_count,
  (SELECT ROUND(AVG(CASE WHEN ph.status = 'HEALTHY' THEN 1.0 ELSE 0.0 END) * 100, 1)
   FROM pipeline_health ph
   WHERE ph.measured_at = (SELECT MAX(measured_at) FROM pipeline_health ph2 WHERE ph2.connection_id = ph.connection_id)
  ) AS overall_health_pct;

CREATE VIEW IF NOT EXISTS v_domain_health AS
SELECT
  d.id AS domain_id,
  d.name AS domain_name,
  d.color_hex,
  COUNT(DISTINCT a.id) AS app_count,
  COUNT(DISTINCT c.id) AS connection_count,
  SUM(CASE WHEN ph.status = 'HEALTHY' THEN 1 ELSE 0 END) AS healthy_count,
  SUM(CASE WHEN ph.status = 'DEGRADED' THEN 1 ELSE 0 END) AS degraded_count,
  SUM(CASE WHEN ph.status = 'DOWN' THEN 1 ELSE 0 END) AS down_count,
  ROUND(AVG(dp.quality_score), 2) AS avg_quality_score
FROM domain d
LEFT JOIN application a ON a.domain_id = d.id
LEFT JOIN connection c ON c.application_id = a.id
LEFT JOIN (
  SELECT ph1.connection_id, ph1.status
  FROM pipeline_health ph1
  WHERE ph1.measured_at = (SELECT MAX(ph2.measured_at) FROM pipeline_health ph2 WHERE ph2.connection_id = ph1.connection_id)
) ph ON ph.connection_id = c.id
LEFT JOIN data_product dp ON dp.domain_id = d.id
GROUP BY d.id;

CREATE VIEW IF NOT EXISTS v_lineage_graph AS
SELECT
  'product' AS node_type,
  dp.id AS node_id,
  dp.name AS node_label,
  dp.tier,
  dp.quality_score,
  d.id AS domain_id,
  d.name AS domain_name,
  d.color_hex,
  NULL AS source_id,
  NULL AS target_id,
  NULL AS edge_type
FROM data_product dp
JOIN domain d ON d.id = dp.domain_id
UNION ALL
SELECT
  'edge' AS node_type,
  le.id AS node_id,
  le.description AS node_label,
  NULL AS tier,
  NULL AS quality_score,
  NULL AS domain_id,
  NULL AS domain_name,
  NULL AS color_hex,
  le.source_product_id AS source_id,
  le.target_product_id AS target_id,
  le.edge_type
FROM lineage_edge le;

CREATE VIEW IF NOT EXISTS v_pipeline_status AS
SELECT
  c.id AS connection_id,
  c.connection_name,
  c.connector_type,
  c.status AS connection_status,
  c.sync_frequency,
  a.name AS app_name,
  a.app_type,
  d.name AS domain_name,
  d.color_hex,
  dest.name AS destination_name,
  ph.status AS health_status,
  ph.last_success_at,
  ph.failure_streak,
  ph.avg_latency_sec,
  COALESCE(err.error_count_7d, 0) AS error_count_7d
FROM connection c
JOIN application a ON a.id = c.application_id
JOIN domain d ON d.id = a.domain_id
JOIN destination dest ON dest.id = c.destination_id
LEFT JOIN (
  SELECT ph1.connection_id, ph1.status, ph1.last_success_at, ph1.failure_streak, ph1.avg_latency_sec
  FROM pipeline_health ph1
  WHERE ph1.measured_at = (SELECT MAX(ph2.measured_at) FROM pipeline_health ph2 WHERE ph2.connection_id = ph1.connection_id)
) ph ON ph.connection_id = c.id
LEFT JOIN (
  SELECT connection_id, SUM(errors_count) AS error_count_7d
  FROM sync_daily_stats
  WHERE measured_date >= DATE('now', '-7 days')
  GROUP BY connection_id
) err ON err.connection_id = c.id;

CREATE VIEW IF NOT EXISTS v_daily_volume AS
SELECT
  sds.measured_date,
  d.id AS domain_id,
  d.name AS domain_name,
  d.color_hex,
  SUM(sds.rows_synced) AS total_rows,
  SUM(sds.syncs_completed) AS total_syncs,
  SUM(sds.errors_count) AS total_errors
FROM sync_daily_stats sds
JOIN connection c ON c.id = sds.connection_id
JOIN application a ON a.id = c.application_id
JOIN domain d ON d.id = a.domain_id
GROUP BY sds.measured_date, d.id
ORDER BY sds.measured_date;

CREATE VIEW IF NOT EXISTS v_exec_kpis AS
SELECT
  (SELECT COUNT(*) FROM connection) AS total_pipelines,
  (SELECT ROUND(AVG(CASE WHEN ph.status = 'HEALTHY' THEN 1.0 ELSE 0.0 END) * 100, 1)
   FROM pipeline_health ph
   WHERE ph.measured_at = (SELECT MAX(ph2.measured_at) FROM pipeline_health ph2 WHERE ph2.connection_id = ph.connection_id)
  ) AS uptime_pct,
  (SELECT ROUND(AVG(ph.avg_latency_sec), 0)
   FROM pipeline_health ph
   WHERE ph.measured_at = (SELECT MAX(ph2.measured_at) FROM pipeline_health ph2 WHERE ph2.connection_id = ph.connection_id)
  ) AS avg_latency_sec,
  (SELECT COUNT(*) FROM data_product) AS total_products,
  (SELECT COUNT(*) FROM data_product WHERE tier = 'GOLD') AS gold_products,
  (SELECT COUNT(*) FROM data_product WHERE tier = 'SILVER') AS silver_products,
  (SELECT COUNT(*) FROM data_product WHERE tier = 'BRONZE') AS bronze_products,
  (SELECT COUNT(*) FROM domain) AS total_domains;
