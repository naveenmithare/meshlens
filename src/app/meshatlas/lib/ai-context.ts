export type BuildAiContextInput = {
  overview: unknown;
  execKpis: unknown;
  domains: any[];
  products: any[];
  apps: any[];
  productPipelineStatus: any[];
  productPipelineRuns: any[];
  selProduct: any | null;
  selApp: any | null;
  graph: { nodes: any[]; edges: any[] };
  appProductLinks: { app_id: string; product_id: string }[];
  panelTab: string;
};

/** Builds the plaintext context string sent with Ask Atlas chat requests. */
export function buildAiContextString(input: BuildAiContextInput): string {
  const {
    overview,
    execKpis,
    domains,
    products,
    apps,
    productPipelineStatus,
    productPipelineRuns,
    selProduct,
    selApp,
    graph,
    appProductLinks,
    panelTab,
  } = input;

  const parts: string[] = [];
  parts.push(`Mesh Overview: ${JSON.stringify(overview)}`);
  parts.push(`Exec KPIs: ${JSON.stringify(execKpis)}`);
  parts.push(`Domains (${domains.length}): ${JSON.stringify(domains.map((d: any) => ({ id: d.id, name: d.name, owner: d.owner_team })))}`);

  const productSummary = (products as any[]).map((p: any) => ({
    id: p.id,
    name: p.name,
    type: p.product_type,
    quality: p.quality_score,
    domain: p.domain_name,
    sla: p.sla_freshness,
  }));
  parts.push(`Data Products (${products.length}): ${JSON.stringify(productSummary)}`);

  const appSummary = (apps as any[]).map((a: any) => ({
    id: a.id,
    name: a.name,
    type: a.app_type,
    vendor: a.vendor,
    domain: a.domain_name,
    status: a.conn_status,
    cost: a.monthly_cost_usd,
  }));
  parts.push(`Applications (${(apps as any[]).length}): ${JSON.stringify(appSummary)}`);

  const appProductMap = appProductLinks
    .map(l => {
      const app = (apps as any[]).find(a => a.id === l.app_id);
      const prod = (products as any[]).find((p: any) => p.id === l.product_id);
      return app && prod ? `${app.name} (${app.conn_status}) → ${prod.name}` : null;
    })
    .filter(Boolean);
  parts.push(`App-to-Source mappings (application feeds source product): ${JSON.stringify(appProductMap)}`);

  const brokenEdges = graph.edges
    .filter((e: any) => e.edgeStatus !== "HEALTHY")
    .map((e: any) => {
      const src = graph.nodes.find((n: any) => n.id === e.source);
      const tgt = graph.nodes.find((n: any) => n.id === e.target);
      return { from: src?.label, to: tgt?.label, status: e.edgeStatus, reason: e.statusReason };
    });
  if (brokenEdges.length > 0) parts.push(`Broken/Warning lineage edges: ${JSON.stringify(brokenEdges)}`);

  const pipeRollup = (productPipelineStatus as any[])
    .filter((r: any) => r.failed > 0 || r.warning > 0)
    .map((r: any) => ({
      product: r.product_name,
      type: r.product_type,
      completed: r.completed,
      warning: r.warning,
      failed: r.failed,
      skipped: r.skipped,
      error: r.last_error,
    }));
  if (pipeRollup.length > 0) parts.push(`Products with pipeline issues: ${JSON.stringify(pipeRollup)}`);

  if (selProduct) {
    const upEdges = graph.edges
      .filter((e: any) => e.target === selProduct.id)
      .map((e: any) => {
        const src = graph.nodes.find((n: any) => n.id === e.source);
        return { name: src?.label, edgeStatus: e.edgeStatus, reason: e.statusReason };
      });
    const downEdges = graph.edges
      .filter((e: any) => e.source === selProduct.id)
      .map((e: any) => {
        const tgt = graph.nodes.find((n: any) => n.id === e.target);
        return { name: tgt?.label, edgeStatus: e.edgeStatus, reason: e.statusReason };
      });
    parts.push(
      `\nCURRENTLY SELECTED — Data Product: "${selProduct.name}" (${selProduct.product_type}, domain: ${selProduct.domain_name}, quality: ${selProduct.quality_score})`,
    );
    parts.push(`Upstream edges: ${JSON.stringify(upEdges)}`);
    parts.push(`Downstream edges: ${JSON.stringify(downEdges)}`);
    if (selProduct.description) parts.push(`Description: ${selProduct.description}`);
    const selRuns = (productPipelineRuns as any[])
      .filter((r: any) => r.data_product_id === selProduct.id)
      .map((r: any) => ({
        model: r.model_name,
        stage: r.stage,
        status: r.status,
        log: r.log_message,
        error: r.error_message,
      }));
    if (selRuns.length > 0) parts.push(`Pipeline runs for ${selProduct.name}: ${JSON.stringify(selRuns)}`);
  } else if (selApp) {
    const linkedProducts = appProductLinks
      .filter(l => l.app_id === selApp.id)
      .map(l => (products as any[]).find((p: any) => p.id === l.product_id)?.name)
      .filter(Boolean);
    parts.push(
      `\nCURRENTLY SELECTED — Application: "${selApp.name}" (type: ${selApp.app_type}, vendor: ${selApp.vendor}, domain: ${selApp.domain_name}, cost: $${selApp.monthly_cost_usd}/mo, status: ${selApp.conn_status})`,
    );
    parts.push(`This application feeds source products: [${linkedProducts.join(", ")}]`);
  } else {
    parts.push(`\nNo item currently selected on the dashboard.`);
  }
  parts.push(`Active panel tab: ${panelTab}`);
  return parts.join("\n");
}
