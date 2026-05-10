import {
  getDomainHealth,
  getMeshOverview,
  getApplicationsWithConnections,
  getDataProducts,
  getGovernancePolicies,
  getProductLineageSummary,
} from "@/lib/queries";
import IntroClient from "./intro/IntroClient";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function Home() {
  const overview = getMeshOverview() as any;
  const domains = getDomainHealth() as any[];
  const apps = getApplicationsWithConnections() as any[];
  const products = getDataProducts() as any[];
  const policies = getGovernancePolicies() as any[];
  const lineage = getProductLineageSummary();

  return (
    <IntroClient
      overview={overview}
      domains={domains}
      apps={apps}
      products={products}
      policies={policies}
      lineage={lineage}
    />
  );
}
