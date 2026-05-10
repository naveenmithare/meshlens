/**
 * Row shapes for MeshLens SQLite views, tables, and query helpers.
 * Derived from db/migrations/*.sql and src/lib/queries.ts.
 */

/** v_mesh_overview (final: 005_enhanced_views.sql) */
export interface MeshOverviewRow {
  domain_count: number;
  app_count: number;
  product_count: number;
  source_products: number;
  business_products: number;
  consumer_products: number;
  connection_count: number;
  active_connections: number;
  broken_connections: number;
  lineage_edges: number;
  total_consumers: number;
  overall_health_pct: number | null;
  total_monthly_cost_usd: number | null;
  open_sla_breaches: number;
}

/** v_domain_health (final: 005_enhanced_views.sql) */
export interface DomainHealthRow {
  domain_id: string;
  domain_name: string;
  color_hex: string;
  owner_team: string | null;
  app_count: number;
  connection_count: number;
  product_count: number;
  source_products: number;
  business_products: number;
  consumer_products: number;
  healthy_count: number;
  degraded_count: number;
  down_count: number;
  avg_quality_score: number | null;
  monthly_cost_usd: number | null;
}

/** v_exec_kpis (final: 005_enhanced_views.sql) */
export interface ExecKpisRow {
  total_pipelines: number;
  active_pipelines: number;
  uptime_pct: number | null;
  avg_latency_sec: number | null;
  total_products: number;
  gold_products: number;
  silver_products: number;
  bronze_products: number;
  total_domains: number;
  total_monthly_cost: number | null;
  open_breaches: number;
  critical_breaches: number;
  total_consumers: number;
  gold_avg_quality: number | null;
}

/**
 * One row from v_lineage_graph (005 + lineage_edge columns from 007).
 * Product rows and edge rows are UNIONed; columns are null where not applicable.
 */
export interface LineageGraphRow {
  node_type: string;
  node_id: string;
  node_label: string | null;
  tier: string | null;
  quality_score: number | null;
  product_type: string | null;
  domain_id: string | null;
  domain_name: string | null;
  color_hex: string | null;
  source_id: string | null;
  target_id: string | null;
  edge_type: string | null;
  edge_desc: string | null;
  edge_status: string | null;
  status_reason: string | null;
}

/** Product node object returned by getLineageGraph() (only `node_type === "product"` rows) */
export interface LineageNode {
  id: string;
  label: string;
  qualityScore: number;
  productType: string;
  domainId: string;
  domainName: string;
  color: string;
}

/** Edge object returned by getLineageGraph() (edgeStatus defaults to HEALTHY when null) */
export interface LineageEdge {
  id: string;
  source: string;
  target: string;
  edgeType: string;
  label: string;
  edgeStatus: "HEALTHY" | "BROKEN" | "WARNING";
  statusReason?: string | null;
}

/** v_pipeline_status (final: 006_pipeline_status_cost.sql) */
export interface PipelineStatusRow {
  connection_id: string;
  connection_name: string;
  connector_type: string;
  connection_status: string;
  sync_frequency: string | null;
  monthly_cost_usd: number | null;
  rows_per_sync_avg: number | null;
  app_name: string;
  app_type: string;
  domain_name: string;
  color_hex: string;
  destination_name: string;
  health_status: string | null;
  last_success_at: string | null;
  failure_streak: number | null;
  avg_latency_sec: number | null;
  error_count_7d: number;
}

/**
 * getDataProducts() — data_product.* plus domain_name, color_hex.
 */
export interface DataProductRow {
  id: string;
  name: string;
  domain_id: string;
  description: string | null;
  owner: string | null;
  sla_freshness: string | null;
  quality_score: number | null;
  tier: string;
  created_at: string | null;
  product_type: string;
  domain_name: string;
  color_hex: string;
}

/** getApplicationsWithConnections() — one row per application × connection */
export interface ApplicationRow {
  id: string;
  name: string;
  app_type: string;
  vendor: string | null;
  description: string | null;
  environment: string;
  domain_id: string;
  domain_name: string;
  color_hex: string;
  domain_description: string | null;
  owner_team: string | null;
  conn_status: string;
  sync_frequency: string | null;
  monthly_cost_usd: number | null;
  rows_per_sync_avg: number | null;
  connector_type: string;
  destination_name: string;
}

/** getGovernancePolicies() — governance_policy.* plus domain_name */
export interface GovernancePolicyRow {
  id: string;
  name: string;
  policy_type: string;
  description: string | null;
  scope: string;
  domain_id: string | null;
  enforced: number | null;
  domain_name: string | null;
}

/** v_product_pipeline_status (final: 008_warning_status.sql) */
export interface ProductPipelineStatusRow {
  product_id: string;
  product_name: string;
  product_type: string;
  domain_id: string;
  domain_name: string;
  color_hex: string;
  total_runs: number;
  completed: number;
  warning: number;
  failed: number;
  running: number;
  skipped: number;
  last_error: string | null;
  last_run_at: string | null;
}

/** product_pipeline_run (final: 008_warning_status.sql) */
export interface ProductPipelineRunRow {
  id: string;
  data_product_id: string;
  run_id: string;
  stage: string;
  model_name: string;
  orchestrator: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_sec: number | null;
  rows_processed: number | null;
  log_message: string | null;
  error_message: string | null;
}

/** getRecentSyncLogs() */
export interface SyncLogRow {
  id: string;
  app_id: string;
  event_type: string;
  message: string | null;
  rows_synced: number | null;
  duration_sec: number | null;
  started_at: string | null;
  completed_at: string | null;
}

/** getConnectionHealth() */
export interface ConnectionHealthRow {
  connection_id: string;
  app_id: string;
  status: string;
  measured_at: string;
  last_success_at: string | null;
  failure_streak: number | null;
  avg_latency_sec: number | null;
}

export interface AppProductLink {
  app_id: string;
  product_id: string;
}

export interface ProductLineageSummary {
  product_id: string;
  source_names: string;
}
