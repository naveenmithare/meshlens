import { getDb } from "./db";
import type {
  MeshOverviewRow,
  DomainHealthRow,
  ExecKpisRow,
  LineageGraphRow,
  LineageNode,
  LineageEdge,
  PipelineStatusRow,
  DataProductRow,
  ApplicationRow,
  GovernancePolicyRow,
  ProductPipelineStatusRow,
  ProductPipelineRunRow,
  SyncLogRow,
  ConnectionHealthRow,
  AppProductLink,
  ProductLineageSummary,
} from "./db-types";

export function getMeshOverview(): MeshOverviewRow | undefined {
  return getDb().prepare("SELECT * FROM v_mesh_overview").get() as MeshOverviewRow | undefined;
}

export function getDomainHealth(): DomainHealthRow[] {
  return getDb().prepare("SELECT * FROM v_domain_health").all() as DomainHealthRow[];
}

export function getExecKpis(): ExecKpisRow | undefined {
  return getDb().prepare("SELECT * FROM v_exec_kpis").get() as ExecKpisRow | undefined;
}

export function getLineageGraph(): { nodes: LineageNode[]; edges: LineageEdge[] } {
  const rows = getDb().prepare("SELECT * FROM v_lineage_graph").all() as LineageGraphRow[];
  const nodes: LineageNode[] = rows
    .filter((r) => r.node_type === "product")
    .map((r) => ({
      id: r.node_id,
      label: r.node_label ?? "",
      qualityScore: r.quality_score ?? 0,
      productType: r.product_type ?? "",
      domainId: r.domain_id ?? "",
      domainName: r.domain_name ?? "",
      color: r.color_hex ?? "",
    }));
  const edges: LineageEdge[] = rows
    .filter((r) => r.node_type === "edge")
    .map((r) => ({
      id: r.node_id,
      source: r.source_id ?? "",
      target: r.target_id ?? "",
      edgeType: r.edge_type ?? "",
      label: r.node_label ?? "",
      edgeStatus: (r.edge_status || "HEALTHY") as "HEALTHY" | "BROKEN" | "WARNING",
      statusReason: r.status_reason || null,
    }));
  return { nodes, edges };
}

export function getPipelineStatus(): PipelineStatusRow[] {
  return getDb().prepare("SELECT * FROM v_pipeline_status").all() as PipelineStatusRow[];
}

export function getDailyVolume() {
  return getDb().prepare("SELECT * FROM v_daily_volume").all();
}

export function getDomains() {
  return getDb().prepare("SELECT * FROM domain ORDER BY name").all();
}

export function getDataProducts(domainId?: string): DataProductRow[] {
  if (domainId) {
    return getDb()
      .prepare(
        `SELECT dp.*, d.name AS domain_name, d.color_hex
         FROM data_product dp JOIN domain d ON d.id = dp.domain_id
         WHERE dp.domain_id = ? ORDER BY dp.product_type, dp.name`
      )
      .all(domainId) as DataProductRow[];
  }
  return getDb()
    .prepare(
      `SELECT dp.*, d.name AS domain_name, d.color_hex
       FROM data_product dp JOIN domain d ON d.id = dp.domain_id
       ORDER BY dp.product_type, dp.name`
    )
    .all() as DataProductRow[];
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

export function getGovernancePolicies(): GovernancePolicyRow[] {
  return getDb()
    .prepare(
      `SELECT gp.*, d.name AS domain_name
       FROM governance_policy gp
       LEFT JOIN domain d ON d.id = gp.domain_id
       ORDER BY gp.scope, gp.name`
    )
    .all() as GovernancePolicyRow[];
}

export function getProductLineageSummary(): ProductLineageSummary[] {
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
    .all() as ProductLineageSummary[];
}

export function getAppProductLinks(): AppProductLink[] {
  return getDb()
    .prepare(
      `SELECT DISTINCT a.id AS app_id, dps.data_product_id AS product_id
       FROM data_product_source dps
       JOIN connection c ON c.id = dps.connection_id
       JOIN application a ON a.id = c.application_id
       JOIN data_product dp ON dp.id = dps.data_product_id
       WHERE dp.product_type = 'SOURCE_ALIGNED'`
    )
    .all() as AppProductLink[];
}

export function getApplicationsWithConnections(): ApplicationRow[] {
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
    .all() as ApplicationRow[];
}

export function getProductPipelineStatus(): ProductPipelineStatusRow[] {
  return getDb().prepare("SELECT * FROM v_product_pipeline_status").all() as ProductPipelineStatusRow[];
}

export function getProductPipelineLogs(productId: string): ProductPipelineRunRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM product_pipeline_run
       WHERE data_product_id = ?
       ORDER BY started_at DESC`
    )
    .all(productId) as ProductPipelineRunRow[];
}

export function getAllProductPipelineRuns(): ProductPipelineRunRow[] {
  return getDb()
    .prepare("SELECT * FROM product_pipeline_run ORDER BY data_product_id, started_at")
    .all() as ProductPipelineRunRow[];
}

export function getRecentSyncLogs(): SyncLogRow[] {
  return getDb()
    .prepare(
      `SELECT sl.id, c.application_id AS app_id, sl.event_type, sl.message,
              sl.rows_synced, sl.duration_sec, sl.started_at, sl.completed_at
       FROM sync_log sl
       JOIN connection c ON c.id = sl.connection_id
       ORDER BY sl.started_at DESC`
    )
    .all() as SyncLogRow[];
}

export function getConnectionHealth(): ConnectionHealthRow[] {
  return getDb()
    .prepare(
      `SELECT ph.connection_id, c.application_id AS app_id,
              ph.status, ph.measured_at, ph.last_success_at,
              ph.failure_streak, ph.avg_latency_sec
       FROM pipeline_health ph
       JOIN connection c ON c.id = ph.connection_id
       ORDER BY ph.measured_at DESC`
    )
    .all() as ConnectionHealthRow[];
}
