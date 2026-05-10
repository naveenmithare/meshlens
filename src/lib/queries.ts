import { getDb } from "./db";

export function getMeshOverview() {
  return getDb().prepare("SELECT * FROM v_mesh_overview").get();
}

export function getDomainHealth() {
  return getDb().prepare("SELECT * FROM v_domain_health").all();
}

export function getExecKpis() {
  return getDb().prepare("SELECT * FROM v_exec_kpis").get();
}

export function getLineageGraph() {
  const rows = getDb().prepare("SELECT * FROM v_lineage_graph").all() as any[];
  const nodes = rows.filter((r) => r.node_type === "product").map((r) => ({
    id: r.node_id,
    label: r.node_label,
    tier: r.tier,
    qualityScore: r.quality_score,
    productType: r.product_type,
    domainId: r.domain_id,
    domainName: r.domain_name,
    color: r.color_hex,
  }));
  const edges = rows.filter((r) => r.node_type === "edge").map((r) => ({
    id: r.node_id,
    source: r.source_id,
    target: r.target_id,
    edgeType: r.edge_type,
    label: r.node_label,
  }));
  return { nodes, edges };
}

export function getPipelineStatus() {
  return getDb().prepare("SELECT * FROM v_pipeline_status").all();
}

export function getDailyVolume() {
  return getDb().prepare("SELECT * FROM v_daily_volume").all();
}

export function getDomains() {
  return getDb().prepare("SELECT * FROM domain ORDER BY name").all();
}

export function getDataProducts(domainId?: string) {
  if (domainId) {
    return getDb()
      .prepare(
        `SELECT dp.*, d.name AS domain_name, d.color_hex
         FROM data_product dp JOIN domain d ON d.id = dp.domain_id
         WHERE dp.domain_id = ? ORDER BY dp.product_type, dp.tier, dp.name`
      )
      .all(domainId);
  }
  return getDb()
    .prepare(
      `SELECT dp.*, d.name AS domain_name, d.color_hex
       FROM data_product dp JOIN domain d ON d.id = dp.domain_id
       ORDER BY dp.product_type, dp.tier, dp.name`
    )
    .all();
}

export function getRecentErrors(limit = 20) {
  return getDb()
    .prepare(
      `SELECT sl.*, c.connection_name, a.name AS app_name, d.name AS domain_name, d.color_hex
       FROM sync_log sl
       JOIN connection c ON c.id = sl.connection_id
       JOIN application a ON a.id = c.application_id
       JOIN domain d ON d.id = a.domain_id
       WHERE sl.event_type IN ('ERROR', 'WARNING')
       ORDER BY sl.started_at DESC
       LIMIT ?`
    )
    .all(limit);
}

export function getSchemaChanges(limit = 30) {
  return getDb()
    .prepare(
      `SELECT sc.*, c.connection_name, a.name AS app_name, d.name AS domain_name, d.color_hex
       FROM schema_change sc
       JOIN connection c ON c.id = sc.connection_id
       JOIN application a ON a.id = c.application_id
       JOIN domain d ON d.id = a.domain_id
       ORDER BY sc.detected_at DESC
       LIMIT ?`
    )
    .all(limit);
}

export function getGovernancePolicies() {
  return getDb()
    .prepare(
      `SELECT gp.*, d.name AS domain_name
       FROM governance_policy gp
       LEFT JOIN domain d ON d.id = gp.domain_id
       ORDER BY gp.scope, gp.name`
    )
    .all();
}

export function getConsumers() {
  return getDb()
    .prepare(
      `SELECT dpc.*, dp.name AS product_name, dp.product_type, dp.tier, d.name AS domain_name, d.color_hex
       FROM data_product_consumer dpc
       JOIN data_product dp ON dp.id = dpc.data_product_id
       JOIN domain d ON d.id = dp.domain_id
       ORDER BY dp.name`
    )
    .all();
}

export function getProductLineageSummary() {
  return getDb()
    .prepare(
      `SELECT
         tgt.id AS product_id,
         GROUP_CONCAT(DISTINCT src.name) AS source_names
       FROM lineage_edge le
       JOIN data_product src ON src.id = le.source_product_id
       JOIN data_product tgt ON tgt.id = le.target_product_id
       GROUP BY tgt.id`
    )
    .all() as { product_id: string; source_names: string }[];
}

export function getAppProductLinks() {
  return getDb()
    .prepare(
      `SELECT DISTINCT a.id AS app_id, dps.data_product_id AS product_id
       FROM data_product_source dps
       JOIN connection c ON c.id = dps.connection_id
       JOIN application a ON a.id = c.application_id
       JOIN data_product dp ON dp.id = dps.data_product_id
       WHERE dp.product_type = 'SOURCE_ALIGNED'`
    )
    .all() as { app_id: string; product_id: string }[];
}

export function getApplicationsWithConnections() {
  return getDb()
    .prepare(
      `SELECT a.id, a.name, a.app_type, a.vendor, a.description, a.environment,
              d.id AS domain_id, d.name AS domain_name, d.color_hex, d.description AS domain_description, d.owner_team,
              c.status AS conn_status, c.sync_frequency, c.monthly_cost_usd, c.rows_per_sync_avg,
              c.connector_type, dest.name AS destination_name
       FROM application a
       JOIN domain d ON d.id = a.domain_id
       JOIN connection c ON c.application_id = a.id
       JOIN destination dest ON dest.id = c.destination_id
       ORDER BY d.name, a.name`
    )
    .all();
}

