-- Update pipeline status view to include cost
DROP VIEW IF EXISTS v_pipeline_status;
CREATE VIEW v_pipeline_status AS
SELECT
  c.id AS connection_id,
  c.connection_name,
  c.connector_type,
  c.status AS connection_status,
  c.sync_frequency,
  c.monthly_cost_usd,
  c.rows_per_sync_avg,
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
