import type { Metadata } from "next";
import SemanticClient from "./SemanticClient";

export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Semantic Layer — Data Mesh Metadata Schema & Architecture",
  description:
    "Reference metadata schema for enterprise data mesh observability. ERD diagrams, analytical views, domain-driven table design, and an enterprise adoption blueprint.",
  alternates: { canonical: "/semantic" },
  openGraph: {
    title: "MeshLens Semantic Layer — Data Mesh Metadata Schema",
    description:
      "A vendor-agnostic metadata schema for data mesh: domains, products, lineage, governance, and operational health in 14 tables.",
  },
};

export default function SemanticPage() {
  return <SemanticClient />;
}
