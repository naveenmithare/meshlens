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
  return (
    <IntroClient
      overview={getMeshOverview() as Parameters<typeof IntroClient>[0]["overview"]}
      domains={getDomainHealth() as Parameters<typeof IntroClient>[0]["domains"]}
      apps={getApplicationsWithConnections() as Parameters<typeof IntroClient>[0]["apps"]}
      products={getDataProducts() as Parameters<typeof IntroClient>[0]["products"]}
      policies={getGovernancePolicies() as Parameters<typeof IntroClient>[0]["policies"]}
      lineage={getProductLineageSummary() as Parameters<typeof IntroClient>[0]["lineage"]}
    />
  );
}
