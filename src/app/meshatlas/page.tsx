import {
  getLineageGraph,
  getMeshOverview,
  getDomainHealth,
  getApplicationsWithConnections,
  getDataProducts,
  getGovernancePolicies,
  getExecKpis,
  getAppProductLinks,
} from "@/lib/queries";
import MeshAtlasClient from "./MeshAtlasClient";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function MeshAtlasPage() {
  const graph = getLineageGraph();
  const overview = getMeshOverview() as any;
  const domains = getDomainHealth() as any[];
  const apps = getApplicationsWithConnections() as any[];
  const products = getDataProducts() as any[];
  const policies = getGovernancePolicies() as any[];
  const execKpis = getExecKpis() as any;
  const appProductLinks = getAppProductLinks();

  return (
    <MeshAtlasClient
      graph={graph}
      overview={overview}
      domains={domains}
      apps={apps}
      products={products}
      policies={policies}
      execKpis={execKpis}
      appProductLinks={appProductLinks}
    />
  );
}
