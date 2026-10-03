import {
  getLineageGraph,
  getMeshOverview,
  getDomainHealth,
  getApplicationsWithConnections,
  getDataProducts,
  getGovernancePolicies,
  getExecKpis,
  getAppProductLinks,
  getPipelineStatus,
  getProductPipelineStatus,
  getAllProductPipelineRuns,
  getRecentSyncLogs,
  getConnectionHealth,
} from "@/lib/queries";
import type { Metadata } from "next";
import MeshAtlasLoader from "./MeshAtlasLoader";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "MeshAtlas — Interactive Data Mesh Lineage & Pipeline Health Map",
  description:
    "Explore your enterprise data mesh as a live interactive map. Trace data lineage across domains, monitor pipeline health, inspect data product quality, and understand failure blast radius.",
  alternates: { canonical: "/meshatlas" },
  openGraph: {
    title: "MeshAtlas — Interactive Enterprise Data Mesh Visualization",
    description:
      "Live visualization of data lineage, pipeline health, data products, and governance across 7 domains and 89 data products.",
  },
};

export default function MeshAtlasPage() {
  const graph = getLineageGraph();
  const overview = getMeshOverview();
  const domains = getDomainHealth();
  const apps = getApplicationsWithConnections();
  const products = getDataProducts();
  const policies = getGovernancePolicies();
  const execKpis = getExecKpis();
  const appProductLinks = getAppProductLinks();
  const pipelineStatus = getPipelineStatus();
  const productPipelineStatus = getProductPipelineStatus();
  const productPipelineRuns = getAllProductPipelineRuns();
  const recentSyncLogs = getRecentSyncLogs();
  const connectionHealth = getConnectionHealth();

  return (
    <MeshAtlasLoader
      graph={graph}
      overview={overview}
      domains={domains}
      apps={apps}
      products={products}
      policies={policies}
      execKpis={execKpis}
      appProductLinks={appProductLinks}
      pipelineStatus={pipelineStatus}
      productPipelineStatus={productPipelineStatus}
      productPipelineRuns={productPipelineRuns}
      recentSyncLogs={recentSyncLogs}
      connectionHealth={connectionHealth}
    />
  );
}
