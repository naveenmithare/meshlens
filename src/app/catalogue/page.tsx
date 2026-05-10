import { getDataProducts, getDomainHealth, getConsumers, getProductLineageSummary } from "@/lib/queries";
import CatalogueClient from "./CatalogueClient";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function CataloguePage() {
  const products = getDataProducts() as any[];
  const domains = getDomainHealth() as any[];
  const consumers = getConsumers() as any[];
  const lineage = getProductLineageSummary();

  return <CatalogueClient products={products} domains={domains} consumers={consumers} lineage={lineage} />;
}
