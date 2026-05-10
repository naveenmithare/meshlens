import SemanticClient from "./SemanticClient";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function SemanticPage() {
  return <SemanticClient />;
}
