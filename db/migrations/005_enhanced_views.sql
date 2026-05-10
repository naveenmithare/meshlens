-- Enhanced views for three-tier product architecture

DROP VIEW IF EXISTS v_mesh_overview;
CREATE VIEW v_mesh_overview AS
SELECT
  (SELECT COUNT(*) FROM domain) AS domain_count,
  (SELECT COUNT(*) FROM application) AS app_count,
  (SELECT COUNT(*) FROM data_product) AS product_count,
  (SELECT COUNT(*) FROM data_product WHERE product_type = 'SOURCE_ALIGNED') AS source_products,
  (SELECT COUNT(*) FROM data_product WHERE product_type = 'BUSINESS') AS business_products,
  (SELECT COUNT(*) FROM data_product WHERE product_type = 'CONSUMER_ALIGNED') AS consumer_products,
  (SELECT COUNT(*) FROM connection) AS connection_count,
  (SELECT COUNT(*) FROM connection WHERE status = 'ACTIVE') AS active_connections,
  (SELECT COUNT(*) FROM connection WHERE status = 'BROKEN') AS broken_connections,
  (SELECT COUNT(*) FROM lineage_edge) AS lineage_edges,
  (SELECT COUNT(*) FROM data_product_consumer) AS total_consumers,
  (SELECT ROUND(AVG(CASE WHEN ph.status = 'HEALTHY' THEN 1.0 ELSE 0.0 END) * 100, 1)
   FROM pipeline_health ph
   WHERE ph.measured_at = (SELECT MAX(measured_at) FROM pipeline_health ph2 WHERE ph2.connection_id = ph.connection_id)
  ) AS overall_health_pct,
  (SELECT ROUND(SUM(monthly_cost_usd), 0) FROM connection WHERE status != 'PAUSED') AS total_monthly_cost_usd,
  (SELECT COUNT(*) FROM sla_breach WHERE resolved_at IS NULL) AS open_sla_breaches;

DROP VIEW IF EXISTS v_domain_health;
CREATE VIEW v_domain_health AS
SELECT
  d.id AS domain_id,
  d.name AS domain_name,
  d.color_hex,
  d.owner_team,
  COUNT(DISTINCT a.id) AS app_count,
  COUNT(DISTINCT c.id) AS connection_count,
  COUNT(DISTINCT dp.id) AS product_count,
  SUM(CASE WHEN dp.product_type = 'SOURCE_ALIGNED' THEN 1 ELSE 0 END) AS source_products,
  SUM(CASE WHEN dp.product_type = 'BUSINESS' THEN 1 ELSE 0 END) AS business_products,
  SUM(CASE WHEN dp.product_type = 'CONSUMER_ALIGNED' THEN 1 ELSE 0 END) AS consumer_products,
  SUM(CASE WHEN ph.status = 'HEALTHY' THEN 1 ELSE 0 END) AS healthy_count,
  SUM(CASE WHEN ph.status = 'DEGRADED' THEN 1 ELSE 0 END) AS degraded_count,
  SUM(CASE WHEN ph.status = 'DOWN' THEN 1 ELSE 0 END) AS down_count,
  ROUND(AVG(dp.quality_score), 2) AS avg_quality_score,
  ROUND(SUM(c.monthly_cost_usd), 0) AS monthly_cost_usd
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

DROP VIEW IF EXISTS v_lineage_graph;
CREATE VIEW v_lineage_graph AS
SELECT
  'product' AS node_type,
  dp.id AS node_id,
  dp.name AS node_label,
  dp.tier,
  dp.quality_score,
  dp.product_type,
  d.id AS domain_id,
  d.name AS domain_name,
  d.color_hex,
  NULL AS source_id,
  NULL AS target_id,
  NULL AS edge_type,
  NULL AS edge_desc
FROM data_product dp
JOIN domain d ON d.id = dp.domain_id
UNION ALL
SELECT
  'edge' AS node_type,
  le.id AS node_id,
  le.description AS node_label,
  NULL AS tier,
  NULL AS quality_score,
  NULL AS product_type,
  NULL AS domain_id,
  NULL AS domain_name,
  NULL AS color_hex,
  le.source_product_id AS source_id,
  le.target_product_id AS target_id,
  le.edge_type,
  le.description AS edge_desc
FROM lineage_edge le;

DROP VIEW IF EXISTS v_exec_kpis;
CREATE VIEW v_exec_kpis AS
SELECT
  (SELECT COUNT(*) FROM connection) AS total_pipelines,
  (SELECT COUNT(*) FROM connection WHERE status = 'ACTIVE') AS active_pipelines,
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
  (SELECT COUNT(*) FROM domain) AS total_domains,
  (SELECT ROUND(SUM(monthly_cost_usd), 0) FROM connection WHERE status != 'PAUSED') AS total_monthly_cost,
  (SELECT COUNT(*) FROM sla_breach WHERE resolved_at IS NULL) AS open_breaches,
  (SELECT COUNT(*) FROM sla_breach WHERE severity IN ('HIGH', 'CRITICAL') AND resolved_at IS NULL) AS critical_breaches,
  (SELECT COUNT(*) FROM data_product_consumer) AS total_consumers,
  (SELECT ROUND(AVG(quality_score) * 100, 1) FROM data_product WHERE tier = 'GOLD') AS gold_avg_quality;

-- Product flow view: for the source→business→consumer Sankey
DROP VIEW IF EXISTS v_product_flow;
CREATE VIEW v_product_flow AS
SELECT
  le.id,
  src.name AS source_name,
  src.product_type AS source_type,
  src.domain_id AS source_domain,
  sd.color_hex AS source_color,
  tgt.name AS target_name,
  tgt.product_type AS target_type,
  tgt.domain_id AS target_domain,
  td.color_hex AS target_color,
  le.edge_type
FROM lineage_edge le
JOIN data_product src ON src.id = le.source_product_id
JOIN data_product tgt ON tgt.id = le.target_product_id
JOIN domain sd ON sd.id = src.domain_id
JOIN domain td ON td.id = tgt.domain_id;

-- Failure patterns view: error rates by day-of-week and hour
DROP VIEW IF EXISTS v_failure_patterns;
CREATE VIEW v_failure_patterns AS
SELECT
  CAST(strftime('%w', measured_date) AS INTEGER) AS day_of_week,
  measured_date,
  d.name AS domain_name,
  d.color_hex,
  SUM(errors_count) AS total_errors,
  SUM(syncs_completed) AS total_syncs,
  CASE WHEN SUM(syncs_completed) > 0
    THEN ROUND(CAST(SUM(errors_count) AS REAL) / SUM(syncs_completed) * 100, 2)
    ELSE 0
  END AS error_rate_pct
FROM sync_daily_stats sds
JOIN connection c ON c.id = sds.connection_id
JOIN application a ON a.id = c.application_id
JOIN domain d ON d.id = a.domain_id
GROUP BY measured_date, d.id;
