import {
  getDomainHealth,
  getMeshOverview,
  getApplicationsWithConnections,
  getDataProducts,
  getGovernancePolicies,
  getProductLineageSummary,
} from "@/lib/queries";
import type { Metadata } from "next";
import IntroClient from "./intro/IntroClient";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Enterprise Data Mesh Observability — Introduction",
  description:
    "Understand how enterprise data mesh works: domain ownership, data products, lineage, pipeline health, quality signals, and federated governance explained visually.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MeshLens — Enterprise Data Mesh Observability Introduction",
    description:
      "A visual walkthrough of enterprise data mesh architecture: domains, applications, data products, lineage, and governance.",
  },
};

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
